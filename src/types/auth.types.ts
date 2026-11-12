import type { RoleCode } from '@/db/schema/roles';

export interface RegisterInput {
  userId: string;
  password: string;
  userRole: RoleCode;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface AuthenticatedUser {
  userId: string;
  userRole: RoleCode | null;
}

/** A verified user plus their `users.id`, which other tables (e.g. shift) reference. */
export interface LoginUser extends AuthenticatedUser {
  id: number;
}

export interface UserRow {
  id: number;
  user_id: string;
  password_hash: string;
  user_role: RoleCode | null;
}
