import { vi } from 'vitest';

/**
 * Mock useTranslation from react-i18next.
 * Returns t: (key) => key so tests pass with raw key strings.
 * Use this in test files that mount components using useTranslation().
 *
 * The `t` function has a STABLE identity across renders: components that list
 * `t` in effect dependencies must not re-run effects on every render.
 *
 * When called with `{ returnObjects: true }`, returns a structured array of
 * placeholder objects so data-driven components that iterate over i18n data
 * can call .map() and render each entry.
 */
const t = (key: string, options?: { returnObjects?: boolean }): string | Array<Record<string, unknown>> => {
  if (options?.returnObjects) {
    // Return a placeholder array so .map() works in data-driven components.
    // Each entry contains i18n-key strings for title + content assertions.
    if (key === 'privacy.sections') {
      const MOCK_SECTION_COUNT = 10;
      return Array.from({ length: MOCK_SECTION_COUNT }, (_, i) => ({
        title: `privacy.sections.${i}.title`,
        content: `privacy.sections.${i}.content`,
      }));
    }
    return [];
  }
  return key;
};
const changeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t,
    i18n: {
      language: 'en',
      changeLanguage,
    },
  }),
  initReactI18next: {
    type: '3rdParty' as const,
    init: () => {},
  },
}));
