import { pool } from '@/config/database';
import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION } from '@/constants/database.constants';
import type { CreateLottoReconciliationInput } from '@/schemas/lottoReconciliation.schema';
import { assertShiftOpen } from '@/services/shift.service';
import type {
  LottoReconciliation,
  LottoReconciliationRow,
} from '@/types/lottoReconciliation.types';
import { httpError } from '@/utils/httpError';

const LOTTO_RECONCILIATION_COLUMNS = `id, shift_id, user_id, bullock, bull_payouts, bull_lotto_winner,
  lotto_net, redeem_net, activations_net, cash_net, total, attribution`;

const toLottoReconciliation = (row: LottoReconciliationRow): LottoReconciliation => ({
  id: row.id,
  shiftId: row.shift_id,
  userId: row.user_id,
  bullock: row.bullock,
  bullPayouts: row.bull_payouts,
  bullLottoWinner: row.bull_lotto_winner,
  lottoNet: row.lotto_net,
  redeemNet: row.redeem_net,
  activationsNet: row.activations_net,
  cashNet: row.cash_net,
  total: row.total,
  attribution: row.attribution,
});

export const createLottoReconciliation = async (
  input: CreateLottoReconciliationInput,
): Promise<LottoReconciliation> => {
  await assertShiftOpen(input.shiftId);
  try {
    const { rows } = await pool.query<LottoReconciliationRow>(
      `INSERT INTO lotto_reconciliation
         (shift_id, user_id, bullock, bull_payouts, bull_lotto_winner,
          lotto_net, redeem_net, activations_net, cash_net, total, attribution)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING ${LOTTO_RECONCILIATION_COLUMNS}`,
      [
        input.shiftId,
        input.userId,
        input.bullock,
        input.bullPayouts,
        input.bullLottoWinner,
        input.lottoNet,
        input.redeemNet,
        input.activationsNet,
        input.cashNet,
        input.total,
        input.attribution,
      ],
    );
    return toLottoReconciliation(rows[0]);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'Shift or user not found');
    if (code === PG_UNIQUE_VIOLATION) throw httpError(409, 'Already saved for this shift');
    throw error;
  }
};
