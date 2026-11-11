export const shiftTable = `
  CREATE TABLE IF NOT EXISTS shift (
    id         INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    VARCHAR(50) NOT NULL REFERENCES users (user_id),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time   TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(50)
  )
`;
