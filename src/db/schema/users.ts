export const usersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    user_role     VARCHAR(50) REFERENCES roles (code),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ,
    updated_by    VARCHAR(50)
  )
`;
