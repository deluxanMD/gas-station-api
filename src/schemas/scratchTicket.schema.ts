import { z } from 'zod';
import { SCRATCH_DENOMINATIONS } from '@/constants/scratchTicket.constants';

const count = z.number().int().nonnegative();

// Only what the manager types. Sold, amount and the total are calculated by the service.
export const createScratchTicketReportSchema = z
  .object({
    userId: z.number().int().positive(),
    shiftNumber: z.number().int().positive(),
    // Defaults to today in the database when omitted.
    businessDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
      .optional(),
    lines: z.array(
      z.object({
        denomination: z.number().int().positive(),
        openCount: count,
        closeCount: count,
        activationsCount: count,
      }),
    ),
  })
  .superRefine((input, ctx) => {
    const seen = input.lines.map((line) => line.denomination).sort((a, b) => a - b);
    const expected = [...SCRATCH_DENOMINATIONS].sort((a, b) => a - b);
    if (seen.length !== expected.length || seen.some((value, i) => value !== expected[i])) {
      ctx.addIssue({
        code: 'custom',
        path: ['lines'],
        message: `Lines must cover each of $${expected.join(', $')} exactly once`,
      });
    }
    input.lines.forEach((line, index) => {
      if (line.closeCount > line.openCount + line.activationsCount) {
        ctx.addIssue({
          code: 'custom',
          path: ['lines', index, 'closeCount'],
          message: 'Close cannot exceed open + activations',
        });
      }
    });
  });

export type CreateScratchTicketReportInput = z.infer<typeof createScratchTicketReportSchema>;
