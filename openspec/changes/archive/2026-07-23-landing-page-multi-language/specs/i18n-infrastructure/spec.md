# Delta for i18n-infrastructure

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Locale File Structure

The system MUST provide 14 locale JSON files under `src/locales/{en,es}/` — one per namespace per language, including `appointments`. Keys SHALL follow `section.subsection.label` convention. Key parity is bidirectional: every key present in one language MUST have a corresponding entry in the other.

(Previously: key parity was unidirectional — only `es` keys required `en` counterparts. This did not catch keys added to `en` without matching `es` entries.)

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
