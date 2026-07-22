# Design: Landing Page Multi-Language Support

## Technical Approach

Extend the existing `LanguageSwitcher` molecule with an optional `className` prop, place it in the landing page hero with absolute positioning and a compact pill style, and restore translation key parity between `en/landing.json` and `es/landing.json`. No new components, no i18n config changes — reuse only.

---

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **A**: Create new `LanguagePill` atom | DRY violation — duplicates toggle logic | ❌ |
| **B**: Add `className?: string` to `LanguageSwitcher` | Backward-compatible; Sidebar call sites unchanged | ✅ |
| **C**: Wrap LanguageSwitcher in a positioned div | Extra DOM node, no real benefit over className | ❌ |

**Rationale**: Option B follows existing patterns (`PageHeader` already has `className?: string` merged into its root element). Sidebar passes no `className` — existing call sites are zero-diff.

---

## Data Flow

```
User clicks LanguageSwitcher pill (landing page)
  → toggleLanguage() reads i18n.language
  → i18n.changeLanguage('es'|'en')
  → i18next fires languageChanged event
  → React re-renders ALL useTranslation() hooks (landing namespace + common namespace)
  → Landing page hero/features/footer text updates
  → LanguageSwitcher label updates (common: language.en / language.es)
```

`common` namespace is loaded at i18next init — the LanguageSwitcher reads language labels from `common`, not `landing`. No namespace config change needed.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/molecules/LanguageSwitcher.tsx` | Modify | Add `className?: string` prop, merge into button's class list |
| `src/components/molecules/LanguageSwitcher.test.tsx` | Create | Test className forwarding + toggle behavior |
| `src/pages/LandingPage.tsx` | Modify | Import LanguageSwitcher, add `relative` to hero section, render with compact pill className |
| `src/pages/LandingPage.test.tsx` | Modify | Assert LanguageSwitcher presence in hero |
| `src/locales/es/landing.json` | Modify | Add `hero.loginComingSoon` key (missing — parity with `en/landing.json`) |

---

## Component Changes — LanguageSwitcher.tsx

**Before** (current):
```tsx
export default function LanguageSwitcher() {
  // ...
  return (
    <button onClick={toggleLanguage}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-2 font-label text-label-sm text-on-surface-variant transition-colors hover:bg-secondary-container"
      aria-label={t('language.switchAria', { lang: currentLabel })}
    >
```

**After**:
```tsx
export default function LanguageSwitcher({ className }: { className?: string }) {
  // ...
  return (
    <button onClick={toggleLanguage}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 font-label text-label-sm text-on-surface-variant transition-colors hover:bg-secondary-container ${className ?? ''}`}
      aria-label={t('language.switchAria', { lang: currentLabel })}
    >
```

**Why template literal**: Follows `PageHeader` pattern (`className = ''` default + interpolation). CSS cascade ensures later classes in the string override earlier ones at equal specificity — `w-auto` from LandingPage's className overrides the default `w-full` when both appear.

---

## Page Changes — LandingPage.tsx

**Import** (after existing imports):
```tsx
import LanguageSwitcher from '@/components/molecules/LanguageSwitcher';
```

**Hero section** — add `relative` to the `<section>` and place LanguageSwitcher as first child:

```tsx
<section className="relative mx-auto max-w-[--container-max] px-[--spacing-margin-mobile] py-12 md:grid md:grid-cols-2 md:items-center md:gap-12 md:px-[--spacing-margin-desktop] md:py-24">
  <LanguageSwitcher
    className="absolute top-4 right-4 z-10 w-auto rounded-full px-3 py-1.5 text-sm"
  />
  <div className="space-y-6">
    {/* existing hero content — no changes */}
```

**Why absolute positioning**: The hero uses CSS Grid (`md:grid md:grid-cols-2`). Absolute positioning removes the LanguageSwitcher from the grid flow so it sits as a floating pill over the hero without disrupting the two-column layout. `z-10` ensures it renders above the hero image on mobile where sections stack vertically.

**Compact pill classes**: `w-auto rounded-full px-3 py-1.5 text-sm` — overrides the Sidebar-style defaults (`w-full rounded-lg px-4 py-2 text-label-sm`) for a tighter, landing-page-appropriate appearance.

---

## Translation Fix — es/landing.json

Add the missing key inside `hero` (currently has: title, subtitle, cta, demo — no `loginComingSoon`):

```json
"loginComingSoon": "El inicio de sesión estará disponible en una versión futura. Prueba la demo para explorar todas las funciones con datos de ejemplo."
```

**Why**: `en/landing.json` already contains this key. Both files must have the same key structure for `useTranslation('landing')` to work correctly in all languages. Without it, `t('hero.loginComingSoon')` resolves to the key string when Spanish is active.

---

## State Flow

```
LanguageSwitcher rendered with i18n.language ('en' by default)
  ↓
Click → toggleLanguage()
  → i18n.language === 'es' ? i18n.changeLanguage('en') : i18n.changeLanguage('es')
  → react-i18next fires languageChanged internally
  → ALL components with useTranslation('landing') re-render with new translations
  → ALL components with useTranslation('common') re-render (LanguageSwitcher label updates)
  → LandingPage content switches English ↔ Spanish
```

Default language: **English** (`i18n.language` starts as `'en'` at i18next init). The toggle flips between the two supported locales.

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (LanguageSwitcher) | `className` prop forwards to button element | Render with `className="test-class"`, assert `button.className` includes `test-class` |
| Unit (LanguageSwitcher) | Toggle calls `i18n.changeLanguage` | Mock `react-i18next`, click button, assert `changeLanguage` called with correct locale |
| Unit (LandingPage) | LanguageSwitcher renders in hero | Render LandingPage, assert button with language icon exists |
| Integration | Hero text changes on language switch | Mock i18n with real `changeLanguage` that updates `language` state, assert text transitions |

**Test infrastructure**: The existing `src/test-utils/i18n.ts` mock returns `t: (key) => key` (keys as values) and exposes `i18n.changeLanguage = vi.fn()` with `language: 'en'`. Tests should use this existing mock pattern — no new test utilities needed.

**LanguageSwitcher.test.tsx** (new file — TDD Red first):
1. **Red**: Write test that renders `<LanguageSwitcher className="my-pill" />` and asserts the button element has class `my-pill` — fails because `className` prop doesn't exist yet
2. **Green**: Add `className` prop and merge it
3. **Red**: Write test that clicks the button and asserts `changeLanguage` was called
4. **Green**: Already passes (toggle logic unchanged)

**LandingPage.test.tsx** (modification):
- Add assertion that a button renders with a language-switch-like pattern (e.g., by icon content or `aria-label` pattern)
- Existing tests continue passing because the LanguageSwitcher is a non-blocking addition

---

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

---

## Migration / Rollout

No migration required. Rollback: revert the 3 modified files + delete the new test file. No DB or API changes.

---

## Open Questions

None.
