import type { NextFunction, Request, Response } from 'express';
import { shiftClientIdSchema } from '@/schemas/shift.schema';
import { getShiftIdByClientId } from '@/services/shift.service';
import { httpError } from '@/utils/httpError';
import { validationError } from '@/utils/validationError';

/**
 * Lets a device that started a shift offline refer to it by its own `shiftClientId` before it knows the server id:
 * the body gets the matching `shiftId`, so controllers and schemas stay unchanged. Bodies without it pass through.
 */
export const resolveShiftClientId = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null || !('shiftClientId' in body)) {
      next();
      return;
    }

    const parsed = shiftClientIdSchema.safeParse(body.shiftClientId);
    if (!parsed.success) throw validationError(parsed.error);

    const shiftId = await getShiftIdByClientId(parsed.data);
    const given = (body as { shiftId?: unknown }).shiftId;
    if (given !== undefined && given !== shiftId) {
      throw httpError(400, 'shiftId does not match shiftClientId');
    }
    (body as { shiftId?: unknown }).shiftId = shiftId;
    next();
  } catch (error) {
    next(error);
  }
};
