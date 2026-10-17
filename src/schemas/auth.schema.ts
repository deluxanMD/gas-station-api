import { z } from 'zod';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  UPDATED_BY_MAX_LENGTH,
  USER_ID_MAX_LENGTH,
  USER_ID_MIN_LENGTH,
} from '@/constants/auth.constants';

const userIdSchema = z.string().trim().min(USER_ID_MIN_LENGTH).max(USER_ID_MAX_LENGTH);
const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

export const registerSchema = z
  .object({
    userId: userIdSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    updatedAt: z.string().datetime({ offset: true }).nullish(),
    updatedBy: z.string().trim().min(1).max(UPDATED_BY_MAX_LENGTH).nullish(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  userId: userIdSchema,
  password: z.string().min(1),
});
