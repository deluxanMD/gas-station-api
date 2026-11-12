export const payoutsTable = `
  CREATE TABLE IF NOT EXISTS payouts (
    id                INTEGER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shift_id          INTEGER          NOT NULL REFERENCES shift (id),
    user_id           INTEGER          NOT NULL REFERENCES users (id),
    total_pos         DOUBLE PRECISION NOT NULL DEFAULT 0,
    lotto_payout      DOUBLE PRECISION NOT NULL DEFAULT 0,
    vendor_payout     DOUBLE PRECISION NOT NULL DEFAULT 0,
    owner_payout      DOUBLE PRECISION NOT NULL DEFAULT 0,
    misc_payout       DOUBLE PRECISION NOT NULL DEFAULT 0,
    lotto_winner      DOUBLE PRECISION NOT NULL DEFAULT 0,
    gift_certificates DOUBLE PRECISION NOT NULL DEFAULT 0,
    redemptions       DOUBLE PRECISION NOT NULL DEFAULT 0,
    safedrops         DOUBLE PRECISION NOT NULL DEFAULT 0,
    cash_on_hand      DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ,
    updated_by        VARCHAR(50)
  )
`;
