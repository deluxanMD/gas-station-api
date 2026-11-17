import { z } from 'zod';
import { clientTimestamp } from '@/schemas/clientTime.schema';

const amount = z.number().finite().default(0);

export const createDailySummaryReportSchema = z.object({
  shiftId: z.number().int().positive(),
  recordedAt: clientTimestamp.optional(),
  userId: z.number().int().positive(),
  endDate: z.string().datetime({ offset: true }),
  fuelSales: amount,
  itemSales: amount,
  gst: amount,
  hst: amount,
  pennyRounding: amount,
  totalSales: amount,
});

export type CreateDailySummaryReportInput = z.infer<typeof createDailySummaryReportSchema>;
