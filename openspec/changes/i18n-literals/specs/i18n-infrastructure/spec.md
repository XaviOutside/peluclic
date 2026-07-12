# i18n Infrastructure Specification

## Purpose

Multi-language support for the pfmaster frontend via react-i18next. Extracts all user-facing strings into namespaced locale JSON files (es/en), replaces hardcoded JSX text with `t()` calls, and makes utility formatters locale-aware.

## Requirements

### Requirement: i18n Framework Configuration

The system MUST initialize react-i18next at app startup with 6 namespaces (`common`, `landing`, `clients`, `pets`, `services`, `validation`), `i18next-browser-languagedetector` with `navigator.language` detection, and `en` fallback. The `<html lang>` attribute SHALL sync to the active language.

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

The system MUST provide 12 locale JSON files under `src/locales/{en,es}/` — one per namespace per language. Keys SHALL follow `section.subsection.label` convention. Every key present in `es` MUST have a corresponding `en` entry. All existing Spanish text SHALL be preserved as-is in `es` files.

#### Scenario: Key parity across languages

- GIVEN `es/common.json` has key `"nav.clients"`
- WHEN the `en/common.json` file is inspected
- THEN key `"nav.clients"` exists with the English equivalent "Clients"

#### Scenario: Namespace isolation

- GIVEN a component uses `useTranslation('clients')`
- WHEN `t('form.label.name')` is called
- THEN the key resolves from `src/locales/{lang}/clients.json` exclusively

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
