import { Router } from 'express';
import { create } from '@/controllers/payouts.controller';

const router = Router();

router.post('/', create);

export default router;
