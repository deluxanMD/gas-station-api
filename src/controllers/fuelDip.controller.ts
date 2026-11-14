import type { NextFunction, Request, Response } from 'express';
import { createFuelDipSchema } from '@/schemas/fuelDip.schema';
import { createFuelDip } from '@/services/fuelDip.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createFuelDipSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const dip = await createFuelDip(parsed.data);
    res.status(201).json({
      status: 'success',
      data: dip,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
