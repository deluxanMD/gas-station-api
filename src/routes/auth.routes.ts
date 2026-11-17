import { Router } from 'express';
import { login, logout, refresh, register } from '@/controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
// The refresh token is the credential here, so these stay public.
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
