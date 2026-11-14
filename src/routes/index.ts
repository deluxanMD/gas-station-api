import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth.middleware';
import authRouter from './auth.routes';
import creditTotalsRouter from './creditTotals.routes';
import dailySummaryReportRouter from './dailySummaryReport.routes';
import healthRouter from './health.routes';
import payoutsRouter from './payouts.routes';
import shiftRouter from './shift.routes';

const router = Router();

// Health and auth stay public; everything below needs a bearer token.
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/shifts', requireAuth, shiftRouter);
router.use('/credit-totals', requireAuth, creditTotalsRouter);
router.use('/daily-summary-reports', requireAuth, dailySummaryReportRouter);
router.use('/payouts', requireAuth, payoutsRouter);

export default router;
