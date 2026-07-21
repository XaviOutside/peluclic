# Delta for Demo Mode

## ADDED Requirements

### Requirement: Landing Page on First Visit
The system MUST render a landing page when `pf_demo:mode` is absent from localStorage. The page SHALL display an active "Try Demo" button and a visually disabled "Log In" button with a message indicating future availability.

#### Scenario: First visit shows landing page
- GIVEN no `pf_demo:mode` key in localStorage
- WHEN the user navigates to the application root URL
- THEN the landing page renders with both "Try Demo" (active) and "Log In" (disabled) buttons

#### Scenario: Log In button is inactive
- GIVEN the landing page is displayed
- WHEN the user attempts to interact with the "Log In" button
- THEN the button is visually disabled AND shows a message that login is coming in a future version

### Requirement: Demo Mode Selection
The user MUST be able to enter demo mode by clicking "Try Demo". The system SHALL persist `pf_demo:mode: "demo"` to localStorage and navigate to the main application immediately.

#### Scenario: User activates demo mode
- GIVEN the landing page is displayed
- WHEN the user clicks "Try Demo"
- THEN `pf_demo:mode` is set to `"demo"` in localStorage AND the application navigates to the main dashboard

### Requirement: Demo Mode Persistence on Revisit
When `pf_demo:mode` equals `"demo"`, the system MUST skip the landing page and render the main application directly.

#### Scenario: Returning demo user skips landing page
- GIVEN localStorage contains `pf_demo:mode: "demo"`
- WHEN the user navigates to the application root URL
- THEN the landing page is NOT rendered AND the main application loads immediately

### Requirement: Demo Data Isolation
All data in demo mode MUST use localStorage keys prefixed with `pf_demo:`. Zero HTTP requests to the backend SHALL be made.

#### Scenario: Demo operations use prefixed keys and no API calls
- GIVEN the application is in demo mode
- WHEN any client, pet, service, appointment, or settings operation executes
- THEN all reads and writes use `pf_demo:` prefixed localStorage keys AND no network requests are made to the backend

### Requirement: Graceful Degradation on localStorage Unavailable
The system MUST catch `SecurityError` when localStorage is unavailable (e.g., Safari private browsing) and SHALL display a clear error message without crashing.

#### Scenario: Blocked localStorage shows error message
- GIVEN localStorage access throws `SecurityError`
- WHEN the application initializes demo mode
- THEN an error message explains localStorage is required AND the application does not crash

### Requirement: Empty State on First Use
When demo mode has no saved data, the system MUST display empty-state UI for each list view rather than error states.

#### Scenario: First-time user sees empty lists
- GIVEN demo mode is active AND no data exists in `pf_demo:*` keys
- WHEN the user navigates to Clients, Pets, Services, or Appointments pages
- THEN each page displays an empty-state message (e.g., "No clients yet") — not an error

### Requirement: Data Corruption Recovery
When localStorage data contains malformed JSON, the system MUST fall back to empty defaults instead of crashing.

#### Scenario: Corrupted JSON returns empty data
- GIVEN `pf_demo:clients` contains unparseable JSON
- WHEN the application reads clients data
- THEN the read returns an empty array AND normal operation continues

### Requirement: No Backend Dependency
Demo mode MUST function with zero backend infrastructure — no Docker, MySQL, or API server required.

#### Scenario: Demo mode works without any services
- GIVEN no Docker containers or backend processes are running
- WHEN the user enters demo mode
- THEN all CRUD, search, pagination, and navigation work using only browser localStorage
