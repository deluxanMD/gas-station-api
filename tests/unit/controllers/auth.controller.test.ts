import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@/constants/role.constants';
import { login, logout, refresh } from '@/controllers/auth.controller';
import { verifyUser } from '@/services/auth.service';
import {
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from '@/services/refreshToken.service';
import { signAccessToken } from '@/services/token.service';

jest.mock('@/services/auth.service');
jest.mock('@/services/token.service');
jest.mock('@/services/refreshToken.service');

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller - login', () => {
  it('returns the token, ids and role on valid credentials', async () => {
    jest
      .mocked(verifyUser)
      .mockResolvedValue({ id: 7, userId: 'alice', userRole: UserRole.Manager });
    jest.mocked(signAccessToken).mockReturnValue('signed.jwt.token');
    jest.mocked(issueRefreshToken).mockResolvedValue('refresh-token-value');
    const req = { body: { userId: 'alice', password: 'secret1' } } as Request;
    const res = mockResponse();

    await login(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        data: {
          token: 'signed.jwt.token',
          refreshToken: 'refresh-token-value',
          id: 7,
          userId: 'alice',
          userRole: UserRole.Manager,
        },
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
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('Auth Controller - refresh and logout', () => {
  const token = 'a'.repeat(43);

  it('returns a new token pair', async () => {
    jest.mocked(rotateRefreshToken).mockResolvedValue({
      user: { id: 7, userId: 'alice', userRole: UserRole.Cashier },
      refreshToken: 'next-refresh',
    });
    jest.mocked(signAccessToken).mockReturnValue('new.jwt');
    const res = mockResponse();

    await refresh({ body: { refreshToken: token } } as Request, res, jest.fn());

    expect(rotateRefreshToken).toHaveBeenCalledWith(token);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ token: 'new.jwt', refreshToken: 'next-refresh', id: 7 }),
      }),
    );
  });

  it('forwards the 401 for a bad refresh token', async () => {
    jest
      .mocked(rotateRefreshToken)
      .mockRejectedValue(Object.assign(new Error('Invalid'), { statusCode: 401 }));
    const next: NextFunction = jest.fn();

    await refresh({ body: { refreshToken: token } } as Request, mockResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('responds 400 for a missing refresh token', async () => {
    const next: NextFunction = jest.fn();

    await refresh({ body: {} } as Request, mockResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('revokes the token on logout', async () => {
    const res = mockResponse();

    await logout({ body: { refreshToken: token } } as Request, res, jest.fn());

    expect(revokeRefreshToken).toHaveBeenCalledWith(token);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
