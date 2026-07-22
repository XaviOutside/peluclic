# Tasks: Landing Page Multi-Language Support

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~50 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

Not needed — well under 400-line budget. Single PR covers all changes.

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Extend LanguageSwitcher, fix translation, integrate into LandingPage | Single PR | `npm run test:frontend` | N/A (no runtime harness needed for UI-only change) | Revert 5 files: LanguageSwitcher.tsx, LandingPage.tsx, es/landing.json, both test files |

## Phase 1: Foundation — RED

- [x] 1.1 RED: Create `src/components/molecules/LanguageSwitcher.test.tsx` — render `<LanguageSwitcher className="my-pill" />`, assert `button.className` includes `my-pill` (fails: `className` prop does not exist yet)
- [x] 1.2 RED: Extend `src/pages/LandingPage.test.tsx` — assert a `button` containing the `language` Material Symbol icon exists in rendered output (fails: LanguageSwitcher not yet in page)

## Phase 2: Foundation — GREEN

- [x] 2.1 GREEN: Add `{ className }: { className?: string }` prop to `LanguageSwitcher` in `src/components/molecules/LanguageSwitcher.tsx`, merge into button className via template literal — verify tests from 1.1 now pass
- [x] 2.2 Add `"hero.loginComingSoon"` key to `src/locales/es/landing.json`: `"El inicio de sesión estará disponible en una versión futura. Prueba la demo para explorar todas las funciones con datos de ejemplo."`

## Phase 3: Integration — GREEN

- [x] 3.1 GREEN: Import `LanguageSwitcher` in `src/pages/LandingPage.tsx`, add `relative` to hero `<section>`, render `<LanguageSwitcher className="absolute top-4 right-4 z-10 w-auto rounded-full px-3 py-1.5 text-sm" />` as hero's first child — verify tests from 1.2 now pass

## Phase 4: Verification

- [x] 4.1 Run `npm run test:frontend` — confirm all 5 affected test assertions pass (className forwarding, toggle behavior, LandingPage presence, backward compatibility, existing LandingPage tests unchanged)
