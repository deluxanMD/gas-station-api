import type { NextFunction, Request, Response } from 'express';
import { createFuelDeliverySchema } from '@/schemas/fuelDelivery.schema';
import { createFuelDelivery } from '@/services/fuelDelivery.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createFuelDeliverySchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const delivery = await createFuelDelivery(parsed.data);
    res.status(201).json({
      status: 'success',
      data: delivery,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
