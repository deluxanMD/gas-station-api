import { z } from 'zod';

const userIdSchema = z.string().trim().min(3).max(50);
const passwordSchema = z.string().min(6).max(128);

export const registerSchema = z
  .object({
    userId: userIdSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  userId: userIdSchema,
  password: z.string().min(1),
});
