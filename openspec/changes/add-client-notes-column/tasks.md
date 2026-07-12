# Tasks: Add Client Notes Column

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~110 (52 production, 58 test fixtures) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Backend RED — Types Break Compilation

- [ ] 1.1 Add `notes String? @db.Text` to Client model in `prisma/schema.prisma`
- [ ] 1.2 Add `notes: string \| null` to Client, `notes?: string \| null` to CreateClientInput, `notes?: string \| null` to UpdateClientInput in `api/clients/domain/Client.ts`
- [ ] 1.3 Add `notes?: string` to CreateClientDto in `api/clients/interface/dtos/CreateClientDto.ts`
- [ ] 1.4 Add `notes?: string \| null` to UpdateClientDto in `api/clients/interface/dtos/UpdateClientDto.ts`
- [ ] 1.5 Add `notes: string \| null` to ClientResponseDto + `toClientResponseDto` mapper in `api/clients/interface/dtos/ClientResponseDto.ts`

## Phase 2: Backend GREEN — Fixtures + Implementation

- [ ] 2.1 Add `notes: null` to all client fixtures in backend tests (~8 files: CreateClient, GetClient, SearchClients, UpdateClient, SoftDeleteClient, DeactivateClient, ClientController, PrismaClientRepository.integration)
- [ ] 2.2 Add `notes` to `mapToClient` param type + return, `create` payload, `update` conditional, `search` SELECT + row mapping in `api/clients/infrastructure/PrismaClientRepository.ts`
- [ ] 2.3 Destructure `notes` from input + add to updateData in `api/clients/application/UpdateClient.ts`
- [ ] 2.4 Destructure `notes` from body + pass to use case in `api/clients/interface/ClientController.ts` updateClient (line 129–136)
- [ ] 2.5 Run backend tests: `npx vitest run api/clients` — all pass

## Phase 3: Frontend RED — Types Break Compilation

- [ ] 3.1 Add `notes: string \| null` to Client, `notes?: string` to CreateClientDto, `notes?: string \| null` to UpdateClientDto in `src/types/client.ts`
- [ ] 3.2 Add `notes: string` to ClientFormData in `src/utils/validation.ts`

## Phase 4: Frontend GREEN — Fixtures + UI

- [ ] 4.1 Add `notes: null` to mock client fixtures in ~5 frontend test files (ClientsPage, ClientDetailPage, ClientListPage, ClientTable, ClientForm)
- [ ] 4.2 Add `notes: ''` to `emptyForm`, add to `ClientFormData` + `handleBlur` touched set, add `<Input label="Notes" ...>` after Address in `src/components/molecules/ClientForm.tsx`
- [ ] 4.3 Add Notas column (`line-clamp-2` + `title`, `mobileVisible: false`, span `sm:col-span-2`) + redistribute spans to Cliente(3)/Contacto(4)/Notas(2) in `src/pages/ClientsPage.tsx`
- [ ] 4.4 Add `<DetailRow label="Notes" value={client.notes} />` between Address and Created in `src/components/organisms/ClientDetailCard.tsx`
- [ ] 4.5 Pass `notes: data.notes \|\| undefined` in mutation payload in `src/pages/ClientCreatePage.tsx`
- [ ] 4.6 Pass `notes: data.notes \|\| null` in update payload + add `notes: client.notes ?? ''` to initialData in `src/pages/ClientEditPage.tsx`
- [ ] 4.7 Run frontend tests: `npx vitest run src` — all pass

## Phase 5: REFACTOR + Verify

- [ ] 5.1 Generate migration: `npx prisma migrate dev --name add_client_notes`
- [ ] 5.2 Update `ClientsPage.test.tsx` — rename "renders three columns" to "four columns", add Notas column header assertion
- [ ] 5.3 Run full test suite: `npm test` — backend + frontend pass
- [ ] 5.4 Run build: `npm run build` — TypeScript compilation succeeds
- [ ] 5.5 Run lint: `npm run lint` — 0 errors
