import { Router } from 'express';
import authRouter from './auth.routes';
import creditTotalsRouter from './creditTotals.routes';
import dailySummaryReportRouter from './dailySummaryReport.routes';
import healthRouter from './health.routes';
import payoutsRouter from './payouts.routes';
import shiftRouter from './shift.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/shifts', shiftRouter);
router.use('/credit-totals', creditTotalsRouter);
router.use('/daily-summary-reports', dailySummaryReportRouter);
router.use('/payouts', payoutsRouter);

export default router;
