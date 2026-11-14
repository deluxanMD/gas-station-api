import type { LOTTO_AMOUNT_FIELDS, LottoSlipType } from '@/constants/lottoReport.constants';

export type LottoAmountField = (typeof LOTTO_AMOUNT_FIELDS)[number]['field'];
export type LottoAmountColumn = (typeof LOTTO_AMOUNT_FIELDS)[number]['column'];

// Cents for every typed row of a slip.
export type LottoAmounts = Record<LottoAmountField, number>;

export interface LottoSlip {
  slipType: LottoSlipType;
  // YYYY-MM-DD, null when the slip was not available.
  reportDate: string | null;
  // HH:mm, 24-hour.
  reportTime: string | null;
  amounts: LottoAmounts;
}

export interface LottoReport {
  id: number;
  shiftId: number;
  userId: number;
  slips: LottoSlip[];
}

export interface LottoReportRow {
  id: number;
  shift_id: number;
  user_id: number;
}

export type LottoSlipRow = {
  slip_type: LottoSlipType;
  report_date: string | null;
  report_time: string | null;
} & Record<LottoAmountColumn, number>;
