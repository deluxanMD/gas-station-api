import { LOTTO_AMOUNT_FIELDS, LottoSlipType } from '@/constants/lottoReport.constants';
import { createLottoReportSchema } from '@/schemas/lottoReport.schema';

const amounts = Object.fromEntries(LOTTO_AMOUNT_FIELDS.map(({ field }) => [field, 0]));

const slips = Object.values(LottoSlipType).map((slipType) => ({
  slipType,
  reportDate: '2026-11-08',
  reportTime: '23:30',
  amounts,
}));

const valid = { shiftId: 1, userId: 2, slips };

describe('createLottoReportSchema', () => {
  it('accepts each slip type once', () => {
    expect(createLottoReportSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults a missing amount, date and time', () => {
    const bare = Object.values(LottoSlipType).map((slipType) => ({ slipType, amounts: {} }));
    const result = createLottoReportSchema.safeParse({ ...valid, slips: bare });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slips[0].amounts.onlineNetSales).toBe(0);
      expect(result.data.slips[0].reportDate).toBeNull();
      expect(result.data.slips[0].reportTime).toBeNull();
    }
  });

  it('allows a negative amount', () => {
    const negative = [
      { ...slips[0], amounts: { ...amounts, netPromotion: -250 } },
      ...slips.slice(1),
    ];
    expect(createLottoReportSchema.safeParse({ ...valid, slips: negative }).success).toBe(true);
  });

  it('rejects a missing slip type', () => {
    expect(createLottoReportSchema.safeParse({ ...valid, slips: slips.slice(1) }).success).toBe(
      false,
    );
  });

  it('rejects a duplicated slip type', () => {
    const duplicated = [...slips.slice(1), slips[1]];
    expect(createLottoReportSchema.safeParse({ ...valid, slips: duplicated }).success).toBe(false);
  });

  it('rejects an unknown slip type', () => {
    const unknown = [{ ...slips[0], slipType: 'WEEKLY' }, ...slips.slice(1)];
    expect(createLottoReportSchema.safeParse({ ...valid, slips: unknown }).success).toBe(false);
  });

  it('rejects fractional amounts', () => {
    const fractional = [
      { ...slips[0], amounts: { ...amounts, giftSales: 10.5 } },
      ...slips.slice(1),
    ];
    expect(createLottoReportSchema.safeParse({ ...valid, slips: fractional }).success).toBe(false);
  });

  it.each([
    ['reportDate', '08/11/2026'],
    ['reportTime', '25:00'],
    ['reportTime', '9:30'],
  ])('rejects a malformed %s', (field, value) => {
    const bad = [{ ...slips[0], [field]: value }, ...slips.slice(1)];
    expect(createLottoReportSchema.safeParse({ ...valid, slips: bad }).success).toBe(false);
  });
});
