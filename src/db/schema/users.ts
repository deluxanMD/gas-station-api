export const usersTable = `
  CREATE TABLE IF NOT EXISTS users (
    user_id       VARCHAR(50) PRIMARY KEY,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ,
    updated_by    VARCHAR(50)
  )
`;
