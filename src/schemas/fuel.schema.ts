import { z } from 'zod';
import { clientTimestamp } from '@/schemas/clientTime.schema';
import { FuelType } from '@/constants/fuel.constants';

// Volumes are litres and totals are dollars, both to two decimals.
const amount = z.number().finite().nonnegative().default(0);

export const createFuelSchema = z
  .object({
    shiftId: z.number().int().positive(),
    recordedAt: clientTimestamp.optional(),
    userId: z.number().int().positive(),
    biodieselVolume: amount,
    biodieselTotal: amount,
    reg87Volume: amount,
    reg87Total: amount,
    extra89Volume: amount,
    extra89Total: amount,
    supr91Volume: amount,
    supr91Total: amount,
    plus93Volume: amount,
    plus93Total: amount,
    totalVolume: amount,
  })
  .superRefine((input, ctx) => {
    const gradeVolumes: Record<FuelType, number> = {
      [FuelType.Biodiesel]: input.biodieselVolume,
      [FuelType.Reg87]: input.reg87Volume,
      [FuelType.Extra89]: input.extra89Volume,
      [FuelType.Supr91]: input.supr91Volume,
      [FuelType.Plus93]: input.plus93Volume,
    };
    // Compared in hundredths so floating point noise cannot fail a correct total.
    const toHundredths = (value: number): number => Math.round(value * 100);
    const sum = Object.values(gradeVolumes).reduce((total, v) => total + toHundredths(v), 0);
    if (sum !== toHundredths(input.totalVolume)) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalVolume'],
        message: 'Total volume must equal the sum of the grade volumes',
      });
    }
  });

export type CreateFuelInput = z.infer<typeof createFuelSchema>;
