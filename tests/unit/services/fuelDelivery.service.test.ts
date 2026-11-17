import { pool } from '@/config/database';
import { createFuelDelivery } from '@/services/fuelDelivery.service';
import { assertShiftOpen } from '@/services/shift.service';
import type { CreateFuelDeliveryInput } from '@/schemas/fuelDelivery.schema';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('@/services/shift.service');

const query = jest.mocked(pool.query) as unknown as jest.Mock;

const input: CreateFuelDeliveryInput = {
  shiftId: 1,
  userId: 2,
  deliveryDate: '2026-11-08',
  bolNumber: 'BOL-1001',
  reg: 5000,
  prem: 2000.5,
  diesel: 3000,
  total: 10000.5,
};

const row = {
  id: 9,
  shift_id: 1,
  user_id: 2,
  delivery_date: '2026-11-08',
  bol_number: 'BOL-1001',
  reg: 5000,
  prem: 2000.5,
  diesel: 3000,
  total: 10000.5,
};

describe('createFuelDelivery', () => {
  beforeEach(() => {
    jest.mocked(assertShiftOpen).mockResolvedValue(undefined);
  });

  it('saves the row for an open shift and maps it back to camelCase', async () => {
    query.mockResolvedValue({ rows: [row] });

    await expect(createFuelDelivery(input)).resolves.toEqual({
      id: 9,
      shiftId: 1,
      userId: 2,
      deliveryDate: '2026-11-08',
      bolNumber: 'BOL-1001',
      reg: 5000,
      prem: 2000.5,
      diesel: 3000,
      total: 10000.5,
    });
    expect(assertShiftOpen).toHaveBeenCalledWith(1, undefined);
    expect(query.mock.calls[0][1]).toEqual([
      1,
      2,
      '2026-11-08',
      'BOL-1001',
      5000,
      2000.5,
      3000,
      10000.5,
    ]);
  });

  it('does not touch the database when the shift is closed', async () => {
    jest
      .mocked(assertShiftOpen)
      .mockRejectedValue(Object.assign(new Error('Shift is already closed'), { statusCode: 409 }));

    await expect(createFuelDelivery(input)).rejects.toMatchObject({ statusCode: 409 });
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    ['23503', 404],
    ['23505', 409],
    ['22008', 400],
  ])('maps database error %s to HTTP %i', async (code, statusCode) => {
    query.mockRejectedValue(Object.assign(new Error('db'), { code }));

    await expect(createFuelDelivery(input)).rejects.toMatchObject({ statusCode });
  });
});
