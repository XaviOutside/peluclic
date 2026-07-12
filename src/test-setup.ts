import '@testing-library/jest-dom/vitest';
import './test-utils/i18n'; // Mock useTranslation — returns keys as values
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
