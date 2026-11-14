import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { CreateFuelInput } from '@/schemas/fuel.schema';
import type { Fuel, FuelRow } from '@/types/fuel.types';
import { assertShiftOpen } from '@/services/shift.service';
import { httpError } from '@/utils/httpError';

const FUEL_COLUMNS = `id, shift_id, user_id,
  volume_biodiesel, total_biodiesel, volume_reg_87, total_reg_87, volume_extra_89, total_extra_89, volume_supr_91, total_supr_91, volume_plus_93, total_plus_93, total_volume`;

const toFuel = (row: FuelRow): Fuel => ({
  id: row.id,
  shiftId: row.shift_id,
  userId: row.user_id,
  biodieselVolume: row.volume_biodiesel,
  biodieselTotal: row.total_biodiesel,
  reg87Volume: row.volume_reg_87,
  reg87Total: row.total_reg_87,
  extra89Volume: row.volume_extra_89,
  extra89Total: row.total_extra_89,
  supr91Volume: row.volume_supr_91,
  supr91Total: row.total_supr_91,
  plus93Volume: row.volume_plus_93,
  plus93Total: row.total_plus_93,
  totalVolume: row.total_volume,
});

export const createFuel = async (input: CreateFuelInput): Promise<Fuel> => {
  await assertShiftOpen(input.shiftId);
  try {
    const { rows } = await pool.query<FuelRow>(
      `INSERT INTO fuel
         (shift_id, user_id,
          volume_biodiesel, total_biodiesel, volume_reg_87, total_reg_87, volume_extra_89, total_extra_89, volume_supr_91, total_supr_91, volume_plus_93, total_plus_93, total_volume)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING ${FUEL_COLUMNS}`,
      [
        input.shiftId,
        input.userId,
        input.biodieselVolume,
        input.biodieselTotal,
        input.reg87Volume,
        input.reg87Total,
        input.extra89Volume,
        input.extra89Total,
        input.supr91Volume,
        input.supr91Total,
        input.plus93Volume,
        input.plus93Total,
        input.totalVolume,
      ],
    );
    return toFuel(rows[0]);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'Shift or user not found');
    if (code === PG_UNIQUE_VIOLATION) throw httpError(409, 'Already saved for this shift');
    throw error;
  }
};
