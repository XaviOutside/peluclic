# Proposal: Row Actions + Cross-Reference Buttons on Listing Pages

## Intent

All three listing pages (Clients, Pets, Services) need consistent row actions and cross-reference navigation buttons matching the HTML design sample at `openspec/designs/pantalla_listado_clientes/`. Currently each page has different sets of icon-only actions, and none has cross-reference links to related entities.

## Scope

### In Scope
- Add `CrossRefAction<T>` type + `crossRefActions` + `actionSpan` props to `DataTable`
- ClientsPage: add delete action, "Ver Mascotas" → `/pets?clientId=X`, "Ver Servicios" → `/services`
- PetsPage: add "Ver Servicios" → `/services?petId=X`, "Ver Cliente" → `/clients/{pet.clientId}`
- ServicesPage: add "Ver mascota" → `/pets/{service.petId}` (disabled when `petId` is null)
- Read `?clientId=` and `?petId=` query params on PetsPage and ServicesPage
- Update existing tests

### Out of Scope
- ServicesPage "Ver cliente" (requires pet→client chain — deferred)
- Backend API changes (existing endpoints suffice)
- Mobile cross-ref layout changes (extend desktop pattern to mobile later)

## Capabilities

### New Capabilities
- `data-table-actions`: `CrossRefAction<T>` type (label + icon + onClick + disabled), `crossRefActions` prop, `actionSpan` prop on DataTable

### Modified Capabilities
- `client-management-frontend`: delete/deactivate action on listing rows; cross-ref buttons "Ver Mascotas" and "Ver Servicios"
- `pet-management-frontend`: cross-ref buttons "Ver Servicios" and "Ver Cliente" on listing rows
- `services-api-frontend`: cross-ref button "Ver mascota" on listing rows (disabled when `petId` is null)

## Approach

1. **DataTable**: Extend interface with `CrossRefAction<T>` and `actionSpan` (default `"col-span-1"`). Render cross-ref buttons before icon actions in same cell. Cross-ref button style: `bg-surface-container border border-outline-variant/30 rounded-md` with 14px icon + label text.
2. **ClientsPage**: Add `useDeactivateClient` hook with `ConfirmDialog`. Read `clientId` from URL to pass to `usePets`; navigate to pets listing filtered by client.
3. **PetsPage**: Add `clientId` query param reading for cross-ref navigation from ClientsPage. No column changes needed.
4. **ServicesPage**: Add `petId` query param reading. Conditionally render "Ver mascota" via `disabled` when `petId` is null.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/organisms/DataTable.tsx` | Modified | New props: `crossRefActions`, `actionSpan` |
| `src/components/organisms/DataTable.test.tsx` | Modified | Cover new props |
| `src/pages/ClientsPage.tsx` | Modified | Delete action + cross-ref buttons |
| `src/pages/ClientsPage.test.tsx` | Modified | Cover new actions |
| `src/pages/PetsPage.tsx` | Modified | Cross-ref buttons + URL query param |
| `src/pages/ServicesPage.tsx` | Modified | Cross-ref buttons + URL query param |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| DataTable breaking change | Low | `actionSpan` defaults to `"col-span-1"`; `crossRefActions` optional |
| Query param sync with existing client-side filter on PetsPage | Medium | Merge query param into initial filter state; clearable |
| Missing `useDeactivateClient` import path | Low | Already exists in `useClientMutations.ts` |

## Rollback Plan

Revert DataTable to previous interface; remove `crossRefActions` and `actionSpan` props; restore page-level changes. No database or backend changes.

## Dependencies

- None. All required hooks (`useDeactivateClient`, `usePets` with `clientId`, `listServices` with `petId`) already exist.

## Success Criteria

- [ ] All three listing pages show cross-reference buttons matching the HTML design style
- [ ] ClientsPage has a working delete action with confirmation dialog
- [ ] "Ver Mascotas" on ClientsPage navigates to `/pets?clientId=X` with filtered results
- [ ] "Ver Servicios" on PetsPage navigates to `/services?petId=X` with filtered results
- [ ] Existing tests pass; new tests cover `CrossRefAction` rendering + disabled state
