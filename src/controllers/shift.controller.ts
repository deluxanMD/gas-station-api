import type { NextFunction, Request, Response } from 'express';
import {
  consolidatedShiftsSchema,
  createShiftSchema,
  currentShiftQuerySchema,
  listShiftsQuerySchema,
  shiftIdParamSchema,
} from '@/schemas/shift.schema';
import {
  closeShift,
  consolidateShifts,
  createShift,
  getShiftsForDay,
  getCurrentShift,
  getShiftById,
} from '@/services/shift.service';
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

export const getCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = currentShiftQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError(parsed.error);

    const shift = await getCurrentShift(parsed.data.userId);
    res.status(200).json({
      status: 'success',
      data: shift,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const listShifts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = listShiftsQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError(parsed.error);

    const shifts = await getShiftsForDay(parsed.data);
    res.status(200).json({
      status: 'success',
      data: shifts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const consolidated = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = consolidatedShiftsSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const data = await consolidateShifts(parsed.data.shiftIds);
    res.status(200).json({
      status: 'success',
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = shiftIdParamSchema.safeParse(req.params);
    if (!parsed.success) throw validationError(parsed.error);

    const shift = await closeShift(parsed.data.id);
    res.status(200).json({
      status: 'success',
      data: shift,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
