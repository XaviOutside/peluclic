# Design: Extract All Frontend Literals (i18n)

## Technical Approach

Wrap the React tree with `react-i18next` + `i18next` + `i18next-browser-languagedetector` in `main.tsx`. Replace every JSX text literal, utility-formatted string, and aria-label with `t('namespace.section.key')` calls. Create 12 JSON locale files (6 namespaces × 2 languages). All 35+ test files use a shared mock that returns keys as values.

**Primary risk mitigation**: Test mock returns the key itself (`t = (k) => k`), so every broken reference fails obviously — no silent "missing translation" fallbacks in CI.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| i18n library | react-i18next + i18next | De facto standard; namespace support; browser detection built-in |
| Provider placement | Wrap `<App>` in `main.tsx` via `I18nextProvider` | Single source of truth; every component gets `useTranslation` without prop drilling |
| Namespace granularity | 6 namespaces: `common`, `landing`, `clients`, `pets`, `services`, `validation` | Matches bounded contexts; avoids a single monolithic file |
| Key convention | `namespace.section.subkey` (e.g., `clients.form.label.name`) | Hierarchical, grep-friendly, mirrors component tree |
| Test mock strategy | `src/test-utils/i18n.ts` returns key as value; vitest setup auto-loads | Zero per-file setup; broken keys fail obviously |
| Language detection | `navigator.language` → `es` fallback | `es` matches current hardcoded strings; progressive enhancement |
| Backend errors | NOT extracted (out of scope per proposal) | Backend owns its error messages; only frontend literals targeted |
| Material Symbols | Icon names excluded from locale files | These are Google Fonts API identifiers, not user-facing text |

## Data Flow

```
Browser navigator.language
        │
        ▼
┌──────────────────────┐
│ i18next + Detector   │  ← src/i18n.ts
│  resolves language   │
│  (es | en)           │
└──────┬───────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────────────┐
│  I18nextProvider     │────▶│  Components use           │
│  (main.tsx)          │     │  useTranslation('ns')     │
└─────────────────────┘     │  → t('key')               │
                            └──────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            src/locales/es/*    src/locales/en/*    Test mock
            6 JSON files        6 JSON files        returns key
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/i18n.ts` | **Create** | i18next config: detector, react binding, 12 resource imports |
| `src/locales/en/common.json` | **Create** | Nav, actions, status, pagination, empty states, a11y labels |
| `src/locales/es/common.json` | **Create** | Spanish mirror of common.json |
| `src/locales/en/landing.json` | **Create** | Hero, features grid, footer |
| `src/locales/es/landing.json` | **Create** | Spanish landing copy |
| `src/locales/en/clients.json` | **Create** | List headers, form labels/placeholders, detail fields, deactivate dialog |
| `src/locales/es/clients.json` | **Create** | Spanish clients |
| `src/locales/en/pets.json` | **Create** | List/table, form, detail card, sex labels, weight format |
| `src/locales/es/pets.json` | **Create** | Spanish pets |
| `src/locales/en/services.json` | **Create** | List/table, form, detail card, duration/price format |
| `src/locales/es/services.json` | **Create** | Spanish services |
| `src/locales/en/validation.json` | **Create** | Required, email, phone, date, weight, length errors |
| `src/locales/es/validation.json` | **Create** | Spanish validation messages |
| `src/test-utils/i18n.ts` | **Create** | Mock `useTranslation` → key-as-value, `t = (k) => k` |
| `src/main.tsx` | **Modify** | Import i18n config, wrap App with `I18nextProvider` |
| `src/components/organisms/Sidebar.tsx` | **Modify** | Labels → `t('common.navigation.*')` |
| `src/components/organisms/MobileNav.tsx` | **Modify** | Labels → `t('common.mobileNav.*')` |
| `src/components/organisms/DataTable.tsx` | **Modify** | "Actions", "Try Again", empty default, aria-labels → `t()` |
| `src/components/organisms/Pagination.tsx` | **Modify** | "Showing page...", "Previous", "Next" → `t()` with interpolation |
| `src/components/molecules/StatusBadge.tsx` | **Modify** | "Active"/"Inactive" → `t('common.status.*')` |
| `src/components/molecules/ConfirmDialog.tsx` | **Modify** | Default "Confirm"/"Cancel" → `t('common.actions.*')` |
| `src/components/organisms/ClientDetailCard.tsx` | **Modify** | Field labels, "Not provided", action buttons → `t()` |
| `src/components/organisms/PetDetailCard.tsx` | **Modify** | Field labels, `formatSex` → `t()`, `formatWeight` localized |
| `src/components/organisms/ServiceDetailCard.tsx` | **Modify** | `formatDuration` → `t()` |
| `src/components/molecules/ClientForm.tsx` | **Modify** | Labels, placeholders → `t('clients.form.*')` |
| `src/pages/LandingPage.tsx` | **Modify** | Hero, features, footer → `t('landing.*')` |
| `src/pages/ClientsPage.tsx` | **Modify** | Tabs, columns, search, button, dialogs → `t()` |
| `src/pages/ClientEditPage.tsx` | **Modify** | Titles, error messages → `t()` |
| `src/utils/format.ts` | **Modify** | `formatDate` accept locale; remove hardcoded `'en-US'` |
| `src/utils/validation.ts` | **Modify** | Return keys instead of English strings → callers resolve with `t()` |
| `src/test-setup.ts` | **Modify** | Import test-utils mock for `react-i18next` |
| All page & component files | **Modify** | Replace hardcoded strings with `t()` (~35 files) |
| All test files (~35) | **Modify** | If testing specific strings → use keys from locale files |
| `src/components/molecules/LanguageSwitcher.tsx` | **Create** | Dropdown atom (es/en) for sidebar footer |

## Key Naming Convention

```
common.navigation.<item>        — sidebar/mobile nav labels
common.actions.<verb>           — save, cancel, back, edit, deactivate, reactivate
common.status.<active|inactive> — status badges
common.pagination.showing       — "Showing page {{page}} of {{totalPages}}"
common.pagination.previous      — prev button
common.pagination.next          — next button
common.empty.noItems            — default empty message
common.labels.notProvided       — "Not provided"
common.notFound.*               — 404 page
common.brand.*                  — app name, tagline
common.datatable.*              — "Actions" column header
landing.hero.*                  — hero headline, CTA
landing.features.*              — feature cards
landing.footer.*                — copyright, links
clients.list.column.*           — table column headers
clients.form.label.*            — field labels
clients.form.placeholder.*      — input placeholders
clients.detail.field.*          — detail card field labels
clients.deactivate.*            — deactivate dialog & feedback
clients.notFound.*              — 404/edit error
pets.list.column.*              — table column headers
pets.form.label.*               — field labels
pets.detail.field.*             — detail card field labels
pets.sex.male|female|unknown    — sex display labels
services.list.column.*          — table column headers
services.form.label.*           — field labels
services.detail.field.*         — detail card field labels
services.duration               — "{{minutes}} min" / "{{minutes}} minutes"
validation.required             — "{{field}} is required"
validation.email                — "Please enter a valid email"
validation.phone                — "Please enter a valid phone number"
validation.lengthMin            — "{{field}} must be at least {{min}} character(s)"
validation.lengthMax            — "{{field}} must be at most {{max}} characters"
```

## Format Utilities — i18n Integration

Three duplicated `formatDuration` functions and one private `formatSex` must be unified:

| Current | Resolution |
|---------|------------|
| `formatSex` in PetDetailCard | Move to `src/utils/format.ts`; use locale key `pets.sex.<value>` |
| `formatDuration` × 3 (with 3 different null fallbacks) | Single `formatDuration(minutes, t)` in `src/utils/format.ts` |
| `formatDate(dateString, locale?)` | Add optional locale param, default to i18n detected locale |
| `formatServiceDate` | No change — always DD/MM/YYYY by design |

## Test Strategy

`src/test-utils/i18n.ts`:

```typescript
import { vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));
```

Import in `src/test-setup.ts` via `import './test-utils/i18n'`. This makes `t('clients.form.label.name')` return `"clients.form.label.name"`, so tests that assert on string content must use the KEY, not the value. **Breaking change**: all tests that `getByText('Name')` or similar must become `getByText('clients.form.label.name')`.

## Material Symbols Exclusion

Icon strings are Google Fonts identifiers — unequivocally excluded. Identified instances:
- Sidebar/MobileNav `icon` fields: `dashboard`, `calendar_month`, `group`, `pets`, `content_cut`, `settings`, `help`, `home`, `event`, `person`
- DataTable `RowAction.icon`: `visibility`, `edit`, `delete`
- DataTable `CrossRefAction.icon`: `pets`, `receipt_long`
- ModuleTabs `icon`: `group`, `pets`, `content_cut`
- DataTable error/empty icons: `error`, `search_off`
- Any `<span className="material-symbols-outlined">` content

## Implementation Order

1. Install deps + `src/i18n.ts` + `I18nextProvider` in `main.tsx`
2. Create all 12 locale JSONs with full key sets (write both languages together)
3. Create `src/test-utils/i18n.ts` + update `test-setup.ts` (tests break here — by design)
4. Replace strings in shared components: DataTable, Pagination, StatusBadge, ConfirmDialog, ModuleTabs, PageHeader
5. Replace strings in organisms: Sidebar, MobileNav, ClientDetailCard, PetDetailCard, ServiceDetailCard
6. Replace strings in molecules: ClientForm, PetForm, ServiceForm, SearchInput
7. Replace strings in pages: all 15 pages
8. Unify `formatDuration` / `formatSex` → `src/utils/format.ts` with `t` function
9. Update `src/utils/validation.ts` to return keys instead of strings; update callers
10. Update all 35+ test files to use key-based assertions
11. Create `LanguageSwitcher.tsx` + place in Sidebar footer

## Open Questions

- [ ] Should `Pagination.ariaLabel` be in locale files or is `aria-label` always "Pagination" in both languages?
- [ ] Should `formatServiceDate` DD/MM/YYYY stay fixed or become locale-aware (MM/DD/YYYY for en)?
