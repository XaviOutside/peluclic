# Delta for Services API Frontend

## ADDED Requirements

### Requirement: useServices Hook Pagination

`useServices` MUST expose: `page`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`, `goToPage(n)`, `goToNextPage()`, `goToPreviousPage()`. `fetchServices` MUST parse `meta` from `PaginatedResponse<Service>`. `search` MUST reset `page` to 1. No hardcoded `limit=20` — import `DEFAULT_PAGE_SIZE` from `src/constants/pagination.ts`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Pagination state from API meta | 25 services, page 1, limit 10 | `useServices` fetches | `totalCount=25,totalPages=3,hasNextPage=true` |
| goToNextPage | page 1, hasNextPage=true | `goToNextPage()` | fetches page 2 |
| Search resets page | user on page 3 | `search("groom")` | page=1 before fetch |

### Requirement: DataTable Pagination on ServicesPage

`ServicesPage` MUST pass pagination props from `useServices` to `DataTable`. The pagination footer MUST render when `totalPages > 1`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Pagination visible | 50 services, totalPages=3 | user views `/services` | footer: "Page 1 of 3" |

## MODIFIED Requirements

### Requirement: Service List Page (FR-9)

`/services` MUST display a paginated table of services with status badges, search bar (300ms debounce), and "New Service" button. The DataTable footer MUST render pagination controls when `totalPages > 1`. MUST handle loading, empty, and error states.

(Previously: claimed pagination but hook returned flat array without metadata or page control)

#### Scenario: List loads with pagination

- GIVEN 25 services exist
- WHEN navigating to `/services` where limit=20
- THEN table shows 20 services with pagination footer

#### Scenario: Empty state

- GIVEN no services
- WHEN navigating to `/services`
- THEN "No services yet" message with "Create your first service" CTA

#### Scenario: Search resets page

- GIVEN user on page 2
- WHEN typing "groom" in search (300ms debounce)
- THEN page resets to 1, results filtered

### Requirement: useServices Hook (FR-16)

Exposes: `services`, `service`, `loading`, `error`, `page`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`, `goToPage`, `goToNextPage`, `goToPreviousPage`, `search`, `getService`, `createService`, `updateService`, `deactivateService`, `deleteService`. Mutations update local state after success.

(Previously: exposed only `services`, `service`, `loading`, `error`, and CRUD methods — no pagination metadata)

#### Scenario: Create updates list

- GIVEN on list page
- WHEN createService succeeds
- THEN services array includes new service without reload

#### Scenario: Error propagation

- GIVEN API returns 500
- WHEN getService(1) called
- THEN error state set; service remains null
