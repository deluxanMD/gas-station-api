import { pool } from '@/config/database';
import { LOTTO_AMOUNT_FIELDS, LottoSlipType } from '@/constants/lottoReport.constants';
import {
  PG_DATETIME_FIELD_OVERFLOW,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
} from '@/constants/database.constants';
import type { CreateLottoReportInput } from '@/schemas/lottoReport.schema';
import { assertShiftOpen } from '@/services/shift.service';
import type {
  LottoAmounts,
  LottoReport,
  LottoReportRow,
  LottoSlip,
  LottoSlipRow,
} from '@/types/lottoReport.types';
import { httpError } from '@/utils/httpError';

// to_char keeps DATE and TIME plain strings instead of values shifted by the server time zone.
// The column list comes from constants, never from user input.
const SLIP_COLUMNS = `slip_type, to_char(report_date, 'YYYY-MM-DD') AS report_date,
  to_char(report_time, 'HH24:MI') AS report_time,
  ${LOTTO_AMOUNT_FIELDS.map(({ column }) => column).join(', ')}`;

const toSlip = (row: LottoSlipRow): LottoSlip => ({
  slipType: row.slip_type,
  reportDate: row.report_date,
  reportTime: row.report_time,
  amounts: Object.fromEntries(
    LOTTO_AMOUNT_FIELDS.map(({ field, column }) => [field, row[column]]),
  ) as LottoAmounts,
});

/** Saves a report and its four slips together, so a report never exists without all of them. */
export const createLottoReport = async (input: CreateLottoReportInput): Promise<LottoReport> => {
  await assertShiftOpen(input.shiftId);

  const amountColumns = LOTTO_AMOUNT_FIELDS.map(({ column }) => column).join(', ');
  // $1 report id, $2 type, $3 date, $4 time, then one placeholder per amount.
  const placeholders = LOTTO_AMOUNT_FIELDS.map((_, i) => `$${i + 5}`).join(', ');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: reportRows } = await client.query<LottoReportRow>(
      `INSERT INTO lotto_report (shift_id, user_id)
       VALUES ($1, $2)
       RETURNING id, shift_id, user_id`,
      [input.shiftId, input.userId],
    );
    const report = reportRows[0];

    const slips: LottoSlip[] = [];
    for (const slip of input.slips) {
      const { rows } = await client.query<LottoSlipRow>(
        `INSERT INTO lotto_report_slip (report_id, slip_type, report_date, report_time, ${amountColumns})
         VALUES ($1, $2, $3, $4, ${placeholders})
         RETURNING ${SLIP_COLUMNS}`,
        [
          report.id,
          slip.slipType,
          slip.reportDate,
          slip.reportTime,
          ...LOTTO_AMOUNT_FIELDS.map(({ field }) => slip.amounts[field]),
        ],
      );
      slips.push(toSlip(rows[0]));
    }
    await client.query('COMMIT');
    return { id: report.id, shiftId: report.shift_id, userId: report.user_id, slips };
  } catch (error) {
    await client.query('ROLLBACK');
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'Shift or user not found');
    if (code === PG_UNIQUE_VIOLATION) throw httpError(409, 'Already saved for this shift');
    // An impossible calendar date such as 2026-02-31 passes the regex but not Postgres.
    if (code === PG_DATETIME_FIELD_OVERFLOW) throw httpError(400, 'Invalid report date');
    throw error;
  } finally {
    client.release();
  }
};

/** The day-end slip of the most recently saved report: the next report's previous-day figures. Null when there is none. */
export const findLatestDayEndSlip = async (): Promise<LottoSlip | null> => {
  const { rows } = await pool.query<LottoSlipRow>(
    `SELECT ${SLIP_COLUMNS}
     FROM lotto_report_slip
     WHERE slip_type = $1
     ORDER BY report_id DESC
     LIMIT 1`,
    [LottoSlipType.DayEnd],
  );
  return rows.length === 0 ? null : toSlip(rows[0]);
};
