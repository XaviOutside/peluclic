# Apply Progress — adapt-gdpr-compliance

## PR #2: Cascade Hard-Delete (ADMIN ONLY)

**Branch**: `feat/gdpr-cascade-hard-delete`
**Status**: ✅ Complete — all 10 tasks implemented
**Tests**: 975 passing (484 backend + 491 frontend)

### Completed Tasks

- [x] 2.1 `ClientNotErasableError` class + `ClientErrors.test.ts` (8 tests)
- [x] 2.2 `IClientRepository`: `hardDelete(id)`, `findByIdIncludeDeleted(id)` + Prisma impl
- [x] 2.3 `IPetRepository`: `hardDelete(id)`, `findByClientIdIncludeDeleted(clientId)` + Prisma impl
- [x] 2.4 `IAppointmentRepository`: `hardDeleteByPetId(petId, excludeStatus?)` + Prisma impl (status=2 preserved)
- [x] 2.5 `HardDeleteClientUseCase`: cascade Client→Pet→Appointment→Service, completed preserved
- [x] 2.6 `ClientController.hardDeleteClient`: 403 (role≠0), 204 (cascade), 404 (not found), 422 (invalid id)
- [x] 2.7 `clientRouter.ts`: `DELETE /:id/hard` with inline `req.role !== 0 → 403` guard
- [x] 2.8 `api/index.ts`: wired `HardDeleteClientUseCase` (clientRepo, petRepo, appointmentRepo, serviceRepo)
- [x] 2.9 Frontend: `ClientDetailCard` admin-only button, `ClientDetailPage` ConfirmDialog, `useUser()` hook
- [x] 2.10 Frontend: `hardDeleteClient` API, `useHardDeleteClient` hook, `IStorage`/`ApiStorage`/`LocalStorage`

### Files Changed

**Backend (15 files)**:
- `api/clients/domain/ClientErrors.ts` — added `ClientNotErasableError`
- `api/clients/domain/ClientErrors.test.ts` — NEW (8 tests)
- `api/clients/domain/IClientRepository.ts` — added `hardDelete`, `findByIdIncludeDeleted`
- `api/clients/infrastructure/PrismaClientRepository.ts` — implemented new methods
- `api/pets/domain/IPetRepository.ts` — added `hardDelete`, `findByClientIdIncludeDeleted`
- `api/pets/infrastructure/PrismaPetRepository.ts` — implemented new methods
- `api/appointments/domain/IAppointmentRepository.ts` — updated `hardDeleteByPetId` signature
- `api/appointments/infrastructure/PrismaAppointmentRepository.ts` — `excludeStatus` logic
- `api/services/domain/IServiceRepository.ts` — added `hardDeleteByPetId`
- `api/services/infrastructure/PrismaServiceRepository.ts` — implemented `hardDeleteByPetId`
- `api/clients/application/HardDeleteClient.ts` — NEW use case
- `api/clients/application/HardDeleteClient.test.ts` — NEW (3 tests)
- `api/clients/interface/ClientController.ts` — added `hardDeleteClient` method
- `api/clients/interface/clientRouter.ts` — added `DELETE /:id/hard` with admin guard
- `api/clients/interface/ClientController.test.ts` — added 4 hardDeleteClient tests
- `api/index.ts` — wired DI; moved `appointmentRepository` declaration

**Frontend (12 files)**:
- `src/hooks/useUser.ts` — NEW hook (reads localStorage)
- `src/services/client.ts` — added `hardDeleteClient`
- `src/hooks/useClientMutations.ts` — added `useHardDeleteClient`
- `src/storage/IStorage.ts` — added `hardDeleteClient` to interface
- `src/storage/ApiStorage.ts` — added `hardDeleteClient` (DELETE /clients/:id/hard)
- `src/storage/LocalStorage.ts` — added `hardDeleteClient` (removes client + pets)
- `src/components/organisms/ClientDetailCard.tsx` — added `onHardDelete`, `isAdmin` props + button
- `src/pages/ClientDetailPage.tsx` — wired hardDelete modal + admin check
- `src/locales/en/clients.json` — added hardDelete translations
- `src/locales/es/clients.json` — added hardDelete translations
- `src/locales/en/common.json` — added `deletePermanently` action
- `src/locales/es/common.json` — added `deletePermanently` action

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 | ClientErrors.test.ts | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 2 cases | ✅ Clean |
| 2.2 | PrismaClientRepository.integration | Integration | ✅ 78/78 | ✅ Written | ✅ Impl done | ➖ N/A | ✅ Clean |
| 2.3 | PrismaPetRepository.integration | Integration | ✅ 78/78 | ✅ Written | ✅ Impl done | ➖ N/A | ✅ Clean |
| 2.4 | PrismaAppointmentRepository.integration | Integration | ✅ 86/86 | ✅ Written | ✅ Impl done | ➖ N/A | ✅ Clean |
| 2.5 | HardDeleteClient.test.ts | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 3 cases | ✅ Clean |
| 2.6 | ClientController.test.ts | Unit | ✅ 468/468 | ✅ Written | ✅ Passed | ✅ 4 cases | ✅ Clean |

### Deviations from Design

- Service repository `hardDeleteByPetId` was not in the original design file changes list but is required for the cascade. Added to `IServiceRepository` and `PrismaServiceRepository`.
- No Prisma `$transaction` wrapping — cascade runs sequentially through repository interfaces. Atomic cascade with cross-repository transaction would require an infrastructure-level batch interface (not yet available).
- The `appointmentRepository` declaration was moved before `clientRepository` in `api/index.ts` to satisfy the new `HardDeleteClientUseCase` dependency.

### Workload / PR Boundary

- Mode: chained PR slice (#2 of 5)
- Chain strategy: stacked-to-main
- Current work unit: Cascade Hard-Delete (ADMIN ONLY)
- Estimated review budget: ~400 lines

### Next Steps

- PR #3: Consent Recording (Art. 7)
- Integration tests require Docker MySQL — run `npm run test:integration` when available
