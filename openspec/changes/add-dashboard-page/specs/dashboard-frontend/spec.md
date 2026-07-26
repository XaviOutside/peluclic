# Dashboard Frontend Specification

## Purpose

Dashboard page at `/dashboard` showing business KPIs and daily service chart. Displays zeros when no data exists. Detects user timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## Requirements

### Requirement: Dashboard Page Route (FR-1)

`/dashboard` MUST render the `DashboardPage` component. The sidebar and mobile nav "Dashboard" link SHALL navigate to `/dashboard` (not `/`).

#### Scenario: Navigate to dashboard

- GIVEN user clicks "Dashboard" in sidebar
- WHEN navigation completes
- THEN url is `/dashboard`, DashboardPage renders

#### Scenario: Mobile nav points to /dashboard

- GIVEN mobile breakpoint active
- WHEN mobile nav "Dashboard" tapped
- THEN navigates to `/dashboard`

### Requirement: KPI Cards (FR-2)

`DashboardStatsCard` molecule MUST render 3 cards side by side: Clients Served, Revenue, Services/Day. Each card SHALL have a toggle group (today / this week / this month). Default view: today.

On empty data, cards SHALL show "0 clients", "$0.00", "0 services/day".

#### Scenario: Today with data

- GIVEN today stats: 5 clients, $250.00
- WHEN DashboardPage loads with "today" selected
- THEN cards show "5 clients served", "$250.00 revenue", and average services/day calculated from dailyServices

#### Scenario: Empty state shows zeros

- GIVEN no services exist
- WHEN DashboardPage loads
- THEN cards show "0 clients served", "$0.00 revenue", "0 services/day"

#### Scenario: Toggle to weekly

- GIVEN user clicks "This Week" toggle
- WHEN cards update
- THEN stats reflect week.clientsServed and week.revenue

### Requirement: Daily Service Bar Chart (FR-3)

`DailyServiceBarChart` organism MUST render a recharts `BarChart` showing daily service count. X-axis: dates. Y-axis: service count. Uses `dailyServices` array from API response.

On empty data, chart SHALL render with zero-height bars for each day in range.

#### Scenario: Chart with data

- GIVEN dailyServices: [{ date: "2026-07-24", count: 3 }, { date: "2026-07-25", count: 5 }, { date: "2026-07-26", count: 2 }]
- WHEN DashboardPage loads
- THEN bar chart shows 3 bars with heights 3, 5, 2

#### Scenario: Chart with no data

- GIVEN dailyServices: []
- WHEN DashboardPage loads
- THEN chart shows empty state with zero baseline

### Requirement: useDashboardStats Hook (FR-4)

`useDashboardStats()` hook MUST fetch `GET /api/v1/dashboard/stats` with timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone`. Exposes: `stats`, `loading`, `error`, `view` (today/week/month), `setView`.

Refetches when `view` changes or on manual retry after error.

#### Scenario: Initial fetch

- GIVEN user navigates to `/dashboard`
- WHEN component mounts
- THEN loading=true, stats=null; after fetch, loading=false, stats populated

#### Scenario: Error with retry

- GIVEN API returns 500
- WHEN hook fetches
- THEN error state set, "Retry" button rendered

### Requirement: API Storage Layer

`IStorage` interface MUST expose `getDashboardStats(timezone: string, period: string): Promise<DashboardStatsResponse>`. Calls `GET /api/v1/dashboard/stats?timezone={tz}` and returns parsed JSON.

### Requirement: Loading, Empty, Error States (FR-5)

DashboardPage MUST show spinner during fetch, zeros on empty data, error with retry on failure.

| State | Behavior |
|-------|----------|
| Loading | Spinner placeholder for cards and chart |
| Empty | Zeros across all cards, empty chart baseline |
| Error | Error message + "Retry" button |
| Success | KPI cards with data, bar chart rendered |

### Requirement: Out of Scope

- Chart drill-down or click interactivity
- Date range picker (hardcoded today/week/month)
- PDF or CSV export
- Revenue per service type breakdown
