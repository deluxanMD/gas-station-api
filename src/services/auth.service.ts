import argon2 from 'argon2';
import { PG_UNIQUE_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { RegisterInput } from '@/types/auth.types';
import { httpError } from '@/utils/httpError';

export const registerUser = async ({
  userId,
  password,
  userRole,
  updatedAt,
  updatedBy,
}: RegisterInput): Promise<void> => {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  try {
    await pool.query(
      'INSERT INTO users (user_id, password_hash, user_role, updated_at, updated_by) VALUES ($1, $2, $3, $4, $5)',
      [userId, passwordHash, userRole, updatedAt ?? null, updatedBy ?? null],
    );
  } catch (error) {
    if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) {
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
