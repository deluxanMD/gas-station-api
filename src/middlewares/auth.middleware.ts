import type { NextFunction, Request, Response } from 'express';
import { AuthScheme } from '@/constants/auth.constants';
import { verifyAccessToken } from '@/services/token.service';
import { httpError } from '@/utils/httpError';

/** Rejects requests without a valid `Authorization: Bearer <token>` (401); the verified user is left in `res.locals.user`. */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    const prefix = `${AuthScheme.Bearer} `;
    if (!header?.startsWith(prefix)) {
      throw httpError(401, 'Authentication required');
    }
    const token = header.slice(prefix.length).trim();
    if (!token) throw httpError(401, 'Authentication required');

    res.locals.user = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
