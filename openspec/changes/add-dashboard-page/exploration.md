## Exploration: Relate Service directly to Client for Dashboard

### Current State

**Service model is a CATALOG with optional pet link.** The `services` table stores reusable service types (name, description, durationMinutes, price). It also has a nullable `petId` column for linking to a specific pet, but this is not exposed in the create form — services are created as pure catalog entries. There is no `clientId`, no `performedAt`/`performedDate`, and no way to track WHEN a service was performed for whom.

**Client model** already has `lastServiceDate: DateTime? @db.Date` (added in a prior SDD cycle for the client listing), but it is read-only — no mechanism currently populates it. The archive report for the client-listing-enhancements change explicitly noted: "lastServiceDate population: All values start as NULL. Population mechanism (from appointments) is deferred to a follow-up SDD change." This change IS that follow-up.

**Dashboard does not exist.** The sidebar has a `navigation.dashboard` entry pointing to `/`, but `/` routes to `LandingPage` (public layout, no sidebar). The `DashboardLayout` in `App.tsx` has no `/` route at all. There are no aggregate/stats API endpoints anywhere in the codebase. No `GROUP BY`, `SUM`, or `COUNT` queries exist.

### Affected Areas

#### Backend — Clean Architecture (all layers)
- `prisma/schema.prisma` — Service model: add `clientId Int` + `performedAt DateTime`; add index on `clientId` + `performedAt` for dashboard queries
- `api/services/domain/Service.ts` — domain entity + `CreateServiceInput` / `UpdateServiceInput`: add `clientId` and `performedDate` fields
- `api/services/domain/IServiceRepository.ts` — add `findDashboardStats(clientId)` aggregate method
- `api/services/infrastructure/PrismaServiceRepository.ts` — implement aggregate queries + map new fields
- `api/services/interface/dtos/CreateServiceDto.ts` — add `clientId` and `performedDate`
- `api/services/interface/dtos/UpdateServiceDto.ts` — add `clientId` (no performedDate — service date is immutable)
- `api/services/interface/dtos/ServiceResponseDto.ts` — add `clientId` and `performedDate` to response + mapper
- `api/services/interface/ServiceController.ts` — pass through `clientId`, `performedDate` in create
- `api/services/application/CreateService.ts` — validate `clientId` refers to an active client, `performedDate` is not in the future
- **NEW:** `api/services/application/GetDashboardStats.ts` — dashboard use case
- **NEW:** `api/services/interface/DashboardController.ts` — dashboard controller
- **NEW:** `api/services/interface/dashboardRouter.ts` — `GET /api/v1/dashboard/stats`
- `api/index.ts` — wire dashboard controller + router
- `api/clients/domain/IClientRepository.ts` — add `updateLastServiceDate(clientId, date)` method
- `api/clients/infrastructure/PrismaClientRepository.ts` — implement `updateLastServiceDate`
- `api/services/application/CreateService.ts` — after creating service, call `clientRepository.updateLastServiceDate(clientId, performedDate)` to update `Client.lastServiceDate`

#### Frontend
- **NEW:** `src/pages/DashboardPage.tsx` — KPI cards (clients served, revenue, services/day) for today/week/month
- **NEW:** `src/components/organisms/KpiCard.tsx` — reusable KPI card component
- **NEW:** `src/components/molecules/KpiGrid.tsx` — grid layout for KPI cards
- `src/App.tsx` — add `<Route path="/" element={<DashboardPage />} />` inside `DashboardLayout`
- `src/types/service.ts` — add `clientId: number | null`, `performedDate: string | null` to `Service` + `CreateServiceInput`
- **NEW:** `src/types/dashboard.ts` — `DashboardStats` type (`clientsServed`, `revenue`, `servicesPerDay`)
- **NEW:** `src/services/dashboard.ts` — `getDashboardStats()` API client
- **NEW:** `src/hooks/useDashboard.ts` — data fetching hook
- `src/services/service.ts` — pass through `clientId`, `performedDate` in `createService`
- `src/pages/ServiceCreatePage.tsx` — add quick client autocomplete (select client when creating a service)
- `src/components/molecules/ServiceForm.tsx` — add `clientId` dropdown + `performedDate` date picker
- `src/locales/en/dashboard.json` — new namespace
- `src/locales/es/dashboard.json` — new namespace
- `src/locales/en/common.json` — update `navigation.dashboard`
- `src/locales/es/common.json` — update

### Approaches

1. **Service as instance: add `clientId` + `performedAt` to the Service model**
   - New columns on `services` table: `client_id INT` (NOT NULL for performed services, NULL for catalog), `performed_at DATETIME` (the date the service was performed). Existing catalog services retain NULL for both. A service row with both non-null represents "Haircut $25 performed for Client #7 on July 26, 2026."
   - Pros: Minimal schema change (2 new columns on existing table); reuses entire existing Service CRUD pipeline; dashboard queries are straightforward (`SELECT COUNT(DISTINCT client_id), SUM(price) FROM services WHERE performed_at BETWEEN ... AND deleted_at IS NULL`); naturally updates `Client.lastServiceDate` on create.
   - Cons: Blurs catalog/instance distinction in one table (though `petId` already sets this precedent); `createdAt` ≠ `performedAt` (two timestamps can be confusing but necessary — services may be entered after the fact).
   - Effort: Medium (~800–1200 lines, ~45 files)

2. **New ServiceRecord table (catalog stays clean)**
   - New `service_records` table: `id`, `serviceId`, `clientId`, `performedAt`, `price` (snapshot), `createdAt`. Services table stays catalog-only. Each performed service creates a ServiceRecord row.
   - Pros: Clean separation of concerns; catalog stays immutable; no bloat on the services table; price snapshots prevent retrospective price changes from affecting historical revenue.
   - Cons: Entirely new bounded context (new domain, application, interface, infrastructure layers); new API routes, hooks, types; dual write on service performance (create ServiceRecord + update Client.lastServiceDate); more complex dashboard queries (JOIN service_records + services).
   - Effort: High (~55+ files, ~1500 lines)

3. **Add `clientId` only, use `createdAt` as `performedAt`**
   - Just add `clientId` to the Service model. Assume `createdAt` IS the performed date.
   - Pros: Simplest — 1 new column, no new timestamp; fewer DTO changes.
   - Cons: Conflates record creation with service date — a service entered retroactively on Tuesday for a Monday appointment would have wrong data; `createdAt` auto-populates at insert time, making it hard to set intentionally; breaks the "created at vs. performed at" distinction that's valuable for auditing.
   - Effort: Low-Medium — but WRONG for the use case. **NOT recommended.**

### Recommendation

**Approach 1 — add `clientId` + `performedAt` to the Service model.**

This is the right balance. The Service model already has `petId` as an optional relationship — it was designed to be flexible. Adding `clientId` and `performedAt` follows the same pattern without requiring a new table or bounded context.

The key architectural decision is: **Service becomes both catalog AND instance in one table, distinguished by whether `clientId`/`performedAt` are NULL.** This mirrors what `petId` already does.

To keep `Client.lastServiceDate` updated, the `CreateServiceUseCase` will receive the `IClientRepository` as a dependency and call `updateLastServiceDate(clientId, performedAt)` after a successful service creation (when `clientId` is not null). This completes the deferred TODO from the client-listing-enhancements archive.

For the dashboard, the aggregate query looks like:
```sql
-- Clients served today
SELECT COUNT(DISTINCT client_id) FROM services 
WHERE performed_at >= CURDATE() AND deleted_at IS NULL AND client_id IS NOT NULL

-- Revenue today
SELECT COALESCE(SUM(price), 0) FROM services 
WHERE performed_at >= CURDATE() AND deleted_at IS NULL AND client_id IS NOT NULL

-- Services performed per day (last 7 days)
SELECT DATE(performed_at) as day, COUNT(*) as count, SUM(price) as revenue
FROM services 
WHERE performed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
  AND deleted_at IS NULL AND client_id IS NOT NULL
GROUP BY DATE(performed_at)
```

### Architecture: Single change or chained?

**Chained PRs recommended.** The scope exceeds 400 lines. Three chained PR slices:

1. **PR #1 — Schema migration + backend domain/repo/DTO changes** (~300 lines): Prisma schema migration, domain entity fields, repository map + aggregate queries, CreateServiceDto + ServiceResponseDto updates, CreateService use case validation (+ clientId existence check), ClientRepository.updateLastServiceDate. Pure backend, no new endpoints.

2. **PR #2 — Dashboard API endpoint** (~250 lines): New `GET /api/v1/dashboard/stats` endpoint with aggregate use case, controller, router, DTOs. Wire in `api/index.ts`. Pure backend.

3. **PR #3 — Frontend dashboard page + service form updates** (~500 lines, borderline — may split further): DashboardPage + KpiCard + KpiGrid components, useDashboard hook, dashboard API client, App.tsx route, i18n, ServiceForm clientId/performedDate fields. Frontend-only.

### Risks

- **`createdAt` vs `performedAt` confusion**: Two timestamps on the same row. Must be clearly documented (and named distinctly — `performedAt`, NOT `serviceDate`) so future developers understand the difference.
- **`Client.lastServiceDate` consistency**: If a service is soft-deleted, should `lastServiceDate` be recalculated? The simplest approach: update on create only. If the highest service is deleted, the date stays until a new service is performed (acceptable for an MVP dashboard).
- **Dashboard performance at scale**: Raw aggregate queries on `services` table. For thousands of services this is fine. For tens of thousands, add a composite index on `(client_id, performed_at)` where `deleted_at IS NULL`. The Prisma schema already supports adding indexes.
- **Retroactive service entry**: If a groomer enters Monday's services on Tuesday, `performedAt` will be Monday (correct) but `updatedAt` will be Tuesday. The dashboard should use `performedAt` for all time-based queries, NEVER `createdAt` or `updatedAt`.
- **`clientId` NULL semantics**: Existing services without `clientId` (catalog entries) must be excluded from all dashboard queries. The aggregate queries MUST include `WHERE client_id IS NOT NULL`.
- **Breaking change to existing service creation**: The frontend form adds new fields but they should NOT be required (client selection should be optional to preserve the catalog-only workflow). If a service is created without `clientId`, it remains a catalog entry.

### Ready for Proposal
**Yes.** The investigation is complete and the approach is clear. The orchestrator should proceed to `sdd-propose` with the recommendation of Approach 1, chained into 3 PRs. The key point to clarify with the user: **Service creation will add client selection + performed date fields (optional — catalog-only creation still works), and `Client.lastServiceDate` will auto-update when a service is performed.**
