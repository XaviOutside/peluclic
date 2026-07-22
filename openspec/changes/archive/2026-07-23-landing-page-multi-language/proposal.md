# Proposal: Landing Page Multi-Language Support

## Intent

The landing page renders exclusively in the browser-detected language. Visitors have no mechanism to switch languages without entering the app. Add a language toggle to the landing page, reusing the existing `LanguageSwitcher` component, so any visitor can switch between English and Spanish from the public entry point.

## Scope

### In Scope
- Extend `LanguageSwitcher` with optional `className` prop for context-specific styling
- Place `LanguageSwitcher` in landing page hero top-right, styled as a compact pill
- Fix missing `hero.loginComingSoon` Spanish translation in `es/landing.json`

### Out of Scope
- Adding language selector to `PublicLayout` (affects RegisterPage — separate concern)
- Creating a new language-switching component (DRY: reuse existing molecule)
- Multi-language content beyond landing page (already functional)
- New translation system or i18n framework changes

## Capabilities

### New Capabilities

None — existing infrastructure covers all needed behavior.

### Modified Capabilities
- `i18n-infrastructure`: `LanguageSwitcher` gains optional `className` prop; `es/landing.json` gains missing `hero.loginComingSoon` key to restore key parity with `en/landing.json` per spec requirement

## Approach

**Extend, don't duplicate.** `LanguageSwitcher` already handles toggle logic, labels, and `i18n.changeLanguage()`. Add `className?: string` to its props and merge it into the button's existing class list. On the landing page, place the component in the hero section top-right with `absolute` positioning and a compact pill style (`rounded-full px-3 py-1.5 text-sm`). The `common` namespace (where language labels live) is already loaded by i18next at init — no namespace configuration changes needed.

Fix `es/landing.json`: add `"loginComingSoon": "El inicio de sesión estará disponible en una versión futura. Prueba la demo para explorar todas las funciones con datos de ejemplo."`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/molecules/LanguageSwitcher.tsx` | Modified | Add `className` prop |
| `src/pages/LandingPage.tsx` | Modified | Import and render `LanguageSwitcher` in hero |
| `src/locales/es/landing.json` | Modified | Add `hero.loginComingSoon` key |
| `src/components/molecules/LanguageSwitcher.test.tsx` | Modified | Test `className` prop behavior |
| `src/pages/LandingPage.test.tsx` | Modified | Test language toggle presence |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `className` prop breaks existing Sidebar usage | Low | Sidebar passes no `className` — existing call sites unchanged |
| Test mock renders raw keys (`language.en`) instead of translated text | Low | Use `data-testid` for selector presence; assert toggle renders, not label text |

## Rollback Plan

Revert three files: remove `className` prop from `LanguageSwitcher`, remove `LanguageSwitcher` import from `LandingPage`, revert `es/landing.json`. No DB or API changes.

## Dependencies

None. `react-i18next`, `LanguageSwitcher`, and both locale namespaces are already in place.

## Success Criteria

- [ ] Language toggle appears on landing page hero top-right
- [ ] Clicking the toggle switches between English and Spanish for all landing page content
- [ ] Existing Sidebar `LanguageSwitcher` continues to function identically
- [ ] `hero.loginComingSoon` renders correctly in both English and Spanish
