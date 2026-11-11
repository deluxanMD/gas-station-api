import { Router } from 'express';
import authRouter from './auth.routes';
import healthRouter from './health.routes';
import shiftRouter from './shift.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/shifts', shiftRouter);

export default router;
