export const dailySummaryReportTable = `
  CREATE TABLE IF NOT EXISTS daily_summary_report (
    id             INTEGER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shift_id       INTEGER          NOT NULL REFERENCES shift (id),
    user_id        INTEGER          NOT NULL REFERENCES users (id),
    end_date       TIMESTAMPTZ      NOT NULL,
    fuel_sales     DOUBLE PRECISION NOT NULL DEFAULT 0,
    item_sales     DOUBLE PRECISION NOT NULL DEFAULT 0,
    gst            DOUBLE PRECISION NOT NULL DEFAULT 0,
    hst            DOUBLE PRECISION NOT NULL DEFAULT 0,
    penny_rounding DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_sales    DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ,
    updated_by     VARCHAR(50)
  )
`;

// One row per shift: a repeated submission is rejected instead of duplicating cash figures.
export const dailySummaryReportShiftIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS daily_summary_report_one_per_shift
  ON daily_summary_report (shift_id)
`;
