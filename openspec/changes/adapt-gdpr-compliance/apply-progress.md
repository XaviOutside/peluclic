## Apply Progress — Data Portability Export (Art. 20 GDPR) — PR #4

### Completed Tasks
- [x] 4.1 ExportResponseDto + test (3 tests: shape, empty, null fields)
- [x] 4.2 ExportClientUseCase + test (5 tests: assembly, 404, cross-company, empty, multiple pets)
- [x] 4.3 Repository additions: IAppointmentRepository.findByClientId, IServiceRepository.findByPetIds + Prisma impls
- [x] 4.4 ClientController.exportClient + 4 controller tests (200 JSON, 404, 422, cross-company)
- [x] 4.5 clientRouter GET /:id/export + api/index.ts DI wiring
- [x] 4.6 Frontend: IStorage/ApiStorage/LocalStorage exportClient, client.ts service, useExportClient hook, ClientDetailCard Export button, ClientDetailPage download handler

### TDD Cycle Evidence
| Task | Test File | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-----|-------|-------------|----------|
| 4.1 | ExportResponseDto.test.ts | ✅ Written | ✅ 3/3 | ✅ 3 cases | ✅ Clean |
| 4.2 | ExportClient.test.ts | ✅ Written | ✅ 5/5 | ✅ 5 cases | ✅ Clean |
| 4.3 | Structural (interfaces) | N/A | ✅ Verified | N/A | N/A |
| 4.4 | ClientController.test.ts | ✅ 4 added | ✅ 24/24 | ✅ 4 cases | ✅ Clean |
| 4.5 | Structural (router/DI) | N/A | ✅ Verified | N/A | N/A |
| 4.6 | Structural (frontend) | N/A | ✅ Verified | N/A | N/A |

### Work Unit Evidence
| Evidence | Required value |
|---|---|
| Focused test command and exact result | `npm test -- api/clients` → 82/82 passing |
| Runtime harness command/scenario and exact result | `curl -X GET http://localhost:3000/api/v1/clients/1/export` → N/A (no runtime DB available) |
| Rollback boundary | Revert PR #4 (6 commits on feat/gdpr-data-portability); all changes are additive |

### Gate Result
- Lint: ✅ 0 errors
- Build: ✅ clean
- Backend tests: ✅ 472/472
- Frontend tests: ✅ 491/491

### Commits
1. `653fae9` feat(clients): add companyId and consentGivenAt to domain Client entity
2. `1d940ea` feat(clients): add ExportResponseDto for GDPR data portability
3. `6df95fa` feat(repos): add findByClientId to AppointmentRepo and findByPetIds to ServiceRepo
4. `6a26266` feat(clients): add ExportClientUseCase for GDPR data portability
5. `2c0e62b` feat(clients): add exportClient endpoint GET /:id/export
6. `ef55f43` feat(frontend): add Export Data button with JSON download

### Files Changed (22 files)
Backend (14): Client.ts, PrismaClientRepository.ts, ExportResponseDto.ts, ExportResponseDto.test.ts, ClientResponseDto.ts, ExportClient.ts, ExportClient.test.ts, IAppointmentRepository.ts, PrismaAppointmentRepository.ts, IServiceRepository.ts, PrismaServiceRepository.ts, ClientController.ts, ClientController.test.ts, clientRouter.ts, index.ts
Frontend (8): IStorage.ts, ApiStorage.ts, LocalStorage.ts, client.ts, useClientMutations.ts, ClientDetailCard.tsx, ClientDetailPage.tsx, mockStorage.ts

### Branch
feat/gdpr-data-portability (from main, independent of other PRs)

### Next
Ready for sdd-verify, then PR #5 (Transparency + PII + DPA + Art.9)
