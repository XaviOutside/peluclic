# Proposal: Dashboard Page

## Intent

The business has no visibility into daily operations — how many clients served, revenue collected, or service volume trends. This change delivers a `/dashboard` page showing real metrics so the owner can track performance without manual tallying.

## Scope

### In Scope
- Add `client_id INT` + `performed_at DATETIME` to Service model (migration + backfill)
- New `api/dashboard/` bounded context: `GET /api/v1/dashboard/stats?timezone=-05:00`
- Dashboard page: 3 KPI cards (clients served, revenue, services/day) + daily bar chart
- ServiceForm: add client dropdown + performedAt date picker (optional fields)
- Fix sidebar "Dashboard" link → `/dashboard` (currently points to `/`)
- `Client.lastServiceDate` auto-update on service creation

### Out of Scope
- Appointment integration (zero changes to Appointment model)
- Revenue breakdown by service type (aggregate only)
- Chart drill-down or interactivity
- PDF export or reporting
- "Record Service" from client detail page (deferred)

## Product Decisions

| Decision | Rationale |
|----------|-----------|
| Timezone: client-side → `?timezone=-05:00` → `CONVERT_TZ()` | "Today" must match the groomer's local day, not UTC |
| Empty state: show zeros (`0 clients`, `$0.00`) | Data-first, no fake-emptiness banners |
| Revenue: aggregate `SUM(price)` only | Simpler API; per-type breakdown can be added later |
| Daily services: bar chart (recharts) | Visual overview beats table for trend spotting |
| ServiceForm: add client + date fields | Catalog-only still works (fields optional) |

## Capabilities

### New Capabilities
- `dashboard-api`: `GET /api/v1/dashboard/stats` — aggregate queries with timezone conversion, returns clients-served/revenue/daily-breakdown
- `dashboard-frontend`: DashboardPage, KpiCard, DailyServiceBarChart, useDashboardStats hook

### Modified Capabilities
- `services-api-backend`: add `clientId` + `performedAt` fields to Service domain/DTOs/repo; add `findDashboardStats()` aggregate method; validate `clientId` existence on create
- `services-api-frontend`: ServiceForm gains client autocomplete + performedAt DateTimePicker (both optional)

## Approach

3 chained PRs, ~400 lines each.

**Backend:** New `api/dashboard/` bounded context (domain → application → interface → infrastructure). `GET /api/v1/dashboard/stats?timezone=-05:00` returns `{ today, week, month: { clientsServed, revenue }, dailyServices: [{ date, count, revenue }] }`. Aggregate queries use `COUNT(DISTINCT client_id)`, `SUM(price)`, `GROUP BY DATE(CONVERT_TZ(performed_at, '+00:00', ?))`.

**Frontend:** `DashboardPage` at `/dashboard` — 3 `KpiCard` molecules (today/week/month toggle), `DailyServiceBarChart` organism (recharts `BarChart`), `useDashboardStats` hook sending `Intl.DateTimeFormat().resolvedOptions().timeZone`.

**Form changes:** `ServiceForm` adds `clientId` (autocomplete from client list) + `performedAt` (date picker, defaults to today). Both optional — catalog creation still works.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `clientId Int?`, `performedAt DateTime`, composite index |
| `api/services/` (all layers) | Modified | Domain entity, DTOs, repo, use cases |
| `api/dashboard/` (all layers) | **New** | Dashboard bounded context |
| `api/clients/` (domain + infra) | Modified | `updateLastServiceDate()` method |
| `src/pages/DashboardPage.tsx` | **New** | Dashboard route target |
| `src/components/molecules/KpiCard.tsx` | **New** | KPI display molecule |
| `src/components/organisms/DailyServiceBarChart.tsx` | **New** | Recharts bar chart |
| `src/components/molecules/ServiceForm.tsx` | Modified | Add client selector + date picker |
| `src/App.tsx` | Modified | Add `/dashboard` route; fix sidebar link |
| `src/locales/{en,es}/dashboard.json` | **New** | i18n namespace |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `CONVERT_TZ` fails if MySQL timezone tables not loaded | Low | Document requirement; fallback to UTC if tz missing |
| `createdAt` vs `performedAt` confusion | Med | Name distinctly; doc that dashboard queries ONLY `performedAt` |
| `lastServiceDate` stale on service delete | Low | Accept for MVP — recalc only on new service creation |
| Bar chart over-engineering for MVP | Low | Recharts minimal integration; single `BarChart`, no interactivity |

## Rollback Plan

1. Revert Prisma migration (remove `client_id`, `performed_at` columns)
2. Remove `api/dashboard/` router from `api/index.ts`
3. Remove `/dashboard` route from `App.tsx`
4. Revert sidebar link to `/`
5. Revert ServiceForm fields

## Dependencies

- `recharts` npm package (frontend charting library)
- MySQL `timezone` tables loaded (`mysql_tzinfo_to_sql`) for `CONVERT_TZ()`

## Success Criteria

- [ ] Dashboard at `/dashboard` shows KPIs (clients served, revenue) for today/week/month
- [ ] Daily bar chart renders services per day in client's local timezone
- [ ] Zero-state: cards show `0` / `$0.00` when no services exist
- [ ] ServiceForm accepts optional client + performedAt fields
- [ ] Sidebar "Dashboard" link navigates to `/dashboard`
- [ ] `Client.lastServiceDate` updates when service created with `clientId`
- [ ] All SDLC gates pass (lint, build, test, Snyk)
