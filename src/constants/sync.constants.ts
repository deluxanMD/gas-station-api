// Header a client sends on a write so the server can recognise a retry of the same request.
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const IDEMPOTENCY_REPLAY_HEADER = 'Idempotency-Replayed';
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_\-:.]+$/;

// A stored answer is replayed for this long; offline clients retry within a few days at most.
export const IDEMPOTENCY_RETENTION_HOURS = 24 * 14;
// A request that never finished (crash) stops blocking its key after this long.
export const IDEMPOTENCY_STALE_IN_PROGRESS_SECONDS = 60;
export const IDEMPOTENCY_IN_PROGRESS_RETRY_AFTER_SECONDS = 2;

// Times recorded on a device while offline: the clock may be a little fast, and a queue can wait for days.
export const CLIENT_TIME_MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
export const CLIENT_TIME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// The pull cursor trails the database clock by this much, so a record committed just after a pull is still seen next time.
export const SYNC_CURSOR_OVERLAP_SECONDS = 30;
export const SYNC_CHANGES_MAX_SHIFTS = 500;

// How often expired idempotency keys and refresh tokens are deleted.
export const MAINTENANCE_INTERVAL_MS = 60 * 60 * 1000;
