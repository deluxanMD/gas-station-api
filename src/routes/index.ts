import { Router } from 'express';
import authRouter from './auth.routes';
import creditTotalsRouter from './creditTotals.routes';
import healthRouter from './health.routes';
import shiftRouter from './shift.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/shifts', shiftRouter);
router.use('/credit-totals', creditTotalsRouter);

export default router;
