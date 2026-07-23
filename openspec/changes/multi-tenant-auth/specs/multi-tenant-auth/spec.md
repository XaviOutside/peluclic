# Multi-Tenant Auth Specification

## Purpose

Authentication and multi-tenant data isolation: company + user tables, login/logout with DB-backed sessions, Argon2id password hashing, auth middleware, and TINYINT role enums (0=admin, 1=employee).

## Requirements

### Requirement: Login (FR-AUTH-1)

`POST /api/v1/auth/login` — body: `{ email, password }`. The system MUST verify credentials via Argon2id, create a session row with UUID v4 token and 24h expiry (configurable via `SESSION_DURATION_HOURS`), and return 200 with `{ token, user: { id, email, role, companyId, companyName } }`. Invalid credentials MUST return 401. Role is mapped from TINYINT to string label in the response DTO.

#### Scenario: Valid credentials
- GIVEN user admin@peluclic.com with correct password
- WHEN `POST /api/v1/auth/login { email: "admin@peluclic.com", password: "correct" }`
- THEN 200, session created, response includes token (UUID v4) and user object with role="admin"

#### Scenario: Wrong password
- GIVEN valid email with incorrect password
- WHEN POST /api/v1/auth/login
- THEN 401 `{ error: "Invalid email or password" }`

#### Scenario: Unknown email
- GIVEN email not in users table
- WHEN POST /api/v1/auth/login
- THEN 401 `{ error: "Invalid email or password" }` (no email enumeration)

### Requirement: Logout (FR-AUTH-2)

`POST /api/v1/auth/logout` — MUST invalidate the session by setting `deleted_at = NOW()`. Returns 204 on success regardless of whether the token was already invalid (idempotent).

#### Scenario: Valid session
- GIVEN valid token in Authorization header
- WHEN POST /api/v1/auth/logout
- THEN session soft-deleted, 204 — subsequent requests with same token return 401

#### Scenario: Already invalidated
- GIVEN a token whose session is already soft-deleted
- WHEN POST /api/v1/auth/logout
- THEN 204 (idempotent — no error)

### Requirement: Auth Middleware (FR-AUTH-3)

Every `/api/v1/*` route except `/api/v1/auth/login` MUST require a valid `Authorization: Bearer <token>` header. The middleware SHALL extract the token, query `sessions` (joined with `users` for role/companyId), and attach `{ companyId, userId, role }` to `req`. On missing token, invalid token, or expired session → 401 `{ error: "Unauthorized" }`.

#### Scenario: Authenticated request passes through
- GIVEN valid token with active session
- WHEN any protected route is called
- THEN `req.companyId`, `req.userId`, `req.role` are populated; request proceeds

#### Scenario: Missing header
- GIVEN no Authorization header
- WHEN any protected route is called
- THEN 401 `{ error: "Unauthorized" }`

#### Scenario: Invalid token format
- GIVEN `Authorization: Bearer not-a-uuid` or `Authorization: Basic xxx`
- WHEN any protected route is called
- THEN 401 `{ error: "Unauthorized" }`

#### Scenario: Expired session
- GIVEN a token whose `sessions.expires_at < NOW()`
- WHEN any protected route is called
- THEN 401 `{ error: "Unauthorized" }`

### Requirement: Session Expiry (FR-AUTH-4)

Sessions MUST expire after 24 hours (configurable via `SESSION_DURATION_HOURS` env var). The middleware SHALL check `expires_at` and treat expired sessions identically to invalid ones (401). The `expires_at` column is `DATETIME(3) NOT NULL`.

#### Scenario: Session within expiry window
- GIVEN session created 23h ago, `SESSION_DURATION_HOURS=24`
- WHEN request is made with that token
- THEN request proceeds normally

#### Scenario: Session past expiry
- GIVEN session created 25h ago, `SESSION_DURATION_HOURS=24`
- WHEN request is made with that token
- THEN 401 `{ error: "Unauthorized" }`

### Requirement: Password Hashing (FR-AUTH-5)

Passwords MUST be hashed with Argon2id. Memory cost, iterations, and parallelism SHALL be configurable via `ARGON2_MEMORY_COST` (default 65536), `ARGON2_TIME_COST` (default 3), `ARGON2_PARALLELISM` (default 4). Hash output stored as `VARCHAR(255)`.

#### Scenario: Password stored as Argon2id hash
- GIVEN a new user with password "securePass123"
- WHEN the user is persisted
- THEN `users.password_hash` contains an Argon2id encoded string (~97 chars), not plaintext

### Requirement: Seed Data (FR-AUTH-6)

The migration MUST seed a default company (id=1, name="Default Company", status=1) and an admin user (email="admin@peluclic.com", role=0, company_id=1) with a hashed password. The seed SHALL be idempotent (INSERT IGNORE).

#### Scenario: Fresh database
- GIVEN an empty database
- WHEN migrations run
- THEN company id=1 and user admin@peluclic.com exist with role=admin

### Requirement: company_id Migration (FR-AUTH-7)

Migration MUST add `company_id INT NOT NULL DEFAULT 1` to clients, pets, services, appointments, and company_settings. Existing rows get `company_id = 1`. Columns follow project conventions: no FK, comment documenting relationship, plain INT.

#### Scenario: Existing rows assigned
- GIVEN 10 clients existed before migration
- WHEN migration runs
- THEN all 10 clients have company_id=1

### Requirement: Role Enum (FR-AUTH-8)

User roles SHALL use TINYINT: 0=admin (full access), 1=employee (operational access). The `users.role` column MUST be `TINYINT NOT NULL` with comment `0=admin, 1=employee`. Phase 2 will enforce role-based permissions.

#### Scenario: Role stored as TINYINT
- GIVEN an admin user
- WHEN queried from the database
- THEN `role` column is 0 (not a string)

### Requirement: Email Uniqueness (FR-AUTH-9)

Email MUST be globally unique across all companies. The `users.email` column SHALL have a `UNIQUE` index. Duplicate email on registration or update MUST return 409 `{ error: "Email already exists" }`.

#### Scenario: Duplicate email rejected
- GIVEN user with email "admin@peluclic.com" already exists
- WHEN another user is created with the same email
- THEN 409 `{ error: "Email already exists" }`

### Requirement: Password Constraints (FR-AUTH-10)

Passwords MUST be at least 8 characters. Validation SHALL run in the domain layer (pure function, no framework deps). Shorter passwords return 422 with a descriptive error.

#### Scenario: Password too short
- GIVEN password "abc123" (7 chars)
- WHEN validated
- THEN 422 `{ error: "Password must be at least 8 characters" }`

### Requirement: Domain Rules

| Rule | Enforcement |
|------|-------------|
| Sessions: UUID v4 token, 24h expiry | `VARCHAR(36) UNIQUE`, `expires_at DATETIME(3)` |
| Sessions: soft-delete on logout | `deleted_at DATETIME(3)` |
| Passwords: Argon2id, VARCHAR(255) | `argon2` npm package |
| Roles: TINYINT 0=admin, 1=employee | Domain type `UserRole = 0 \| 1` |
| Email: globally unique | `UNIQUE` index on `users.email` |
| No FK constraints | Design rule — enforced by omission |
| Timestamps: UTC, DATETIME(3) | Prisma `@default(now())` + `@updatedAt` |
| Clean Architecture | `api/auth/` bounded context: domain → application → interface → infrastructure |
| Company: status TINYINT 0=inactive, 1=active | Domain type `CompanyStatus = 0 \| 1` |
