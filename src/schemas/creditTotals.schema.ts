import { z } from 'zod';

const amount = z.number().finite().default(0);

export const createCreditTotalsSchema = z.object({
  shiftId: z.number().int().positive(),
  userId: z.number().int().positive(),
  creditTerminal: amount,
  creditTotal: amount,
  debitTerminal: amount,
  fleet: amount,
  svRedemption: amount,
});

export type CreateCreditTotalsInput = z.infer<typeof createCreditTotalsSchema>;
