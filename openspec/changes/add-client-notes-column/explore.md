## Exploration: Add Client Notes Column to Listing

### Current State

The `Client` entity has **no `notes` field** at any layer of the stack:

| Layer | File | Has `notes`? |
|---|---|---|
| Database (Prisma) | `prisma/schema.prisma` (line 12–27) | ❌ No |
| Domain entity | `api/clients/domain/Client.ts` (line 12–24) | ❌ No |
| Create input | `api/clients/domain/Client.ts` (line 26–32) | ❌ No |
| Update input | `api/clients/domain/Client.ts` (line 34–41) | ❌ No |
| Repository `mapToClient` | `api/clients/infrastructure/PrismaClientRepository.ts` (line 133–159) | ❌ No |
| Repository `create` | `api/clients/infrastructure/PrismaClientRepository.ts` (line 16–29) | ❌ No |
| Repository `update` | `api/clients/infrastructure/PrismaClientRepository.ts` (line 66–82) | ❌ No |
| Repository `search` (raw SQL) | `api/clients/infrastructure/PrismaClientRepository.ts` (line 91–127) | ❌ No |
| Response DTO | `api/clients/interface/dtos/ClientResponseDto.ts` | ❌ No |
| Create DTO | `api/clients/interface/dtos/CreateClientDto.ts` | ❌ No |
| Update DTO | `api/clients/interface/dtos/UpdateClientDto.ts` | ❌ No |
| Frontend `Client` type | `src/types/client.ts` (line 13–24) | ❌ No |
| Frontend `CreateClientDto` | `src/types/client.ts` (line 27–33) | ❌ No |
| Frontend `UpdateClientDto` | `src/types/client.ts` (line 36–42) | ❌ No |
| Frontend form | `src/components/molecules/ClientForm.tsx` (line 7–13) | ❌ No |
| Frontend listing | `src/pages/ClientsPage.tsx` (line 45–93) | ❌ No column |
| Frontend detail card | `src/components/organisms/ClientDetailCard.tsx` (line 57–65) | ❌ No display |

**Reference pattern**: The `Pet` entity already has `notes` as `String? @db.Text` in the Prisma schema (line 38), and the Pet form includes a notes textarea with placeholder "Medical notes, allergies, etc." The `PetDetailCard` renders notes via a `<DetailRow label="Notes" value={pet.notes} />`. This is the natural pattern to follow.

### Affected Areas

| File | Why affected |
|---|---|
| `prisma/schema.prisma` | Add `notes String? @db.Text` to Client model + Prisma migration |
| `api/clients/domain/Client.ts` | Add `notes: string \| null` to Client, CreateClientInput, UpdateClientInput |
| `api/clients/infrastructure/PrismaClientRepository.ts` | `mapToClient` return, `create` payload, `update` payload, `search` raw SQL SELECT, `search` row mapping |
| `api/clients/interface/dtos/ClientResponseDto.ts` | Add `notes: string \| null` to ClientResponseDto + `toClientResponseDto` |
| `api/clients/interface/dtos/CreateClientDto.ts` | Add optional `notes?: string` |
| `api/clients/interface/dtos/UpdateClientDto.ts` | Add optional `notes?: string \| null` |
| `src/types/client.ts` | Add `notes: string \| null` to Client, CreateClientDto, UpdateClientDto |
| `src/components/molecules/ClientForm.tsx` | Add notes textarea field, update `ClientFormData`, `emptyForm`, `handleBlur` field list |
| `src/pages/ClientsPage.tsx` | Add "Notas" column definition, redistribute grid spans |
| `src/components/organisms/ClientDetailCard.tsx` | Add `<DetailRow label="Notes" value={client.notes} />` |
| `src/pages/ClientsPage.test.tsx` | Update mock data, test assertions for column count (3→4), notes rendering |
| `src/pages/ClientDetailPage.test.tsx` | Add notes to mock client data |
| Backend unit/integration tests | Add `notes` to all client fixtures |

### Approaches

1. **Full-stack addition (recommended)** — Add `notes` as `TEXT` (nullable) everywhere: DB → domain → repository → DTOs → frontend type → form → listing column → detail card.
   - Pros: Complete feature. Notes available for display and editing. Follows existing Pet notes pattern.
   - Cons: Touches ~15 files across 3 layers.
   - Effort: Medium

2. **Listing-only (display from API, no editing)** — Add `notes` to the DB and read path only (schema, domain, repository queries, DTO, frontend type, listing column). Skip the form and update path.
   - Pros: Smaller scope. Notes visible in listing immediately.
   - Cons: Users can't create or edit notes. Inconsistent — notes column exists but form doesn't have it. Creates debt.
   - Effort: Low-Medium

### Recommendation

**Approach 1 — Full-stack addition.** While it touches more files, the pattern is already established by the `lastServiceDate` field (recently added) and the `Pet.notes` field. Following the project's Clean Architecture means changes are mechanical and well-understood at each layer. Skipping the form/update path would create UX inconsistency and require a follow-up change anyway.

### Grid Span Redistribution

The `DataTable` uses a 12-column CSS grid. Current spans:

| Column | Current Span |
|---|---|
| Cliente (name + #ID + lastServiceDate) | 4 |
| Contacto (email + phone + phone2 + address) | 5 |
| Estado (status badge) | 2 |
| Row actions (edit, view) | 1 |
| **Total** | **12** |

Proposed spans with 4th data column:

| Column | Proposed Span | Rationale |
|---|---|---|
| Cliente | 3 (was 4) | Still needs space for name + ID + date |
| Contacto | 4 (was 5) | 4 stacked fields; 4 cols is tight but workable |
| Notas | 2 (new) | Truncated text, short width fine |
| Estado | 2 (unchanged) | Badge is compact |
| Row actions | 1 (unchanged) | Two icon buttons |
| **Total** | **12** | ✅ |

### Notes Rendering

- **Type**: `String? @db.Text` → free-form text, potentially multi-paragraph
- **In table**: Truncated with CSS ellipsis + `line-clamp-2` (max 2 lines). Full text on `title` attribute (tooltip).
- **On mobile**: `mobileVisible: false` — same as Estado. Mobile cards are already dense.
- **In detail card**: `<DetailRow label="Notes" value={client.notes} />` with "Not provided" fallback.
- **DESIGN.md tokens**: `text-sm` / `text-body-sm` with `text-on-surface-variant` for the truncated view.

### Risks

- **Grid crowding on smaller desktop breakpoints** — Contacto column at `col-span-4` with 4 stacked fields + icons may feel cramped. Consider testing at 1024px before finalizing.
- **No character limit in DB** — `TEXT` can hold 65KB; no application-level cap. Should add a `MAX_NOTES_LENGTH` constant (e.g., 2000 chars) for API input validation. Pet notes also lack this limit — consider a shared constant.
- **Prisma migration** — adding a nullable `TEXT` column to an existing table is safe (no data loss), but requires running `prisma migrate dev`.
- **Backend search query (`$queryRaw`)** — the `search` method uses raw SQL with explicit column lists. Must add `notes` to the SELECT and row mapping to avoid breaking the search endpoint.
- **Grid span values are CSS classes, not data** — the `span` prop is a string like `'sm:col-span-4'`. No TypeScript enforcement of total=12 constraint. Hand-verify.

### Ready for Proposal

**Yes** — all unknowns are resolved. The orchestrator can proceed to `sdd-propose`.

### Findings Summary

| Key | Value |
|---|---|
| `notes_field_exists` | `false` — no notes field at any layer |
| `notes_field_type` | Would be `TEXT` (nullable), following Pet.notes pattern |
| `notes_field_nullable` | `true` — existing clients have no notes |
| `current_columns` | 3 data columns: Cliente (4), Contacto (5), Estado (2) + Actions (1) |
| `proposed_spans` | Cliente(3) + Contacto(4) + Notas(2) + Estado(2) + Actions(1) = 12 |
| `mobile_visibility` | `false` — notes hidden on mobile, same as Estado |
| `rendering_approach` | Truncated with `line-clamp-2` + `title` tooltip for full text |
| `affected_files` | ~15 files across schema, domain, infra, interface, frontend types, components, pages |
| `backend_changes_needed` | `true` — database migration + all Clean Architecture layers |
