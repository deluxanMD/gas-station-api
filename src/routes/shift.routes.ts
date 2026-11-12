import { Router } from 'express';
import { close, create, getById, getCurrent } from '@/controllers/shift.controller';

const router = Router();

router.post('/', create);
// Must stay above '/:id' or "current" is parsed as a shift id.
router.get('/current', getCurrent);
router.get('/:id', getById);
router.post('/:id/close', close);

export default router;
