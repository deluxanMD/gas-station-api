import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@/constants/role.constants';
import { requireAuth } from '@/middlewares/auth.middleware';
import { verifyAccessToken } from '@/services/token.service';
import { httpError } from '@/utils/httpError';

jest.mock('@/services/token.service');

const run = (authorization?: string): { next: jest.Mock; res: Response } => {
  const req = { headers: { authorization } } as Request;
  const res = { locals: {} } as Response;
  const next = jest.fn();
  requireAuth(req, res, next as NextFunction);
  return { next, res };
};

describe('requireAuth', () => {
  it('lets a valid bearer token through and exposes the user', () => {
    const user = { userId: 'alice', userRole: UserRole.Cashier };
    jest.mocked(verifyAccessToken).mockReturnValue(user);

    const { next, res } = run('Bearer good.token');

    expect(verifyAccessToken).toHaveBeenCalledWith('good.token');
    expect(res.locals.user).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  it.each([undefined, '', 'good.token', 'Basic abc', 'Bearer ', 'Bearer    '])(
    'responds 401 when the header is %p',
    (header) => {
      const { next } = run(header);

      expect(verifyAccessToken).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    },
  );

  it('forwards the 401 for an invalid or expired token', () => {
    jest.mocked(verifyAccessToken).mockImplementation(() => {
      throw httpError(401, 'Invalid or expired token');
    });

    const { next } = run('Bearer bad.token');

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
