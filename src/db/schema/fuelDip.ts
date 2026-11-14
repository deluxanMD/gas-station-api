// Tank dip readings in litres: TC volume and 90% ullage for each product.
export const fuelDipTable = `
  CREATE TABLE IF NOT EXISTS fuel_dip (
    id                    INTEGER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shift_id              INTEGER          NOT NULL REFERENCES shift (id),
    user_id               INTEGER          NOT NULL REFERENCES users (id),
    dip_at                TIMESTAMPTZ      NOT NULL,
    tc_volume_regular     DOUBLE PRECISION NOT NULL DEFAULT 0,
    ullage_90_regular     DOUBLE PRECISION NOT NULL DEFAULT 0,
    tc_volume_premium     DOUBLE PRECISION NOT NULL DEFAULT 0,
    ullage_90_premium     DOUBLE PRECISION NOT NULL DEFAULT 0,
    tc_volume_diesel      DOUBLE PRECISION NOT NULL DEFAULT 0,
    ullage_90_diesel      DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ,
    updated_by            VARCHAR(50)
  )
`;

// One reading per shift: a repeated submission is rejected instead of duplicating it.
export const fuelDipShiftIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS fuel_dip_one_per_shift
  ON fuel_dip (shift_id)
`;
