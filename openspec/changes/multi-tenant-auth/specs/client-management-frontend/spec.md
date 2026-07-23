# Delta for client-management-frontend

## ADDED Requirements

### Requirement: Login Page (FR-AUTH-LOGIN)

The system SHALL provide a login page at `/login` with email and password fields. On successful login, the token and user info MUST be stored (localStorage for Phase 1) and the user redirected to `/clients`. On 401, an inline error message SHALL display. The form MUST disable submit during the API call. Password input MUST use `type="password"`.

#### Scenario: Successful login
- GIVEN the user enters valid credentials
- WHEN the login form is submitted
- THEN token and user info stored, browser redirects to /clients

#### Scenario: Invalid credentials
- GIVEN the user enters wrong password
- WHEN the login form is submitted
- THEN inline error "Invalid email or password" displays, form remains enabled

#### Scenario: Loading state
- GIVEN the login form is submitted
- WHEN the API call is in flight
- THEN submit button is disabled and shows a loading indicator

### Requirement: Authorization Header on API Calls (FR-AUTH-HEADER)

All API calls to `/api/v1/*` MUST include `Authorization: Bearer <token>` header, where token is retrieved from localStorage. The HTTP client (`src/services/http.ts`) SHALL inject this header on every request. On 401 response, the client MAY trigger a redirect to `/login` (Phase 2 requirement — Phase 1 stores the token only).

#### Scenario: Authenticated API call
- GIVEN a valid token in localStorage
- WHEN any API call is made
- THEN the request includes `Authorization: Bearer <token>` header

#### Scenario: No token stored
- GIVEN no token in localStorage (user not logged in)
- WHEN any API call is made
- THEN the request proceeds without Authorization header (server returns 401)
