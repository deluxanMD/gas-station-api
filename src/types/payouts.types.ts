export interface Payouts {
  id: number;
  shiftId: number;
  userId: number;
  totalPos: number;
  lottoPayout: number;
  vendorPayout: number;
  ownerPayout: number;
  miscPayout: number;
  lottoWinner: number;
  giftCertificates: number;
  redemptions: number;
  safedrops: number;
  cashOnHand: number;
}

export interface PayoutsRow {
  id: number;
  shift_id: number;
  user_id: number;
  total_pos: number;
  lotto_payout: number;
  vendor_payout: number;
  owner_payout: number;
  misc_payout: number;
  lotto_winner: number;
  gift_certificates: number;
  redemptions: number;
  safedrops: number;
  cash_on_hand: number;
}
