# Tasks: Company Settings

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650–750 across 18 files (12 new, 6 modified) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: backend → PR 2: frontend |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | DB schema, settings bounded context, API endpoints | PR 1 | `npm test -- api/settings` | `curl -s localhost:3001/api/v1/settings` — GET returns defaults, PUT validates & persists | Revert migration + delete `api/settings/` + remove route wire in `api/index.ts` |
| 2 | SettingsPage, Sidebar name, i18n init, locales, config | PR 2 | `npm test -- src/pages/SettingsPage` | Visit `/settings`, modify name, save — sidebar reflects change on reload | Revert all `src/` changes; API layer stays intact |

---

## Phase 1: Database Foundation (PR 1)

- [x] 1.1 RED — write migration integration test: seed row exists with defaults after migrate
- [x] 1.2 Add `CompanySettings` model to `prisma/schema.prisma` (JSON workdays, VARCHAR(5) times, TINYINT lang, `@@map("company_settings")`)
- [x] 1.3 Create seed migration: single row with defaults (name="Bark & Bubbles", workdays=[1-5], times 09:00-17:00, lang=0)
- [x] 1.4 GREEN — run migration, verify test passes

## Phase 2: Backend Domain + Application (PR 1)

- [x] 2.1 RED — write unit test for `UpdateSettings`: rejects empty name, empty workdays, invalid times, invalid lang
- [x] 2.2 Create `api/settings/domain/Settings.ts` — entity interface, `Lang` union (`0 | 1`), `SettingsRepository` interface with `findSettings()` and `upsert()`
- [x] 2.3 Create `api/settings/domain/SettingsErrors.ts` — `SettingsNotFoundError`, `SettingsValidationError`
- [x] 2.4 Create `api/settings/application/GetSettings.ts` — `execute()`: call `repo.findSettings()` or throw `SettingsNotFoundError`
- [x] 2.5 Create `api/settings/application/UpdateSettings.ts` — validate all 5 fields (name 1-200 chars, workdays non-empty 1-7, time HH:MM regex, start < end, lang 0|1), then `repo.upsert()`
- [x] 2.6 GREEN — make validation unit tests pass

## Phase 3: Backend Interface + Infrastructure + Wiring (PR 1)

- [x] 3.1 RED — write controller unit test: GET returns 200 with DTO, PUT returns 200/422 per validation, 500 on DB error
- [x] 3.2 Create `api/settings/infrastructure/PrismaSettingsRepository.ts` — `findSettings()` via `findFirst()`, `upsert()` via `findFirst()`→`create()` fallback
- [x] 3.3 Create `api/settings/interface/SettingsController.ts` — `getSettings`, `updateSettings` with DTO mapping (snake_case ↔ camelCase) + `handleError`
- [x] 3.4 Create `api/settings/interface/settingsRouter.ts` — `GET /`, `PUT /` (no `:id` param)
- [x] 3.5 Wire settings context in `api/index.ts`: repo → use cases → controller → `app.use('/api/v1/settings', router)`
- [x] 3.6 GREEN — make controller unit tests pass; verify with `curl GET/PUT`

## Phase 4: Frontend Foundation (PR 2)

- [x] 4.1 RED — write SettingsPage test: mounts empty, loads data, validates empty name, submits successfully
- [x] 4.2 Create `src/types/settings.ts` — `CompanySettings`, `UpdateSettingsDto` interfaces
- [x] 4.3 Create `src/services/settings.ts` — `getSettings()`, `updateSettings()` fetch wrappers
- [x] 4.4 Create `src/locales/en/settings.json` and `src/locales/es/settings.json` — settings page strings
- [x] 4.5 GREEN — verify types compile, services resolve

## Phase 5: Frontend Implementation (PR 2)

- [x] 5.1 Create `src/pages/SettingsPage.tsx` — form with 4 sections: company name input, 7 workday toggle chips, 2 time inputs, lang Select. Load on mount via GET, save via PUT with client-side validation (block empty name before API call), success/error toast
- [x] 5.2 Sidebar test — updated DashboardLayout + App tests to verify no hardcoded name; Sidebar dynamic name behavior covered by SettingsPage flow
- [x] 5.3 Modify `src/components/organisms/Sidebar.tsx` — `useEffect` → `getSettings()` → display `companyName`. Remove hardcoded "Bark & Bubbles". No fallback text per spec.
- [x] 5.4 Modify `src/i18n.ts` + `src/main.tsx` — async-init before export: fetch settings, `i18n.changeLanguage()` before `ReactDOM.createRoot()`. Navigator fallback on fetch failure. Sync `<html lang>` in `languageChanged` listener. Added `settings` namespace.
- [x] 5.5 Modify `src/App.tsx` — add `<Route path="/settings" element={<SettingsPage />} />`
- [x] 5.6 GREEN — make SettingsPage + Sidebar tests pass

## Phase 6: Finalization (PR 2)

- [x] 6.1 Add `settings` to bounded contexts list in `openspec/config.yaml`
- [x] 6.2 E2E test: Playwright — navigate to `/settings`, modify name, save, verify sidebar updates on reload
- [x] 6.3 Run full test suite: `npm test`, `npm run e2e`, `npm run lint`
