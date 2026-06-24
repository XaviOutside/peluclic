# Tasks: Create the Clients Model in a New API

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650–750 (additions + deletions) |
| 100-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-always |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base branch | Notes |
|------|------|-----------|-------------|-------|
| 1 | Bootstrap: config, Docker, logger, Prisma, health + sanitizeFtsQuery | PR 1 | `feature/clients-api` (tracker) | Runnable stack + pure utility tests |
| 2 | Domain + Application: entities, errors, repo interface, 6 use cases + unit tests | PR 2 | PR 1 branch | Zero DB dependency; mocked repo |
| 3 | Infrastructure + Interface: Prisma repo (FTS), controller, routes, DTOs, integration + supertest tests | PR 3 | PR 2 branch | Completes vertical slice; Docker MySQL required |

---

## Phase 1 — Bootstrap (PR 1)

- [x] **T01** · `package.json` — add deps: express, @types/express, prisma, @prisma/client, pino, typescript, vitest, supertest, @types/supertest, ts-node, tsx. Script: `test`, `test:integration`, `dev`, `build`. · Spec: api-bootstrap/req-1 · Est: 40 lines
- [x] **T02** · `tsconfig.json` — strict mode, paths `@/ → src/`, `@api/ → api/`, rootDir, outDir. · Spec: api-bootstrap/req-1 · Est: 25 lines · Dep: T01
- [x] **T03** · `vitest.config.ts` — include `api/**/*.test.ts`, resolve aliases `@api/` and `@/`. · Spec: api-bootstrap/req-1 · Est: 20 lines · Dep: T02
- [x] **T04** · `docker/my.cnf` — `ft_min_word_len=2`, `innodb_ft_min_token_size=2`. · Spec: api-bootstrap/req-2 · Est: 8 lines
- [x] **T05** · `docker-compose.yml` — services `api` (port 3000, env_file) and `db` (MySQL 8, my.cnf volume, data volume). · Spec: api-bootstrap/req-2 · Est: 35 lines · Dep: T04
- [x] **T06** · `.env.example` — document `DATABASE_URL`, `PORT`, `NODE_ENV`. · Spec: api-bootstrap/req-2 · Est: 5 lines
- [x] **T07** · `prisma/schema.prisma` — mysql provider, `previewFeatures = ["fullTextSearch","fullTextIndex"]`, `Client` model with `@@fulltext([name,email])`, no `@relation` fields, `status Int @db.TinyInt @default(1)`. · Spec: client-management/req-schema · Est: 30 lines · Dep: T01
- [x] **T08** · `api/observability/logger.ts` — export pino JSON logger; level from `LOG_LEVEL` env or `'info'`. · Spec: api-bootstrap/req-4 · Est: 12 lines · Dep: T01
- [x] **T09** · `api/shared/infrastructure/prisma.ts` — singleton `PrismaClient` export (global cache pattern for hot-reload). · Spec: api-bootstrap/req-5 · Est: 15 lines · Dep: T07
- [x] **T10** · `api/shared/domain/BaseEntity.ts` — shared interface `{ id: number; createdAt: Date; updatedAt: Date }`. · Spec: client-management/req-1 · Est: 8 lines
- [x] **T11** · **RED** `api/shared/utils/sanitizeFtsQuery.test.ts` — failing tests: each of 6 operators stripped individually, combined `'+(cat) -dog* "poodle"'`, operators-only → `''`, empty → `''`, normal term trimmed. · Spec: client-search/req-1 · Est: 45 lines · Dep: T03
- [x] **T12** · **GREEN** `api/shared/utils/sanitizeFtsQuery.ts` — pure function strips `+ - * " ( )`, trims whitespace. All T11 tests pass. · Spec: client-search/req-1 · Est: 10 lines · Dep: T11
- [x] **T13** · **RED** `api/index.ts` health test — supertest test in `api/index.test.ts`: `GET /health → 200 { status: ok }`, unknown route → 404. · Spec: api-bootstrap/req-3 · Est: 18 lines · Dep: T03
- [x] **T14** · **GREEN** `api/index.ts` — Express app, mount `/api/v1` (stub router), `GET /health → 200 { status: ok }`, validate `DATABASE_URL` on startup or exit non-zero. All T13 tests pass. · Spec: api-bootstrap/req-3 · Est: 30 lines · Dep: T08, T09, T13

---

## Phase 2 — Domain + Application (PR 2)

- [ ] **T15** · `api/clients/domain/Client.ts` — `ClientStatus = 0 | 1`, `Client` interface, `CreateClientInput`, `UpdateClientInput`. No framework imports. · Spec: client-management/req-1 · Est: 20 lines · Dep: T10
- [ ] **T16** · `api/clients/domain/ClientErrors.ts` — `ClientNotFoundError`, `ClientValidationError` (extend Error, set name). · Spec: client-management/req-1 · Est: 15 lines · Dep: T15
- [ ] **T17** · `api/clients/domain/IClientRepository.ts` — interface: `create`, `findById`, `findAll`, `update`, `softDelete`, `search`. Domain types only, no Prisma. · Spec: client-management/req-2, client-search/req-3 · Est: 15 lines · Dep: T15
- [ ] **T18** · **RED+GREEN** `api/clients/application/CreateClient.ts` + `.test.ts` — test: created with status=1, missing name → `ClientValidationError` + repo not called, default status active. Minimum code to pass. · Spec: client-management/req-3 · Est: 50 lines · Dep: T16, T17
- [ ] **T19** · **RED+GREEN** `api/clients/application/GetClient.ts` + `.test.ts` — test: returns entity, null → `ClientNotFoundError`, deletedAt non-null → `ClientNotFoundError`. · Spec: client-management/req-4 · Est: 40 lines · Dep: T16, T17
- [ ] **T20** · **RED+GREEN** `api/clients/application/ListClients.ts` + `.test.ts` — test: returns array, page=0 → `ClientValidationError`, limit=200 → `ClientValidationError`, defaults page=1 limit=20. · Spec: client-management/req-5 · Est: 45 lines · Dep: T16, T17
- [ ] **T21** · **RED+GREEN** `api/clients/application/UpdateClient.ts` + `.test.ts` — test: calls update + returns entity, null → not-found, deletedAt → not-found, repo.update not called on error. · Spec: client-management/req-6 · Est: 50 lines · Dep: T16, T17
- [ ] **T22** · **RED+GREEN** `api/clients/application/SoftDeleteClient.ts` + `.test.ts` — test: calls softDelete, already deleted → not-found + softDelete not called. · Spec: client-management/req-7 · Est: 40 lines · Dep: T16, T17
- [ ] **T23** · **RED+GREEN** `api/clients/application/SearchClients.ts` + `.test.ts` — test: sanitizes before repo, empty → [] without calling repo, operators-only → [], returns matches. · Spec: client-search/req-2 · Est: 45 lines · Dep: T12, T16, T17

---

## Phase 3 — Infrastructure + Interface (PR 3)

- [ ] **T24** · `api/clients/interface/dtos/CreateClientDto.ts` — `{ name, email, phone, phone2?, address? }`. · Spec: client-management/req-3 · Est: 10 lines · Dep: T15
- [ ] **T25** · `api/clients/interface/dtos/UpdateClientDto.ts` — all fields optional; no `status` (deactivation via dedicated endpoint only). · Spec: client-management/req-6 (confirmed: PUT excludes status) · Est: 12 lines · Dep: T15
- [ ] **T26** · `api/clients/interface/dtos/ClientResponseDto.ts` — omits `deletedAt`; `createdAt`/`updatedAt` as ISO 8601 string. · Spec: client-management/req-8 · Est: 12 lines · Dep: T15
- [ ] **T27** · **RED** `api/clients/infrastructure/PrismaClientRepository.test.ts` — integration tests (requires Docker MySQL): `findAll` excludes soft-deleted, `softDelete` sets timestamp without deleting row, `search` uses FTS, excludes deleted, caps at 50, parameterized binding (no string concat). · Spec: client-management/req-8, client-search/req-3 · Est: 70 lines · Dep: T17, T09
- [ ] **T28** · **GREEN** `api/clients/infrastructure/PrismaClientRepository.ts` — implements `IClientRepository`; all reads filter `deletedAt: null`; `softDelete` sets timestamp; `search` uses `$queryRaw` tagged template with `MATCH(name,email) AGAINST(${sanitized} IN BOOLEAN MODE) AND deleted_at IS NULL LIMIT 50`. All T27 tests pass. · Spec: client-management/req-8, client-search/req-3 · Est: 70 lines · Dep: T27
- [ ] **T29** · **RED** `api/clients/interface/ClientController.test.ts` — supertest tests (mocked use cases): POST→201, GET list→200, GET /:id→200, PUT→200, DELETE→204, GET search→200; GET search missing q→400; non-numeric id→422; 500 body has no stack trace; PII not logged. · Spec: client-management/req-9, client-search/req-4 · Est: 90 lines · Dep: T24, T25, T26
- [ ] **T30** · **GREEN** `api/clients/interface/ClientController.ts` — methods: `create`, `getById`, `list`, `update`, `remove`, `deactivate`, `search`. Controller catch pattern per design: `ClientNotFoundError→404`, `ClientValidationError→422`, unexpected→500 (no stack in production). Validate `:id` as positive int → 422 if invalid. Logger for all 4xx/5xx (no PII). · Spec: client-management/req-9, client-search/req-4, OWASP · Est: 80 lines · Dep: T29, T08
- [ ] **T31** · `api/clients/interface/clientRouter.ts` — Express Router: `POST /`, `GET /`, `GET /search`, `GET /:id`, `PUT /:id`, `PATCH /:id/deactivate`, `DELETE /:id`. Note: `/search` MUST be declared before `/:id`. · Spec: client-management/req-9, client-search/req-4 · Est: 25 lines · Dep: T30
- [ ] **T32** · Update `api/index.ts` — mount `clientRouter` at `/api/v1/clients`; run `npx prisma migrate dev` in Docker entrypoint. · Spec: api-bootstrap/req-3 · Est: 8 lines · Dep: T31, T14

---

## Review Workload Forecast (Summary)

| PR | Tasks | Est. lines | Budget |
|----|-------|-----------|--------|
| PR 1 — Bootstrap | T01–T14 | ~296 | ⚠️ High (split if needed) |
| PR 2 — Domain + Application | T15–T23 | ~320 | ⚠️ High |
| PR 3 — Infra + Interface | T24–T32 | ~377 | ⚠️ High |
| **Total** | **32** | **~993** | **3 PRs minimum** |

**Decision needed before apply: Yes**  
All three PRs exceed the 100-line budget individually. The feature-branch-chain strategy is pre-selected — confirm chain base branches before starting `sdd-apply`:

- PR 1 base → `feature/clients-api` (tracker branch, never merges to main alone)
- PR 2 base → PR 1 branch (`feature/clients-api-pr1`)
- PR 3 base → PR 2 branch (`feature/clients-api-pr2`)
- Tracker PR → main (after all 3 are reviewed and merged into tracker)
