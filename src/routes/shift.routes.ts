import { Router } from 'express';
import { create, getById } from '@/controllers/shift.controller';

const router = Router();

router.post('/', create);
router.get('/:id', getById);

export default router;
