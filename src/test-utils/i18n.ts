import { vi } from 'vitest';

/**
 * Mock useTranslation from react-i18next.
 * Returns t: (key) => key so tests pass with raw key strings.
 * Use this in test files that mount components using useTranslation().
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));
