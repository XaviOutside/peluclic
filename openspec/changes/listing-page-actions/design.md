# Design: Row Actions + Cross-Reference Buttons on Listing Pages

## Technical Approach

Extend `DataTable` with `CrossRefAction<T>` and `actionSpan` props, render labeled bordered buttons before existing icon-only row actions, then wire consistent cross-reference navigation and delete flows on all three listing pages.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|---|---|---|---|
| `disabled` on CrossRefAction | (A) Guard `onClick` with `&&`, (B) Add optional `disabled?: (row: T) => boolean` | **B** | "Ver mascota" when `petId` is null should show a disabled button, not silently swallow the click. Matches existing UI patterns. |
| actionSpan default | (A) `'col-span-1'`, (B) `'sm:col-span-1'` | **B** | Current DataTable line 224 uses `sm:col-span-1`. Backward compatibility. |
| ClientsPage delete action | (A) `deleteClient` (hard delete), (B) `useDeactivateClient` | **B** | Follows PetsPage pattern with `useDeactivatePet`. Soft-delete preserves history. |
| Grid span for ServicesPage actions | (A) actionSpan=2 for fewer buttons, (B) actionSpan=3 consistent with other pages | **B** | Consistency across all three pages outweighs slightly generous spacing. |

## Data Flow

```
User clicks cross-ref button
  → CrossRefAction.onClick(row)
  → navigate(/pets?clientId=X) or navigate(/clients/:id)
  → Target page reads query param via useSearchParams
  → usePets(clientId) or useServices({ petId }) filters results

User clicks delete row action
  → setConfirmTarget(row)
  → ConfirmDialog opens
  → onConfirm → mutation.mutate(id) → refresh()
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/organisms/DataTable.tsx` | Modify | Add `CrossRefAction<T>` type, `crossRefActions` + `actionSpan` props; render cross-ref buttons before rowActions in same cell |
| `src/pages/ClientsPage.tsx` | Modify | Add `useDeactivateClient`, `ConfirmDialog`, crossRefActions, delete rowAction, `actionSpan="sm:col-span-3"`, and recalculate column spans |
| `src/pages/PetsPage.tsx` | Modify | Add crossRefActions, `actionSpan="sm:col-span-3"`, recalculate column spans |
| `src/pages/ServicesPage.tsx` | Modify | Add crossRefActions, `actionSpan="sm:col-span-3"`, recalculate column spans |

## Interfaces / Contracts

```typescript
export interface CrossRefAction<T> {
  key: string;
  label: string;
  icon: string;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;  // optional guard for conditional disabling
}

// DataTableProps additions:
crossRefActions?: CrossRefAction<T>[];
actionSpan?: string;  // default: 'sm:col-span-1'
```

**Grid span recalculations** (each page must sum to 12):
- **ClientsPage**: Cliente 4→3, Contacto 5→4, Notas 2 (unchanged), Acciones 1→3
- **PetsPage**: Mascota 3, Especie 2, Raza 3→2, Estado 2, Acciones 1→3
- **ServicesPage**: Servicio 3→2, Descripción 3→2, Duración 2, Precio 2, Estado 1, Acciones 1→3

**CrossRefAction rendering** (rendered BEFORE rowActions in actions cell):
```html
<div class="flex flex-wrap gap-2 sm:justify-end {actionSpan}">
  <!-- crossRefActions -->
  <button class="px-3 py-1.5 text-xs font-label-sm bg-surface-container
                 hover:bg-surface-container-high text-on-surface rounded-md
                 transition-colors flex items-center gap-1
                 border border-outline-variant/30
                 disabled:opacity-40 disabled:cursor-not-allowed">
    <span class="material-symbols-outlined text-[14px]">{icon}</span>
    {label}
  </button>
  <!-- existing rowActions (unchanged icon-only buttons) -->
</div>
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (DataTable) | `crossRefActions` render with label+icon, `disabled` state, `actionSpan` override | Vitest + RTL, test button count, labels, disabled attr |
| Unit (pages) | Each page renders correct crossRefAction buttons, delete/deactivate triggers ConfirmDialog, navigation calls | Mock `useNavigate`, `useSearchParams` |
| Integration | Navigation flow: ClientsPage → PetsPage with `?clientId=` param, PetsPage → ServicesPage with `?petId=` param | Verify query param reading and API filtering |

## Migration / Rollout

No database changes, no backend changes. Revert is a single commit reverting DataTable interface changes and page-level wiring.

## Open Questions

- [ ] ServicesPage "Ver cliente": requires pet→client chain lookup. Deferred per proposal scope.
- [ ] `useServiceMutations.ts` does not exist — ServicesPage uses `useServices().deleteService` inline. Design follows existing inline pattern; no new mutation hook file needed.
