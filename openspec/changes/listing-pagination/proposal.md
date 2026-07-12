# Proposal: Listing Pagination Controls

## Intent

Three listing pages (ClientsPage, PetsPage, ServicesPage) claim pagination in specs but have none at runtime. The `Pagination` molecule exists with prev/next + "page X of Y" but is wired only to dead pages. The backend accepts `page`/`limit` but returns flat `Entity[]` — no `totalCount` or `totalPages`. This change delivers functional pagination end-to-end.

## Scope

### In Scope
- **Backend**: Add `count()` to all three repos + return `{ data, meta: { total, page, limit, totalPages } }` from list endpoints
- **Shared types**: `PaginatedResponse<T>` type + `DEFAULT_PAGE_SIZE` constant (replaces 11 hardcoded `20`s)
- **Hooks**: Add `totalCount`, `totalPages`, `goToNextPage`, `goToPreviousPage`, `hasNextPage` to `useClients`, `usePets`, `useServices`. Reset page to 1 on search.
- **DataTable**: Optional `pagination` prop → renders `Pagination` footer when provided
- **Pages**: Wire pagination into ClientsPage, PetsPage, ServicesPage
- **Cleanup**: Remove dead pages (ClientListPage, PetListPage, ServiceListPage) and their tests

### Out of Scope
- Configurable page size per entity
- Infinite scroll / cursor-based pagination
- URL-based page state (`?page=2` in browser bar)

## Capabilities

### New Capabilities
- `client-management-backend`: Paginated `findAll` + `count()` contract for client repo

### Modified Capabilities
- `client-management-frontend`: Pagination state in hook → DataTable footer
- `pet-management-frontend`: Pagination state in hook → DataTable footer
- `services-api-frontend`: Pagination state in hook → DataTable footer
- `services-api-backend`: Paginated response metadata (count query, PaginatedResult type)
- `pet-management-backend`: Paginated response metadata (count query)

## Approach

**Backend-first**: Add `count()` to each Prisma repo's `findAll`, wrap in shared `PaginatedResult<T>` type, update use cases + controllers. Frontend then consumes `{ data: T[], meta: { total, page, limit, totalPages } }`.

**Frontend layering**: Shared `DEFAULT_PAGE_SIZE` constant → typed `PaginatedResponse<T>` → upgraded hooks → DataTable pagination prop → page wiring. All hooks follow same pattern for consistency.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/*/infrastructure/*Repository.ts` | Modified | Add `count()` to findAll |
| `api/*/application/List*.ts` | Modified | Return `PaginatedResult<T>` |
| `api/*/interface/*Controller.ts` | Modified | Serialize `{ data, meta }` |
| `src/hooks/useClients.ts` | Rewired | Full pagination (was zero-awareness) |
| `src/hooks/usePets.ts` | Rewired | Add totalCount/totalPages + convenience methods |
| `src/hooks/useServices.ts` | Rewired | Replace 3 hardcoded `20`s + add metadata |
| `src/components/organisms/DataTable.tsx` | Modified | Optional `pagination` prop → footer slot |
| `src/services/{client,pet,service}.ts` | Modified | Return `PaginatedResponse<T>` |
| `src/pages/{Clients,Pets,Services}Page.tsx` | Modified | Destructure + pass pagination to DataTable |
| `src/constants/pagination.ts` | New | `DEFAULT_PAGE_SIZE` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking DataTable consumers | Low | Pagination prop is optional — existing callers unchanged |
| Search + pagination state conflict | Low | All hooks reset page to 1 on search |
| useClients rewrite scope | Medium | Split into separate task; keep fetchId pattern |

## Rollback Plan

Revert commit. Backend change is additive (new `meta` field in response); frontend pages can disable pagination prop by omitting it. No DB migration.

## Dependencies

- None

## Success Criteria

- [ ] All 3 list endpoints return `{ data: [...], meta: { total, page, limit, totalPages } }`
- [ ] `Pagination` component visible on all 3 listing pages with functional prev/next
- [ ] Search resets pagination to page 1
- [ ] No hardcoded `20` remains in `src/` outside `DEFAULT_PAGE_SIZE`
- [ ] Dead pages removed (ClientListPage, PetListPage, ServiceListPage)
- [ ] Existing tests pass; new tests cover Pagination component, DataTable footer, and paginated hooks
