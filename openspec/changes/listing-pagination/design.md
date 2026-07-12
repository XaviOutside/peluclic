# Design: Listing Pagination Controls

## Technical Approach

Backend-first: add `count()` to each repo's `findAll`, return `PaginatedResult<T>` from use cases, serialize `{ data, meta }` from controllers. Frontend consumes the new shape via typed `PaginatedResponse<T>`, upgrades all three hooks with metadata + convenience methods, and wires DataTable's optional `pagination` prop to the existing Pagination molecule.

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | `PaginatedResult<T>` in `api/shared/domain/` | Cross-bounded-context type used by all three domains. Shared domain is the correct layer — no framework dependency, importable from any bounded context. |
| 2 | `count()` runs in repo, not use case | Single responsibility: repo owns DB queries. Use case orchestrates but shouldn't call Prisma directly. The filter must match `findMany` exactly — repo is the only place that knows both. |
| 3 | DataTable `pagination` prop maps `totalItems` → `total` for Pagination molecule | Existing `Pagination` component uses prop name `total`. DataTable interface uses `totalItems` for clarity at the organism level. Simple mapping: `total: pagination.totalItems`. |
| 4 | `defaultPageSize` as frontend-only constant | Backend domains already have their own `DEFAULT_LIMIT` constants. Frontend needs its own — `src/constants/pagination.ts` with `DEFAULT_PAGE_SIZE = 20`. |

## Data Flow

```
  GET /api/v1/clients?page=2&limit=20
    → ClientController.listClients
      → ListClientsUseCase.execute({ page:2, limit:20 })
        → PrismaClientRepository.findAll(2, 20)
          → prisma.client.count({ where: { deletedAt: null } })   // total: 57
          → prisma.client.findMany({ skip:20, take:20, where:... }) // data: items 21-40
          → return { data: Client[], meta: { total:57, page:2, limit:20, totalPages:3 } }
        ← PaginatedResult<Client>
      ← PaginatedResult<Client>
    → res.json({ data: [...], meta: { total:57, page:2, limit:20, totalPages:3 } })
      ← client
        → listClients(2, 20): PaginatedResponse<Client>
          → useClients(): { clients, totalCount:57, totalPages:3, hasNextPage:true, ... }
            → DataTable data={clients} pagination={{ page:2, totalPages:3, totalItems:57 }}
              → <Pagination page={2} totalPages={3} total={57} />
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/shared/domain/PaginatedResult.ts` | Create | Shared `PaginatedResult<T>` interface |
| `api/clients/domain/IClientRepository.ts` | Modify | `findAll` returns `PaginatedResult<Client>` |
| `api/pets/domain/IPetRepository.ts` | Modify | `findAll` + `findAllByClientId` return `PaginatedResult<Pet>` |
| `api/services/domain/IServiceRepository.ts` | Modify | `findAll` returns `PaginatedResult<Service>` |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modify | Add `count()` query matching `findMany` filter; wrap in PaginatedResult |
| `api/pets/infrastructure/PrismaPetRepository.ts` | Modify | Add `count()` to `findAll` and `findAllByClientId`; wrap in PaginatedResult |
| `api/services/infrastructure/PrismaServiceRepository.ts` | Modify | Add `count()` with same `where` (includes petId filter); wrap in PaginatedResult |
| `api/clients/application/ListClients.ts` | Modify | Return `PaginatedResult<Client>` |
| `api/pets/application/ListPets.ts` | Modify | Return `PaginatedResult<Pet>` from both paths |
| `api/services/application/ListServices.ts` | Modify | Return `PaginatedResult<Service>` |
| `api/clients/interface/ClientController.ts` | Modify | `listClients` serializes `{ data, meta }` |
| `api/pets/interface/PetController.ts` | Modify | `listPets` serializes `{ data, meta }` |
| `api/services/interface/ServiceController.ts` | Modify | `listServices` serializes `{ data, meta }` |
| `src/constants/pagination.ts` | Create | `DEFAULT_PAGE_SIZE = 20` |
| `src/services/client.ts` | Modify | `listClients` returns `PaginatedResponse<Client>` |
| `src/services/pet.ts` | Modify | `listPets` returns `PaginatedResponse<Pet>` |
| `src/services/service.ts` | Modify | `listServices` returns `PaginatedResponse<Service>` |
| `src/hooks/useClients.ts` | Modify | Full pagination rewire: page/limit state, metadata, convenience methods, search reset |
| `src/hooks/usePets.ts` | Modify | Add `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`, search reset |
| `src/hooks/useServices.ts` | Modify | Add `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage` (already has page/limit); replace hardcoded `20`s with `DEFAULT_PAGE_SIZE` |
| `src/components/organisms/DataTable.tsx` | Modify | Add optional `pagination?: PaginationProps` to props + footer render |
| `src/pages/ClientsPage.tsx` | Modify | Destructure pagination metadata, pass to DataTable |
| `src/pages/PetsPage.tsx` | Modify | Destructure pagination metadata, pass to DataTable |
| `src/pages/ServicesPage.tsx` | Modify | Destructure pagination metadata, pass to DataTable |
| `src/pages/ClientListPage.tsx` | Delete | Dead page — no routing, superseded by ClientsPage |
| `src/pages/PetListPage.tsx` | Delete | Dead page — no routing, superseded by PetsPage |
| `src/pages/ServiceListPage.tsx` | Delete | Dead page — no routing, superseded by ServicesPage |

## Interfaces / Contracts

```typescript
// api/shared/domain/PaginatedResult.ts
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// DataTable pagination prop (maps to existing Pagination molecule)
export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — Pagination component | Renders null when totalPages ≤ 1; disabled buttons at boundaries | Vitest + RTL |
| Unit — DataTable footer | Renders Pagination when prop provided; absent when omitted | Vitest + RTL |
| Unit — useClients | Page state, search resets to 1, hasNextPage/hasPreviousPage computed | Vitest + MSW |
| Unit — usePets/useServices | totalCount/totalPages from mock response, search reset | Vitest + MSW |
| Integration — ListClients UseCase | Returns PaginatedResult with correct meta | Vitest + mock repo |
| Integration — Repo findAll | count() returns correct total matching findMany filter | Vitest + Prisma test |
| E2E — listing pages | Pagination visible, prev/next navigates, search resets to page 1 | Playwright |

## Migration / Rollout

No migration required. Backend response is additive — frontend pages that don't destructure `meta` won't break. Feature can be merged as one PR since the change is synchronized: new backend shape + updated frontend consumers ship together.

## Open Questions

- None
