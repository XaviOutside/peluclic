# Design: Company Settings

## Technical Approach

New `settings` bounded context following the existing 4-layer Clean Architecture pattern (clients/pets/services). Singleton row identified by `id=1` — no `:id` param in routes. Upsert on PUT: `findFirst()` + fallback `create()`. Prisma `Json` for workdays, `String @db.VarChar(5)` for HH:MM times, `TINYINT` for language. Frontend: SettingsPage form loads on mount, sidebar fetches company name on mount, i18n init blocks on settings fetch before first render.

## Architecture Decisions

| Decision | Options Considered | Choice | Rationale |
|---|---|---|---|
| Singleton ID strategy | (A) Hardcoded `id=1` always, (B) `findFirst()` no where, (C) dedicated singleton column | **B** — `findFirst()` without where clause | Decouples from autoincrement drift. After seed, `findFirst()` returns the only row. Migrations can reset autoincrement safely. |
| Workdays storage | (A) 7 TINYINT columns, (B) JSON array, (C) separate workdays table | **B** — `Json` column | One row, 7 booleans as day numbers. No joins needed. Prisma validates JSON parse. Consumed by future Calendar context. |
| Time format | (A) Prisma `DateTime`, (B) `String @db.VarChar(5)`, (C) minutes-int | **B** — `"HH:MM"` string | MySQL TIME maps poorly to Prisma. String with regex validation (`/^\d{2}:\d{2}$/`) is simple, debuggable, frontend-friendly. |
| PUT upsert | (A) Separate POST + PUT, (B) `findFirst` → `create` fallback | **B** — upsert at repository layer | Singleton semantics: first call after seed = update existing. Migration guarantees one row. Prisma `upsert` not used because `id` is autoincrement. |
| i18n init order | (A) Render then fetch, (B) fetch settings before `ReactDOM.createRoot` | **B** — block render until settings resolved | Avoids flash of wrong language. Navigator fallback if fetch fails (network error or empty DB). `<html lang>` synced in `languageChanged` listener. |

## Data Flow

```
SettingsPage (mount)          Sidebar (mount)          App Entry (before render)
      │                           │                           │
      ▼                           ▼                           ▼
 GET /api/v1/settings        GET /api/v1/settings        GET /api/v1/settings
      │                           │                           │
      ▼                           ▼                           ▼
 Form pre-populated          Display companyName         i18n.changeLanguage()
      │                           OR nothing              navigator fallback?
      │ (submit)                  (per spec: no            │
      ▼                           hardcoded fallback)      ▼
 PUT /api/v1/settings                                  ReactDOM.createRoot()
      │
      ▼
 Success toast + re-render
```

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `CompanySettings` model (JSON workdays, VARCHAR times, TINYINT lang, `@@map("company_settings")`) |
| `api/settings/domain/Settings.ts` | New | Entity + `Lang` union type + repository interface |
| `api/settings/domain/SettingsErrors.ts` | New | `SettingsNotFoundError`, `SettingsValidationError` |
| `api/settings/application/GetSettings.ts` | New | `execute()` — repo.findSettings() or throw |
| `api/settings/application/UpdateSettings.ts` | New | Validate all 5 fields, repo.upsert() |
| `api/settings/interface/SettingsController.ts` | New | `getSettings`, `updateSettings` + `handleError`, DTO mapping |
| `api/settings/interface/settingsRouter.ts` | New | `GET /`, `PUT /` — no `:id` param |
| `api/settings/infrastructure/PrismaSettingsRepository.ts` | New | `findSettings()` via `findFirst`, `upsert()` via `findFirst`→`create` fallback |
| `api/index.ts` | Modify | Wire settings context: repo → use cases → controller → `app.use('/api/v1/settings', ...)` |
| `src/types/settings.ts` | New | `CompanySettings`, `UpdateSettingsDto` interfaces |
| `src/services/settings.ts` | New | `getSettings()`, `updateSettings()` fetch wrappers |
| `src/pages/SettingsPage.tsx` | New | Form: company name input, 7 workday toggle chips, 2 time inputs, lang Select. Client-side validation before PUT. Success/error toast. |
| `src/locales/en/settings.json` | New | Settings page strings |
| `src/locales/es/settings.json` | New | Settings page strings |
| `src/App.tsx` | Modify | Add `<Route path="/settings" element={<SettingsPage />} />` inside DashboardLayout |
| `src/components/organisms/Sidebar.tsx` | Modify | `useEffect` → `getSettings()` → display `companyName` in `<h1>`. No fallback text per spec requirement. |
| `src/i18n.ts` | Modify | Before export, async-init: fetch settings, `i18n.changeLanguage()` if `defaultLang` set. Navigator detection remains as configured fallback. |
| `openspec/config.yaml` | Modify | Add `settings` to bounded contexts list |

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Domain | Settings entity, Lang enum, validation errors | Unit — pure functions, no DB |
| Application | `GetSettings.execute()` not-found, `UpdateSettings.execute()` validation rules | Unit — mock repo |
| Interface | Controller returns 200/422/500, router wires correct HTTP methods | Unit — supertest or controller unit test |
| Infrastructure | Repository `findSettings()` returns seed row, `upsert()` creates when missing, updates when present | Integration — real MySQL via Docker |
| Frontend | SettingsPage loads/pre-populates, validates empty name, saves successfully, displays error on 422 | Vitest + testing-library |
| Frontend | Sidebar displays name from API, shows nothing before load | Vitest + testing-library |
| E2E | Full flow: navigate to /settings, modify name, save, verify sidebar updates | Playwright |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Standard CRUD API with parameterized Prisma queries; existing helmet/CORS/rate-limit middleware applies.

## Migration / Rollout

Seed migration inserts default row (id=1 autoincrement, companyName="Bark & Bubbles", workdays=[1-5], times 09:00-18:00, lang=0). Rollback: revert migration, delete `api/settings/`, restore hardcoded sidebar name, remove `/settings` route.

## Open Questions

- None — all blockers resolved in spec/explore phases.
