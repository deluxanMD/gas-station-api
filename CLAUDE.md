# Gas Station API

REST API behind the Gas Station Portal desktop app (shifts, cash management, stock/dip readings). Built with Express 4 + TypeScript (strict) + PostgreSQL (`pg`, plain SQL, no ORM) + Zod, run with `tsx`, tested with Jest. Solo-developer project.

Reference material (specs, sketches, sample PDFs/spreadsheets) lives one level up in `../`. Read it when a task touches business rules. The frontend is `../gas-station-portal`; keep contracts in sync with it (see "API contract").

## Commands

- `npm run dev` — run with watch (`tsx watch src/server.ts`)
- `npm run type-check` — must pass before finishing a task
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run format` / `npm run format:check` — Prettier
- `npm test` — Jest unit tests (`test:watch`, `test:coverage` also exist)
- `npm run build` — clean + compile to `dist/`; `npm start` runs it

Always run `type-check`, `lint` and `test` after changes. Don't claim an endpoint works unless it was run against a real database (`npm run dev`) or says it was only unit-tested.

## Structure

Layered, one file per feature in each layer (`shift.routes.ts`, `shift.controller.ts`, …):

```
src/
  server.ts        # entry: listen, DB connect, graceful shutdown
  app.ts           # middleware stack + router mounted at /api/<API_VERSION>
  config/          # env.ts (validated env), database.ts (pg Pool)
  routes/          # URL → controller wiring only; registered in routes/index.ts
  controllers/     # parse + validate input, call a service, shape the response
  schemas/         # Zod schemas for request params/query/body
  services/        # business logic and all SQL
  types/           # interfaces/type aliases per feature (+ DB row shapes)
  constants/       # enums and constants (e.g. role.constants.ts)
  db/              # initSchema.ts + schema/ (table SQL, indexes, seeds)
  middlewares/     # error + not-found handlers
  utils/           # httpError, validationError, logger
tests/unit/        # mirrors src/ (controllers/, services/)
postman/           # Postman collections/environments
```

- Controllers never touch `pool`; services never touch `req`/`res`. SQL lives only in services.
- Import with the `@/` alias (maps to `src/`), never deep relative paths across layers.
- Adding an endpoint: schema → service → controller → route (→ register the router in `routes/index.ts` if it is a new feature) → types → tests → Postman collection when the feature has one.
- Order routes so fixed paths (`/current`, `/cashier`) come before `/:id`.

## Environment

- `src/config/env.ts` loads `.env.<NODE_ENV>` then `.env`, and validates with Zod. Add every new variable to the schema there **and** to `.env.example` (placeholders only, never real values).
- `.env*` files are gitignored except `.env.example`. Secrets (`DATABASE_URL`, `JWT_SECRET`) never go in the repo or logs.
- Read configuration through `env`, not `process.env` (the existing exceptions are the `NODE_ENV` checks in `app.ts`, `database.ts` and the error middleware).

## API contract

- All routes are under `/api/<API_VERSION>` (default `v1`). Resource paths are kebab-case plural nouns (`/shifts`, `/credit-totals`); JSON properties are camelCase.
- Success: `{ status: 'success', data, timestamp }` with `200`, or `201` when a resource is created. Errors: `{ status: 'error', statusCode, message, timestamp }`, produced only by the error middleware.
- Throw errors with `httpError(status, message)` (operational errors reach the client; anything else becomes a generic 500). Use `404` for unknown ids, `409` for state conflicts, `400` for validation. Never leak SQL or stack details to clients.
- Request shapes and response shapes are consumed by the portal. A breaking change (rename, removal, new required field) needs the portal updated in the same piece of work.
- Role codes and other values the frontend relies on are permanent identifiers; don't rename them.

## TypeScript

- `strict` stays on, plus `noImplicitReturns`. No `any`; use `unknown` and narrow. No `@ts-ignore` (use `@ts-expect-error` with a reason).
- Explicit return types on exported functions; `interface` for object shapes, `type` for unions and intersections.
- Interfaces and type aliases live in the relevant `src/types/<feature>.types.ts`, never inline in a service, controller or route. DB row shapes (e.g. `ShiftRow`) go there too. Re-export public ones from `src/types/index.ts`.
- Never hard-code a role code string (`'CASHIER'`, …). Use the `UserRole` enum from `src/constants/role.constants.ts`; if a needed enum or constant group doesn't exist yet, create it in `src/constants/` first. Same for other repeated magic values (statuses, limits).
- Use `import type` for type-only imports. Named exports; default export only for the router modules and `app`.

## Database

- PostgreSQL via the shared `pool` from `@/config/database`. Always use parameterized queries (`$1`, `$2`); never build SQL by string-concatenating user input.
- Table/column names are `snake_case`; map rows to camelCase objects in the service (`toShift`-style mappers). Define row types in `types/`.
- Every table has `created_at`, and `updated_at`/`updated_by` where rows can change. Use `TIMESTAMPTZ`; store and return ISO 8601 UTC, convert at the display edge (the portal does this). Be explicit about which time zone "today" means in a query.
- Schema is plain SQL strings in `src/db/schema/*.ts`, registered **in dependency order** in `schema/index.ts` (parents before children, seeds after their table). `initSchema` runs only outside production and is pre-release scaffolding; production needs real migrations before launch. Write new DDL idempotently (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).
- Enforce invariants in the database too (unique/partial indexes, foreign keys, checks), and handle the violation codes from `constants/database.constants.ts` (e.g. a race on the one-open-shift-per-user index).
- Multi-statement writes go in a transaction (`BEGIN`/`COMMIT`/`ROLLBACK`, release the client in `finally`).

## Domain rules

- Money: integer minor units (cents), never floats, in DB columns and JSON. Format only at the display edge (the portal).
- Fuel volumes: keep units explicit in names (`litres`, `dipMm`); no bare numbers.
- Records that affect cash or stock are append-only or audited; correct via adjustments, not silent edits.
- Closing an already closed shift succeeds (idempotent), so client retries are safe; keep write endpoints retry-safe where practical.
- A shift's business date is not necessarily its calendar date.

## Validation and security

- Validate every input (params, query, body) with a Zod schema in `src/schemas/` and `safeParse` in the controller; on failure `throw validationError(parsed.error)`. Never trust the client, including ids and roles.
- Use `z.coerce` for numeric query/param values; derive types from the schema (`z.infer`) when useful.
- Passwords are hashed with argon2; never log or return hashes, tokens or secrets.
- Tokens are JWTs signed with `JWT_SECRET` (`services/token.service.ts`). Every route except `/auth/*` and `/health/*` sits behind `requireAuth` (`middlewares/auth.middleware.ts`, bearer token, 401 otherwise), applied where the router is mounted in `routes/index.ts`. A new feature router must be mounted with `requireAuth`. The verified user is in `res.locals.user`. Authentication is enforced; per-role authorization is not yet, and the portal only hides UI by role, so endpoints that expose or change data should also check the caller's role, and any gap must be called out rather than silently copied.
- `helmet`, `cors` (origin from `CORS_ORIGIN`) and JSON body limits are set in `app.ts`; don't loosen them casually.
- Log with `utils/logger` (no `console.log`), with structured metadata, and never log request bodies containing credentials.

## Testing

- Jest + ts-jest, files under `tests/unit/**/*.test.ts`, mirroring `src/` (`tests/unit/services/shift.service.test.ts`). The `@/` alias works in tests.
- Highest priority: services with business rules and SQL mapping, and validation schemas. Mock only the boundary you don't own, e.g. `jest.mock('@/config/database', () => ({ pool: { query: jest.fn() } }))`; don't mock the code under test.
- Assert behaviour and the shape of the result, plus the important query parameters (e.g. role and date passed to SQL); cover the error paths (404/409/400) as well as the happy path.
- `restoreMocks` and `clearMocks` are on; set mock return values inside each test.
- Coverage thresholds are 70% (`test:coverage`, currently not enforced in CI). Use `supertest` for HTTP-level tests when a route's wiring matters.
- Unit tests don't prove SQL is correct; say so when a query was not run against Postgres.

## Git hooks and commits

Husky runs these automatically; never bypass with `--no-verify`. Fix the cause instead.

- `pre-commit` — `lint-staged` (ESLint `--fix` + Prettier on staged files), then `npm run type-check`.
- `commit-msg` — commitlint enforces Conventional Commits.
- `pre-push` — `npm test` and `npm run build`.

Commit format: `type(scope): subject`

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Scope optional, lowercase, names the feature (`shifts`, `auth`, `payouts`, `db`).
- Subject: imperative mood, lowercase start, no trailing period.
- Breaking changes: `!` after type/scope and a `BREAKING CHANGE:` footer.
- One logical change per commit.

## CI (GitHub Actions)

`.github/workflows/ci.yml` runs on pushes and pull requests to `main` and `dev`: lint + Prettier check, type-check, tests on Node 18/20/22, and a build. All must pass to merge. `release.yml` deploys on `v*.*.*` tags.

## Code style

- Prettier and ESLint are the source of truth (`.prettierrc`: single quotes, semicolons, 100 columns, trailing commas); don't hand-format or debate style.
- File names: `<feature>.<layer>.ts` in camelCase for the feature (`creditTotals.service.ts`, `dailySummaryReport.controller.ts`); constants as `<topic>.constants.ts`, types as `<feature>.types.ts`.
- Comments explain _why_, not what. Delete dead code instead of commenting it out.
- Handle errors explicitly at boundaries (DB, parsing); controllers wrap handlers in `try/catch` and forward to `next(error)`.

## Working agreements for Claude

- Match existing patterns before introducing new ones; ask before adding dependencies or restructuring.
- Make the smallest change that solves the task; no drive-by refactors.
- Don't touch `dist/` or `node_modules/`.
- Commit only when asked.
