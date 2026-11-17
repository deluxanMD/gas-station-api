import { createHash, randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { env } from '@/config/env';
import { pool } from '@/config/database';
import { REFRESH_TOKEN_BYTES } from '@/constants/auth.constants';
import type { LoginUser, RefreshTokenRow, UserRow } from '@/types/auth.types';
import { httpError } from '@/utils/httpError';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

const invalidToken = (): Error => httpError(401, 'Invalid or expired refresh token');

const insertToken = async (client: Pick<PoolClient, 'query'>, userId: number): Promise<string> => {
  const token = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  await client.query(
    `INSERT INTO refresh_token (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + make_interval(days => $3))`,
    [userId, hashToken(token), env.REFRESH_TOKEN_EXPIRES_DAYS],
  );
  return token;
};

/** A new opaque token for the user, valid for REFRESH_TOKEN_EXPIRES_DAYS. */
export const issueRefreshToken = async (userId: number): Promise<string> =>
  insertToken(pool, userId);

/**
 * Exchanges a refresh token for the next one (the old one stops working) and returns its owner as they are now, so a
 * changed role takes effect. Throws 401 for a token that is unknown, used, revoked or expired.
 */
export const rotateRefreshToken = async (
  token: string,
): Promise<{ user: LoginUser; refreshToken: string }> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<RefreshTokenRow>(
      `SELECT id, user_id, expires_at, revoked_at FROM refresh_token
       WHERE token_hash = $1 FOR UPDATE`,
      [hashToken(token)],
    );
    const stored = rows[0];
    if (stored === undefined) throw invalidToken();
    if (stored.revoked_at !== null || stored.expires_at.getTime() <= Date.now()) {
      throw invalidToken();
    }

    const owner = await client.query<UserRow>(
      'SELECT id, user_id, password_hash, user_role FROM users WHERE id = $1',
      [stored.user_id],
    );
    const row = owner.rows[0];
    if (!row) throw invalidToken();

    await client.query('UPDATE refresh_token SET revoked_at = NOW() WHERE id = $1', [stored.id]);
    const refreshToken = await insertToken(client, stored.user_id);
    await client.query('COMMIT');
    return {
      user: { id: row.id, userId: row.user_id, userRole: row.user_role },
      refreshToken,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/** Signs a device out: the token can no longer be refreshed. Unknown tokens are ignored. */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await pool.query(
    'UPDATE refresh_token SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
    [hashToken(token)],
  );
};

/** Removes tokens that can no longer be used. Returns how many were deleted. */
export const purgeExpiredRefreshTokens = async (): Promise<number> => {
  const result = await pool.query('DELETE FROM refresh_token WHERE expires_at < NOW()');
  return result.rowCount ?? 0;
};
