import { createFuelSchema } from '@/schemas/fuel.schema';

const valid = {
  shiftId: 1,
  userId: 2,
  biodieselVolume: 100.25,
  biodieselTotal: 150,
  reg87Volume: 200.5,
  reg87Total: 300,
  extra89Volume: 10,
  extra89Total: 15,
  supr91Volume: 20,
  supr91Total: 30,
  plus93Volume: 0.1,
  plus93Total: 0.2,
  totalVolume: 330.85,
};

describe('createFuelSchema', () => {
  it('accepts a total volume equal to the sum of the grade volumes', () => {
    expect(createFuelSchema.safeParse(valid).success).toBe(true);
  });

  it('is not thrown off by floating point noise in the sum', () => {
    const result = createFuelSchema.safeParse({
      ...valid,
      biodieselVolume: 0.1,
      reg87Volume: 0.2,
      extra89Volume: 0,
      supr91Volume: 0,
      plus93Volume: 0,
      totalVolume: 0.3,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a total volume that differs from the sum', () => {
    const result = createFuelSchema.safeParse({ ...valid, totalVolume: 330.86 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['totalVolume']);
  });

  it('defaults omitted amounts to zero', () => {
    const result = createFuelSchema.parse({ shiftId: 1, userId: 2 });

    expect(result.reg87Total).toBe(0);
    expect(result.totalVolume).toBe(0);
  });

  it.each([{ shiftId: 0 }, { userId: 'x' }, { reg87Volume: -1 }])('rejects %j', (override) => {
    expect(createFuelSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
