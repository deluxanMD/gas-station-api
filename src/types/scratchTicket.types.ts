export interface ScratchTicketLine {
  // Ticket price in whole dollars.
  denomination: number;
  openCount: number;
  closeCount: number;
  activationsCount: number;
  soldCount: number;
  amountCents: number;
}

export interface ScratchTicketReport {
  id: number;
  userId: number;
  // YYYY-MM-DD
  businessDate: string;
  shiftNumber: number;
  totalAmountCents: number;
  lines: ScratchTicketLine[];
}

export interface ScratchTicketReportRow {
  id: number;
  user_id: number;
  business_date: string;
  shift_number: number;
  total_amount_cents: number;
}

export interface ScratchTicketLineRow {
  denomination: number;
  open_count: number;
  close_count: number;
  activations_count: number;
  sold_count: number;
  amount: number;
}
