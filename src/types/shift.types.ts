import type { RoleCode } from '@/db/schema/roles';

export interface ShiftRow {
  id: number;
  user_id: number;
  start_time: Date;
  end_time: Date | null;
}

export interface ShiftWithUserRow extends ShiftRow {
  user_name: string;
}

export interface Shift {
  id: number;
  userId: number;
  startTime: string;
  endTime: string | null;
}

export interface ShiftsForDayFilter {
  date?: string;
  role?: RoleCode;
}

/** A shift together with the login name of the user who owns it. */
export interface ShiftWithUser extends Shift {
  userName: string;
}
