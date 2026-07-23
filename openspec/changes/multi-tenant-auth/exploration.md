## Exploration: Multi-Tenant Auth System (company + user tables, login, role, data isolation)

### Current State

**Authentication: NONE.** The entire application operates in single-user mode with zero auth. There is:
- No `user` table, no `company` table, no login endpoint, no session management
- No JWT, bcrypt, argon2, passport, or any auth library in `package.json`
- No auth middleware in `api/index.ts` — all routes are open
- The `RegisterPage.tsx` on the frontend is a placeholder ("coming soon" message in i18n), not functional
- The `CompanySettings` table (`prisma/schema.prisma` model `CompanySettings`, DB table `company_settings`) is a **singleton** — one row for the entire app, storing company name, workdays, work hours, language. It is NOT a multi-company table and serves a completely different purpose (app-level configuration, not tenant isolation)
- All existing entities (`Client`, `Pet`, `Service`, `Appointment`) have **no company/user ownership columns** — they are global/unscoped

**Database patterns established:**
- All tables use `InnoDB ENGINE`, `utf8mb4`, `utf8mb4_unicode_ci` collation
- Primary keys are `INT AUTO_INCREMENT`
- Timestamps: `created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)`, `updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
- Enums: `TINYINT` with documented value mappings in comments (e.g., `COMMENT '0=inactive, 1=active'`)
- **No FOREIGN KEY constraints** — referential integrity is enforced at the application layer. Foreign columns are plain `INT` with comments documenting the relationship
- Soft deletes: `deleted_at DATETIME(3) NULL`, all reads filter `WHERE deleted_at IS NULL`
- Indexes are created explicitly in migration SQL, not via Prisma `@@index` alone

**Clean Architecture layer pattern (per bounded context):**
```
api/{context}/
  domain/          — entities, value objects, repository interfaces, domain errors
  application/     — use cases (one class per use case, constructor-injected repository interface)
  interface/       — controller, Express router factory, request/response DTOs
  infrastructure/  — Prisma repository implementation
```

**Key conventions observed:**
- Repository interfaces are in `domain/` (e.g., `IClientRepository.ts`), implementations in `infrastructure/` (e.g., `PrismaClientRepository.ts`)
- Use cases receive the repository interface via constructor DI
- Controllers receive use cases via constructor DI
- Routers are created by factory functions (`createClientRouter(controller)`) that return Express `Router` instances
- Status enums are typed as const unions (`type ClientStatus = 0 | 1`) with named constants (`CLIENT_STATUS = { ACTIVE: 1, INACTIVE: 0 }`)
- DTOs map domain types to API shapes (TINYINT → human-readable string, Date → ISO 8601)
- Validation logic lives in the domain layer (pure functions, no framework deps)
- Domain errors extend `Error` class, controllers map them to HTTP status codes
- The `BaseEntity` interface (`api/shared/domain/BaseEntity.ts`) is minimal: `id: number; createdAt: Date; updatedAt: Date`

### Affected Areas

**NEW bounded contexts to create:**
- `api/auth/` — Auth bounded context (company + user management, login, session, multi-tenant middleware)
  - `api/auth/domain/` — Company entity, User entity, IAuthRepository, domain errors
  - `api/auth/application/` — RegisterCompany, RegisterUser, Login, Logout use cases
  - `api/auth/interface/` — AuthController, authRouter, DTOs
  - `api/auth/infrastructure/` — PrismaAuthRepository

**EXISTING files that MUST be modified:**
- `prisma/schema.prisma` — add `Company`, `User` models, add `company_id` to `Client`, `Pet`, `Service`, `Appointment` models
- `api/index.ts` — add auth router, add multi-tenant middleware (extract `company_id` from session/token and scope queries)
- `api/clients/domain/IClientRepository.ts` — scoping: `findAll`, `findById`, `search` signatures need `companyId` parameter OR middleware-level enforcement
- `api/clients/infrastructure/PrismaClientRepository.ts` — all queries must filter by `company_id`
- `api/pets/domain/IPetRepository.ts` — same scoping
- `api/pets/infrastructure/PrismaPetRepository.ts` — same scoping
- `api/services/domain/IServiceRepository.ts` — same scoping
- `api/services/infrastructure/PrismaServiceRepository.ts` — same scoping
- `api/appointments/domain/IAppointmentRepository.ts` — same scoping
- `api/appointments/infrastructure/PrismaAppointmentRepository.ts` — same scoping
- `api/clients/interface/ClientController.ts` — pass `companyId` to use cases
- `api/pets/interface/PetController.ts` — same
- `api/services/interface/ServiceController.ts` — same
- `api/appointments/interface/AppointmentController.ts` — same
- Every existing use case in all 5 bounded contexts — accept `companyId`
- `src/App.tsx` — add login route, protect dashboard routes
- `src/services/http.ts` — add auth token to request headers
- `.env.example` — add JWT secret, session config
- `docker-compose.yml` — no changes needed
- Frontend pages: new `LoginPage`, protected route wrapper

**Files NOT affected (or minimally):**
- `api/settings/domain/CompanySettings.ts` — keep as-is; this is app-level config, not tenant data
- `docker/my.cnf` — no changes needed
- Existing tests — will need updates for new `companyId` parameters

### Approaches

#### Approach A: Middleware-level tenant scoping (recommended)

**How it works**: Auth middleware extracts `company_id` from the authenticated session/JWT and attaches it to `req`. Every repository query automatically filters by `req.companyId`. Repositories receive `companyId` as a parameter (or read it from a request-scoped context).

- **Pros**:
  - Least invasive to existing code — repositories add one `WHERE company_id = ?` clause
  - Impossible to forget — the filter is always applied at the repository level
  - Easy to audit — grep for `company_id` to verify coverage
  - Follows existing patterns — use cases already receive injected dependencies
- **Cons**:
  - Every query changes (even if only by one clause)
  - Must ensure ALL queries in ALL repositories are covered (risk of data leak if one is missed)
  - Requires integration test coverage for every query path
- **Effort**: High (touches every bounded context)

#### Approach B: Row-Level Security via database views

**How it works**: Create MySQL views that include `company_id` filtering, and have repositories query views instead of tables. The view WHERE clause enforces isolation at the DB level.

- **Pros**:
  - Defense in depth — even if app code misses a filter, the DB view catches it
  - Single place to audit row-level security
- **Cons**:
  - MySQL views have performance overhead (no index pushdown in some cases)
  - Prisma doesn't support views natively — requires `$queryRaw` instead of type-safe queries
  - Violates project convention of using Prisma models directly
  - FTS queries through views are problematic
- **Effort**: High (rewrite all repository queries)

#### Approach C: Separate database per company (full tenant isolation)

**How it works**: Each company gets its own MySQL database. A "master" database holds the `company` and `user` tables plus routing info. Auth determines which DB to connect to.

- **Pros**:
  - Strongest isolation — impossible to leak data between tenants
  - Independent backup/restore per tenant
  - Scales horizontally
- **Cons**:
  - Massive architectural change — Prisma client per tenant, connection pool per tenant
  - Migration management becomes complex (run against N databases)
  - Overkill for v1 — this is a small-to-medium business app, not a SaaS with thousands of tenants
  - Violates "small-to-medium pet grooming businesses" project scope
- **Effort**: Very High (rewrite data access layer)

### Recommendation

**Approach A — Middleware-level tenant scoping.** This is the pragmatic choice that:
1. Matches the existing Clean Architecture pattern (constructor-injected dependencies)
2. Minimizes architectural disruption
3. Can be implemented incrementally (auth first, then scope each bounded context one at a time)
4. Is reversible/upgradeable — if the app grows to need per-DB isolation later, the `company_id` column is already there

**Implementation strategy**: Two-phase rollout.
- **Phase 1 (this change)**: Create `company` and `user` tables, implement registration, login, session management, and auth middleware. Add `company_id` FK-less reference columns to ALL existing entities. Run a migration that assigns existing data to a "default company" (backward compatibility).
- **Phase 2 (follow-up change)**: Add `company_id` filtering to every repository and use case in `clients`, `pets`, `services`, `appointments`.

### Key Technical Decisions

| Decision | Options Considered | Recommendation | Rationale |
|---|---|---|---|
| Post-quantum hashing algorithm | Argon2id, bcrypt (not PQ), SHA-3/Keccak, SPHINCS+ | **Argon2id** | User requested "post-quantum" — Argon2id is memory-hard and resistant to both GPU and quantum attacks (Grover's algorithm only halves effective bits, and Argon2's 128+ bit salt space exceeds that). ML-KEM (Kyber) / SPHINCS+ are signature schemes, not password hashing. Argon2id is the NIST-recommended password hashing algorithm. Install `argon2` npm package. |
| Session vs JWT | Express session (stateful), JWT (stateless), both | **JWT (stateless)** | Project already has no session store infrastructure. JWT avoids adding Redis/Memcached. Bearer token in `Authorization` header. For v1 single-company-per-user, a short-lived access token (15min) + refresh token (7 days) is sufficient. |
| Company ↔ user relationship | users belong to one company, users belong to many companies | **Many-to-many via join table** (deferred) | User said "users from company A" — implies users belong to one company for now. But the domain suggests employees might work across branches. **Recommendation**: start with `user.company_id` (one-to-many) for simplicity. If multi-company users are needed later, add a `user_companies` join table. |
| Existing CompanySettings vs new Company table | Rename CompanySettings, keep both, merge | **Keep both, with clear separation** | `CompanySettings` is app-level config (work hours, language) for the currently-logged-in company. The new `Company` table is a multi-tenant registry. When a user logs in, their `company_id` determines which settings row applies. At migration time, the existing singleton row is assigned to a default company. |
| Data migration for existing rows | Assign to default company, require manual reassignment, delete all data | **Assign to default company** | All existing `clients`, `pets`, `services`, `appointments` rows get `company_id = 1` (the default company created by the migration seed). This preserves existing demo/development data. |
| Password field column type | VARCHAR(255), VARBINARY, TEXT | **VARCHAR(255)** | Argon2id hashes are ~97 chars in encoded form (e.g., `$argon2id$v=19$m=65536,t=3,p=4$...`). 255 chars provides headroom for algorithm upgrades. |
| Email uniqueness scope | Global unique, per-company unique | **Global unique** | Email is the login identifier. It must be globally unique to avoid ambiguity during login. Users identify themselves by email, not by email+company. |

### Risks

- **HIGH — Data leak if scoping is missed on any query.** Every repository method that reads/writes data must include `company_id` filtering. A single missed query exposes cross-tenant data. Mitigation: comprehensive integration tests that verify isolation.
- **MEDIUM — Existing CompanySettings singleton breaks multi-tenancy.** Currently `GET /api/v1/settings` returns the global singleton. After multi-tenant auth, it must return settings for the logged-in user's company. The settings table needs a `company_id` column and a migration to duplicate the existing row per company (or link to the default company).
- **MEDIUM — Frontend auth state management.** The frontend currently has zero auth concepts — no protected routes, no token storage, no login redirect. This is significant frontend work that touches `App.tsx`, routing, the HTTP client, and potentially a global auth context/store.
- **LOW — Argon2id dependency.** Adding `argon2` as an npm dependency. For Docker Alpine images, `argon2` requires build tools (`gcc`, `make`, `python3`). The existing `Dockerfile` may need `apk add` for build dependencies.
- **LOW — Password reset flow.** The user only mentioned login. But users will inevitably need password reset. This should be scoped as a follow-up change, not part of initial auth implementation.

### Ready for Proposal

**Yes.** The gap analysis is clear:
1. There is zero auth infrastructure — we're building from scratch
2. The patterns and conventions are well-established across 5 bounded contexts — we know exactly how to follow them
3. The technical decisions (Argon2id, JWT, middleware scoping) are resolved
4. The main open question is scope: should Phase 1 include only the `company` + `user` tables with auth, or also the `company_id` column additions to existing entities? **Recommendation**: Phase 1 = auth tables + login + middleware. Phase 2 = scoping existing entities.

The orchestrator should confirm this scope split with the user before launching `sdd-propose`.
