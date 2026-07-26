# Dashboard API Specification

## Purpose

REST endpoint for aggregated business metrics. Returns clients served, revenue, and daily service breakdown. Accepts timezone offset so "today" matches the groomer's local day.

## Requirements

### Requirement: Get Dashboard Stats (FR-1)

`GET /api/v1/dashboard/stats?timezone=-05:00` MUST return:

| Field | Type | Source |
|-------|------|--------|
| today.clientsServed | number | COUNT DISTINCT client_id today |
| today.revenue | number | SUM(price) today, in dollars |
| week.clientsServed | number | COUNT DISTINCT client_id this week |
| week.revenue | number | SUM(price) this week |
| month.clientsServed | number | COUNT DISTINCT client_id this month |
| month.revenue | number | SUM(price) this month |
| dailyServices | [{ date, count, revenue }] | GROUP BY DATE(CONVERT_TZ(performed_at, ...)) |

Timezone: `timezone` query param is a UTC offset string (e.g., `-05:00`, `+03:00`). When omitted, system SHALL default to UTC (`+00:00`). All date boundaries (today, week, month) SHALL use the provided timezone.

Only non-deleted services with non-null `clientId` and `performedAt` count.

#### Scenario: Today's stats in UTC-5

- GIVEN 3 services today (clients A, A, B), total $150.00, timezone=-05:00
- WHEN GET /api/v1/dashboard/stats?timezone=-05:00
- THEN 200: { today: { clientsServed: 2, revenue: 150.00 }, week: {...}, month: {...}, dailyServices: [{ date: "2026-07-26", count: 3, revenue: 150.00 }] }

#### Scenario: Empty database returns zeros

- GIVEN no services exist
- WHEN GET /api/v1/dashboard/stats
- THEN 200: { today: { clientsServed: 0, revenue: 0.00 }, week: { clientsServed: 0, revenue: 0.00 }, month: { clientsServed: 0, revenue: 0.00 }, dailyServices: [] }

#### Scenario: Missing timezone defaults to UTC

- GIVEN services exist
- WHEN GET /api/v1/dashboard/stats (no timezone param)
- THEN 200, all date boundaries computed as UTC

#### Scenario: Invalid timezone format

- GIVEN timezone="invalid"
- WHEN GET /api/v1/dashboard/stats?timezone=invalid
- THEN 422 "Invalid timezone format"

#### Scenario: Services without clientId excluded

- GIVEN 5 services total, 2 with clientId=null
- WHEN GET /api/v1/dashboard/stats
- THEN only 3 services counted in clientsServed

### Requirement: DashboardStats Entity (Domain)

`DashboardStats` value object MUST hold:

| Property | Type |
|----------|------|
| today | { clientsServed: number, revenue: number } |
| week | { clientsServed: number, revenue: number } |
| month | { clientsServed: number, revenue: number } |
| dailyServices | Array<{ date: string, count: number, revenue: number }> |

Revenue SHALL be exposed in dollars (decimal), converted from cents at the repository boundary.

### Requirement: Error Handling

The endpoint SHALL handle database connection failures and query timeouts gracefully. On failure, it MUST return 500 with a generic message — no stack traces or internal details leaked.

#### Scenario: Database unavailable

- GIVEN MySQL connection fails
- WHEN GET /api/v1/dashboard/stats
- THEN 500 "Internal server error"

### Requirement: Out of Scope

- No authentication required (matches existing API pattern)
- No caching headers or ETags (can be added later)
- No per-service-type revenue breakdown
- No appointment data integration
