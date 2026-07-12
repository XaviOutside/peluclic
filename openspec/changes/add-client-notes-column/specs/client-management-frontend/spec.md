# Delta for client-management-frontend

## ADDED Requirements

### Requirement: Client Notes Field

The Client entity MUST include an optional `notes` field at all layers. The backend SHALL persist it via nullable `TEXT` and return it in all CRUD and search responses. The frontend SHALL provide a textarea in forms, truncated notes with tooltip in the listing, and full notes in the detail card with a "Not provided" fallback when null.

#### Scenario: Create or update client notes

- GIVEN the user enters notes text in the form
- WHEN the form is submitted
- THEN notes are persisted and returned in the API response
- AND submitting with empty notes results in `notes: null`

#### Scenario: View notes in detail card

- GIVEN a client with notes "Likes belly rubs"
- WHEN viewing `/clients/:id`
- THEN a DetailRow labeled "Notes" shows the full text
- AND a client with `notes: null` displays "Not provided"

#### Scenario: Notes in listing column

- GIVEN a client with notes longer than two lines
- WHEN the client list renders
- THEN the "Notas" column shows text truncated to 2 lines via `line-clamp-2` with full text on `title`
- AND a client with `notes: null` displays "—"

## MODIFIED Requirements

### Requirement: Client List View

The page at `/clients` MUST display a paginated table with five data columns: client name with numeric ID, contact details (email, phone, phone2, address), notes, status, and last service date. It MUST show an empty state when no clients exist and SHOW a loading indicator during API calls.
(Previously: four columns without a notes column)

#### Scenario: Happy path — list loads with clients

- GIVEN the API returns active clients
- WHEN the user navigates to `/clients`
- THEN five data columns display: | Client | Contact | Notas | Status | Last Service |
- AND Client shows bold name with muted numeric ID below
- AND Contact shows email, phone, plus phone2 and address when present
- AND Notas shows truncated text with tooltip or "—" when null
- AND Last Service shows DD/MM/YYYY or "—" when null

#### Scenario: Empty state — no clients exist

- GIVEN no clients exist in the system
- WHEN the user navigates to `/clients`
- THEN a user-friendly empty state message is shown with a call-to-action

#### Scenario: Mobile viewport — stacked card layout

- GIVEN the viewport is 768px wide or narrower
- WHEN the user views the client list
- THEN the desktop table adapts to a stacked card format
- AND the Notas column is hidden on mobile (`mobileVisible: false`)

### Requirement: Create Client Form

The page at `/clients/new` MUST validate required fields (name, email, phone) on blur and on submit. The form SHALL include an optional notes textarea. On success it MUST redirect to the detail page. On server validation errors (422) it MUST show inline field errors.
(Previously: form had no notes textarea)

#### Scenario: Happy path — create with notes

- GIVEN the user fills required fields and enters notes
- WHEN the form is submitted
- THEN the client is created and the browser redirects to `/clients/{newId}`

#### Scenario: Server validation failure (422)

- GIVEN the user submits data with a duplicate email
- WHEN the API returns a 422 with field errors
- THEN inline error messages appear under the relevant form fields

### Requirement: Edit Client Form

The page at `/clients/:id/edit` MUST pre-populate all fields — including notes — from existing client data and validate input on submission.
(Previously: edit form did not pre-populate or submit notes)

#### Scenario: Happy path — edit with notes

- GIVEN the user navigates to `/clients/42/edit` where the client has notes
- WHEN the notes field is pre-populated, the user modifies it, and submits
- THEN the client's notes are updated and the browser redirects to `/clients/42`
