import { z } from 'zod';
import { clientTimestamp } from '@/schemas/clientTime.schema';

export const syncChangesQuerySchema = z.object({
  since: clientTimestamp,
});
