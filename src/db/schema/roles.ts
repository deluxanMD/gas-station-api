// `code` values are permanent identifiers the frontend relies on. Avoid renaming them; update the frontend if one changes.
export const ROLES = [
  { code: 'CASHIER', name: 'Cashier' },
  { code: 'SUPERVISOR', name: 'Supervisor' },
  { code: 'MANAGER', name: 'Manager' },
  { code: 'OWNER', name: 'Owner' },
  { code: 'DISPATCH', name: 'Dispatch' },
  { code: 'ACCOUNTING', name: 'Accounting' },
] as const;

export type RoleCode = (typeof ROLES)[number]['code'];

export const ROLE_CODES = ROLES.map((role) => role.code) as [RoleCode, ...RoleCode[]];

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
