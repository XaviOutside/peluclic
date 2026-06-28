# Tasks: Services API Bounded Context

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2400 (production + tests) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested PR slices | 6 |
| Delivery strategy | force-chained, stacked-to-main |
| Number of tasks | 22 |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Lines |
|------|------|-----|-------|
| 1 | Prisma model + domain + shared errors | PR 1 | ~250 |
| 2 | Infrastructure repo + 7 use cases | PR 2 | ~380 |
| 3 | Interface: DTOs, controller, router, wiring | PR 3 | ~310 |
| 4 | Frontend: types, API client, tests | PR 4 | ~200 |
| 5 | Frontend: hooks + 3 components | PR 5 | ~380 |
| 6 | Frontend: 4 pages + App.tsx nav | PR 6 | ~280 |

---

## PR 1: Foundation — Prisma + Domain + Shared Errors

- [x] **T-1: Prisma Service model + migration** ✅
- [x] **T-2: Domain entity types + SERVICE_STATUS** ✅ (12/12 tests pass)
- [x] **T-3: IServiceRepository interface** ✅ (compiles)
- [x] **T-4: Shared domain errors** ✅ (6/6 tests pass)

---

## PR 2: Infrastructure + Use Cases

- [x] **T-5: PrismaServiceRepository** ✅ (13/13 integration tests)
- [x] **T-6: CreateService, GetService, ListServices use cases** ✅ (18 tests)
- [x] **T-7: Update, Deactivate, SoftDelete, Search use cases** ✅ (17 tests)
- [x] **T-8: DTOs** ✅ (6 tests)
- [x] **T-9: ServiceController + serviceRouter** ✅ (22 tests)
- [x] **T-10: api/index.ts wiring** ✅
- [x] **T-11: Frontend types** ✅
- [x] **T-12: API service client** ✅ (9 tests)
- [x] **T-13: useServices hook** ✅ (8 tests)
- [x] **T-14: ServiceForm molecule** ✅ (8 tests)
- [x] **T-15: ServiceTable + ServiceDetailCard organisms** ✅ (13 tests)
- [x] **T-16: ServiceListPage** ✅ (5 tests)
- [x] **T-17: ServiceCreatePage + ServiceEditPage** ✅
- [x] **T-18: ServiceDetailPage** ✅
- [x] **T-19: App.tsx navigation + routes** ✅

---

- [x] **T-8: DTOs** ✅
- [x] **T-9: ServiceController + serviceRouter** ✅
- [x] **T-10: api/index.ts wiring** ✅
- [x] **T-11: Frontend types** ✅
- [x] **T-12: API service client** ✅
- [x] **T-13: useServices hook** ✅
- [x] **T-14: ServiceForm molecule** ✅
- [x] **T-15: ServiceTable + ServiceDetailCard organisms** ✅
- [x] **T-16: ServiceListPage** ✅
- [x] **T-17: ServiceCreatePage + ServiceEditPage** ✅
- [x] **T-18: ServiceDetailPage** ✅
- [x] **T-19: App.tsx navigation + routes** ✅

## Implementation Complete 🎉

**Total**: 19/19 tasks complete
**Test results**: 227 backend + 186 frontend = 413 total tests passing
**PR branches**: feat/services-api-pr1 through pr6 (stacked-to-main, not pushed)
