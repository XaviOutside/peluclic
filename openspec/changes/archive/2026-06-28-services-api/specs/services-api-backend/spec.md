# Services API Backend Specification

## Purpose

REST API for Service CRUD + search at `/api/v1/services`, following the Pets Clean Architecture pattern. Single `status` TINYINT — no separate `active` field. Price stored as integer cents, exposed as dollar decimals in DTOs.

## Requirements

### Requirement: Create Service (FR-1)

`POST /api/v1/services` — body: `{ name, description?, duration_minutes?, price }`. The system MUST create a service with `status=1` (active) and `deleted_at=NULL` when all required fields are valid. Returns `201` with `ServiceResponseDto`.

#### Scenario: Happy path

- GIVEN valid payload: name="Full Groom", price=5000, duration_minutes=60
- WHEN `POST /api/v1/services` is called
- THEN service created with status=active, 201 returns ServiceResponseDto (price=50.00)

#### Scenario: Missing name

- GIVEN a payload without `name`
- WHEN `POST /api/v1/services` is called
- THEN 422 `"name is required"`

#### Scenario: Missing price

- GIVEN a payload without `price`
- WHEN `POST /api/v1/services` is called
- THEN 422 `"price is required"`

#### Scenario: Name exceeds 255 chars

- GIVEN name > 255 characters
- WHEN `POST /api/v1/services` is called
- THEN 422 `"name must be 255 characters or fewer"`

#### Scenario: Negative price

- GIVEN price: -1000
- WHEN `POST /api/v1/services` is called
- THEN 422 `"price must be a non-negative integer"`

#### Scenario: Negative duration

- GIVEN duration_minutes: -10
- WHEN `POST /api/v1/services` is called
- THEN 422 `"duration_minutes must be a positive integer"`

#### Scenario: Optional fields omitted

- GIVEN payload without description and duration_minutes
- WHEN `POST /api/v1/services { name: "Bath", price: 2500 }` is called
- THEN service created with description=null, duration_minutes=null, 201

### Requirement: Get Service (FR-2)

`GET /api/v1/services/:id` — returns service or 404. Soft-deleted services return 404.

#### Scenario: Found

- GIVEN service id=1, deletedAt=null
- WHEN `GET /api/v1/services/1` is called
- THEN 200 returns ServiceResponseDto with price in dollars

#### Scenario: Not found

- GIVEN no service id=999
- WHEN `GET /api/v1/services/999` is called
- THEN 404 `"Service with id 999 not found"`

### Requirement: List Services (FR-3)

`GET /api/v1/services?page=1&limit=20` — returns paginated list of all non-deleted services. No filtering by status.

#### Scenario: Paginated list

- GIVEN 5 non-deleted services (mixed active/inactive)
- WHEN `GET /api/v1/services` is called
- THEN 200 returns array of 5 ServiceResponseDto

#### Scenario: Soft-deleted excluded

- GIVEN 3 active, 1 inactive, 2 soft-deleted
- WHEN `GET /api/v1/services` is called
- THEN 200 returns only 4 (non-deleted)

### Requirement: Update Service (FR-4)

`PUT /api/v1/services/:id` — body: `{ name?, description?, duration_minutes?, price? }`. Validate constraints on provided fields. `status` is forbidden.

#### Scenario: Successful update

- GIVEN service id=1 not deleted
- WHEN `PUT /api/v1/services/1 { name: "Deluxe Groom", price: 7500 }` is called
- THEN 200 returns ServiceResponseDto with updated fields

#### Scenario: Forbidden status field

- GIVEN service id=1
- WHEN `PUT /api/v1/services/1 { status: 0 }` is called
- THEN 422 `"status field is not allowed in PUT. Use PATCH /:id/deactivate instead."`

#### Scenario: Update deleted service

- GIVEN service id=1 deletedAt not null
- WHEN `PUT /api/v1/services/1` is called
- THEN 404

### Requirement: Deactivate Service (FR-5)

`PATCH /api/v1/services/:id/deactivate` — sets status=0. Returns 200. Idempotent: already-inactive returns 200 with no error.

#### Scenario: Deactivate active

- GIVEN active service id=1
- WHEN `PATCH /api/v1/services/1/deactivate` is called
- THEN 200 ServiceResponseDto with status=inactive

#### Scenario: Idempotent deactivate

- GIVEN service already status=inactive, not deleted
- WHEN `PATCH /api/v1/services/1/deactivate` is called
- THEN 200 (no error)

### Requirement: Soft-Delete Service (FR-6)

`DELETE /api/v1/services/:id` — sets `deleted_at=NOW()`. Returns 204. Already-deleted returns 409.

#### Scenario: Soft-delete

- GIVEN non-deleted service id=1
- WHEN `DELETE /api/v1/services/1` is called
- THEN 204, deletedAt set

#### Scenario: Already deleted

- GIVEN service id=1 deletedAt not null
- WHEN `DELETE /api/v1/services/1` is called
- THEN 409 `"Service with id 1 is already deleted"`

### Requirement: Search Services (FR-7)

`GET /api/v1/services/search?q=<query>` — FTS via `MATCH(name, description) AGAINST(? IN BOOLEAN MODE)`. Non-deleted only. FTS operators stripped before query.

#### Scenario: Match by name

- GIVEN service "Nail Trim"
- WHEN `GET /api/v1/services/search?q=nail` is called
- THEN 200 returns ["Nail Trim"]

#### Scenario: Match by description

- GIVEN "Full Groom" (desc: "Complete haircut") and "Bath Only" (desc: "Wash and dry")
- WHEN `GET /api/v1/services/search?q=haircut` is called
- THEN 200 returns ["Full Groom"] only

#### Scenario: No match

- GIVEN no matches for "veterinary"
- WHEN `GET /api/v1/services/search?q=veterinary` is called
- THEN 200 returns `[]`

#### Scenario: Empty query

- WHEN called with `q=` (empty)
- THEN 400 `"Query parameter 'q' is required"`

#### Scenario: FTS operators sanitized

- WHEN `GET /api/v1/services/search?q=+haircut -bath` is called
- THEN FTS operators stripped; query matches normally

### Requirement: Domain Rules

| Rule | Enforcement |
|------|-------------|
| Status: TINYINT (0=inactive, 1=active) | Domain type `ServiceStatus = 0 \| 1` |
| Price: integer cents | DB stores `INT`; DTO converts to dollars |
| Timestamps: UTC | `@default(now())` + `@updatedAt` |
| No FK constraints | Design rule — enforced by omission |
| FTS: name + description | `@@fulltext([name, description])` |
| No name uniqueness | Duplicate names allowed |
| No cascade | Appointments not built yet |

### Requirement: Validation Rules

| Field | Rule |
|-------|------|
| name | Required, 1–255 chars |
| description | Optional, TEXT |
| duration_minutes | Optional, positive integer |
| price | Required, integer ≥ 0 (cents) |
| search q | Required, strip FTS operators `+ - * " ( )` |

### Requirement: DTO Mapping (FR-8)

Response DTO MUST map snake_case DB columns to camelCase, convert price cents→dollars, and map TINYINT status to string labels.

#### Scenario: Full mapping

- GIVEN DB row: name="Bath", price=2500, status=1, duration_minutes=null
- WHEN mapped to ServiceResponseDto
- THEN response: { name: "Bath", price: 25.00, status: "active", durationMinutes: null }
