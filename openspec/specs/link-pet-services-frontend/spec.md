# link-pet-services-frontend Specification

## Purpose

Frontend UI for linking services to pets and viewing linked services on Pet Detail and Client Detail pages. Extends existing types, API client, hooks, and pages.

## Requirements

### Requirement: Service Types with petId

Service, CreateServiceInput, and UpdateServiceInput MUST include `petId: number | null`.

#### Scenario: Service type shape

- GIVEN a service linked to pet 5
- WHEN fetched from API
- THEN `service.petId === 5`

#### Scenario: Unlinked service

- GIVEN a service with no pet association
- WHEN fetched from API
- THEN `service.petId === null`

### Requirement: API Client — listServices with petId filter

`listServices(page, limit, petId?)` MUST send optional `petId` query param. When omitted, no filter applied.

#### Scenario: Filter by petId

- GIVEN `listServices(1, 20, 5)` is called
- WHEN API request sent
- THEN `GET /api/v1/services?page=1&limit=20&petId=5`

#### Scenario: No petId

- GIVEN `listServices(1, 20)` is called
- WHEN API request sent
- THEN `GET /api/v1/services?page=1&limit=20` (no petId param)

### Requirement: useServices Hook — petId param

`useServices` hook MUST accept optional `petId` in fetch params and pass it to `listServices`. Re-fetch when `petId` changes.

#### Scenario: Fetch with petId

- GIVEN `useServices({ petId: 5 })` is called
- WHEN hook mounts
- THEN `listServices(page, limit, 5)` is invoked; services state holds filtered results

#### Scenario: petId changes → re-fetch

- GIVEN hook mounted with `petId: 5`
- WHEN `petId` changes to 7
- THEN re-fetch with `petId=7`

### Requirement: PetDetailPage — Linked Services Section

`/pets/:id` MUST display a "Linked Services" section below pet details using `ServiceTable`. Shows services where `petId` matches current pet. Empty state when no linked services.

#### Scenario: Pet has linked services

- GIVEN pet id=7 with 2 linked services
- WHEN navigating to `/pets/7`
- THEN ServiceTable shows both services with columns: name, duration, price, status

#### Scenario: No linked services

- GIVEN pet id=7 with zero linked services
- WHEN navigating to `/pets/7`
- THEN "No linked services" message with "Link a Service" CTA button

#### Scenario: Loading state

- GIVEN navigating to `/pets/7`
- WHEN services API in flight
- THEN skeleton/spinner shown in Linked Services section

#### Scenario: Error state

- GIVEN services API returns 500
- WHEN navigating to `/pets/7`
- THEN error message with retry button in Linked Services section

### Requirement: PetDetailPage — Link Service Action

"Link Service" button MUST open a modal/dropdown to select an existing service and link it via `PUT /api/v1/services/:id { petId: currentPetId }`. After linking, list refreshes.

#### Scenario: Link a service

- GIVEN pet id=7, service "Nail Trim" (id=3, petId=null) exists
- WHEN user clicks "Link Service", selects "Nail Trim", confirms
- THEN `PUT /api/v1/services/3 { petId: 7 }` called; table refreshes showing new link

#### Scenario: Modal shows only unlinked services

- GIVEN service 3 linked to pet 7, service 4 (petId=null), service 5 (petId=7)
- WHEN "Link Service" modal opens
- THEN only service 4 shown (petId=null); already-linked excluded

### Requirement: PetDetailPage — Unlink Action

Each service row MUST have an "Unlink" action that calls `PUT /api/v1/services/:id { petId: null }`. After confirmation, row removed from list.

#### Scenario: Unlink a service

- GIVEN pet id=7, service "Full Groom" (id=1, petId=7) in table
- WHEN user clicks "Unlink" on row and confirms
- THEN `PUT /api/v1/services/1 { petId: null }` called; row disappears from table

#### Scenario: Unlink confirmation

- GIVEN service row with "Unlink" button
- WHEN user clicks "Unlink"
- THEN confirmation dialog shown before API call

### Requirement: ClientDetailPage — Services by Pet Section

`/clients/:id` MUST show a "Services by Pet" section below client details. Frontend orchestrates: fetch pets → for each pet fetch services via `?petId=X` → display grouped cards/tables. Only pets with linked services shown.

#### Scenario: Client with linked services

- GIVEN client id=42 has 2 pets: Rex (id=7, 1 linked service) and Bella (id=8, 2 linked services)
- WHEN navigating to `/clients/42`
- THEN "Services by Pet" section shows: "Rex" card with 1 service, "Bella" card with 2 services

#### Scenario: No linked services for any pet

- GIVEN client id=42 has pets but zero linked services across all
- WHEN navigating to `/clients/42`
- THEN "Services by Pet" section hidden or shows "No linked services"

#### Scenario: Loading — pets fetch in progress

- GIVEN navigating to `/clients/42`
- WHEN pets API in flight
- THEN skeleton/spinner in Services by Pet section

#### Scenario: Per-pet loading

- GIVEN 2 pets fetched, services for first pet still loading
- WHEN services for second pet resolve first
- THEN second pet's services render; first pet shows spinner until loaded

### Requirement: Loading, Empty, Error States

All service sections MUST handle loading (spinner/skeleton), empty ("No linked services"), and error (message + retry).

#### Scenario: Loading

- GIVEN any service fetch in flight
- WHEN rendering pet/client page
- THEN skeleton/spinner in service section

#### Scenario: Empty — no linked services

- GIVEN pet exists with zero linked services
- WHEN linked services section renders
- THEN "No linked services" message with CTA

#### Scenario: Error

- GIVEN services API returns 500
- WHEN linked services section renders
- THEN error message with retry button
