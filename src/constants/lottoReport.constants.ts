// The slip columns of the Lotto Reports form. PREVIOUS_DAY is a snapshot of the
// prior day's day-end slip so a report's Net stays reproducible.
export enum LottoSlipType {
  PreviousDay = 'PREVIOUS_DAY',
  Yesterday = 'YESTERDAY',
  FullDay = 'FULL_DAY',
  DayEnd = 'DAY_END',
}

// The fixed rows of an OLG slip, in form order. `field` is the JSON name (the
// portal uses the same keys), `column` the database column. Amounts are cents.
export const LOTTO_AMOUNT_FIELDS = [
  { field: 'onlineNetSales', column: 'online_net_sales' },
  { field: 'onlineCashRedem', column: 'online_cash_redem' },
  { field: 'sportsProline', column: 'sports_proline' },
  { field: 'sportsPools', column: 'sports_pools' },
  { field: 'sportsVoids', column: 'sports_voids' },
  { field: 'sportsCashRedem', column: 'sports_cash_redem' },
  { field: 'instantCashRedem', column: 'instant_cash_redem' },
  { field: 'giftSales', column: 'gift_sales' },
  { field: 'giftVoids', column: 'gift_voids' },
  { field: 'giftCashOut', column: 'gift_cash_out' },
  { field: 'decliningBalance', column: 'declining_balance' },
  { field: 'declinedOffer', column: 'declined_offer' },
  { field: 'netPromotion', column: 'net_promotion' },
  { field: 'freeOnline', column: 'free_online' },
  { field: 'freeInstant', column: 'free_instant' },
  { field: 'activations', column: 'activations' },
] as const;
