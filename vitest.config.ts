import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['api/**/*.test.ts'],
    exclude: ['api/**/*.integration.test.ts', 'node_modules/**'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['api/**/*.ts'],
      exclude: ['api/**/*.test.ts', 'api/**/*.integration.test.ts'],
      thresholds: {
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, 'api'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
