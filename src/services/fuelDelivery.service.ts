import {
  PG_DATETIME_FIELD_OVERFLOW,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
} from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { CreateFuelDeliveryInput } from '@/schemas/fuelDelivery.schema';
import type { FuelDelivery, FuelDeliveryRow } from '@/types/fuelDelivery.types';
import { assertShiftOpen } from '@/services/shift.service';
import { httpError } from '@/utils/httpError';

// to_char keeps the DATE a plain string instead of a JS Date shifted by the server time zone.
const FUEL_DELIVERY_COLUMNS = `id, shift_id, user_id,
  to_char(delivery_date, 'YYYY-MM-DD') AS delivery_date, bol_number, reg, prem, diesel, total`;

const toFuelDelivery = (row: FuelDeliveryRow): FuelDelivery => ({
  id: row.id,
  shiftId: row.shift_id,
  userId: row.user_id,
  deliveryDate: row.delivery_date,
  bolNumber: row.bol_number,
  reg: row.reg,
  prem: row.prem,
  diesel: row.diesel,
  total: row.total,
});

export const createFuelDelivery = async (input: CreateFuelDeliveryInput): Promise<FuelDelivery> => {
  await assertShiftOpen(input.shiftId, input.recordedAt);
  try {
    const { rows } = await pool.query<FuelDeliveryRow>(
      `INSERT INTO fuel_delivery
         (shift_id, user_id, delivery_date, bol_number, reg, prem, diesel, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${FUEL_DELIVERY_COLUMNS}`,
      [
        input.shiftId,
        input.userId,
        input.deliveryDate,
        input.bolNumber,
        input.reg,
        input.prem,
        input.diesel,
        input.total,
      ],
    );
    return toFuelDelivery(rows[0]);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'Shift or user not found');
    if (code === PG_UNIQUE_VIOLATION) {
      throw httpError(409, 'This bill of lading is already saved for this shift');
    }
    // An impossible calendar date such as 2026-02-31 passes the regex but not Postgres.
    if (code === PG_DATETIME_FIELD_OVERFLOW) throw httpError(400, 'Invalid delivery date');
    throw error;
  }
};
