## Exploration: Company Settings (Organization Configuration Section)

### Current State

**What exists:**
- **Sidebar** already has a `/settings` route defined in `Sidebar.tsx` (line 21) and `MobileNav.tsx` — but no page component is registered in `App.tsx`. Route exists visually but leads to 404.
- **i18n setup** is fully functional: `react-i18next` with `i18next-browser-languagedetector`, supporting `en` and `es`, with `navigator` detection order. The `LanguageSwitcher` molecule toggles language client-side only — no persistence.
- **DESIGN.md** explicitly mentions "Settings" as a sidebar item (line 132). Design system tokens (colors, typography, spacing, shapes) are fully defined.
- **Clean Architecture patterns** are well-established across three bounded contexts (clients, pets, services), each following domain → application → interface → infrastructure with controller DI, Prisma repositories, and DTO mapping.
- **Prisma schema** has Client, Pet, Service models — no settings/configuration table exists.
- **No Appointment model** exists yet (mentioned in AGENTS.md domain model and design docs, but not implemented). Calendar is referenced in sidebar but no `/calendar` route is wired.
- **No API endpoint** exists for settings/config retrieval or update.

**What's missing:**
1. Database table for company configuration
2. Backend bounded context for settings (API endpoint)
3. Frontend settings page component
4. Language persistence (currently ephemeral — navigator detection, no backend/store)
5. Calendar workday/timetable data model (needed when appointments are built)
6. Company name stored anywhere (currently hardcoded as "Bark & Bubbles" in Sidebar line 43)

### Affected Areas

| Area | Path | Impact |
|------|------|--------|
| DB Schema | `prisma/schema.prisma` | New `company_settings` table |
| API — New BC | `api/settings/domain/` | Entity, repo interface, errors |
| API — New BC | `api/settings/application/` | GetSettings, UpdateSettings use cases |
| API — New BC | `api/settings/interface/` | Controller, router, DTOs |
| API — New BC | `api/settings/infrastructure/` | PrismaSettingsRepository |
| API — Wiring | `api/index.ts` | Register settings router at `/api/v1/settings` |
| Frontend — New page | `src/pages/SettingsPage.tsx` | Settings form page |
| Frontend — Routing | `src/App.tsx` | Add `/settings` route under DashboardLayout |
| Frontend — Types | `src/types/settings.ts` | Settings type + DTOs |
| Frontend — Service | `src/services/settings.ts` | API fetch wrappers |
| Frontend — i18n | `src/i18n.ts` | Apply persisted language on init |
| Sidebar | `src/components/organisms/Sidebar.tsx` | Replace hardcoded "Bark & Bubbles" with company name from settings |
| Locales | `src/locales/{en,es}/` | New `settings.json` namespace for both languages |
| OpenSpec | `openspec/config.yaml` | Add `settings` to `bounded_contexts` list |

### Database Design Options

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A. Single-row table** — `company_settings` with one row (id=1), typed columns: company_name VARCHAR(200), workdays JSON, work_start_time TIME, work_end_time TIME, default_lang TINYINT | Simple query (one row), type-safe per column, follows TINYINT enum convention, ACID, trivially cachable | New column requires migration; not self-describing without code | **Low** |
| **B. Key-value table** — `settings(key VARCHAR, value TEXT)` | Extensible without migrations, easy to add new settings | No type safety, multiple rows per logical group, harder to validate, violates TINYINT rule | Medium |
| **C. JSON column** — single row with a single JSON blob for all settings | Extensible, single query | No type safety at DB level, harder to validate individual fields, MySQL JSON functions needed for partial updates | Medium |

**Recommendation: Approach A — Single-row table.** This aligns with the project's conventions:
- TINYINT for finite values (default_lang: 0=en, 1=es)
- Typed columns with documented value mappings
- Simple Prisma model, no raw SQL needed
- Extensibility is handled via migrations (same as every other table)

#### Recommended Schema

```prisma
model CompanySettings {
  id             Int      @id @default(1) // enforced single-row via app logic + unique constraint
  companyName    String   @db.VarChar(200) @default("Bark & Bubbles")
  workdays       Json     // JSON array of day numbers: [1,2,3,4,5] = Mon-Fri (1=Mon, 7=Sun per ISO-8601)
  workStartTime  String   @db.Time @default("09:00:00")
  workEndTime    String   @db.Time @default("17:00:00")
  defaultLang    Int      @db.TinyInt @default(0) // 0=English, 1=Spanish
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@map("company_settings")
}
```

**Workdays format**: JSON array of integers `[1,2,3,4,5]` where 1=Monday through 7=Sunday (ISO-8601). This is simpler than a TINYINT bitmask (which would be a "magic number" without context) and more readable than separate boolean columns. JSON is the pragmatic choice for a set of values — no plain strings, documented value mapping.

**Migration strategy**: Seed migration inserts the default row (id=1). Application logic enforces upsert (always id=1) — no create/delete, only GET and PUT.

### Backend Architecture

**New bounded context: `settings`** (following the plural naming convention of `clients`, `pets`, `services`).

```
api/settings/
├── domain/
│   ├── CompanySettings.ts      # Entity type + status constants
│   ├── ISettingsRepository.ts   # Repository interface
│   └── SettingsErrors.ts       # NotFoundError (if row missing)
├── application/
│   ├── GetSettings.ts          # GetSettingsUseCase
│   └── UpdateSettings.ts       # UpdateSettingsUseCase (with validation)
├── interface/
│   ├── SettingsController.ts   # Controller with DI of use cases
│   ├── settingsRouter.ts       # Express router factory
│   └── dtos/
│       ├── SettingsResponseDto.ts
│       └── UpdateSettingsDto.ts
└── infrastructure/
    └── PrismaSettingsRepository.ts
```

**API endpoints:**
- `GET /api/v1/settings` → Returns the company settings (single row)
- `PUT /api/v1/settings` → Updates settings (full replace). No ID in URL — always the singleton row.

**Validation rules (UpdateSettings use case):**
- `companyName`: required, 1–200 chars, trim
- `workdays`: required, non-empty array, each value 1–7, no duplicates
- `workStartTime`: required, valid HH:MM format, before workEndTime
- `workEndTime`: required, valid HH:MM format, after workStartTime
- `defaultLang`: required, must be 0 or 1

**Wire pattern** (in `api/index.ts`): Same DI chain as other bounded contexts — instantiate repository → use cases → controller → router → `app.use()`.

**Why a new bounded context instead of extending shared:** Settings is its own domain concept with business rules (workday validation, time range ordering). It's not a cross-cutting utility. Keeping it in its own bounded context isolates the settings domain from clients/pets/services concerns and follows the existing pattern exactly.

### Frontend: Settings Page

**Route**: `/settings` — already defined in Sidebar, just needs a page component registered in `App.tsx`.

**Component structure**:

```
src/pages/SettingsPage.tsx        # Page container with form
├── Atoms: Input, Select          # For text fields and language dropdown
├── Molecules: (none new needed)  # Workday checkboxes can be built inline or extracted
└── Design tokens: uses existing DESIGN.md tokens (rounded-lg, primary-container, etc.)
```

**SettingsPage layout:**
- Card-based layout (matches DESIGN.md card pattern)
- Section 1: **Company Name** — Input atom, max 200 chars
- Section 2: **Workdays** — 7 toggle chips/checkboxes (Mon–Sun), labeled via i18n
- Section 3: **Daily Timetable** — Two time Input fields (start/end), type="time"
- Section 4: **Default Language** — Select atom with en/es options
- Save button (primary) at bottom

**Data flow:**
1. On mount: `GET /api/v1/settings` → populate form
2. On save: `PUT /api/v1/settings` with form data → show success/error toast
3. Sidebar company name reads from settings (replace hardcoded "Bark & Bubbles")

**New files needed:**
- `src/types/settings.ts` — CompanySettings interface + UpdateSettingsDto
- `src/services/settings.ts` — getSettings(), updateSettings() API wrappers
- `src/pages/SettingsPage.tsx` — form page
- `src/pages/SettingsPage.test.tsx` — tests
- `src/locales/en/settings.json` — English strings
- `src/locales/es/settings.json` — Spanish strings

### Language Integration

**Current behavior**: i18n reads from `navigator.language` on first load. LanguageSwitcher toggles in-memory only.

**Target behavior**:
1. On app mount, fetch settings from `GET /api/v1/settings`
2. If `defaultLang` is set, override i18n language: `i18n.changeLanguage(lang)` where lang = `defaultLang === 0 ? 'en' : 'es'`
3. When user changes language in SettingsPage and saves, backend stores the preference
4. LanguageSwitcher in sidebar still works for temporary overrides

**Implementation approach**: Add a small initialization effect in `App.tsx` or `main.tsx` that fetches settings and applies the language BEFORE rendering. The `i18next-browser-languagedetector` can remain as a fallback — the explicit `changeLanguage` call takes precedence.

**Risk**: Circular dependency if settings API needs i18n for error messages. Mitigation: API responses are in English by default (per AGENTS.md language domain contract), and the settings fetch happens before UI render.

### Calendar: Workdays/Timetable Impact on Appointments

**Current state**: No Appointment entity exists. Calendar and appointments are referenced in AGENTS.md, DESIGN.md, and sidebar navigation, but not implemented.

**How settings enables appointments**:
- `workdays`: Determines which days appear as available in the calendar view. Days not in the workdays array are greyed out or hidden.
- `workStartTime` / `workEndTime`: Defines the operating hours. Appointment slots are calculated within this range, divided by service durations.
- These settings are READ-ONLY for appointment scheduling — they're configured once in Settings and consumed by the future Calendar/Appointment bounded context.

**No configuration changes needed** for this setting to enable future appointments. The settings API returns workdays and timetable; the future appointment scheduler reads them at query time.

### Risks and Dependencies

| Risk | Severity | Mitigation |
|------|----------|------------|
| Race condition on settings init (two tabs save simultaneously) | Low | Last-write-wins is acceptable for a single-user app; Prisma `update` is atomic |
| Sidebar company name: loading state before settings fetch | Low | Show "Bark & Bubbles" as default/fallback; replace on settings load |
| i18n init race: settings fetch vs i18n detection | Low | Fetch settings before first render (blocking load); fallback to navigator detection |
| Migration: existing DBs with no settings row | Low | Seed migration inserts default row; upsert in repository handles missing case |
| Workdays JSON validation across frontend/backend | Low | Shared constant `DAY_MAP = {1: 'monday', ...}` in domain; controller validates array |
| No existing `/settings` route page → user expectation | Low | Route already in sidebar — adding the page fulfills existing expectation |
| Hardcoded company name in Sidebar (12 occurrences in design HTMLs) | Low | Only one occurrence in production code (Sidebar.tsx line 43); design HTMLs are reference, not source |

### Ready for Proposal

**Yes.** The codebase has clear patterns, no blocking unknowns, and all three settings (company name, calendar config, language) fit naturally into a single bounded context. The sidebar already exposes the `/settings` route — this change fills a gap that the UI already promises.

**What the orchestrator should tell the user:**
- Recommended approach: **New `settings` bounded context** in the API (Clean Architecture, same 4-layer pattern as clients/pets/services) + **single-row `company_settings` table** + **SettingsPage under the existing `/settings` route**
- Database: TINYINT for language, JSON for workdays, TIME for timetable, VARCHAR(200) for company name
- Calendar workdays/timetable will be consumed by the future Appointment bounded context — this is foundational infrastructure
- Language persistence: back-end stored preference overrides navigator detection at app startup
- Sidebar company name: replace hardcoded "Bark & Bubbles" with dynamic settings value (with that as default)
- Total file count estimate: ~25 files (API: ~10, Frontend: ~10, locales: 2, migration: 1, schema change: 1, wiring: 1)
