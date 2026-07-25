# Delta Spec: GDPR Compliance Adaptation

## gdpr-data-erasure (Art. 17 — NEW)

### REQ-ERASE-01: Hard-Delete Cascade
System MUST cascade hard-delete Client→Pet→Appointment→Service for `DELETE /api/v1/clients/:id/hard`. Completed appointments (status=2) MUST be preserved. Referential integrity enforced at application layer.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Full cascade | Client with 2 pets, 3 appointments | Hard-delete triggered | All non-completed records removed, zero orphans |
| 2 | Completed preserved | Appointment status=2 | Cascade runs | Appointment skipped, rest deleted |
| 3 | Already deleted | Client has deletedAt set | Hard-delete requested | Client + cascade children deleted |

### REQ-ERASE-02: Appointment Soft-Delete
`DELETE /api/v1/appointments/:id` MUST set `deletedAt=NOW()` and status→3. Already-deleted MUST return 404. Appointment entity MUST include `deletedAt DateTime?`.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Soft-delete | Appointment active | DELETE request | deletedAt set, status=3, 200 |
| 2 | Already deleted | deletedAt != null | DELETE request | 404 |

### REQ-ERASE-03: Purge Scheduler
Daily cron MUST hard-delete soft-deleted records beyond retention: clients>90d, appointments>365d. MUST batch 50/cycle, log purge counts.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Expired | 5 clients deleted 100d ago | Purge runs | All hard-deleted |
| 2 | Within window | Client deleted 30d ago | Purge runs | Preserved |

## gdpr-data-portability (Art. 20 — NEW)

### REQ-PORT-01: Client Export
`GET /api/v1/clients/:id/export` MUST return JSON: `{ exportedAt, dataSubject: { client, pets[], appointments[], services[] } }`. MUST exclude soft-deleted records, filter by companyId.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Full export | Client 42 with pets+appointments | GET /clients/42/export | Structured JSON with all non-deleted data |
| 2 | Not found | No client 999 | GET export | 404 |
| 3 | Cross-company | companyId=A, client in B | Export | 404 |

## gdpr-consent-recording (Art. 7 — NEW)

### REQ-CONSENT-01: Consent Capture
Client creation MUST require `consentGivenAt` (ISO 8601). Backend MUST reject null with 422. Response DTOs MUST include consentGivenAt. Frontend form MUST show mandatory GDPR checkbox.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Consent given | consentGivenAt="2026-07-25T10:00:00Z" | POST /clients | 201, field persisted |
| 2 | Consent absent | No consentGivenAt | POST /clients | 422 |
| 3 | Response | Client exists with consent | GET /clients/42 | Field present in response |

## gdpr-privacy-transparency (Art. 13-14 — NEW)

### REQ-PRIV-01: GDPR Privacy Policy
PrivacyPage MUST render 10+ sections in EN+ES from locale JSON: controller identity, purpose, legal basis, recipients, retention, ARCO rights, withdraw consent, complain to authority, automated decisions, DPA link. Sections MUST be data-driven.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | EN | Browser language en | Visit /privacy | All sections in English |
| 2 | ES | Browser language es | Visit /privacy | All sections in Spanish |
| 3 | Variable | Locale adds section key | Page renders | New section appears without code change |

## gdpr-pii-sanitization (Art. 32 — NEW)

### REQ-PII-01: Log Redaction
Request logger MUST strip query params from `req.url`. `sanitizeUrl()` utility MUST remove `?.*`. `sanitizeLogPayload()` MUST redact name/email/phone fields.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Search URL | /search?q=Juan Pérez | Logged | /search |
| 2 | Email | {email:"m@t.com"} | sanitized | "[REDACTED]" |
| 3 | Phone | phone="555-1234" | Sentry breadcrumb | "[REDACTED]" |

### REQ-PII-02: Sentry Redaction
`processLogLine()` MUST call `sanitizeLogPayload()` before `addBreadcrumb()` and `captureException()`.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Breadcrumb | {url:"/s?q=foo"} logged | processLogLine | Breadcrumb: "/s" |
| 2 | Exception | {name:"Juan"} captured | captureException | Name redacted in Sentry |

## gdpr-data-processing-agreement (Art. 28 — NEW)

### REQ-DPA-01: DPA Document
`docs/DPA.md` MUST define roles, scope, data categories, subprocessors, security measures, breach notification. PrivacyPage MUST link to DPA in EN+ES.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Accessible | docs/DPA.md exists | Visit /privacy | DPA link visible |
| 2 | EN link | Language en | DPA section | "Data Processing Agreement" |
| 3 | ES link | Language es | DPA section | "Acuerdo de Encargo de Tratamiento" |

## gdpr-sensitive-data-notice (Art. 9 — NEW)

### REQ-NOTICE-01: Notes Sensitive-Data Warning
Client.notes and Pet.notes fields MUST display warning: "May contain health data. Avoid storing sensitive data." Informational only — no encryption.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Client form | Notes field rendered | Form displays | Warning shown |
| 2 | Pet form | Pet notes field visible | Form displays | Same warning |

---

## Delta: client-management-frontend (MODIFIED)

### ADDED

### REQ-CLIENT-EXPORT-01: Export Button
Client detail page MUST show "Export Data" button triggering `GET /clients/:id/export` as JSON download.

### REQ-CLIENT-DELETE-01: Hard-Delete Trigger
Client detail page MUST show "Delete Permanently" button with confirmation modal warning irreversibility.

### MODIFIED: Create Client Form
(Previously: required name, email, phone only. Now: adds mandatory consent checkbox per REQ-CONSENT-01.)

---

## Delta: appointment-backend (MODIFIED)

### ADDED: Repository Delete Methods
`IAppointmentRepository` MUST add `softDelete(id)`, `hardDelete(id)`, `hardDeleteByClientId(clientId)`.

### MODIFIED: Appointment Entity
(Previously: pet_id, client_id, scheduled_at, status, notes. Now: adds deletedAt DateTime?.)

### MODIFIED: Cancel Appointments
(Previously: cancel = status→3, record preserved. Now: cancel sets status=3 AND deletedAt=now.)

---

## Delta: i18n-infrastructure (MODIFIED)

### MODIFIED: Locale File Structure
(Previously: landing.json had 4 privacy keys. Now: adds privacy.section.* keys for 10+ GDPR sections in EN+ES, per REQ-PRIV-01.)
