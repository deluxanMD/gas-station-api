import { z } from 'zod';
import { clientTimestamp } from '@/schemas/clientTime.schema';

// Volumes are litres to two decimals.
const volume = z.number().finite().nonnegative().default(0);

export const createFuelDipSchema = z.object({
  shiftId: z.number().int().positive(),
  recordedAt: clientTimestamp.optional(),
  userId: z.number().int().positive(),
  dipAt: z.string().datetime({ offset: true }),
  regularTcVolume: volume,
  regularUllage90: volume,
  premiumTcVolume: volume,
  premiumUllage90: volume,
  dieselTcVolume: volume,
  dieselUllage90: volume,
});

export type CreateFuelDipInput = z.infer<typeof createFuelDipSchema>;
