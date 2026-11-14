import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { CreateFuelDipInput } from '@/schemas/fuelDip.schema';
import type { FuelDip, FuelDipRow } from '@/types/fuelDip.types';
import { assertShiftOpen } from '@/services/shift.service';
import { httpError } from '@/utils/httpError';

const FUEL_DIP_COLUMNS = `id, shift_id, user_id, dip_at,
  tc_volume_regular, ullage_90_regular, tc_volume_premium, ullage_90_premium, tc_volume_diesel, ullage_90_diesel`;

const toFuelDip = (row: FuelDipRow): FuelDip => ({
  id: row.id,
  shiftId: row.shift_id,
  userId: row.user_id,
  dipAt: row.dip_at.toISOString(),
  regularTcVolume: row.tc_volume_regular,
  regularUllage90: row.ullage_90_regular,
  premiumTcVolume: row.tc_volume_premium,
  premiumUllage90: row.ullage_90_premium,
  dieselTcVolume: row.tc_volume_diesel,
  dieselUllage90: row.ullage_90_diesel,
});

export const createFuelDip = async (input: CreateFuelDipInput): Promise<FuelDip> => {
  await assertShiftOpen(input.shiftId);
  try {
    const { rows } = await pool.query<FuelDipRow>(
      `INSERT INTO fuel_dip
         (shift_id, user_id, dip_at,
          tc_volume_regular, ullage_90_regular, tc_volume_premium, ullage_90_premium, tc_volume_diesel, ullage_90_diesel)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${FUEL_DIP_COLUMNS}`,
      [
        input.shiftId,
        input.userId,
        input.dipAt,
        input.regularTcVolume,
        input.regularUllage90,
        input.premiumTcVolume,
        input.premiumUllage90,
        input.dieselTcVolume,
        input.dieselUllage90,
      ],
    );
    return toFuelDip(rows[0]);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'Shift or user not found');
    if (code === PG_UNIQUE_VIOLATION) throw httpError(409, 'Already saved for this shift');
    throw error;
  }
};
