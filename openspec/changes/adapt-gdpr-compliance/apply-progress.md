# Apply Progress: GDPR Compliance — PR #1

**Branch**: `feat/gdpr-appointment-soft-delete`
**Start**: main (efc7560)
**Mode**: Strict TDD

## Completed Tasks

- [x] 1.1 Domain entity `deletedAt` + Prisma model + migration
- [x] 1.2 Repository methods: softDelete, hardDelete, hardDeleteByPetId, hardDeleteByClientId, findByClientId
- [x] 1.3 CancelAppointmentUseCase: status=3 + deletedAt (404 on already-cancelled)
- [x] 1.4 Wire CancelAppointmentUseCase into AppointmentController + api/index.ts DI
- [x] 1.5 Controller tests for soft-delete response codes
- [x] 1.6 UpdateAppointment rejects updates on soft-deleted appointments

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `Appointment.test.ts` | Unit | ✅ 60/60 | ✅ Written | ✅ 25/25 | ✅ 3 cases | ➖ None needed |
| 1.2 | `PrismaAppointmentRepository.integration.test.ts` | Integration | N/A (new methods) | ✅ Written | ✅ 19/19 | ✅ 5 methods covered | ➖ None needed |
| 1.3 | `CancelAppointment.test.ts` | Unit | N/A (new file) | ✅ Written | ✅ 3/3 | ✅ 3 cases (success + 2 errors) | ➖ None needed |
| 1.5 | `AppointmentController.test.ts` | Interface | ✅ 26/26 | ✅ Written | ✅ 27/27 | ✅ 4 DELETE cases | ➖ None needed |
| 1.6 | `UpdateAppointment.test.ts` | Unit | ✅ 12/12 | ✅ Written | ✅ 14/14 | ✅ 2 new cases | ➖ None needed |

## Test Summary

- **Total tests written**: 10 (3 domain + 5 integration + 2 use case)
- **Total tests passing**: 469/469 (full suite)
- **Layers used**: Unit (8), Integration (5), Interface (27)
- **No E2E tests** — PR #1 only affects backend appointment module

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `api/appointments/domain/Appointment.ts` | Modified | +2 (deletedAt field) |
| `api/appointments/domain/Appointment.test.ts` | Modified | +30 (deletedAt tests) |
| `api/appointments/domain/IAppointmentRepository.ts` | Modified | +15 (new methods) |
| `api/appointments/application/CancelAppointment.ts` | Created | +23 (use case) |
| `api/appointments/application/CancelAppointment.test.ts` | Created | +113 (3 tests) |
| `api/appointments/application/UpdateAppointment.ts` | Modified | +12 (cancelled guard) |
| `api/appointments/application/UpdateAppointment.test.ts` | Modified | +37 (2 tests + mock fix) |
| `api/appointments/infrastructure/PrismaAppointmentRepository.ts` | Modified | +48 (5 new methods + mapper) |
| `api/appointments/infrastructure/PrismaAppointmentRepository.integration.test.ts` | Modified | +110 (6 tests, fixed isolation) |
| `api/appointments/interface/AppointmentController.ts` | Modified | +6 (cancel use case injection) |
| `api/appointments/interface/AppointmentController.test.ts` | Modified | +29 (DELETE tests updated) |
| `api/index.ts` | Modified | +2 (DI wiring) |
| `prisma/schema.prisma` | Modified | +1 (deletedAt column) |
| `prisma/migrations/…/migration.sql` | Created | +2 (ALTER TABLE) |

**Total changed lines**: ~296 (additions + deletions)

## Workload / PR Boundary

- **Mode**: Chained PR (stacked-to-main, PR #1 of 5)
- **Current work unit**: Appointment Soft-Delete
- **Review budget**: ~296 changed lines (under 400 limit)
- **Status**: 6/6 tasks complete. Ready for review.

## Deviations from Design

None — implementation matches design.md exactly.

## Issues Found

1. **Pre-existing integration test isolation bug**: `beforeEach` only cleaned `pet_id: TEST_PET_ID` but `findByDateRange` queries the whole table. Seed data (pet_id=44) on Jul 20 caused flaky tests. Fixed by broadening cleanup to `deleteMany()` (no where clause) since the test runs in isolated DB.
2. **Test helper missing `deletedAt`**: `UpdateAppointment.test.ts`'s `makeAppt` helper did not include `deletedAt: null`, causing all appointments to appear as soft-deleted after adding the `deletedAt !== null` guard. Fixed.

## Next PR

PR #2 — Cascade Hard-Delete (ADMIN ONLY). Tasks 2.1–2.10.
