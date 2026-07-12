# Delta for Pet Management Frontend

## ADDED Requirements

### Requirement: usePets Hook Pagination

`usePets` MUST expose: `page`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`, `goToPage(n)`, `goToNextPage()`, `goToPreviousPage()`. `fetchPets` MUST parse `meta` from `PaginatedResponse<Pet>`. `search` MUST reset `page` to 1. `limit` MUST default to `DEFAULT_PAGE_SIZE` from `src/constants/pagination.ts`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Exposes pagination | 30 pets returned, page 1, limit 20 | `usePets` fetches | `totalCount=30,totalPages=2,hasNextPage=true` |
| goToPreviousPage | user on page 2 | `goToPreviousPage()` | fetches page 1, `page=1` |

### Requirement: DataTable Pagination on PetsPage

`PetsPage` MUST pass pagination props (`page`, `totalPages`, `totalItems`, `onPageChange`) from `usePets` to `DataTable`. The pagination footer MUST render when `totalPages > 1`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Pagination on multi-page list | 45 pets, totalPages=3 | user views `/pets` | footer shows "Page 1 of 3" |

## MODIFIED Requirements

### Requirement: Pet List Page (FR-9)

`/pets` MUST display a paginated table of pets showing name, species, breed, and status. The DataTable footer MUST render pagination controls when `totalPages > 1`, driven by `usePets` hook state. It MUST show loading/empty/error states and a search bar with 300ms debounce. Search MUST reset page to 1.

(Previously: claimed pagination but hook had no metadata, page control, or DataTable footer)

#### Scenario: List loads with pagination

- GIVEN 30 active pets exist
- WHEN navigating to `/pets`
- THEN paginated table displays 20 pets with pagination footer showing "Page 1 of 2"

#### Scenario: Empty state

- GIVEN no pets exist
- WHEN navigating to `/pets`
- THEN a user-friendly empty state message is shown with a create call-to-action

#### Scenario: Search resets pagination

- GIVEN user is on page 2
- WHEN user searches for "Rex"
- THEN page resets to 1 with filtered results
