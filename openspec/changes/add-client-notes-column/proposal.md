# Proposal: Add Client Notes Column

## Intent

Clients have no free-text notes field. Groomers need to record preferences, medical info, and special instructions. Add `notes` to the Client entity at all layers — DB through UI — following Pet.notes as the reference pattern.

## Scope

### In Scope
- DB: `notes TEXT NULL` on `clients` via Prisma migration
- Domain: `notes: string | null` on Client, CreateClientInput, UpdateClientInput
- Repository: `mapToClient`, `create`, `update`, and `search` raw SQL SELECT + row mapping
- DTOs: ClientResponseDto, CreateClientDto, UpdateClientDto
- Frontend type: Client, CreateClientDto, UpdateClientDto
- UI: textarea in ClientForm, "Notas" column in ClientsPage (truncated, `line-clamp-2`, `title` tooltip), detail row in ClientDetailCard
- Tests: update ~5 test files with `notes` in fixtures

### Out of Scope
- FTS index on notes (search remains name + email only)
- Rich text or formatting
- MAX_NOTES_LENGTH validation (separate concern; tracked as risk)
- Mobile column visibility (hidden: `mobileVisible: false`)

## Capabilities

### Modified Capabilities
- `client-management-frontend`: listing column, detail card row, form textarea for notes — extends existing client CRUD without introducing a new bounded context

### New Capabilities
None

## Approach

Full-stack mechanical addition. Pet.notes (`TEXT`, nullable, same rendering) is the exact template. Each layer change is a field propagation with no new logic:

1. Prisma migration adds `notes String? @db.Text`
2. Domain/interfaces propagate `notes: string | null` through Client, inputs, and DTOs
3. Repository maps the column in `mapToClient`, `create` payload, `update` payload, and `search` raw SQL
4. Controller destructures `notes` in `updateClient`
5. Frontend mirrors the DTO shapes, adds textarea to form, column to listing, row to detail
6. All test fixtures gain `notes: null` (existing data) or a sample string

Grid spans: Cliente 3 (was 4), Contacto 4 (was 5), Notas 2, Estado 2, Actions 1 = 12.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `notes` to Client model |
| `api/clients/domain/Client.ts` | Modified | Add `notes` to Client + inputs |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modified | Map column in all CRUD + raw search |
| `api/clients/interface/dtos/*.ts` | Modified | 3 DTOs gain `notes` |
| `api/clients/interface/ClientController.ts` | Modified | Destructure `notes` in update |
| `src/types/client.ts` | Modified | 3 types gain `notes` |
| `src/components/molecules/ClientForm.tsx` | Modified | Textarea field + form data |
| `src/pages/ClientsPage.tsx` | Modified | "Notas" column + grid spans |
| `src/components/organisms/ClientDetailCard.tsx` | Modified | DetailRow for notes |
| `api/clients/**/*.test.ts` | Modified | ~3 backend test files |
| `src/pages/ClientsPage.test.tsx` | Modified | Mock data + assertions |
| `src/pages/ClientDetailPage.test.tsx` | Modified | Mock data |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Contacto column crowded at 1024px with 4 stacked fields | Med | Test at breakpoint; further reduce Cliente/Notas spans if needed |
| No character limit on notes | Low | Add MAX_NOTES_LENGTH in follow-up; TEXT holds 65KB — acceptable for manual notes |
| Raw SQL in `search` misses new column | High | Explicitly add `notes` to SELECT and row mapping — mechanical, not logic-heavy |
| Grid span totals breach 12 | Low | Hand-verify sum = 12; no TypeScript enforcement exists |

## Rollback Plan

- Revert PR / migration. `TEXT NULL` column has no data invariants — dropping it loses no critical data.
- Frontend: revert grid spans to 3-column layout and remove Notas column definition.

## Dependencies

None

## Success Criteria

- [ ] `notes` column exists in `clients` table (nullable TEXT)
- [ ] API returns `notes` in all client endpoints (list, get, search, create, update)
- [ ] Form accepts and saves notes text
- [ ] Listing shows "Notas" column with truncated text + `title` tooltip
- [ ] Detail card shows notes with "Not provided" fallback when null
- [ ] All existing tests pass after fixture updates
- [ ] Grid columns sum to 12 at desktop
