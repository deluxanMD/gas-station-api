// Who a lotto over/short is charged to. A report with an over/short and no
// attribution is flagged until one is chosen.
export enum LossAttribution {
  Employee = 'EMPLOYEE',
  PreviousDay = 'PREVIOUS_DAY',
  NextDay = 'NEXT_DAY',
}
