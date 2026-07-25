# Tasks: GDPR Compliance Adaptation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,500–1,700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 5 PRs (~300, ~400, ~250, ~200, ~400) |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

| Unit | Goal | PR | Focused test | Runtime harness | Rollback |
|------|------|----|-------------|-----------------|----------|
| 1 | Appt soft-delete | #1 | `npm test -- api/appointments` | `curl -X DELETE /api/v1/appointments/:id` | `prisma migrate down` |
| 2 | Cascade hard-delete | #2 | `npm run gate` | `curl -H "Authorization: Bearer $ADMIN" -X DELETE /api/v1/clients/:id/hard` | `prisma migrate down` |
| 3 | Consent recording | #3 | `npm run test:frontend` | Create client form with/without checkbox | `prisma migrate down` |
| 4 | Data portability | #4 | `npm test -- api/clients` | `curl -X GET /api/v1/clients/:id/export` | Revert PR |
| 5 | Transparency+PII+DPA+Art.9 | #5 | `npm test -- api/observability` + `npm run test:frontend` | Visit /privacy; check logs after search | Revert PR |

## PR #1 — Appointment Soft-Delete (status=3 + deletedAt)

- [x] 1.1 RED: `Appointment.test.ts` — entity has `deletedAt: Date | null`; GREEN: domain `Appointment` + Prisma model + migration
- [x] 1.2 RED: `PrismaAppointmentRepository.integration.test.ts` — softDelete, hardDelete, hardDeleteByPetId, hardDeleteByClientId, findByClientId; GREEN: `IAppointmentRepository` + Prisma impl
- [x] 1.3 RED: `CancelAppointment.test.ts` — sets status=3 AND deletedAt, already-cancelled→404; GREEN: `CancelAppointmentUseCase`
- [x] 1.4 GREEN: wire use case into `AppointmentController` (replace cancel body) + `api/index.ts` DI
- [x] 1.5 GREEN: extend `AppointmentController.test.ts` — cover soft-delete response codes
- [x] 1.6 GREEN: extend `UpdateAppointment.test.ts` — cancelled appts reject further updates

## PR #2 — Cascade Hard-Delete (ADMIN ONLY)

- [ ] 2.1 RED: `ClientErrors.test.ts` — `ClientNotErasableError`; GREEN: `ClientErrors.ts`
- [ ] 2.2 RED: `PrismaClientRepository.integration.test.ts` — hardDelete, findByIdIncludeDeleted; GREEN: `IClientRepository` + Prisma impl (deletedAt in mapper)
- [ ] 2.3 RED: `PrismaPetRepository.integration.test.ts` — hardDelete, findByClientIdIncludeDeleted; GREEN: `IPetRepository` + Prisma impl
- [ ] 2.4 RED: `PrismaAppointmentRepository.integration.test.ts` — hardDeleteByPetId excludes status=2; GREEN: `IAppointmentRepository` + Prisma impl
- [ ] 2.5 RED: `HardDeleteClient.test.ts` — cascade Client→Pet→Appt→Service in $transaction, completed preserved; GREEN: `HardDeleteClientUseCase`
- [ ] 2.6 RED: `ClientController.test.ts` — hardDeleteClient: 403 if role≠0, 200 cascade, 404; GREEN: controller method
- [ ] 2.7 GREEN: `clientRouter.ts` `DELETE /:id/hard` with inline `req.role !== 0` guard
- [ ] 2.8 GREEN: wire HardDeleteClientUseCase into `api/index.ts`
- [ ] 2.9 RED: `ClientDetailPage.test.tsx` — "Delete Permanently" button + ConfirmDialog (irreversible warning); GREEN: `ClientDetailCard` admin-only button + `ClientDetailPage` modal + `useHardDeleteClient`
- [ ] 2.10 GREEN: `src/services/client.ts` + `src/hooks/useClientMutations.ts` — hardDeleteClient, useHardDeleteClient

## PR #3 — Consent Recording (Art. 7)

- [ ] 3.1 RED: `Client.test.ts` — entity has `consentGivenAt: Date`; GREEN: domain + Prisma model + migration
- [ ] 3.2 RED: `CreateClient.test.ts` — null consent→422, valid consent→201; GREEN: validate in `CreateClientUseCase`
- [ ] 3.3 GREEN: `PrismaClientRepository.create` + `mapToClient` include consentGivenAt
- [ ] 3.4 RED: `CreateClientDto.test.ts` — consentGivenAt required; GREEN: DTO + `ClientResponseDto`
- [ ] 3.5 RED: `ClientController.test.ts` — 201 with consent, 422 without
- [ ] 3.6 RED: `ClientForm.test.tsx` — mandatory GDPR checkbox with label, validation error if unchecked; GREEN: `ClientFormData.consentGivenAt` + checkbox UI + form validation
- [ ] 3.7 GREEN: `src/types/client.ts` add consentGivenAt; `ClientCreatePage.tsx` pass to create payload

## PR #4 — Data Portability Export (Art. 20)

- [ ] 4.1 RED: `ExportResponseDto.test.ts` — { exportedAt, dataSubject: { client, pets[], appointments[], services[] } }; GREEN: DTO
- [ ] 4.2 RED: `ExportClient.test.ts` — joins 4 tables, 404 unknown, excludes soft-deleted; GREEN: `ExportClientUseCase`
- [ ] 4.3 GREEN: `IAppointmentRepository.findByClientId` + `IPetRepository.findAllByClientId` + `IServiceRepository.findByPetIds` + Prisma impls
- [ ] 4.4 RED: `ClientController.test.ts` — GET export returns JSON, 404; GREEN: `exportClient` method
- [ ] 4.5 GREEN: `clientRouter.ts` `GET /:id/export`; `api/index.ts` wire use case
- [ ] 4.6 RED: `ClientDetailPage.test.tsx` — export button triggers JSON download; GREEN: `src/services/client.ts` exportClient + `useClientMutations.ts` useExportClient + `ClientDetailCard` "Export Data" button

## PR #5 — Transparency + PII Sanitization + DPA + Art. 9

- [ ] 5.1 RED: `sanitize.test.ts` — sanitizeUrl strips `?.*`, sanitizeLogPayload redacts name/email/phone→"[REDACTED]"; GREEN: `api/observability/sanitize.ts`
- [ ] 5.2 GREEN: hook `sanitizeUrl` into request logging middleware; `sanitizeLogPayload` into `sentry.ts` processLogLine before addBreadcrumb/captureException
- [ ] 5.3 RED: `PrivacyPage.test.tsx` — 10+ GDPR sections EN+ES rendered; GREEN: rewrite `landing.json` EN+ES with `privacy.sections[]` array (controller identity, purpose, legal basis, recipients, retention, ARCO rights, consent withdrawal, complaint authority, automated decisions, DPA link)
- [ ] 5.4 GREEN: `PrivacyPage.tsx` → iterate `t('privacy.sections', { returnObjects: true })`
- [ ] 5.5 GREEN: `docs/DPA.md` — roles, scope, data categories, subprocessors, security measures, breach notification; link from privacy sections
- [ ] 5.6 RED: `ClientForm.test.tsx` — Art. 9 warning on notes field; GREEN: "May contain health data. Avoid storing sensitive data." below notes in `ClientForm.tsx`
- [ ] 5.7 GREEN: add Art. 9 warning to pet notes (existing pet form or detail card)
