import { UserRole } from '@/constants/role.constants';
import { pool } from '@/config/database';
import {
  assertShiftOpen,
  closeShift,
  consolidateShifts,
  getCurrentShift,
  getShiftsForDay,
} from '@/services/shift.service';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }));

const query = jest.mocked(pool.query) as unknown as jest.Mock;

const row = (endTime: Date | null): Record<string, unknown> => ({
  id: 5,
  user_id: 7,
  start_time: new Date('2026-01-01T08:00:00.000Z'),
  end_time: endTime,
});

describe('Shift service', () => {
  describe('getCurrentShift', () => {
    it('returns the open shift', async () => {
      query.mockResolvedValue({ rows: [row(null)] });

      await expect(getCurrentShift(7)).resolves.toEqual({
        id: 5,
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
          userId: 7,
          userName: 'cashier1',
          startTime: '2026-01-01T08:00:00.000Z',
          endTime: null,
        },
        {
          id: 6,
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
