import { Router } from 'express';
import { create } from '@/controllers/fuelDip.controller';

const router = Router();

router.post('/', create);

export default router;
