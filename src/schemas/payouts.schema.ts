import { z } from 'zod';
import { clientTimestamp } from '@/schemas/clientTime.schema';

const amount = z.number().finite().default(0);

export const createPayoutsSchema = z.object({
  shiftId: z.number().int().positive(),
  recordedAt: clientTimestamp.optional(),
  userId: z.number().int().positive(),
  totalPos: amount,
  lottoPayout: amount,
  vendorPayout: amount,
  ownerPayout: amount,
  miscPayout: amount,
  lottoWinner: amount,
  giftCertificates: amount,
  redemptions: amount,
  safedrops: amount,
  cashOnHand: amount,
});

export type CreatePayoutsInput = z.infer<typeof createPayoutsSchema>;
