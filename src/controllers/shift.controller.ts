import type { NextFunction, Request, Response } from 'express';
import { createShiftSchema, shiftIdParamSchema } from '@/schemas/shift.schema';
import { createShift, getShiftById } from '@/services/shift.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createShiftSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const { shift, created } = await createShift(parsed.data.userId);
    res.status(created ? 201 : 200).json({
      status: 'success',
      data: shift,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = shiftIdParamSchema.safeParse(req.params);
    if (!parsed.success) throw validationError(parsed.error);

    const shift = await getShiftById(parsed.data.id);
    res.status(200).json({
      status: 'success',
      data: shift,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
