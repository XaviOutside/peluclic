# Delta for Pet Management Backend

## MODIFIED Requirements

### Requirement: List Pets (FR-3)

`GET /api/v1/pets?page=1&limit=20&clientId=5` MUST return `{ data: PetResponseDto[], meta: { total: number, page: number, limit: number, totalPages: number } }`. The repository MUST call `count()` alongside `findMany`, respecting the same filters: `deletedAt IS NULL` AND `status=1` (active), plus optional `clientId`. `totalPages = Math.ceil(total / limit)`. Defaults: `page=1`, `limit=20`.

(Previously: returned flat `PetResponseDto[]` without pagination metadata or count query)

#### Scenario: Paginated list with metadata

- GIVEN 30 active, non-deleted pets
- WHEN `GET /api/v1/pets?page=2&limit=10` is called
- THEN `data` has 10 items, `meta={total:30, page:2, limit:10, totalPages:3}`

#### Scenario: Inactive pets excluded from count

- GIVEN 3 active and 2 inactive non-deleted pets
- WHEN `GET /api/v1/pets` is called
- THEN `data` has 3 items, `meta.total=3`

#### Scenario: clientId filter reflected in count

- GIVEN 8 pets for clientId=5, 4 for clientId=7
- WHEN `GET /api/v1/pets?clientId=5` is called
- THEN `meta.total=8`

#### Scenario: Empty list

- GIVEN no active pets
- WHEN `GET /api/v1/pets` is called
- THEN `data=[], meta={total:0, page:1, limit:20, totalPages:0}`
