# Proposal: Extract All Frontend Literals for Multi-Language Support

## Intent

~140 hardcoded user-facing strings across 35+ frontend files are in a chaotic Spanish/English mix. No i18n library exists. The UI needs normalized translations in Spanish and English with a framework that supports future language additions.

## Scope

### In Scope
- Install `react-i18next` + `i18next` + `i18next-browser-languagedetector`
- Create 12 locale JSON files (6 namespaces × 2 languages: en, es)
- Replace all JSX strings and utility-formatted strings with `t('key')` calls
- Fix `formatDate`/`formatSex`/`formatDuration` to accept locale-aware params
- Extract duplicated `MODULE_TABS` to a shared hook
- Update ~35 test files to mock `useTranslation()`
- Configure language detection via `navigator.language` with `en` fallback

### Out of Scope
- Backend API error messages (~15 strings remain as-is)
- Language switcher UI toggle (future)
- User preference persistence
- RTL or languages beyond en/es
- E2E test i18n adaptation

## Capabilities

### New Capabilities
- `i18n-infrastructure`: Translation framework (react-i18next), 12 locale JSON files (6 namespaces × 2 languages), language detection, `useTranslation` hook, and locale-aware formatting in `formatDate`/`formatSex`/`formatDuration`

### Modified Capabilities
None — all existing specs describe behavior, not literal strings. i18n changes only HOW strings render, not what functionality exists.

## Approach

**Library**: react-i18next + i18next — de facto React i18n standard (~5KB, TypeScript support, interpolation, namespaces).

**File structure**: `src/locales/{en,es}/{common,landing,clients,pets,services,validation}.json`

**Key convention**: `namespace.section.key` (e.g., `clients.form.label.name`)

**Implementation order**:
1. Install deps + create `src/i18n.ts` config
2. Write all 12 locale JSON files with normalized translations
3. Replace hardcoded strings → `t('key')` in components, pages, and utilities
4. Extract `MODULE_TABS` to shared `useModuleTabs()` hook
5. Fix `formatDate`/`formatSex`/`formatDuration` to use i18n locale
6. Update all tests with `useTranslation` mocks

**Exclusions**: Material Symbols icon names (`group`, `pets`, etc.) — Google Fonts identifiers, not translatable.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/locales/` | New | 12 JSON files + `i18n.ts` config |
| `src/pages/` | Modified | 15 pages: replace all JSX text with `t()` |
| `src/components/organisms/` | Modified | 10 orgs: field labels, buttons, placeholders |
| `src/components/molecules/` | Modified | 8 mols: form fields, status badges, pagination |
| `src/utils/format.ts` | Modified | Accept locale param, drop hardcoded `'en-US'` |
| `src/utils/validation.ts` | Modified | Export keys instead of hardcoded messages |
| Test files (~35) | Modified | Mock `useTranslation` in all setups |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Test breakage (35 files reference hardcoded strings) | High | Global `useTranslation` mock returns key as fallback |
| Merge conflicts with active branches | Med | Schedule as single isolated change, rebase before PR |
| Missing a hardcoded string | Med | Grep audit for remaining unquoted text post-extraction |
| Interpolation variable mismatch across languages | Low | Review every `{{name}}` placeholder in both locale files |

## Rollback Plan

1. Revert the commit
2. Remove `react-i18next`, `i18next`, `i18next-browser-languagedetector` from `package.json`
3. Delete `src/locales/` and `src/i18n.ts`
4. Remove `I18nextProvider` wrapper if added to `main.tsx`
5. Run full test suite to confirm no dangling `t()` calls

## Dependencies

None — pure frontend package addition, no backend changes.

## Success Criteria

- [ ] All user-facing strings rendered via `t('key')` — zero hardcoded text in JSX
- [ ] Both `en` and `es` locale files complete and consistent (same key set)
- [ ] `navigator.language` detection works — switching browser language changes UI
- [ ] All 264+ frontend tests pass with translation mocks
- [ ] Material Symbols icon names untouched
- [ ] Zero build errors, zero lint warnings
