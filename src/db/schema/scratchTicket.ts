// One row per shift sheet. Money is whole cents.
export const scratchTicketReportTable = `
  CREATE TABLE IF NOT EXISTS scratch_ticket_report (
    id                 INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            INTEGER     NOT NULL REFERENCES users (id),
    business_date      DATE        NOT NULL,
    shift_number       INTEGER     NOT NULL CHECK (shift_number > 0),
    total_amount_cents INTEGER     NOT NULL CHECK (total_amount_cents >= 0),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ,
    updated_by         VARCHAR(50)
  )
`;

// A sheet is entered once: a repeated submission is rejected instead of duplicating sales.
export const scratchTicketReportShiftIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS scratch_ticket_report_one_per_shift
  ON scratch_ticket_report (business_date, shift_number)
`;

// One row per ticket price. Sold and amount are stored for reporting but the CHECKs keep them
// consistent with the counts the manager typed.
export const scratchTicketLineTable = `
  CREATE TABLE IF NOT EXISTS scratch_ticket_line (
    id                INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    report_id         INTEGER     NOT NULL REFERENCES scratch_ticket_report (id),
    denomination      INTEGER     NOT NULL CHECK (denomination > 0),
    open_count        INTEGER     NOT NULL CHECK (open_count >= 0),
    close_count       INTEGER     NOT NULL CHECK (close_count >= 0),
    activations_count INTEGER     NOT NULL CHECK (activations_count >= 0),
    sold_count        INTEGER     NOT NULL CHECK (sold_count >= 0),
    amount      INTEGER     NOT NULL CHECK (amount >= 0),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (sold_count = open_count + activations_count - close_count),
    CHECK (amount = sold_count * denomination * 100)
  )
`;

export const scratchTicketLineReportIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS scratch_ticket_line_one_per_denomination
  ON scratch_ticket_line (report_id, denomination)
`;
