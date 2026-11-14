import { SCRATCH_DENOMINATIONS } from '@/constants/scratchTicket.constants';
import { createScratchTicketReportSchema } from '@/schemas/scratchTicket.schema';

const lines = SCRATCH_DENOMINATIONS.map((denomination) => ({
  denomination,
  openCount: 10,
  closeCount: 4,
  activationsCount: 2,
}));

const valid = { userId: 3, shiftNumber: 1, lines };

describe('createScratchTicketReportSchema', () => {
  it('accepts every denomination once', () => {
    expect(createScratchTicketReportSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts an explicit business date', () => {
    const result = createScratchTicketReportSchema.safeParse({
      ...valid,
      businessDate: '2026-11-08',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed business date', () => {
    expect(
      createScratchTicketReportSchema.safeParse({ ...valid, businessDate: '08/11/2026' }).success,
    ).toBe(false);
  });

  it('rejects a missing denomination', () => {
    expect(
      createScratchTicketReportSchema.safeParse({ ...valid, lines: lines.slice(1) }).success,
    ).toBe(false);
  });

  it('rejects a duplicated denomination', () => {
    const duplicated = [...lines.slice(1), lines[1]];
    expect(createScratchTicketReportSchema.safeParse({ ...valid, lines: duplicated }).success).toBe(
      false,
    );
  });

  it('rejects an unknown denomination', () => {
    const unknown = [{ ...lines[0], denomination: 15 }, ...lines.slice(1)];
    expect(createScratchTicketReportSchema.safeParse({ ...valid, lines: unknown }).success).toBe(
      false,
    );
  });

  it('rejects a close above open plus activations', () => {
    const bad = [{ ...lines[0], closeCount: 13 }, ...lines.slice(1)];
    const result = createScratchTicketReportSchema.safeParse({ ...valid, lines: bad });
    expect(result.success).toBe(false);
  });

  it('rejects negative and fractional counts', () => {
    const negative = [{ ...lines[0], openCount: -1 }, ...lines.slice(1)];
    const fractional = [{ ...lines[0], activationsCount: 1.5 }, ...lines.slice(1)];
    expect(createScratchTicketReportSchema.safeParse({ ...valid, lines: negative }).success).toBe(
      false,
    );
    expect(createScratchTicketReportSchema.safeParse({ ...valid, lines: fractional }).success).toBe(
      false,
    );
  });
});
