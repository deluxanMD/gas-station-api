import { Router } from 'express';
import authRouter from './auth.routes';
import healthRouter from './health.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);

export default router;
