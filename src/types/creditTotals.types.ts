export interface CreditTotals {
  id: number;
  shiftId: number;
  userId: number;
  creditTerminal: number;
  creditTotal: number;
  debitTerminal: number;
  fleet: number;
  svRedemption: number;
}

export interface CreditTotalsRow {
  id: number;
  shift_id: number;
  user_id: number;
  credit_terminal: number;
  credit_total: number;
  debit_terminal: number;
  fleet: number;
  sv_redemption: number;
}
