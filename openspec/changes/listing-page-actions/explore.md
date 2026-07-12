## Exploration: Row Actions + Cross-Reference Buttons on All Listing Pages

### Current State

The app has three listing pages: `ClientsPage.tsx`, `PetsPage.tsx`, `ServicesPage.tsx`. All use the shared `DataTable.tsx` organism component which renders rows in a 12-column CSS grid with optional `rowActions` as icon-only buttons. None currently have cross-reference navigation buttons.

### Affected Areas

- `src/pages/ClientsPage.tsx` — missing delete action + cross-ref buttons
- `src/pages/PetsPage.tsx` — missing cross-ref buttons; deactivate icon should be `delete`
- `src/pages/ServicesPage.tsx` — missing cross-ref buttons
- `src/components/organisms/DataTable.tsx` — needs new prop for cross-ref buttons; hardcodes `col-span-1` on actions
- `src/components/organisms/DataTable.test.tsx` — tests must cover new props
- `src/hooks/useClientMutations.ts` — `useDeleteClient`/`useDeactivateClient` already exist but unused in ClientsPage
- `src/pages/ClientsPage.test.tsx` — must cover new actions
- `src/pages/PetsPage.tsx` (already has ConfirmDialog and deactivate flow; may need `delete` action with different endpoint)
- `src/pages/ServicesPage.test.tsx` (if exists)

### Current Row Actions — Per Page

| Page | Actions | Missing |
|---|---|---|
| **ClientsPage** | view (`visibility`), edit (`edit`) | **delete/deactivate** action, **"Ver Mascotas"** button, **"Ver Servicios"** button |
| **PetsPage** | view (`visibility`), edit (`edit`), deactivate (`block`, destructive) | **"Ver Servicios"** button, **"Ver Cliente"** button. Note: uses `block` icon, not `delete` |
| **ServicesPage** | view (`visibility`), edit (`edit`), delete (`delete`, destructive) | **"Ver mascota"** button, **"Ver cliente"** button |

### Design Pattern from HTML Sample

Extracted from `openspec/designs/pantalla_listado_clientes/pantalla_listado_clientes_desktop.html` lines 303–320:

**Actions area structure** (inside a `col-span-4` grid cell in a 12-col layout):
```html
<div class="col-span-1 sm:col-span-4 flex flex-wrap sm:justify-end gap-2 mt-2 sm:mt-0">
  <!-- Cross-reference buttons (labeled, bordered) -->
  <button class="px-3 py-1.5 text-xs font-label-sm bg-surface-container
                 hover:bg-surface-container-high text-on-surface rounded-md
                 transition-colors flex items-center gap-1
                 border border-outline-variant/30">
    <span class="material-symbols-outlined text-[14px]">pets</span>
    Ver Mascotas
  </button>
  <button class="px-3 py-1.5 text-xs font-label-sm bg-surface-container
                 hover:bg-surface-container-high text-on-surface rounded-md
                 transition-colors flex items-center gap-1
                 border border-outline-variant/30">
    <span class="material-symbols-outlined text-[14px]">receipt_long</span>
    Ver Servicios
  </button>
  <!-- Icon-only row actions (right-aligned group) -->
  <div class="flex gap-1 ml-auto sm:ml-2">
    <!-- Edit button (secondary color) -->
    <button class="p-1.5 text-secondary hover:bg-secondary-container
                   rounded-md transition-colors" title="Editar">
      <span class="material-symbols-outlined text-[18px]">edit</span>
    </button>
    <!-- Delete button (error/red color) -->
    <button class="p-1.5 text-status-error hover:bg-error-container
                   hover:text-on-error-container rounded-md transition-colors"
            title="Borrar">
      <span class="material-symbols-outlined text-[18px]">delete</span>
    </button>
  </div>
</div>
```

**Key design rules:**
- Cross-ref buttons: `bg-surface-container` background, `border border-outline-variant/30`, 14px icons, `font-label-sm` text
- Icon-only actions: no background normally, `text-secondary` for edit, `text-status-error` for delete (matching existing DataTable behavior)
- Actions area takes `col-span-4` of the 12-col grid (the HTML sample has 3 columns: Client col-span-4, Contact col-span-4, Actions col-span-4)
- **No "view" button in the HTML design sample** — only edit + delete + cross-ref buttons
- The `--color-status-error: #E53935` CSS variable exists in `src/index.css` and maps to Tailwind class `text-status-error`

### DataTable `RowAction<T>` Interface

```typescript
export interface RowAction<T> {
  key: string;
  label: string;       // tooltip / aria-label
  icon: string;        // Material Symbols icon name
  onAction: (row: T) => void;
  destructive?: boolean; // applies red/error styling
}
```

**Current rendering** (DataTable.tsx lines 223–245): Renders each `RowAction` as an icon-only `<button>` inside a `<div className="flex flex-wrap sm:justify-end gap-2 mt-2 sm:mt-0 col-span-1 sm:col-span-1">`. Destructive actions get `text-status-error hover:bg-error-container`, non-destructive get `text-secondary hover:bg-secondary-container`.

**Limitations:**
- The `col-span-1` is hardcoded — the HTML sample uses `col-span-4`
- No support for labeled/button-variant actions
- No support for separating cross-ref buttons from row actions
- Cross-ref buttons require a different visual treatment (background, border, text label)

### Navigation Routes

```
/clients          → ClientsPage
/clients/:id      → ClientDetailPage
/clients/:id/edit → ClientEditPage
/pets             → PetsPage
/pets?clientId=X  → PetsPage (usePets hook accepts clientId filter)
/pets/:id         → PetDetailPage
/pets/:id/edit    → PetEditPage
/services         → ServicesPage
/services?petId=X → ServicesPage (listServices accepts petId filter)
/services/:id     → ServiceDetailPage
/services/:id/edit→ ServiceEditPage
```

### Cross-Reference Navigation Capability

| From Page | Button | Target Route | Feasible? |
|---|---|---|---|
| **ClientsPage** | Ver Mascotas | `/pets?clientId={client.id}` | ✅ Yes. `usePets` hook accepts `clientId`. But PetsPage doesn't read `clientId` from URL yet — needs query param reading. |
| **ClientsPage** | Ver Servicios | `/services` or `/services?clientId=X` | ⚠️ Partial. API `listServices` does NOT accept `clientId` filter in v1. Could navigate to `/services` (unfiltered) or add backend support. |
| **PetsPage** | Ver Servicios | `/services?petId={pet.id}` | ✅ Yes. `listServices` accepts `petId` filter. ServicesPage needs to read query param. |
| **PetsPage** | Ver Cliente | `/clients/{pet.clientId}` | ✅ Yes. `Pet` has `clientId` field. Direct navigation. |
| **ServicesPage** | Ver mascota | `/pets/{service.petId}` | ✅ Yes (if `petId !== null`). `Service` has `petId: number \| null`. |
| **ServicesPage** | Ver cliente | `/clients/{pet.clientId}` | ❌ Not directly. Service→Pet chain requires fetching the pet first to get its `clientId`. Service type has `petId` but no `clientId`. Options: (a) skip this button, (b) navigate to pet detail instead, (c) hydrate client info in the services listing. |

### Delete Mechanism

| Entity | API Endpoint | Hook | Soft Delete? | ConfirmDialog Pattern? |
|---|---|---|---|---|
| Client | `DELETE /clients/:id` | `useDeleteClient` / `useDeactivateClient` | Yes (soft delete + PATCH deactivate) | Used in `ClientListPage.tsx` (legacy), NOT in `ClientsPage.tsx` |
| Pet | `DELETE /pets/:id` | `useDeletePet` / `useDeactivatePet` | Yes (soft delete + PATCH deactivate) | ✅ Yes. PetsPage uses `useDeactivatePet` with `ConfirmDialog` |
| Service | `DELETE /services/:id` | `useServices().deleteService` | Yes | ✅ Yes. ServicesPage has inline delete flow with `ConfirmDialog` |

**ClientsPage gap**: Has `view` + `edit` but NO `delete`/`deactivate`. The `useDeactivateClient` and `useDeleteClient` hooks exist and are imported in `ClientListPage.tsx` (legacy page). The new `ClientsPage.tsx` needs to add a delete action with confirmation dialog, following the same pattern as PetsPage and ServicesPage.

### DataTable Changes Required

The DataTable component needs to support an additional action type for labeled/cross-reference buttons. Current state vs needed:

```typescript
// NEW prop needed
export interface DataTableProps<T> {
  // ... existing props ...
  rowActions?: RowAction<T>[];       // icon-only actions (existing)
  crossRefActions?: CrossRefAction<T>[];  // NEW: labeled bordered buttons
  actionSpan?: string;               // NEW: override the hardcoded col-span-1 (default: "col-span-1")
}

// NEW type
export interface CrossRefAction<T> {
  key: string;
  label: string;    // visible button text
  icon: string;     // material symbol
  onAction: (row: T) => void;
  disabled?: (row: T) => boolean; // e.g., when service.petId is null
}
```

**Rendering order** (matching HTML design): cross-reference buttons first → then icon-only row actions (right-aligned via `ml-auto`).

**`col-span` consideration**: The HTML sample uses `col-span-4` for the actions column (with a 3-column layout: 4+4+4). But the current code has varying column counts per page (ClientsPage has 4+5+2 notation, PetsPage 3+2+3+2, ServicesPage 3+3+2+2+1). The existing `col-span-1` might need to become configurable or auto-calculated.

### Recommendations

1. **DataTable**: Add `crossRefActions?: CrossRefAction<T>[]` prop and `actionSpan?: string` prop. Render cross-ref buttons before row actions in the same actions cell.

2. **ClientsPage**: Add `useDeactivateClient` (matching the existing deactivate pattern from PetsPage) with a `ConfirmDialog`. Add cross-ref buttons: "Ver Mascotas" → `/pets?clientId=X`, "Ver Servicios" → `/services` (general listing, since no clientId filter exists for services).

3. **PetsPage**: Add cross-ref buttons: "Ver Servicios" → `/services?petId=X` (API supports it), "Ver Cliente" → `/clients/{pet.clientId}`. Consider renaming the current "Desactivar" action to use `delete` icon instead of `block` for design consistency with the HTML sample.

4. **ServicesPage**: Add cross-ref button "Ver mascota" → `/pets/{service.petId}` when `petId` is not null (use `disabled` prop when null). For "Ver cliente", since we can't directly navigate from service to client in v1, consider: (a) skip it, (b) navigate to `/pets/{service.petId}` (pet detail, which shows client info), or (c) enhance the service API to return `clientId` when linked via pet.

5. **Navigation to filtered pages**: PetsPage needs to read `?clientId=` from URL query params. ServicesPage needs to read `?petId=`. Both hooks already support these filters. This may require additional work in those pages to handle query param → filter state synchronization.

### Risks

- **DataTable breaking change**: Adding `actionSpan` defaults and new props could break existing page layouts if not careful with defaults
- **ServicesPage "Ver cliente" dead end**: No direct service→client navigation exists in v1. Either needs backend work or UX compromise.
- **PetsPage URL filtering**: The `PetsPage` currently does client-side filtering by name only. Adding `?clientId=X` support requires reading the query param on mount and passing it to `usePets(clientId)`.
- **ServicesPage query params**: Same issue — needs to read `?petId=` and pass to `useServices({ petId })`.
- **Column span calculations**: With cross-ref buttons taking more space, the `col-span-1` default may be too narrow. The HTML sample uses `col-span-4`. Each page might need different span values depending on its column layout.

### Ready for Proposal

**Yes.** All mutations, routes, types, and design references exist. The main work is:
1. Extend DataTable with `CrossRefAction` support + configurable `actionSpan`
2. Add delete action + cross-ref buttons to ClientsPage
3. Add cross-ref buttons to PetsPage
4. Add cross-ref buttons to ServicesPage
5. Handle URL query params for filtered navigation
6. Update tests
