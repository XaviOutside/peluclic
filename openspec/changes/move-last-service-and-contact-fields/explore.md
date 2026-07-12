# Exploration: Move Last Service & Contact Fields in Client Listing

**Date**: 2026-07-12  
**Project**: pfmaster  
**Change**: move-last-service-and-contact-fields  
**Phase**: explore  
**Store**: hybrid (Engram + OpenSpec)

---

## Executive Summary

The user wants to restructure the client listing columns by merging the "Último servicio" column into the "Cliente" column and ensuring phone2/address appear in the "Contacto" column. **Key discovery**: phone2 and address are already rendered conditionally in the Contacto column (added in the `2026-07-11-client-listing-enhancements` change). The only actual work needed is moving the `lastServiceDate` rendering from the 4th column into the 1st column and removing the 4th column entirely.

---

## Current State

### ClientsPage.tsx Column Layout (lines 45–96)

The list page renders a 4-column table using the `DataTable` organism component with a 12-column CSS grid:

| # | Header | Span | mobileVisible | Render |
|---|--------|------|---------------|--------|
| 1 | Cliente | `sm:col-span-3` | true (default) | Bold name + `<br>` + muted `#{id}` |
| 2 | Contacto | `sm:col-span-3` | true (default) | Flex column: email, phone, phone2†, address† (each with material icon) |
| 3 | Estado | `sm:col-span-2` | **false** | `<StatusBadge status={c.status} />` |
| 4 | Último servicio | `sm:col-span-3` | true (default) | `formatServiceDate(c.lastServiceDate)` |
| _actions_ | _Actions_ | `col-span-1` | — | View + Edit icon buttons |

> † phone2 and address are already rendered conditionally (lines 69–80). They use the same icon + text pattern as email/phone.

**Grid distribution**: 3 + 3 + 2 + 3 = 11 columns for data + 1 for actions = 12 total.

### Contacto Column — Already Has phone2 and address (lines 57–84)

```tsx
render: (c) => (
  <div className="flex flex-col gap-1 text-sm">
    <span>{/* mail icon */} {c.email}</span>
    <span>{/* phone icon */} {c.phone}</span>
    {c.phone2 && (
      <span>{/* phone icon */} {c.phone2}</span>
    )}
    {c.address && (
      <span>{/* location icon */} {c.address}</span>
    )}
  </div>
)
```

The Contacto column already handles all four fields with conditional rendering. **No change needed here.**

### Client Type (`src/types/client.ts`)

All required fields are already in the frontend type:

```typescript
interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;        // ← already rendered in Contacto
  address: string | null;       // ← already rendered in Contacto
  status: 'active' | 'inactive';
  lastServiceDate: string | null; // ← currently in column 4
  createdAt: string;
  updatedAt: string;
}
```

### formatServiceDate Utility (`src/utils/format.ts:32–40`)

```typescript
export function formatServiceDate(dateStr: string | null): string {
  if (!dateStr) return '—';        // null → em dash
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`; // DD/MM/YYYY
}
```

Already imported in `ClientsPage.tsx` (line 10). Returns `—` for null/missing/invalid dates, `DD/MM/YYYY` otherwise.

### StatusBadge Component (`src/components/molecules/StatusBadge.tsx`)

```tsx
export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'active') return <Badge color="green">Active</Badge>;
  return <Badge color="gray">Inactive</Badge>;
}
```

Column 3 unchanged — stays as-is.

### DataTable Mobile Rendering Behavior

The `DataTable` organism (lines 167–251) renders:
- **Desktop** (`sm:`): 12-column grid with hidden header row
- **Mobile**: single-column card stack with column labels as section headers

For each column:
- `mobileVisible: false` → column hidden on mobile entirely (Estado column)
- First column (isFirst): avatar + content, no mobile label
- Other columns: mobile label (column header text) + rendered content

**After the merge**: The Cliente column on mobile will show avatar + 3-row content (name, ID, date). Estado is already hidden on mobile. Contacto column shows stacked fields. The UX improves because "Último servicio" no longer appears as a separate mobile card section — it's integrated into the client identity section.

---

## Affected Areas

| File | Impact | Description |
|------|--------|-------------|
| `src/pages/ClientsPage.tsx` | **Modified** | Add `lastServiceDate` to Cliente column (line 48–55); remove Último servicio column (lines 91–95); adjust span values |
| `src/pages/ClientsPage.test.tsx` | **Modified** | Update column count assertion; adjust test scoping for date rendering within Cliente column |
| `src/types/client.ts` | **No change** | All fields already present |
| `src/utils/format.ts` | **No change** | `formatServiceDate` already exists |
| `src/components/molecules/StatusBadge.tsx` | **No change** | Unchanged |
| `src/components/organisms/DataTable.tsx` | **No change** | Generic component, unaffected by column content |

---

## Approaches

### Approach 1 — Inline rendering in Cliente column (Recommended)

Add `lastServiceDate` directly into the existing Cliente column render function using the already-imported `formatServiceDate`.

**New Cliente column render**:
```tsx
render: (c) => (
  <>
    <span className="font-semibold">{c.name}</span>
    <br />
    <span className="text-sm text-on-surface-variant">#{c.id}</span>
    <br />
    <span className="text-sm text-on-surface-variant">
      {formatServiceDate(c.lastServiceDate)}
    </span>
  </>
)
```

**Span redistribution**: 4+5+2 = 11 (data) + 1 (actions) = 12

| Column | Span | Rationale |
|--------|------|-----------|
| Cliente | `sm:col-span-4` (was 3) | 3 rows of content needs more horizontal space |
| Contacto | `sm:col-span-5` (was 3) | Up to 4 stacked rows needs the most width |
| Estado | `sm:col-span-2` (unchanged) | Badge is narrow; unchanged |

**Pros**:
- Minimal change: one column modified, one deleted
- No new imports needed
- No backend changes
- Uses existing formatting utility
- Clear visual hierarchy: name → ID → date

**Cons**:
- Date has no label/icon to distinguish it from ID (both are `text-sm text-on-surface-variant`)
- Could be ambiguous which date is shown

**Effort**: Low (one file + tests)

---

### Approach 2 — Add icon prefix to last service date

Same as Approach 1 but add a calendar/material icon before the date for visual distinction:

```tsx
<span className="flex items-center gap-1 text-sm text-on-surface-variant">
  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">calendar_month</span>
  {formatServiceDate(c.lastServiceDate)}
</span>
```

**Pros**:
- Icon visually distinguishes date from ID
- Consistent with Contacto column icon pattern

**Cons**:
- More visual noise in the Cliente column
- Slightly more code

**Effort**: Low

---

### Approach 3 — Label + value for date

Add a small label before the date value:

```tsx
<span className="text-sm text-on-surface-variant">
  Último servicio: {formatServiceDate(c.lastServiceDate)}
</span>
```

**Pros**:
- Explicit and unambiguous
- No icon dependency

**Cons**:
- Takes more horizontal space
- "Último servicio:" text is longer than the date itself for short values

**Effort**: Low

---

## Recommendation

**Approach 1** (bare date below ID). Rationale:

1. **Minimalism**: The Cliente column already has `font-semibold` for the name, making visual hierarchy clear. The date is secondary information — keeping it simple avoids clutter.
2. **Consistency**: Both ID (`#{id}`) and date use `text-sm text-on-surface-variant`, creating a uniform secondary-info layer.
3. **Context**: The date format is unambiguous. DD/MM/YYYY doesn't look like an ID, so there's no visual confusion risk.
4. **DESIGN.md alignment**: The design system values "spaciousness and clarity" — a clean 3-line block without extra icons or labels embodies this.

If user feedback indicates confusion between ID and date, **Approach 2** (calendar icon) is a low-cost follow-up.

---

## Mobile Impact Analysis

### Current Mobile Behavior
- Cliente: avatar + name → ID (2 rows)
- Contacto: labeled fields (email, phone, phone2, address)
- Estado: **hidden** (`mobileVisible: false`)
- Último servicio: labeled "Último servicio" → formatted date

### After Change
- Cliente: avatar + name → ID → date (3 rows)
- Contacto: unchanged
- Estado: unchanged (hidden)
- Último servicio: removed entirely

The mobile card becomes more compact — 2 sections instead of 3 visible sections. The last service date is integrated into the client identity block, which is logical since it's an attribute of the client, not a separate entity.

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Test assertion for 4 columns breaks | **High** | `ClientsPage.test.tsx` line 58 asserts "four columns" — must update to "three columns" |
| Test for "Último servicio" header text breaks | **High** | `screen.getAllByText('Último servicio')` will fail — remove or update assertion |
| Span redistribution causes layout overflow | **Low** | 4+5+2 = 11 + 1 = 12; simple arithmetic, no overflow |
| Other pages affected | **None** | PetsPage, ServicesPage define their own columns independently |
| Date rendering confusion | **Low** | DD/MM/YYYY format is unambiguous; can add icon later if needed |

---

## Ready for Proposal

**Yes** — the exploration is complete. The main finding is that phone2/address are already implemented, so the scope reduces to:
1. Move `lastServiceDate` into the Cliente column (lines 48–55)
2. Delete the Último servicio column (lines 91–95)
3. Update tests to reflect 3-column layout
4. No backend, type, or utility changes needed

---

## Key Learnings

- **phone2 and address were already rendered** in the `2026-07-11-client-listing-enhancements` change. The Contacto column (lines 69–80) conditionally renders both fields with material icons — no code change needed there.
- The `formatServiceDate` utility at `src/utils/format.ts:32` is already imported in ClientsPage.tsx — reuse is a one-line addition.
- Grid math: Current spans 3+3+2+3=11. New spans 4+5+2=11. Simple redistribution, no overflow risk.
- Mobile: Estado is already hidden on mobile. Último servicio was visible. After merge, the date moves to the always-visible Cliente column, so mobile UX actually improves (more compact, date integrated into identity).


*Generated by sdd-explore skill · pfmaster · 2026-07-12*
