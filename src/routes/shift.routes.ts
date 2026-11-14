import { Router } from 'express';
import {
  close,
  consolidated,
  create,
  getById,
  getCurrent,
  listShifts,
} from '@/controllers/shift.controller';

const router = Router();

router.post('/', create);
router.get('/', listShifts);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.post('/consolidated', consolidated);
router.post('/:id/close', close);

export default router;
