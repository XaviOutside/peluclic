# Delta for services-api-backend

## MODIFIED Requirements

### Requirement: Create Service (FR-1)

`POST /api/v1/services` — body: `{ name, description?, duration_minutes?, price, petId? }`. MUST create service with `status=1` and `deleted_at=NULL`. `petId` optional; no pet-existence validation (application-layer only). Returns `201`.

(Previously: no `petId` field.)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Happy path | name="Full Groom", price=5000, duration=60 | POST | 201, price=50.00 |
| 2 | With petId | payload includes petId=5 | POST | 201, petId=5 |
| 3 | Missing name | no `name` | POST | 422 `"name is required"` |
| 4 | Missing price | no `price` | POST | 422 `"price is required"` |
| 5 | Name >255 chars | name >255 chars | POST | 422 length error |
| 6 | Negative price | price=-1000 | POST | 422 non-negative error |
| 7 | Negative duration | duration=-10 | POST | 422 positive error |
| 8 | All optionals omitted | only name + price | POST | 201, description=null, duration=null, petId=null |

### Requirement: List Services (FR-3)

`GET /api/v1/services?page=1&limit=20&petId=5` — paginated non-deleted services. Optional `petId` query param filters by linked pet.

(Previously: no `petId` filter.)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Paginated list | 5 non-deleted services | GET | 200, array of 5 |
| 2 | Filter by petId | 3 services petId=5, 2 petId=7 | GET ?petId=5 | 200, only 3 |
| 3 | petId no matches | no services petId=99 | GET ?petId=99 | 200, `[]` |
| 4 | Soft-deleted excluded | 3 active, 1 inactive, 2 deleted | GET | 200, only 4 |

### Requirement: Update Service (FR-4)

`PUT /api/v1/services/:id` — body: `{ name?, description?, duration_minutes?, price?, petId? }`. `status` forbidden. `petId: null` unlinks. `petId: N` links (no check).

(Previously: no `petId` field.)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Successful update | id=1, not deleted | PUT { name: "Deluxe Groom" } | 200, updated |
| 2 | Unlink | id=1, petId=5 | PUT { petId: null } | 200, petId=null |
| 3 | Link | id=1, petId=null | PUT { petId: 5 } | 200, petId=5 |
| 4 | Forbidden status | id=1 | PUT { status: 0 } | 422 |
| 5 | Update deleted | id=1, deletedAt set | PUT | 404 |

### Requirement: DTO Mapping (FR-8)

MUST map `pet_id` → `petId` (nullable number) alongside existing snake_case→camelCase, cents→dollars, status→string.

(Previously: no `petId` mapping.)

#### Scenario: Full mapping with petId null

- GIVEN DB row: name="Bath", price=2500, status=1, pet_id=null, duration_minutes=null
- WHEN mapped to ServiceResponseDto
- THEN { name:"Bath", price:25.00, status:"active", petId:null, durationMinutes:null }

### Requirement: Domain Rules

(Previously: no `petId` rule.)

| Rule | Enforcement |
|------|-------------|
| Status: 0=inactive, 1=active | `ServiceStatus = 0 \| 1` |
| Price: integer cents → DTO dollars | DB `INT` |
| **petId: nullable INT, no FK, no existence check** | Application-layer integrity |
| Timestamps UTC | `@default(now())` + `@updatedAt` |
| No FK constraints | Enforced by omission |
| FTS: name + description | `@@fulltext([name, description])` |

### Requirement: Validation Rules

(Previously: no `petId` field.)

| Field | Rule |
|-------|------|
| name | Required, 1–255 chars |
| description | Optional, TEXT |
| duration_minutes | Optional, positive integer |
| price | Required, integer ≥ 0 (cents) |
| **petId** | **Optional, integer (no existence check)** |
| search q | Required, strip FTS operators |

## ADDED Requirements

### Requirement: Cascade Unlink on Pet Delete (FR-10)

`IServiceRepository.unlinkAllByPetId(petId: number): Promise<void>` MUST set `pet_id = NULL` on all non-deleted services linked to the given pet. Called by `SoftDeletePet` before soft-deleting.

#### Scenario: Cascade unlinks linked services

- GIVEN pet id=7 with 3 linked non-deleted services (10, 11, 12)
- WHEN `unlinkAllByPetId(7)` is called
- THEN services 10, 11, 12 have petId=null

#### Scenario: No linked services — no-op

- GIVEN pet id=7 with zero linked services
- WHEN `unlinkAllByPetId(7)` is called
- THEN no rows updated; no error
