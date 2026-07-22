# i18n Infrastructure Specification

## Purpose

Multi-language support for the pfmaster frontend via react-i18next. Extracts all user-facing strings into namespaced locale JSON files (es/en), replaces hardcoded JSX text with `t()` calls, and makes utility formatters locale-aware.

## Requirements

### Requirement: i18n Framework Configuration

The system MUST initialize react-i18next at app startup with 7 namespaces (`common`, `landing`, `clients`, `pets`, `services`, `validation`, `appointments`), `i18next-browser-languagedetector` with `navigator.language` detection, and `en` fallback. The `<html lang>` attribute SHALL sync to the active language.

#### Scenario: Spanish browser preference

- GIVEN `navigator.language` returns `"es-ES"`
- WHEN the app initializes
- THEN `i18next.language` is `"es"` and `<html lang="es">` is set

#### Scenario: English browser preference

- GIVEN `navigator.language` returns `"en-US"`
- WHEN the app initializes
- THEN `i18next.language` is `"en"` and `<html lang="en">` is set

#### Scenario: Unsupported language fallback

- GIVEN `navigator.language` returns `"fr-FR"` (not in supported locales)
- WHEN the app initializes
- THEN language falls back to `"en"`

### Requirement: Locale File Structure

The system MUST provide 14 locale JSON files under `src/locales/{en,es}/` — one per namespace per language, including `appointments`. Keys SHALL follow `section.subsection.label` convention. Key parity is bidirectional: every key present in one language MUST have a corresponding entry in the other.

#### Scenario: Key parity — en → es direction

- GIVEN `en/landing.json` has key `"hero.loginComingSoon"`
- WHEN the `es/landing.json` file is inspected
- THEN key `"hero.loginComingSoon"` exists with a Spanish translation

#### Scenario: Key parity — es → en direction

- GIVEN `es/appointments.json` has key `"status.pending"`
- WHEN the `en/appointments.json` file is inspected
- THEN key `"status.pending"` exists with the English equivalent "Pending"

#### Scenario: Namespace isolation

- GIVEN a component uses `useTranslation('landing')`
- WHEN `t('hero.title')` is called
- THEN the key resolves from `src/locales/{lang}/landing.json` exclusively

### Requirement: Component String Extraction

All user-facing text in JSX, `aria-label`, `title`, and `placeholder` attributes MUST be replaced with `{t('key')}` calls. Material Symbols icon names (`group`, `pets`, `house`, etc.) SHALL remain as-is — they are font identifiers, not translatable content.

#### Scenario: JSX text replaced

- GIVEN a component renders `<h2>Lista de Clientes</h2>`
- WHEN i18n migration is applied
- THEN the component renders `<h2>{t('clients.list.title')}</h2>`

#### Scenario: Material Symbols preserved

- GIVEN `<span className="material-symbols-outlined">group</span>`
- WHEN i18n migration is applied
- THEN the icon span is NOT modified

#### Scenario: aria-label translated

- GIVEN `<button aria-label="Buscar">`
- WHEN i18n migration is applied
- THEN it becomes `<button aria-label={t('common.search.label')}>`

### Requirement: Utility Locale Awareness

`formatSex(value)`, `formatDuration(minutes)`, and `formatDate(isoString)` MUST accept an optional `locale` parameter (defaults to `i18next.language`) and produce locale-appropriate output. No hardcoded locale strings (e.g., `'en-US'`).

#### Scenario: formatDate with Spanish locale

- GIVEN `formatDate("2026-06-15", "es")` is called
- WHEN the date is formatted
- THEN output is "15/06/2026" (DD/MM/YYYY)

#### Scenario: formatDate with English locale

- GIVEN `formatDate("2026-06-15", "en")` is called
- WHEN the date is formatted
- THEN output is "6/15/2026" (M/D/YYYY)

### Requirement: MODULE_TABS Deduplication

The `MODULE_TABS` array — duplicated across landing, clients, pets, and services pages — MUST be extracted into a single `useModuleTabs()` hook at `src/hooks/useModuleTabs.ts`. Each consumer SHALL call the hook and use its `t()`-based labels. No duplicated tab definitions SHALL remain.

#### Scenario: Single source of truth

- GIVEN the `useModuleTabs` hook is created
- WHEN the Landing, Clients, Pets, and Services pages are inspected
- THEN `MODULE_TABS` is defined exactly once — in `useModuleTabs.ts`

### Requirement: Test Translation Mocking

All frontend test files (~35) MUST mock `useTranslation` from `react-i18next` at setup. The mock SHALL return `t: (key) => key` so tests pass with raw keys as rendered text. Tests MAY assert on keys (e.g., `expect(screen.getByText('clients.empty.title'))`) to verify correct key usage.

#### Scenario: Component test with mock

- GIVEN a component renders `{t('clients.list.empty')}`
- AND `useTranslation` is mocked to return `t: (key) => key`
- WHEN the test asserts visible text
- THEN `screen.getByText('clients.list.empty')` passes

#### Scenario: Test without mock fails predictably

- GIVEN a test file does NOT mock `useTranslation`
- WHEN the test mounts a component using `useTranslation()`
- THEN the test fails with a clear error (missing provider/mock)

### Requirement: LanguageSwitcher Optional className Prop

The `LanguageSwitcher` molecule MUST accept an optional `className?: string` prop and SHALL merge it into the button's class list. Callers SHALL NOT be required to provide the prop — omitting it MUST produce identical rendering to the current behavior.

#### Scenario: className applied

- GIVEN `<LanguageSwitcher className="absolute top-4 right-4 rounded-full" />`
- WHEN the component renders
- THEN the button class list includes `absolute top-4 right-4 rounded-full` alongside its default styles

#### Scenario: backward compatibility — no className

- GIVEN `<LanguageSwitcher />` is rendered without a `className` prop
- WHEN the component renders
- THEN the button has its default classes only — no `undefined` or empty string appended

### Requirement: LandingPage Language Toggle

The `LandingPage` hero section MUST render `LanguageSwitcher` positioned at the top-right corner. The toggle SHALL switch between English and Spanish for all landing page content via `i18n.changeLanguage()`. The visible label MUST show the language the user would switch TO (i.e., "ES" when current is English, "EN" when current is Spanish).

#### Scenario: toggle rendered in hero

- GIVEN the landing page is loaded
- WHEN the hero section renders
- THEN a `LanguageSwitcher` component is visible in the top-right area of the hero, using `position: absolute`

#### Scenario: toggle English → Spanish

- GIVEN the current language is English (toggle shows "ES")
- WHEN the user clicks the language toggle
- THEN all landing page text switches to Spanish and the toggle label updates to "EN"

#### Scenario: toggle Spanish → English

- GIVEN the current language is Spanish (toggle shows "EN")
- WHEN the user clicks the language toggle
- THEN all landing page text switches to English and the toggle label updates to "ES"

### Requirement: Language Default on First Visit

When a visitor loads the application with no stored language preference (first visit, cleared storage, or incognito), the language MUST follow `navigator.language` detection with English as fallback. The `LanguageSwitcher` label SHALL reflect the resolved language — showing "ES" when English is active, "EN" when Spanish is active.

#### Scenario: English browser → English default

- GIVEN `navigator.language` is `"en-US"` and no language preference is stored
- WHEN the landing page loads
- THEN content renders in English and the LanguageSwitcher label is "ES"

#### Scenario: unsupported language → English fallback

- GIVEN `navigator.language` is `"fr-FR"` and no language preference is stored
- WHEN the landing page loads
- THEN content renders in English and the LanguageSwitcher label is "ES"
