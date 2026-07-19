# Delta for i18n Infrastructure

## MODIFIED Requirements

### Requirement: i18n Framework Configuration

The system MUST initialize react-i18next at app startup with 6 namespaces (`common`, `landing`, `clients`, `pets`, `services`, `validation`), `i18next-browser-languagedetector`, and `en` fallback. The `<html lang>` attribute SHALL sync to the active language.

Language detection priority on app mount: (1) stored `defaultLang` fetched from `GET /api/v1/settings` — applied before first render, (2) `navigator.language` as fallback when settings fetch fails or returns no row. The LanguageSwitcher component MAY override the session language after initialization.

(Previously: language detection used only navigator.language — no stored preference source existed.)

#### Scenario: Stored preference applied before navigator

- GIVEN settings.defaultLang=1 (Spanish)
- WHEN the app initializes and settings are fetched
- THEN `i18next.language` is `"es"` and `<html lang="es">` is set; navigator IS NOT consulted

#### Scenario: Spanish browser preference (fallback)

- GIVEN `navigator.language` returns `"es-ES"` and settings fetch fails
- WHEN the app initializes
- THEN `i18next.language` is `"es"` and `<html lang="es">` is set (navigator fallback)

#### Scenario: English browser preference (fallback)

- GIVEN `navigator.language` returns `"en-US"` and settings fetch fails
- WHEN the app initializes
- THEN `i18next.language` is `"en"` and `<html lang="en">` is set

#### Scenario: Unsupported language fallback

- GIVEN `navigator.language` returns `"fr-FR"` (not supported) and settings fetch fails
- WHEN the app initializes
- THEN language falls back to `"en"`

#### Scenario: LanguageSwitcher overrides stored preference for session

- GIVEN stored defaultLang=1 (es) and active language is Spanish
- WHEN user switches to English via LanguageSwitcher
- THEN session language becomes `"en"`; stored preference NOT modified
