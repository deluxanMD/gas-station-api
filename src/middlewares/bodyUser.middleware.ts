import type { NextFunction, Request, Response } from 'express';
import { findDbUserId } from '@/services/auth.service';
import type { AuthenticatedUser } from '@/types/auth.types';
import { httpError } from '@/utils/httpError';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * A write that names a `userId` in its body may only name the signed-in user: records are attributed to their author, and
 * a queued offline write is replayed under the author's own token. Must run after `requireAuth`.
 */
export const requireOwnUserId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body: unknown = req.body;
    if (!WRITE_METHODS.has(req.method) || typeof body !== 'object' || body === null) {
      next();
      return;
    }
    const claimed = (body as { userId?: unknown }).userId;
    if (claimed === undefined) {
      next();
      return;
    }

    const user = res.locals.user as AuthenticatedUser;
    const ownId = user.id ?? (await findDbUserId(user.userId));
    if (ownId === null || claimed !== ownId) {
      throw httpError(403, 'userId does not match the signed-in user');
    }
    next();
  } catch (error) {
    next(error);
  }
};
