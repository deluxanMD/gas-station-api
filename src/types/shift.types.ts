import type { RoleCode } from '@/db/schema/roles';

export interface ShiftRow {
  id: number;
  user_id: number;
  start_time: Date;
  end_time: Date | null;
}

export interface ShiftWithUserRow extends ShiftRow {
  user_name: string;
}

export interface Shift {
  id: number;
  userId: number;
  startTime: string;
  endTime: string | null;
}

export interface ShiftsForDayFilter {
  date?: string;
  role?: RoleCode;
}

/** A shift together with the login name of the user who owns it. */
export interface ShiftWithUser extends Shift {
  userName: string;
}

/** All sums are integer cents. */
export interface ConsolidatedCreditTotals {
  creditTerminalCents: number;
  creditTotalCents: number;
  debitTerminalCents: number;
  fleetCents: number;
  svRedemptionCents: number;
}

export interface ConsolidatedDailySummary {
  fuelSalesCents: number;
  itemSalesCents: number;
  gstCents: number;
  hstCents: number;
  pennyRoundingCents: number;
  totalSalesCents: number;
}

export interface ConsolidatedPayoutsAndCash {
  totalPosCents: number;
  // Lotto, vendor, owner and misc payouts together.
  totalPayoutsCents: number;
  lottoWinnerCents: number;
  giftCertificatesCents: number;
  redemptionsCents: number;
  safedropsCents: number;
  cashOnHandCents: number;
}

/** The cashier-entered figures of several shifts, summed. */
export interface ConsolidatedShifts {
  shiftIds: number[];
  // Shifts missing at least one of their credit totals, daily summary or payouts records; they count as zero.
  incompleteShiftIds: number[];
  creditTotals: ConsolidatedCreditTotals;
  dailySummary: ConsolidatedDailySummary;
  payoutsAndCash: ConsolidatedPayoutsAndCash;
}

// `bigint` sums come back from pg as strings.
export interface ConsolidatedRow {
  credit_terminal: string;
  credit_total: string;
  debit_terminal: string;
  fleet: string;
  sv_redemption: string;
  fuel_sales: string;
  item_sales: string;
  gst: string;
  hst: string;
  penny_rounding: string;
  total_sales: string;
  total_pos: string;
  total_payouts: string;
  lotto_winner: string;
  gift_certificates: string;
  redemptions: string;
  safedrops: string;
  cash_on_hand: string;
}
