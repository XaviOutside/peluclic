# Tasks: Create the model Pet in a new API

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

~3,240 total lines across ~45 files. Every PR slice exceeds 100-line budget. ask-always: orchestrator asks user for chain strategy or size:exception per slice.

| PR | Scope | Lines |
|----|-------|-------|
| 1 | Schema + Domain | 97 |
| 2 | Infrastructure | 310 |
| 3 | Create/Get/List/Search use cases | 450 |
| 4 | Update/Deactivate/SoftDelete use cases | 350 |
| 5 | Interface layer | 555 |
| 6 | Cascade + wiring | 100 |
| 7 | Frontend types + services | 180 |
| 8 | Hooks | 425 |
| 9 | Components | 230 |
| 10 | List + Create pages | 460 |
| 11 | Detail + Edit + ClientDetail + routes | 368 |

## PR 1: Schema + Domain

- [x] T-01 Add Pet model to `prisma/schema.prisma`, run migration.
- [x] T-02 `api/pets/domain/Pet.ts` — entity, enums, inputs.
- [x] T-03 `api/pets/domain/PetErrors.ts` — NotFound, AlreadyDeleted, ValidationError.
- [x] T-04 `api/pets/domain/IPetRepository.ts` — 10 method signatures including cascade.

## PR 2: Infrastructure

- [x] T-05 RED Integration tests for PrismaPetRepository vs real DB.
- [x] T-06 GREEN `PrismaPetRepository.ts` — Prisma impl with FTS `$queryRaw`.

## PR 3: Application — Create/Get/List/Search

- [x] T-07 RED+GREEN CreatePet — validate name/species/client_id, check client active, create.
- [x] T-08 RED+GREEN GetPet — by id, NotFound if null or deleted.
- [x] T-09 RED+GREEN ListPets — pagination, optional clientId, active-only.
- [x] T-10 RED+GREEN SearchPets — sanitize FTS, delegate to repo.

## PR 4: Application — Update/Deactivate/SoftDelete

- [x] T-11 RED+GREEN UpdatePet — block status, validate client_id if provided.
- [x] T-12 RED+GREEN DeactivatePet — set status=INACTIVE.
- [x] T-13 RED+GREEN SoftDeletePet — set deletedAt, 409 if already deleted.

## PR 5: Interface

- [x] T-14 DTOs — CreatePetDto, UpdatePetDto, PetResponseDto + TINYINT mapper.
- [x] T-15 PetController — 7 handlers, handleError (404/409/422).
- [x] T-16 petRouter — factory, /search before /:id.
- [x] T-17 RED+GREEN Controller supertest — all codes, DTO shape, no stack in 500.

## PR 6: Cascade + Wiring

- [ ] T-18 RED+GREEN Modify DeactivateClient — add IPetRepository, cascade deactivate pets.
- [ ] T-19 RED+GREEN Modify SoftDeleteClient — add IPetRepository, cascade soft-delete pets.
- [ ] T-20 Wire api/index.ts — mount /api/v1/pets, pass petRepository to cascade use cases.

## PR 7: Frontend Types + Services

- [ ] T-21 `src/types/pet.ts` — Pet interface, status/sex unions, DTOs.
- [ ] T-22 Extract PaginatedResponse+ApiError to `src/shared/types.ts`, update imports.
- [ ] T-23 RED+GREEN `src/services/pet.ts` — 7 API functions, mock fetch tests.

## PR 8: Hooks

- [ ] T-24 RED+GREEN usePets — paginated, clientId filter, 300ms debounce search.
- [ ] T-25 RED+GREEN usePet — single pet, refetch, loading/error/not-found.
- [ ] T-26 RED+GREEN usePetMutations — create, update, delete, deactivate.

## PR 9: Components

- [ ] T-27 PetTable — organism, columns: name/species/breed/status, link rows.
- [ ] T-28 PetForm — molecule, active-clients dropdown, blur+submit validation.
- [ ] T-29 PetDetailCard — organism, all fields, owner link, action buttons.

## PR 10: List + Create Pages

- [ ] T-30 RED+GREEN PetListPage — spinner, empty+CTA, error+retry, search bar.
- [ ] T-31 PetCreatePage — PetForm, redirect on success, inline 422 errors.

## PR 11: Detail + Edit + ClientDetail + Routes

- [ ] T-32 PetDetailPage — PetDetailCard, not-found message.
- [ ] T-33 PetEditPage — pre-populated PetForm, redirect on save.
- [ ] T-34 Modify ClientDetailPage — embed PetTable section, all states.
- [ ] T-35 App.tsx — add 4 pet routes.
