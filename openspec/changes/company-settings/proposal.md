# Proposal: Company Settings

## Intent

Add a configuration section where the grooming business defines its company name, work calendar, and default language. Eliminates the hardcoded "Bark & Bubbles" in the sidebar and provides the foundational data that the future Appointment calendar will consume.

## Scope

### In Scope
- Single-row `company_settings` DB table with company name, workdays, operating hours, and default language
- New `settings` bounded context (API) following existing Clean Architecture pattern
- `GET /api/v1/settings` and `PUT /api/v1/settings` API endpoints
- SettingsPage form at the existing `/settings` route (already in sidebar)
- Replace hardcoded "Bark & Bubbles" in Sidebar with persisted company name
- Persist language preference: app reads `defaultLang` on init, overrides browser detection
- i18n locale files for both `en` and `es` settings page text

### Out of Scope
- Appointment scheduling/calendar (consumes settings, not part of this change)
- Multi-tenant or multi-location support
- Per-user settings or preferences
- Email/SMS notifications

## Capabilities

### New Capabilities
- `company-settings`: Company configuration entity, API endpoints, repository, and SettingsPage form with validation for all fields

### Modified Capabilities
- `i18n-infrastructure`: Language detection source extends from navigator-only to stored preference (DB) with navigator fallback at app startup

## Approach

**Database**: Single-row `company_settings` table via Prisma migrate. Column types: `VARCHAR(200)` company name, `JSON` workdays (ISO day numbers 1–7), `TIME` operating hours, `TINYINT` language. Seed migration inserts defaults.

**Backend**: New `api/settings/` bounded context — same 4-layer Clean Architecture as clients/pets/services. Controller injected with `GetSettings` and `UpdateSettings` use cases. Update validates: 1–200 char name, non-empty workdays 1–7, start < end time, lang 0|1.

**Frontend**: SettingsPage reads settings on mount, saves on submit. Four sections: company name (Input), workdays (7 toggle chips), timetable (2 time inputs), language (Select). Sidebar reads company name from settings state.

**Language init**: Before first render, fetch settings and call `i18n.changeLanguage()`. Navigator detection remains as fallback.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | New | `CompanySettings` model |
| `api/settings/` | New | Bounded context (domain, application, interface, infrastructure) |
| `api/index.ts` | Modified | Wire settings router at `/api/v1/settings` |
| `src/pages/SettingsPage.tsx` | New | Settings form page |
| `src/App.tsx` | Modified | Register `/settings` route |
| `src/services/settings.ts` | New | API fetch wrappers |
| `src/types/settings.ts` | New | TypeScript interfaces |
| `src/components/organisms/Sidebar.tsx` | Modified | Replace hardcoded company name |
| `src/i18n.ts` | Modified | Apply persisted language on init |
| `src/locales/{en,es}/settings.json` | New | Settings page strings |
| `openspec/config.yaml` | Modified | Add `settings` to bounded contexts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| i18n init race: settings fetch vs language detection | Low | Fetch settings before first render; navigator fallback |
| Simultaneous saves in multi-tab | Low | Last-write-wins acceptable for single-user app; Prisma `update` is atomic |
| Missing settings row after migration | Low | Seed migration inserts default; repository upserts on missing |

## Rollback Plan

Revert the migration and delete the `api/settings/` directory. Restore hardcoded company name in Sidebar. Remove `/settings` route registration. i18n falls back cleanly to navigator detection.

## Dependencies

- Existing Clean Architecture patterns (clients, pets, services) — settings copies the same structure
- `openspec/specs/i18n-infrastructure/` — language init behavior extends the i18n framework spec

## Success Criteria

- [ ] `GET /api/v1/settings` returns default settings from a fresh migration
- [ ] `PUT /api/v1/settings` validates and persists all fields; rejects invalid data
- [ ] SettingsPage renders at `/settings`, loads data, and saves successfully
- [ ] Sidebar shows company name from settings, not hardcoded string
- [ ] App language respects stored `defaultLang` preference on page load
- [ ] Workdays and timetable values are queryable by the future Appointment context
