import { createHash } from 'node:crypto';
import { pool } from '@/config/database';
import {
  issueRefreshToken,
  purgeExpiredRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from '@/services/refreshToken.service';

jest.mock('@/config/env', () => ({ env: { REFRESH_TOKEN_EXPIRES_DAYS: 30 } }));
jest.mock('@/config/database', () => ({ pool: { query: jest.fn(), connect: jest.fn() } }));

const query = jest.mocked(pool.query) as unknown as jest.Mock;
const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

const future = new Date(Date.now() + 86_400_000);
const past = new Date(Date.now() - 1000);

const setupClient = (
  rows: Record<string, unknown>[],
  owner: Record<string, unknown>[] = [],
): { clientQuery: jest.Mock; release: jest.Mock } => {
  const clientQuery = jest.fn((sql: string) => {
    if (sql.includes('FROM refresh_token')) return Promise.resolve({ rows });
    if (sql.includes('FROM users')) return Promise.resolve({ rows: owner });
    return Promise.resolve({ rows: [] });
  });
  const release = jest.fn();
  jest
    .mocked(pool.connect as unknown as jest.Mock)
    .mockResolvedValue({ query: clientQuery, release });
  return { clientQuery, release };
};

describe('Refresh token service', () => {
  it('stores only the hash of an issued token', async () => {
    query.mockResolvedValue({ rows: [] });

    const token = await issueRefreshToken(7);

    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(query.mock.calls[0][1]).toEqual([7, sha256(token), 30]);
  });

  it('rotates a valid token and returns the owner as they are now', async () => {
    const { clientQuery, release } = setupClient(
      [{ id: 1, user_id: 7, expires_at: future, revoked_at: null }],
      [{ id: 7, user_id: 'alice', password_hash: 'x', user_role: 'MANAGER' }],
    );

    const result = await rotateRefreshToken('old-token');

    expect(result.user).toEqual({ id: 7, userId: 'alice', userRole: 'MANAGER' });
    expect(result.refreshToken).not.toBe('old-token');
    const sqls = clientQuery.mock.calls.map((c) => c[0] as string);
    expect(sqls.some((s) => s.includes('SET revoked_at = NOW()'))).toBe(true);
    expect(sqls.at(-1)).toBe('COMMIT');
    expect(release).toHaveBeenCalled();
  });

  it.each([
    ['unknown', []],
    ['revoked', [{ id: 1, user_id: 7, expires_at: future, revoked_at: new Date() }]],
    ['expired', [{ id: 1, user_id: 7, expires_at: past, revoked_at: null }]],
  ])('responds 401 for a %s token and rolls back', async (_name, rows) => {
    const { clientQuery, release } = setupClient(rows);

    await expect(rotateRefreshToken('t')).rejects.toMatchObject({ statusCode: 401 });
    expect(clientQuery.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(release).toHaveBeenCalled();
  });

  it('revokes by hash', async () => {
    query.mockResolvedValue({ rows: [] });

    await revokeRefreshToken('t');

    expect(query.mock.calls[0][1]).toEqual([sha256('t')]);
  });

  it('reports how many expired tokens were purged', async () => {
    query.mockResolvedValue({ rows: [], rowCount: 3 });

    await expect(purgeExpiredRefreshTokens()).resolves.toBe(3);
  });
});
