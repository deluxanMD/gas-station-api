import type { NextFunction, Request, Response } from 'express';
import { resolveShiftClientId } from '@/middlewares/shiftClientId.middleware';
import { getShiftIdByClientId } from '@/services/shift.service';
import { httpError } from '@/utils/httpError';

jest.mock('@/services/shift.service');

const CLIENT_ID = '3f2b8c1e-6d4a-4b7e-9a10-5c2d8e7f1a90';

const run = async (body: unknown): Promise<{ next: jest.Mock; body: unknown }> => {
  const req = { body } as Request;
  const next = jest.fn();
  await resolveShiftClientId(req, {} as Response, next as NextFunction);
  return { next, body: req.body };
};

describe('resolveShiftClientId', () => {
  it('leaves a body without shiftClientId alone', async () => {
    const { next, body } = await run({ shiftId: 3 });

    expect(getShiftIdByClientId).not.toHaveBeenCalled();
    expect(body).toEqual({ shiftId: 3 });
    expect(next).toHaveBeenCalledWith();
  });

  it('fills in shiftId from the client id', async () => {
    jest.mocked(getShiftIdByClientId).mockResolvedValue(42);

    const { next, body } = await run({ shiftClientId: CLIENT_ID, userId: 7 });

    expect(body).toMatchObject({ shiftId: 42, userId: 7 });
    expect(next).toHaveBeenCalledWith();
  });

  it('accepts a shiftId that agrees', async () => {
    jest.mocked(getShiftIdByClientId).mockResolvedValue(42);

    const { next } = await run({ shiftClientId: CLIENT_ID, shiftId: 42 });

    expect(next).toHaveBeenCalledWith();
  });

  it('responds 400 when shiftId disagrees', async () => {
    jest.mocked(getShiftIdByClientId).mockResolvedValue(42);

    const { next } = await run({ shiftClientId: CLIENT_ID, shiftId: 5 });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('responds 400 for a malformed client id', async () => {
    const { next } = await run({ shiftClientId: 'nope' });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('forwards the 404 for an unknown client id', async () => {
    jest.mocked(getShiftIdByClientId).mockRejectedValue(httpError(404, 'Shift not found'));

    const { next } = await run({ shiftClientId: CLIENT_ID });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
