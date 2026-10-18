import type { RoleCode } from '@/db/schema/roles';

export interface RegisterInput {
  userId: string;
  password: string;
  userRole: RoleCode;
  updatedAt?: string | null;
  updatedBy?: string | null;
}
