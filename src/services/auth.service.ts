import argon2 from 'argon2';
import { pool } from '@/config/database';
import { httpError } from '@/utils/httpError';

const UNIQUE_VIOLATION = '23505';

export const registerUser = async (userId: string, password: string): Promise<void> => {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  try {
    await pool.query('INSERT INTO users (user_id, password_hash) VALUES ($1, $2)', [
      userId,
      passwordHash,
    ]);
  } catch (error) {
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
      throw httpError(409, 'User ID is already taken');
    }
    throw error;
  }
};

export const verifyUser = async (userId: string, password: string): Promise<boolean> => {
  const { rows } = await pool.query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [userId],
  );
  const row = rows[0];
  if (!row) return false;
  return argon2.verify(row.password_hash, password);
};
