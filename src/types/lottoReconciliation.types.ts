import type { LossAttribution } from '@/constants/lottoReconciliation.constants';

// Whole cents; the nets and the total can be negative.
export interface LottoReconciliation {
  id: number;
  shiftId: number;
  userId: number;
  bullock: number;
  bullPayouts: number;
  bullLottoWinner: number;
  lottoNet: number;
  redeemNet: number;
  activationsNet: number;
  cashNet: number;
  total: number;
  // Null until the over/short is attributed.
  attribution: LossAttribution | null;
}

export interface LottoReconciliationRow {
  id: number;
  shift_id: number;
  user_id: number;
  bullock: number;
  bull_payouts: number;
  bull_lotto_winner: number;
  lotto_net: number;
  redeem_net: number;
  activations_net: number;
  cash_net: number;
  total: number;
  attribution: LossAttribution | null;
}
