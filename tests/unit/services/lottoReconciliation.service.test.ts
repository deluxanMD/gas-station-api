import { pool } from '@/config/database';
import { LossAttribution } from '@/constants/lottoReconciliation.constants';
import type { CreateLottoReconciliationInput } from '@/schemas/lottoReconciliation.schema';
import { createLottoReconciliation } from '@/services/lottoReconciliation.service';
import { assertShiftOpen } from '@/services/shift.service';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('@/services/shift.service');

const query = jest.mocked(pool.query) as unknown as jest.Mock;

const input: CreateLottoReconciliationInput = {
  shiftId: 1,
  userId: 2,
  bullock: 80_000,
  bullPayouts: 10_000,
  bullLottoWinner: 5000,
  lottoNet: 125_900,
  redeemNet: -15_000,
  activationsNet: -25_000,
  cashNet: -230,
  total: 85_670,
  attribution: LossAttribution.PreviousDay,
};

const row = {
  id: 9,
  shift_id: 1,
  user_id: 2,
  bullock: 80_000,
  bull_payouts: 10_000,
  bull_lotto_winner: 5000,
  lotto_net: 125_900,
  redeem_net: -15_000,
  activations_net: -25_000,
  cash_net: -230,
  total: 85_670,
  attribution: 'PREVIOUS_DAY',
};

describe('createLottoReconciliation', () => {
  beforeEach(() => {
    jest.mocked(assertShiftOpen).mockResolvedValue(undefined);
  });

  it('saves the row for an open shift and maps it back to camelCase', async () => {
    query.mockResolvedValue({ rows: [row] });

    await expect(createLottoReconciliation(input)).resolves.toEqual({
      id: 9,
      shiftId: 1,
      userId: 2,
      bullock: 80_000,
      bullPayouts: 10_000,
      bullLottoWinner: 5000,
      lottoNet: 125_900,
      redeemNet: -15_000,
      activationsNet: -25_000,
      cashNet: -230,
      total: 85_670,
      attribution: 'PREVIOUS_DAY',
    });
    expect(assertShiftOpen).toHaveBeenCalledWith(1, undefined);
    expect(query.mock.calls[0][1]).toEqual([
      1,
      2,
      80_000,
      10_000,
      5000,
      125_900,
      -15_000,
      -25_000,
      -230,
      85_670,
      'PREVIOUS_DAY',
    ]);
  });

  it('saves an unattributed reconciliation with a null attribution', async () => {
    query.mockResolvedValue({ rows: [{ ...row, attribution: null }] });

    const saved = await createLottoReconciliation({ ...input, attribution: null });

    expect(saved.attribution).toBeNull();
    expect(query.mock.calls[0][1]).toContain(null);
  });

  it('does not touch the database when the shift is closed', async () => {
    jest
      .mocked(assertShiftOpen)
      .mockRejectedValue(Object.assign(new Error('Shift is already closed'), { statusCode: 409 }));

    await expect(createLottoReconciliation(input)).rejects.toMatchObject({ statusCode: 409 });
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    ['23503', 404],
    ['23505', 409],
  ])('maps database error %s to HTTP %i', async (code, statusCode) => {
    query.mockRejectedValue(Object.assign(new Error('db'), { code }));

    await expect(createLottoReconciliation(input)).rejects.toMatchObject({ statusCode });
  });
});
