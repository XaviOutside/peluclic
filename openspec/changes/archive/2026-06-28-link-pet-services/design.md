# Design: Link Services to Pets

## Architecture Overview

Two bounded contexts connected by a passive reference — no SQL JOIN, no domain coupling:

```
┌─ Pets BC ─────────────────────────────┐  ┌─ Services BC ─────────────────────────┐
│  SoftDeletePet                         │  │  ListServices (petId? filter)          │
│    │ injects IServiceRepository        │  │  CreateService / UpdateService (petId) │
│    ▼ unlinkAllByPetId(id)              │  │                                          │
│  IPetRepository (NO changes)           │  │  IServiceRepository                     │
│    │                                   │  │  + findAll(page, limit, petId?)        │
│    ▼                                   │  │  + unlinkAllByPetId(petId)             │
│  pets table ←──────────────────── INT ─│─→ services.pet_id (nullable, no FK)       │
└────────────────────────────────────────┘  └────────────────────────────────────────┘
                     │                                      │
                     ▼                                      ▼
┌──────────────────── Frontend Orchestration ──────────────────────────────┐
│  ClientDetailPage: listPets(clientId) → forEach pet: listServices(petId) │
│  PetDetailPage:   listServices(petId)  → ServiceTable + link/unlink      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Cross-Domain Boundary Rule

| Rule | Enforcement |
|------|-------------|
| No SQL JOIN across bounded contexts | `pet_id` is plain `INT` in the services BC — no FK, no `$queryRaw` touching `pets` table |
| No cross-domain query in services BC | `IServiceRepository.findAll` uses `WHERE pet_id = ?` on `services` table only |
| Cascade via injected repository interface | `SoftDeletePet` calls `serviceRepository.unlinkAllByPetId(id)` — application-layer cascade, no SQL trigger |
| Frontend orchestrates cross-domain reads | ClientDetailPage calls pets API, then per-pet services API in parallel — backend never joins |

This mirrors the existing pattern: `SoftDeleteClient` → `petRepository.softDeleteAllByClientId(clientId)`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Single nullable `pet_id` column (no junction table) | `pet_id INT NULL` on `services` | Junction table for M:N linking | User chose 1:1 optional. Migration to junction table is additive later. |
| Application-layer cascade, not SQL trigger | Inject `IServiceRepository` into `SoftDeletePet` | `ON DELETE SET NULL` trigger or FK constraint | Project convention: no FKs. Mirrors `SoftDeleteClient` → pet cascade pattern. |
| `petId` validated only as integer, no existence check | Parse as integer, pass through | Validate pet exists via `IPetRepository.existsById` | Services BC must not query pets table. Application-layer integrity by convention. |
| `ServiceTable` on PetDetailPage uses `onDelete` = unlink (not soft-delete) | Semantics differ from ServicesPage: unlink on pet page, soft-delete on services page | Reuse same delete handler everywhere | Context matters. Delete on ServicesPage = soft-delete. Delete on PetDetailPage = unlink. |
| `useServices` hook gets optional `petId` param | `useServices({ petId })` — re-fetches on param change | Separate `usePetServices` hook | Single hook with filter is simpler; avoids hook duplication for a query string param. |
| No new `Controller` method | Extend `listServices` to read `petId` query param | New `GET /pets/:id/services` endpoint | No new endpoint needed. ListServices already filters by WHERE clause with optional param. |
| No `Active` column — single `status` field | `status: TINYINT(0/1)` only | Separate `active: BOOLEAN` | Consistency with existing Services domain and prior design decision (archive/services-api). |

## Data Flow

### Read: ClientDetailPage → Services by Pet
```
ClientDetailPage
  │ onSubmit: dollars → cents conversion
  ├─ useClient(clientId) ──► GET /clients/:id
  ├─ usePets(clientId) ────► GET /pets?clientId=:id
  │   └─ for each pet: useServices({ petId }) ──► GET /services?petId=N  (parallel)
  │       └─ render per-pet ServiceTable
```

### Cascade: SoftDeletePet → unlink services
```
DELETE /pets/:id
  └─ SoftDeletePetUseCase.execute(id)
       ├─ serviceRepository.unlinkAllByPetId(id)  ← UPDATE services SET pet_id=NULL WHERE pet_id=?
       │   └─ only non-deleted rows
       └─ petRepository.softDelete(id)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `petId Int?` + `@@index([petId])` to Service model |
| `api/services/domain/Service.ts` | Modify | Add `petId?: number \| null` to Service, CreateServiceInput, UpdateServiceInput |
| `api/services/domain/IServiceRepository.ts` | Modify | `findAll` accepts `{page, limit, petId?}`; add `unlinkAllByPetId(petId)` |
| `api/services/infrastructure/PrismaServiceRepository.ts` | Modify | `create`/`update`/`mapToService` handle `petId`; `findAll` optional WHERE `petId`; implement `unlinkAllByPetId` |
| `api/services/application/ListServices.ts` | Modify | Add optional `petId` to `ListServicesParams` |
| `api/services/application/CreateService.ts` | Modify | Pass through `petId` (no validation beyond optional int) |
| `api/services/application/UpdateService.ts` | Modify | Pass through `petId` in `updateData` payload |
| `api/services/interface/dtos/CreateServiceDto.ts` | Modify | Add `petId?: number \| null` |
| `api/services/interface/dtos/UpdateServiceDto.ts` | Modify | Add `petId?: number \| null` |
| `api/services/interface/dtos/ServiceResponseDto.ts` | Modify | Add `petId: number \| null`; map in `toServiceResponseDto` |
| `api/services/interface/ServiceController.ts` | Modify | `listServices` extracts `petId` query param; `createService`/`updateService` pass through `petId` |
| `api/pets/application/SoftDeletePet.ts` | Modify | Inject `IServiceRepository`; call `unlinkAllByPetId` before `softDelete` |
| `api/index.ts` | Modify | Pass `serviceRepository` to `SoftDeletePetUseCase` constructor |
| `src/types/service.ts` | Modify | Add `petId: number \| null` to Service, CreateServiceInput, UpdateServiceInput |
| `src/services/service.ts` | Modify | `listServices(page, limit, petId?)` — conditional query param |
| `src/hooks/useServices.ts` | Modify | Accept optional `petId`; pass to `listServices`; re-fetch on change |
| `src/pages/PetDetailPage.tsx` | Modify | Add "Linked Services" section with `ServiceTable` + link/unlink actions |
| `src/pages/ClientDetailPage.tsx` | Modify | Add "Services by Pet" section — per-pet `useServices({petId})` parallel fetch |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| `ListServices` (use case) | `petId` param passed to repo; defaults omitted | Mock `IServiceRepository`; assert `findAll` called with correct param |
| `CreateService` (use case) | `petId` pass-through; no validation | Mock repo; assert `create` receives `petId` |
| `UpdateService` (use case) | `petId: null` unlinks, `petId: 5` links | Mock repo; assert `update` called with `petId` |
| `SoftDeletePet` (use case) | `unlinkAllByPetId` called before `softDelete` | Mock both repos; assert call order |
| `PrismaServiceRepository` | `findAll` WHERE `pet_id`, `unlinkAllByPetId` UPDATE | Integration test against real MySQL (`@integration`) |
| `ServiceController` | Query param `petId` extracted; DTO mapping | Supertest + mocked use cases |
| `listServices` (API client) | URL includes `petId` only when provided | `vi.stubGlobal('fetch')`; assert URL |
| `useServices` (hook) | Re-fetches when `petId` changes | `renderHook` with mocked `listServices` |
| `PetDetailPage` | Linked services section renders; link/unlink actions | `@testing-library/react`; mock hooks |
| `ClientDetailPage` | Services per pet grouped display; empty state | `@testing-library/react`; mock hooks |

## Open Questions

None — all decisions resolved in design. Implementation follows existing patterns exactly.
