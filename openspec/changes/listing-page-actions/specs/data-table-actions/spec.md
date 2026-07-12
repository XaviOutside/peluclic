# DataTable Actions Specification

## Purpose

Extend the DataTable organism with labeled cross-reference action buttons rendered alongside icon-only row actions.

## Requirements

### Requirement: CrossRefAction Type

The system MUST support a `CrossRefAction<T>` type:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | Yes | Button text (e.g. "Ver Mascotas") |
| `icon` | `string` | Yes | Material Symbol name |
| `onClick` | `(item: T) => void` | Yes | Click handler |
| `disabled` | `(item: T) => boolean` | No | Per-row disable predicate |

#### Scenario: Button renders with icon and label

- GIVEN a CrossRefAction with label="Ver Mascotas", icon="pets"
- WHEN DataTable renders a row
- THEN a labeled button shows icon (14px) + label text with gap-1

#### Scenario: disabled predicate returns true

- GIVEN a CrossRefAction with `disabled: (item) => item.petId === null`
- WHEN rendering a row where petId is null
- THEN the button is disabled and visually dimmed

### Requirement: crossRefActions Prop

The DataTable MUST accept `crossRefActions?: CrossRefAction<T>[]`. When provided, the actions cell SHALL render cross-ref buttons BEFORE standard icon-only RowActions.

#### Scenario: crossRefActions present

- GIVEN `crossRefActions={[verMascotas, verServicios]}`
- WHEN DataTable renders
- THEN two labeled buttons precede the icon-only edit/delete buttons in the same cell

#### Scenario: crossRefActions omitted

- GIVEN DataTable without crossRefActions prop
- WHEN DataTable renders
- THEN only icon-only RowActions appear (backward-compatible)

### Requirement: actionSpan Prop

The DataTable MUST accept `actionSpan?: string` defaulting to `"sm:col-span-1"`. This CSS class SHALL apply to the actions cell.

#### Scenario: Custom span on desktop

- GIVEN `actionSpan="col-span-1 sm:col-span-4"`
- WHEN viewed on desktop
- THEN actions cell spans 4 grid columns

### Requirement: Cross-Ref Button Styling

Cross-reference buttons MUST match the design reference: `px-3 py-1.5 text-xs bg-surface-container border border-outline-variant/30 rounded-md flex items-center gap-1` with `hover:bg-surface-container-high`. Icon size: 14px.
