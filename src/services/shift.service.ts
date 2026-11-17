import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION } from '@/constants/database.constants';
import { pool } from '@/config/database';
import { SYNC_CHANGES_MAX_SHIFTS, SYNC_CURSOR_OVERLAP_SECONDS } from '@/constants/sync.constants';
import type {
  ConsolidatedRow,
  CreateShiftInput,
  ConsolidatedShifts,
  Shift,
  ShiftChange,
  ShiftChangeRow,
  ShiftChanges,
  ShiftRow,
  ShiftsForDayFilter,
  ShiftWithUser,
  ShiftWithUserRow,
} from '@/types/shift.types';
import { httpError } from '@/utils/httpError';

const toShift = (row: ShiftRow): Shift => ({
  id: row.id,
  clientId: row.client_id,
  userId: row.user_id,
  startTime: row.start_time.toISOString(),
  endTime: row.end_time ? row.end_time.toISOString() : null,
});

const SHIFT_COLUMNS = 'id, client_id, user_id, start_time, end_time';

const findOpenShift = async (userId: number): Promise<Shift | null> => {
  const { rows } = await pool.query<ShiftRow>(
    `SELECT ${SHIFT_COLUMNS} FROM shift WHERE user_id = $1 AND end_time IS NULL`,
    [userId],
  );
  return rows[0] ? toShift(rows[0]) : null;
};

const findShiftByClientId = async (clientId: string): Promise<Shift | null> => {
  const { rows } = await pool.query<ShiftRow>(
    `SELECT ${SHIFT_COLUMNS} FROM shift WHERE client_id = $1`,
    [clientId],
  );
  return rows[0] ? toShift(rows[0]) : null;
};

/** The id of the shift a device started under `clientId`, or 404. */
export const getShiftIdByClientId = async (clientId: string): Promise<number> => {
  const shift = await findShiftByClientId(clientId);
  if (!shift) throw httpError(404, 'Shift not found');
  return shift.id;
};

/**
 * Creates a shift for the user unless they already have an open one (end_time IS NULL), which is returned instead.
 * A repeated `clientId` returns the shift it created, so a retry never opens a second one. `startTime` is the instant
 * the shift really began on the device (default: now).
 */
export const createShift = async ({
  userId,
  clientId,
  startTime,
}: CreateShiftInput): Promise<{ shift: Shift; created: boolean }> => {
  if (clientId) {
    const known = await findShiftByClientId(clientId);
    if (known) {
      if (known.userId !== userId) throw httpError(409, 'Client id belongs to another user');
      return { shift: known, created: false };
    }
  }

  const existing = await findOpenShift(userId);
  if (existing) return { shift: await adoptClientId(existing, clientId), created: false };

  try {
    const { rows } = await pool.query<ShiftRow>(
      `INSERT INTO shift (user_id, client_id, start_time)
       VALUES ($1, $2, COALESCE($3::timestamptz, NOW()))
       RETURNING ${SHIFT_COLUMNS}`,
      [userId, clientId ?? null, startTime ?? null],
    );
    return { shift: toShift(rows[0]), created: true };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PG_FOREIGN_KEY_VIOLATION) throw httpError(404, 'User not found');
    if (code === PG_UNIQUE_VIOLATION) {
      // A concurrent request opened a shift (or used this client id) between our check and insert.
      const byClientId = clientId ? await findShiftByClientId(clientId) : null;
      const raced = byClientId ?? (await findOpenShift(userId));
      if (raced) return { shift: raced, created: false };
    }
    throw error;
  }
};

// The open shift was started without a client id (online); remember the device's id so a later retry maps to it.
const adoptClientId = async (shift: Shift, clientId?: string): Promise<Shift> => {
  if (!clientId || shift.clientId) return shift;
  try {
    const { rows } = await pool.query<ShiftRow>(
      `UPDATE shift SET client_id = $2 WHERE id = $1 AND client_id IS NULL RETURNING ${SHIFT_COLUMNS}`,
      [shift.id, clientId],
    );
    return rows[0] ? toShift(rows[0]) : shift;
  } catch (error) {
    if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) return shift;
    throw error;
  }
};

export const getShiftById = async (id: number): Promise<Shift> => {
  const { rows } = await pool.query<ShiftRow>(`SELECT ${SHIFT_COLUMNS} FROM shift WHERE id = $1`, [
    id,
  ]);
  if (!rows[0]) throw httpError(404, 'Shift not found');
  return toShift(rows[0]);
};

/** The user's open shift, or null when they have not started one. */
export const getCurrentShift = async (userId: number): Promise<Shift | null> =>
  findOpenShift(userId);

/**
 * Ends the shift at `endTime` (the instant it really ended on the device; default: now). Closing an already-closed
 * shift succeeds and returns it unchanged, so retries are safe.
 */
export const closeShift = async (id: number, endTime?: string): Promise<Shift> => {
  const { rows } = await pool.query<ShiftRow>(
    `UPDATE shift SET end_time = COALESCE($2::timestamptz, NOW()), updated_at = NOW()
     WHERE id = $1 AND end_time IS NULL AND COALESCE($2::timestamptz, NOW()) >= start_time
     RETURNING ${SHIFT_COLUMNS}`,
    [id, endTime ?? null],
  );
  if (rows[0]) return toShift(rows[0]);
  const shift = await getShiftById(id);
  if (!shift.endTime) throw httpError(400, 'End time is before the shift started');
  return shift;
};

/** Shifts that started on the given day (default today), ended and in progress, oldest first. Narrowed to the owner's role when one is given. */
export const getShiftsForDay = async ({ date, role }: ShiftsForDayFilter = {}): Promise<
  ShiftWithUser[]
> => {
  const { rows } = await pool.query<ShiftWithUserRow>(
    `SELECT s.id, s.user_id, s.start_time, s.end_time, u.user_id AS user_name
     FROM shift s
     JOIN users u ON u.id = s.user_id
     WHERE ($1::varchar IS NULL OR u.user_role = $1)
       AND s.start_time >= COALESCE($2::date, CURRENT_DATE)
       AND s.start_time < COALESCE($2::date, CURRENT_DATE) + 1
     ORDER BY s.start_time ASC, s.id ASC`,
    [role ?? null, date ?? null],
  );
  return rows.map((row) => ({ ...toShift(row), userName: row.user_name }));
};

// Amounts are stored as dollars (double precision); each is rounded to whole cents before summing so totals stay exact.
const cents = (column: string): string => `ROUND(${column} * 100)`;
const sumCents = (expression: string, alias: string): string =>
  `COALESCE(SUM(${expression}), 0)::bigint AS ${alias}`;

const CONSOLIDATE_SQL = `
  WITH ct AS (
    SELECT ${sumCents(cents('credit_terminal'), 'credit_terminal')},
           ${sumCents(cents('credit_total'), 'credit_total')},
           ${sumCents(cents('debit_terminal'), 'debit_terminal')},
           ${sumCents(cents('fleet'), 'fleet')},
           ${sumCents(cents('sv_redemption'), 'sv_redemption')}
    FROM credit_totals WHERE shift_id = ANY($1::int[])
  ), ds AS (
    SELECT ${sumCents(cents('fuel_sales'), 'fuel_sales')},
           ${sumCents(cents('item_sales'), 'item_sales')},
           ${sumCents(cents('gst'), 'gst')},
           ${sumCents(cents('hst'), 'hst')},
           ${sumCents(cents('penny_rounding'), 'penny_rounding')},
           ${sumCents(cents('total_sales'), 'total_sales')}
    FROM daily_summary_report WHERE shift_id = ANY($1::int[])
  ), po AS (
    SELECT ${sumCents(cents('total_pos'), 'total_pos')},
           ${sumCents(
             `${cents('lotto_payout')} + ${cents('vendor_payout')} + ${cents('owner_payout')} + ${cents('misc_payout')}`,
             'total_payouts',
           )},
           ${sumCents(cents('lotto_winner'), 'lotto_winner')},
           ${sumCents(cents('gift_certificates'), 'gift_certificates')},
           ${sumCents(cents('redemptions'), 'redemptions')},
           ${sumCents(cents('safedrops'), 'safedrops')},
           ${sumCents(cents('cash_on_hand'), 'cash_on_hand')}
    FROM payouts WHERE shift_id = ANY($1::int[])
  )
  SELECT * FROM ct, ds, po
`;

const INCOMPLETE_SQL = `
  SELECT s.id FROM shift s
  WHERE s.id = ANY($1::int[])
    AND NOT (
      EXISTS (SELECT 1 FROM credit_totals WHERE shift_id = s.id)
      AND EXISTS (SELECT 1 FROM daily_summary_report WHERE shift_id = s.id)
      AND EXISTS (SELECT 1 FROM payouts WHERE shift_id = s.id)
    )
  ORDER BY s.id
`;

/** Sums what the cashiers entered for the given shifts. Throws 404 if any shift does not exist. */
export const consolidateShifts = async (shiftIds: number[]): Promise<ConsolidatedShifts> => {
  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM shift WHERE id = ANY($1::int[])',
    [shiftIds],
  );
  if (existing.rows.length !== shiftIds.length) throw httpError(404, 'Shift not found');

  const [totals, incomplete] = await Promise.all([
    pool.query<ConsolidatedRow>(CONSOLIDATE_SQL, [shiftIds]),
    pool.query<{ id: number }>(INCOMPLETE_SQL, [shiftIds]),
  ]);
  const row = totals.rows[0];
  const n = (value: string): number => Number(value);

  return {
    shiftIds,
    incompleteShiftIds: incomplete.rows.map((r) => r.id),
    creditTotals: {
      creditTerminalCents: n(row.credit_terminal),
      creditTotalCents: n(row.credit_total),
      debitTerminalCents: n(row.debit_terminal),
      fleetCents: n(row.fleet),
      svRedemptionCents: n(row.sv_redemption),
    },
    dailySummary: {
      fuelSalesCents: n(row.fuel_sales),
      itemSalesCents: n(row.item_sales),
      gstCents: n(row.gst),
      hstCents: n(row.hst),
      pennyRoundingCents: n(row.penny_rounding),
      totalSalesCents: n(row.total_sales),
    },
    payoutsAndCash: {
      totalPosCents: n(row.total_pos),
      totalPayoutsCents: n(row.total_payouts),
      lottoWinnerCents: n(row.lotto_winner),
      giftCertificatesCents: n(row.gift_certificates),
      redemptionsCents: n(row.redemptions),
      safedropsCents: n(row.safedrops),
      cashOnHandCents: n(row.cash_on_hand),
    },
  };
};

/**
 * Throws 404 for an unknown shift and 409 for one that has already ended. A record made on a device before the shift
 * ended (`recordedAt`) is still accepted, because it may reach the server after the shift was closed.
 */
export const assertShiftOpen = async (id: number, recordedAt?: string): Promise<void> => {
  const shift = await getShiftById(id);
  if (!shift.endTime) return;
  if (recordedAt && Date.parse(recordedAt) <= Date.parse(shift.endTime)) return;
  throw httpError(409, 'Shift is already closed');
};

const CHILD_TABLES = [
  ['credit_totals', 'credit_totals'],
  ['daily_summary', 'daily_summary_report'],
  ['payouts', 'payouts'],
  ['fuel', 'fuel'],
  ['fuel_delivery', 'fuel_delivery'],
  ['fuel_dip', 'fuel_dip'],
  ['lotto_report', 'lotto_report'],
  ['lotto_reconciliation', 'lotto_reconciliation'],
] as const;

// A shift changes when it starts, ends, or when any of its records is saved (including from another device).
const CHANGES_SQL = `
  WITH changed AS (
    SELECT s.id, s.client_id, s.user_id, s.start_time, s.end_time, u.user_id AS user_name,
           GREATEST(s.created_at, s.updated_at,
             ${CHILD_TABLES.map(([, table]) => `(SELECT MAX(created_at) FROM ${table} WHERE shift_id = s.id)`).join(',\n             ')}
           ) AS changed_at,
           ${CHILD_TABLES.map(([flag, table]) => `EXISTS (SELECT 1 FROM ${table} WHERE shift_id = s.id) AS has_${flag}`).join(',\n           ')}
    FROM shift s
    JOIN users u ON u.id = s.user_id
  )
  SELECT * FROM changed
  WHERE changed_at > $1::timestamptz
  ORDER BY changed_at ASC, id ASC
  LIMIT $2
`;

const toShiftChange = (row: ShiftChangeRow): ShiftChange => ({
  ...toShift(row),
  userName: row.user_name,
  changedAt: row.changed_at.toISOString(),
  records: {
    creditTotals: row.has_credit_totals,
    dailySummary: row.has_daily_summary,
    payouts: row.has_payouts,
    fuel: row.has_fuel,
    fuelDelivery: row.has_fuel_delivery,
    fuelDip: row.has_fuel_dip,
    lottoReport: row.has_lotto_report,
    lottoReconciliation: row.has_lotto_reconciliation,
  },
});

/**
 * Shifts that started, ended or received a record after `since`, oldest change first, for a device catching up after
 * being offline. Poll again with the returned cursor; the overlap means a shift can be returned twice, so merge by id.
 */
export const getShiftChanges = async (since: string): Promise<ShiftChanges> => {
  const [clock, changes] = await Promise.all([
    pool.query<{ cursor: Date }>(`SELECT NOW() - make_interval(secs => $1) AS cursor`, [
      SYNC_CURSOR_OVERLAP_SECONDS,
    ]),
    pool.query<ShiftChangeRow>(CHANGES_SQL, [since, SYNC_CHANGES_MAX_SHIFTS + 1]),
  ]);

  const hasMore = changes.rows.length > SYNC_CHANGES_MAX_SHIFTS;
  const rows = hasMore ? changes.rows.slice(0, SYNC_CHANGES_MAX_SHIFTS) : changes.rows;
  const last = rows[rows.length - 1];
  return {
    cursor: (hasMore && last ? last.changed_at : clock.rows[0].cursor).toISOString(),
    hasMore,
    shifts: rows.map(toShiftChange),
  };
};
