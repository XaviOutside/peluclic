# Proposal: Move Last Service Date into Client Info Row

## Intent

Restructure the client listing from 4 columns to 3 by integrating the last service date into the Cliente name column and removing the standalone "Último servicio" column. This reduces horizontal clutter and groups client identity information (name, ID, last service) in one logical block. The Contacto column already renders phone2 and address conditionally — those fields need no changes.

## Scope

### In Scope
- Add `formatServiceDate(c.lastServiceDate)` as a third line below the name and ID in the Cliente column
- Remove the standalone "Último servicio" column (lines 91–95 of `ClientsPage.tsx`)
- Adjust column grid spans from `3+3+2+3` → `4+5+2`
- Update `ClientsPage.test.tsx` to expect 3 columns instead of 4

### Out of Scope
- No backend or API changes (all data already available)
- No type changes (`Client` type already has `lastServiceDate`)
- No Contacto column changes (phone2 and address already rendered)
- No StatusBadge changes
- No DataTable component changes

## Capabilities

### New Capabilities
<!-- None — this change modifies existing capabilities only. -->
None.

### Modified Capabilities
- `client-management-frontend`: "Client List View" requirement changes from 4 columns to 3; "Last Service Date Column" requirement changes from standalone column to integrated date line within the Cliente column.

## Approach

Minimal inline rendering in the Cliente column using the already-imported `formatServiceDate` utility. The date appears as a `text-sm text-on-surface-variant` line below the ID, matching the existing secondary-info styling. No new imports needed. Apply grid span redistribution: Cliente `sm:col-span-4` (+1), Contacto `sm:col-span-5` (+2), Estado `sm:col-span-2` (unchanged).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/ClientsPage.tsx` | Modified | Add date to column 1 render; delete column 4; adjust spans |
| `src/pages/ClientsPage.test.tsx` | Modified | 4-column → 3-column assertion; remove "Último servicio" header test |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Test assertions for 4 columns break | High | Update column count and header text assertions |
| Mobile card layout regresses | Low | Date moves to always-visible Cliente column; mobile card actually becomes more compact |
| Span redistribution causes overflow | None | 4+5+2+1(actions)=12; simple arithmetic |

## Rollback Plan

Revert `ClientsPage.tsx` and `ClientsPage.test.tsx` to previous versions via `git revert`. No DB migrations, no API changes — purely frontend.

## Dependencies

None. No backend, schema, or external service changes.

## Success Criteria

- [ ] Client listing renders 3 columns: Cliente, Contacto, Estado
- [ ] Cliente column shows name, ID, and last service date (or — for null)
- [ ] Contacto column continues to show email, phone, phone2, address as before
- [ ] Mobile card layout shows date integrated into client identity block
- [ ] All existing tests pass after update
