// Values are the role codes stored in the database and carried in the token;
// the frontend relies on them, so avoid renaming them.
export enum UserRole {
  Cashier = 'CASHIER',
  Supervisor = 'SUPERVISOR',
  Manager = 'MANAGER',
  Owner = 'OWNER',
  Dispatch = 'DISPATCH',
  Accounting = 'ACCOUNTING',
}
