import { z } from 'zod';

// Volumes are litres to two decimals.
const volume = z.number().finite().nonnegative().default(0);

export const createFuelDipSchema = z.object({
  shiftId: z.number().int().positive(),
  userId: z.number().int().positive(),
  dipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  dipTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm (24-hour)'),
  regularTcVolume: volume,
  regularUllage90: volume,
  premiumTcVolume: volume,
  premiumUllage90: volume,
  dieselTcVolume: volume,
  dieselUllage90: volume,
});

export type CreateFuelDipInput = z.infer<typeof createFuelDipSchema>;
