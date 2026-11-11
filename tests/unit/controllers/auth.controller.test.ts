import type { NextFunction, Request, Response } from 'express';
import { login } from '@/controllers/auth.controller';
import { verifyUser } from '@/services/auth.service';
import { createShift } from '@/services/shift.service';
import { signAccessToken } from '@/services/token.service';

jest.mock('@/services/auth.service');
jest.mock('@/services/shift.service');
jest.mock('@/services/token.service');

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller - login', () => {
  it('returns the token, user id, role and shift id on valid credentials', async () => {
    jest.mocked(verifyUser).mockResolvedValue({ id: 7, userId: 'alice', userRole: 'MANAGER' });
    jest.mocked(createShift).mockResolvedValue({
      shift: { id: 42, userId: 7, startTime: '2026-01-01T00:00:00.000Z', endTime: null },
      created: true,
    });
    jest.mocked(signAccessToken).mockReturnValue('signed.jwt.token');
    const req = { body: { userId: 'alice', password: 'secret1' } } as Request;
    const res = mockResponse();

    await login(req, res, jest.fn());

    expect(createShift).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        data: { token: 'signed.jwt.token', userId: 'alice', userRole: 'MANAGER', shiftId: 42 },
      }),
    );
  });

  it('responds 401 and issues no token on invalid credentials', async () => {
    jest.mocked(verifyUser).mockResolvedValue(null);
    const req = { body: { userId: 'alice', password: 'wrong' } } as Request;
    const res = mockResponse();
    const next: NextFunction = jest.fn();

    await login(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(signAccessToken).not.toHaveBeenCalled();
    expect(createShift).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
