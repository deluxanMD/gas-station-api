import type { NextFunction, Request, Response } from 'express';
import { createCreditTotalsSchema } from '@/schemas/creditTotals.schema';
import { createCreditTotals } from '@/services/creditTotals.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createCreditTotalsSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const creditTotals = await createCreditTotals(parsed.data);
    res.status(201).json({
      status: 'success',
      data: creditTotals,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
