# Design: Client Multi-Field FTS Substring Search

## Technical Approach

Replace BOOLEAN MODE word-FTS with **ngram NATURAL LANGUAGE MODE FTS** across two independent queries (clients 6 cols + pets 3 cols) merged at the repository layer via `Set` dedup. Adds 3-char gate, stopword filter, and SANE output validation. Collation migrates to `utf8mb4_0900_ai_ci` for accent folding.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| FTS mode | NATURAL LANGUAGE MODE (no operators) | BOOLEAN MODE | Eliminates operator injection surface; `sanitizeFtsQuery` reduces to whitespace + stopwords only |
| Cross-entity merge | Two queries + `Set` dedup in repository | Denormalized column + triggers | No triggers, no stale data risk. Two round-trips OK at pet-grooming scale |
| Token size | `ngram_token_size=3` | 2 | Matches 3-char-gate UX; index ~2x smaller than size=2 |
| Prisma `@@fulltext` | Remove from Client and Pet; SQL-managed | Keep for docs | Avoids drift warnings from `prisma migrate dev` |
| Merge ownership | Repository layer (internal to `search()`) | Use case layer | Merge is infrastructure dedup, not domain logic; `IClientRepository` contract stable |
| Debounce + gate | `ClientsPage.tsx` `handleSearchChange` | `useClients` hook | Page owns UX policy; SearchInput/PageHeader stay presentational |

## Data Flow

```
User types in SearchInput (via PageHeader)
  → ClientsPage.handleSearchChange(value)
    → 300ms debounce (useRef + setTimeout)
    → 3-char gate: <3 after trim → setSearchQuery + fetchClients(), STOP
    → search(query) via useClients
      → searchClients(query) → GET /api/v1/clients/search?q=...
        → SearchClientsUseCase.execute({ query })
          → sanitizeFtsQuery(query) → whitespace + stopwords
          → if all-stopword → return []
          → SANE query invariant check → FTS operators → throw
          → repository.search(sanitized)
            → Query 1: MATCH(c.name..c.notes) NATURAL LANGUAGE → id[]
            → Query 2: MATCH(p.name,p.breed,p.notes) NATURAL LANGUAGE → DISTINCT client_id[]
            → Set(ids) → findMany({ id: { in: [...ids] } })
          → return Client[]
```

## File Changes

| File | Action | Description |
|---|---|---|
| `docker/my.cnf` | Modify | `ngram_token_size=3`; `collation-server=utf8mb4_0900_ai_ci`; drop `ft_min_word_len`/`innodb_ft_min_token_size` |
| `prisma/schema.prisma` | Modify | Remove `@@fulltext` from Client (L26) and Pet (L45) |
| Migration (new) | Create | DROP old FTS; `ALTER TABLE clients CONVERT TO utf8mb4_0900_ai_ci`; CREATE ngram FTS on clients(6) + pets(3) with `WITH PARSER ngram` |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modify | NATURAL LANGUAGE MODE on 6 cols; second pets query; internal `Set` merge |
| `api/clients/application/SearchClients.ts` | Modify | 3-char gate, SANE call, pre-DB invariants |
| `api/shared/utils/sanitizeFtsQuery.ts` | Modify | Whitespace + stopword removal; returns `{ query, isEmpty }` |
| `api/shared/utils/stopwords.ts` | **Create** | ~40 es/en articles/prepositions as `Set<string>` |
| `api/shared/utils/sane.ts` | **Create** | `saneValidateFtsOutput(result)` and `saneValidateQuery(query)` |
| `src/pages/ClientsPage.tsx` | Modify | 300ms debounce + 3-char gate in `handleSearchChange` |

## Interfaces / Contracts

`IClientRepository.search(sanitizedQuery: string): Promise<Client[]>` — signature unchanged, internals only.

```typescript
// sanitizeFtsQuery return type
export function sanitizeFtsQuery(query: string): { query: string; isEmpty: boolean };

// SANE shape validation (repository boundary)
export function saneValidateFtsOutput(result: unknown): asserts result is Array<{ id: number }>;
```

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit | `sanitizeFtsQuery` — stopword stripping, all-stopword | Vitest, pure function |
| Unit | `SearchClientsUseCase` — 3-char gate, SANE rejection | Vitest, mock repo + SANE |
| Integration | `PrismaClientRepository.search` — "bra" → Labrador, "555" → phone, "ña" → Ñandú | Docker MySQL + Vitest, seeded data |
| Integration | Dedup — client in both results appears once | Docker MySQL + Vitest |
| E2E | Type "bra" → result; "ab" → empty; "de la" → empty | Playwright, `data-testid` + network intercept |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. NATURAL LANGUAGE MODE + tagged templates + SANE validation cover the FTS injection surface.

## Migration / Rollout

1. `docker compose down`
2. Edit `docker/my.cnf` → `docker compose up -d`
3. Apply migration (DROP old, ALTER collation, CREATE ngram)
4. Deploy code
5. Verify with integration tests

Rollback: reverse migration + code revert + Docker restart.

## Open Questions

None — all resolved from exploration.
