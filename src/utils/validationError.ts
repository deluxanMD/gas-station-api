import type { z } from 'zod';
import { httpError } from '@/utils/httpError';

export const validationError = (error: z.ZodError): Error =>
  httpError(400, error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
