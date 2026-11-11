import { rolesSeed, rolesTable } from '@/db/schema/roles';
import { usersTable } from '@/db/schema/users';

// Order matters: list parent tables before tables that reference them, seeds after their table.
export const schema: readonly string[] = [rolesTable, rolesSeed, usersTable];
