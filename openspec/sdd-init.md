# SDD Init — Peluclic (pfmaster)

**Date**: 2026-07-21  
**Mode**: Hybrid (Engram + OpenSpec)  
**Status**: ✅ SUCCESS — project evolved significantly since last scan (July 5)

---

## Executive Summary

pfmaster is now branded as **Peluclic** (README rename in commit `936935b`). Since the last scan on July 5, the project has completed 4 additional SDD cycles (8 total archived), added Playwright E2E testing, configured ESLint v9 with SonarQube, expanded from 3 bounded contexts to 5 (appointments + settings), and grown from 56 to ~99 test files. There are 8 active SDD changes in various phases, and one completed change (`listing-page-actions`) awaiting archive. Strict TDD remains ENABLED across all layers including E2E.

---

## Project Context

| Field | Value |
|-------|-------|
| Name | pfmaster (branded as Peluclic) |
| Description | Pet grooming and care management web application |
| Repository | https://github.com/XaviOutside/pfmaster |
| Last Scanned | 2026-07-21 |
| Source Code | ✅ Fully materialized (300+ files) |
| Language | TypeScript 5.6.3 (strict mode) |

---

## Changes Since Last Scan (2026-07-05 → 2026-07-21)

| Area | Before | After |
|------|--------|-------|
| **Linter** | NOT_CONFIGURED | ESLint v9.39.4 (flat config, SonarQube, React hooks, TS) |
| **E2E** | NOT_INSTALLED | Playwright 1.61 (3 spec files, 283 lines, playwright.config.ts) |
| **Bounded Contexts** | 3 (clients, pets, services) | 5 (+ appointments, settings) |
| **DB Models** | 3 (clients, pets, services) | 5 (+ appointments, company_settings) |
| **Test Files** | ~56 | ~99 (47 API + 49 frontend + 3 e2e) |
| **Archived Cycles** | 4 | 8 |
| **Active Changes** | 2 | 8 |
| **Specs** | 6 | 9 |
| **ADRs** | 0 | 1 (DRY & technical debt) |
| **Project Name** | pfmaster only | Branded as Peluclic |

---

## Stack Detection

| Component | Status | Detected Value | Evidence |
|-----------|--------|----------------|----------|
| Language | ✅ Confirmed | TypeScript 5.6.3 (strict mode) | `tsconfig.json`: `"strict": true`, `target: ES2022` |
| Runtime | ✅ Confirmed | Node.js (tsx for dev) | `tsx` in devDependencies, `npm run dev` uses `tsx watch` |
| Frontend Framework | ✅ Confirmed | React 19 + Vite 6 | `package.json`: react 19, vite 6; `vite.config.ts` |
| Styling | ✅ Confirmed | Tailwind CSS v4 | `src/index.css`: `@import "tailwindcss"`; `@tailwindcss/vite` plugin |
| Backend Framework | ✅ Confirmed | Express 4.21 | `package.json`; `api/index.ts` Express app wiring |
| ORM | ✅ Confirmed | Prisma 5.22 | `prisma/schema.prisma` (5 models); `@prisma/client` |
| Database | ✅ Confirmed | MySQL 8.0 | `docker-compose.yml` `mysql:8.0`; Prisma datasource `mysql` |
| Logging | ✅ Confirmed | Pino 9.5 | `package.json`; `api/observability/logger.ts` |
| Dev Environment | ✅ Confirmed | Docker Compose | `docker-compose.yml` (api, app, db services) |
| Test Runner | ✅ Confirmed | Vitest 2.1.3 | 3 config files; ~99 test files total |
| Coverage | ✅ Confirmed | @vitest/coverage-v8 | 80% lines threshold for API |
| E2E Framework | ✅ Confirmed | Playwright 1.61 | `playwright.config.ts`; 3 spec files in `e2e/` |
| Linter | ✅ Confirmed | ESLint v9.39.4 | Flat config with SonarQube, React hooks, TypeScript |
| Security Scanner | ✅ Confirmed | Snyk | `npm run security` (dependency + SAST) |
| Formatter | ❌ Missing | N/A | No Prettier or .editorconfig |

---

## Architecture Patterns

| Pattern | Status | Notes |
|---------|--------|-------|
| Clean Architecture | ✅ Fully implemented | 5 bounded contexts (clients, pets, services, appointments, settings) |
| Repository Pattern | ✅ Implemented | Domain interfaces → Prisma adapters in infrastructure/ |
| Atomic Design (Frontend) | ✅ Fully implemented | atoms/, molecules/, organisms/, pages/ |
| Dependency Injection | ✅ Manual wiring | `api/index.ts` wires repositories → use cases → controllers → routers |
| Soft Delete | ✅ Implemented | All contexts support soft delete via `deletedAt` column |
| Deactivate/Reactivate | ✅ Implemented | Status as TINYINT (0=inactive, 1=active) |
| FTS Search | ✅ Implemented | MySQL FULLTEXT indexes; sanitized via `sanitizeFtsQuery()` |
| No FK Constraints | ✅ Enforced | Column comments document relationships |
| Enum as TINYINT | ✅ Enforced | Status/sex/lang fields use union types + value mappings |
| Prices as Integer Cents | ✅ Enforced | `Service.price` is INT (e.g., 2500 = $25.00) |
| Observability | ✅ Partially | Pino logger; Sentry for error tracking |
| ADRs | ✅ Started | 1 ADR: DRY & Technical Debt Principles |

---

## Testing Capabilities

| Layer | Tests | Command | Environment | Coverage |
|-------|-------|---------|-------------|----------|
| API Unit | 47 files | `npm test` | node | ✅ 80% lines |
| API Integration | 3 files | `npm run test:integration` | node (forks, sequential) | ❌ |
| Frontend | 49 files | `npm run test:frontend` | jsdom | ❌ |
| E2E | 3 spec files | `npx playwright test` | chromium | ❌ |
| **Total** | **~99** | — | — | — |

### Strict TDD

| Setting | Value |
|---------|-------|
| Enabled | ✅ Yes |
| Reason | Vitest + Playwright detected; ~99 test files; coverage enforced for API |
| All Layers Covered | ✅ Unit, Integration, Frontend, E2E |
| Gate Command | `npm run gate` (lint + build + test) |

---

## SDD Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Config | `openspec/config.yaml` | ✅ Updated 2026-07-21 |
| Testing Capabilities | `openspec/testing-capabilities.md` | ✅ Updated 2026-07-21 |
| Init Report | `openspec/sdd-init.md` | ✅ Updated 2026-07-21 |
| Specs | `openspec/specs/` | ✅ 9 specs |
| Archive | `openspec/changes/archive/` | ✅ 8 archived cycles |
| Active Changes | `openspec/changes/` | 🔄 8 active (1 pending archive) |
| Skill Registry | `.atl/skill-registry.md` | ✅ Updated 2026-07-21 |

### Completed SDD Cycles (8 archived)

| ID | Title | Archived |
|----|-------|----------|
| 2026-06-24-clients-frontend | Client Management Frontend | ✅ |
| 2026-06-28-create-the-model-pet-in-a-new-api | Pet Model in New API | ✅ |
| 2026-06-28-services-api | Services API | ✅ |
| 2026-06-28-link-pet-services | Link Pet Services | ✅ |
| 2026-07-11-client-listing-enhancements | Client Listing Enhancements | ✅ |
| 2026-07-11-public-layout-no-sidebar | Public Layout without Sidebar | ✅ |
| 2026-07-19-appointment-calendar | Appointment Calendar | ✅ |
| 2026-07-19-i18n-literals | i18n Literals Extraction | ✅ |

### Active SDD Changes (8)

| ID | Phase | Description |
|----|-------|-------------|
| company-settings | apply | Company name, work calendar, language preference |
| demo-mode-localstorage | apply | Demo mode persistence via localStorage |
| petmanager | explore | Pet management enhancements |
| add-client-notes-column | apply | Add notes column to clients |
| client-fts-search | apply | Full-text search for clients |
| listing-page-actions | ✅ completed | Listing page action buttons (verify done, needs archive) |
| listing-pagination | apply | Pagination for listing pages |
| move-last-service-and-contact-fields | propose | Move last service date and contact fields |

---

## Persistence Configuration

| Setting | Value |
|---------|-------|
| Mode | Hybrid |
| Engram | ✅ Enabled — topic key: `sdd-init/peluclic` |
| OpenSpec | ✅ Enabled |
| Sync Interval | Session close |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| 8 active SDD changes | ⚠️ WARNING | Risk of merge conflicts and overlapping scopes. Prioritize and sequence. |
| `listing-page-actions` unarchived | ⚠️ INFO | Verify report exists; ready for `sdd-archive`. |
| `move-last-service-and-contact-fields` missing design/specs | ⚠️ INFO | Incomplete change — needs design and spec phases. |
| No formatter configured | ⚠️ INFO | Prettier not installed. ESLint handles logic/quality but not formatting. |
| No unified test command | ℹ️ INFO | 3 separate test commands + E2E. Consider `npm run test:all`. |
| Integration tests depend on Docker | ℹ️ INFO | Requires `docker compose up -d db` before running. |

---

## Next Recommended Steps

1. **Archive `listing-page-actions`** — verify report exists, ready for `sdd-archive`
2. **Prioritize active changes** — 8 active is a lot; sequence them by dependency (company-settings → appointment features, etc.)
3. **Complete `move-last-service-and-contact-fields`** — add design.md and specs/ to finish the SDD cycle
4. **Add Prettier** — `npm install -D prettier` + `.prettierrc` for formatting consistency
5. **Add `npm run test:all`** — unified command for all test suites
6. **Resume `petmanager` exploration** — `/sdd-explore` for the active explore change

---

*Generated by sdd-init skill · Peluclic (pfmaster) · 2026-07-21*
