import type { NextFunction, Request, Response } from 'express';
import { createScratchTicketReportSchema } from '@/schemas/scratchTicket.schema';
import {
  createScratchTicketReport,
  findLatestScratchTicketReport,
} from '@/services/scratchTicket.service';
import { validationError } from '@/utils/validationError';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createScratchTicketReportSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const report = await createScratchTicketReport(parsed.data);
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
      data: await findLatestScratchTicketReport(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
