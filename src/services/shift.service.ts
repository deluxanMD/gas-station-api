import { PG_FOREIGN_KEY_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { Shift } from '@/types/shift.types';
import { httpError } from '@/utils/httpError';

interface ShiftRow {
  id: number;
  user_id: string;
  start_time: Date;
  end_time: Date | null;
}

const toShift = (row: ShiftRow): Shift => ({
  id: row.id,
  userId: row.user_id,
  startTime: row.start_time.toISOString(),
  endTime: row.end_time ? row.end_time.toISOString() : null,
});

export const createShift = async (userId: string): Promise<Shift> => {
  try {
    const { rows } = await pool.query<ShiftRow>(
      'INSERT INTO shift (user_id) VALUES ($1) RETURNING id, user_id, start_time, end_time',
      [userId],
    );
    return toShift(rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === PG_FOREIGN_KEY_VIOLATION) {
      throw httpError(404, 'User not found');
    }
    throw error;
  }
};

export const getShiftById = async (id: number): Promise<Shift> => {
  const { rows } = await pool.query<ShiftRow>(
    'SELECT id, user_id, start_time, end_time FROM shift WHERE id = $1',
    [id],
  );
  if (!rows[0]) throw httpError(404, 'Shift not found');
  return toShift(rows[0]);
};
