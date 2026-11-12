import { payoutsShiftIndex, payoutsTable } from '@/db/schema/payouts';
import { creditTotalsShiftIndex, creditTotalsTable } from '@/db/schema/creditTotals';
import {
  dailySummaryReportShiftIndex,
  dailySummaryReportTable,
} from '@/db/schema/dailySummaryReport';
import { rolesSeed, rolesTable } from '@/db/schema/roles';
import { shiftOpenIndex, shiftTable } from '@/db/schema/shifts';
import { usersTable } from '@/db/schema/users';

// Order matters: list parent tables before tables that reference them, seeds after their table.
export const schema: readonly string[] = [
  rolesTable,
  rolesSeed,
  usersTable,
  shiftTable,
  shiftOpenIndex,
  creditTotalsTable,
  creditTotalsShiftIndex,
  dailySummaryReportTable,
  dailySummaryReportShiftIndex,
  payoutsTable,
  payoutsShiftIndex,
];
