# Proposal: Services API Bounded Context

## Intent

Add full CRUD + search for Services at `/api/v1/services`, replicating the Clients/Pets Clean Architecture pattern. Third navigation tab: Clients → Pets → Services. Single `status` TINYINT — no separate `active` field (AGENTS.md model is wrong).

## Scope

### In Scope
- Prisma Service model: `id`, `name`, `description`, `duration_minutes` (nullable), `price` (cents), `status` TINYINT, timestamps, `deleted_at`. FULLTEXT(name, description)
- Backend bounded context: 4-layer Clean Architecture (domain → application → infrastructure → interface), 7 use cases
- 7 REST endpoints: POST, GET all, GET search, GET byId, PUT, PATCH deactivate, DELETE soft
- LIST returns all services (no server-side filter); frontend handles display filtering
- `duration_minutes` optional (null default); `price` editable via PUT anytime
- Frontend: 4 pages, 3 components, 1 hook, 1 API service, 1 types file

### Out of Scope
- Reactivate endpoint (not in existing pattern)
- Cascade to Appointments (domain doesn't exist yet)
- Service-to-pet or service-to-client relationships

## Capabilities

### New Capabilities
- `services-api-backend`: Service entity, 7 use cases, controller, router, Prisma repo. Route `/api/v1/services`
- `services-api-frontend`: 4 pages, 3 components, hooks, types, API wrapper. Routes: `/services`, `/services/new`, `/services/:id`, `/services/:id/edit`

### Modified Capabilities
None — purely additive.

## Approach

Replicate Pets bounded context identically. Clean Architecture 4-layer + DDD. Frontend: Atomic Design.

**Entity** (user override — single status field, no `active`):
```
Service: id INT, name VARCHAR(255), description TEXT?,
duration_minutes INT?, price INT (cents, ≥0),
status TINYINT (0=inactive, 1=active),
created_at, updated_at, deleted_at?
FULLTEXT(name, description)
```

**API Contract** — matches Pets endpoint pattern:
| Method | Route | Response |
|--------|-------|----------|
| POST | `/api/v1/services` | 201 ServiceResponseDto |
| GET | `/api/v1/services?page=&limit=` | 200 ServiceResponseDto[] |
| GET | `/api/v1/services/search?q=` | 200 ServiceResponseDto[] |
| GET | `/api/v1/services/:id` | 200 ServiceResponseDto |
| PUT | `/api/v1/services/:id` | 200 ServiceResponseDto |
| PATCH | `/api/v1/services/:id/deactivate` | 200 ServiceResponseDto |
| DELETE | `/api/v1/services/:id` | 204 No Content |

**Frontend**: Services tab third in nav. Reuses StatusBadge, SearchBar, Pagination, ConfirmDialog, Button, Input, Select. Price display via DTO cents→dollars.

## Affected Areas
| Area | Impact | Files |
|------|--------|-------|
| `prisma/schema.prisma` | Modified | +Service model |
| `prisma/migrations/` | New | `add_service_model` |
| `api/services/**` | New | ~20 files |
| `api/index.ts` | Modified | Wire Service router |
| `src/App.tsx` | Modified | 4 routes + nav tab |
| `src/types/`, `src/services/`, `src/hooks/` | New | 3 files |
| `src/components/` | New | ServiceForm, ServiceTable, ServiceDetailCard |
| `src/pages/` | New | 4 pages |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Price display bugs (cents vs dollars) | Medium | DTO conversion tested; shared displayFormat utility |
| Future Appointments cascade | Low | Use case constructors accept optional deps later |
| Route order `/search` vs `/:id` | Low | Copy Pets router pattern (search before :id) |

## Rollback

1. Remove Service model from Prisma schema; revert migration; regenerate client
2. Remove `/api/v1/services` wiring from `api/index.ts`
3. Revert `App.tsx` nav + routes; delete `api/services/` and frontend files

## Dependencies

- Reuses: Prisma singleton, `sanitizeFtsQuery`, StatusBadge, Button, Input, Select, Modal, SearchBar, Pagination, ConfirmDialog

## Success Criteria

- [ ] All 7 endpoints return correct status codes and DTO shapes
- [ ] CreateService: name required (≤255 chars), price ≥ 0, status defaults active
- [ ] FTS search matches name and description
- [ ] LIST returns all services — no server-side filter
- [ ] Navigation: Services is third tab (Clients → Pets → Services)
- [ ] All tests pass: unit ≥80%, integration vs real DB, frontend pages
