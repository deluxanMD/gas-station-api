import { pool } from '@/config/database';
import { createFuel } from '@/services/fuel.service';
import { assertShiftOpen } from '@/services/shift.service';
import type { CreateFuelInput } from '@/schemas/fuel.schema';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('@/services/shift.service');

const query = jest.mocked(pool.query) as unknown as jest.Mock;

const input: CreateFuelInput = {
  shiftId: 1,
  userId: 2,
  biodieselVolume: 1,
  biodieselTotal: 2,
  reg87Volume: 3,
  reg87Total: 4,
  extra89Volume: 5,
  extra89Total: 6,
  supr91Volume: 7,
  supr91Total: 8,
  plus93Volume: 9,
  plus93Total: 10,
  totalVolume: 25,
};

const row = {
  id: 9,
  shift_id: 1,
  user_id: 2,
  volume_biodiesel: 1,
  total_biodiesel: 2,
  volume_reg_87: 3,
  total_reg_87: 4,
  volume_extra_89: 5,
  total_extra_89: 6,
  volume_supr_91: 7,
  total_supr_91: 8,
  volume_plus_93: 9,
  total_plus_93: 10,
  total_volume: 25,
};

describe('createFuel', () => {
  beforeEach(() => {
    jest.mocked(assertShiftOpen).mockResolvedValue(undefined);
  });

  it('saves the row for an open shift and maps it back to camelCase', async () => {
    query.mockResolvedValue({ rows: [row] });

    await expect(createFuel(input)).resolves.toEqual({ id: 9, ...input });
    expect(assertShiftOpen).toHaveBeenCalledWith(1);
    expect(query.mock.calls[0][1]).toEqual([1, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25]);
  });

  it('does not touch the database when the shift is closed', async () => {
    jest
      .mocked(assertShiftOpen)
      .mockRejectedValue(Object.assign(new Error('Shift is already closed'), { statusCode: 409 }));

    await expect(createFuel(input)).rejects.toMatchObject({ statusCode: 409 });
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    ['23503', 404],
    ['23505', 409],
  ])('maps database error %s to HTTP %i', async (code, statusCode) => {
    query.mockRejectedValue(Object.assign(new Error('db'), { code }));

    await expect(createFuel(input)).rejects.toMatchObject({ statusCode });
  });
});
