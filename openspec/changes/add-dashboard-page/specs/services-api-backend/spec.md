# Delta for Services API Backend

## ADDED Requirements

### Requirement: Service Client Tracking (FR-11)

Service entity MUST support optional `clientId` (nullable INT, no FK, no existence check) and `performedAt` (DATETIME NOT NULL, defaults to NOW()). A composite index `(client_id, performed_at)` SHALL be created. Existing rows MUST be backfilled with `performedAt = createdAt`.

When a service is created with `clientId`, the system MUST call `IClientRepository.updateLastServiceDate(clientId)` to refresh the client's last service timestamp.

#### Scenario: Create with clientId and performedAt

- GIVEN valid payload: name="Groom", price=5000, clientId=3, performedAt="2026-07-26T10:00:00Z"
- WHEN POST /api/v1/services
- THEN 201, response includes clientId=3, performedAt in UTC, Client(id=3).lastServiceDate updated

#### Scenario: performedAt omitted defaults to NOW

- GIVEN payload without performedAt
- WHEN POST /api/v1/services { name: "Bath", price: 2500 }
- THEN 201, performedAt set to current timestamp, clientId=null

#### Scenario: clientId omitted, no client update

- GIVEN payload without clientId
- WHEN POST /api/v1/services
- THEN 201, clientId=null, no Client update triggered

### Requirement: Dashboard Aggregate Queries (FR-12)

`IServiceRepository.findDashboardStats(timezone: string, startDate: Date, endDate: Date): Promise<DashboardStats>` MUST return:
- `clientsServed`: COUNT(DISTINCT clientId)
- `revenue`: SUM(price) in cents
- `dailyServices`: [{ date, count, revenue }] grouped by `DATE(CONVERT_TZ(performed_at, '+00:00', tz))`

Queries non-deleted services with non-null `clientId` and `performedAt` within the date range only.

#### Scenario: Stats in UTC-5 timezone

- GIVEN 3 services today (2 distinct clients, total $150.00) in UTC-5 zone
- WHEN findDashboardStats("-05:00", todayStart, todayEnd)
- THEN clientsServed=2, revenue=150.00, dailyServices has 1 entry with count=3

#### Scenario: Empty range returns zeros

- GIVEN no services in date range
- WHEN findDashboardStats called
- THEN clientsServed=0, revenue=0.00, dailyServices=[]

#### Scenario: Timezone boundary grouping

- GIVEN service at 2026-07-26T01:00:00Z (still July 25 in UTC-5)
- WHEN findDashboardStats with timezone "-05:00"
- THEN service grouped under July 25, not July 26

## MODIFIED Requirements

### Requirement: Create Service (FR-1)

`POST /api/v1/services` — body: `{ name, description?, duration_minutes?, price, petId?, clientId?, performedAt? }`. The system MUST create a service with `status=active` and `deletedAt=NULL`. `clientId` is optional (nullable INT, no FK). `performedAt` is optional (defaults to NOW()). MUST update `Client.lastServiceDate` when `clientId` is provided. Returns `201` with `ServiceResponseDto`.
(Previously: no clientId or performedAt fields)

#### Scenario: Happy path

- GIVEN valid payload: name="Full Groom", price=5000, duration_minutes=60
- WHEN POST /api/v1/services
- THEN 201, performedAt=NOW, clientId=null, ServiceResponseDto (price=50.00)

#### Scenario: With clientId and performedAt

- GIVEN payload with clientId=3, performedAt="2026-07-26T10:00:00Z"
- WHEN POST /api/v1/services { name: "Full Groom", price: 5000, clientId: 3, performedAt: "2026-07-26T10:00:00Z" }
- THEN 201, clientId=3, performedAt in UTC, Client.lastServiceDate updated

#### Scenario: Missing name

- GIVEN payload without `name`
- WHEN POST /api/v1/services
- THEN 422 `"name is required"`

#### Scenario: Missing price

- GIVEN payload without `price`
- WHEN POST /api/v1/services
- THEN 422 `"price is required"`

#### Scenario: Name exceeds 255 chars

- GIVEN name > 255 characters
- WHEN POST /api/v1/services
- THEN 422 `"name must be 255 characters or fewer"`

#### Scenario: Negative price

- GIVEN price: -1000
- WHEN POST /api/v1/services
- THEN 422 `"price must be a non-negative integer"`

#### Scenario: Optional fields omitted

- GIVEN payload without description, duration_minutes, petId, clientId, performedAt
- WHEN POST /api/v1/services { name: "Bath", price: 2500 }
- THEN 201, description=null, durationMinutes=null, petId=null, clientId=null, performedAt=current time

[All original validation scenarios preserved — negative duration, petId, etc.]

### Requirement: DTO Mapping (FR-8)

Response DTO MUST map `client_id`→`clientId` (nullable number) and `performed_at`→`performedAt` (ISO 8601 string). Request DTO MUST accept optional `clientId` (integer) and `performedAt` (ISO 8601, defaults to NOW when omitted).
(Previously: no clientId/performedAt mapping)

#### Scenario: Full mapping with new fields

- GIVEN DB row: name="Bath", price=2500, status=1, pet_id=null, client_id=null, performed_at="2026-07-26T10:00:00.000Z"
- WHEN mapped to ServiceResponseDto
- THEN response: { name: "Bath", price: 25.00, status: "active", petId: null, clientId: null, performedAt: "2026-07-26T10:00:00.000Z", durationMinutes: null }

### Requirement: Validation Rules

| Field | Rule |
|-------|------|
| name | Required, 1–255 chars |
| description | Optional, TEXT |
| duration_minutes | Optional, positive integer |
| price | Required, integer ≥ 0 (cents) |
| petId | Optional, integer (no existence check) |
| clientId | Optional, integer (no existence check) |
| performedAt | Optional on create (defaults to NOW), valid ISO 8601 if provided |
| search q | Required, strip FTS operators `+ - * " ( )` |
(Previously: no clientId/performedAt validation rules)

### Requirement: Domain Rules

(Add: clientId nullable INT, no FK. performedAt DATETIME NOT NULL, defaults NOW(). Composite index `(client_id, performed_at)`. Backfill: existing rows get `performedAt = createdAt`. All other rules unchanged.)
(Previously: no clientId/performedAt rules)
