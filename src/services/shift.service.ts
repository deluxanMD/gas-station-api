import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { Shift } from '@/types/shift.types';
import { httpError } from '@/utils/httpError';

interface ShiftRow {
  id: number;
  user_id: number;
  start_time: Date;
  end_time: Date | null;
}

const toShift = (row: ShiftRow): Shift => ({
  id: row.id,
  userId: row.user_id,
  startTime: row.start_time.toISOString(),
  endTime: row.end_time ? row.end_time.toISOString() : null,
});

const SHIFT_COLUMNS = 'id, user_id, start_time, end_time';

const findOpenShift = async (userId: number): Promise<Shift | null> => {
  const { rows } = await pool.query<ShiftRow>(
    `SELECT ${SHIFT_COLUMNS} FROM shift WHERE user_id = $1 AND end_time IS NULL`,
    [userId],
  );
  return rows[0] ? toShift(rows[0]) : null;
};

/** Creates a shift for the user unless they already have an open one (end_time IS NULL), which is returned instead. */
export const createShift = async (userId: number): Promise<{ shift: Shift; created: boolean }> => {
  const existing = await findOpenShift(userId);
  if (existing) return { shift: existing, created: false };

  try {
    const { rows } = await pool.query<ShiftRow>(
      `INSERT INTO shift (user_id) VALUES ($1) RETURNING ${SHIFT_COLUMNS}`,
      [userId],
    );
    return { shift: toShift(rows[0]), created: true };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'User not found');
    if (code === PG_UNIQUE_VIOLATION) {
      // A concurrent request opened a shift between our check and insert.
      const raced = await findOpenShift(userId);
      if (raced) return { shift: raced, created: false };
    }
    throw error;
  }
};

export const getShiftById = async (id: number): Promise<Shift> => {
  const { rows } = await pool.query<ShiftRow>(`SELECT ${SHIFT_COLUMNS} FROM shift WHERE id = $1`, [
    id,
  ]);
  if (!rows[0]) throw httpError(404, 'Shift not found');
  return toShift(rows[0]);
};

/** The user's open shift, or null when they have not started one. */
export const getCurrentShift = async (userId: number): Promise<Shift | null> =>
  findOpenShift(userId);

/** Ends the shift. Closing an already-closed shift succeeds and returns it unchanged, so retries are safe. */
export const closeShift = async (id: number): Promise<Shift> => {
  const { rows } = await pool.query<ShiftRow>(
    `UPDATE shift SET end_time = NOW(), updated_at = NOW()
     WHERE id = $1 AND end_time IS NULL
     RETURNING ${SHIFT_COLUMNS}`,
    [id],
  );
  if (rows[0]) return toShift(rows[0]);
  return getShiftById(id);
};

/** Throws 404 for an unknown shift and 409 for one that has already ended. */
export const assertShiftOpen = async (id: number): Promise<void> => {
  const shift = await getShiftById(id);
  if (shift.endTime) throw httpError(409, 'Shift is already closed');
};
