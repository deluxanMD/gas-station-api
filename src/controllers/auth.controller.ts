import type { NextFunction, Request, Response } from 'express';
import { loginSchema, refreshSchema, registerSchema } from '@/schemas/auth.schema';
import { registerUser, verifyUser } from '@/services/auth.service';
import {
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from '@/services/refreshToken.service';
import { signAccessToken } from '@/services/token.service';
import { httpError } from '@/utils/httpError';
import { validationError } from '@/utils/validationError';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    await registerUser(parsed.data);
    res.status(201).json({
      status: 'success',
      data: { userId: parsed.data.userId, userRole: parsed.data.userRole },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const user = await verifyUser(parsed.data.userId, parsed.data.password);
    if (!user) throw httpError(401, 'Invalid user ID or password');

    res.status(200).json({
      status: 'success',
      data: {
        token: signAccessToken(user),
        refreshToken: await issueRefreshToken(user.id),
        id: user.id,
        userId: user.userId,
        userRole: user.userRole,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Trades a refresh token for a new access token and the next refresh token.
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const { user, refreshToken } = await rotateRefreshToken(parsed.data.refreshToken);
    res.status(200).json({
      status: 'success',
      data: {
        token: signAccessToken(user),
        refreshToken,
        id: user.id,
        userId: user.userId,
        userRole: user.userRole,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    await revokeRefreshToken(parsed.data.refreshToken);
    res.status(200).json({
      status: 'success',
      data: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
