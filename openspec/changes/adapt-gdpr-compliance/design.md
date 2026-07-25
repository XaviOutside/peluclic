# Design: GDPR Compliance Adaptation

## Technical Approach

All additive within existing Clean Architecture. Six independent GDPR domains implemented across 5 chained PRs (1,200–1,600 lines total). Follows existing patterns: constructor DI, Prisma repositories, domain errors → HTTP status mapping, use-case orchestration. No shared state between slices.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Cascade hard-delete | `HardDeleteClientUseCase` in clients bounded context, Prisma `$transaction` | Separate use case per entity; raw SQL batch | Existing cascade pattern (`SoftDeleteClientUseCase` uses petRepository). Transaction ensures atomicity without FK constraints. |
| Admin-only hard-delete | `adminMiddleware` (inline role check: `req.role !== 0 → 403`) wired on `DELETE /api/v1/clients/:id/hard` | Dedicated middleware factory; check inside controller | Auth middleware already attaches `req.role` (0=admin, 1=employee). A lightweight inline guard keeps the route file self-documenting without a new middleware file. |
| Appointment cancel+soft-delete | Status=3 AND `deletedAt=NOW()` in single use case | Separate cancel and soft-delete endpoints | Spec mandates both operations simultaneously. Simplifies client — one DELETE does both. |
| Hard-delete is manual, no cron | Admin clicks "Delete Permanently" → immediate cascade delete. No retention windows, no background jobs. | node-cron scheduler with retention policy | Manual trigger eliminates cron dependency, scheduler lifecycle management, and retention-policy complexity. `deletedAt` on Appointment remains for soft-delete audit trail — no automated purge. |
| PII sanitization hook | `sanitizeUrl()` in request logger middleware; `sanitizeLogPayload()` in `processLogLine()` before Sentry | After-logger middleware; Sentry `beforeSend` only | Earliest hook covers both pino and Sentry. Single source of truth for PII field list. |
| Privacy page data-driven | Locale key `privacy.sections` as JSON array, component iterates | Keep hardcoded sections with conditional rendering | i18next `returnObjects: true` enables variable-length sections without code changes. |
| Export assembly | Single `ExportClientUseCase` joining 4 tables via repository batch queries | One endpoint per entity; GraphQL | RESTful JSON export is spec requirement. Batching avoids N+1. |

## Data Flow

### Cascade Hard-Delete (`DELETE /api/v1/clients/:id/hard`) — ADMIN ONLY

```
ClientController.hardDelete(id, role)
  ├─ role !== 0 (USER_ROLE.ADMIN) → 403 Forbidden
  └─ HardDeleteClientUseCase.execute(id)
       ├─ clientRepo.findByIdIncludeDeleted(id) → Client | 404
       ├─ petRepo.findByClientIdIncludeDeleted(clientId)
       │   └─ for each pet:
       │       ├─ appointmentRepo.hardDeleteByPetId(petId, excludeStatus=[2])
       │       ├─ serviceRepo.hardDeleteByPetId(petId)
       │       └─ petRepo.hardDelete(petId)
       └─ clientRepo.hardDelete(id)
     ← Prisma $transaction wraps all deletions
```

### Export (`GET /api/v1/clients/:id/export`)

```
ClientController.export(id, companyId)
  → ExportClientUseCase.execute(id, companyId)
    ├─ clientRepo.findById(id) → Client | 404
    ├─ petRepo.findAllByClientId(clientId)
    ├─ appointmentRepo.findByClientId(clientId)
    └─ serviceRepo.findByClientIds(petIds)
  → ExportResponseDto { exportedAt, dataSubject: { client, pets[], appointments[], services[] } }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `deletedAt DateTime?` to Appointment; `consentGivenAt DateTime?` to Client |
| `api/clients/domain/Client.ts` | Modify | Add `consentGivenAt` to `Client` and `CreateClientInput` |
| `api/clients/domain/IClientRepository.ts` | Modify | Add `hardDelete(id)`, `findByIdIncludeDeleted(id)` |
| `api/clients/domain/ClientErrors.ts` | Modify | Add `ClientNotErasableError` |
| `api/clients/application/HardDeleteClient.ts` | Create | Cascade hard-delete use case |
| `api/clients/application/ExportClient.ts` | Create | Export assembly use case |
| `api/clients/application/CreateClient.ts` | Modify | Validate `consentGivenAt` required |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modify | Add `hardDelete`, `findByIdIncludeDeleted`, map `consentGivenAt` |
| `api/clients/interface/ClientController.ts` | Modify | Add `hardDeleteClient` (admin-gated), `exportClient`; wire new use cases |
| `api/clients/interface/clientRouter.ts` | Modify | Add `DELETE /:id/hard` with inline `role !== 0 → 403` guard, `GET /:id/export` |
| `api/clients/interface/dtos/ClientResponseDto.ts` | Modify | Include `consentGivenAt` in response |
| `api/clients/interface/dtos/CreateClientDto.ts` | Modify | Add `consentGivenAt` required field |
| `api/clients/interface/dtos/ExportResponseDto.ts` | Create | Export response DTO |
| `api/appointments/domain/Appointment.ts` | Modify | Add `deletedAt: Date \| null` to entity |
| `api/appointments/domain/IAppointmentRepository.ts` | Modify | Add `softDelete(id)`, `hardDelete(id)`, `hardDeleteByClientId(clientId)`, `hardDeleteByPetId(petId)`, `findByClientId(clientId)` |
| `api/appointments/application/CancelAppointment.ts` | Create | Soft-delete use case (status=3 + deletedAt) |
| `api/appointments/infrastructure/PrismaAppointmentRepository.ts` | Modify | Implement new repo methods, map `deletedAt` |
| `api/appointments/interface/AppointmentController.ts` | Modify | Replace cancel with `CancelAppointmentUseCase` |
| `api/observability/sanitize.ts` | Create | `sanitizeUrl()`, `sanitizeLogPayload()` |
| `api/observability/logger.ts` | Modify | Hook `sanitizeUrl` into request logging middleware |
| `api/observability/sentry.ts` | Modify | Hook `sanitizeLogPayload` into `processLogLine` |
| `api/index.ts` | Modify | Wire new use cases, add sanitize middleware |
| `src/components/molecules/ClientForm.tsx` | Modify | Add consent checkbox, notes warning |
| `src/components/organisms/ClientDetailCard.tsx` | Modify | Add export button; add "Delete Permanently" button (admin-only render) with confirmation modal warning: "This will permanently delete all client data and cannot be undone." |
| `src/pages/PrivacyPage.tsx` | Modify | Data-driven section rendering |
| `src/locales/en/landing.json` | Modify | Replace 4 hardcoded sections with `privacy.sections[]` array (10+ GDPR sections) |
| `src/locales/es/landing.json` | Modify | Same structure, Spanish content |
| `src/types/client.ts` | Modify | Add `consentGivenAt`, `ExportClientDto` |
| `src/services/client.ts` | Modify | Add `hardDeleteClient(id)`, `exportClient(id)` |
| `src/hooks/useClientMutations.ts` | Modify | Add `useHardDeleteClient`, `useExportClient` |
| `docs/DPA.md` | Create | GDPR DPA template |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Domain | Entity validation, error classes | Vitest — pure unit, no DB |
| Application | Use case orchestration (hard-delete cascade, consent validation, export assembly) | Vitest — mock repositories |
| Infrastructure | New repository methods (softDelete, hardDelete, batch queries) | Integration tests with real MySQL (Docker) |
| Interface | Controller error mapping, route registration | Vitest + supertest |
| Frontend | Form consent checkbox, export download, confirmation modal, PrivacyPage sections | Vitest + @testing-library/react |
| E2E | Full cascade flow, export download | Playwright |
| Security | Sanitize edge cases (URLs, nested PII); admin authorization (employee → 403 on hard-delete) | Vitest for sanitize utils + auth guards; Snyk SAST |

## Threat Matrix

N/A — no shell commands, subprocesses, VCS/PR automation, executable-file classification, or process-integration boundary. New routes (`/hard`, `/export`) are behind existing `authMiddleware`, `helmet`, `cors`, and `rate-limit`. Hard-delete endpoint additionally gated with inline role check (`role !== 0 → 403`) to prevent destructive operations by non-admin employees (RBAC). No cron or background job processes exist.

## Migration / Rollout

- **PR #1**: `ALTER TABLE appointments ADD COLUMN deleted_at DATETIME NULL` — non-destructive
- **PR #4** (consent): `ALTER TABLE clients ADD COLUMN consent_given_at DATETIME NULL` — non-destructive; existing clients have NULL (no backfill needed for soft-launch)
- No seed data migration required
- Rollback: `prisma migrate down` per PR; no shared state between slices

## PR Slice Map

| PR | Scope | Lines | Depends On |
|----|-------|-------|------------|
| #1 | Appointment soft-delete (schema + entity + repo + use case + controller) | ~400 | None |
| #2 | Cascade hard-delete (repo methods + HardDeleteClientUseCase + admin-gated route + tests) | ~400 | None |
| #3 | Consent recording (schema + domain + use case + DTO + frontend form + tests) | ~250 | None |
| #4 | Data portability export endpoint (use case + DTO + route + frontend button) | ~200 | None |
| #5 | Transparency + PII + DPA + Art. 9 notice | ~400 | None |

All PRs are independent. Feature Branch Chain: tracker `feature/gdpr-compliance`, children target tracker. `delivery_strategy: ask-on-risk` (orchestrator default).

## Open Questions

- None — all architectural decisions resolved.
