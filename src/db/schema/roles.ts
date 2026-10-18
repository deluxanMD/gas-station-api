// `code` values are permanent identifiers the frontend relies on. Never rename them.
export const ROLES = [
  { code: 'CASHIER_SITE_STAFF', name: 'Cashier / Site Staff' },
  { code: 'SITE_MANAGER', name: 'Site Manager' },
  { code: 'PRICING', name: 'Pricing' },
  { code: 'FUEL_DISPATCHER', name: 'Fuel Dispatcher' },
  { code: 'ACCOUNTING', name: 'Accounting' },
  { code: 'OWNER_EXECUTIVE', name: 'Owner / Executive' },
  { code: 'CUSTOMER_OWNER', name: 'Customer Owner' },
  { code: 'CUSTOMER_BOOKKEEPER', name: 'Customer Bookkeeper' },
  { code: 'ADMINISTRATOR', name: 'Administrator' },
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
