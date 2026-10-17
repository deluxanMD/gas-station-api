import { Router } from 'express';
import { getHealth, getLiveness, getReadiness } from '@/controllers/health.controller';

const router = Router();

router.get('/', getHealth);
router.get('/ready', getReadiness);
router.get('/live', getLiveness);

export default router;
