# Proposal: Link Services to Pets

## Intent

Allow each service to be optionally linked to a pet so users can see which services are associated with which pet — and, by extension, which client. Today services are standalone; there is no way to associate a grooming treatment with a specific animal.

## Scope

### In Scope
- Add `pet_id INT NULL` column to `services` table (no junction table, 1:1 optional)
- Backend: update Service domain entity, all DTOs, repository (`findAll` + `petId?` filter, `unlinkAllByPetId` cascade), and use cases
- `GET /api/v1/services?petId=5` — filter services by linked pet
- `SoftDeletePet` cascade: unlink services before pet deletion
- Frontend types, API client, and `useServices` hook: add `petId` field and optional filter
- `PetDetailPage`: "Linked Services" section using `ServiceTable`
- `ClientDetailPage`: "Services by Pet" section (frontend fetches pets, then per-pet services)

### Out of Scope
- Backend `clientId` filter/JOIN — frontend orchestrates client→pets→services
- Multi-pet service assignments (junction table)
- New routes or endpoints
- New components or pages

## Capabilities

### New Capabilities

None — all changes modify existing capabilities.

### Modified Capabilities
- `services-api-backend`: Service entity gains `petId`, list endpoint accepts `petId` query param, repository adds `unlinkAllByPetId` cascade
- `pet-management-backend`: `SoftDeletePet` injects `IServiceRepository` and unlinks services before soft-delete
- `services-api-frontend`: types/hook/service support `petId`, `PetDetailPage` and `ClientDetailPage` gain service sections
- `pet-management-frontend`: `PetDetailPage` gains linked-services display (no spec-level requirement change — UI addition only)

## Approach

Single column, no new tables. Follows existing `client_id`-on-pets pattern: nullable INT reference with application-layer integrity. `UpdateService` with `petId: null` unlinks. Cascade mirrors `SoftDeleteClient → petRepository.softDeleteAllByClientId()` — inject repository into use case, call unlink before soft-delete.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `pet_id Int?` + index to Service |
| `api/services/domain/` | Modified | Entity, inputs, repo interface |
| `api/services/infrastructure/` | Modified | Prisma repo: filters, cascade |
| `api/services/application/` | Modified | List/Create/Update use cases |
| `api/services/interface/` | Modified | DTOs, controller query params |
| `api/pets/application/SoftDeletePet.ts` | Modified | Inject service repo, cascade |
| `api/index.ts` | Modified | DI wiring |
| `src/types/service.ts` | Modified | Add `petId` |
| `src/services/service.ts` | Modified | `listServices` filter param |
| `src/hooks/useServices.ts` | Modified | `petId` filter |
| `src/pages/PetDetailPage.tsx` | Modified | Linked services section |
| `src/pages/ClientDetailPage.tsx` | Modified | Services by pet section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 1:1 model limits future multi-pet links | Low | User explicitly chose this constraint; migration to junction table is additive |
| Unlink + soft-delete race (two separate queries) | Low | Wrap in Prisma `$transaction` if needed |
| ServiceTable `onDelete` semantics differ (unlink vs soft-delete) | Medium | Use explicit `onRemove` prop — unlink on PetDetailPage, soft-delete on ServicesPage |

## Rollback Plan

1. Migration rollback: `ALTER TABLE services DROP COLUMN pet_id`
2. Revert all files to pre-change state (backward-compatible column — no data loss from rollback)
3. Unlinked services stay unlinked; re-linking must be manual

## Dependencies

- Completed Services API bounded context
- Existing `ServiceTable`, `useServices`, `usePets` hooks

## Success Criteria

- [ ] `POST /api/v1/services` accepts optional `petId`; 201 with `petId` in response
- [ ] `GET /api/v1/services?petId=5` returns only services linked to pet 5
- [ ] `PUT /api/v1/services/:id { petId: null }` unlinks the service
- [ ] `DELETE /api/v1/pets/:id` sets `pet_id = NULL` on all linked services before soft-delete
- [ ] PetDetailPage shows linked services table; empty state when none
- [ ] ClientDetailPage groups services by pet; only shows pets with linked services
