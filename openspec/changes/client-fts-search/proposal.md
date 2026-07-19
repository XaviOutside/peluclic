# Proposal: Client Multi-Field FTS Substring Search

## Intent

Replace word-only FTS (`MATCH AGAINST IN BOOLEAN MODE`) with **ngram FTS** for true substring matching across name, email, phone, phone2, address, notes, and pet names. Users must find any client by typing partial text — "bra" matches "Labrador", "555" matches phone numbers, "ña" matches "Ñandú" via accent folding. **Hard constraint: MySQL FTS only — no LIKE, no client-side filtering.**

## Scope

### In Scope
- ngram FTS indexes (`WITH PARSER ngram`) on clients (6 cols) and pets (3 cols)
- Two-query NATURAL LANGUAGE MODE FTS with app-layer merge + DISTINCT
- Collation `utf8mb4_unicode_ci` → `utf8mb4_0900_ai_ci` for accent folding
- `ngram_token_size=3` in `docker/my.cnf`; Docker restart required
- Remove `@@fulltext` from Prisma schema; manage indexes via custom SQL migrations
- Simplify `sanitizeFtsQuery` to whitespace-only + stopword removal (no operators in NATURAL LANGUAGE MODE)
- **3-character minimum gate** in `SearchClientsUseCase` and `SearchInput` (< 3 chars → return empty)
- **Stopword filter**: strip Spanish and English prepositions, articles, and common noise words before querying to reduce false positives from short function words matching everywhere

### Out of Scope
- Services or standalone pets search
- Pagination changes, frontend result display changes
- LIKE, client-side filtering — FTS only

## Capabilities

### New Capabilities
- `clients-fts-search`: ngram FTS across 6 client columns + 3 pet columns with app-layer merge, NATURAL LANGUAGE MODE, accent-folded collation (`utf8mb4_0900_ai_ci`), 3-char minimum gate, and stopword filtering.

### Modified Capabilities
- `client-management-frontend`: Search input adds 2-character minimum gate (queries shorter than 2 chars return empty). Existing debounce requirement unchanged.

## Approach

**Option B from exploration** — two ngram FTS queries merged in app layer. No triggers, no denormalization.

1. **Migration**: DROP old word-based FTS. `ALTER TABLE clients CONVERT TO utf8mb4_0900_ai_ci`. CREATE ngram FTS on clients (name, email, phone, phone2, address, notes) and pets (name, breed, notes) with `WITH PARSER ngram`.
2. **Repository**: Two `$queryRaw` calls — clients FTS on 6 cols, pets FTS returning `DISTINCT client_id`. Both use NATURAL LANGUAGE MODE.
3. **Use case**: Merge IDs with `Set`, fetch full clients, 3-char gate returns `[]`.
4. **Sanitizer**: Whitespace-only cleanup + stopword removal replacing operator-stripping logic.
5. **Frontend**: SearchInput debounce (300ms) + 3-char gate + stopword-aware UX.
6. **Infra**: `docker/my.cnf` → `ngram_token_size=3`, `collation-server=utf8mb4_0900_ai_ci`; `docker compose down && up -d`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `docker/my.cnf` | Modified | `ngram_token_size=3`, collation change |
| Custom migration | New | DROP old + CREATE ngram FTS + collation ALTER |
| `prisma/schema.prisma` | Modified | Remove `@@fulltext` (Client, Pet) |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modified | Two-query ngram FTS + merge |
| `api/clients/application/SearchClients.ts` | Modified | 3-char gate + merge + stopword filter |
| `api/shared/utils/sanitizeFtsQuery.ts` | Modified | Whitespace-only + stopword removal |
| `api/shared/utils/stopwords.ts` | **New** | Stopword list (es/en prepositions + articles) |
| `src/components/molecules/SearchInput.tsx` | Modified | 3-char min gate + debounce |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| ngram index 3-5x larger | Low | Negligible at pet-grooming scale (thousands) |
| Collation change breaks sort/comparison | Low | No app logic depends on `unicode_ci` sort |
| Prisma drift after removing `@@fulltext` | Low | Document in migration comments |
| Docker restart for `ngram_token_size` | Medium | Coordinate maintenance window |
| Result ordering non-deterministic (two queries) | Low | Acceptable for search results; document |

## Rollback Plan

1. Revert migration: DROP ngram FTS, recreate word-based `clients(name, email)` FTS
2. Revert collation to `utf8mb4_unicode_ci`
3. Remove `ngram_token_size` from `my.cnf`
4. Restore `@@fulltext` in Prisma schema
5. Revert repository to single `MATCH AGAINST IN BOOLEAN MODE`
6. `docker compose down && up -d`

## Dependencies

- Docker restart (ngram_token_size is read-only at runtime)
- MySQL 8.0+ (already in docker-compose.yml)

## Updated Success Criteria

- [ ] "bra" finds client whose pet is "Labrador" (3-char substring match)
- [ ] "555" finds by partial phone (3-char ngram matches)
- [ ] "ña" finds "Ñandú" (accent folding via `utf8mb4_0900_ai_ci`)
- [ ] 1-2 char queries return `[]` (3-char gate)
- [ ] "de la" or "el" returns empty (all-stopword query filtered out)
- [ ] "Calle de la Paz" matches address "Calle de la Paz 45" (stopwords stripped, "calle paz" used)
- [ ] All existing tests pass; new integration tests cover ngram FTS + stopword behavior
