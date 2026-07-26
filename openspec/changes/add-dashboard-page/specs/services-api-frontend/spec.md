# Delta for Services API Frontend

## ADDED Requirements

### Requirement: Client Autocomplete in ServiceForm

ServiceForm MUST provide an optional client autocomplete field. On focus, it SHALL fetch clients via debounced search (300ms). Selected client populates `clientId`. Field is optional — form submits without client selection.

#### Scenario: Select client from autocomplete

- GIVEN user opens ServiceForm at `/services/new`
- WHEN user types "Jane" in client autocomplete
- THEN after 300ms, matching clients appear; selecting one sets `clientId`

#### Scenario: No client selected

- GIVEN user fills required fields without touching autocomplete
- WHEN form submitted
- THEN service created with clientId=null

### Requirement: performedAt Date Picker in ServiceForm

ServiceForm MUST provide an optional date picker for `performedAt`. Defaults to today's date. User MAY change or clear it. When cleared or omitted, API receives no `performedAt` value.

#### Scenario: Default to today

- GIVEN user opens ServiceForm
- WHEN form renders
- THEN performedAt field shows today's date

#### Scenario: User selects different date

- GIVEN user changes performedAt to "2026-07-20"
- WHEN form submitted
- THEN API receives performedAt="2026-07-20" in ISO 8601

#### Scenario: Empty state in list shows "N/A"

- GIVEN ServiceTable renders a service with performedAt=null
- WHEN row renders
- THEN performedAt column shows "N/A"

### Requirement: Client List Fetch for Autocomplete

`useServices` hook MUST expose a `searchClients` method. It SHALL fetch `GET /api/v1/clients/search?q={query}` with 300ms debounce. Loading indicator shown while fetching.

#### Scenario: Fetch clients on search

- GIVEN user types in client autocomplete
- WHEN searchClients("Jane") called
- THEN loading indicator shown, matching clients returned

#### Scenario: Empty results

- GIVEN search for "xyz" with no matches
- WHEN results arrive
- THEN "No clients found" shown in dropdown

## MODIFIED Requirements

### Requirement: ServiceForm Component (FR-15)

ServiceForm fields: name (text, required), description (textarea, optional), duration_minutes (number, optional), price (text, dollar format, required), **clientId (autocomplete, optional)**, **performedAt (date picker, defaults to today, optional)**. Validates on blur and submit. Converts price to cents on submit.
(Previously: no clientId or performedAt fields)

#### Scenario: Submit with client and date

- GIVEN user fills name="Groom", price="50.00", selects client #3, performedAt="2026-07-26"
- WHEN form submitted
- THEN onSubmit receives { name: "Groom", price: 5000, clientId: 3, performedAt: "2026-07-26T00:00:00.000Z" }

#### Scenario: Blur validation

- GIVEN name field focused then blurred empty
- WHEN blur fires
- THEN inline error "Name is required" appears

#### Scenario: Submit with cents conversion

- GIVEN price="25.00" entered
- WHEN form submitted
- THEN onSubmit receives price=2500

### Requirement: useServices Hook (FR-16)

Exposes: `services`, `service`, `loading`, `error`, `search`, `getService`, `createService`, `updateService`, `deactivateService`, `deleteService`, **`searchClients`**. Mutations update local state after success.
(Previously: no searchClients export)

#### Scenario: Create updates list

- GIVEN on list page
- WHEN createService succeeds
- THEN services array includes new service without reload

[All original scenarios preserved — error propagation, etc.]
