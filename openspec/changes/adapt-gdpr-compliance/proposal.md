# Proposal: GDPR Compliance Adaptation

## Intent

pfmaster handles personal data of EU pet owners but lacks GDPR compliance for 7 gaps identified in audit. Without these fixes, the app cannot legally process European data subjects' data in production.

## Scope

### In Scope (7 gaps — NO encryption)

| Article | Deliverable | Approach |
|---------|-------------|----------|
| **Art. 7** | Consent recording | `consentGivenAt` field Client model, mandatory checkbox in form, backend validation |
| **Art. 13-14** | GDPR privacy policy | 10–12 compliant sections in EN + ES, restructured data-driven PrivacyPage |
| **Art. 17** | Right to erasure | Hard-delete cascade (Client→Pet→Appointment→Service), Appointment soft-delete, TTL purge cron |
| **Art. 20** | Data portability | `GET /api/v1/clients/:id/export` returning structured JSON |
| **Art. 28** | DPA template | `docs/DPA.md` + PrivacyPage link |
| **Art. 32** | PII sanitization | Strip names/emails/query-params from logs and Sentry breadcrumbs |
| **Art. 9** | Notes notice | Informational warning that notes fields may contain sensitive data (no encryption) |

### Out of Scope

- Encryption of notes/medical data, separate medical notes table, key management
- Authentication, payment, cookie banners, DPO appointment

## Capabilities

### New Capabilities

- `gdpr-data-erasure`: Hard-delete cascade, purge scheduler, retention policy
- `gdpr-data-portability`: Client data export endpoint
- `gdpr-consent-recording`: Consent capture across all layers
- `gdpr-privacy-transparency`: GDPR-compliant privacy policy (EN + ES)
- `gdpr-pii-sanitization`: Log URL and Sentry PII redaction
- `gdpr-data-processing-agreement`: DPA template
- `gdpr-sensitive-data-notice`: Notes field sensitive-data warning

### Modified Capabilities

- `client-management-frontend`: Consent checkbox, export button, hard-delete trigger
- `appointment-backend`: `deletedAt` field, soft-delete, hard-delete
- `i18n-infrastructure`: Privacy policy locale sections

## Approach

All additive within existing Clean Architecture. Six independent slices — no cross-slice dependencies. TDD throughout.

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Cascade hard-delete ordering | Med | Use case enforces Client→Pet→Appointment→Service order; transactional batches |
| Purge cron blocking API | Low | Batching, separate scheduler process |
| PII sanitization edge cases | Low | Strip all query params + regex for names/emails/phones |
| Privacy policy legal accuracy | Med | Based on EDPB template; legal review disclaimer |

## Delivery Strategy

**Estimated**: 1,500–1,900 lines → exceeds 400-line review budget → **6 chained PRs**:

| PR | Content | ~Lines |
|----|---------|--------|
| #1 | Erasure foundations: deletedAt + Appointment soft-delete | 400 |
| #2 | Cascade hard-delete (Client→Pet→Appointment→Service) | 400 |
| #3 | Purge scheduler + DataRetentionPolicy | 300 |
| #4 | Consent recording (all layers + frontend) | 250 |
| #5 | Data portability export endpoint | 200 |
| #6 | Transparency + PII + DPA + Art. 9 notice | 400 |

**Chained strategy**: TBD — stacked-to-main or feature-branch-chain. Orchestrator decides.

## Success Criteria

- [ ] `consentGivenAt` persisted on client creation with forced validation
- [ ] Cascade hard-delete removes all related records, no orphans
- [ ] Purge cron runs on schedule, deletes past retention window
- [ ] `GET /clients/:id/export` returns complete JSON (pets, appointments, services)
- [ ] Privacy page renders GDPR-compliant sections in EN + ES
- [ ] Logs/Sentry show sanitized URLs — no query params, no PII
- [ ] DPA accessible from Privacy page; notes field shows sensitive-data warning
- [ ] Gates pass: lint, build, test, snyk

## Rollback Plan

Revert PR merge + `prisma migrate down` for schema changes. No shared state between slices.
