import { createFuelDipSchema } from '@/schemas/fuelDip.schema';

const valid = {
  shiftId: 1,
  userId: 2,
  dipDate: '2026-11-09',
  dipTime: '22:15',
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
      dipDate: '2026-11-09',
      dipTime: '00:00',
    });

    expect(result.success && result.data.dieselUllage90).toBe(0);
  });

  it.each([
    ['a malformed date', { dipDate: '09/11/2026' }],
    ['an out-of-range hour', { dipTime: '24:00' }],
    ['a time with seconds', { dipTime: '22:15:30' }],
    ['a negative volume', { regularTcVolume: -1 }],
    ['a non-positive shift id', { shiftId: 0 }],
  ])('rejects %s', (_name, override) => {
    expect(createFuelDipSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
