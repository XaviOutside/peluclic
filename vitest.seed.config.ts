import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['prisma/seed.test.ts'],
    environment: 'node',
    // Seed tests need a real MySQL connection — only run locally with Docker
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, 'api'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
