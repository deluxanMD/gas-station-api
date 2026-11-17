import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@/constants/role.constants';
import { requireOwnUserId } from '@/middlewares/bodyUser.middleware';
import { findDbUserId } from '@/services/auth.service';

jest.mock('@/services/auth.service');

const run = async (
  body: unknown,
  user: { userId: string; userRole: UserRole; id?: number } = {
    userId: 'alice',
    userRole: UserRole.Cashier,
    id: 7,
  },
  method = 'POST',
): Promise<jest.Mock> => {
  const next = jest.fn();
  await requireOwnUserId(
    { method, body } as Request,
    { locals: { user } } as unknown as Response,
    next as NextFunction,
  );
  return next;
};

describe('requireOwnUserId', () => {
  it('lets a write for the signed-in user through using the id in the token', async () => {
    const next = await run({ userId: 7 });

    expect(findDbUserId).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('responds 403 when the body names another user', async () => {
    const next = await run({ userId: 8 });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('looks the id up for a token issued before ids were added', async () => {
    jest.mocked(findDbUserId).mockResolvedValue(7);

    const next = await run({ userId: 7 }, { userId: 'alice', userRole: UserRole.Cashier });

    expect(findDbUserId).toHaveBeenCalledWith('alice');
    expect(next).toHaveBeenCalledWith();
  });

  it('responds 403 when the user no longer exists', async () => {
    jest.mocked(findDbUserId).mockResolvedValue(null);

    const next = await run({ userId: 7 }, { userId: 'gone', userRole: UserRole.Cashier });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it.each([{}, { shiftIds: [1] }, undefined])('ignores a body without userId: %j', async (body) => {
    const next = await run(body);

    expect(next).toHaveBeenCalledWith();
  });

  it('ignores reads', async () => {
    const next = await run({ userId: 99 }, undefined, 'GET');

    expect(next).toHaveBeenCalledWith();
  });
});
