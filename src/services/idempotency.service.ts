import { pool } from '@/config/database';
import {
  IDEMPOTENCY_RETENTION_HOURS,
  IDEMPOTENCY_STALE_IN_PROGRESS_SECONDS,
} from '@/constants/sync.constants';
import type {
  IdempotencyOutcome,
  IdempotencyRow,
  IdempotentRequest,
} from '@/types/idempotency.types';

/** Claims the key for this request, or reports what the earlier request with the same key left behind. */
export const beginIdempotentRequest = async ({
  userId,
  key,
  requestHash,
  method,
  path,
}: IdempotentRequest): Promise<IdempotencyOutcome> => {
  // Expired answers and requests that died mid-flight no longer hold the key.
  await pool.query(
    `DELETE FROM idempotency_key
     WHERE user_id = $1 AND key = $2
       AND (created_at < NOW() - make_interval(hours => $3)
         OR (status_code IS NULL AND created_at < NOW() - make_interval(secs => $4)))`,
    [userId, key, IDEMPOTENCY_RETENTION_HOURS, IDEMPOTENCY_STALE_IN_PROGRESS_SECONDS],
  );

  const inserted = await pool.query(
    `INSERT INTO idempotency_key (user_id, key, request_hash, method, path)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, key) DO NOTHING
     RETURNING key`,
    [userId, key, requestHash, method, path],
  );
  if (inserted.rows.length > 0) return { state: 'new' };

  const { rows } = await pool.query<IdempotencyRow>(
    'SELECT request_hash, status_code, response_body FROM idempotency_key WHERE user_id = $1 AND key = $2',
    [userId, key],
  );
  const existing = rows[0];
  // The row was removed between the two statements: let the client retry.
  if (!existing) return { state: 'in-progress' };
  if (existing.request_hash !== requestHash) return { state: 'mismatch' };
  if (existing.status_code === null) return { state: 'in-progress' };
  return { state: 'replay', statusCode: existing.status_code, body: existing.response_body };
};

/** Keeps the successful answer so a retry gets the same response. */
export const completeIdempotentRequest = async (
  userId: string,
  key: string,
  statusCode: number,
  body: unknown,
): Promise<void> => {
  await pool.query(
    'UPDATE idempotency_key SET status_code = $3, response_body = $4 WHERE user_id = $1 AND key = $2',
    [userId, key, statusCode, JSON.stringify(body)],
  );
};

/** Frees the key after a failed request so the client can retry it. */
export const releaseIdempotentRequest = async (userId: string, key: string): Promise<void> => {
  await pool.query('DELETE FROM idempotency_key WHERE user_id = $1 AND key = $2', [userId, key]);
};

/** Removes stored answers past their retention and requests that never finished. Returns how many were deleted. */
export const purgeExpiredIdempotencyKeys = async (): Promise<number> => {
  const result = await pool.query(
    `DELETE FROM idempotency_key
     WHERE created_at < NOW() - make_interval(hours => $1)
        OR (status_code IS NULL AND created_at < NOW() - make_interval(secs => $2))`,
    [IDEMPOTENCY_RETENTION_HOURS, IDEMPOTENCY_STALE_IN_PROGRESS_SECONDS],
  );
  return result.rowCount ?? 0;
};
