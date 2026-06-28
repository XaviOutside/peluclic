# Pet Management Backend Specification

## Purpose

REST API for full Pet CRUD + search at `/api/v1/pets`, following the Clients bounded context Clean Architecture pattern (domain entity → use cases → controller → router → Prisma repo).

## Requirements

### Requirement: Create Pet (FR-1)

`POST /api/v1/pets` — body: `{ name, species, breed?, client_id, date_of_birth?, weight_kg?, sex? }`.

The system MUST create a pet with `status=1` (active) and `deleted_at=NULL` when all required fields are valid and `client_id` references an active, non-deleted client. Returns `201` with `PetResponseDto`.

#### Scenario: Happy path

- GIVEN `client_id=42` exists with status=active and deletedAt=null
- WHEN `POST /api/v1/pets { name: "Rex", species: "Dog", client_id: 42 }` is called
- THEN pet is created, status=active, and 201 returns the PetResponseDto

#### Scenario: Missing required field — name

- GIVEN a payload without `name`
- WHEN `POST /api/v1/pets` is called
- THEN return 422 with `"name is required"`

#### Scenario: Invalid client_id — dead client

- GIVEN `client_id=99` references a client with deletedAt not null
- WHEN `POST /api/v1/pets` is called with that client_id
- THEN return 422 with `"client_id references a deleted client"`

#### Scenario: Invalid client_id — inactive client

- GIVEN `client_id=99` references a client with status=inactive
- WHEN `POST /api/v1/pets` is called with that client_id
- THEN return 422 with `"client_id references an inactive client"`

#### Scenario: Invalid client_id — nonexistent

- GIVEN `client_id=99999` does not reference any existing client
- WHEN `POST /api/v1/pets` is called with that client_id
- THEN return 422 with `"client_id not found"`

### Requirement: Get Pet (FR-2)

`GET /api/v1/pets/:id` — returns pet or 404.

#### Scenario: Found

- GIVEN a pet exists with id=7 and deletedAt=null
- WHEN `GET /api/v1/pets/7` is called
- THEN 200 returns PetResponseDto with all fields

#### Scenario: Not found

- GIVEN no pet with id=999
- WHEN `GET /api/v1/pets/999` is called
- THEN 404 `"Pet with id 999 not found"`

### Requirement: List Pets (FR-3)

`GET /api/v1/pets?page=1&limit=20` — returns paginated, non-deleted pets, active-only by default.

#### Scenario: Paginated list

- GIVEN 5 active pets exist
- WHEN `GET /api/v1/pets` is called
- THEN 200 returns array of 5 PetResponseDto

#### Scenario: Inactive pets excluded by default

- GIVEN 3 active and 2 inactive pets
- WHEN `GET /api/v1/pets` is called
- THEN 200 returns only 3 active pets

### Requirement: Update Pet (FR-4)

`PUT /api/v1/pets/:id` — body: `{ name?, species?, breed?, client_id?, date_of_birth?, weight_kg?, sex? }`. The system MUST validate client_id if provided. `status` is forbidden in PUT body.

#### Scenario: Successful update

- GIVEN pet id=7 exists and is not deleted
- WHEN `PUT /api/v1/pets/7 { name: "Max" }` is called
- THEN 200 returns PetResponseDto with name="Max"

#### Scenario: Forbidden status field

- GIVEN pet id=7
- WHEN `PUT /api/v1/pets/7 { status: 0 }` is called
- THEN 422 `"status field is not allowed in PUT. Use PATCH /:id/deactivate instead."`

### Requirement: Deactivate Pet (FR-5)

`PATCH /api/v1/pets/:id/deactivate` — sets status=0 (inactive). Returns 200 with PetResponseDto.

#### Scenario: Deactivate

- GIVEN an active pet id=7
- WHEN `PATCH /api/v1/pets/7/deactivate` is called
- THEN 200 returns PetResponseDto with status=inactive

### Requirement: Soft-Delete Pet (FR-6)

`DELETE /api/v1/pets/:id` — MUST first unlink all linked services via `IServiceRepository.unlinkAllByPetId(id)`, then set `deleted_at=NOW()`. Returns 204. Already-deleted returns 409 (no cascade).

#### Scenario: Soft-delete with service unlink

- GIVEN non-deleted pet id=7 linked to 3 services
- WHEN `DELETE /api/v1/pets/7` is called
- THEN all 3 services get petId=null, pet.deletedAt set to UTC now, 204

#### Scenario: Soft-delete with no linked services

- GIVEN non-deleted pet id=7 with no linked services
- WHEN `DELETE /api/v1/pets/7` is called
- THEN pet.deletedAt set, 204 (unlinkAllByPetId is no-op)

#### Scenario: Already deleted

- GIVEN pet id=7 with deletedAt not null
- WHEN `DELETE /api/v1/pets/7` is called
- THEN 409 `"Pet with id 7 is already deleted"`

### Requirement: Search Pets (FR-7)

`GET /api/v1/pets/search?q=<query>` — FTS via `MATCH(name, breed, notes) AGAINST(? IN BOOLEAN MODE)`. Returns only non-deleted, active-by-default pets.

#### Scenario: Match found

- GIVEN a pet "Rex" (German Shepherd) and "Bella" (Poodle)
- WHEN `GET /api/v1/pets/search?q=shepherd` is called
- THEN 200 returns array with only "Rex"

#### Scenario: No match

- GIVEN no pets match "unicorn"
- WHEN `GET /api/v1/pets/search?q=unicorn` is called
- THEN 200 returns empty array `[]`

#### Scenario: Missing query param

- GIVEN the `/search` endpoint
- WHEN called without the `q` query parameter or with `q=` (empty)
- THEN 400 `"Query parameter 'q' is required"`

### Requirement: Cascade Deactivate (FR-8)

When `DeactivateClientUseCase` executes, it MUST also deactivate all non-deleted pets belonging to that client via `IPetRepository.deactivateByClientId(clientId)`.

#### Scenario: Cascade deactivate on client deactivation

- GIVEN client id=42 has 3 active pets
- WHEN `PATCH /api/v1/clients/42/deactivate` is called
- THEN all 3 pets are deactivated (status=0)

### Requirement: Cascade Soft-Delete (FR-8b)

When `SoftDeleteClientUseCase` executes, it MUST also soft-delete all non-deleted pets belonging to that client via `IPetRepository.softDeleteByClientId(clientId)`.

#### Scenario: Cascade delete on client soft-delete

- GIVEN client id=42 has 2 non-deleted pets
- WHEN `DELETE /api/v1/clients/42` is called
- THEN all 2 pets get deletedAt set to current UTC timestamp

### Requirement: Domain Rules

| Rule | Enforcement |
|------|-------------|
| Pet MUST belong to active non-deleted client | CreatePet use case validates client_id |
| Pet sex: TINYINT enum (0=unknown, 1=male, 2=female) | Domain type `PetSex = 0 \| 1 \| 2` |
| Pet status: TINYINT enum (0=inactive, 1=active) | Domain type `PetStatus = 0 \| 1` |
| Price in cents (weight not a price — no price field on Pet) | N/A — Pets have no price |
| All timestamps in UTC | Prisma `@default(now())` + `@updatedAt` |
| No FK constraints | Referential integrity in use cases |
| FTS on name, breed, notes | `@@fulltext([name, breed, notes])` |
| Deactivated pets excluded from list/search by default | Repo WHERE `status=1` |

### Requirement: Validation Rules

| Field | Rule |
|-------|------|
| name | Required, 1-100 chars |
| species | Required, 1-100 chars |
| breed | Optional, max 100 chars |
| client_id | Required, must reference existing active non-deleted client |
| date_of_birth | Optional, must be in the past |
| weight_kg | Optional, positive number, max 999.99 |
| sex | Optional, must be 0, 1, or 2 |
| search query | Strip FTS operators: `+ - * " ( )` |
