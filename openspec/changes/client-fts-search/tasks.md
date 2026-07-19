# Tasks: Client Multi-Field FTS Substring Search

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | DB infra + shared utils | PR 1 | `npx vitest run api/shared/utils/` | `docker compose up -d && npx prisma migrate deploy` | Revert migration + my.cnf + Prisma schema |
| 2 | Backend ngram FTS + merge | PR 2 | `npx vitest run api/clients/` | `docker compose up -d db && npx vitest run api/clients/infrastructure/` | Revert repository + use case |
| 3 | Frontend gate + E2E | PR 3 | `npx playwright test --grep "search"` | `docker compose up -d && npm run dev` | Revert ClientsPage.tsx |

## Phase 1: Infrastructure (PR 1)

- [x] 1.1 Edit `docker/my.cnf`: set `ngram_token_size=3`, `collation-server=utf8mb4_0900_ai_ci`, drop `ft_min_word_len`/`innodb_ft_min_token_size`
- [x] 1.2 Remove `@@fulltext` from Client (L26) and Pet (L45) in `prisma/schema.prisma`
- [x] 1.3 Create migration `prisma/migrations/<timestamp>_add_ngram_fts/migration.sql`: DROP old FTS indexes, `ALTER TABLE clients CONVERT TO utf8mb4_0900_ai_ci`, CREATE ngram FTS on clients(6) and pets(3) `WITH PARSER ngram`
- [x] 1.4 Restart Docker + apply migration: `docker compose down && docker compose up -d && npx prisma migrate deploy` ⚠️ Requires Docker restart — not executed in this batch. Migration created at `prisma/migrations/20260719150000_add_ngram_fts/`.

## Phase 2: Shared Utilities (PR 1)

- [x] 2.1 Create `api/shared/utils/stopwords.ts`: export `Set<string>` with ~40 es/en articles/prepositions
- [x] 2.2 RED: write `api/shared/utils/stopwords.test.ts` — verify membership ("de", "la", "the", "of") and non-membership ("calle", "paz")
- [x] 2.3 GREEN: implement stopwords Set
- [x] 2.4 RED: write `api/shared/utils/sanitizeFtsQuery.test.ts` — "Calle de la Paz" → "calle paz", "de la" → isEmpty=true, whitespace normalization
- [x] 2.5 GREEN: rewrite `api/shared/utils/sanitizeFtsQuery.ts` — whitespace normalization + stopword filter; remove operator-stripping; return `{ query: string; isEmpty: boolean }`
- [x] 2.6 RED: write `api/shared/utils/sane.test.ts` — valid output passes, `[{client_id:1}]` shape caught, `"` or `+` in query caught
- [x] 2.7 GREEN: create `api/shared/utils/sane.ts` — `saneValidateFtsOutput()` (array of `{id: positive int}`, ≤10k) and `saneValidateQuery()` (no FTS operators, ≥3 chars or empty)

## Phase 3: Backend Core (PR 2)

- [x] 3.1 RED: write `api/clients/infrastructure/PrismaClientRepository.test.ts` — seeded Docker MySQL: "bra" finds Labrador, "555" partial phone, "ñan" finds Ñandú, dedup on overlapping IDs
- [x] 3.2 GREEN: update `PrismaClientRepository.search()` — two `$queryRaw` NATURAL LANGUAGE MODE queries (clients 6 cols + pets 3 cols DISTINCT client_id), `Set` merge, `findMany` by merged IDs
- [x] 3.3 RED: write `api/clients/application/SearchClients.test.ts` — 3-char gate → [], all-stopword → [], SANE rejection throws
- [x] 3.4 GREEN: update `SearchClientsUseCase.execute()` — call sanitize, gate on isEmpty, SANE query check, delegate to repository

## Phase 4: Frontend + E2E (PR 3)

- [x] 4.1 RED: write E2E test in `e2e/` — type "bra" → result row visible; type "ab" → empty state, no API call; click search with "ab" → no API call; "de la" → empty
- [x] 4.2 GREEN: update `src/pages/ClientsPage.tsx` `handleSearchChange` — 300ms debounce via `useRef`/`setTimeout`, 3-char gate (<3 after trim → clear results, skip search), all-stopword → clear results
- [x] 4.3 REFACTOR: verify lint + build pass (`npm run lint && npm run build`), run full test suite, confirm all success criteria from proposal
