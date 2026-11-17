import { syncChangesQuerySchema } from '@/schemas/sync.schema';

describe('syncChangesQuerySchema', () => {
  it('accepts a recent instant', () => {
    const since = new Date(Date.now() - 3_600_000).toISOString();

    expect(syncChangesQuerySchema.parse({ since })).toEqual({ since });
  });

  it.each([{}, { since: 'yesterday' }, { since: '2020-01-01T00:00:00.000Z' }])(
    'rejects %j',
    (query) => {
      expect(syncChangesQuerySchema.safeParse(query).success).toBe(false);
    },
  );
});
