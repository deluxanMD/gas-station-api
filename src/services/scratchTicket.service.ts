import { pool } from '@/config/database';
import {
  PG_DATETIME_FIELD_OVERFLOW,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
} from '@/constants/database.constants';
import { CENTS_PER_DOLLAR } from '@/constants/scratchTicket.constants';
import type { CreateScratchTicketReportInput } from '@/schemas/scratchTicket.schema';
import type {
  ScratchTicketLine,
  ScratchTicketLineRow,
  ScratchTicketReport,
  ScratchTicketReportRow,
} from '@/types/scratchTicket.types';
import { httpError } from '@/utils/httpError';

// to_char keeps the DATE a plain string instead of a JS Date shifted by the server time zone.
const REPORT_COLUMNS = `id, user_id, to_char(business_date, 'YYYY-MM-DD') AS business_date,
  shift_number, total_amount_cents`;
const LINE_COLUMNS = `denomination, open_count, close_count, activations_count, sold_count, amount`;

const toLine = (row: ScratchTicketLineRow): ScratchTicketLine => ({
  denomination: row.denomination,
  openCount: row.open_count,
  closeCount: row.close_count,
  activationsCount: row.activations_count,
  soldCount: row.sold_count,
  amountCents: row.amount,
});

const toReport = (
  row: ScratchTicketReportRow,
  lines: ScratchTicketLineRow[],
): ScratchTicketReport => ({
  id: row.id,
  userId: row.user_id,
  businessDate: row.business_date,
  shiftNumber: row.shift_number,
  totalAmountCents: row.total_amount_cents,
  lines: lines.map(toLine),
});

// Sold = open + activations - close; amount = sold x price. The client's own figures are never trusted.
const calculateLines = (lines: CreateScratchTicketReportInput['lines']): ScratchTicketLine[] =>
  [...lines]
    .sort((a, b) => a.denomination - b.denomination)
    .map((line) => {
      const soldCount = line.openCount + line.activationsCount - line.closeCount;
      return {
        ...line,
        soldCount,
        amountCents: soldCount * line.denomination * CENTS_PER_DOLLAR,
      };
    });

/** Saves a shift sheet and its lines together, so a report never exists without all its lines. */
export const createScratchTicketReport = async (
  input: CreateScratchTicketReportInput,
): Promise<ScratchTicketReport> => {
  const lines = calculateLines(input.lines);
  const totalAmountCents = lines.reduce((sum, line) => sum + line.amountCents, 0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: reportRows } = await client.query<ScratchTicketReportRow>(
      `INSERT INTO scratch_ticket_report (user_id, business_date, shift_number, total_amount_cents)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4)
       RETURNING ${REPORT_COLUMNS}`,
      [input.userId, input.businessDate ?? null, input.shiftNumber, totalAmountCents],
    );
    const report = reportRows[0];
    const { rows: lineRows } = await client.query<ScratchTicketLineRow>(
      `INSERT INTO scratch_ticket_line
         (report_id, denomination, open_count, close_count, activations_count, sold_count, amount)
       SELECT $1, * FROM unnest($2::int[], $3::int[], $4::int[], $5::int[], $6::int[], $7::int[])
       RETURNING ${LINE_COLUMNS}`,
      [
        report.id,
        lines.map((line) => line.denomination),
        lines.map((line) => line.openCount),
        lines.map((line) => line.closeCount),
        lines.map((line) => line.activationsCount),
        lines.map((line) => line.soldCount),
        lines.map((line) => line.amountCents),
      ],
    );
    await client.query('COMMIT');
    return toReport(report, lineRows);
  } catch (error) {
    await client.query('ROLLBACK');
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'User not found');
    if (code === PG_UNIQUE_VIOLATION) {
      throw httpError(409, 'A report for this shift is already saved for this date');
    }
    if (code === PG_DATETIME_FIELD_OVERFLOW) throw httpError(400, 'Invalid business date');
    throw error;
  } finally {
    client.release();
  }
};

/** The most recent report, whose close counts become the next report's open counts. Null when there is none. */
export const findLatestScratchTicketReport = async (): Promise<ScratchTicketReport | null> => {
  const { rows } = await pool.query<ScratchTicketReportRow>(
    `SELECT ${REPORT_COLUMNS}
     FROM scratch_ticket_report
     ORDER BY business_date DESC, shift_number DESC
     LIMIT 1`,
  );
  if (rows.length === 0) return null;
  const { rows: lineRows } = await pool.query<ScratchTicketLineRow>(
    `SELECT ${LINE_COLUMNS} FROM scratch_ticket_line WHERE report_id = $1 ORDER BY denomination`,
    [rows[0].id],
  );
  return toReport(rows[0], lineRows);
};
