import { pool } from '@/config/database';
import { assertShiftOpen, closeShift, getCurrentShift } from '@/services/shift.service';

jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }));

const query = jest.mocked(pool.query) as unknown as jest.Mock;

const row = (endTime: Date | null): Record<string, unknown> => ({
  id: 5,
  user_id: 7,
  start_time: new Date('2026-01-01T08:00:00.000Z'),
  end_time: endTime,
});

describe('Shift service', () => {
  describe('getCurrentShift', () => {
    it('returns the open shift', async () => {
      query.mockResolvedValue({ rows: [row(null)] });

      await expect(getCurrentShift(7)).resolves.toEqual({
        id: 5,
        userId: 7,
        startTime: '2026-01-01T08:00:00.000Z',
        endTime: null,
      });
    });

    it('returns null when no shift is open', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(getCurrentShift(7)).resolves.toBeNull();
    });
  });

  describe('closeShift', () => {
    it('sets the end time on an open shift', async () => {
      query.mockResolvedValue({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      const shift = await closeShift(5);

      expect(shift.endTime).toBe('2026-01-01T16:00:00.000Z');
      expect(query).toHaveBeenCalledTimes(1);
      expect(query.mock.calls[0][0]).toContain('end_time IS NULL');
    });

    it('returns an already closed shift unchanged', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      const shift = await closeShift(5);

      expect(shift.endTime).toBe('2026-01-01T16:00:00.000Z');
    });

    it('responds 404 for an unknown shift', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(closeShift(99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('assertShiftOpen', () => {
    it('passes for an open shift', async () => {
      query.mockResolvedValue({ rows: [row(null)] });

      await expect(assertShiftOpen(5)).resolves.toBeUndefined();
    });

    it('responds 409 for a closed shift', async () => {
      query.mockResolvedValue({ rows: [row(new Date('2026-01-01T16:00:00.000Z'))] });

      await expect(assertShiftOpen(5)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('responds 404 for an unknown shift', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(assertShiftOpen(99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
