# Proposal: Multi-Tenant Authentication System

## Intent

Add authentication, multi-tenant data isolation, and role-based access control to pfmaster. The app currently has zero auth — all routes are open, all data is global. This change introduces **company**, **user**, and **session** tables, a login endpoint, Argon2id password hashing, role-based authorization (admin/employee), and database-backed session management. Cross-company data isolation is absolute; users within the same company (across locations) share visibility.

## Scope

### In Scope (Phase 1)
- `companies`, `users`, `sessions` tables (MySQL, no FK constraints, TINYINT enums)
- `POST /api/v1/auth/login` — email + password → session token
- `POST /api/v1/auth/logout` — invalidate session
- Auth middleware: validates session token, attaches `{ companyId, userId, role }` to `req`
- `company_id INT` column on: clients, pets, services, appointments, company_settings
- Migration: assign all existing rows `company_id = 1` (seed-created default company)
- Seed script: default company + default admin user (`admin@peluclic.com`)
- Password hashing: Argon2id (`argon2` npm package)

### Out of Scope
- `company_id` query filtering in existing repositories (Phase 2)
- User management UI (create/edit/delete users) — future change
- Password reset / email verification — future change
- `branch_id` / `location_id` — future change
- Public registration — no signup UI
- Frontend route guards (LoginPage scaffold only)

## Capabilities

### New Capabilities
- `multi-tenant-auth`: Company + user registration (seed only), login/logout with DB-backed sessions, Argon2id hashing, auth middleware attaching `companyId`/`userId`/`role` to Express requests, TINYINT role enum (0=admin, 1=employee).

### Modified Capabilities
- `services-api-backend`: All endpoints now require valid session (401 on missing/invalid token). No data-scoping changes yet.
- `appointment-backend`: Same auth gate applied to all routes.
- `pet-management-backend`: Same auth gate applied to all routes.
- `client-management-frontend`: Login page added. API calls include `Authorization` header. No route guards in Phase 1.

## Approach

**Architecture**: New `api/auth/` bounded context following existing Clean Architecture pattern (domain → application → interface → infrastructure). Constructor DI for all dependencies.

**Auth flow**:
1. `POST /api/v1/auth/login` — verify Argon2id hash, create session row with opaque token (UUID v4), return token + user info
2. Auth middleware (`api/auth/interface/authMiddleware.ts`) — extract `Authorization: Bearer <token>`, query sessions table (join users → company), attach `{ companyId, userId, role }` to `req`. On failure → 401.
3. All existing routers mounted AFTER auth middleware in `api/index.ts`
4. `POST /api/v1/auth/logout` — soft-delete session row

**Session model**: `sessions` table with `token VARCHAR(36) UNIQUE`, `user_id INT`, `company_id INT` (denormalized for fast middleware lookup), `expires_at DATETIME(3)`, `created_at`, `deleted_at`. Session duration: 24h (configurable via env).

**Migration strategy**: Single migration adding 3 new tables + `company_id` columns to 5 existing tables + seed. All existing rows → `company_id = 1`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add Company, User, Session models; `companyId` to existing models |
| `api/auth/` | **New** | Full bounded context (domain, application, interface, infrastructure) |
| `api/index.ts` | Modified | Wire auth router, apply auth middleware before existing routes |
| `api/db/migrations/` | **New** | Migration: 3 tables + seed + `company_id` columns |
| `src/pages/LoginPage.tsx` | **New** | Login form with email/password |
| `src/services/http.ts` | Modified | Attach `Authorization` header from stored token |
| `src/App.tsx` | Modified | Add login route; token storage (localStorage for now) |
| `.env.example` | Modified | Add `SESSION_DURATION_HOURS`, `ARGON2_MEMORY_COST` |

## Tradeoffs

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|-----------|
| Session storage | DB-backed `sessions` table | Stateless JWT | Instant revocation, active session auditing, no token blacklist complexity. User's explicit choice. |
| Password hashing | Argon2id | bcrypt | Post-quantum resistant (Grover's halves effective bits, Argon2's 128-bit salt space exceeds that), memory-hard against GPU attacks, NIST recommended. |
| CompanySettings vs Company table | Keep both, add `company_id` to `company_settings` | Merge into `companies` | `CompanySettings` is app-level config (work hours, language) — different domain from the tenant registry. Clear separation of concerns. |
| Phase 1 scope: columns only | Add `company_id` columns, skip query filtering | Full scoping in one change | De-risks the release; columns are the foundation. Query filtering is mechanical follow-up work across 5 bounded contexts, best done with focused review. |
| User ↔ Company relationship | `user.company_id` (one-to-many) | Many-to-many join table | v1 simplicity. If multi-company users needed later, add a `user_companies` join table without breaking existing FK-less references. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data leak if Phase 2 scoping delayed | Medium | Phase 2 ticket linked in ADR; `company_id` columns are the foundation, filtering is a focused follow-up |
| Argon2 build deps in Docker Alpine | Low | Add `gcc`/`make`/`python3` to Dockerfile; test build before merge |
| Login page exposes app before auth | Medium | Phase 1 only scaffolds LoginPage; full route guards deferred |
| CompanySettings `company_id` migration duplicates singleton | Low | Single-row table; `UPDATE company_settings SET company_id = 1` |

## Rollback Plan

1. Drop `sessions`, `users`, `companies` tables
2. Drop `company_id` columns from clients, pets, services, appointments, company_settings
3. Remove auth middleware + auth router from `api/index.ts`
4. Remove `argon2` from `package.json`
5. Revert `prisma/schema.prisma` additions

## Dependencies

- `argon2` npm package (post-quantum resistant, NIST recommended)
- Existing security middleware (helmet, cors, rate-limiting) — already active

## Success Criteria

- [ ] `POST /api/v1/auth/login` with valid credentials returns session token + user info (200)
- [ ] `POST /api/v1/auth/login` with wrong password returns 401
- [ ] Authenticated requests to `/api/v1/clients` succeed (200)
- [ ] Unauthenticated requests to any `/api/v1/*` route return 401
- [ ] `POST /api/v1/auth/logout` invalidates session; subsequent requests return 401
- [ ] Seed creates default company (id=1) + admin user
- [ ] All existing rows have `company_id = 1` after migration
- [ ] Session expires after configured duration
