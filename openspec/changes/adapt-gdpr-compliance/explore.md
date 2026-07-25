# Exploration: GDPR Compliance Adaptation

## Executive Summary

The pfmaster codebase has a solid security foundation (Clean Architecture, soft-delete pattern, helmet, rate limiting, multi-tenant isolation) but lacks core GDPR functionality: no hard-delete/erasure mechanism (soft-delete only, Appointments have zero delete support), no data portability endpoint, no consent recording, no PII sanitization in logs, and a privacy policy that doesn't meet Art. 13-14 requirements. The existing Clean Architecture layers, DTO patterns, error hierarchy, and `companyId`-based isolation provide excellent extension points. Seven of eight gaps can be addressed within the established architecture; Art. 9 (health data encryption) is architecturally complex and should be split into a separate SDD cycle. Total estimated effort across all gaps: ~1,800–2,300 lines — well over the 400-line PR budget, requiring chained PRs.

---

## Per-Gap Analysis

### GAP 1 — Art. 17: Right to Erasure (Hard Delete + Purge)

**Current state**: Soft delete (`deletedAt = NOW()`) exists on Client, Pet, Service, User, and Session. `DELETE /api/v1/clients/:id` only soft-deletes. Appointments have NO deletedAt column, NO soft/hard delete at all. No purge cron job for soft-deleted records past a retention window.

**4-Layer trace**:

| Layer | File | Status | Change Type |
|-------|------|--------|-------------|
| **Domain** | `api/appointments/domain/Appointment.ts` | No `deletedAt` field exists | Modify — add `deletedAt` to `Appointment` + `AppointmentDetails` entities |
| **Domain** | `api/appointments/domain/IAppointmentRepository.ts` | 7 methods, no delete | Modify — add `softDelete()`, `hardDelete()`, `hardDeleteByClientId()` |
| **Domain** | `api/appointments/domain/AppointmentErrors.ts` | 3 errors, no delete errors | Modify — add `AppointmentAlreadyDeletedError` |
| **Domain** | `api/clients/domain/IClientRepository.ts` | 7 methods, `softDelete` only | Modify — add `hardDelete()`, `findDeletedOlderThan()` |
| **Domain** | `api/clients/domain/ClientErrors.ts` | Has `ClientAlreadyDeletedError` | None — reusable |
| **Domain** | `api/shared/domain/DataRetentionPolicy.ts` | Does not exist | **NEW** — value object with retention periods (e.g., 365d appointments, 90d soft-deleted clients) |
| **Application** | `api/appointments/application/SoftDeleteAppointment.ts` | Does not exist | **NEW** — soft-delete use case |
| **Application** | `api/appointments/application/HardDeleteAppointment.ts` | Does not exist | **NEW** — hard-delete use case |
| **Application** | `api/clients/application/HardDeleteClient.ts` | Does not exist | **NEW** — cascade hard-delete (Client → Pets → Appointments → Services) |
| **Application** | `api/shared/application/PurgeExpiredData.ts` | Does not exist | **NEW** — cron-like use case that scans and hard-deletes expired records |
| **Interface** | `api/appointments/interface/AppointmentController.ts` | 5 methods, cancel = set status CANCELLED | Modify — add `hardDelete()`, repurpose `cancel()` to include soft-delete option |
| **Interface** | `api/appointments/interface/appointmentRouter.ts` | DELETE → cancel | Modify — add dedicated hard-delete route |
| **Interface** | `api/clients/interface/ClientController.ts` | `deleteClient()` calls softDelete | Modify — add `hardDeleteClient()` |
| **Interface** | `api/clients/interface/clientRouter.ts` | 7 routes | Modify — add hard-delete route |
| **Infrastructure** | `api/appointments/infrastructure/PrismaAppointmentRepository.ts` | 161 lines, no delete | Modify — add `softDelete()`, `hardDelete()`, `hardDeleteByClientId()` |
| **Infrastructure** | `api/clients/infrastructure/PrismaClientRepository.ts` | Has `softDelete()` | Modify — add `hardDelete()`, `findDeletedOlderThan()` |
| **Infrastructure** | `api/pets/infrastructure/PrismaPetRepository.ts` | Has `softDelete()`, `softDeleteAllByClientId()` | Modify — add `hardDelete()`, `hardDeleteAllByClientId()` |
| **Infrastructure** | `api/services/infrastructure/PrismaServiceRepository.ts` | Has `softDelete()`, `unlinkAllByPetId()` | Modify — add `hardDelete()`, `hardDeleteAllByPetId()` |
| **Infrastructure** | `api/shared/infrastructure/PurgeScheduler.ts` | Does not exist | **NEW** — node-cron or setInterval-based scheduler |
| **Schema** | `prisma/schema.prisma` | Appointment model lacks `deletedAt` | Modify — add `deletedAt DateTime? @map("deleted_at")` to Appointment |
| **Migration** | `prisma/migrations/*_add_appointment_deleted_at/migration.sql` | Does not exist | **NEW** — `ALTER TABLE appointments ADD COLUMN deleted_at DATETIME NULL` |
| **Wiring** | `api/index.ts` | Wires all bounded contexts | Modify — wire `HardDeleteClientUseCase`, init purge scheduler |

**Reusable patterns**: `SoftDeleteClientUseCase` (cascade soft-delete), `SoftDeletePetUseCase` (unlink services before delete), error hierarchy (NotFoundError, AlreadyDeletedError), controller `parsePositiveInt()` helper.

**Estimated lines**: ~800–1,000 lines (15+ files, 4 new use cases, 1 migration, 1 scheduler)

**Risk**: **HIGH** — cascade hard-delete across 4 entities (Client → Pet → Appointment → Service) requires careful ordering in the use case. All referential integrity is at the application layer (no FKs). The purge scheduler needs to handle large deletions in batches to avoid locking.

**Tests needed** (~12 new test files):
- `api/appointments/application/SoftDeleteAppointment.test.ts`
- `api/appointments/application/HardDeleteAppointment.test.ts`
- `api/clients/application/HardDeleteClient.test.ts`
- `api/shared/application/PurgeExpiredData.test.ts`
- Updates to existing controller/repository tests for new methods

---

### GAP 2 — Art. 20: Data Portability (Export Endpoint)

**Current state**: No `GET /api/v1/clients/:id/export` endpoint. Data is fragmented across 4 tables (`clients`, `pets`, `appointments`, `services`). All data for a given data subject can be assembled through existing repository methods (`findById`, `findAllByClientId`) but no API endpoint assembles it.

**4-Layer trace**:

| Layer | File | Status | Change Type |
|-------|------|--------|-------------|
| **Domain** | `api/clients/domain/ClientExport.ts` | Does not exist | **NEW** — value object / type defining the export JSON schema |
| **Application** | `api/clients/application/ExportClientData.ts` | Does not exist | **NEW** — use case that gathers all data for a client and formats it |
| **Interface** | `api/clients/interface/ClientController.ts` | 8 methods | Modify — add `exportClientData()` |
| **Interface** | `api/clients/interface/clientRouter.ts` | 7 routes | Modify — add `GET /:id/export` |
| **Interface** | `api/clients/interface/dtos/ClientExportResponseDto.ts` | Does not exist | **NEW** — export response DTO |
| **Infrastructure** | `PrismaAppointmentRepository` | Needs `findByClientId` | Modify — add method to find appointments by client_id |
| **Infrastructure** | `PrismaServiceRepository` | Needs `findByPetIds` | Modify — add method to find services by array of pet_ids |

**Reusable patterns**: `toClientResponseDto()`, `toPetResponseDto()`, `toAppointmentResponseDto()` — existing DTO mappers. `parsePositiveInt()` helper. Route declaration pattern (`GET /search` before `/:id` must be replicated for `/export`).

**Estimated lines**: ~150–200 lines (1 new use case, 1 new DTO, 2 controller methods, 2 repository additions, 1 route)

**Risk**: **LOW** — read-only operation, no data mutation. The main risk is accidentally exposing data from other companies (must filter by `companyId`). All existing repository methods already honor `deletedAt: null` filtering.

**Tests needed** (~3 new test files):
- `api/clients/application/ExportClientData.test.ts`
- Updates to `ClientController.test.ts` for export
- Updates to repository tests for new `findByClientId` methods

---

### GAP 3 — Art. 7: Consent Recording

**Current state**: No `consentGivenAt` field in Client model. No consent checkbox in `ClientForm`. The PrivacyPage exists but is purely informational — no interaction recording.

**4-Layer trace**:

| Layer | File | Status | Change Type |
|-------|------|--------|-------------|
| **Domain** | `api/clients/domain/Client.ts` | `Client` interface has 10 fields | Modify — add `consentGivenAt: Date \| null` to entity and `CreateClientInput` |
| **Application** | `api/clients/application/CreateClient.ts` | Creates client from input | Modify — validate that consentGivenAt is present (required for creation) |
| **Interface** | `api/clients/interface/dtos/CreateClientDto.ts` | 6 fields | Modify — add `consentGivenAt: string` (ISO string from frontend) |
| **Interface** | `api/clients/interface/dtos/ClientResponseDto.ts` | 10 fields | Modify — add `consentGivenAt: string \| null` to response |
| **Interface** | `api/clients/interface/ClientController.ts` | `createClient` method | Modify — parse `consentGivenAt` from body, pass to use case |
| **Infrastructure** | `api/clients/infrastructure/PrismaClientRepository.ts` | `create()` and `mapToClient()` | Modify — include consentGivenAt in insert and mapping |
| **Schema** | `prisma/schema.prisma` | Client model | Modify — add `consentGivenAt DateTime? @map("consent_given_at")` |
| **Migration** | `prisma/migrations/*_add_consent/migration.sql` | Does not exist | **NEW** — `ALTER TABLE clients ADD COLUMN consent_given_at DATETIME NULL` |
| **Frontend types** | `src/types/client.ts` | `Client` and `CreateClientDto` | Modify — add `consentGivenAt` |
| **Frontend form** | `src/components/molecules/ClientForm.tsx` | 6 fields | Modify — add consent checkbox + field |
| **Frontend form test** | `src/components/molecules/ClientForm.test.tsx` | Exists | Modify — add consent tests |
| **Frontend validation** | `src/utils/validation.ts` | `ClientFormData` and `validateClientForm()` | Modify — add consent field and validation |
| **Frontend hooks** | `src/hooks/useClientMutations.ts` | Uses `CreateClientDto` | Modify — pass consent to mutation |
| **Frontend page** | `src/pages/ClientCreatePage.tsx` | Uses `ClientForm` | Modify — handle consent submission |
| **Locales** | `src/locales/en/clients.json`, `src/locales/es/clients.json` | No consent labels | Modify — add `form.label.consent`, `form.placeholder.consent` |

**Reusable patterns**: `CreateClientDto` pattern, `ClientForm` component structure, `validateClientForm()` function, DTO mapper `toClientResponseDto()`. The existing `CreateClientUseCase` validation pattern (throws `ClientValidationError` for invalid input).

**Estimated lines**: ~200–250 lines (14 files, 1 migration)

**Risk**: **LOW** — straightforward field addition across all layers. Decision needed: is consent mandatory for creation (backend validation) or advisory (frontend-only recording)? Recommend mandatory — GDPR Art. 7 requires a clear affirmative action.

**Tests needed** (~6 new/modified test files):
- `api/clients/application/CreateClient.test.ts` — add consent validation
- `api/clients/interface/ClientController.test.ts` — add consent in create
- `api/clients/interface/dtos/ClientResponseDto` test — consent in response
- `src/components/molecules/ClientForm.test.tsx` — checkbox rendering & validation
- `src/utils/validation.test.ts` — consent validation
- `src/pages/ClientCreatePage.test.tsx` — consent flow

---

### GAP 4 — Art. 13-14: Transparency (Privacy Policy Content)

**Current state**: Privacy page (`PrivacyPage.tsx`) renders 4 sections from i18n: Demo Disclaimer, Prohibited Conduct, Intellectual Property, Contact. Completely misses GDPR-required content: data controller identity, purpose of processing, legal basis, data recipients, retention periods, ARCO rights, right to withdraw consent, right to complain to supervisory authority, existence of automated decisions.

**Files to change**:

| Layer | File | Status | Change Type |
|-------|------|--------|-------------|
| Frontend locales | `src/locales/en/landing.json` | 4 privacy sections | Modify — rewrite with 10–12 GDPR-compliant sections |
| Frontend locales | `src/locales/es/landing.json` | 4 privacy sections | Modify — rewrite with 10–12 GDPR-compliant sections (Spanish) |
| Frontend page | `src/pages/PrivacyPage.tsx` | Renders 4 sections | Modify — restructure for variable number of sections (data-driven) |

**Reusable patterns**: `PrivacyPage.tsx` component structure, i18n `useTranslation('landing')`, `NavLink` back-to-home pattern.

**Estimated lines**: ~150–200 lines (mostly i18n content, minimal code changes)

**Risk**: **LOW** — content-only change. Legal accuracy is the main concern, not technical complexity. The `PrivacyPage.tsx` needs minor refactoring to handle a variable number of sections instead of hardcoded 4.

**Tests needed** (1 modified):
- `src/pages/LandingPage.test.tsx` — verify privacy link navigates

---

### GAP 5 — Art. 9: Special Categories of Data (Health Data in Notes)

**Current state**: `Client.notes` and `Pet.notes` are bare `TEXT` columns with no separation, encryption, or special handling. They can (and do) contain health data: allergies, medical conditions, medications, behavioral conditions.

**4-Layer trace**:

| Layer | File | Status | Change Type |
|-------|------|--------|-------------|
| **Domain** | `api/shared/domain/SensitiveData.ts` | Does not exist | **NEW** — value object for classifying/separating health data |
| **Domain** | `api/clients/domain/Client.ts` | `notes` is `string \| null` | Modify — add optional `medicalNotes: string \| null` alongside `notes` |
| **Domain** | `api/pets/domain/Pet.ts` | `notes` is `string \| null` | Modify — same separation |
| **Infrastructure** | `api/shared/infrastructure/EncryptionService.ts` | Does not exist | **NEW** — AES-256-GCM encryption service with key management |
| **Infrastructure** | `api/clients/infrastructure/PrismaClientRepository.ts` | Plain `notes` insert | Modify — encrypt `medicalNotes` on write, decrypt on read |
| **Infrastructure** | `api/pets/infrastructure/PrismaPetRepository.ts` | Plain `notes` insert | Modify — same encryption/decryption |
| **Schema** | `prisma/schema.prisma` | `notes TEXT` on Client, Pet, Service | Modify — add `medical_notes TEXT` columns (or mark existing `notes` as encrypted) |
| **Configuration** | `.env.example`, Docker config | No encryption keys | Modify — add `ENCRYPTION_KEY` env var |

**Reusable patterns**: Repository mapping pattern (`private mapToClient` / `private mapToPet`), domain value object pattern.

**Estimated lines**: ~300–500 lines (6+ files, 1 new service, 2 migrations)

**Risk**: **HIGH** — encryption key management, data migration of existing notes, deciding what to do with already-stored health data. This also intersects with Art. 32 (security of processing). Existing FTS indexes include `notes` — encrypting it breaks search. Recommend: **DEFER to separate SDD cycle**. The complexity justifies its own exploration, design, and implementation.

**Note**: This gap is the single most architecturally complex GDPR requirement. Encryption at rest, key rotation, and data migration of existing notes require careful planning. The FTS impact alone (encrypted bytes cannot be searched) makes this a cross-cutting change that affects the search infrastructure.

---

### GAP 6 — Art. 32: PII in Logs/Sentry

**Current state**: Request logging middleware at `api/index.ts:98` captures full URL including query strings: `logger.info({ method: req.method, url: req.url }, 'incoming request')`. Search queries like `?q=Juan Pérez` are logged verbatim. No PII sanitization before logging or before Sentry capture. Sentry backend `processLogLine()` forwards all extra fields (which include `url`) to breadcrumbs/events.

**Files to change**:

| Layer | File | Status | Change Type |
|-------|------|--------|-------------|
| Shared utils | `api/shared/utils/piiSanitizer.ts` | Does not exist | **NEW** — `sanitizeUrl(url: string): string` and `sanitizeLogPayload(obj: object): object` |
| Middleware | `api/index.ts` (request logger, line 98-100) | Logs raw `req.url` | Modify — call `sanitizeUrl(req.url)` before logging |
| Observability | `api/observability/sentry.ts` | `processLogLine` forwards extra fields | Modify — add PII redaction in `processLogLine` before `Sentry.addBreadcrumb` and `Sentry.captureException` |
| Shared utils test | `api/shared/utils/piiSanitizer.test.ts` | Does not exist | **NEW** — test sanitization of URLs, names, emails, phone numbers |

**Reusable patterns**: `sanitizeFtsQuery.ts` (existing shared/util sanitization pattern), existing `maskAllText: true` on the frontend Sentry config.

**Estimated lines**: ~100–150 lines (1 new utility, 2 modifications, 1 test)

**Risk**: **LOW** — mechanically simple. Main risk is incomplete sanitization patterns (missing edge cases like email addresses in URL paths, query strings with special characters). Use regex-based PII detection (names, emails, phones) plus URL query parameter stripping.

**Tests needed** (1 new):
- `api/shared/utils/piiSanitizer.test.ts` — comprehensive test cases for names, emails, phones, special chars

---

### GAP 7 — Art. 28: Data Processing Agreement (DPA)

**Current state**: No DPA document exists. Per the architecture, the grooming business is the data controller and Peluclic (pfmaster) is the data processor. A DPA is legally required.

**Files to change**:

| Layer | File | Status | Change Type |
|-------|------|--------|-------------|
| Documentation | `docs/DPA.md` | Does not exist | **NEW** — Data Processing Agreement document |
| Frontend | `src/pages/PrivacyPage.tsx` | Static page | Modify — add link to DPA |
| Locales | `src/locales/en/landing.json`, `es/landing.json` | Privacy sections | Modify — add DPA section/link |

**Architectural impact**: NONE — documentation only.

**Estimated lines**: ~100 lines (doc + locale links)

**Risk**: **LOW** — documentation only. But legally critical.

**Tests needed**: None.

---

## Architecture Map (Layered Breakdown)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Layer             G1(Erasure)  G2(Portab)  G3(Consent)  G4(Transp)  G5(Health)  G6(PII)  G7(DPA) │
├──────────────────────────────────────────────────────────────────────────┤
│  Domain             ● MODIFY     ● NEW       ● MODIFY      —           ● NEW       —        —     │
│                     ● NEW                                                                ● NEW    │
├──────────────────────────────────────────────────────────────────────────┤
│  Application        ● NEW×4      ● NEW       ● MODIFY      —           —           —        —     │
├──────────────────────────────────────────────────────────────────────────┤
│  Interface          ● MODIFY     ● MODIFY    ● MODIFY      —           —           —        —     │
│                     ● NEW        ● NEW       ● MODIFY                             —                │
├──────────────────────────────────────────────────────────────────────────┤
│  Infrastructure     ● MODIFY     ● MODIFY    ● MODIFY      —           ● MODIFY    ● MODIFY  —    │
│                     ● NEW                                             ● NEW       ● NEW           │
├──────────────────────────────────────────────────────────────────────────┤
│  Schema/Migration   ● MODIFY     —           ● MODIFY      —           ● MODIFY    —        —     │
│                     ● NEW                    ● NEW                     ● NEW                        │
├──────────────────────────────────────────────────────────────────────────┤
│  Frontend           —            —           ● MODIFY      ● MODIFY    —           —        ● NEW │
│  (pages/components)                          ● MODIFY      ● MODIFY                               │
│  (locales)          —            —           ● MODIFY      ● MODIFY    —           —        ● MOD │
├──────────────────────────────────────────────────────────────────────────┤
│  Cross-cutting      ● NEW×2      —           —             —           —           ● NEW    —     │
│  (shared utils)     (DataReten-                                                            (piiSa│
│                      tionPolicy                                                             nitize│
│                      PurgeSched-                                                            r)    │
│                      uler)                                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│  Documentation      —            —           —             —           —           —        ● NEW │
├──────────────────────────────────────────────────────────────────────────┤
│  Est. Lines         800-1000    150-200    200-250       150-200    300-500     100-150   100    │
│                        DEFER                                                DEFER                   │
│  Complexity          HIGH        LOW        LOW           LOW        HIGH       LOW       LOW    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Dependencies Between Fixes

```
F1 (Erasure) ─────── INDEPENDENT (foundation, touches all bounded contexts)
F2 (Consent) ─────── INDEPENDENT (only clients bounded context)
F3 (Portability) ─── INDEPENDENT (read-only, clients bounded context)
F4 (Transparency) ── INDEPENDENT (frontend content only)
F5 (Health Data) ─── INDEPENDENT but architecturally complex — DEFER to separate cycle
F6 (PII in Logs) ─── INDEPENDENT (shared utility, one file change)
F7 (DPA) ─────────── INDEPENDENT (documentation only)
```

**All gaps can proceed in parallel** (no blocking dependencies). The only weak coupling: F3 (portability) might benefit from F1 being done first so the export includes soft-delete status, but this is cosmetic and not a blocker.

## Risk Areas (Complexity Hot Spots)

| Risk | Gap | Complexity | Why |
|------|-----|-----------|-----|
| Cascade hard delete | F1 | HIGH | Order-sensitive: Client→Pet→Appointment→Service. No DB FKs — all app-level integrity. Must handle partial failures gracefully. |
| Purge scheduler | F1 | MEDIUM | Background job infrastructure (scheduling, batching, error handling). Must run periodically without blocking the API. |
| Encryption key management | F5 | HIGH | Where to store AES key? How to rotate? What about FTS on encrypted notes? Migration of existing plaintext notes. |
| PII sanitization completeness | F6 | LOW | Regex-based PII detection may miss edge cases. Could use structured approach: strip all query params from `url`, then check log payloads for known PII field names. |
| Consent UX | F3 | LOW | Mandatory vs. optional consent affects form validation and error messaging. |

## Total Estimated Lines

| Gap | Lines | Deferred? |
|-----|-------|-----------|
| F1: Erasure + Purge | 800–1,000 | No |
| F2: Consent | 200–250 | No |
| F3: Portability | 150–200 | No |
| F4: Transparency | 150–200 | No |
| F5: Health Data Encryption | 300–500 | **Yes — separate cycle** |
| F6: PII in Logs | 100–150 | No |
| F7: DPA | ~100 | No |
| **Active total** | **1,500–1,900** | |
| **With F5** | **1,800–2,300** | |

**400-line PR budget**: The active total (1,500–1,900 lines) far exceeds the 400-line PR review budget. This will require **chained PRs**.

### Recommended PR Slices

| Slice | Gaps | Lines | Description |
|-------|------|-------|-------------|
| **PR #1: Erasure Foundations** | F1 (partial) | ~350–400 | Add `deletedAt` to Appointment + repository + migration + soft-delete use case only |
| **PR #2: Hard Delete Core** | F1 (partial) | ~350–400 | Hard delete use cases (Clients, Appointments) + cascade logic |
| **PR #3: Purge + Scheduling** | F1 (partial) | ~200–300 | DataRetentionPolicy + PurgeScheduler + PurgeExpiredData use case |
| **PR #4: Consent Recording** | F2 | ~200–250 | Consent field across all layers + frontend checkbox |
| **PR #5: Data Portability** | F3 | ~150–200 | Export endpoint + DTO + repository additions |
| **PR #6: Transparency + PII** | F4 + F6 | ~250–350 | Privacy policy rewrite + log sanitization + DPA |
| **PR #7: DPA** | F7 | ~100 | DPA document (could merge into PR #6) |

## Ready for Proposal?

**Yes**. All gaps have clear implementation paths within the existing Clean Architecture. The only architectural decision needed before proposal is whether to track F5 (health data encryption) as a deferred follow-up or include it now.

The main orchestrator decision: accept the 6+ PR chain from the estimated line counts, or consolidate further (e.g., merge PR #4+#5 at ~400 lines, merge PR #6+#7 at ~400 lines).
