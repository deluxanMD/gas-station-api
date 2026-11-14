import type { NextFunction, Request, Response } from 'express';
import { createFuelSchema } from '@/schemas/fuel.schema';
import { createFuel } from '@/services/fuel.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createFuelSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const fuel = await createFuel(parsed.data);
    res.status(201).json({
      status: 'success',
      data: fuel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
