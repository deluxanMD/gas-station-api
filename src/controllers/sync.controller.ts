import type { NextFunction, Request, Response } from 'express';
import { syncChangesQuerySchema } from '@/schemas/sync.schema';
import { getShiftChanges } from '@/services/shift.service';
import { validationError } from '@/utils/validationError';

export const changes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = syncChangesQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError(parsed.error);

    const data = await getShiftChanges(parsed.data.since);
    res.status(200).json({
      status: 'success',
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
