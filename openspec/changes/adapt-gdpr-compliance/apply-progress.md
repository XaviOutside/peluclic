# Apply Progress — adapt-gdpr-compliance

## PR #2: Cascade Hard-Delete (ADMIN ONLY)

**Branch**: `feat/gdpr-cascade-hard-delete`
**Status**: ✅ Complete — all 10 tasks implemented + 5 blockers fixed
**Tests**: 984 passing (482 backend + 502 frontend)

### Completed Tasks

- [x] 2.1 `ClientNotErasableError` class → **REMOVED** (dead code — no code path used it)
- [x] 2.2 `IClientRepository`: `hardDelete(id, tx?)`, `findByIdIncludeDeleted(id)` + Prisma impl
- [x] 2.3 `IPetRepository`: `hardDelete(id, tx?)`, `findByClientIdIncludeDeleted(clientId)` + Prisma impl
- [x] 2.4 `IAppointmentRepository`: `hardDeleteByPetId(petId, excludeStatus?, tx?)` + Prisma impl (status=2 preserved)
- [x] 2.5 `HardDeleteClientUseCase`: cascade Client→Pet→Appointment→Service in `prisma.$transaction`, completed preserved
- [x] 2.6 `ClientController.hardDeleteClient`: 403 (role≠0), 204 (cascade), 404 (not found), 422 (invalid id)
- [x] 2.7 `clientRouter.ts`: `DELETE /:id/hard` with inline `req.role !== 0 → 403` guard
- [x] 2.8 `api/index.ts`: wired `HardDeleteClientUseCase` (clientRepo, petRepo, appointmentRepo, serviceRepo)
- [x] 2.9 Frontend: `ClientDetailCard` admin-only button, `ClientDetailPage` ConfirmDialog, `useUser()` hook + TESTS
- [x] 2.10 Frontend: `hardDeleteClient` API, `useHardDeleteClient` hook, `IStorage`/`ApiStorage`/`LocalStorage` + mockStorage

### Remediation Fixes Applied (2026-07-25)

| Blocker | Fix | Details |
|---------|-----|---------|
| 1. All changes uncommitted | 6 work-unit commits | `1b29863` through `4ef39fe` — see `git log --oneline` |
| 2. Lint: nested ternaries | Extracted helpers | `getConfirmTitle()`, `getConfirmMessage()`, `getConfirmLabel()` |
| 3. Build: missing mockStorage.hardDeleteClient | Added method | `src/test-utils/mockStorage.ts` |
| 4. Missing frontend tests | 5 page tests + 6 hook tests | `ClientDetailPage.test.tsx` + `useUser.test.ts` (NEW) |
| 5. Missing $transaction | `prisma.$transaction(async (tx) => {})` | All cascade deletions wrapped atomically |
| 6. Dead ClientNotErasableError | Removed | Class + 2 tests deleted |

### Files Changed

**Backend (16 files)**:
- `api/clients/domain/ClientErrors.ts` — removed `ClientNotErasableError`
- `api/clients/domain/ClientErrors.test.ts` — NEW (6 tests, removed 2 dead ones)
- `api/clients/domain/IClientRepository.ts` — added `hardDelete(id, tx?)`, `findByIdIncludeDeleted`
- `api/clients/infrastructure/PrismaClientRepository.ts` — implemented new methods with tx support
- `api/pets/domain/IPetRepository.ts` — added `hardDelete(id, tx?)`, `findByClientIdIncludeDeleted`
- `api/pets/infrastructure/PrismaPetRepository.ts` — implemented new methods with tx support
- `api/appointments/domain/IAppointmentRepository.ts` — updated `hardDeleteByPetId(petId, excludeStatus?, tx?)`
- `api/appointments/infrastructure/PrismaAppointmentRepository.ts` — `excludeStatus` logic + tx support
- `api/services/domain/IServiceRepository.ts` — added `hardDeleteByPetId(petId, tx?)`
- `api/services/infrastructure/PrismaServiceRepository.ts` — implemented with tx support
- `api/clients/application/HardDeleteClient.ts` — NEW use case with `prisma.$transaction`
- `api/clients/application/HardDeleteClient.test.ts` — NEW (3 tests, updated for tx)
- `api/clients/interface/ClientController.ts` — added `hardDeleteClient` method
- `api/clients/interface/clientRouter.ts` — added `DELETE /:id/hard` with admin guard
- `api/clients/interface/ClientController.test.ts` — added 4 hardDeleteClient tests
- `api/index.ts` — wired DI; moved `appointmentRepository` declaration

**Frontend (15 files)**:
- `src/hooks/useUser.ts` — NEW hook (reads localStorage, validates role)
- `src/hooks/useUser.test.ts` — NEW (6 tests: admin, employee, null, invalid JSON, invalid role, non-numeric id)
- `src/services/client.ts` — added `hardDeleteClient`
- `src/hooks/useClientMutations.ts` — added `useHardDeleteClient`
- `src/storage/IStorage.ts` — added `hardDeleteClient` to interface
- `src/storage/ApiStorage.ts` — added `hardDeleteClient` (DELETE /clients/:id/hard)
- `src/storage/LocalStorage.ts` — added `hardDeleteClient` (removes client + pets)
- `src/test-utils/mockStorage.ts` — added `hardDeleteClient` vi.fn()
- `src/components/organisms/ClientDetailCard.tsx` — added `onHardDelete`, `isAdmin` props + button
- `src/pages/ClientDetailPage.tsx` — wired hardDelete modal + admin check + extracted helpers
- `src/pages/ClientDetailPage.test.tsx` — added 5 hard-delete tests (admin button, employee hidden, modal, confirm, cancel)
- `src/locales/en/clients.json` — added hardDelete translations
- `src/locales/es/clients.json` — added hardDelete translations
- `src/locales/en/common.json` — added `deletePermanently` action
- `src/locales/es/common.json` — added `deletePermanently` action

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 | ClientErrors.test.ts | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 6 cases | ✅ Removed dead code |
| 2.2 | PrismaClientRepository.integration | Integration | ✅ 78/78 | ✅ Written | ✅ Impl done | ➖ N/A | ✅ Clean |
| 2.3 | PrismaPetRepository.integration | Integration | ✅ 78/78 | ✅ Written | ✅ Impl done | ➖ N/A | ✅ Clean |
| 2.4 | PrismaAppointmentRepository.integration | Integration | ✅ 86/86 | ✅ Written | ✅ Impl done | ➖ N/A | ✅ Clean |
| 2.5 | HardDeleteClient.test.ts | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 3 cases | ✅ Clean |
| 2.6 | ClientController.test.ts | Unit | ✅ 468/468 | ✅ Written | ✅ Passed | ✅ 4 cases | ✅ Clean |
| 2.9 | ClientDetailPage.test.tsx | UI | N/A (new) | ✅ Written | ✅ Passed | ✅ 5 cases | ✅ Clean |
| 2.9 | useUser.test.ts | Hook | N/A (new) | ✅ Written | ✅ Passed | ✅ 6 cases | ✅ Clean |

### Deviations from Design

- Service repository `hardDeleteByPetId` was not in the original design file changes list but is required for the cascade. Added to `IServiceRepository` and `PrismaServiceRepository`.
- ~~No Prisma `$transaction` wrapping~~ → **FIXED**: cascade now wrapped in `prisma.$transaction(async (tx) => {...})`. All repository delete methods accept optional `tx?: Prisma.TransactionClient`.
- `ClientNotErasableError` removed — the spec says hard-delete always works; no code path threw this error.

### Gate Results (Remediation)

| Gate | Result |
|------|--------|
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ Clean compilation |
| `npm test` | ✅ 482/482 backend tests pass |
| `npm run test:frontend` | ✅ 502/502 frontend tests pass |
| `npm run gate` | ✅ All gates pass |

### Commits

```
4ef39fe docs: add SDD artifacts for adapt-gdpr-compliance change
0092c84 test(frontend): add hard-delete component tests and useUser tests
b636b55 feat(frontend): add admin-only hard-delete button with useUser hook
dabb83d feat(clients): wire hard-delete route with admin-only guard
10badae feat(clients): add Prisma $transaction wrapping to cascade hard-delete
1b29863 fix(clients): remove dead ClientNotErasableError
```

### Workload / PR Boundary

- Mode: chained PR slice (#2 of 5)
- Chain strategy: stacked-to-main
- Current work unit: Cascade Hard-Delete (ADMIN ONLY)
- Estimated review budget: ~400 lines

### Next Steps

- Re-verify with `sdd-verify` for PR #2
- PR #3: Consent Recording (Art. 7)
