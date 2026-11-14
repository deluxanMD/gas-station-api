import { pool } from '@/config/database';
import { LOTTO_AMOUNT_FIELDS, LottoSlipType } from '@/constants/lottoReport.constants';
import type { CreateLottoReportInput } from '@/schemas/lottoReport.schema';
import { createLottoReport, findLatestDayEndSlip } from '@/services/lottoReport.service';
import { assertShiftOpen } from '@/services/shift.service';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn(), connect: jest.fn() } }));
jest.mock('@/services/shift.service');

const poolQuery = jest.mocked(pool.query) as unknown as jest.Mock;
const connect = jest.mocked(pool.connect) as unknown as jest.Mock;
const clientQuery = jest.fn();
const release = jest.fn();

const zeroAmounts = Object.fromEntries(
  LOTTO_AMOUNT_FIELDS.map(({ field }) => [field, 0]),
) as CreateLottoReportInput['slips'][number]['amounts'];

const input: CreateLottoReportInput = {
  shiftId: 1,
  userId: 2,
  slips: Object.values(LottoSlipType).map((slipType) => ({
    slipType,
    reportDate: slipType === LottoSlipType.PreviousDay ? null : '2026-11-08',
    reportTime: slipType === LottoSlipType.PreviousDay ? null : '23:30',
    amounts: { ...zeroAmounts, onlineNetSales: 100_000 },
  })),
};

const slipRow = (slipType: string): Record<string, unknown> => ({
  slip_type: slipType,
  report_date: '2026-11-08',
  report_time: '23:30',
  ...Object.fromEntries(LOTTO_AMOUNT_FIELDS.map(({ column }) => [column, 0])),
  online_net_sales: 100_000,
});

describe('createLottoReport', () => {
  beforeEach(() => {
    jest.mocked(assertShiftOpen).mockResolvedValue(undefined);
    connect.mockResolvedValue({ query: clientQuery, release });
  });

  it('saves the report and every slip in one transaction', async () => {
    clientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 7, shift_id: 1, user_id: 2 }] });
    for (const slipType of Object.values(LottoSlipType)) {
      clientQuery.mockResolvedValueOnce({ rows: [slipRow(slipType)] });
    }
    clientQuery.mockResolvedValueOnce({}); // COMMIT

    const report = await createLottoReport(input);

    expect(assertShiftOpen).toHaveBeenCalledWith(1);
    expect(report.id).toBe(7);
    expect(report.slips.map((s) => s.slipType)).toEqual(Object.values(LottoSlipType));
    expect(report.slips[0].amounts.onlineNetSales).toBe(100_000);
    expect(Object.keys(report.slips[0].amounts)).toHaveLength(LOTTO_AMOUNT_FIELDS.length);

    expect(clientQuery.mock.calls[0][0]).toBe('BEGIN');
    expect(clientQuery.mock.calls[1][1]).toEqual([1, 2]);
    const slipParams = clientQuery.mock.calls[2][1] as unknown[];
    expect(slipParams.slice(0, 4)).toEqual([7, LottoSlipType.PreviousDay, null, null]);
    expect(slipParams).toHaveLength(4 + LOTTO_AMOUNT_FIELDS.length);
    expect(slipParams[4]).toBe(100_000);
    expect(clientQuery).toHaveBeenLastCalledWith('COMMIT');
    expect(release).toHaveBeenCalled();
  });

  it('does not open a transaction when the shift is closed', async () => {
    jest
      .mocked(assertShiftOpen)
      .mockRejectedValue(Object.assign(new Error('Shift is already closed'), { statusCode: 409 }));

    await expect(createLottoReport(input)).rejects.toMatchObject({ statusCode: 409 });
    expect(connect).not.toHaveBeenCalled();
  });

  it.each([
    ['23503', 404],
    ['23505', 409],
    ['22008', 400],
  ])('rolls back and maps database error %s to HTTP %i', async (code, statusCode) => {
    clientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(Object.assign(new Error('db'), { code }))
      .mockResolvedValueOnce({}); // ROLLBACK

    await expect(createLottoReport(input)).rejects.toMatchObject({ statusCode });
    expect(clientQuery).toHaveBeenLastCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalled();
  });
});

describe('findLatestDayEndSlip', () => {
  it('returns null when nothing has been saved', async () => {
    poolQuery.mockResolvedValueOnce({ rows: [] });

    await expect(findLatestDayEndSlip()).resolves.toBeNull();
  });

  it('returns the latest day-end slip', async () => {
    poolQuery.mockResolvedValueOnce({ rows: [slipRow(LottoSlipType.DayEnd)] });

    const slip = await findLatestDayEndSlip();

    expect(slip?.slipType).toBe(LottoSlipType.DayEnd);
    expect(slip?.amounts.onlineNetSales).toBe(100_000);
    expect(poolQuery.mock.calls[0][1]).toEqual([LottoSlipType.DayEnd]);
  });
});
