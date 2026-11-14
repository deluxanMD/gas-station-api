import { createFuelDeliverySchema } from '@/schemas/fuelDelivery.schema';

const valid = {
  shiftId: 1,
  userId: 2,
  deliveryDate: '2026-11-08',
  bolNumber: 'BOL-1001',
  reg: 5000,
  prem: 2000.5,
  diesel: 3000,
  total: 10000.5,
};

describe('createFuelDeliverySchema', () => {
  it('accepts a total equal to reg + prem + diesel', () => {
    expect(createFuelDeliverySchema.safeParse(valid).success).toBe(true);
  });

  it('is not thrown off by floating point noise in the sum', () => {
    const result = createFuelDeliverySchema.safeParse({
      ...valid,
      reg: 0.1,
      prem: 0.2,
      diesel: 0,
      total: 0.3,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a total that differs from the sum', () => {
    const result = createFuelDeliverySchema.safeParse({ ...valid, total: 10000.51 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['total']);
  });

  it.each([
    ['a blank BOL number', { bolNumber: '  ' }],
    ['a malformed date', { deliveryDate: '08/11/2026' }],
    ['a negative volume', { reg: -1, total: 4999.5 }],
    ['a non-positive shift id', { shiftId: 0 }],
  ])('rejects %s', (_name, override) => {
    expect(createFuelDeliverySchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it('defaults omitted volumes to 0', () => {
    const result = createFuelDeliverySchema.safeParse({
      shiftId: 1,
      userId: 2,
      deliveryDate: '2026-11-08',
      bolNumber: 'B',
    });

    expect(result.success && result.data.total).toBe(0);
  });
});
