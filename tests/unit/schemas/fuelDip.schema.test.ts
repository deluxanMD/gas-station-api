import { createFuelDipSchema } from '@/schemas/fuelDip.schema';

const valid = {
  shiftId: 1,
  userId: 2,
  dipAt: '2026-11-09T16:45:00.000Z',
  regularTcVolume: 10000.5,
  regularUllage90: 2500,
  premiumTcVolume: 8000,
  premiumUllage90: 1000.25,
  dieselTcVolume: 12000,
  dieselUllage90: 3000,
};

describe('createFuelDipSchema', () => {
  it('accepts a complete reading', () => {
    expect(createFuelDipSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults omitted volumes to 0', () => {
    const result = createFuelDipSchema.safeParse({
      shiftId: 1,
      userId: 2,
      dipAt: '2026-11-09T00:00:00Z',
    });

    expect(result.success && result.data.dieselUllage90).toBe(0);
  });

  it.each([
    ['a date without a time', { dipAt: '2026-11-09' }],
    ['a time without an offset', { dipAt: '2026-11-09T22:15:00' }],
    ['an impossible date', { dipAt: '2026-02-31T10:00:00Z' }],
    ['a negative volume', { regularTcVolume: -1 }],
    ['a non-positive shift id', { shiftId: 0 }],
  ])('rejects %s', (_name, override) => {
    expect(createFuelDipSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
