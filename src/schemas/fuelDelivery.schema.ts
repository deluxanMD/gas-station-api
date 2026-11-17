import { z } from 'zod';
import { clientTimestamp } from '@/schemas/clientTime.schema';

// Volumes are litres to two decimals.
const volume = z.number().finite().nonnegative().default(0);

export const createFuelDeliverySchema = z
  .object({
    shiftId: z.number().int().positive(),
    recordedAt: clientTimestamp.optional(),
    userId: z.number().int().positive(),
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    bolNumber: z.string().trim().min(1).max(50),
    reg: volume,
    prem: volume,
    diesel: volume,
    total: volume,
  })
  .superRefine((input, ctx) => {
    // Compared in hundredths so floating point noise cannot fail a correct total.
    const toHundredths = (value: number): number => Math.round(value * 100);
    const sum = toHundredths(input.reg) + toHundredths(input.prem) + toHundredths(input.diesel);
    if (sum !== toHundredths(input.total)) {
      ctx.addIssue({
        code: 'custom',
        path: ['total'],
        message: 'Total must equal reg + prem + diesel',
      });
    }
  });

export type CreateFuelDeliveryInput = z.infer<typeof createFuelDeliverySchema>;
