# Apply Progress: Create the Clients Model in a New API

## PR Slice
**PR 1 of 3 — Bootstrap (T01–T14)**
**Branch**: `feature/clients-api-pr1` → targets `feature/clients-api` (tracker)
**Mode**: Standard TDD (Red/Green/Refactor)
**Status**: ✅ Complete — 14/14 tasks done, 15/15 tests pass

---

## Completed Tasks

### Phase 1 — Bootstrap (PR 1)

- [x] **T01** · `package.json` — express, prisma, @prisma/client, pino, dotenv; devDeps: typescript, ts-node, tsx, vitest, @vitest/coverage-v8, supertest, @types/*; scripts: dev, build, start, test, test:integration, migrate, generate
- [x] **T02** · `tsconfig.json` — strict: true, target: ES2022, module: CommonJS, paths: @api/→api/, @/→src/, outDir: dist, rootDir: .
- [x] **T03** · `vitest.config.ts` — includes api/**/*.test.ts, excludes *.integration.test.ts, resolve aliases @api/ and @/, coverage v8
- [x] **T04** · `docker/my.cnf` — ft_min_word_len=2, innodb_ft_min_token_size=2, innodb_buffer_pool_size=256M
- [x] **T05** · `docker-compose.yml` — api (Node 20 Alpine, port 3000, volumes), db (MySQL 8, healthcheck, data volume), docker/my.cnf mounted, network pfmaster-net; also created `docker/Dockerfile`
- [x] **T06** · `.env.example` — DATABASE_URL, PORT, NODE_ENV, LOG_LEVEL, DB_ROOT_PASSWORD, DB_NAME, DB_USER, DB_PASSWORD
- [x] **T07** · `prisma/schema.prisma` — mysql provider, previewFeatures=[fullTextSearch,fullTextIndex], Client model with TINYINT status, @@fulltext([name,email]), no @relation fields
- [x] **T08** · `api/observability/logger.ts` — pino JSON logger, LOG_LEVEL from env, pino-pretty transport in development mode only
- [x] **T09** · `api/shared/infrastructure/prisma.ts` — PrismaClient singleton with global cache for hot-reload safety
- [x] **T10** · `api/shared/domain/BaseEntity.ts` — shared `{ id, createdAt, updatedAt }` interface
- [x] **T11** · **RED** `api/shared/utils/sanitizeFtsQuery.test.ts` — 13 failing tests: 6 operators individually, combined, operators-only, empty, normal term, trim, whitespace collapse
- [x] **T12** · **GREEN** `api/shared/utils/sanitizeFtsQuery.ts` — pure function `replace(/[+\-*"()]/g, ' ').replace(/\s+/g, ' ').trim()`. All 13 T11 tests pass.
- [x] **T13** · **RED** `api/index.test.ts` — supertest: GET /health → 200 { status: ok }, unknown → 404
- [x] **T14** · **GREEN** `api/index.ts` — Express app, JSON body parser, request logging, /health route, 404 handler, DATABASE_URL startup validation. All T13 tests pass.

---

## Files Created

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Created | Runtime + dev deps, npm scripts |
| `package-lock.json` | Created | Lockfile |
| `tsconfig.json` | Created | TypeScript strict config with path aliases |
| `vitest.config.ts` | Created | Vitest config for api/ unit tests |
| `.env.example` | Created | Environment variable documentation |
| `docker-compose.yml` | Created | api + db services, pfmaster-net |
| `docker/Dockerfile` | Created | Node 20 Alpine for api service |
| `docker/my.cnf` | Created | MySQL ft_min_word_len=2 config |
| `prisma/schema.prisma` | Created | Client model with FULLTEXT index |
| `api/observability/logger.ts` | Created | pino JSON logger singleton |
| `api/shared/infrastructure/prisma.ts` | Created | PrismaClient singleton |
| `api/shared/domain/BaseEntity.ts` | Created | Shared entity base interface |
| `api/shared/utils/sanitizeFtsQuery.ts` | Created | FTS input sanitizer |
| `api/shared/utils/sanitizeFtsQuery.test.ts` | Created | 13 unit tests (all pass) |
| `api/index.ts` | Created | Express app entry point |
| `api/index.test.ts` | Created | 2 integration tests (all pass) |

---

## Test Results

```
Test Files  2 passed (2)
     Tests  15 passed (15)
 Start at   18:47:48
  Duration  261ms
```

- `api/shared/utils/sanitizeFtsQuery.test.ts` — 13 tests ✅
- `api/index.test.ts` — 2 tests ✅

TypeScript: `tsc --noEmit` exits 0, zero errors.

---

## TDD Evidence

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| T11+T12 sanitizeFtsQuery | ✅ 13 tests fail (file missing) | ✅ regex impl, all pass | ✅ JSDoc added, clean |
| T13+T14 health endpoint | ✅ 2 tests fail (file missing) | ✅ Express app, all pass | ✅ logger fixed for test env |

---

## Deviations from Design

1. **pino-pretty only in development** — design said "transport in non-production". Changed to "development only" because pino-pretty's transport worker fails in Vitest's test runner. Test environment now gets plain JSON output. This is more correct — production and test both use raw JSON.
2. **`docker/Dockerfile` added** — not listed in the design file-tree but required by `docker-compose.yml` build context. Added Node 20 Alpine Dockerfile.
3. **pino-pretty installed as devDependency** — required even for development-only transport. Added `pino-pretty` to devDependencies.
4. **`.env.example` includes Docker credentials** — added `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` beyond the minimum spec requirement. These are needed by docker-compose.yml.

---

## Issues Found

- **npm allow-scripts warning** — prisma, esbuild, fsevents have install scripts. Not a blocker; Prisma generates correctly via `npx prisma generate`.
- **Vitest CJS deprecation warning** — `The CJS build of Vite's Node API is deprecated`. This is a Vitest 2.x cosmetic warning; tests run correctly. Will resolve when Vitest updates to use the ESM build.
- **npm audit: 6 vulnerabilities** — all in Vitest/Vite (dev tools, not production). Critical ones are in vitest itself. Acceptable for dev tooling; production build has no exposure.

---

## Git Commits (PR 1)

```
07c0a27 chore: mark T01-T14 complete in tasks.md
9ac4508 docs: add openspec design, specs, and tasks artifacts
4c8c27b feat: add Express app entry point with health endpoint (GREEN)
89989ad test: add health endpoint integration test (RED)
b52a492 feat: implement sanitizeFtsQuery (GREEN)
7cfa286 test: add sanitizeFtsQuery unit tests (RED)
6ec3703 feat: add pino logger, prisma singleton, and BaseEntity
bf267d9 feat: add prisma schema with Client model
f6c35b4 chore: add docker-compose, mysql config, and env example
728e89f chore: bootstrap package.json, tsconfig, and vitest config
```

---

## Workload / PR Boundary

- **Mode**: Chained PR slice (feature-branch-chain)
- **Current work unit**: PR 1 — Bootstrap
- **Branch**: `feature/clients-api-pr1` targets `feature/clients-api` (tracker)
- **Boundary**: starts from Initial commit, ends with all T01–T14 complete
- **Review budget**: ~296 estimated lines (within PR 1 budget)

---

## Remaining Tasks

### Phase 2 — Domain + Application (PR 2)

- [ ] T15 · `api/clients/domain/Client.ts`
- [ ] T16 · `api/clients/domain/ClientErrors.ts`
- [ ] T17 · `api/clients/domain/IClientRepository.ts`
- [ ] T18 · RED+GREEN CreateClient.ts + test
- [ ] T19 · RED+GREEN GetClient.ts + test
- [ ] T20 · RED+GREEN ListClients.ts + test
- [ ] T21 · RED+GREEN UpdateClient.ts + test
- [ ] T22 · RED+GREEN SoftDeleteClient.ts + test
- [ ] T23 · RED+GREEN SearchClients.ts + test

### Phase 3 — Infrastructure + Interface (PR 3)

- [ ] T24–T32 (see tasks.md for full list)

---

## Next Recommended

Review PR 1 (`feature/clients-api-pr1` → `feature/clients-api`), then apply PR 2 (T15–T23) on a new branch `feature/clients-api-pr2` targeting `feature/clients-api-pr1`.
