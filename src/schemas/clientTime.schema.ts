import { z } from 'zod';
import { CLIENT_TIME_MAX_AGE_MS, CLIENT_TIME_MAX_FUTURE_SKEW_MS } from '@/constants/sync.constants';

/** An ISO 8601 instant recorded on a client device: not meaningfully in the future and not older than the sync window. */
export const clientTimestamp = z
  .string()
  .datetime({ offset: true })
  .refine((value) => {
    const time = Date.parse(value);
    const now = Date.now();
    return time <= now + CLIENT_TIME_MAX_FUTURE_SKEW_MS && time >= now - CLIENT_TIME_MAX_AGE_MS;
  }, 'Time is outside the accepted range');
