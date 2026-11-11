import type { NextFunction, Request, Response } from 'express';
import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import { registerUser, verifyUser } from '@/services/auth.service';
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

    const valid = await verifyUser(parsed.data.userId, parsed.data.password);
    if (!valid) throw httpError(401, 'Invalid user ID or password');

    res.status(200).json({
      status: 'success',
      data: { userId: parsed.data.userId },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
