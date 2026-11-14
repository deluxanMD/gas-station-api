// Volumes are litres and totals are dollars, one pair of columns per fuel grade (see FuelType).
export const fuelTable = `
  CREATE TABLE IF NOT EXISTS fuel (
    id               INTEGER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shift_id         INTEGER          NOT NULL REFERENCES shift (id),
    user_id          INTEGER          NOT NULL REFERENCES users (id),
    volume_biodiesel DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_biodiesel  DOUBLE PRECISION NOT NULL DEFAULT 0,
    volume_reg_87    DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_reg_87     DOUBLE PRECISION NOT NULL DEFAULT 0,
    volume_extra_89  DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_extra_89   DOUBLE PRECISION NOT NULL DEFAULT 0,
    volume_supr_91   DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_supr_91    DOUBLE PRECISION NOT NULL DEFAULT 0,
    volume_plus_93   DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_plus_93    DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_volume     DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ,
    updated_by       VARCHAR(50)
  )
`;

// One row per shift: a repeated submission is rejected instead of duplicating fuel figures.
export const fuelShiftIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS fuel_one_per_shift
  ON fuel (shift_id)
`;
