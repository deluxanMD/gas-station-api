import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { CreateCreditTotalsInput } from '@/schemas/creditTotals.schema';
import type { CreditTotals, CreditTotalsRow } from '@/types/creditTotals.types';
import { assertShiftOpen } from '@/services/shift.service';
import { httpError } from '@/utils/httpError';

const toCreditTotals = (row: CreditTotalsRow): CreditTotals => ({
  id: row.id,
  shiftId: row.shift_id,
  userId: row.user_id,
  creditTerminal: row.credit_terminal,
  creditTotal: row.credit_total,
  debitTerminal: row.debit_terminal,
  fleet: row.fleet,
  svRedemption: row.sv_redemption,
});

export const createCreditTotals = async (input: CreateCreditTotalsInput): Promise<CreditTotals> => {
  await assertShiftOpen(input.shiftId);
  try {
    const { rows } = await pool.query<CreditTotalsRow>(
      `INSERT INTO credit_totals
         (shift_id, user_id, credit_terminal, credit_total, debit_terminal, fleet, sv_redemption)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, shift_id, user_id, credit_terminal, credit_total, debit_terminal, fleet, sv_redemption`,
      [
        input.shiftId,
        input.userId,
        input.creditTerminal,
        input.creditTotal,
        input.debitTerminal,
        input.fleet,
        input.svRedemption,
      ],
    );
    return toCreditTotals(rows[0]);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'Shift or user not found');
    if (code === PG_UNIQUE_VIOLATION) throw httpError(409, 'Already saved for this shift');
    throw error;
  }
};
