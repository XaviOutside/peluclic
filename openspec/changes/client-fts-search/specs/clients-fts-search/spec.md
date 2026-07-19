# Clients FTS Search Specification

## Purpose

Ngram full-text substring search across client and pet fields using MySQL NATURAL LANGUAGE MODE with accent folding.

## Requirements

| # | Requirement | Strength | Summary |
|---|---|---|---|
| R1 | Ngram Substring Search | MUST | Search 6 client cols + 3 pet cols via ngram FTS (`token_size=3`), NATURAL LANGUAGE MODE. Merge at app layer. |
| R2 | Minimum Query Length Gate | SHALL | Queries < 3 chars after trimming return `[]` without DB call. |
| R3 | Stopword Filtering | MUST | Strip ~40 es/en stopwords before FTS. All-stopword query → `[]`. |
| R4 | Cross-Entity Merge | MUST | Two FTS queries (clients + pets), `DISTINCT client_id`, deduplicate in app layer, fetch full records. |
| R5 | SANE Output Validation | MUST | Validate `$queryRaw` shape (array of `{id: positive int}`, ≤10k rows) and query invariants (no FTS operators, ≥3 chars or empty). Fail → `SANE_ERROR`. |
| R6 | Database Collation | MUST | `utf8mb4_0900_ai_ci` for accent folding (ñ=n, é=e). `ngram_token_size=3` in `docker/my.cnf`. |

### Requirement: Ngram Substring Search (R1)

The system MUST search clients using ngram FTS in NATURAL LANGUAGE MODE across clients (name, email, phone, phone2, address, notes) and pets (name, breed, notes). Results SHALL merge at the application layer.

#### Scenario: Substring match on pet breed

- GIVEN a client owns a pet with breed "Labrador"
- WHEN searching "bra"
- THEN the client appears in results

#### Scenario: Partial phone match

- GIVEN a client has phone "555-1234"
- WHEN searching "555"
- THEN the client appears in results

#### Scenario: Accent-insensitive match

- GIVEN a client named "Ñandú"
- WHEN searching "ña"
- THEN the client appears via `utf8mb4_0900_ai_ci` accent folding

### Requirement: Minimum Query Length Gate (R2)

The system SHALL return `[]` for queries with fewer than 3 characters after whitespace trimming.

#### Scenario: Short query returns empty

- GIVEN query "ab"
- WHEN the search executes
- THEN `[]` is returned without a DB query

### Requirement: Stopword Filtering (R3)

The system MUST strip Spanish/English stopwords (~40 prepositions and articles) before FTS. If ALL words are stopwords, the gate SHALL return `[]`.

#### Scenario: Stopwords stripped

- GIVEN query "Calle de la Paz"
- WHEN sanitized
- THEN "de" and "la" are removed → FTS uses "calle paz"

#### Scenario: All-stopword query

- GIVEN query "de la"
- WHEN sanitized
- THEN `[]` is returned without a DB query

### Requirement: Cross-Entity Merge (R4)

The system MUST query clients FTS and pets FTS independently, merge distinct client IDs, then fetch full records.

#### Scenario: Client found via pet field

- GIVEN pet "Firulais" linked to client 10
- WHEN searching "Firulais"
- THEN client 10 appears via the pets FTS query

#### Scenario: Deduplication

- GIVEN client 10 appears in both clients and pets FTS results
- WHEN the app layer merges
- THEN client 10 appears exactly once

### Requirement: SANE Output Validation (R5)

The system MUST validate FTS output shape and query invariants via a SANE function. Failures SHALL throw a `SANE_ERROR`.

#### Scenario: Valid output passes

- GIVEN sanitized query "calle paz" and FTS returns `[{id:1}, {id:5}]`
- WHEN SANE runs
- THEN no error

#### Scenario: Malicious query caught

- GIVEN sanitized query contains `"` or `+`
- WHEN SANE validates query invariants
- THEN `SANE_ERROR` is thrown before DB execution

#### Scenario: Unexpected shape caught

- GIVEN `$queryRaw` returns `[{client_id: 1}]` (wrong key)
- WHEN SANE validates output shape
- THEN `SANE_ERROR` is thrown

### Requirement: Database Collation (R6)

The database MUST use `utf8mb4_0900_ai_ci`. The ngram parser MUST use `ngram_token_size=3` configured in `docker/my.cnf`.

#### Scenario: Accent folding in practice

- GIVEN `utf8mb4_0900_ai_ci` collation
- WHEN "Peña" is stored and searched as "pena"
- THEN the match succeeds
