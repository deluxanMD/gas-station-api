import { Router } from 'express';
import { create } from '@/controllers/lottoReconciliation.controller';

const router = Router();

router.post('/', create);

export default router;
