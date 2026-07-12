# Delta for Services API Backend

## MODIFIED Requirements

### Requirement: List Services (FR-3)

`GET /api/v1/services?page=1&limit=20&petId=5` MUST return `{ data: ServiceResponseDto[], meta: { total: number, page: number, limit: number, totalPages: number } }`. The repository MUST call `count()` alongside `findMany`, respecting the same filter: `deletedAt IS NULL` and optional `petId`. `totalPages = Math.ceil(total / limit)`. Defaults: `page=1`, `limit=20`. Non-deleted services only — no `status` filter.

(Previously: returned flat `ServiceResponseDto[]` without pagination metadata or count query)

#### Scenario: Paginated list with metadata

- GIVEN 25 non-deleted services
- WHEN `GET /api/v1/services?page=1&limit=10` is called
- THEN `data` has 10 items, `meta={total:25, page:1, limit:10, totalPages:3}`

#### Scenario: Soft-deleted excluded from count

- GIVEN 3 active, 1 inactive, 2 soft-deleted
- WHEN `GET /api/v1/services` is called
- THEN `meta.total=4` (non-deleted only, regardless of status)

#### Scenario: petId filter reflected in count

- GIVEN 5 services with petId=5 and 3 with petId=7
- WHEN `GET /api/v1/services?petId=5` is called
- THEN `meta.total=5`

#### Scenario: petId with no matches

- GIVEN no services linked to petId=99
- WHEN `GET /api/v1/services?petId=99` is called
- THEN `data=[], meta={total:0, page:1, limit:20, totalPages:0}`

#### Scenario: Default page/limit

- GIVEN 42 non-deleted services
- WHEN `GET /api/v1/services` (no query params) is called
- THEN `meta={page:1, limit:20, total:42, totalPages:3}`
