# Exploration: Listing Pagination Controls

## Current State

The pfmaster app has three active listing pages (ClientsPage, PetsPage, ServicesPage) served via React Router. Two older listing pages (ClientListPage, PetListPage, ServiceListPage) exist but are NOT in the router — they are dead code.

### Pagination Component Exists but Is Not Functional

A `Pagination` molecule component exists at `src/components/molecules/Pagination.tsx` with:
- **Props**: `page`, `totalPages`, `total`, `onPageChange`
- **Behavior**: Renders previous/next buttons + "Showing page X of Y (Z total)" text
- **Hides** when `totalPages <= 1`
- This component has NO unit test file

However, it is **never wired to real pagination data**. The old pages (ClientListPage, PetListPage) include the Pagination component with hardcoded `totalPages=1` and a no-op `onPageChange`. The new active pages (ClientsPage, PetsPage, ServicesPage) do NOT use the Pagination component at all — they rely entirely on the `DataTable` organism, which has no pagination footer.

### Root Cause: Backend Returns Flat Arrays

Every list endpoint returns `Entity[]` — a plain array with NO pagination metadata:
- `GET /api/v1/clients` → `Client[]`
- `GET /api/v1/pets` → `Pet[]`
- `GET /api/v1/services` → `Service[]`

The controllers accept `?page=1&limit=20` query params and pass them to use cases, which pass them to repositories which use Prisma `skip`/`take`. But the return type is always `Entity[]` — **no totalCount, no totalPages, no hasMore**.

This means the frontend cannot know how many pages exist. It receives items but has no way to compute totalPages without a second COUNT query.

---

## Affected Areas

### Frontend — Active Pages (what the router serves)

| File | Role | Pagination State |
|---|---|---|
| `src/pages/ClientsPage.tsx` | `/clients` | NO pagination at all. Does not destructure `page`/`goToPage` from `useClients`. No Pagination component rendered. |
| `src/pages/PetsPage.tsx` | `/pets` | NO pagination. Does not destructure `page`/`goToPage` from `usePets`. Client-side filtering via `filteredPets`. No Pagination component rendered. |
| `src/pages/ServicesPage.tsx` | `/services` | NO pagination. Does not destructure `page`/`goToPage` from `useServices`. Own search state separate from hook. No Pagination component. |
| `src/components/organisms/DataTable.tsx` | Shared table component | NO pagination footer. No props for `totalItems`, `page`, `onPageChange`, `totalPages`. |

### Frontend — Hooks

| Hook | Has `page`/`limit` state? | Has `goToPage`? | Hardcoded limit? | Exposes totalPages? |
|---|---|---|---|---|
| `useClients` | **NO** — no page/limit at all | NO | Calls `listClients()` with no args → defaults 1,20 | NO |
| `usePets` | YES — `page: 1`, `limit: 20` | YES — `goToPage(n)` | YES — `listPets(page, 20, clientId)` line 34 | NO |
| `useServices` | YES — `page: 1`, `limit: 20` | YES — `goToPage(n)` | YES — 3 hardcoded `20`s (lines 39, 91, 231) | NO |

**useClients** is the worst case — has zero pagination awareness. **usePets** and **useServices** have page/limit state but:
- Never track totalCount, totalPages, or hasMore (the API doesn't return them)
- Have no `goToNextPage`/`goToPreviousPage` convenience methods
- Contain hardcoded magic numbers (20) in multiple places

### Frontend — Service Layer

| File | pagination params? | Return type |
|---|---|---|
| `src/services/client.ts:10` | `page=1, limit=20` defaults | `Promise<Client[]>` — no metadata |
| `src/services/pet.ts:12` | `page=1, limit=20` defaults | `Promise<Pet[]>` — no metadata |
| `src/services/service.ts:12` | `page=1, limit=20` defaults | `Promise<Service[]>` — no metadata |

### Backend — Controllers

| File | Endpoint | Accepts `page`/`limit`? | Returns |
|---|---|---|---|
| `api/clients/interface/ClientController.ts:97` | `GET /api/v1/clients` | YES (lines 99-100) | `ClientResponseDto[]` — flat array |
| `api/pets/interface/PetController.ts:135` | `GET /api/v1/pets` | YES (lines 137-138) | `PetResponseDto[]` — flat array |
| `api/services/interface/ServiceController.ts:103` | `GET /api/v1/services` | YES (lines 105-106) | `ServiceResponseDto[]` — flat array |

### Backend — Use Cases (all identical pattern)

| File | Default limit | Max limit | Return |
|---|---|---|---|
| `api/clients/application/ListClients.ts:6` | `20` | `100` | `Client[]` |
| `api/pets/application/ListPets.ts:6` | `20` | `100` | `Pet[]` |
| `api/services/application/ListServices.ts:6` | `20` | `100` | `Service[]` |

### Backend — Domain Repository Interfaces

| Interface | `findAll` signature |
|---|---|
| `IClientRepository.findAll(page, limit)` | Returns `Promise<Client[]>` |
| `IPetRepository.findAll(page, limit)` | Returns `Promise<Pet[]>` |
| `IServiceRepository.findAll(params)` | Returns `Promise<Service[]>` |

### Backend — Infrastructure Repositories

All three Prisma repositories use `skip = (page - 1) * limit` + `take: limit` via Prisma's `findMany`. None of them call `count()` or return totalCount.

---

## Magic Numbers Found (hardcoded `20`)

| # | File | Line | Context |
|---|---|---|---|
| 1 | `src/hooks/usePets.ts` | 20 | `limit: 20` in initial state |
| 2 | `src/hooks/usePets.ts` | 34 | `listPets(page, 20, clientId)` — literal instead of `state.limit` |
| 3 | `src/hooks/useServices.ts` | 39 | `limit: 20` in initial state |
| 4 | `src/hooks/useServices.ts` | 91 | `fetchList(1, 20)` — search revert, literal instead of `state.limit` |
| 5 | `src/hooks/useServices.ts` | 231 | `fetchList(DEFAULT_PAGE, 20)` — literal instead of `DEFAULT_LIMIT` const or `state.limit` |
| 6 | `src/services/client.ts` | 10 | `limit = 20` — default function parameter |
| 7 | `src/services/pet.ts` | 12 | `limit = 20` — default function parameter |
| 8 | `src/services/service.ts` | 12 | `limit = 20` — default function parameter |
| 9 | `api/clients/application/ListClients.ts` | 6 | `DEFAULT_LIMIT = 20` — already a constant (good) |
| 10 | `api/pets/application/ListPets.ts` | 6 | `DEFAULT_LIMIT = 20` — already a constant (good) |
| 11 | `api/services/application/ListServices.ts` | 6 | `DEFAULT_LIMIT = 20` — already a constant (good) |

**No shared frontend constant exists** — there's no `PAGE_SIZE`, `DEFAULT_PAGE_SIZE`, or `ITEMS_PER_PAGE` anywhere in `src/`. The backend use cases have `DEFAULT_LIMIT` but each bounded context duplicates it.

---

## DataTable Footer

`DataTable.tsx` has **no pagination footer**. The component renders:
1. Desktop table header (optional, `showHeader` prop)
2. Rows in a scrollable container (`overflow-y-auto`)
3. Actions cell per row

There is no footer section, no `totalItems`/`page`/`onPageChange` props, no area to slot in pagination controls. The component ends at line 303 with the closing `</div>` of the rows container.

---

## What Needs to Be Built

### Phase 1: Backend — Return Pagination Metadata (blocker)

This is the critical blocker. The frontend cannot implement functional pagination without metadata.

1. **Define a shared paginated response type** — e.g. `PaginatedResult<T>` with `{ data: T[], total: number, page: number, limit: number, totalPages: number }`
2. **Add `count()` to each repository's `findAll`** — parallel to the `findMany`, using Prisma's `count()` with the same `where` filter
3. **Update use cases** to return `PaginatedResult<T>` instead of `T[]`
4. **Update controllers** to serialize the paginated response as `{ data: [...], meta: { total, page, limit, totalPages } }`

### Phase 2: Frontend — Type & Service Layer

5. **Define `PaginatedResponse<T>` type** in `src/types/`
6. **Update service functions** to return `PaginatedResponse<T>` instead of `T[]`
7. **Define a single `DEFAULT_PAGE_SIZE` constant** — one shared constant in `src/types/` or `src/services/`, replacing all 8 hardcoded `20` values

### Phase 3: Frontend — Hooks

8. **Upgrade `useClients`** — add `page`, `limit`, `goToPage`, `goToNextPage`, `goToPreviousPage`, `totalCount`, `totalPages`. Use the `DEFAULT_PAGE_SIZE` constant.
9. **Upgrade `usePets`** — add `totalCount`, `totalPages`, `goToNextPage`, `goToPreviousPage`. Replace hardcoded `20` with state's `limit` or the constant.
10. **Upgrade `useServices`** — same as usePets plus fix the 3 hardcoded `20` references.

### Phase 4: Frontend — Pages & DataTable

11. **Add Pagination to `DataTable`** — optional slot props: `pagination?: { page, totalPages, total, onPageChange }`. When provided, render the footer.
12. **Wire `ClientsPage`** — destructure pagination state from `useClients`, pass to DataTable
13. **Wire `PetsPage`** — destructure pagination state from `usePets`, pass to DataTable
14. **Wire `ServicesPage`** — destructure pagination state from `useServices`, pass to DataTable

### Phase 5: Cleanup

15. **Remove dead pages** — `ClientListPage`, `PetListPage`, `ServiceListPage` and their test files (they're not in the router)
16. **Add unit tests** for Pagination molecule, DataTable pagination footer, and paginated hooks

---

## Approaches

### Approach A: Backend-driven pagination with metadata (Recommended)

Change the API contract: list endpoints return `{ data: T[], meta: { total, page, limit, totalPages } }`. The frontend receives totalCount directly, no math needed.

| Pros | Cons |
|---|---|
| Clean separation — backend owns the count logic | Requires backend + frontend changes in sync |
| Frontend doesn't need to guess or compute totals | Breaking API change (if any consumers besides frontend) |
| Aligns with REST best practices (HATEOAS-ish) | Slightly more complex response serialization |
| `totalPages` computed server-side once | — |

**Effort**: Medium

### Approach B: Frontend-only heuristic (NOT recommended)

Keep the backend returning flat arrays. The frontend checks `received.length < pageSize` to guess "last page" and disables "Next".

| Pros | Cons |
|---|---|
| No backend changes | **Cannot show total count or total pages** |
| Fastest to implement | Broken UX: "Showing page 2 of ?" |
| — | **Fails on exact-page-size edge case** — if page 3 has exactly 20 items, Next won't disable even if page 4 is empty |
| — | Cannot know if it's the last page without fetching one extra item |

**Effort**: Low (but wrong)

### Approach C: Content-Range header

Return `Content-Range: clients 1-20/57` header. Frontend parses headers to get total.

| Pros | Cons |
|---|---|
| Response body stays unchanged (backward compatible) | Non-standard for non-range requests |
| Good for progressive adoption | Harder to discover/test (headers not visible in Swagger) |
| — | Frontend must parse headers, not JSON |

**Effort**: Medium

---

## Recommendation

**Approach A: Backend-driven pagination metadata**

This is the correct engineering choice:
1. The `Pagination` molecule component is already built and expects `totalPages` and `total` — it was designed for this
2. The backend already has the infrastructure (page/limit params, skip/take) — just needs `count()` added
3. The project conventions (Clean Architecture, SDD, TDD) support incremental change through the layers
4. Every spec doc and design doc references pagination — this is expected behavior, not a new feature

**Implementation order**: Backend first (unblocks everything), then service layer, then hooks, then pages. The backend change can be done without breaking the frontend — just add the `count()` + wrap in paginated response.

---

## Risks

- **Breaking the DataTable abstraction**: DataTable is used across all three pages. Adding pagination props changes its interface. Need to ensure backward compatibility (optional props).
- **Search + pagination interaction**: When users search, should pagination reset to page 1? Yes — this must be handled in every hook's search method.
- **useClients rewrite**: `useClients` currently has zero pagination awareness. Adding it means a significant rewrite of the hook's state management.
- **Dead pages cleanup**: `ClientListPage`, `PetListPage`, `ServiceListPage` are dead code but have their own tests (ClientListPage.test.tsx, PetListPage.test.tsx, ServiceListPage.test.tsx). Removing them is clean but should be a separate commit.

---

## Ready for Proposal

**Yes** — the exploration is complete. The blocker is clear: the backend does not return pagination metadata. All three entities (clients, pets, services) follow the same pattern, so the change is systematic across all layers.

The `Pagination` molecule component already exists and just needs wiring. A single `DEFAULT_PAGE_SIZE` constant should be defined and exported from a shared location.
