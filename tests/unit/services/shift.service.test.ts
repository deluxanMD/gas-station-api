import { UserRole } from '@/constants/role.constants';
import { pool } from '@/config/database';
import {
  assertShiftOpen,
  closeShift,
  consolidateShifts,
  createShift,
  getShiftChanges,
  getShiftIdByClientId,
  getCurrentShift,
  getShiftsForDay,
} from '@/services/shift.service';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }));

const query = jest.mocked(pool.query) as unknown as jest.Mock;

const CLIENT_ID = '3f2b8c1e-6d4a-4b7e-9a10-5c2d8e7f1a90';

const row = (endTime: Date | null): Record<string, unknown> => ({
  id: 5,
  client_id: null,
  user_id: 7,
  start_time: new Date('2026-01-01T08:00:00.000Z'),
  end_time: endTime,
});

describe('getShiftChanges', () => {
  const changeRow = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    ...row(null),
    user_name: 'cashier1',
    changed_at: new Date('2026-01-01T09:00:00.000Z'),
    has_credit_totals: true,
    has_daily_summary: false,
    has_payouts: false,
    has_fuel: false,
    has_fuel_delivery: false,
    has_fuel_dip: false,
    has_lotto_report: false,
    has_lotto_reconciliation: false,
    ...overrides,
  });

  const respond = (changes: Record<string, unknown>[]): void => {
    query.mockImplementation((sql: string) =>
      sql.includes('AS cursor')
        ? Promise.resolve({ rows: [{ cursor: new Date('2026-01-01T12:00:00.000Z') }] })
        : Promise.resolve({ rows: changes }),
    );
  };

  it('maps the shifts with which records they have and a cursor behind the server clock', async () => {
    respond([changeRow()]);

    const result = await getShiftChanges('2026-01-01T00:00:00.000Z');

    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBe('2026-01-01T12:00:00.000Z');
    expect(result.shifts[0]).toMatchObject({
      id: 5,
      userName: 'cashier1',
      changedAt: '2026-01-01T09:00:00.000Z',
      records: { creditTotals: true, payouts: false },
    });
  });

  it('asks for one row more than the cap and passes since to SQL', async () => {
    respond([]);

    await getShiftChanges('2026-01-01T00:00:00.000Z');

    const changesCall = query.mock.calls.find(([sql]) => !String(sql).includes('AS cursor'));
    expect(changesCall?.[1]).toEqual(['2026-01-01T00:00:00.000Z', 501]);
  });

  it('truncates at the cap and continues from the last change returned', async () => {
    const rows = Array.from({ length: 501 }, (_, i) =>
      changeRow({ id: i + 1, changed_at: new Date(Date.UTC(2026, 0, 1, 0, 0, i)) }),
    );
    respond(rows);

    const result = await getShiftChanges('2025-12-31T00:00:00.000Z');

    expect(result.hasMore).toBe(true);
    expect(result.shifts).toHaveLength(500);
    expect(result.cursor).toBe(new Date(Date.UTC(2026, 0, 1, 0, 0, 499)).toISOString());
  });
});

describe('Shift service', () => {
  describe('getCurrentShift', () => {
    it('returns the open shift', async () => {
      query.mockResolvedValue({ rows: [row(null)] });

      await expect(getCurrentShift(7)).resolves.toEqual({
        id: 5,
        clientId: null,
        userId: 7,
        startTime: '2026-01-01T08:00:00.000Z',
        endTime: null,
      });
    });

    it('returns null when no shift is open', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(getCurrentShift(7)).resolves.toBeNull();
    });
  });

  describe('getShiftsForDay', () => {
    it('maps the rows with the owner name', async () => {
      query.mockResolvedValue({
        rows: [
          { ...row(null), user_name: 'cashier1' },
          { ...row(new Date('2026-01-01T16:00:00.000Z')), id: 6, user_name: 'cashier2' },
        ],
      });

      const shifts = await getShiftsForDay();

      expect(shifts).toEqual([
        {
          id: 5,
          clientId: null,
          userId: 7,
          userName: 'cashier1',
          startTime: '2026-01-01T08:00:00.000Z',
          endTime: null,
        },
        {
          id: 6,
          clientId: null,
          userId: 7,
          userName: 'cashier2',
          startTime: '2026-01-01T08:00:00.000Z',
          endTime: '2026-01-01T16:00:00.000Z',
        },
      ]);
    });

    it('applies no role filter and defaults to today when given no filter', async () => {
      query.mockResolvedValue({ rows: [] });

      await getShiftsForDay();

      expect(query.mock.calls[0][1]).toEqual([null, null]);
    });

    it('filters on the given role and day', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(
        getShiftsForDay({ role: UserRole.Cashier, date: '2026-01-01' }),
      ).resolves.toEqual([]);
      expect(query.mock.calls[0][1]).toEqual(['CASHIER', '2026-01-01']);
    });
  });

  describe('createShift', () => {
    it('returns the shift already created under the client id without inserting', async () => {
      query.mockResolvedValue({ rows: [{ ...row(null), client_id: CLIENT_ID }] });

      const result = await createShift({ userId: 7, clientId: CLIENT_ID });

      expect(result).toMatchObject({ created: false, shift: { id: 5, clientId: CLIENT_ID } });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('responds 409 when the client id belongs to another user', async () => {
      query.mockResolvedValue({ rows: [{ ...row(null), client_id: CLIENT_ID, user_id: 8 }] });

      await expect(createShift({ userId: 7, clientId: CLIENT_ID })).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('inserts with the client id and the device start time', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ ...row(null), client_id: CLIENT_ID }] });

      const result = await createShift({
        userId: 7,
        clientId: CLIENT_ID,
        startTime: '2026-01-01T08:00:00.000Z',
      });

      expect(result.created).toBe(true);
      expect(query.mock.calls[2][1]).toEqual([7, CLIENT_ID, '2026-01-01T08:00:00.000Z']);
    });

    it('defaults the start time to now when the device sends none', async () => {
      query.mockResolvedValue({ rows: [] }).mockResolvedValueOnce({ rows: [] });
      query.mockResolvedValueOnce({ rows: [row(null)] });

      await createShift({ userId: 7 });

      expect(query.mock.calls[1][1]).toEqual([7, null, null]);
    });

    it('attaches the client id to the open shift started without one', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [row(null)] })
        .mockResolvedValueOnce({ rows: [{ ...row(null), client_id: CLIENT_ID }] });

      const result = await createShift({ userId: 7, clientId: CLIENT_ID });

      expect(result).toMatchObject({ created: false, shift: { clientId: CLIENT_ID } });
      expect(query.mock.calls[2][0]).toContain('client_id IS NULL');
    });

    it('returns the winner of a race on the unique indexes', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce({ code: '23505' })
        .mockResolvedValueOnce({ rows: [{ ...row(null), client_id: CLIENT_ID }] });

      const result = await createShift({ userId: 7, clientId: CLIENT_ID });

      expect(result).toMatchObject({ created: false, shift: { id: 5 } });
    });
  });

  describe('getShiftIdByClientId', () => {
    it('returns the server id', async () => {
      query.mockResolvedValue({ rows: [{ ...row(null), client_id: CLIENT_ID }] });

      await expect(getShiftIdByClientId(CLIENT_ID)).resolves.toBe(5);
    });

    it('responds 404 for an unknown client id', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(getShiftIdByClientId(CLIENT_ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('closeShift', () => {
    it('sets the end time on an open shift', async () => {
      query.mockResolvedValue({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      const shift = await closeShift(5);

      expect(shift.endTime).toBe('2026-01-01T16:00:00.000Z');
      expect(query).toHaveBeenCalledTimes(1);
      expect(query.mock.calls[0][0]).toContain('end_time IS NULL');
    });

    it('returns an already closed shift unchanged', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      const shift = await closeShift(5);

      expect(shift.endTime).toBe('2026-01-01T16:00:00.000Z');
    });

    it('ends the shift at the time the device recorded', async () => {
      query.mockResolvedValue({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      await closeShift(5, '2026-01-01T16:00:00.000Z');

      expect(query.mock.calls[0][1]).toEqual([5, '2026-01-01T16:00:00.000Z']);
    });

    it('responds 400 when the end time is before the start', async () => {
      query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [row(null)] });

      await expect(closeShift(5, '2025-12-31T00:00:00.000Z')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('responds 404 for an unknown shift', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(closeShift(99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('assertShiftOpen', () => {
    it('passes for an open shift', async () => {
      query.mockResolvedValue({ rows: [row(null)] });

      await expect(assertShiftOpen(5)).resolves.toBeUndefined();
    });

    it('responds 409 for a closed shift', async () => {
      query.mockResolvedValue({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      await expect(assertShiftOpen(5)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('accepts a record made before the shift ended', async () => {
      query.mockResolvedValue({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      await expect(assertShiftOpen(5, '2026-01-01T15:59:00.000Z')).resolves.toBeUndefined();
    });

    it('rejects a record made after the shift ended', async () => {
      query.mockResolvedValue({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      await expect(assertShiftOpen(5, '2026-01-01T16:01:00.000Z')).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('responds 404 for an unknown shift', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(assertShiftOpen(99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});

const totalsRow = {
  credit_terminal: '10050',
  credit_total: '10050',
  debit_terminal: '4525',
  fleet: '0',
  sv_redemption: '500',
  fuel_sales: '600000',
  item_sales: '300000',
  gst: '45000',
  hst: '0',
  penny_rounding: '-2',
  total_sales: '944998',
  total_pos: '100000',
  total_payouts: '12250',
  lotto_winner: '2500',
  gift_certificates: '0',
  redemptions: '0',
  safedrops: '20000',
  cash_on_hand: '57730',
};

describe('consolidateShifts', () => {
  it('returns the summed figures in cents, grouped by section', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({ rows: [totalsRow] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] });

    const result = await consolidateShifts([1, 2]);

    expect(result).toEqual({
      shiftIds: [1, 2],
      incompleteShiftIds: [2],
      creditTotals: {
        creditTerminalCents: 10050,
        creditTotalCents: 10050,
        debitTerminalCents: 4525,
        fleetCents: 0,
        svRedemptionCents: 500,
      },
      dailySummary: {
        fuelSalesCents: 600000,
        itemSalesCents: 300000,
        gstCents: 45000,
        hstCents: 0,
        pennyRoundingCents: -2,
        totalSalesCents: 944998,
      },
      payoutsAndCash: {
        totalPosCents: 100000,
        totalPayoutsCents: 12250,
        lottoWinnerCents: 2500,
        giftCertificatesCents: 0,
        redemptionsCents: 0,
        safedropsCents: 20000,
        cashOnHandCents: 57730,
      },
    });
  });

  it('sums rounded cents in SQL for the requested shifts only', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [totalsRow] })
      .mockResolvedValueOnce({ rows: [] });

    await consolidateShifts([1]);

    const [sql, params] = query.mock.calls[1];
    expect(sql).toContain('ROUND(credit_terminal * 100)');
    expect(sql).toContain('shift_id = ANY($1::int[])');
    expect(params).toEqual([[1]]);
  });

  it('responds 404 when a shift does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await expect(consolidateShifts([1, 99])).rejects.toMatchObject({ statusCode: 404 });
    expect(query).toHaveBeenCalledTimes(1);
  });
});
