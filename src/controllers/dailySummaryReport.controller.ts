import type { NextFunction, Request, Response } from 'express';
import { createDailySummaryReportSchema } from '@/schemas/dailySummaryReport.schema';
import { createDailySummaryReport } from '@/services/dailySummaryReport.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createDailySummaryReportSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const report = await createDailySummaryReport(parsed.data);
    res.status(201).json({
      status: 'success',
      data: report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
