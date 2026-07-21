# Testing Capabilities — Peluclic (pfmaster)

**Status**: FULLY CONFIGURED  
**Last Updated**: 2026-07-21  
**Detection Mode**: Full codebase scan

## Summary

This project has a mature Vitest setup across three layers: API unit tests (47 files), API integration tests (3 files), and frontend component/hook tests (49 files). Coverage is enforced at the API layer (80% lines threshold). E2E testing via Playwright is now fully configured with 3 spec files (283 lines total) — a major upgrade from the July 5 scan where it was missing entirely.

ESLint v9.39.4 with flat config and SonarQube is now active — also upgraded from NOT_CONFIGURED in the prior scan.

## Test Layers

| Layer | Framework | Runner | Coverage | Integrated | Notes |
|-------|-----------|--------|----------|------------|-------|
| API Unit | Vitest | `npm test` | ✅ 80% lines (v8) | ✅ | Config: `vitest.config.ts`, node env, 47 test files |
| API Integration | Vitest | `npm run test:integration` | ❌ | ✅ | Config: `vitest.integration.config.ts`, singleFork, 30s timeout, requires Docker MySQL, 3 test files |
| Frontend | Vitest + Testing Library | `npm run test:frontend` | ❌ | ✅ | Config: `vitest.frontend.config.ts`, jsdom env, `src/test-setup.ts`, 49 test files |
| E2E | Playwright 1.61 | `npx playwright test` | ❌ | ✅ | Config: `playwright.config.ts`, chromium, 3 spec files |

## Tools & Commands

| Tool | Status | Command | Notes |
|------|--------|---------|-------|
| Test Runner | ✅ Vitest 2.1.3 | `npm test` | API unit tests (default config) |
| API Unit | ✅ | `npm test` | `api/**/*.test.ts` (excl. integration) |
| API Integration | ✅ | `npm run test:integration` | `api/**/*.integration.test.ts`, sequential with 30s timeout |
| Frontend | ✅ | `npm run test:frontend` | `src/**/*.test.{ts,tsx}`, jsdom env |
| Frontend Watch | ✅ | `npm run test:frontend:watch` | Watch mode for TDD cycles |
| Coverage | ✅ | Runs with `npm test` | `@vitest/coverage-v8`, 80% lines threshold for API |
| Linter | ✅ ESLint v9.39.4 | `npm run lint` | Flat config (`eslint.config.mjs`) with SonarQube, React hooks, TypeScript |
| Linter Fix | ✅ | `npm run lint:fix` | Auto-fix linting errors |
| Formatter | ❌ Not Found | N/A | No Prettier config found |
| Type Checker | ✅ | `npm run build` | TypeScript `tsc` via `tsconfig.json` (strict mode) |
| E2E | ✅ Playwright 1.61 | `npx playwright test` | Chromium, 3 spec files in `e2e/` |
| Security Scan | ✅ | `npm run security` | Snyk dependency + SAST |
| SDLC Gate | ✅ | `npm run gate` | Lint + Build + Tests |

## Test Counts (files)

| Context | Unit Tests | Integration Tests | Total Files |
|---------|-----------|-------------------|-------------|
| `api/clients/` | ~10 | 1 | ~11 |
| `api/pets/` | ~10 | 1 | ~11 |
| `api/services/` | ~10 | 1 | ~11 |
| `api/appointments/` | ~8 | 0 | ~8 |
| `api/settings/` | ~5 | 0 | ~5 |
| `api/shared/` | ~4 | 0 | ~4 |
| `api/index.ts` | 1 | 0 | 1 |
| `src/components/` | ~15 | 0 | ~15 |
| `src/hooks/` | ~10 | 0 | ~10 |
| `src/pages/` | ~10 | 0 | ~10 |
| `src/services/` | ~5 | 0 | ~5 |
| `src/utils/` | ~5 | 0 | ~5 |
| `e2e/` | 0 | 0 | 3 (Playwright) |
| **Total** | **~96** | **3** | **~99** |

## Strict TDD Support

**Enabled**: ✅ Yes  
**Reason**: Vitest test runner detected across 3 configs with ~99 test files. Coverage thresholds enforced (80% API lines). Playwright now available for E2E verification.  
**Test Commands**:
- Unit/API: `npm test`
- Integration: `npm run test:integration` (Docker MySQL required)
- Frontend: `npm run test:frontend`
- Frontend watch: `npm run test:frontend:watch`
- E2E: `npx playwright test`
- All gates: `npm run gate`

## Frontend Testing Stack

- `@testing-library/react` — component rendering and queries
- `@testing-library/user-event` — user interaction simulation
- `@testing-library/jest-dom` — DOM matchers
- `jsdom` — browser environment simulation
- Setup: `src/test-setup.ts`

## E2E Testing Stack

- Playwright 1.61 with chromium project
- Tests in `e2e/` directory
- Web server auto-starts (`npm run dev`) on `http://localhost:5173`
- HTML reporter configured
- CI: retries=2, workers=1, trace on first retry

### E2E Specs

| File | Lines | Coverage |
|------|-------|----------|
| `e2e/appointments.spec.ts` | 58 | Appointment calendar flow |
| `e2e/client-search.spec.ts` | 139 | Client search and listing |
| `e2e/settings.spec.ts` | 86 | Company settings page |

## Code Quality

| Tool | Status | Notes |
|------|--------|-------|
| ESLint | ✅ v9.39.4 | Flat config: JS recommended, TS recommended, SonarQube, React hooks, React core, React Refresh |
| SonarQube | ✅ via ESLint | Cognitive complexity: 18 (backend), 25 (frontend) |
| Snyk | ✅ | Dependency + SAST (`npm run security`) |
| TypeScript | ✅ strict mode | `tsc` compilation gate in `npm run build` |
| Prettier | ❌ | Not configured — formatting inconsistency risk |

## Next Steps

1. **Archive completed changes**: `listing-page-actions` has a verify report — ready for `sdd-archive`
2. **Add Prettier** for consistent formatting across contributors
3. **Add unified test command** (`npm run test:all`) that runs all 3 Vitest suites
4. **Add CI/CD**: GitHub Actions running `npm run gate` + Playwright on PR
