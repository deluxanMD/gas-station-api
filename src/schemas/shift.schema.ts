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
