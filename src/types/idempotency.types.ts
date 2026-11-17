export interface IdempotencyRow {
  request_hash: string;
  status_code: number | null;
  response_body: unknown;
}

export interface IdempotentRequest {
  userId: string;
  key: string;
  requestHash: string;
  method: string;
  path: string;
}

/** What the server knows about a key when a request arrives. */
export type IdempotencyOutcome =
  | { state: 'new' }
  | { state: 'replay'; statusCode: number; body: unknown }
  | { state: 'in-progress' }
  | { state: 'mismatch' };
