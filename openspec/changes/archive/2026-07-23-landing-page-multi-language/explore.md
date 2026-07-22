# Exploration: Landing Page Multi-Language Support

## Current State

### i18n Infrastructure (`src/i18n.ts`)

- **i18next** configured with `LanguageDetector` (order: `['navigator']`, no localStorage caching)
- **Fallback language**: `en`
- **Supported languages**: `en`, `es`
- **Namespaces loaded**: `common`, `clients`, `pets`, `services`, `landing`, `validation`, `settings`, `appointments`
- **`initializeLanguage()`**: Called in `main.tsx` before React mounts. Fetches company settings via API, maps `defaultLang` (TINYINT 0→en, 1→es) through `LANG_MAP`, and applies `i18n.changeLanguage()`. Fails silently to navigator detection on error.
- **`<html lang>` attribute**: Synced on `languageChanged` event and set initially.

### Language Enums & Maps (`src/types/settings.ts`)

```ts
export type Lang = 0 | 1;           // 0=English, 1=Spanish
export const LANG_MAP: Record<Lang, 'en' | 'es'> = { 0: 'en', 1: 'es' };
export const LANG_REVERSE_MAP: Record<'en' | 'es', Lang> = { en: 0, es: 1 };
```

### Existing LanguageSwitcher Component (`src/components/molecules/LanguageSwitcher.tsx`)

A toggle button (NOT a Select dropdown) that:
- Uses `useTranslation('common')` for labels (`common.language.en` / `common.language.es`)
- Displays the **opposite** language label (if current = `es`, shows "English")  
- Calls `i18n.changeLanguage(next)` on click
- Styled as a full-width sidebar button with `material-symbols` icon
- **Only used in `Sidebar.tsx`** (DashboardLayout) — NOT on any public page

### SettingsPage Language Selector (`src/pages/SettingsPage.tsx`)

Uses the `<Select>` atom component:
- Hardcoded `langOptions: SelectOption[] = [{ value: '0', label: t('languageEnglish') }, { value: '1', label: t('languageSpanish') }]`
- Labels from `settings` namespace (`languageEnglish`, `languageSpanish`)
- Calls `i18n.changeLanguage(langCode)` on save

### LandingPage (`src/pages/LandingPage.tsx`)

- Uses `useTranslation('landing')` only — no `common` namespace loaded
- Rendered inside `<PublicLayout>` (bare `<main>` with padding, no header/sidebar)
- Has: hero section, features bento grid, footer
- **No language selector present**
- Both CTA buttons use raw `<button>` elements, not the `Button` atom

## Affected Areas

| File | Why Affected |
|---|---|
| `src/pages/LandingPage.tsx` | Add language selector UI |
| `src/pages/LandingPage.test.tsx` | Add tests for language selector behavior |
| `src/locales/es/landing.json` | Missing `hero.loginComingSoon` key |
| `src/locales/en/landing.json` | May need a language-related translation key |
| `src/components/molecules/LanguageSwitcher.tsx` | May need `className` prop for landing page styling |
| `src/components/templates/PublicLayout.tsx` | Alternative: add selector here for all public pages |
| `src/locales/en/common.json` | Already has `language.en`, `language.es`, `language.switchAria` |
| `src/locales/es/common.json` | Already has `language.en`, `language.es`, `language.switchAria` |

## Landing Page Translation Coverage

### Keys present in `landing.en.json` but MISSING in `landing.es.json`

```
hero.loginComingSoon — "Account login coming in a future version..."
```

This key is referenced in the English file but has NO Spanish equivalent. The landing page renders the "Log In" button as `disabled` — when clicked, it's supposed to show this message. The missing translation is a bug regardless of this feature.

### Keys used by the LandingPage component

| Key | en | es | Status |
|---|---|---|---|
| `hero.title` | ✅ | ✅ | OK |
| `hero.subtitle` | ✅ | ✅ | OK |
| `hero.cta` | "Try Demo" | "Prueba gratis" | OK — different copy |
| `hero.demo` | "Log In" | "Ver Demo" | OK — different copy |
| `hero.loginComingSoon` | ✅ | ❌ MISSING | **BUG** |
| `features.title` | ✅ | ✅ | OK |
| `features.scheduling.*` | ✅ | ✅ | OK |
| `features.clients.*` | ✅ | ✅ | OK |
| `features.pets.*` | ✅ | ✅ | OK |
| `features.services.*` | ✅ | ✅ | OK |
| `footer.*` | ✅ | ✅ | OK |
| `register.*` | ✅ | ✅ | OK |

### Common language keys (already available, no new translations needed)

| Key | en | es |
|---|---|---|
| `language.en` | "English" | "English" |
| `language.es` | "Spanish" | "Español" |
| `language.switchAria` | "Switch language to {{lang}}" | "Cambiar idioma a {{lang}}" |

These live in the `common` namespace. The LandingPage currently uses only the `landing` namespace — adding a language selector means the component needs `useTranslation('common')` as well (or a nested component).

## UI Patterns Available

### Select Component API (`src/components/atoms/Select.tsx`)

```ts
export interface SelectOption { value: string; label: string; }
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
}
```

Used by SettingsPage: passes `value` (controlled), `onChange`, `label`, `options`, `data-testid` via spread props.

### LanguageSwitcher Molecule (`src/components/molecules/LanguageSwitcher.tsx`)

```ts
export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  // ... toggle between en/es
  // Renders: <button> + icon + opposite-language label
}
```

Styled for sidebar use (full-width, `rounded-lg`, `px-4 py-2`, `hover:bg-secondary-container`). No `className` prop — not customizable.

### Button Atom (`src/components/atoms/Button.tsx`)

Available but the landing page currently uses raw `<button>` elements with inline Tailwind classes. The Button atom has `variant`, `size`, `loading`, `disabled` props.

### Input Atom (`src/components/atoms/Input.tsx`)

Available but not relevant to this feature.

## Approaches

### Approach A: Reuse LanguageSwitcher with className prop (Recommended)

Add an optional `className` prop to the existing `LanguageSwitcher` molecule. Place it in the top-right of the landing page hero section with custom styling for a floating/minimal look.

- **Pros**: Reuses existing component, single source of truth for language toggle logic, follows DRY principle
- **Cons**: Modifies an existing molecule (must verify Sidebar still works), toggle-only behavior (no Select dropdown)
- **Effort**: Low — ~30 lines of code + existing test updates

### Approach B: Add Select dropdown to LandingPage

Mimic the SettingsPage pattern — create a `<Select>` in the landing page with English/Spanish options, styled to be compact. This would be inline in `LandingPage.tsx` or extracted as a small component.

- **Pros**: Consistent with SettingsPage pattern, uses existing `Select` atom, can be positioned anywhere
- **Cons**: Duplicates language-switching logic, Select dropdown takes more space than a toggle, doesn't reuse `LanguageSwitcher`
- **Effort**: Low-Medium — would need a small wrapper component or inline logic

### Approach C: Add language selector to PublicLayout

Place the language selector in `PublicLayout` so it appears on ALL public pages (LandingPage + RegisterPage), not just the landing page.

- **Pros**: Consistent across all public pages, future-proof (login/register pages get it for free)
- **Cons**: Changes scope of this feature, PublicLayout is currently bare, design may not fit RegisterPage
- **Effort**: Medium — changes layout architecture

### Approach D: Create a dedicated LandingLanguageSelector component

New molecule component specifically designed for the landing page aesthetic. Could use small flag buttons or a styled toggle.

- **Pros**: Full design freedom, no modification of existing components
- **Cons**: Yet another language-switching component (DRY violation), more code to maintain
- **Effort**: Medium

## Recommendation

**Approach A** — Extend `LanguageSwitcher` with a `className` prop.

1. Add optional `className?: string` to `LanguageSwitcher` props, merge it into the button's `className`
2. Add `LanguageSwitcher` to the `LandingPage` in the top-right of the hero section (above the hero content, positioned absolutely or in a small flex header row)
3. Style it as a compact pill/toggle: `rounded-full`, `px-3 py-1.5`, transparent background, subtle hover
4. Ensure `LandingPage` imports `useTranslation('common')` (via the `LanguageSwitcher` component, which already uses it)
5. Fix the missing `hero.loginComingSoon` translation in `landing.es.json`
6. Add test coverage for the language toggle behavior on the landing page

### Why not Approach B (Select)?

A Select dropdown is overkill for a binary choice. The SettingsPage uses it because it's a form field alongside other settings. The landing page isn't a form — a compact toggle is more appropriate for the context.

### Why not Approach C (PublicLayout)?

The scope of this change is specifically the landing page. Extending to all public pages would be scope creep without a clear requirement.

### UI Placement

```
┌─────────────────────────────────────────────────────┐
│                                          [🌐 English] │  ← top-right, absolute/float
│                                                       │
│   Manage your grooming salon with ease.              │
│   Pawsitive Manager helps you streamline...          │
│                                                       │
│   [Try Demo]  [Log In]                                │
│                                                       │
│   ┌──────────────────────┐                            │
│   │                      │                            │
│   └──────────────────────┘                            │
└─────────────────────────────────────────────────────┘
```

The toggle would be positioned in the top-right corner of the hero section, styled as a subtle pill with the language icon and current/opposite language label. On mobile, it stays top-right.

## Risks

- **Scope creep into PublicLayout**: Tempting to add the selector to `PublicLayout`, but that changes multiple pages and goes beyond the landing page scope.
- **LanguageSwitcher Sidebar regression**: Adding a `className` prop must not break the existing Sidebar usage. Verify with existing tests.
- **Missing `hero.loginComingSoon` translation**: This is a pre-existing bug that should be fixed as part of this change (or a quick dependency fix).
- **Test mock compatibility**: The existing `test-utils/i18n.ts` mock returns raw keys — `LanguageSwitcher` uses `t('language.en')` which would render as `"language.en"`. Tests need to verify the toggle is present, not the exact text.
- **i18n namespace loading**: `LanguageSwitcher` uses `useTranslation('common')`. If `LandingPage` only uses `useTranslation('landing')`, the `common` namespace is still loaded by i18next at init — no issue. But test setup must account for it.

## Ready for Proposal

**Yes** — all necessary infrastructure exists. The change is well-scoped and the approach is clear. The only open question is whether to also fix the missing Spanish `hero.loginComingSoon` translation in this same change (recommended: yes).
