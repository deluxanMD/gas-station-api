import type { NextFunction, Request, Response } from 'express';
import { createLottoReconciliationSchema } from '@/schemas/lottoReconciliation.schema';
import { createLottoReconciliation } from '@/services/lottoReconciliation.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createLottoReconciliationSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const reconciliation = await createLottoReconciliation(parsed.data);
    res.status(201).json({
      status: 'success',
      data: reconciliation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
