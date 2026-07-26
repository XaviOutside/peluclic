# Tasks: Dashboard Page

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1050–1200 (3 slices × ~350–400) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Service model migration: clientId + performedAt columns, domain, DTOs, repo, seed | PR 1 | `npm test -- api/services` | `docker compose exec api npm run migrate` — verify columns exist | Revert migration + drop columns; restore entity/DTO/repo to prior state |
| 2 | Dashboard API bounded context: stats endpoint with timezone-aware aggregates | PR 2 | `npm test -- api/dashboard && npm run test:integration -- api/dashboard` | `curl "http://localhost:3000/api/v1/dashboard/stats?timezone=-05:00"` → 200 JSON | Remove `api/dashboard/` dir + router wire from `api/index.ts` |
| 3 | Dashboard frontend: page, KPI cards, bar chart, hook, i18n, sidebar fix, E2E | PR 3 | `npm run test:frontend -- src/pages/DashboardPage && npx playwright test -- dashboard` | Navigate to `/dashboard` — KPI cards + chart render | Remove `/dashboard` route, page, components, hook, storage method; revert sidebar link |

---

## PR 1 — Service Model Migration

### Phase 1: RED — Prisma Schema & Migration

- [ ] **T1.1** RED: Write migration test verifying `clientId`, `performedAt` columns exist after migrate
- [ ] **T1.2** GREEN: Add `clientId Int?`, `performedAt DateTime @default(now())`, composite index `@@index([clientId, performedAt])` to Service model in `prisma/schema.prisma`
- [ ] **T1.3** GREEN: Create migration `*_add_service_dashboard_fields`: add columns, backfill `performedAt = createdAt`, create index. Include `ALTER TABLE services ADD COLUMN client_id INT` + `ADD COLUMN performed_at DATETIME NOT NULL DEFAULT NOW()`
- [ ] **T1.4** REFACTOR: Verify migration runs clean; confirm `npm run build` passes

### Phase 2: RED — Domain + DTO Changes

- [ ] **T2.1** RED: Write failing unit test for Service entity with `clientId=3`, `performedAt=new Date("2026-07-26")` — `api/services/domain/Service.test.ts`
- [ ] **T2.2** GREEN: Add `clientId: number | null`, `performedAt: Date` to `Service`, `CreateServiceInput`, `UpdateServiceInput` in `api/services/domain/Service.ts`
- [ ] **T2.3** RED: Write failing DTO test for `CreateServiceDto` with `clientId=3`, `performedAt` string → `api/services/interface/dtos/__tests__/` or existing test file
- [ ] **T2.4** GREEN: Add optional `clientId?`, `performedAt?` to `CreateServiceDto`, `UpdateServiceDto`, `ServiceResponseDto` in `api/services/interface/dtos/`. Update mapper in `ServiceResponseDto.ts`
- [ ] **T2.5** REFACTOR: Verify all existing service tests still pass; update snapshot tests for new fields

### Phase 3: GREEN — Repository + Use Case + Seed

- [ ] **T3.1** RED: Write integration test — create service with `clientId=3`, `performedAt="2026-07-26T10:00:00Z"`, verify row in DB — `api/services/infrastructure/PrismaServiceRepository.integration.test.ts`
- [ ] **T3.2** GREEN: Update `PrismaServiceRepository.create()` and `mapToService()` to include `clientId`/`performedAt` in `api/services/infrastructure/PrismaServiceRepository.ts`
- [ ] **T3.3** GREEN: Update `ServiceController.create()`/`update()` to map new fields in `api/services/interface/ServiceController.ts`
- [ ] **T3.4** RED: Write failing test — `IClientRepository.updateLastServiceDate(clientId, date)` — `api/clients/domain/IClientRepository.ts`
- [ ] **T3.5** GREEN: Add `updateLastServiceDate(clientId, date)` to `IClientRepository` interface + implement in `PrismaClientRepository`
- [ ] **T3.6** GREEN: Call `clientRepository.updateLastServiceDate()` from `CreateServiceUseCase` when `clientId` provided — `api/services/application/CreateService.ts`
- [ ] **T3.7** GREEN: Run `CreateServiceUseCase` test — verify `updateLastServiceDate` called when `clientId` present, not called when absent
- [ ] **T3.8** REFACTOR: Update seed data in `prisma/seed.ts` — add `clientId`/`performedAt` to sample service records
- [ ] **T3.9** REFACTOR: Update search raw-query in PrismaServiceRepository to include `performed_at` in SELECT

---

## PR 2 — Dashboard API

### Phase 4: RED — Domain Layer

- [ ] **T4.1** RED: Write failing domain test — `DashboardStats` entity with `today`, `week`, `month` periods + `dailyServices` array — `api/dashboard/domain/DashboardStats.test.ts`
- [ ] **T4.2** GREEN: Create `api/dashboard/domain/DashboardStats.ts` — `DashboardPeriodStats`, `DailyService`, `DashboardStats` types. Revenue in cents, exposed as dollars via mapper
- [ ] **T4.3** GREEN: Create `api/dashboard/domain/IDashboardRepository.ts` — `findStats(timezone: string): Promise<DashboardStats>`

### Phase 5: RED — Application Layer

- [ ] **T5.1** RED: Write failing use-case test — `GetDashboardStatsUseCase` with mock repo returning sample stats — `api/dashboard/application/GetDashboardStatsUseCase.test.ts`
- [ ] **T5.2** GREEN: Create `GetDashboardStatsUseCase` — validates timezone format (regex `[+-]\\d{2}:\\d{2}`), calls repo, returns DashboardStats — `api/dashboard/application/GetDashboardStatsUseCase.ts`
- [ ] **T5.3** REFACTOR: Confirm use case rejects invalid timezone with domain error; empty result returns zeros

### Phase 6: GREEN — Infrastructure + Interface

- [ ] **T6.1** RED: Write integration test — `PrismaDashboardRepository.findStats()` with known seed data, verify aggregate counts — `api/dashboard/infrastructure/PrismaDashboardRepository.integration.test.ts`
- [ ] **T6.2** GREEN: Create `PrismaDashboardRepository` — 4 parameterized `$queryRaw` queries (today/week/month aggregates + daily breakdown) using `CONVERT_TZ` + `COUNT(DISTINCT client_id)` + `SUM(price)` — `api/dashboard/infrastructure/PrismaDashboardRepository.ts`
- [ ] **T6.3** RED: Write controller test — `GET /stats` returns 200 with valid timezone, 422 for invalid, 500 on DB error — `api/dashboard/interface/DashboardController.test.ts`
- [ ] **T6.4** GREEN: Create `DashboardController.getStats()` — parse `timezone` param, call use case, return DTO — `api/dashboard/interface/DashboardController.ts`
- [ ] **T6.5** GREEN: Create `DashboardStatsDto` + `toDashboardStatsDto()` mapper (cents→dollars, dailyServices as array) — `api/dashboard/interface/dtos/DashboardStatsDto.ts`
- [ ] **T6.6** GREEN: Create `dashboardRouter.ts` — `GET /stats` → controller — `api/dashboard/interface/dashboardRouter.ts`
- [ ] **T6.7** GREEN: Wire dashboard context in `api/index.ts` — `const dashboardRepository = new PrismaDashboardRepository()`, create router, mount `app.use('/api/v1/dashboard', dashboardRouter)`

---

## PR 3 — Dashboard Frontend + ServiceForm + E2E

### Phase 7: RED — Types + Storage + Hook

- [ ] **T7.1** RED: Write failing storage test — `ApiStorage.getDashboardStats()` returns `DashboardStats` — `src/storage/ApiStorage.test.ts`
- [ ] **T7.2** GREEN: Add `getDashboardStats(timezone: string): Promise<DashboardStats>` to `IStorage` interface — `src/storage/IStorage.ts`
- [ ] **T7.3** GREEN: Implement `ApiStorage.getDashboardStats()` — fetch `GET /api/v1/dashboard/stats?timezone=...` — `src/storage/ApiStorage.ts`
- [ ] **T7.4** GREEN: Implement `LocalStorage.getDashboardStats()` — return zero stats — `src/storage/LocalStorage.ts`
- [ ] **T7.5** GREEN: Add `getDashboardStats` mock to test utilities — `src/test-utils/mockStorage.ts`
- [ ] **T7.6** GREEN: Create `src/types/dashboard.ts` — `DashboardStats`, `DashboardPeriod`, `DailyService` types
- [ ] **T7.7** RED: Write failing hook test — `useDashboardStats` loading/error/data states — `src/hooks/useDashboardStats.test.ts`
- [ ] **T7.8** GREEN: Create `useDashboardStats` hook — fetch with `Intl.DateTimeFormat().resolvedOptions().timeZone`, expose `stats`, `loading`, `error`, `view`, `setView` — `src/hooks/useDashboardStats.ts`

### Phase 8: RED → GREEN — Components

- [ ] **T8.1** RED: Write failing KpiCard test — renders label + value + period toggle (today/week/month) — `src/components/molecules/KpiCard.test.tsx`
- [ ] **T8.2** GREEN: Create `KpiCard` molecule — icon, period label, formatted value (`0 clients`, `$0.00`), zero-state — `src/components/molecules/KpiCard.tsx`
- [ ] **T8.3** RED: Write failing bar chart test — renders bars for `dailyServices` array, empty state — `src/components/organisms/DailyServiceBarChart.test.tsx`
- [ ] **T8.4** GREEN: Create `DailyServiceBarChart` organism — recharts `BarChart`, X=date, Y=count, empty state baseline — `src/components/organisms/DailyServiceBarChart.tsx`. Install `recharts`: `npm install recharts`

### Phase 9: GREEN — Page + Routing + i18n + ServiceForm

- [ ] **T9.1** RED: Write failing page test — DashboardPage renders 3 KpiCards + chart in loading/empty/error states — `src/pages/DashboardPage.test.tsx`
- [ ] **T9.2** GREEN: Create `DashboardPage` — uses `useDashboardStats`, renders KpiCard × 3 + DailyServiceBarChart + loading spinner + error retry — `src/pages/DashboardPage.tsx`
- [ ] **T9.3** GREEN: Create i18n namespaces `src/locales/en/dashboard.json` + `src/locales/es/dashboard.json` — labels, period names, chart axis
- [ ] **T9.4** GREEN: Add `/dashboard` route to `src/App.tsx` — `<Route path="/dashboard" element={<DashboardPage />} />`
- [ ] **T9.5** GREEN: Fix sidebar Dashboard link to `/dashboard` in `src/components/organisms/Sidebar.tsx` + `src/components/organisms/MobileNav.tsx`
- [ ] **T9.6** GREEN: Update `ServiceForm` — add client autocomplete (uses `searchClients`, 300ms debounce) + `performedAt` date picker (defaults today, optional) — `src/components/molecules/ServiceForm.tsx`
- [ ] **T9.7** GREEN: Update `src/types/service.ts` — add `clientId?`, `performedAt?` to `CreateServiceInput`
- [ ] **T9.8** REFACTOR: Update `useServices` hook tests — verify `searchClients` exposed, `createService` accepts new fields — `src/hooks/useServices.test.ts`

### Phase 10: E2E

- [ ] **T10.1** GREEN: Write E2E test — navigate to `/dashboard`, assert KPIs render (including zeros), bar chart visible — `e2e/dashboard.spec.ts`
- [ ] **T10.2** GREEN: Write E2E test — create service with client + performedAt via ServiceForm, verify dashboard reflects new data
- [ ] **T10.3** E2E: Write E2E test — sidebar Dashboard link navigates to `/dashboard`

### Phase 11: Gate

- [ ] **T11.1** QA: Run `npm run gate` — confirm lint + build + all tests pass
- [ ] **T11.2** QA: Verify `recharts` in `package.json`; confirm no type errors in strict mode
