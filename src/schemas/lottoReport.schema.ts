import { z } from 'zod';
import { clientTimestamp } from '@/schemas/clientTime.schema';
import { LOTTO_AMOUNT_FIELDS, LottoSlipType } from '@/constants/lottoReport.constants';
import type { LottoAmountField } from '@/types/lottoReport.types';

// Whole cents; a blank cell on the form arrives as 0.
const cents = z.number().int().default(0);

const amounts = z.object(
  Object.fromEntries(LOTTO_AMOUNT_FIELDS.map(({ field }) => [field, cents])) as Record<
    LottoAmountField,
    typeof cents
  >,
);

const slip = z.object({
  slipType: z.nativeEnum(LottoSlipType),
  reportDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .nullable()
    .default(null),
  reportTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm')
    .nullable()
    .default(null),
  amounts,
});

export const createLottoReportSchema = z
  .object({
    shiftId: z.number().int().positive(),
    recordedAt: clientTimestamp.optional(),
    userId: z.number().int().positive(),
    slips: z.array(slip),
  })
  .superRefine((input, ctx) => {
    const types = input.slips.map((s) => s.slipType).sort();
    const expected = Object.values(LottoSlipType).sort();
    if (types.length !== expected.length || types.some((type, i) => type !== expected[i])) {
      ctx.addIssue({
        code: 'custom',
        path: ['slips'],
        message: `Slips must cover each of ${expected.join(', ')} exactly once`,
      });
    }
  });

export type CreateLottoReportInput = z.infer<typeof createLottoReportSchema>;
