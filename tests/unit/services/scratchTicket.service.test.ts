import { pool } from '@/config/database';
import { SCRATCH_DENOMINATIONS } from '@/constants/scratchTicket.constants';
import type { CreateScratchTicketReportInput } from '@/schemas/scratchTicket.schema';
import {
  createScratchTicketReport,
  findLatestScratchTicketReport,
} from '@/services/scratchTicket.service';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn(), connect: jest.fn() } }));

const poolQuery = jest.mocked(pool.query) as unknown as jest.Mock;
const connect = jest.mocked(pool.connect) as unknown as jest.Mock;
const clientQuery = jest.fn();
const release = jest.fn();

const input: CreateScratchTicketReportInput = {
  userId: 3,
  shiftNumber: 1,
  // $5 sells 10 + 5 - 3 = 12, every other price sells nothing.
  lines: SCRATCH_DENOMINATIONS.map((denomination) => ({
    denomination,
    openCount: denomination === 5 ? 10 : 0,
    closeCount: denomination === 5 ? 3 : 0,
    activationsCount: denomination === 5 ? 5 : 0,
  })),
};

const reportRow = {
  id: 7,
  user_id: 3,
  business_date: '2026-11-08',
  shift_number: 1,
  total_amount_cents: 6000,
};

const lineRow = {
  denomination: 5,
  open_count: 10,
  close_count: 3,
  activations_count: 5,
  sold_count: 12,
  amount: 6000,
};

describe('createScratchTicketReport', () => {
  beforeEach(() => {
    connect.mockResolvedValue({ query: clientQuery, release });
  });

  it('saves the header and lines in one transaction with calculated figures', async () => {
    clientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [reportRow] })
      .mockResolvedValueOnce({ rows: [lineRow] })
      .mockResolvedValueOnce({}); // COMMIT

    const report = await createScratchTicketReport(input);

    expect(report).toEqual({
      id: 7,
      userId: 3,
      businessDate: '2026-11-08',
      shiftNumber: 1,
      totalAmountCents: 6000,
      lines: [
        {
          denomination: 5,
          openCount: 10,
          closeCount: 3,
          activationsCount: 5,
          soldCount: 12,
          amountCents: 6000,
        },
      ],
    });
    expect(clientQuery.mock.calls[0][0]).toBe('BEGIN');
    expect(clientQuery.mock.calls[1][1]).toEqual([3, null, 1, 6000]);
    const lineParams = clientQuery.mock.calls[2][1] as unknown[];
    expect(lineParams[0]).toBe(7);
    expect(lineParams[1]).toEqual([...SCRATCH_DENOMINATIONS]);
    expect(lineParams[5]).toEqual(SCRATCH_DENOMINATIONS.map((d) => (d === 5 ? 12 : 0)));
    expect(lineParams[6]).toEqual(SCRATCH_DENOMINATIONS.map((d) => (d === 5 ? 6000 : 0)));
    expect(clientQuery.mock.calls[3][0]).toBe('COMMIT');
    expect(release).toHaveBeenCalled();
  });

  it.each([
    ['23503', 404],
    ['23505', 409],
    ['22008', 400],
  ])('rolls back and maps database error %s to HTTP %i', async (code, statusCode) => {
    clientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(Object.assign(new Error('db'), { code }))
      .mockResolvedValueOnce({}); // ROLLBACK

    await expect(createScratchTicketReport(input)).rejects.toMatchObject({ statusCode });
    expect(clientQuery).toHaveBeenLastCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalled();
  });
});

describe('findLatestScratchTicketReport', () => {
  it('returns null when nothing has been saved', async () => {
    poolQuery.mockResolvedValueOnce({ rows: [] });

    await expect(findLatestScratchTicketReport()).resolves.toBeNull();
    expect(poolQuery).toHaveBeenCalledTimes(1);
  });

  it('returns the latest report with its lines', async () => {
    poolQuery.mockResolvedValueOnce({ rows: [reportRow] }).mockResolvedValueOnce({
      rows: [lineRow],
    });

    const report = await findLatestScratchTicketReport();

    expect(report?.id).toBe(7);
    expect(report?.lines[0].closeCount).toBe(3);
    expect(poolQuery.mock.calls[1][1]).toEqual([7]);
  });
});
