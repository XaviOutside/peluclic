# Tasks: Listing Pagination Controls

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR — backend + frontend must ship together (response shape change) |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Phase 1 — Backend Foundation (TDD: Red → Green)

- [ ] 1.1 **RED**: Write integration test for `PrismaClientRepository.findAll` returning `PaginatedResult<Client>` with correct `meta.total`
- [ ] 1.2 **RED**: Write integration tests for `PrismaPetRepository.findAll` + `findAllByClientId` returning `PaginatedResult<Pet>`
- [ ] 1.3 **RED**: Write integration test for `PrismaServiceRepository.findAll` returning `PaginatedResult<Service>` (verify count matches findMany with identical `where`)
- [ ] 1.4 **GREEN**: Create `api/shared/domain/PaginatedResult.ts` with `{ data: T[]; meta: { total, page, limit, totalPages } }`
- [ ] 1.5 **GREEN**: Update `IClientRepository.findAll` return type + add `count()` in `PrismaClientRepository` (same `where` filter as findMany)
- [ ] 1.6 **GREEN**: Update `IPetRepository.findAll` + `findAllByClientId` return types + add `count()` to both methods in `PrismaPetRepository`
- [ ] 1.7 **GREEN**: Update `IServiceRepository.findAll` return type + add `count()` in `PrismaServiceRepository` (preserves petId filter logic)

## Phase 2 — Use Cases + Controllers (TDD: Red → Green)

- [ ] 2.1 **RED**: Write integration test for `ListClientsUseCase` returning `PaginatedResult<Client>` with mock repo
- [ ] 2.2 **RED**: Write integration test for `ListPetsUseCase` returning `PaginatedResult<Pet>` (both findAll + findAllByClientId paths)
- [ ] 2.3 **RED**: Write integration test for `ListServicesUseCase` returning `PaginatedResult<Service>`
- [ ] 2.4 **GREEN**: Update `ListClientsUseCase.execute` to return `PaginatedResult<Client>`
- [ ] 2.5 **GREEN**: Update `ListPetsUseCase.execute` to return `PaginatedResult<Pet>` from both paths
- [ ] 2.6 **GREEN**: Update `ListServicesUseCase.execute` to return `PaginatedResult<Service>`
- [ ] 2.7 **GREEN**: Update `ClientController.listClients` to serialize `res.json({ data: dtos, meta })`
- [ ] 2.8 **GREEN**: Update `PetController.listPets` to serialize `res.json({ data: dtos, meta })`
- [ ] 2.9 **GREEN**: Update `ServiceController.listServices` to serialize `res.json({ data: dtos, meta })`

## Phase 3 — Frontend API Services + Constants

- [ ] 3.1 Create `src/constants/pagination.ts` exporting `DEFAULT_PAGE_SIZE = 20`
- [ ] 3.2 Update `src/services/client.ts` — `listClients` returns `PaginatedResponse<Client>` (typed as `{ data: Client[]; meta: PaginationMeta }`)
- [ ] 3.3 Update `src/services/pet.ts` — `listPets` returns `PaginatedResponse<Pet>`
- [ ] 3.4 Update `src/services/service.ts` — `listServices` returns `PaginatedResponse<Service>`

## Phase 4 — Hooks (TDD: Red → Green)

- [ ] 4.1 **RED**: Update `useClients.test.ts` — page state, search resets page to 1, hasNextPage/hasPreviousPage computed from meta
- [ ] 4.2 **RED**: Update `usePets.test.ts` — totalCount/totalPages from mock PaginatedResponse, search reset to page 1
- [ ] 4.3 **RED**: Update `useServices.test.ts` — totalCount/totalPages from mock response, no more hardcoded `20`
- [ ] 4.4 **GREEN**: Rewire `useClients` — add page/limit state, metadata (totalCount, totalPages, hasNextPage, hasPreviousPage), search resets page to 1
- [ ] 4.5 **GREEN**: Add totalCount, totalPages, hasNextPage, hasPreviousPage to `usePets` return + search reset to page 1
- [ ] 4.6 **GREEN**: Add metadata + convenience methods to `useServices`; replace all hardcoded `20`s with `DEFAULT_PAGE_SIZE`

## Phase 5 — DataTable + Pages

- [ ] 5.1 **RED**: Write DataTable test — renders `<Pagination>` when `pagination` prop provided; absent when omitted
- [ ] 5.2 **GREEN**: Add optional `pagination?: { page, totalPages, totalItems, onPageChange }` to `DataTableProps`; render `<Pagination>` in footer
- [ ] 5.3 Wire pagination from `useClients` into `ClientsPage` DataTable
- [ ] 5.4 Wire pagination from `usePets` into `PetsPage` DataTable
- [ ] 5.5 Wire pagination from `useServices` into `ServicesPage` DataTable

## Phase 6 — Cleanup

- [ ] 6.1 Delete `src/pages/ClientListPage.tsx` (dead — no route, superseded by ClientsPage)
- [ ] 6.2 Delete `src/pages/PetListPage.tsx` (dead — no route, superseded by PetsPage)
- [ ] 6.3 Delete `src/pages/ServiceListPage.tsx` (dead — no route, superseded by ServicesPage)

## Phase 7 — Verify

- [ ] 7.1 Run `npm test` — all unit + integration tests pass
- [ ] 7.2 Run `npm run build` — clean TypeScript compilation
- [ ] 7.3 Run `npm run lint` — zero errors
- [ ] 7.4 Run e2e: `npx playwright test` — listing pages show pagination, prev/next navigate, search resets to page 1
- [ ] 7.5 Run `snyk test && snyk code test` — zero critical/high
