# Design: Add Client Notes Column

## Technical Approach

Mechanical field propagation through all Clean Architecture layers, following `Pet.notes` as the exact template. No new abstractions, no new bounded contexts — just adding `notes: string | null` to every Client-related type, mapping, and UI component that already exists. Changes are cascading but purely additive.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Notes field type | `String? @db.Text` | `VARCHAR(N)`, `LONGTEXT` | Exact match with Pet.notes; TEXT holds 65KB — ample for free-text groomer notes |
| FTS inclusion | No — search remains `name + email` | Include notes in FULLTEXT index | Notes are display-only, not search-relevant. Adding to FTS index would return irrelevant matches (noise) |
| Form field element | `<Input>` (single-line, existing atom) | `<textarea>` (new atom) | PetForm uses `<Input>` for the same `@db.Text` field. Creating a textarea atom adds inconsistency and unnecessary work — TEXT column ≠ textarea UX |
| Character limit | None for v1 | Add `MAX_NOTES_LENGTH` now | Pet.notes also has none. Track as follow-up (constant shared across both entities) |
| Mobile visibility | `mobileVisible: false` | Show on mobile cards | Mobile cards are dense; notes is low-priority info. Same pattern as Estado column |
| Rendering in table | `line-clamp-2` + `title` attribute | Modal/popover, expand row | Minimal, consistent with Tailwind conventions. `title` provides full-text on hover with zero JS |

## Data Flow

```
ClientForm (textarea/input) ──→ ClientCreatePage / ClientEditPage
     │                                    │
     │  CreateClientDto / UpdateClientDto  │
     ▼                                    ▼
ClientController ──→ CreateClientUseCase / UpdateClientUseCase
     │                          │
     │  CreateClientInput /     │
     │  UpdateClientInput       │
     ▼                          ▼
PrismaClientRepository ──→ MySQL `clients.notes TEXT`
     │
     │  mapToClient (snake→camel)
     ▼
Client entity ──→ toClientResponseDto ──→ API response JSON
     │
     ▼
Frontend Client type ──→ ClientsPage (column) / ClientDetailCard (row)
```

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `notes String? @db.Text` to Client model |
| `api/clients/domain/Client.ts` | Modify | Add `notes: string \| null` to Client, CreateClientInput, UpdateClientInput |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modify | `mapToClient`: add `notes` field. `create`: add `notes` payload. `update`: add `notes` to UpdatePayload. `search`: add `notes` to SELECT and row mapping |
| `api/clients/interface/dtos/CreateClientDto.ts` | Modify | Add optional `notes?: string` |
| `api/clients/interface/dtos/UpdateClientDto.ts` | Modify | Add optional `notes?: string \| null` |
| `api/clients/interface/dtos/ClientResponseDto.ts` | Modify | Add `notes: string \| null` to interface and `toClientResponseDto` mapper |
| `api/clients/interface/ClientController.ts` | Modify | `updateClient`: destructure `notes` from body, pass to use case |
| `api/clients/application/UpdateClient.ts` | Modify | Destructure `notes` from input, add to `updateData` |
| `src/types/client.ts` | Modify | Add `notes?: string \| null` to Client, CreateClientDto, UpdateClientDto |
| `src/components/molecules/ClientForm.tsx` | Modify | Add `notes` to `ClientFormData`, `emptyForm`, `handleBlur` set, JSX (Input after address) |
| `src/pages/ClientsPage.tsx` | Modify | Add Notas column (line-clamp-2 + title), redistribute spans: Cliente 3, Contacto 4, Notas 2, Estado 2 |
| `src/components/organisms/ClientDetailCard.tsx` | Modify | Add `<DetailRow label="Notes" value={client.notes} />` between Address and Created |
| `src/pages/ClientCreatePage.tsx` | Modify | Pass `notes: data.notes \|\| undefined` in mutation payload |
| `src/pages/ClientEditPage.tsx` | Modify | Pass `notes: data.notes \|\| null` in mutation payload; add `notes: client.notes ?? ''` to `initialData` |
| `src/utils/validation.ts` | Modify | Add `notes: string` to `ClientFormData` interface |
| Test files (~5) | Modify | Add `notes: null` or sample string to all client fixtures/mocks |

## Grid Span Redistribution

```
Before: Cliente(4) + Contacto(5) + Estado(2) + Actions(1) = 12
After:  Cliente(3) + Contacto(4) + Notas(2) + Estado(2) + Actions(1) = 12
```

## Notas Column Render

```tsx
{
  header: 'Notas',
  render: (c) => (
    <span title={c.notes ?? ''} className="line-clamp-2 text-sm text-on-surface-variant">
      {c.notes || '—'}
    </span>
  ),
  span: 'sm:col-span-2',
  mobileVisible: false,
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Domain | Client entity has `notes: string \| null` | Update fixture objects; verify type compilation |
| Repository | `mapToClient` includes notes; `search` returns notes | Update test fixtures with `notes` field; verify response shape |
| DTO | `toClientResponseDto` maps `client.notes` | Update test client objects; assert `notes` in response |
| Controller | `updateClient` passes `notes` to use case | Update mock body; verify use case receives `notes` |
| Frontend listing | Notas column renders; 4 data columns total | Update mock client array; assert `cell-notas` exists; verify column count |
| Frontend detail | DetailRow renders notes | Update mock client; assert "Notes" label exists |
| Frontend form | Textarea renders; data flows to mutation | Update form submission test; assert `notes` in payload |

## Migration

```bash
npx prisma migrate dev --name add_client_notes
```

Safe migration: nullable TEXT column on existing table. No data loss. Rollback: drop column.

## Open Questions

None — all unknowns resolved during exploration. Pattern is mechanical from Pet.notes.
