import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import type { CreateDailySummaryReportInput } from '@/schemas/dailySummaryReport.schema';
import type { DailySummaryReport, DailySummaryReportRow } from '@/types/dailySummaryReport.types';
import { assertShiftOpen } from '@/services/shift.service';
import { httpError } from '@/utils/httpError';

const toDailySummaryReport = (row: DailySummaryReportRow): DailySummaryReport => ({
  id: row.id,
  shiftId: row.shift_id,
  userId: row.user_id,
  endDate: row.end_date.toISOString(),
  fuelSales: row.fuel_sales,
  itemSales: row.item_sales,
  gst: row.gst,
  hst: row.hst,
  pennyRounding: row.penny_rounding,
  totalSales: row.total_sales,
});

export const createDailySummaryReport = async (
  input: CreateDailySummaryReportInput,
): Promise<DailySummaryReport> => {
  await assertShiftOpen(input.shiftId);
  try {
    const { rows } = await pool.query<DailySummaryReportRow>(
      `INSERT INTO daily_summary_report
         (shift_id, user_id, end_date, fuel_sales, item_sales, gst, hst, penny_rounding, total_sales)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, shift_id, user_id, end_date, fuel_sales, item_sales, gst, hst, penny_rounding, total_sales`,
      [
        input.shiftId,
        input.userId,
        input.endDate,
        input.fuelSales,
        input.itemSales,
        input.gst,
        input.hst,
        input.pennyRounding,
        input.totalSales,
      ],
    );
    return toDailySummaryReport(rows[0]);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'Shift or user not found');
    if (code === PG_UNIQUE_VIOLATION) throw httpError(409, 'Already saved for this shift');
    throw error;
  }
};
