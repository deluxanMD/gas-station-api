import type { NextFunction, Request, Response } from 'express';
import { createPayoutsSchema } from '@/schemas/payouts.schema';
import { createPayouts } from '@/services/payouts.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createPayoutsSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const payouts = await createPayouts(parsed.data);
    res.status(201).json({
      status: 'success',
      data: payouts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
