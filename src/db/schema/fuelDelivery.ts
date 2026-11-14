// Volumes are litres. A shift can record several deliveries, one row each.
export const fuelDeliveryTable = `
  CREATE TABLE IF NOT EXISTS fuel_delivery (
    id            INTEGER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shift_id      INTEGER          NOT NULL REFERENCES shift (id),
    user_id       INTEGER          NOT NULL REFERENCES users (id),
    delivery_date DATE             NOT NULL,
    bol_number    VARCHAR(50)      NOT NULL,
    reg           DOUBLE PRECISION NOT NULL DEFAULT 0,
    prem          DOUBLE PRECISION NOT NULL DEFAULT 0,
    diesel        DOUBLE PRECISION NOT NULL DEFAULT 0,
    total         DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ,
    updated_by    VARCHAR(50)
  )
`;

// A bill of lading is one delivery: a retry of the same one is rejected instead of duplicated.
export const fuelDeliveryBolIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS fuel_delivery_one_bol_per_shift
  ON fuel_delivery (shift_id, bol_number)
`;
