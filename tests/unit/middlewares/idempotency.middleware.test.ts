import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@/constants/role.constants';
import { idempotency } from '@/middlewares/idempotency.middleware';
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  releaseIdempotentRequest,
} from '@/services/idempotency.service';

jest.mock('@/services/idempotency.service');

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const setup = (
  headers: Record<string, string>,
  method = 'POST',
): { req: Request; res: Response & EventEmitter; next: jest.Mock } => {
  const req = {
    method,
    originalUrl: '/api/v1/payouts',
    body: { shiftId: 1 },
    header: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
  const res = Object.assign(new EventEmitter(), {
    locals: { user: { userId: 'alice', userRole: UserRole.Cashier } },
    statusCode: 200,
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  }) as unknown as Response & EventEmitter;
  jest.mocked(res.status).mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  return { req, res, next: jest.fn() };
};

describe('idempotency middleware', () => {
  it('passes through without the header', async () => {
    const { req, res, next } = setup({});

    await idempotency(req, res, next as NextFunction);

    expect(beginIdempotentRequest).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('passes through reads', async () => {
    const { req, res, next } = setup({ 'idempotency-key': 'k1' }, 'GET');

    await idempotency(req, res, next as NextFunction);

    expect(beginIdempotentRequest).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a malformed key with 400', async () => {
    const { req, res, next } = setup({ 'idempotency-key': 'bad key!' });

    await idempotency(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('stores the successful answer once the response closes', async () => {
    jest.mocked(beginIdempotentRequest).mockResolvedValue({ state: 'new' });
    jest.mocked(completeIdempotentRequest).mockResolvedValue(undefined);
    const { req, res, next } = setup({ 'idempotency-key': 'k1' });

    await idempotency(req, res, next as NextFunction);
    res.status(201);
    res.json({ status: 'success' });
    res.emit('close');
    await flush();

    expect(next).toHaveBeenCalledWith();
    expect(completeIdempotentRequest).toHaveBeenCalledWith('alice', 'k1', 201, {
      status: 'success',
    });
    expect(releaseIdempotentRequest).not.toHaveBeenCalled();
  });

  it('frees the key when the request fails', async () => {
    jest.mocked(beginIdempotentRequest).mockResolvedValue({ state: 'new' });
    jest.mocked(releaseIdempotentRequest).mockResolvedValue(undefined);
    const { req, res, next } = setup({ 'idempotency-key': 'k1' });

    await idempotency(req, res, next as NextFunction);
    res.status(409);
    res.json({ status: 'error' });
    res.emit('close');
    await flush();

    expect(releaseIdempotentRequest).toHaveBeenCalledWith('alice', 'k1');
    expect(completeIdempotentRequest).not.toHaveBeenCalled();
  });

  it('replays the stored answer without running the handler', async () => {
    jest
      .mocked(beginIdempotentRequest)
      .mockResolvedValue({ state: 'replay', statusCode: 201, body: { id: 9 } });
    const { req, res, next } = setup({ 'idempotency-key': 'k1' });

    await idempotency(req, res, next as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 9 });
    expect(res.setHeader).toHaveBeenCalledWith('Idempotency-Replayed', 'true');
  });

  it('responds 422 when the key was used for a different request', async () => {
    jest.mocked(beginIdempotentRequest).mockResolvedValue({ state: 'mismatch' });
    const { req, res, next } = setup({ 'idempotency-key': 'k1' });

    await idempotency(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });

  it('responds 503 (not 409) while the first request is still running', async () => {
    jest.mocked(beginIdempotentRequest).mockResolvedValue({ state: 'in-progress' });
    const { req, res, next } = setup({ 'idempotency-key': 'k1' });

    await idempotency(req, res, next as NextFunction);

    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '2');
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 503 }));
  });
});
