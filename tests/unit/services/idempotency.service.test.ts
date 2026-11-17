import { pool } from '@/config/database';
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  releaseIdempotentRequest,
} from '@/services/idempotency.service';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }));

const query = jest.mocked(pool.query) as unknown as jest.Mock;

const request = {
  userId: 'alice',
  key: 'k1',
  requestHash: 'h1',
  method: 'POST',
  path: '/api/v1/payouts',
};

describe('Idempotency service', () => {
  describe('beginIdempotentRequest', () => {
    it('claims a fresh key after clearing expired and stuck rows', async () => {
      query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ key: 'k1' }] });

      await expect(beginIdempotentRequest(request)).resolves.toEqual({ state: 'new' });
      expect(query.mock.calls[0][0]).toContain('DELETE FROM idempotency_key');
      expect(query.mock.calls[1][1]).toEqual(['alice', 'k1', 'h1', 'POST', '/api/v1/payouts']);
    });

    it('replays the stored answer for the same request', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ request_hash: 'h1', status_code: 201, response_body: { id: 9 } }],
        });

      await expect(beginIdempotentRequest(request)).resolves.toEqual({
        state: 'replay',
        statusCode: 201,
        body: { id: 9 },
      });
    });

    it('reports a different request under the same key', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ request_hash: 'other', status_code: 201, response_body: {} }],
        });

      await expect(beginIdempotentRequest(request)).resolves.toEqual({ state: 'mismatch' });
    });

    it('reports a request still being processed', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ request_hash: 'h1', status_code: null, response_body: null }],
        });

      await expect(beginIdempotentRequest(request)).resolves.toEqual({ state: 'in-progress' });
    });
  });

  it('stores the answer as JSON', async () => {
    query.mockResolvedValue({ rows: [] });

    await completeIdempotentRequest('alice', 'k1', 201, { id: 9 });

    expect(query.mock.calls[0][1]).toEqual(['alice', 'k1', 201, '{"id":9}']);
  });

  it('frees a key', async () => {
    query.mockResolvedValue({ rows: [] });

    await releaseIdempotentRequest('alice', 'k1');

    expect(query.mock.calls[0][1]).toEqual(['alice', 'k1']);
  });
});
