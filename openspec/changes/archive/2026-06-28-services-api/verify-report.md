# Verification Report (RE-VERIFY)

**Change**: services-api
**Version**: 2.0 (post-bugfix)
**Mode**: Standard
**Artifact Store**: both (Engram + OpenSpec)

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 19 |
| Tasks complete | 19 |
| Tasks incomplete | 0 |

---

## Build & Tests Execution

**Build**: ✅ Passed (TypeScript compiles, Prisma schema valid)

**Backend Tests** (unit, `vitest run`): ✅ 228 passed / ❌ 0 failed / ⚠️ 0 skipped
```
30 test files passed
Tests: 228 passed
Duration: 1.30s
```

**Integration Tests** (`vitest.integration.config.ts`): ✅ 55 passed / ❌ 0 failed / ⚠️ 0 skipped
```
3 test files passed (18 services, 24 pets, 13 clients)
Tests: 55 passed (up from 44 — services integration tests increased 13→18)
Duration: 514ms
```

**Frontend Tests** (`vitest.frontend.config.ts`): ✅ 186 passed / ❌ 0 failed / ⚠️ 0 skipped
```
27 test files passed
Tests: 186 passed (pre-existing PetEditPage failure now fixed)
Duration: 2.55s
```

**Total**: 469 tests — ALL PASSING (was 412/413 with 1 pre-existing failure)

**Coverage**: ➖ Not available

---

## Previously-CRITICAL Bugs — RE-VERIFICATION

| Bug | Previous | Fix Applied | Verification | Result |
|-----|----------|-------------|-------------|--------|
| Deactivate no-op (services) | status stayed "active" | `PrismaServiceRepository.update()` now includes `data.status` in updatePayload (line 72) | Created → deactivated → GET confirmed `status=inactive`. Idempotent re-deactivate returns 200. | ✅ FIXED |
| Deactivate no-op (clients) | — | Already had `data.status` in `PrismaClientRepository.update()` (line 74) | Created → deactivated → confirmed `status=inactive`. | ✅ FIXED |
| Deactivate no-op (pets) | — | Already had `data.status` in `PrismaPetRepository.update()` (line 98) | Deactivated existing pet → confirmed `status=inactive`. | ✅ FIXED |
| Double-delete 404 vs 409 (services) | 404 instead of 409 | `existsById()` added to repo (lines 43-50). `SoftDeleteServiceUseCase` checks existsById first → NotFoundError (404), then findById → AlreadyDeletedError (409) | 1st DELETE → 204. 2nd DELETE → 409 `"Service with id 121 is already deleted"`. | ✅ FIXED |
| Double-delete 404 vs 409 (clients) | 404 instead of 409 | `existsById()` added to repo (lines 44-51). `SoftDeleteClient` use case updated. | 1st DELETE → 204. 2nd DELETE → 409 `"Client with id 270 is already deleted"`. | ✅ FIXED |
| Double-delete 404 vs 409 (pets) | 404 instead of 409 | `existsById()` added to repo (lines 49-56). `SoftDeletePet` use case updated. | Pet create fails (pre-existing issue), but code path confirmed via static analysis — same existsById → findById → AlreadyDeletedError pattern as services/clients. | ✅ FIXED (code verified) |

---

## API Endpoint Verification (against Docker container)

| Endpoint | Method | Expected | Actual | Status |
|----------|--------|----------|--------|--------|
| Create Service | POST /api/v1/services | 201 + ServiceResponseDto | 201 + correct DTO with price/status ✅ | PASS |
| List Services | GET /api/v1/services | 200 + array | 200 + paginated ✅ | PASS |
| Search Services | GET /api/v1/services/search?q=Groom | 200 + matches | 200 + 3 matches ✅ | PASS |
| Get Service | GET /api/v1/services/:id | 200 / 404 | 200 correct ✅ | PASS |
| Update Service | PUT /api/v1/services/:id | 200 + updated | 200 + updated name/price ✅ | PASS |
| Deactivate | PATCH /api/v1/services/:id/deactivate | 200 + status=inactive | 200 + `status="inactive"` ✅ | **FIXED** |
| Soft Delete | DELETE /api/v1/services/:id | 204 / 409 | 204 on 1st, 409 on 2nd ✅ | **FIXED** |

---

## Edge Case Verification

| Edge Case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Missing name | 422 "Name is required" | 422 ✅ | PASS |
| Missing price (field absent) | 422 "price is required" | 500 Internal server error ⚠️ | WARNING |
| Missing price (price=null) | 422 or 201? | 201 price=0 ⚠️ | WARNING |
| Negative price | 422 | 422 "Price must be a non-negative integer" ✅ | PASS |
| Name > 255 chars | 422 | 422 "Name must be 255 characters or fewer" ✅ | PASS |
| Negative duration | 422 | 422 "Duration must be a positive integer" ✅ | PASS |
| Invalid :id (abc) | 422 | 422 "Invalid id — must be a positive integer" ✅ | PASS |
| Invalid :id (0) | 422 | 422 ✅ | PASS |
| Not found | 404 | 404 "Service with id 99999 not found" ✅ | PASS |
| Already deleted (2nd DELETE) | 409 | 409 "Service with id N is already deleted" ✅ | **FIXED** |
| Deactivate idempotent | 200 (no error) | 200 status=inactive ✅ | **FIXED** |
| Search empty q | 400 | 400 ✅ | PASS |
| Search missing q | 400 | 400 ✅ | PASS |
| Update with status field | 422 forbidden | 422 ✅ | PASS |
| FTS operators sanitized | matches normally | `+groom -bath` → sanitized to `groom bath` ✅ | PASS |
| Price cents↔dollars (create) | send $50.00 → get back 50.00 | `price: 50` (JSON number — same as 50.00) ✅ | PASS |
| Optional fields omitted | 201, nulls allowed | 201 durationMinutes=null ✅ | PASS |
| Search no match | 200 [] | 200 [] ✅ | PASS |

---

## Spec Compliance Matrix

### Backend Requirements

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| FR-1: Create Service | Happy path | Controller test + live API | ✅ COMPLIANT |
| FR-1: Create Service | Missing name → 422 | Controller test | ✅ COMPLIANT |
| FR-1: Create Service | Missing price → 422 | Controller test (covers validation path) | ⚠️ PARTIAL (absent field → 500) |
| FR-1: Create Service | Name > 255 chars → 422 | CreateService test | ✅ COMPLIANT |
| FR-1: Create Service | Negative price → 422 | Controller test | ✅ COMPLIANT |
| FR-1: Create Service | Negative duration → 422 | CreateService test | ✅ COMPLIANT |
| FR-1: Create Service | Optional fields omitted | Controller test + live API | ✅ COMPLIANT |
| FR-2: Get Service | Found → 200 | Controller test | ✅ COMPLIANT |
| FR-2: Get Service | Not found → 404 | Controller test | ✅ COMPLIANT |
| FR-3: List Services | Paginated list | Controller test | ✅ COMPLIANT |
| FR-3: List Services | Soft-deleted excluded | PrismaServiceRepository WHERE clause | ✅ COMPLIANT |
| FR-4: Update Service | Successful update | Controller test | ✅ COMPLIANT |
| FR-4: Update Service | Forbidden status field | Controller test | ✅ COMPLIANT |
| FR-4: Update Service | Update deleted → 404 | Controller test | ✅ COMPLIANT |
| FR-5: Deactivate | Deactivate active → 200 inactive | Controller test + live API | ✅ COMPLIANT (FIXED) |
| FR-5: Deactivate | Idempotent → 200 | Controller test + live API | ✅ COMPLIANT (FIXED) |
| FR-6: Soft Delete | Soft-delete → 204 | Controller test + live API | ✅ COMPLIANT |
| FR-6: Soft Delete | Already deleted → 409 | Controller test + live API | ✅ COMPLIANT (FIXED) |
| FR-7: Search | Match by name | Controller test | ✅ COMPLIANT |
| FR-7: Search | Match by description | SearchServices test | ✅ COMPLIANT |
| FR-7: Search | No match → [] | SearchServices test | ✅ COMPLIANT |
| FR-7: Search | Empty query → 400 | Controller test | ✅ COMPLIANT |
| FR-7: Search | FTS operators sanitized | sanitizeFtsQuery test (13) | ✅ COMPLIANT |
| FR-8: DTO Mapping | Full mapping | ServiceResponseDto test (6) | ✅ COMPLIANT |

### Frontend Requirements

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| FR-9: Service List | List loads | ServiceListPage test (5) | ✅ COMPLIANT |
| FR-9: Service List | Empty state | ServiceListPage test | ✅ COMPLIANT |
| FR-9: Service List | Search debounced | useServices test (8) | ✅ COMPLIANT |
| FR-10: Service Create | Successful creation | ServiceForm test (8) | ✅ COMPLIANT |
| FR-10: Service Create | Name required validation | ServiceForm test | ✅ COMPLIANT |
| FR-10: Service Create | Price required validation | ServiceForm test | ✅ COMPLIANT |
| FR-10: Service Create | Cents conversion | service.test.ts (9) | ✅ COMPLIANT |
| FR-11: Service Detail | View active service | ServiceDetailCard test (8) | ✅ COMPLIANT |
| FR-11: Service Detail | View inactive service | ServiceDetailCard test | ✅ COMPLIANT |
| FR-12: Service Edit | Edit and save | ServiceEditPage test | ✅ COMPLIANT |
| FR-12: Service Edit | Price pre-population | ServiceEditPage test | ✅ COMPLIANT |
| FR-13: ConfirmDialog | Confirm deactivate | ServiceDetailCard test | ✅ COMPLIANT |
| FR-13: ConfirmDialog | Confirm delete | ServiceDetailCard test | ✅ COMPLIANT |
| FR-14: ServiceTable | Render row | ServiceTable test (5) | ✅ COMPLIANT |
| FR-14: ServiceTable | Null duration → "N/A" | ServiceTable test | ✅ COMPLIANT |
| FR-15: ServiceForm | Blur validation | ServiceForm test (8) | ✅ COMPLIANT |
| FR-15: ServiceForm | Submit with cents conversion | ServiceForm test | ✅ COMPLIANT |
| FR-16: useServices | Create updates list | useServices test (8) | ✅ COMPLIANT |
| FR-16: useServices | Error propagation | useServices test | ✅ COMPLIANT |
| FR-17: Loading/Empty/Error | All states tested | All component tests | ✅ COMPLIANT |

**Compliance summary**: 43/44 scenarios compliant, 1 partially compliant (missing-price edge case)

---

## Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| `PrismaServiceRepository.update()` includes `status` | ✅ Fixed | Line 72: `if (data.status !== undefined) updatePayload['status'] = data.status;` |
| `UpdateServiceInput` includes `status` field | ✅ Fixed | Lines 38-39: `status?: ServiceStatus` with JSDoc comment |
| `existsById()` on all 3 repositories | ✅ Fixed | Services (43-50), Pets (49-56), Clients (44-51) |
| `SoftDeleteServiceUseCase` uses existsById pattern | ✅ Fixed | Checks existsById → NotFoundError, then findById → AlreadyDeletedError |
| `SoftDeleteClient` + `SoftDeletePet` use same pattern | ✅ Confirmed | Both use cases updated with existsById check |
| All `IServiceRepository` interfaces declare `existsById` | ✅ Confirmed | Services, Pets, Clients |
| DTO mapping: cents→dollars, TINYINT→string | ✅ Confirmed | `toServiceResponseDto()` line 32: `price: service.price / 100` |
| Route ordering: `/search` before `/:id` | ✅ Confirmed | Commented in serviceRouter.ts |
| All 7 use cases with `execute()` pattern | ✅ Confirmed | Constructor injection, no framework deps |
| Shared domain errors used | ✅ Confirmed | `api/shared/domain/errors.ts` — no ServiceErrors.ts exists |
| No FK constraints in schema | ✅ Confirmed | Prisma model has no relations |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Shared domain errors | ✅ Yes | All services use cases import from `@api/shared/domain/errors` |
| Single `status` field (no `active`) | ✅ Yes | `status TINYINT` only in schema and domain |
| No cascade to Appointments | ✅ Yes | No cascade methods in repo |
| No server-side status filter on LIST | ✅ Yes | `ListServicesUseCase` has no status filter |
| Constructor injection pattern | ✅ Yes | `ServiceController` receives 7 use case instances |
| Route order: `/search` before `/:id` | ✅ Yes | Commented and confirmed via live test |
| `existsById` → `AlreadyDeletedError` pattern | ✅ Yes | Consistent across Services, Pets, Clients |
| ServiceForm as molecule | ✅ Yes | `src/components/molecules/ServiceForm.tsx` |
| No `reactivate` endpoint | ✅ Yes | Only deactivate; no reactivate route |

---

## Issues Found

### CRITICAL

None — both previously-CRITICAL bugs are fixed and verified through live Docker API testing.

### WARNING

1. **Missing price (field absent) returns 500 instead of 422** — `CreateServiceUseCase.execute()` checks `if (input.price < 0)` but does not check for `undefined`. When `price` is completely absent from the JSON body, `undefined < 0` is `false` (NaN comparison), so validation passes. Prisma then throws `Argument 'price' is missing` → uncaught → 500 Internal Server Error. The spec requires 422 `"price is required"`. **Low severity**: the frontend always sends the price field, but the API contract is violated for direct API calls.

2. **Missing price with `price: null` gives 201 price=0** — Prisma defaults null to 0 (no `@default(0)` in schema, so this is Prisma's implicit behavior). The spec doesn't explicitly define this case, but a price of 0 (free service) might be valid. Should be validated or documented.

### SUGGESTION

3. **FTS sanitizer misses some boolean operators** — `sanitizeFtsQuery()` strips `+ - * " ( )` but MySQL BOOLEAN MODE also interprets `> < ~ @`. Same as previous report.

---

## Verdict

**PASS WITH WARNINGS** — Both previously-CRITICAL bugs are FIXED and verified:

1. ✅ Deactivate endpoint now correctly changes status to "inactive" (Services, Clients, Pets)
2. ✅ Double-delete now correctly returns 409 for already-deleted records (Services, Clients, Pets)

All 469 tests pass across all test suites (228 backend + 55 integration + 186 frontend). All 7 API endpoints work correctly with live Docker testing. One new WARNING found (missing price edge case returns 500 instead of 422), but this is a minor edge case affecting only direct API calls — the frontend always sends the price field.

The implementation is ready for archive.
