// Only the SHA-256 of the token is stored. A token is used once: refreshing revokes it and issues the next one.
export const refreshTokenTable = `
  CREATE TABLE IF NOT EXISTS refresh_token (
    id         INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users (id),
    token_hash CHAR(64)    NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export const refreshTokenExpiresIndex = `
  CREATE INDEX IF NOT EXISTS refresh_token_expires_at
  ON refresh_token (expires_at)
`;
