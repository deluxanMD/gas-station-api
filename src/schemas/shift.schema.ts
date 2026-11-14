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

export const consolidatedShiftsSchema = z.object({
  shiftIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(100)
    // Repeated ids would otherwise be summed twice.
    .transform((ids) => [...new Set(ids)]),
});
