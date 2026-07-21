# Tasks: Demo Mode with localStorage

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1300 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----|----------------------|-----------------|-------------------|
| 1 | IStorage + ApiStorage + mode detection + context | PR 1 | `npm run test:frontend` | `npm run build` | Delete `src/storage/` |
| 2 | LocalStorage — clients + pets + shared helpers | PR 2 | `npm run test:frontend -- src/storage/LocalStorage.test.ts` | `npm run test:frontend` | Revert client/pet methods |
| 3 | LocalStorage — services + appointments + settings | PR 3 | `npm run test:frontend -- src/storage/LocalStorage.test.ts` | `npm run test:frontend && npm run build` | Revert remaining LocalStorage methods |
| 4 | Wiring: 5 services + App + main + LandingPage | PR 4 | `npm run test:frontend && npm run build` | `npm run dev` → click Try Demo → verify CRUD | Revert 5 service files, App.tsx, main.tsx, LandingPage.tsx |

## Phase 1: Storage Contract & ApiStorage

- [x] 1.1 [RED] Write type-level contract: verify IStorage compiles with 30 signatures matching service exports
- [x] 1.2 [GREEN] Create `src/storage/IStorage.ts` — typed interface (8 clients, 7 pets, 7 services, 5 appointments, 3 settings)
- [x] 1.3 [RED] Write `ApiStorage.test.ts` — mock http(), verify each method delegates correct args per domain
- [x] 1.4 [GREEN] Create `src/storage/ApiStorage.ts` — wraps http() calls, 1:1 mapping to IStorage

## Phase 2: Mode Detection & Context

- [x] 2.1 [RED] Write `useStorageMode.test.ts` — null→demo transition, persistence, SecurityError fallback
- [x] 2.2 [GREEN] Create `src/storage/useStorageMode.ts` — exports { mode, setMode, isResolved }
- [x] 2.3 [RED] Write `storageContext.test.ts` — provider resolves LocalStorage vs ApiStorage based on pf_demo:mode
- [x] 2.4 [GREEN] Create `src/storage/storageContext.tsx` — StorageModeProvider + useStorage() + getStorage()

## Phase 3: LocalStorage — Clients & Pets

- [x] 3.1 [RED] Write client tests: CRUD, search (includes), pagination, soft delete, reactivate/deactivate, JSON corruption
- [x] 3.2 [GREEN] Implement LocalStorage: read/save helpers, nextIds generation, all 8 client methods
- [x] 3.3 [RED] Write pet tests: CRUD, search, pagination, soft delete, deactivate
- [x] 3.4 [GREEN] Implement LocalStorage: all 7 pet methods
- [x] 3.5 tsc + test: LocalStorage satisfies IStorage for clients+pets

## Phase 4: LocalStorage — Services, Appointments & Settings

- [x] 4.1 [RED] Write service tests: CRUD, search, pagination, deactivate
- [x] 4.2 [GREEN] Implement LocalStorage: all 7 service methods
- [x] 4.3 [RED] Write appointment tests: date-range list, CRUD, cancel
- [x] 4.4 [GREEN] Implement LocalStorage: all 5 appointment methods
- [x] 4.5 [RED] Write settings tests: singleton get/update, corruption fallback
- [x] 4.6 [GREEN] Implement LocalStorage: all 3 settings methods
- [x] 4.7 tsc + test: full LocalStorage satisfies IStorage, all new tests green

## Phase 5: Service File Migration

- [x] 5.1 Update existing test mocks: replace http() mocks with getStorage() mocks
- [x] 5.2 Migrate `src/services/client.ts` — 8 functions delegate to getStorage()
- [x] 5.3 Migrate `src/services/pet.ts` — 7 functions delegate to getStorage()
- [x] 5.4 Migrate `src/services/service.ts` — 7 functions delegate to getStorage()
- [x] 5.5 Migrate `src/services/appointments.ts` — 5 functions delegate to getStorage()
- [x] 5.6 Migrate `src/services/settings.ts` — 3 functions delegate to getStorage() (uploadLogo stays direct fetch)

## Phase 6: App Integration & Landing Page

- [x] 6.1 [RED] Write LandingPage tests: "Try Demo" sets mode + navigates; "Log In" shows disabled toast
- [x] 6.2 [GREEN] Modify `src/pages/LandingPage.tsx` — replace /register CTA with setMode('demo')+navigate(/clients), add disabled "Log In" button
- [x] 6.3 Wrap App in StorageModeProvider in `src/main.tsx`
- [x] 6.4 Add mode-gate in `src/App.tsx` — if !isResolved render LandingPage, else Routes with /→/clients redirect
- [x] 6.5 Full verification: `npm run test:frontend && npm test && npm run build`
