import type { NextFunction, Request, Response } from 'express';
import { createLottoReportSchema } from '@/schemas/lottoReport.schema';
import { createLottoReport, findLatestDayEndSlip } from '@/services/lottoReport.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createLottoReportSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const report = await createLottoReport(parsed.data);
    res.status(201).json({
      status: 'success',
      data: report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const latest = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      status: 'success',
      data: await findLatestDayEndSlip(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
