# Delta for Client Management Frontend

## ADDED Requirements

### Requirement: useClients Hook Pagination

`useClients` MUST expose: `page`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`, `goToPage(n)`, `goToNextPage()`, `goToPreviousPage()`. `fetchClients` MUST accept `page` and `limit` and parse `meta` from `PaginatedResponse<Client>`. `search` MUST reset `page` to 1.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Exposes pagination state | API returns 42 clients | `useClients` fetches page 1 | `totalCount=42,totalPages=3,hasNextPage=true,hasPreviousPage=false` |
| goToNextPage | user on page 1 | `goToNextPage()` called | fetches page 2, `page` becomes 2 |
| Search resets page | user on page 3 | `search("term")` called | `page` resets to 1 before fetch |

### Requirement: DataTable Pagination Footer

`DataTable` MUST accept optional `pagination?: { page, totalPages, totalItems, onPageChange }`. When provided, footer renders `Pagination` molecule with prev/next + "Page X of Y". When omitted, no footer renders.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Renders pagination | prop `{page:1,totalPages:5,totalItems:100,onPageChange:fn}` | DataTable renders | footer: "Page 1 of 5", prev disabled, next enabled |
| Last page | prop `{page:5,totalPages:5,...}` | DataTable renders | next disabled, prev enabled |
| No prop | pagination omitted | DataTable renders | no footer rendered |

### Requirement: DEFAULT_PAGE_SIZE Constant

`src/constants/pagination.ts` MUST export `DEFAULT_PAGE_SIZE = 20`. All hooks and API services MUST import from this file. No hardcoded `20` for limit/pageSize remains in `src/`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Consumed by hooks | `useClients` fetches without limit | request sent | `limit=20` (from DEFAULT_PAGE_SIZE) |

## MODIFIED Requirements

### Requirement: Client List View

The page at `/clients` MUST display a paginated table of clients in four columns: client name with numeric ID, contact details (email, phone, phone2, address), status, and last service date. It MUST show an empty state when no clients exist, SHOW a loading indicator during API calls, and MUST render pagination controls in the DataTable footer when `totalPages > 1`. The page MUST pass `pagination` props from the `useClients` hook to `DataTable`.

(Previously: claimed pagination but had no pagination controls, metadata, or footer rendering)

#### Scenario: Happy path — list loads with clients

- GIVEN the API returns active clients with optional phone2, address, and lastServiceDate fields
- WHEN the user navigates to `/clients`
- THEN four columns display: | Client | Contact | Status | Last Service |
- AND the Client column shows bold name with muted numeric ID below
- AND the Contact column shows email, phone, plus phone2 and address when present
- AND the Last Service column shows DD/MM/YYYY or "—" when null

#### Scenario: Nullable fields — missing data renders gracefully

- GIVEN a client has null phone2, null address, and null lastServiceDate
- WHEN the user views the client list
- THEN phone2 and address rows are omitted from the Contact column
- AND last service date displays "—"

#### Scenario: Empty state — no clients exist

- GIVEN no clients exist in the system
- WHEN the user navigates to `/clients`
- THEN a user-friendly empty state message is shown with a call-to-action

#### Scenario: Mobile viewport — stacked card layout

- GIVEN the viewport is 768px wide or narrower
- WHEN the user views the client list
- THEN the four-column desktop table adapts to a stacked card format preserving all field information

#### Scenario: Pagination controls visible

- GIVEN 50 clients exist (totalPages=3)
- WHEN user navigates to `/clients`
- THEN DataTable footer shows "Page 1 of 3" with prev/next buttons
- AND prev button is disabled on page 1

#### Scenario: Next page loads data

- GIVEN user on page 1 with next available
- WHEN user clicks "Next" in footer
- THEN page 2 loads with next 20 clients

#### Scenario: Search resets to page 1

- GIVEN user is viewing page 3
- WHEN user types a search query
- THEN table resets to page 1 with search-filtered results
