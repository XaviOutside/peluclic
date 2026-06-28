# Services API Frontend Specification

## Purpose

Responsive UI for managing grooming services — list/search/create/view/edit/deactivate/delete via `/api/v1/services`. Third nav tab (Clients → Pets → Services). Price displayed in dollars, sent as cents.

## Requirements

### Requirement: Service List Page (FR-9)

`/services` MUST display a paginated table of services with status badges, search bar (300ms debounce), and "New Service" button. MUST handle loading, empty, and error states.

#### Scenario: List loads

- GIVEN services exist
- WHEN navigating to `/services`
- THEN paginated ServiceTable shows name, duration, price (dollars), status badge

#### Scenario: Empty state

- GIVEN no services
- WHEN navigating to `/services`
- THEN "No services yet" message with "Create your first service" CTA

#### Scenario: Search debounced

- GIVEN services exist
- WHEN typing "groom" in search
- THEN after 300ms, table shows matching results

### Requirement: Service Create Page (FR-10)

`/services/new` MUST render ServiceForm. Validates name (required) and price (required) on blur and submit. Duration optional. Price input accepts dollar format, converts to cents for API. On success redirects to detail page. On 422 shows inline errors.

#### Scenario: Successful creation

- GIVEN user fills name="Full Groom", price="50.00", duration="60"
- WHEN form submitted
- THEN service created; redirects to `/services/{newId}`

#### Scenario: Validation — name required

- GIVEN name field empty
- WHEN form submitted
- THEN inline error "Name is required" shown

#### Scenario: Validation — price required

- GIVEN price field empty
- WHEN form submitted
- THEN inline error "Price is required" shown

#### Scenario: Cents conversion

- GIVEN user enters price="49.99"
- WHEN form submitted
- THEN API receives price=4999

### Requirement: Service Detail Page (FR-11)

`/services/:id` MUST show ServiceDetailCard with all fields, status badge, and actions (edit, deactivate, delete with confirmation). 404 when not found.

#### Scenario: View active service

- GIVEN service id=1 active
- WHEN navigating to `/services/1`
- THEN fields displayed; "Active" badge; edit/deactivate/delete visible

#### Scenario: View inactive service

- GIVEN service id=2 inactive
- WHEN navigating to `/services/2`
- THEN "Inactive" badge; deactivate button hidden

#### Scenario: Not found

- GIVEN no service id=999
- WHEN navigating to `/services/999`
- THEN "Service not found" with link back to `/services`

### Requirement: Service Edit Page (FR-12)

`/services/:id/edit` MUST pre-populate ServiceForm with existing data. Price displayed in dollar format from cents. Validates on submit same as create.

#### Scenario: Edit and save

- GIVEN service "Full Groom" price=5000
- WHEN user changes name to "Deluxe" and price to "75.00" and submits
- THEN service updated; redirects to `/services/{id}`

#### Scenario: Price pre-population

- GIVEN service price=5000 (cents)
- WHEN navigating to edit page
- THEN price input shows "50.00"

### Requirement: Delete/Deactivate with Confirmation (FR-13)

Detail page MUST show ConfirmDialog before deactivate or delete. After confirmation, UI updates to reflect new state.

#### Scenario: Confirm deactivate

- GIVEN viewing active service
- WHEN user clicks "Deactivate" and confirms
- THEN status badge changes to "Inactive"; deactivate button hidden

#### Scenario: Confirm delete

- GIVEN viewing service
- WHEN user clicks "Delete" and confirms
- THEN service soft-deleted; redirects to `/services`

### Requirement: ServiceTable Component (FR-14)

Columns: Name, Duration, Price, Status, Actions. Duration → "N/A" when null, "X min" when set. Price → "$XX.XX". Status → StatusBadge atom. Actions → Edit + Delete buttons.

#### Scenario: Render row

- GIVEN service: "Full Groom", 60 min, $50.00, active
- WHEN ServiceTable renders
- THEN row: "Full Groom" | "60 min" | "$50.00" | green "Active" badge | Edit + Delete

#### Scenario: Null duration

- GIVEN service durationMinutes=null
- WHEN rendered
- THEN duration column shows "N/A"

### Requirement: ServiceForm Component (FR-15)

Fields: name (text, required), description (textarea, optional), duration_minutes (number, optional), price (text, dollar format, required). Validates on blur and submit. Converts price to cents on submit.

#### Scenario: Blur validation

- GIVEN name field focused then blurred empty
- WHEN blur fires
- THEN inline error "Name is required" appears

#### Scenario: Submit with cents conversion

- GIVEN price="25.00" entered
- WHEN form submitted
- THEN onSubmit receives price=2500

### Requirement: useServices Hook (FR-16)

Exposes: `services`, `service`, `loading`, `error`, `search`, `getService`, `createService`, `updateService`, `deactivateService`, `deleteService`. Mutations update local state after success.

#### Scenario: Create updates list

- GIVEN on list page
- WHEN createService succeeds
- THEN services array includes new service without reload

#### Scenario: Error propagation

- GIVEN API returns 500
- WHEN getService(1) called
- THEN error state set; service remains null

### Requirement: Loading, Empty, Error States (FR-17)

All pages MUST show spinner during load, empty message when no data, error with retry on failure.

#### Scenario: Loading — list

- GIVEN navigating to `/services`
- WHEN API in flight
- THEN spinner shown instead of table

#### Scenario: Error — detail

- GIVEN `/api/v1/services/1` returns 500
- WHEN navigating to `/services/1`
- THEN error message with retry button displayed

#### Scenario: Empty with no search

- GIVEN no services, no search query
- WHEN navigating to `/services`
- THEN "No services yet" with create CTA
