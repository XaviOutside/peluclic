## Exploration: Client Multi-Field FTS with N-gram Substring Matching

**Change**: `client-fts-search`
**Date**: 2026-07-12
**Store**: hybrid (Engram + OpenSpec)
**Constraint**: MySQL Full-Text Search ONLY — no LIKE

---

## Current State

### MySQL Version & Configuration

| Setting | Current Value | Notes |
|---|---|---|
| MySQL version | `mysql:8.0` (Docker) | Latest 8.0.x — ngram parser is a built-in plugin since 5.7.6 |
| `ft_min_word_len` | 2 | Only relevant for default word-based parser |
| `innodb_ft_min_token_size` | 2 | InnoDB equivalent of ft_min_word_len |
| `collation-server` | `utf8mb4_unicode_ci` | Case-insensitive but NOT accent-insensitive |
| `ngram_token_size` | NOT SET | MySQL default is 2 — works but should be explicit |

**Critical collation gap**: The user requires `utf8mb4_0900_ai_ci` for accent folding (e.g., `ñ = n`, `é = e`). The current `utf8mb4_unicode_ci` collation treats accented characters as distinct — this will cause search misses for accented queries. Both `docker/my.cnf` and the table DDL must change.

### Current FTS Indexes (from schema.prisma + migrations)

```sql
-- clients table (migration 20260624175955)
FULLTEXT INDEX `clients_name_email_idx`(`name`, `email`)

-- pets table (migration 20260628162032)
FULLTEXT INDEX `pets_name_breed_notes_idx`(`name`, `breed`, `notes`)

-- services table (via schema.prisma @@fulltext)
FULLTEXT(name, description)
```

Both indexes use the default InnoDB FULLTEXT parser (word-based, whitespace-delimited). **No ngram parser anywhere yet.**

### Current Search Implementation

```
SearchInput (no debounce, no min-char)
  → ClientsPage → useClients.search() → GET /api/v1/clients/search?q=...
    → SearchClientsUseCase → sanitizeFtsQuery(q) → repository.search(sanitized)
      → $queryRaw: MATCH(name, email) AGAINST(? IN BOOLEAN MODE)
```

`sanitizeFtsQuery` strips all 6 FTS operators (`+ - * " ( )`), leaving only plain words. With the default word-based parser and `ft_min_word_len=2`:
- `"lab"` → matches if "lab" is a standalone word — does NOT match "labrador"
- `"labr"` → no match because "labr" is not a complete word
- `"brad"` → no match because it's a substring, not a word
- `"golden"` → matches "golden retriever" ✅

Conclusion: **current FTS cannot do substring matching**. It can only match complete words ≥2 characters.

### Why the Previous LIKE Exploration Is Invalid

The previous exploration at `openspec/changes/substring-search/exploration.md` recommended LIKE `%term%` (Option D) because:
1. It delivers true substring matching
2. Data scale is small (pet grooming business)
3. FTS `*` prefix wildcard doesn't give true substring matching

**This exploration was made under the constraint of keeping the default FTS parser.** With the ngram FTS parser, true substring matching IS possible with FTS.

---

## Affected Areas (FTS-Ngram Approach)

### Backend — Must Change
| File | Impact | Description |
|---|---|---|
| `docker/my.cnf` | ✏️ Modify | Add `ngram_token_size=2`, change collation to `utf8mb4_0900_ai_ci` |
| `prisma/schema.prisma` | ✏️ Modify | Update `@@fulltext` on clients to include phone, phone2, address, notes |
| New migration | ➕ Create | DROP old FTS, CREATE ngram FTS on all 6 client columns + pet_names_text |
| `api/clients/domain/IClientRepository.ts` | ✏️ Modify | `search()` signature may need to change if using NATURAL LANGUAGE MODE |
| `api/clients/infrastructure/PrismaClientRepository.ts` | ✏️ Modify | Replace MATCH query with ngram-compatible FTS query |
| `api/clients/application/SearchClients.ts` | ✏️ Modify | Adjust sanitization for ngram; 2-char min gate |
| `api/shared/utils/sanitizeFtsQuery.ts` | ✏️ Modify | Ngram + NATURAL LANGUAGE MODE needs only whitespace cleanup |
| `api/clients/infrastructure/PrismaClientRepository.integration.test.ts` | ✏️ Modify | Update search tests |
| `api/clients/application/SearchClients.test.ts` | ✏️ Modify | Update sanitization tests |

### Backend — May Change
| File | Impact | Description |
|---|---|---|
| `docker/Dockerfile` | 🔍 Check | May need collation-aware env if the DB collation changes |
| Pets migrations | ✏️ Modify | Optionally migrate pets FTS to ngram for two-query approach |

### Frontend — May Change
| File | Impact | Description |
|---|---|---|
| `src/components/molecules/SearchInput.tsx` | ✏️ Modify | Add debounce (300ms) + min-char gate (2 chars) — needed regardless |

---

## Approaches (All FTS-Based — LIKE Is Out of Scope)

### Option A: N-gram FTS with Denormalized Pet Names Column (⚡ Single Query)

**Single ngram FULLTEXT index covering all 7 fields** — 6 client columns + a denormalized `pet_names_text` column populated by database triggers.

**Architecture**:
```
clients search
  → MATCH(name, email, phone, phone2, address, notes, pet_names_text)
     AGAINST(? IN NATURAL LANGUAGE MODE)
  → ngram parser tokenizes query into 2-char ngrams
  → hits any indexed text containing those ngrams
```

**Migration required**:
```sql
-- 1. Collation change (for accent folding)
ALTER TABLE clients CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 2. Drop old index
ALTER TABLE clients DROP INDEX clients_name_email_idx;

-- 3. Add denormalized pet names column
ALTER TABLE clients ADD COLUMN pet_names_text TEXT;
UPDATE clients c SET c.pet_names_text = (
  SELECT GROUP_CONCAT(p.name SEPARATOR ' ')
  FROM pets p WHERE p.client_id = c.id AND p.deleted_at IS NULL
);

-- 4. Triggers on pets table to maintain pet_names_text
CREATE TRIGGER trg_pets_insert AFTER INSERT ON pets FOR EACH ROW
  UPDATE clients SET pet_names_text = (
    SELECT GROUP_CONCAT(name SEPARATOR ' ') FROM pets
    WHERE client_id = NEW.client_id AND deleted_at IS NULL
  ) WHERE id = NEW.client_id;

CREATE TRIGGER trg_pets_update AFTER UPDATE ON pets FOR EACH ROW
  UPDATE clients SET pet_names_text = (
    SELECT GROUP_CONCAT(name SEPARATOR ' ') FROM pets
    WHERE client_id = NEW.client_id AND deleted_at IS NULL
  ) WHERE id = NEW.client_id;

CREATE TRIGGER trg_pets_delete AFTER DELETE ON pets FOR EACH ROW
  UPDATE clients SET pet_names_text = (
    SELECT GROUP_CONCAT(name SEPARATOR ' ') FROM pets
    WHERE client_id = OLD.client_id AND deleted_at IS NULL
  ) WHERE id = OLD.client_id;

-- 5. Create ngram FULLTEXT index on all 7 fields
CREATE FULLTEXT INDEX clients_fts_idx
  ON clients(name, email, phone, phone2, address, notes, pet_names_text)
  WITH PARSER ngram;
```

**How substring matching works**:
- "labrador" → ngram tokens: `la ab br ra ad do or`
- User types "bra" → ngram tokens: `br ra` → matches because "br" and "ra" ngrams both appear in "labrador"
- User types "555" → ngram tokens: `55 55` → matches phone "555-1234" because indexed text also splits on hyphens

**Prisma compatibility issue**: Prisma's `@@fulltext` attribute does NOT support `WITH PARSER ngram`. The Prisma-generated migration would create a standard word-based FULLTEXT. Solution: either:
  1. Keep `@@fulltext` for schema introspection only, use a custom migration that DROPs + recreates with ngram (Prisma will show drift warning)
  2. Remove `@@fulltext` from schema.prisma entirely and manage the index through pure SQL migrations

- **Pros**:
  - **Single query** — no application-layer merge, no DISTINCT, no UNION
  - **True substring matching** — any 2+ character substring finds matches
  - **All 7 fields in one index** — phone, phone2, address, notes, pet names included
  - **Accent/case folding** — with `utf8mb4_0900_ai_ci`, `Jose` = `José`
  - **FTS performance** — indexed ngram lookup, not full table scan
- **Cons**:
  - **Denormalization via triggers** — 3 triggers on `pets` table add complexity and maintenance burden
  - **Trigger test coverage needed** — triggers are invisible code; must have integration tests
  - **`pet_names_text` can go stale** — if triggers fail or are temporarily dropped during maintenance
  - **Prisma drift** — custom migration creates index Prisma doesn't know about; `prisma migrate dev` will show schema drift warning
  - **Storage overhead** — ngram index is larger than word-based (more tokens)
  - **Migration touches both tables** — clients table altered, pets table triggers added
- **Effort**: High
- **Substring coverage**: FULL (any 2+ char substring)

### Option B: N-gram FTS on Clients + Separate N-gram FTS on Pets (🔀 Two Queries Merged)

**Two independent FTS searches merged in the application layer**. No denormalization, no triggers.

**Architecture**:
```
clients search
  → Query 1: MATCH(name, email, phone, phone2, address, notes)
             AGAINST(? IN NATURAL LANGUAGE MODE) → Client[]
  → Query 2: MATCH(name, breed, notes) AGAINST(? IN NATURAL LANGUAGE MODE) → client_ids[]
  → Merge: union client IDs from both queries, fetch full Client objects
```

**Migration required**:
```sql
-- 1. Collation change
ALTER TABLE clients CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 2. Drop old index, create ngram on 6 client columns
ALTER TABLE clients DROP INDEX clients_name_email_idx;
CREATE FULLTEXT INDEX clients_fts_idx
  ON clients(name, email, phone, phone2, address, notes)
  WITH PARSER ngram;

-- 3. Drop old pets index, create ngram on 3 pet columns
ALTER TABLE pets DROP INDEX pets_name_breed_notes_idx;
CREATE FULLTEXT INDEX pets_fts_idx
  ON pets(name, breed, notes)
  WITH PARSER ngram;
```

**Application-layer merge pseudocode**:
```typescript
async search(query: string): Promise<Client[]> {
  // Query 1: clients by their own fields
  const clientMatches = await prisma.$queryRaw<ClientRow[]>`
    SELECT ... FROM clients
    WHERE MATCH(name, email, phone, phone2, address, notes)
          AGAINST(${query} IN NATURAL LANGUAGE MODE)
      AND deleted_at IS NULL
    LIMIT 50
  `;

  // Query 2: find client IDs via pet matches
  const petClientIds = await prisma.$queryRaw<Array<{ client_id: number }>>`
    SELECT DISTINCT client_id FROM pets
    WHERE MATCH(name, breed, notes)
          AGAINST(${query} IN NATURAL LANGUAGE MODE)
      AND deleted_at IS NULL
    LIMIT 50
  `;

  // Merge: union all client IDs, fetch full records, dedupe
  const allIds = new Set([
    ...clientMatches.map(c => c.id),
    ...petClientIds.map(p => p.client_id)
  ]);

  // Fetch full Client objects for all unique IDs
  // ... (one more query or merge from clientMatches)
}
```

- **Pros**:
  - **No triggers** — no denormalization, no trigger maintenance
  - **Cleaner migration** — only indexes change, no column/trigger additions
  - **Pets FTS becomes independently useful** — searchable by name, breed, notes with substring matching
  - **No Prisma drift on pets table** — index recreation is straightforward
  - **Lower operational risk** — no denormalized data that can go stale
- **Cons**:
  - **Two queries** — 2 FTS queries + 1 fetch query (3 total round-trips to DB)
  - **Application-layer merge** — deduplication logic, UNION semantics in code
  - **DISTINCT on pets query** — one client with 3 matching pets returns 3 `client_id` rows; need DISTINCT
  - **Result ordering** — FTS relevance scores from two separate queries can't be compared directly; resulting list order is arbitrary
  - **Same result may appear in both queries** — need proper dedup
- **Effort**: Medium
- **Substring coverage**: FULL (any 2+ char substring)

### Option C: N-gram FTS on Clients + Existing Standard FTS on Pets (🔄 Hybrid)

**Clients index uses ngram for substring matching; pets index remains on default word-based parser** (no change to pets). Pet matches are done via existing `MATCH(name, breed, notes) AGAINST(? IN BOOLEAN MODE)` — word-only matching for pets.

- **Pros**:
  - **Only clients table changes** — no pets migration
  - **Lower risk** — only one FTS index changes
- **Cons**:
  - **Pet name matching is word-only** — "lab" does NOT match "labrador" in pets, only "lab" as standalone word
  - **Inconsistent search behavior** — clients get substring matching, pets get word matching
  - **Fails core requirement** — the intent is substring search across ALL fields including pet names
- **Effort**: Low-Medium
- **Substring coverage**: PARTIAL (clients only; pets are word-only)

---

## N-gram FTS Technical Deep Dive

### How ngram_token_size=2 Tokenizes

| Input Text | N-gram Tokens (n=2) |
|---|---|
| `"labrador"` | `la ab br ra ad do or` |
| `"555-1234"` | `55 5- -1 12 23 34` |
| `"Calle Mayor"` | `Ca al ll le e  M Ma ay yo or` (space is tokenized as `e `) |
| `"ñandú"` | `ña an nd dú` (collation-dependent) |

With `utf8mb4_0900_ai_ci` collation: `Ñandú` produces ngrams `ña an nd dú` and matches queries for `nandu` (which produces `na an nd du`) — accent folding makes `ñ=n` and `ú=u`.

### NATURAL LANGUAGE MODE vs BOOLEAN MODE with N-gram

| Feature | NATURAL LANGUAGE MODE | BOOLEAN MODE |
|---|---|---|
| Syntax | No operators needed | Operators: `+term`, `-term` |
| Substring matching | ✅ Works — ngrams from query match ngrams in index | ✅ Works but operators may interfere |
| Wildcard `*` | Not applicable | ⚠️ May not work with ngram (no "word start" concept) |
| Relevance scoring | ✅ Returns relevance-ranked results | ✅ Returns relevance-ranked results |
| Operator injection risk | None (no operators) | Requires sanitization if user can input `+`/`-` |
| Minimum query length | ngram_token_size = 2 → 2+ chars | Same |

**Recommendation**: Use **NATURAL LANGUAGE MODE** with ngram. It eliminates the FTS operator injection vector entirely (no `+`, `-`, `*`, `"`, `(`, `)` to worry about). `sanitizeFtsQuery` simplifies to whitespace cleanup only. Users type plain text and get substring matches — no need to learn FTS syntax.

### Prisma Compatibility with N-gram

**Prisma's `@@fulltext` does NOT support `WITH PARSER ngram`**. The Prisma schema:
```prisma
@@fulltext([name, email, phone, phone2, address, notes])
```
generates:
```sql
CREATE FULLTEXT INDEX `clients_name_email_phone_phone2_address_notes_idx`
  ON `clients` (`name`, `email`, `phone`, `phone2`, `address`, `notes`);
```
No parser specification. This uses the default word-based parser.

**Resolution strategy — two options:**

**Strategy 1: Pure SQL migration (recommended)**
- Keep `@@fulltext([name, email, phone, phone2, address, notes])` in schema.prisma for documentation and schema introspection
- Create a custom migration that:
  1. Creates FTS with ngram parser via raw SQL
  2. Marks the migration as `-- This migration manages FTS indexes manually (ngram parser)`
- Downside: `prisma migrate dev` may show a "drift" warning because the actual index uses ngram parser while Prisma expects default parser. This is a cosmetic warning, not a functional issue.

**Strategy 2: Drop `@@fulltext` from schema.prisma entirely**
- Remove the `@@fulltext` attribute from the Client model
- Manage FTS indexes entirely through raw SQL migrations
- No Prisma drift warnings
- Downside: schema.prisma no longer documents that FTS indexes exist on those columns

**Decision**: Strategy 2 is cleaner. Remove the Prisma-managed `@@fulltext` from Clients (and optionally Pets, if Option B is chosen). Document the FTS indexes in migration comments.

### MySQL Server Variables for N-gram

| Variable | Default | Our Value | Where to Set |
|---|---|---|---|
| `ngram_token_size` | 2 | 2 | `docker/my.cnf` → `[mysqld]` section |
| `ft_min_word_len` | 4 (default) | 2 (current) | Already set; irrelevant for ngram but harmless |

Add to `docker/my.cnf`:
```ini
ngram_token_size = 2
```

Note: `ngram_token_size` is a read-only server variable changed at startup. It cannot be changed with `SET GLOBAL`. A Docker container restart is required after my.cnf changes.

### Collation Migration Impact

Changing from `utf8mb4_unicode_ci` to `utf8mb4_0900_ai_ci`:

1. **Server collation** (`docker/my.cnf`): `collation-server = utf8mb4_0900_ai_ci`
2. **Table collation** (migration): `ALTER TABLE clients CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`
3. **Prisma schema**: Prisma doesn't model collation directly, so this is purely a migration concern
4. **FTS index rebuild**: After collation change, FTS indexes MUST be rebuilt because the ngram tokens are collation-dependent

```sql
-- Full migration sequence for collation + ngram:
ALTER TABLE clients CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE clients DROP INDEX clients_name_email_idx;
CREATE FULLTEXT INDEX clients_fts_idx ON clients(name, email, phone, phone2, address, notes) WITH PARSER ngram;
```

---

## Cross-Table Pet Name FTS — Detailed Analysis

This is the hardest part of the design. Three concrete strategies:

### Strategy A: Denormalized Column + Triggers (Option A above)
- **How**: `pet_names_text` column on `clients` table, maintained by 3 triggers on `pets` table, included in the ngram FTS index
- **Query**: Single FTS query → all results come back ranked by relevance
- **Risk**: Trigger maintenance; if triggers are dropped or bypassed, the column goes stale
- **Test strategy**: Integration tests that INSERT/UPDATE/DELETE pets and verify `pet_names_text` is updated

### Strategy B: Two Queries + App Merge (Option B above)
- **How**: Query clients FTS → get Client[], query pets FTS → get client_ids[], merge & dedupe
- **Query**: 3 queries (clients FTS, pets FTS, fetch full clients for pet-matched IDs)
- **Risk**: Application-layer logic; DISTINCT needed; result ordering not deterministic between queries
- **Optimization**: Can do both FTS queries in parallel (`Promise.all`)

### Strategy C: `GROUP_CONCAT` in Subquery (Hybrid, No Triggers)
- **How**: Include a subquery in the main FTS query that searches pet names
- **Query**:
  ```sql
  SELECT DISTINCT c.* FROM clients c
  LEFT JOIN pets p ON p.client_id = c.id AND p.deleted_at IS NULL
  WHERE c.deleted_at IS NULL
    AND (
      MATCH(c.name, c.email, c.phone, c.phone2, c.address, c.notes)
        AGAINST(? IN NATURAL LANGUAGE MODE)
      OR EXISTS (
        SELECT 1 FROM pets p2
        WHERE p2.client_id = c.id AND p2.deleted_at IS NULL
          AND MATCH(p2.name, p2.breed, p2.notes)
            AGAINST(? IN NATURAL LANGUAGE MODE)
      )
    )
  LIMIT 50
  ```
- **Pros**: Single query, no triggers, no app-layer merge
- **Cons**: EXISTS subquery with FTS may not use the FTS index efficiently (MySQL optimizer may not push the MATCH condition down); performance unclear without benchmarking; DISTINCT still needed for the JOIN

---

## Recommendation

### Primary: **Option B — Two ngram FTS queries merged in application layer**

**Rationale**:
1. **No triggers** — avoids the biggest source of operational risk and hidden bugs
2. **Clean migrations** — only indexes change; no new columns, no triggers
3. **Both FTS indexes independently useful** — pets table gets substring search as a bonus
4. **Three DB round-trips** is acceptable for this data scale (pet grooming business, hundreds to low thousands of records)
5. **NATURAL LANGUAGE MODE** eliminates FTS operator injection entirely — no `+`, `-`, `*`, `"`, `(`, `)` in `sanitizeFtsQuery`
6. **Predictable behavior** — the merge logic is explicit in application code, not hidden in database triggers

### Fallback: **Option A — Denormalized column** if:
- Profiling shows 3 round-trips is a real bottleneck (unlikely at this scale)
- The team is comfortable with trigger-based maintenance and has trigger test coverage

### Not Recommended: **Option C (hybrid)** because it gives inconsistent search — clients get substring matching but pets don't. This is a worse UX than the current behavior.

---

## Risks

1. **ngram index size**: A FULLTEXT index with ngram parser is substantially larger than a word-based FTS index (roughly 3-5x more tokens). For a pet grooming business with thousands of rows, this is negligible. Monitor index size in production.

2. **Collation migration**: Changing from `utf8mb4_unicode_ci` to `utf8mb4_0900_ai_ci` is a breaking change for string comparison semantics. Verify no application code relies on `unicode_ci` sort order. The CodeGraph exploration did not find any collation-dependent application logic.

3. **Prisma schema drift**: If `@@fulltext` is removed from schema.prisma, `prisma migrate dev` will not manage FTS indexes — they become purely migration-managed. Document this in a migration README to prevent accidental index drops.

4. **ngram_token_size requires Docker restart**: Adding `ngram_token_size=2` to my.cnf means a full `docker compose down && docker compose up -d` cycle (not just restart) for the change to take effect.

5. **FTS relevance ordering across queries**: With two separate FTS queries, results from the pets query and the clients query can't be merged into a single relevance-ordered list. The merged result will show client matches first, then pet matches (or vice versa). This is acceptable for a search results list but worth documenting.

6. **BOOLEAN MODE operator semantics with ngram**: If NATURAL LANGUAGE MODE is chosen, this risk is eliminated. If BOOLEAN MODE is needed later, the `*` wildcard and phrase operators behave differently with ngram — must test thoroughly.

---

## Ready for Proposal: **Yes**

The exploration is complete. The recommended approach is:

- **ngram FTS parser** with `ngram_token_size=2` (MySQL default)
- **NATURAL LANGUAGE MODE** for FTS queries (no operator injection surface)
- **Two separate ngram indexes**: clients (6 columns) + pets (3 columns) with app-layer merge
- **Collation migration** from `utf8mb4_unicode_ci` to `utf8mb4_0900_ai_ci`
- **Custom SQL migration** for ngram FTS indexes (remove `@@fulltext` from Prisma schema)
- **Frontend improvements**: 300ms debounce + 2-char min gate on SearchInput
