import { z } from 'zod';
import { clientTimestamp } from '@/schemas/clientTime.schema';
import { LossAttribution } from '@/constants/lottoReconciliation.constants';

// Whole cents.
const cents = z.number().int();
const nonNegativeCents = cents.nonnegative();

export const createLottoReconciliationSchema = z
  .object({
    shiftId: z.number().int().positive(),
    recordedAt: clientTimestamp.optional(),
    userId: z.number().int().positive(),
    bullock: nonNegativeCents,
    bullPayouts: nonNegativeCents,
    bullLottoWinner: nonNegativeCents,
    lottoNet: cents,
    redeemNet: cents,
    activationsNet: cents,
    cashNet: cents,
    total: cents,
    // Left out to continue without attributing; it is due within 3 days.
    attribution: z.nativeEnum(LossAttribution).nullable().default(null),
  })
  .superRefine((input, ctx) => {
    const sum = input.lottoNet + input.redeemNet + input.activationsNet + input.cashNet;
    if (sum !== input.total) {
      ctx.addIssue({
        code: 'custom',
        path: ['total'],
        message: 'Total must equal lotto net + redeem net + activations net + cash net',
      });
    }
  });

export type CreateLottoReconciliationInput = z.infer<typeof createLottoReconciliationSchema>;
