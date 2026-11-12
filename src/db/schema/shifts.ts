export const shiftTable = `
  CREATE TABLE IF NOT EXISTS shift (
    id         INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users (id),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time   TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(50)
  )
`;

// A user can have at most one open shift (end_time IS NULL); also guards against concurrent logins.
export const shiftOpenIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS shift_one_open_per_user
  ON shift (user_id) WHERE end_time IS NULL
`;
