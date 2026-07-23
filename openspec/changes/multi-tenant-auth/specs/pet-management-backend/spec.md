# Delta for pet-management-backend

## ADDED Requirements

### Requirement: Authentication Required (FR-AUTH-GATE)

All endpoints under `/api/v1/pets` MUST require a valid session via `Authorization: Bearer <token>` header. The auth middleware SHALL validate the token before any route handler executes. Missing, invalid, or expired tokens SHALL return 401 `{ error: "Unauthorized" }`. Authenticated requests proceed with existing behavior unchanged.

#### Scenario: Authenticated request proceeds
- GIVEN a valid session token in Authorization header
- WHEN any `/api/v1/pets` endpoint is called
- THEN request proceeds normally — existing CRUD/search/cascade behavior applies

#### Scenario: Missing token
- GIVEN no Authorization header
- WHEN any `/api/v1/pets` endpoint is called
- THEN 401 `{ error: "Unauthorized" }`

#### Scenario: Invalid token
- GIVEN `Authorization: Bearer invalid-token`
- WHEN any `/api/v1/pets` endpoint is called
- THEN 401 `{ error: "Unauthorized" }`

#### Scenario: Expired session
- GIVEN a token whose session `expires_at < NOW()`
- WHEN any `/api/v1/pets` endpoint is called
- THEN 401 `{ error: "Unauthorized" }`
