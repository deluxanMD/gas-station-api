// One row per (user, Idempotency-Key). status_code and response_body stay NULL while the first request runs;
// only a successful answer is kept, so a failed request can be retried with the same key.
export const idempotencyKeyTable = `
  CREATE TABLE IF NOT EXISTS idempotency_key (
    user_id       VARCHAR(50)  NOT NULL,
    key           VARCHAR(128) NOT NULL,
    request_hash  CHAR(64)     NOT NULL,
    method        VARCHAR(10)  NOT NULL,
    path          TEXT         NOT NULL,
    status_code   INTEGER,
    response_body JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, key)
  )
`;

export const idempotencyKeyCreatedIndex = `
  CREATE INDEX IF NOT EXISTS idempotency_key_created_at
  ON idempotency_key (created_at)
`;
