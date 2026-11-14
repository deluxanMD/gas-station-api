import { LOTTO_AMOUNT_FIELDS, LottoSlipType } from '@/constants/lottoReport.constants';

const slipTypes = Object.values(LottoSlipType)
  .map((type) => `'${type}'`)
  .join(', ');

const amountColumns = LOTTO_AMOUNT_FIELDS.map(
  ({ column }) => `    ${column} INTEGER NOT NULL DEFAULT 0,`,
).join('\n');

// One report per manager shift.
export const lottoReportTable = `
  CREATE TABLE IF NOT EXISTS lotto_report (
    id         INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shift_id   INTEGER     NOT NULL REFERENCES shift (id),
    user_id    INTEGER     NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(50)
  )
`;

// A repeated submission is rejected instead of duplicating the slips.
export const lottoReportShiftIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS lotto_report_one_per_shift
  ON lotto_report (shift_id)
`;

// One row per slip column. Amounts are whole cents and may be negative (e.g. a
// net promotion); date and time are blank when that slip was not available.
export const lottoReportSlipTable = `
  CREATE TABLE IF NOT EXISTS lotto_report_slip (
    id          INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    report_id   INTEGER     NOT NULL REFERENCES lotto_report (id),
    slip_type   VARCHAR(20) NOT NULL CHECK (slip_type IN (${slipTypes})),
    report_date DATE,
    report_time TIME,
${amountColumns}
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export const lottoReportSlipIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS lotto_report_slip_one_per_type
  ON lotto_report_slip (report_id, slip_type)
`;
