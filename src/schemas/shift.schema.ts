import { z } from 'zod';
import { USER_ID_MAX_LENGTH, USER_ID_MIN_LENGTH } from '@/constants/auth.constants';

export const createShiftSchema = z.object({
  userId: z.string().trim().min(USER_ID_MIN_LENGTH).max(USER_ID_MAX_LENGTH),
});

export const shiftIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
