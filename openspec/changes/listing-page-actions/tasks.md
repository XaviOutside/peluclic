# Tasks: Row Actions + Cross-Reference Buttons on Listing Pages

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~570 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: DataTable (120) → PR 2: ClientsPage (190) → PR 3: PetsPage+ServicesPage (262) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | DataTable: CrossRefAction + actionSpan | PR 1 | Foundation; no page changes. Base: feature branch |
| 2 | ClientsPage: delete + crossRefActions | PR 2 | First consumer, proves pattern. Base: PR 1 branch |
| 3 | PetsPage + ServicesPage crossRefActions | PR 3 | Remaining consumers + query-param nav. Base: PR 2 branch |

## Phase 1: DataTable RED

- [ ] 1.1 Write RED test: `crossRefActions` render labeled buttons with icon in DataTable.test.tsx
- [ ] 1.2 Write RED test: `disabled` predicate sets `disabled` attribute when true
- [ ] 1.3 Write RED test: `actionSpan="sm:col-span-3"` applies CSS class to actions cell

## Phase 2: DataTable GREEN

- [ ] 2.1 Add `CrossRefAction<T>` interface to `src/components/organisms/DataTable.tsx`
- [ ] 2.2 Add `crossRefActions` + `actionSpan` props to `DataTableProps`
- [ ] 2.3 Render crossRefAction buttons before rowActions in actions cell (labeled, bordered, 14px icon)
- [ ] 2.4 Apply `actionSpan` to header "Actions" column and cell grid div (default: `sm:col-span-1`)

## Phase 3: ClientsPage RED

- [ ] 3.1 Update ClientsPage.test.tsx: mock `useDeactivateClient`, test delete icon opens ConfirmDialog
- [ ] 3.2 Write RED test: "Ver Mascotas" cross-ref navigates to `/pets?clientId=X`
- [ ] 3.3 Write RED test: "Ver Servicios" cross-ref navigates to `/services`

## Phase 4: ClientsPage GREEN

- [ ] 4.1 Import `useDeactivateClient`, `ConfirmDialog`; add confirmTarget state, deactivation flow
- [ ] 4.2 Define `crossRefActions`: Ver Mascotas → `/pets?clientId=`, Ver Servicios → `/services`
- [ ] 4.3 Add delete RowAction (destructive); pass `actionSpan="sm:col-span-3"`, `crossRefActions` to DataTable
- [ ] 4.4 Recalculate column spans: Cliente 4→3, Contacto 5→4, Acciones 1→3

## Phase 5: PetsPage RED + GREEN

- [ ] 5.1 Create PetsPage.test.tsx with mocks (`usePets`, `useNavigate`, `useSearchParams`)
- [ ] 5.2 Write RED tests: cross-ref buttons render; navigate to `/services?petId=X`, `/clients/:id`
- [ ] 5.3 Write RED test: `?clientId=` query param pre-filters pet listing
- [ ] 5.4 Add `crossRefActions` (Ver Cliente → `/clients/{p.clientId}`, Ver Servicios → `/services?petId=`), `actionSpan`, query-param reading via `useSearchParams`
- [ ] 5.5 Recalculate span: Raza 3→2

## Phase 6: ServicesPage RED + GREEN

- [ ] 6.1 Create ServicesPage.test.tsx with mocks (`useServices`, `useNavigate`, `useSearchParams`)
- [ ] 6.2 Write RED tests: "Ver mascota" button renders, disabled when `petId` is null, navigates when present
- [ ] 6.3 Write RED test: `?petId=` query param pre-filters service listing
- [ ] 6.4 Add `crossRefActions` with `disabled` predicate (`petId === null`), `actionSpan`, query-param reading
- [ ] 6.5 Recalculate spans: Servicio 3→2, Descripción 3→2

## Phase 7: Verify

- [ ] 7.1 Run `npm test` — all tests green, full suite
- [ ] 7.2 Run `npm run lint` — 0 errors, 0 warnings
- [ ] 7.3 Run `npm run build` — clean compilation
