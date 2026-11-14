import { UserRole } from '@/constants/role.constants';
import { z } from 'zod';

export const createShiftSchema = z.object({
  userId: z.number().int().positive(),
});

export const shiftIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const currentShiftQuerySchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const listShiftsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date')
    .optional(),
  role: z.nativeEnum(UserRole).optional(),
});
