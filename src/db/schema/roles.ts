import { UserRole } from '@/constants/role.constants';

export const ROLES = [
  { code: UserRole.Cashier, name: 'Cashier' },
  { code: UserRole.Supervisor, name: 'Supervisor' },
  { code: UserRole.Manager, name: 'Manager' },
  { code: UserRole.Owner, name: 'Owner' },
  { code: UserRole.Dispatch, name: 'Dispatch' },
  { code: UserRole.Accounting, name: 'Accounting' },
] as const;

export type RoleCode = UserRole;

export const ROLE_CODES = Object.values(UserRole);

export const rolesTable = `
  CREATE TABLE IF NOT EXISTS roles (
    id         INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(50)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(50)
  )
`;

const values = ROLES.map((role) => `('${role.code}', '${role.name}')`).join(', ');

export const rolesSeed = `
  INSERT INTO roles (code, name) VALUES ${values}
  ON CONFLICT (code) DO NOTHING
`;
