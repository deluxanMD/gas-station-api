import { pool } from '@/config/database';
import { createFuelDip } from '@/services/fuelDip.service';
import { assertShiftOpen } from '@/services/shift.service';
import type { CreateFuelDipInput } from '@/schemas/fuelDip.schema';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('@/services/shift.service');

const query = jest.mocked(pool.query) as unknown as jest.Mock;

const input: CreateFuelDipInput = {
  shiftId: 1,
  userId: 2,
  dipDate: '2026-11-09',
  dipTime: '22:15',
  regularTcVolume: 1,
  regularUllage90: 2,
  premiumTcVolume: 3,
  premiumUllage90: 4,
  dieselTcVolume: 5,
  dieselUllage90: 6,
};

const row = {
  id: 9,
  shift_id: 1,
  user_id: 2,
  dip_date: '2026-11-09',
  dip_time: '22:15',
  tc_volume_regular: 1,
  ullage_90_regular: 2,
  tc_volume_premium: 3,
  ullage_90_premium: 4,
  tc_volume_diesel: 5,
  ullage_90_diesel: 6,
};

describe('createFuelDip', () => {
  beforeEach(() => {
    jest.mocked(assertShiftOpen).mockResolvedValue(undefined);
  });

  it('saves the row for an open shift and maps it back to camelCase', async () => {
    query.mockResolvedValue({ rows: [row] });

    await expect(createFuelDip(input)).resolves.toEqual({ id: 9, ...input });
    expect(assertShiftOpen).toHaveBeenCalledWith(1);
    expect(query.mock.calls[0][1]).toEqual([1, 2, '2026-11-09', '22:15', 1, 2, 3, 4, 5, 6]);
  });

  it('does not touch the database when the shift is closed', async () => {
    jest
      .mocked(assertShiftOpen)
      .mockRejectedValue(Object.assign(new Error('Shift is already closed'), { statusCode: 409 }));

    await expect(createFuelDip(input)).rejects.toMatchObject({ statusCode: 409 });
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    ['23503', 404],
    ['23505', 409],
    ['22008', 400],
  ])('maps database error %s to HTTP %i', async (code, statusCode) => {
    query.mockRejectedValue(Object.assign(new Error('db'), { code }));

    await expect(createFuelDip(input)).rejects.toMatchObject({ statusCode });
  });
});
