# Proposal: Demo Mode with localStorage

## Intent

Enable a zero-dependency "Try Demo" experience so pet grooming businesses can test pfmaster directly in their browser — no Docker, MySQL, or login required. All data persists in browser localStorage. The paid version (backend + subscription) is architected as a deferred path, not blocked by this change.

## Scope

### In Scope
- Landing page with "Try Demo" and "Log In" (login inactive for v1)
- `IStorage` interface: ~30 CRUD methods across all 5 domains
- `LocalStorage` implementation: full CRUD, client-side substring search, pagination via `Array.slice`, soft delete
- `ApiStorage` implementation: wraps existing `http()` calls (unchanged contract)
- React context + hook to detect and resolve active storage mode
- Demo persistence in localStorage (`pf_demo:mode` key)
- Graceful handling: empty state, localStorage unavailable (Safari private browsing), JSON corruption

### Out of Scope
- Paid version (login, subscription, MySQL)
- Data export/import between demo and paid
- localStorage quota warnings (deferred)
- Backend changes of any kind
- Docker/database dependency removal — backend stays intact
- Offline sync or conflict resolution

## Capabilities

### New Capabilities
- `demo-mode`: browser-local demo experience with landing page, mode selector, localStorage persistence
- `storage-abstraction`: `IStorage` interface decoupling frontend data access from API transport

### Modified Capabilities
- None — existing feature behavior is unchanged; hooks and pages consume identical contracts

## Approach

**Storage Provider Pattern** (recommended by exploration).

Add `src/storage/` (5 files): `IStorage.ts`, `ApiStorage.ts`, `LocalStorage.ts`, `useStorageMode.ts`, `storageContext.tsx`. Modify 5 service files to call `storage.method()` instead of `http()`. Add `LandingPage.tsx` and wire provider in `main.tsx`. Hooks, pages, components, and types are untouched.

localStorage keys: `pf_demo:{clients,pets,services,appointments,settings,nextIds}`. Demo search uses substring `includes()` — adequate for demo scale (~1000 records per entity, ~850 KB total).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/storage/` | New | 5 files: interface + 2 impls + hook + context |
| `src/pages/LandingPage.tsx` | New | Mode selector |
| `src/services/*.ts` (5 files) | Modified | Delegate to storage provider |
| `src/main.tsx` | Modified | Wrap app in `StorageModeProvider` |
| `src/App.tsx` | Modified | Route to landing page when mode unresolved |
| Hooks, pages, components, types | None | Contracts unchanged |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Safari private browsing blocks localStorage | Low | Catch `SecurityError`, show fallback message |
| localStorage data corruption | Low | `try/catch` on JSON.parse, reset to empty on failure |
| Search quality vs MySQL FTS | Low | Acceptable for demo; substring `includes()` adequate |
| TDD cycle slows first delivery | Medium | Tests per `strict_tdd_mode: true`; each impl tested independently |

## Rollback Plan

1. Revert 5 service files to direct `http()` calls
2. Remove `src/storage/`, `src/pages/LandingPage.tsx`
3. Revert `main.tsx` and `App.tsx`
4. Zero database migration risk — no backend changes

## Dependencies

None. Zero external dependencies.

## Success Criteria

- [ ] App loads in browser without Docker/MySQL
- [ ] Full CRUD on all 5 domains via localStorage
- [ ] Search, pagination, soft delete all functional in demo
- [ ] Data persists across page refreshes
- [ ] Landing page with working mode selector; demo choice persists
- [ ] Existing test suite passes unchanged
- [ ] New tests cover LocalStorage, ApiStorage, and mode detection
