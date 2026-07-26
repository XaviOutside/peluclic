# Design: Dashboard Page

## Technical Approach

New `api/dashboard/` bounded context pre-computes aggregated stats via MySQL `CONVERT_TZ()` queries with timezone supplied by the client (`Intl.DateTimeFormat().resolvedOptions().timeZone`). The Service model gains `clientId` + `performedAt` columns (backfilled from existing data). The frontend renders three KPI cards (today/week/month) and a 30-day bar chart via recharts, served by a `useDashboardStats` custom hook wired through the `IStorage` abstraction.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| `performedAt` vs reusing `createdAt` | `performedAt` (new column) / `createdAt` (existing) | `performedAt` | Semantic clarity — `createdAt` is the record timestamp; `performedAt` is when the service happened. Dashboard queries only use `performedAt`. |
| UTC conversion: MySQL vs app code | MySQL `CONVERT_TZ()` / JS `Date` math | MySQL `CONVERT_TZ()` | Single source of truth; leverages DB date functions; avoids timezone-edge-case bugs in app code |
| Chart library | recharts / chart.js / d3 | recharts | Lightest bundle (~40KB gzipped), React-native declarative API, no canvas DOM issues. Single `BarChart` with no interactivity — no over-engineering |
| API aggregation: pre-computed vs raw rows | Pre-aggregated `{ clientsServed, revenue, dailyServices }` / raw Service rows | Pre-aggregated | Reduces wire payload (~500B vs KBs of rows); frontend never does aggregation math |
| Empty state (zeros) | Repository returns 0 / repository returns null → use case defaults | Repository returns `0` | Zero is a valid business value. Simpler contract — no null checks at any layer |
| `clientId` on Service: nullable vs required | `clientId?` / `clientId` required | Optional (`INT?`) | Catalog-only services (no client context) must still work. Backfill defaults null for rows where `petId` is also null |

## Data Flow

```
Browser timezone (Intl API)
       │
       ▼
useDashboardStats hook ──GET /api/v1/dashboard/stats?timezone=America/Lima──▶
       │
       ▼
DashboardController.getStats()
       │
       ▼
GetDashboardStatsUseCase.execute(timezone)
       │
       ▼
PrismaDashboardRepository.findStats(timezone) ──$queryRaw──▶ MySQL
       │                                              CONVERT_TZ(performed_at, '+00:00', ?)
       ▼                                              COUNT(DISTINCT client_id), SUM(price)
DashboardStats entity ◀──────────────────────────────────────
       │
       ▼
toDashboardStatsDto(stats)
       │
       ▼
DashboardPage ◀── { today, week, month: { clientsServed, revenue }, dailyServices }
  ├─ KpiCard (today)   ◀── stats.today
  ├─ KpiCard (week)    ◀── stats.week
  ├─ KpiCard (month)   ◀── stats.month
  └─ DailyServiceBarChart ◀── stats.dailyServices (recharts BarChart)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `clientId Int?`, `performedAt DateTime @default(now())`, composite index `@@index([clientId, performedAt])` to Service model |
| `prisma/migrations/*_add_service_dashboard_fields` | Create | Migration: add columns, backfill `clientId` from `pet→client`, backfill `performedAt` from `createdAt`, add index |
| `prisma/seed.ts` | Modify | Add `clientId`/`performedAt` to seed service records |
| `api/services/domain/Service.ts` | Modify | Add `clientId`/`performedAt` to `Service`, `CreateServiceInput`, `UpdateServiceInput` |
| `api/services/interface/dtos/CreateServiceDto.ts` | Modify | Add optional `clientId?`, `performedAt?` fields |
| `api/services/interface/dtos/UpdateServiceDto.ts` | Modify | Add optional `clientId?`, `performedAt?` fields |
| `api/services/interface/ServiceController.ts` | Modify | Map `clientId`/`performedAt` in create/update methods |
| `api/services/infrastructure/PrismaServiceRepository.ts` | Modify | Include `clientId`/`performedAt` in create, update, `mapToService`, search raw-query |
| `api/services/interface/dtos/ServiceResponseDto.ts` | Modify | Add `clientId`/`performedAt` to DTO and mapper |
| `api/clients/domain/IClientRepository.ts` | Modify | Add `updateLastServiceDate(clientId, date): Promise<void>` |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modify | Implement `updateLastServiceDate` |
| `api/clients/application/CreateClientUseCase.ts` | Modify | (or CreateServiceUseCase) — call `updateLastServiceDate` after service creation with `clientId` |
| `api/dashboard/domain/DashboardStats.ts` | Create | Entity: `DashboardPeriodStats { clientsServed, revenue }`, `DailyService { date, count, revenue }`, `DashboardStats { today, week, month, dailyServices }` |
| `api/dashboard/domain/IDashboardRepository.ts` | Create | Interface: `findStats(timezone: string): Promise<DashboardStats>` |
| `api/dashboard/application/GetDashboardStatsUseCase.ts` | Create | Use case: validates timezone → calls repository → returns DashboardStats |
| `api/dashboard/infrastructure/PrismaDashboardRepository.ts` | Create | `$queryRaw` with 3 queries (today/week/month) + daily breakdown, all parameterized |
| `api/dashboard/interface/DashboardController.ts` | Create | Controller: `getStats(req, res)` — validates timezone param, calls use case, returns DTO |
| `api/dashboard/interface/dashboardRouter.ts` | Create | Router: `GET /stats` → controller |
| `api/dashboard/interface/dtos/DashboardStatsDto.ts` | Create | Response DTO and `toDashboardStatsDto()` mapper |
| `api/index.ts` | Modify | Wire dashboard context: `app.use('/api/v1/dashboard', createDashboardRouter(controller))` |
| `src/types/dashboard.ts` | Create | Frontend types: `DashboardStats`, `DashboardPeriod`, `DailyService` |
| `src/hooks/useDashboardStats.ts` | Create | Custom hook: fetches stats with `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| `src/pages/DashboardPage.tsx` | Create | Page component: renders 3 KpiCards + DailyServiceBarChart |
| `src/components/molecules/KpiCard.tsx` | Create | KPI display: icon + label ("Hoy") + formatted value ("3 clientes" / "$125.00") |
| `src/components/organisms/DailyServiceBarChart.tsx` | Create | Recharts `BarChart`: X=date, Y=count, optional revenue overlay |
| `src/storage/IStorage.ts` | Modify | Add `getDashboardStats(timezone: string): Promise<DashboardStats>` |
| `src/storage/ApiStorage.ts` | Modify | Implement `getDashboardStats` via `http()` |
| `src/storage/LocalStorage.ts` | Modify | Implement `getDashboardStats` returning empty/zero stats |
| `src/test-utils/mockStorage.ts` | Modify | Add `getDashboardStats` mock |
| `src/components/molecules/ServiceForm.tsx` | Modify | Add client autocomplete + performedAt DateTimePicker (both optional) |
| `src/utils/validation.ts` | Modify | Add `clientId?` and `performedAt?` to `ServiceFormData` (no required validation) |
| `src/types/service.ts` | Modify | Add `clientId?` and `performedAt?` to `CreateServiceInput` |
| `src/App.tsx` | Modify | Add `<Route path="/dashboard" element={<DashboardPage />} />` |
| `src/components/organisms/Sidebar.tsx` | Modify | Change Dashboard `to` from `"/"` to `"/dashboard"` |
| `src/components/organisms/MobileNav.tsx` | Modify | Change Dashboard `to` from `"/"` to `"/dashboard"` |
| `src/locales/en/dashboard.json` | Create | i18n namespace: labels, KPIs, chart |
| `src/locales/es/dashboard.json` | Create | i18n namespace (Spanish) |

## Interfaces / Contracts

**GET /api/v1/dashboard/stats?timezone=America/Lima**

Response (200):
```typescript
{
  today: { clientsServed: number; revenue: number },   // integer cents
  week:  { clientsServed: number; revenue: number },
  month: { clientsServed: number; revenue: number },
  dailyServices: Array<{
    date: string;      // "YYYY-MM-DD" in requested timezone
    count: number;
    revenue: number;   // integer cents
  }>
}
```

Errors:
- `400` — missing or empty `timezone` param
- `500` — `CONVERT_TZ` returns NULL (timezone tables not loaded, or invalid timezone string)

**Query pattern** (PrismaDashboardRepository uses `$queryRaw` with tagged template — parameterized):
```sql
-- Today
SELECT COUNT(DISTINCT client_id) AS clients, COALESCE(SUM(price), 0) AS revenue
FROM services
WHERE performed_at >= CONVERT_TZ(CURDATE(), ?, '+00:00')
  AND performed_at < CONVERT_TZ(CURDATE() + INTERVAL 1 DAY, ?, '+00:00')
  AND deleted_at IS NULL;
```

**`IStorage.getDashboardStats(timezone: string): Promise<DashboardStats>`** — new method on storage interface. `ApiStorage` calls `GET /api/v1/dashboard/stats?timezone=...`. `LocalStorage` returns `{ today: { clientsServed:0, revenue:0 }, week: {...}, month: {...}, dailyServices: [] }`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — domain | `DashboardStats` entity, `GetDashboardStatsUseCase` | Vitest: use case with mock repository (returns sample stats) |
| Unit — controller | `DashboardController.getStats` — valid/invalid timezone | Vitest: mock req/res, assert status codes |
| Integration | `PrismaDashboardRepository.findStats` — real DB | Vitest integration: seed services with known `performedAt` dates, verify aggregate numbers |
| Unit — hook | `useDashboardStats` — loading/error/data states | Vitest + @testing-library/react-hooks: mock ApiStorage |
| Unit — components | `KpiCard`, `DailyServiceBarChart`, `DashboardPage` | Vitest + @testing-library/react: snapshot + value rendering |
| E2E | Dashboard loads, shows KPIs, bar chart renders | Playwright: navigate to `/dashboard`, assert card values present |

## Threat Matrix

**N/A** — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The `timezone` query parameter is passed to `$queryRaw` via tagged template (parameterized — SQL injection impossible). `CONVERT_TZ` returns `NULL` for invalid timezone strings — safe failure mode (repository returns zeros).

## Migration / Rollout

1. Prisma migration adds nullable `client_id INT` and `performed_at DATETIME NOT NULL DEFAULT NOW()` columns plus composite index
2. Backfill SQL runs in migration: `client_id` ← `pets.client_id` (via `pet_id` join); `performed_at` ← `created_at` for rows where null
3. `recharts` npm dependency must be installed: `npm install recharts`
4. Rollback: revert migration (drop columns), remove dashboard router from `api/index.ts`, remove `/dashboard` route, revert sidebar link

## Open Questions

- [ ] Is `recharts` the agreed charting library? (`package.json` currently has no charting dep — need explicit approval before `npm install recharts`)
