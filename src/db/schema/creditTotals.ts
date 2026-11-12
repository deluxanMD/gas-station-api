export const creditTotalsTable = `
  CREATE TABLE IF NOT EXISTS credit_totals (
    id              INTEGER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shift_id        INTEGER          NOT NULL REFERENCES shift (id),
    user_id         INTEGER          NOT NULL REFERENCES users (id),
    credit_terminal DOUBLE PRECISION NOT NULL DEFAULT 0,
    credit_total    DOUBLE PRECISION NOT NULL DEFAULT 0,
    debit_terminal  DOUBLE PRECISION NOT NULL DEFAULT 0,
    fleet           DOUBLE PRECISION NOT NULL DEFAULT 0,
    sv_redemption   DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ,
    updated_by      VARCHAR(50)
  )
`;
