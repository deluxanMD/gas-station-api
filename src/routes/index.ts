import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth.middleware';
import { idempotency } from '@/middlewares/idempotency.middleware';
import { requireOwnUserId } from '@/middlewares/bodyUser.middleware';
import { resolveShiftClientId } from '@/middlewares/shiftClientId.middleware';
import authRouter from './auth.routes';
import creditTotalsRouter from './creditTotals.routes';
import dailySummaryReportRouter from './dailySummaryReport.routes';
import fuelDipRouter from './fuelDip.routes';
import fuelRouter from './fuel.routes';
import fuelDeliveryRouter from './fuelDelivery.routes';
import healthRouter from './health.routes';
import lottoReconciliationRouter from './lottoReconciliation.routes';
import lottoReportRouter from './lottoReport.routes';
import payoutsRouter from './payouts.routes';
import scratchTicketRouter from './scratchTicket.routes';
import shiftRouter from './shift.routes';
import syncRouter from './sync.routes';

const router = Router();

// Authenticated writes are attributed to the signed-in user and can be retried safely with an Idempotency-Key.
const secured = [requireAuth, requireOwnUserId, idempotency];
// Records that belong to a shift may name it by the client id its device gave it.
const shiftRecord = [...secured, resolveShiftClientId];

// Health and auth stay public; everything below needs a bearer token.
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/shifts', ...secured, shiftRouter);
router.use('/credit-totals', ...shiftRecord, creditTotalsRouter);
router.use('/daily-summary-reports', ...shiftRecord, dailySummaryReportRouter);
router.use('/fuel', ...shiftRecord, fuelRouter);
router.use('/fuel-deliveries', ...shiftRecord, fuelDeliveryRouter);
router.use('/fuel-dips', ...shiftRecord, fuelDipRouter);
router.use('/lotto-reconciliations', ...shiftRecord, lottoReconciliationRouter);
router.use('/lotto-reports', ...shiftRecord, lottoReportRouter);
router.use('/payouts', ...shiftRecord, payoutsRouter);
router.use('/scratch-tickets', ...secured, scratchTicketRouter);
router.use('/sync', ...secured, syncRouter);

export default router;
