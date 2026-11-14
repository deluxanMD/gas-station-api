import { LossAttribution } from '@/constants/lottoReconciliation.constants';
import { createLottoReconciliationSchema } from '@/schemas/lottoReconciliation.schema';

const valid = {
  shiftId: 1,
  userId: 2,
  bullock: 80_000,
  bullPayouts: 10_000,
  bullLottoWinner: 5000,
  lottoNet: 125_900,
  redeemNet: -15_000,
  activationsNet: -25_000,
  cashNet: -230,
  total: 85_670,
};

describe('createLottoReconciliationSchema', () => {
  it('accepts figures whose total adds up', () => {
    const result = createLottoReconciliationSchema.safeParse(valid);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.attribution).toBeNull();
  });

  it('accepts an attribution', () => {
    const result = createLottoReconciliationSchema.safeParse({
      ...valid,
      attribution: LossAttribution.Employee,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown attribution', () => {
    expect(
      createLottoReconciliationSchema.safeParse({ ...valid, attribution: 'BOSS' }).success,
    ).toBe(false);
  });

  it('rejects a total that differs from the sum of its parts', () => {
    expect(createLottoReconciliationSchema.safeParse({ ...valid, total: 0 }).success).toBe(false);
  });

  it('allows negative nets and a negative cash net', () => {
    const result = createLottoReconciliationSchema.safeParse({
      ...valid,
      lottoNet: -100,
      redeemNet: -100,
      activationsNet: -100,
      cashNet: -100,
      total: -400,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative Bull figure', () => {
    expect(createLottoReconciliationSchema.safeParse({ ...valid, bullock: -1 }).success).toBe(
      false,
    );
  });

  it('rejects fractional cents', () => {
    expect(createLottoReconciliationSchema.safeParse({ ...valid, cashNet: -230.5 }).success).toBe(
      false,
    );
  });

  it('rejects a non-positive shift id', () => {
    expect(createLottoReconciliationSchema.safeParse({ ...valid, shiftId: 0 }).success).toBe(false);
  });
});
