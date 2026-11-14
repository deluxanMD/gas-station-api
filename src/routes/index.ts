import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth.middleware';
import authRouter from './auth.routes';
import creditTotalsRouter from './creditTotals.routes';
import dailySummaryReportRouter from './dailySummaryReport.routes';
import fuelDipRouter from './fuelDip.routes';
import fuelRouter from './fuel.routes';
import fuelDeliveryRouter from './fuelDelivery.routes';
import healthRouter from './health.routes';
import payoutsRouter from './payouts.routes';
import scratchTicketRouter from './scratchTicket.routes';
import shiftRouter from './shift.routes';

const router = Router();

// Health and auth stay public; everything below needs a bearer token.
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/shifts', requireAuth, shiftRouter);
router.use('/credit-totals', requireAuth, creditTotalsRouter);
router.use('/daily-summary-reports', requireAuth, dailySummaryReportRouter);
router.use('/fuel', requireAuth, fuelRouter);
router.use('/fuel-deliveries', requireAuth, fuelDeliveryRouter);
router.use('/fuel-dips', requireAuth, fuelDipRouter);
router.use('/payouts', requireAuth, payoutsRouter);
router.use('/scratch-tickets', requireAuth, scratchTicketRouter);

export default router;
