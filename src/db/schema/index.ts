import { usersTable } from '@/db/schema/users';

// Order matters: list parent tables before tables that reference them.
export const schema: readonly string[] = [usersTable];
