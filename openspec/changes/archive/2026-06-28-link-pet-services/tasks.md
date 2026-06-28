# Tasks: Link Services to Pets

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~560 (backend ~300 + frontend ~260) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend) → PR 2 (frontend) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Migration, domain, repo, use cases, DTOs, controller, cascade, wiring + tests | PR 1 | base: main; ~300 lines |
| 2 | Frontend types, API client, hook, PetDetailPage, ClientDetailPage + tests | PR 2 | base: main (stacked after PR 1 merges); ~260 lines |

## PR 1 — Backend: Add pet_id to Services

### Phase 1: Schema & Migration

- [x] 1.1 Add `petId Int?` + `@@index([petId])` to Service in `prisma/schema.prisma`
- [x] 1.2 Generate migration: `prisma migrate dev --name add_pet_id_to_services`; verify column exists

### Phase 2: Domain Layer (TDD — RED first)

- [x] 2.1 RED: Add `petId` pass-through test in `api/services/application/CreateService.test.ts` — mock `create` receives `{ petId: 5 }`
- [x] 2.2 RED: Add link (`petId: 5`) / unlink (`petId: null`) tests in `api/services/application/UpdateService.test.ts`
- [x] 2.3 RED: Add `petId` filter test in `api/services/application/ListServices.test.ts` — assert `findAll({ petId: 5 })` called
- [x] 2.4 GREEN: Add `petId?: number | null` to `Service`, `CreateServiceInput`, `UpdateServiceInput` in `api/services/domain/Service.ts`
- [x] 2.5 GREEN: Change `findAll(page, limit)` → `findAll(params: FindAllParams)`; add `unlinkAllByPetId(petId): void` to `api/services/domain/IServiceRepository.ts`

### Phase 3: Infrastructure (TDD — RED first)

- [x] 3.1 RED: Add integration test for `unlinkAllByPetId` in `api/services/infrastructure/PrismaServiceRepository.integration.test.ts` (seed services, call unlink, assert `pet_id=NULL`)
- [x] 3.2 GREEN: Update `create`/`update` to handle `petId`; add WHERE `pet_id` to `findAll`; implement `unlinkAllByPetId` via `updateMany`; update `mapToService` to include `petId` in `api/services/infrastructure/PrismaServiceRepository.ts`

### Phase 4: Application, DTOs & Controller (TDD)

- [x] 4.1 RED: Add `petId` mapping test in `api/services/interface/dtos/ServiceResponseDto.test.ts`
- [x] 4.2 RED: Add create-with-petId, list-with-petId, update-link/unlink test cases in `api/services/interface/ServiceController.test.ts`
- [x] 4.3 GREEN: Add `petId?: number` to `CreateServiceDto` + `UpdateServiceDto` in `api/services/interface/dtos/`
- [x] 4.4 GREEN: Add `petId: number | null` to `ServiceResponseDto` + `toServiceResponseDto` mapper in `api/services/interface/dtos/ServiceResponseDto.ts`
- [x] 4.5 GREEN: Add `petId?` to `ListServicesParams` in `ListServices.ts`; pass `petId` through `CreateService.ts` + `UpdateService.ts`
- [x] 4.6 GREEN: Extract `petId` from query params in `listServices`; pass `petId` from body in `createService`/`updateService` in `api/services/interface/ServiceController.ts`

### Phase 5: Pet Delete Cascade (TDD)

- [x] 5.1 RED: Add cascade test in `api/pets/application/SoftDeletePet.test.ts` — mock `serviceRepository.unlinkAllByPetId`; assert called before `petRepository.softDelete`
- [x] 5.2 GREEN: Inject `IServiceRepository` into `SoftDeletePetUseCase`; call `unlinkAllByPetId(id)` before `softDelete` in `api/pets/application/SoftDeletePet.ts`
- [x] 5.3 GREEN: Wire `serviceRepository` into `SoftDeletePetUseCase` constructor in `api/index.ts`

## PR 2 — Frontend: Linked Services UI

### Phase 6: Types & API Client (TDD)

- [x] 6.1 RED: Add `petId` param assertion test in `src/services/service.test.ts`
- [x] 6.2 GREEN: Add `petId: number | null` to `Service`; optional `petId?` to `CreateServiceInput`/`UpdateServiceInput` in `src/types/service.ts`
- [x] 6.3 GREEN: Add optional `petId?` param to `listServices`; append `&petId=${petId}` when set in `src/services/service.ts`

### Phase 7: Hook (TDD)

- [x] 7.1 RED: Add `petId` pass-through + re-fetch-on-change tests in `src/hooks/useServices.test.ts`
- [x] 7.2 GREEN: Accept optional `petId` in `useServices`; pass to `listServices`; include `petId` in fetch dependencies in `src/hooks/useServices.ts`

### Phase 8: PetDetailPage (TDD)

- [x] 8.1 RED: Add linked-services section tests in `src/pages/PetDetailPage.test.tsx` — mock `useServices`, assert ServiceTable renders, empty state, loading/error states
- [x] 8.2 GREEN: Add `onUnlink?: (s: Service) => void` prop to `ServiceTable`; render "Unlink" action when provided in `src/components/organisms/ServiceTable.tsx`
- [x] 8.3 GREEN: Add "Linked Services" section with `useServices({ petId })` + `ServiceTable` + link/unlink handlers in `src/pages/PetDetailPage.tsx`

### Phase 9: ClientDetailPage (TDD)

- [x] 9.1 RED: Add services-by-pet tests in `src/pages/ClientDetailPage.test.tsx` — mock per-pet `useServices`, assert grouped display, empty state, loading state
- [x] 9.2 GREEN: Add "Services by Pet" section using `usePets` + per-pet `useServices({ petId })` parallel fetch in `src/pages/ClientDetailPage.tsx`
