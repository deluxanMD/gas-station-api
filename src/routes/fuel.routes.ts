import { Router } from 'express';
import { create } from '@/controllers/fuel.controller';

const router = Router();

router.post('/', create);

export default router;
