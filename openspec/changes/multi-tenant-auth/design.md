# Design: Multi-Tenant Authentication System (Phase 1)

## Technical Approach

New `api/auth/` bounded context following existing Clean Architecture patterns: constructor DI, domain errors → HTTP status mapping, Prisma repository layer. DB-backed sessions (UUID v4, 24h TTL) with Argon2id hashing. Global auth middleware validates every `/api/v1/*` request, attaching `{ companyId, userId, role }` to `req`. Phase 1 adds `company_id` columns (default=1 seed) to 5 tables but defers query filtering to Phase 2.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|----------|--------|-------------|-----------|
| Repository design | Single `IAuthRepository` | Split `IUserRepository` + `ISessionRepository` | Login touches both tables; single repo avoids leaky abstraction across bounded context boundary |
| Session token | `crypto.randomUUID()` | JWT, timestamp+nonce | 122-bit CSPRNG entropy, no library dependency, 36-char VARCHAR fits index efficiently |
| Login rate limit | 5 req/15min per IP (dedicated) | Reuse global 100/15min | Brute-force protection; global limiter too permissive for auth endpoint |
| Password validation placement | `LoginUseCase.execute()` | Domain entity constructor | Follows existing pattern (CreateClient validates in use case, not entity) |
| Middleware `req` augmentation | Express declaration merging on `Request` | Custom `AuthenticatedRequest` type | Existing patterns use plain `Request`; merging avoids forcing type casts in every controller |

## Data Flow

### Login
```
POST /api/v1/auth/login
  → AuthController.login(req, res)
    → LoginUseCase.execute(email, password)
      → IAuthRepository.findUserByEmail → null? throw InvalidCredentialsError
      → IPasswordService.verify(plaintext, hash) → false? throw InvalidCredentialsError
      → IAuthRepository.createSession(userId, companyId, expiresAt)
    ← { token, user: { id, email, role, companyId, companyName } }
  ← 200 { token, user }
```

### Middleware (per-request)
```
req.headers.authorization
  → extract Bearer token → missing? → 401
  → IAuthRepository.findValidSession(token)
    → SELECT s.*, u.id, u.role, c.name FROM sessions s
       JOIN users u ON s.user_id = u.id JOIN companies c ON s.company_id = c.id
       WHERE s.token = ? AND s.deleted_at IS NULL AND s.expires_at > NOW()
    → null? → 401
  ← req.companyId, req.userId, req.role set → next()
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/auth/domain/Company.ts` | Create | `CompanyStatus` (0=inactive,1=active), `Company` interface |
| `api/auth/domain/User.ts` | Create | `UserRole` (0=admin,1=employee), `UserStatus`, `User` interface |
| `api/auth/domain/Session.ts` | Create | `Session`, `SessionWithUser` (for middleware — includes userId, role, companyId, companyName) |
| `api/auth/domain/AuthErrors.ts` | Create | `InvalidCredentialsError` (401), `SessionExpiredError` (401), `SessionNotFoundError` (401) |
| `api/auth/domain/IAuthRepository.ts` | Create | `findUserByEmail`, `createSession`, `findValidSession`, `invalidateSession` |
| `api/auth/domain/IPasswordService.ts` | Create | `hash(plaintext): Promise<string>`, `verify(plaintext, hash): Promise<boolean>` |
| `api/auth/application/LoginUseCase.ts` | Create | Constructor(repo, passwordSvc, sessionDurationHours); execute(email, password) → `{ token, user }` |
| `api/auth/application/LogoutUseCase.ts` | Create | Constructor(repo); execute(token) → void (soft-delete session) |
| `api/auth/interface/AuthController.ts` | Create | Constructor(loginUC, logoutUC); login(req,res), logout(req,res); maps domain errors → 401/422/500 |
| `api/auth/interface/authRouter.ts` | Create | `createAuthRouter(controller)` → Router (POST /login, /logout) |
| `api/auth/interface/authMiddleware.ts` | Create | `createAuthMiddleware(repo)` → Express middleware; Bearer token extraction, session validation, req augmentation |
| `api/auth/interface/dtos/LoginRequestDto.ts` | Create | `{ email: string, password: string }` |
| `api/auth/interface/dtos/LoginResponseDto.ts` | Create | `{ token, user }` + `toLoginResponseDto()` mapper (role TINYINT → string) |
| `api/auth/infrastructure/PrismaAuthRepository.ts` | Create | Prisma implementation; JOIN query for `findValidSession`; Prisma model → domain entity mapping |
| `api/auth/infrastructure/Argon2PasswordService.ts` | Create | `argon2.hash(plain, { type: argon2id, hashLength: 32, memoryCost: env })`; `argon2.verify(hash, plain)` |
| `prisma/schema.prisma` | Modify | Add `Company`, `User`, `Session` models; add `companyId Int @default(1)` to Client, Pet, Service, Appointment, CompanySettings |
| `prisma/migrations/*/migration.sql` | Create | 3 CREATE + 5 ALTER + seed (company id=1, admin user) |
| `prisma/seed.ts` | Modify | Create default company + admin user (argon2 hash of seed password) |
| `api/index.ts` | Modify | Import auth deps; add `'Authorization'` to CORS `allowedHeaders`; apply auth-specific rate limiter; apply `authMiddleware` + `authRouter` BEFORE existing routes |
| `package.json` | Modify | Add `argon2` dependency |
| `src/pages/LoginPage.tsx` | Create | Email/password form; POST to `/api/v1/auth/login`; store token in `localStorage`; redirect |
| `src/services/http.ts` | Modify | Read token from `localStorage`, add `Authorization: Bearer <token>` header |
| `src/App.tsx` | Modify | Add `/login` route |
| `.env.example` | Modify | Add `SESSION_DURATION_HOURS=24`, `ARGON2_MEMORY_COST=65536`, `SEED_ADMIN_PASSWORD` |

## API Contract

**POST /api/v1/auth/login**
- Body: `{ email, password }` (both required, strings)
- Success 200: `{ token: "<uuid>", user: { id, email, role: "admin"|"employee", companyId, companyName } }`
- Error 401: `{ error: "Invalid email or password" }` — never disclose which field failed
- Error 422: `{ error: "Email and password are required" }` / `"Password must be at least 8 characters"`
- Rate limited 429: `{ error: "Too many login attempts" }`

**POST /api/v1/auth/logout**
- Headers: `Authorization: Bearer <token>`
- Success 204: (no body — soft-deletes session row)
- Error 401: `{ error: "Unauthorized" }`

**Auth Middleware** (all `/api/v1/*` routes)
- Missing/invalid token → 401 `{ error: "Unauthorized" }`
- Expired session → 401 `{ error: "Unauthorized" }`
- Success → attaches `req.companyId: number`, `req.userId: number`, `req.role: number` via declaration merging:

```typescript
// api/auth/interface/authMiddleware.ts — Express type augmentation
declare global {
  namespace Express {
    interface Request {
      companyId: number;
      userId: number;
      role: number;
    }
  }
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | LoginUseCase: validation, credential check, session creation | Mock `IAuthRepository` + `IPasswordService`; test 4 paths (valid, wrong pw, missing email, short pw) |
| Unit | authMiddleware: token extraction, expiry | Mock repo; 401 on missing/empty/"Bearer "+expired+deleted |
| Unit | AuthController: error mapping | Mock use cases throwing each error type |
| Integration | PrismaAuthRepository: CRUD on sessions | Real DB; verify findValidSession returns null for expired row |
| Integration | POST /login → 200, POST /login wrong pw → 401, POST /logout → 204, GET /clients without token → 401 | Supertest against running app |
| E2E | Full login → dashboard → logout → 401 cycle | Playwright |

## Database Schema: Sessions Table

```sql
CREATE TABLE `sessions` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `token`      VARCHAR(36)  NOT NULL,
  `user_id`    INT          NOT NULL COMMENT 'ref: users.id',
  `company_id` INT          NOT NULL COMMENT 'ref: companies.id (denormalized)',
  `expires_at` DATETIME(3)  NOT NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_token` (`token`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Security Considerations

- **Rate limiting**: Dedicated 5 req/15min per IP on `/api/v1/auth/login` using a separate `express-rate-limit` instance
- **Constant-time verify**: `argon2.verify()` is internally constant-time — no timing leak
- **Token entropy**: `crypto.randomUUID()` → 122 random bits; `UNIQUE` constraint prevents collision
- **Password ≥ 8 chars**: enforced in `LoginUseCase.execute()` with 422 rejection
- **Uniform error replies**: always "Invalid email or password" regardless of which field is wrong — prevents user enumeration
- **Session expiry**: hard check `expires_at > NOW()` in middleware query — no sliding window, no refresh token in Phase 1
- **CORS fix**: `Authorization` header must be added to `allowedHeaders` in `api/index.ts` L74 (currently only `Content-Type`)
- **No password in logs**: `LoginUseCase` must NOT log the password or token values — only log structured fields like `{ email, success: boolean }`

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Standard HTTP auth middleware; adversarial cases covered by rate limiting, CSPRNG tokens, argon2 constant-time verify, and HTTPS (production).

## Migration / Rollout

**Order**: CREATE companies → ALTER TABLEs (add company_id columns) → CREATE users → CREATE sessions → seed.
All existing rows default to `company_id = 1` via `DEFAULT 1` on ALTER.

**Seed**: Company `{ id:1, name:'Default Company' }`, User `{ company_id:1, email:'admin@peluclic.com', password_hash: argon2.hash(SEED_ADMIN_PASSWORD), role:0 }`.

**Rollback**: DROP sessions → DROP company_id columns → DROP users → DROP companies.

## Open Questions

None.
