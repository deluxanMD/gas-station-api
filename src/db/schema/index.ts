import { fuelShiftIndex, fuelTable } from '@/db/schema/fuel';
import { fuelDeliveryBolIndex, fuelDeliveryTable } from '@/db/schema/fuelDelivery';
import { fuelDipShiftIndex, fuelDipTable } from '@/db/schema/fuelDip';
import { payoutsShiftIndex, payoutsTable } from '@/db/schema/payouts';
import { creditTotalsShiftIndex, creditTotalsTable } from '@/db/schema/creditTotals';
import {
  dailySummaryReportShiftIndex,
  dailySummaryReportTable,
} from '@/db/schema/dailySummaryReport';
import {
  lottoReconciliationShiftIndex,
  lottoReconciliationTable,
} from '@/db/schema/lottoReconciliation';
import {
  lottoReportShiftIndex,
  lottoReportSlipIndex,
  lottoReportSlipTable,
  lottoReportTable,
} from '@/db/schema/lottoReport';
import {
  scratchTicketLineReportIndex,
  scratchTicketLineTable,
  scratchTicketReportShiftIndex,
  scratchTicketReportTable,
} from '@/db/schema/scratchTicket';
import { rolesSeed, rolesTable } from '@/db/schema/roles';
import { idempotencyKeyCreatedIndex, idempotencyKeyTable } from '@/db/schema/idempotency';
import {
  shiftClientIdColumn,
  shiftClientIdIndex,
  shiftOpenIndex,
  shiftTable,
} from '@/db/schema/shifts';
import { usersTable } from '@/db/schema/users';

// Order matters: list parent tables before tables that reference them, seeds after their table.
export const schema: readonly string[] = [
  rolesTable,
  rolesSeed,
  usersTable,
  shiftTable,
  shiftOpenIndex,
  shiftClientIdColumn,
  shiftClientIdIndex,
  creditTotalsTable,
  creditTotalsShiftIndex,
  dailySummaryReportTable,
  dailySummaryReportShiftIndex,
  payoutsTable,
  payoutsShiftIndex,
  fuelTable,
  fuelShiftIndex,
  fuelDeliveryTable,
  fuelDeliveryBolIndex,
  fuelDipTable,
  fuelDipShiftIndex,
  scratchTicketReportTable,
  scratchTicketReportShiftIndex,
  scratchTicketLineTable,
  scratchTicketLineReportIndex,
  lottoReportTable,
  lottoReportShiftIndex,
  lottoReportSlipTable,
  lottoReportSlipIndex,
  lottoReconciliationTable,
  lottoReconciliationShiftIndex,
  idempotencyKeyTable,
  idempotencyKeyCreatedIndex,
];
