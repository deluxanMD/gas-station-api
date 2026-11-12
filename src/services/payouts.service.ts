import { PG_FOREIGN_KEY_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { CreatePayoutsInput } from '@/schemas/payouts.schema';
import type { Payouts, PayoutsRow } from '@/types/payouts.types';
import { httpError } from '@/utils/httpError';

const PAYOUTS_COLUMNS = `id, shift_id, user_id, total_pos, lotto_payout, vendor_payout, owner_payout,
  misc_payout, lotto_winner, gift_certificates, redemptions, safedrops, cash_on_hand`;

const toPayouts = (row: PayoutsRow): Payouts => ({
  id: row.id,
  shiftId: row.shift_id,
  userId: row.user_id,
  totalPos: row.total_pos,
  lottoPayout: row.lotto_payout,
  vendorPayout: row.vendor_payout,
  ownerPayout: row.owner_payout,
  miscPayout: row.misc_payout,
  lottoWinner: row.lotto_winner,
  giftCertificates: row.gift_certificates,
  redemptions: row.redemptions,
  safedrops: row.safedrops,
  cashOnHand: row.cash_on_hand,
});

export const createPayouts = async (input: CreatePayoutsInput): Promise<Payouts> => {
  try {
    const { rows } = await pool.query<PayoutsRow>(
      `INSERT INTO payouts
         (shift_id, user_id, total_pos, lotto_payout, vendor_payout, owner_payout, misc_payout,
          lotto_winner, gift_certificates, redemptions, safedrops, cash_on_hand)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING ${PAYOUTS_COLUMNS}`,
      [
        input.shiftId,
        input.userId,
        input.totalPos,
        input.lottoPayout,
        input.vendorPayout,
        input.ownerPayout,
        input.miscPayout,
        input.lottoWinner,
        input.giftCertificates,
        input.redemptions,
        input.safedrops,
        input.cashOnHand,
      ],
    );
    return toPayouts(rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === PG_FOREIGN_KEY_VIOLATION) {
      throw httpError(404, 'Shift or user not found');
    }
    throw error;
  }
};
