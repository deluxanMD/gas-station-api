import {
  closeShiftBodySchema,
  consolidatedShiftsSchema,
  createShiftSchema,
} from '@/schemas/shift.schema';

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

describe('createShiftSchema', () => {
  const now = new Date('2026-01-10T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('still accepts just a user id', () => {
    expect(createShiftSchema.parse({ userId: 7 })).toEqual({ userId: 7 });
  });

  it('accepts a client id and a start time recorded offline', () => {
    const body = {
      userId: 7,
      clientId: '3f2b8c1e-6d4a-4b7e-9a10-5c2d8e7f1a90',
      startTime: '2026-01-08T08:00:00.000Z',
    };

    expect(createShiftSchema.parse(body)).toEqual(body);
  });

  it.each([
    { userId: 7, clientId: 'not-a-uuid' },
    { userId: 7, startTime: '2026-01-08' },
    { userId: 7, startTime: '2026-01-10T12:30:00.000Z' },
    { userId: 7, startTime: '2025-11-01T08:00:00.000Z' },
  ])('rejects %j', (body) => {
    expect(createShiftSchema.safeParse(body).success).toBe(false);
  });
});

describe('closeShiftBodySchema', () => {
  it('allows an empty body', () => {
    expect(closeShiftBodySchema.parse({})).toEqual({});
  });

  it('rejects an end time in the future', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();

    expect(closeShiftBodySchema.safeParse({ endTime: future }).success).toBe(false);
  });
});
