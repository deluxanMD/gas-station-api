import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  IDEMPOTENCY_IN_PROGRESS_RETRY_AFTER_SECONDS,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_KEY_MAX_LENGTH,
  IDEMPOTENCY_KEY_PATTERN,
  IDEMPOTENCY_REPLAY_HEADER,
} from '@/constants/sync.constants';
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  releaseIdempotentRequest,
} from '@/services/idempotency.service';
import type { AuthenticatedUser } from '@/types/auth.types';
import { httpError } from '@/utils/httpError';
import { logger } from '@/utils/logger';
import { validationError } from '@/utils/validationError';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const keySchema = z.string().min(1).max(IDEMPOTENCY_KEY_MAX_LENGTH).regex(IDEMPOTENCY_KEY_PATTERN);

const hashRequest = (req: Request): string =>
  createHash('sha256')
    .update(`${req.method} ${req.originalUrl}\n${JSON.stringify(req.body ?? null)}`)
    .digest('hex');

/**
 * Makes a write retry-safe when the client sends an `Idempotency-Key` header: the first successful answer is stored and
 * replayed for any retry with the same key. Without the header the request passes through untouched. Must run after
 * `requireAuth`, because keys are scoped to the caller. A crash between the write and storing the answer is covered by
 * the tables' unique indexes (the retry gets a 409).
 */
export const idempotency = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.header(IDEMPOTENCY_KEY_HEADER);
    if (header === undefined || !WRITE_METHODS.has(req.method)) {
      next();
      return;
    }

    const parsedKey = keySchema.safeParse(header.trim());
    if (!parsedKey.success) throw validationError(parsedKey.error);
    const key = parsedKey.data;

    const user = res.locals.user as AuthenticatedUser | undefined;
    if (!user) throw httpError(401, 'Authentication required');

    const outcome = await beginIdempotentRequest({
      userId: user.userId,
      key,
      requestHash: hashRequest(req),
      method: req.method,
      path: req.originalUrl,
    });

    if (outcome.state === 'replay') {
      res.setHeader(IDEMPOTENCY_REPLAY_HEADER, 'true');
      res.status(outcome.statusCode).json(outcome.body);
      return;
    }
    if (outcome.state === 'mismatch') {
      throw httpError(422, 'Idempotency key was already used for a different request');
    }
    if (outcome.state === 'in-progress') {
      // 503 rather than 409: clients treat 409 as "already saved", which is not known yet.
      res.setHeader('Retry-After', String(IDEMPOTENCY_IN_PROGRESS_RETRY_AFTER_SECONDS));
      throw httpError(503, 'The original request is still being processed');
    }

    let captured: unknown;
    const send = res.json.bind(res);
    res.json = (body: unknown): Response => {
      captured = body;
      return send(body);
    };
    res.on('close', () => {
      const succeeded = res.statusCode >= 200 && res.statusCode < 300 && captured !== undefined;
      const settle = succeeded
        ? completeIdempotentRequest(user.userId, key, res.statusCode, captured)
        : releaseIdempotentRequest(user.userId, key);
      settle.catch((error: unknown) => {
        logger.warn('Could not settle idempotency key', {
          message: error instanceof Error ? error.message : String(error),
        });
      });
    });

    next();
  } catch (error) {
    next(error);
  }
};
