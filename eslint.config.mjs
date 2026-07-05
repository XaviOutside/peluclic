import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

export default tseslint.config(
  /* ------------------------------------------------------------------ */
  /*  Global ignores                                                     */
  /* ------------------------------------------------------------------ */
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.atl/',
      'e2e/',
      'prisma/generated/',
      'coverage/',
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  Base: JavaScript recommended + TypeScript recommended               */
  /* ------------------------------------------------------------------ */
  js.configs.recommended,
  ...tseslint.configs.recommended,

  /* ------------------------------------------------------------------ */
  /*  SonarQube — bug detection, code smells, security, complexity        */
  /* ------------------------------------------------------------------ */
  sonarjs.configs.recommended,

  /* ------------------------------------------------------------------ */
  /*  Backend — api/ (Node.js, Express, Prisma)                           */
  /* ------------------------------------------------------------------ */
  {
    files: ['api/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Enforce strict typing on the backend
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // SonarQube — cognitive complexity threshold for business logic
      'sonarjs/cognitive-complexity': ['error', 18],
    },
  },

  /* ------------------------------------------------------------------ */
  /*  Frontend — src/ (React 19, Vite, Tailwind)                          */
  /* ------------------------------------------------------------------ */
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: { version: '19.0' },
    },
    rules: {
      // React hooks
      ...reactHooks.configs.recommended.rules,
      // React core
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Vite HMR
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // TypeScript relaxed for UI code
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // SonarQube — cognitive complexity for components
      'sonarjs/cognitive-complexity': ['error', 25],
    },
  },

  /* ------------------------------------------------------------------ */
  /*  Test files — relax rules that conflict with test patterns           */
  /* ------------------------------------------------------------------ */
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**'],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  /* ------------------------------------------------------------------ */
  /*  Config files                                                       */
  /* ------------------------------------------------------------------ */
  {
    files: ['*.config.{ts,js,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
