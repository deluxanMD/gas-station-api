import { Router } from 'express';
import { create, latest } from '@/controllers/scratchTicket.controller';

const router = Router();

router.get('/latest', latest);
router.post('/', create);

export default router;
