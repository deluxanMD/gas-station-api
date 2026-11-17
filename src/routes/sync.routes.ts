import { Router } from 'express';
import { changes } from '@/controllers/sync.controller';

const router = Router();

router.get('/changes', changes);

export default router;
