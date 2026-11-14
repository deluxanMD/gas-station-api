import { consolidatedShiftsSchema } from '@/schemas/shift.schema';

describe('consolidatedShiftsSchema', () => {
  it('accepts shift ids and drops duplicates', () => {
    const parsed = consolidatedShiftsSchema.parse({ shiftIds: [1, 2, 2, 3] });

    expect(parsed.shiftIds).toEqual([1, 2, 3]);
  });

  it.each([{}, { shiftIds: [] }, { shiftIds: ['1'] }, { shiftIds: [0] }, { shiftIds: [1.5] }])(
    'rejects %j',
    (body) => {
      expect(consolidatedShiftsSchema.safeParse(body).success).toBe(false);
    },
  );
});
