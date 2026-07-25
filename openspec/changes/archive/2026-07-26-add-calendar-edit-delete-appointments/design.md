# Design: Add Appointment Edit and Cancel to Calendar

## Technical Approach

Extend `AppointmentModal` with a tri-mode render (create/edit/view) gated by an optional `appointment` prop. Add a cancel icon to `AppointmentCard` that propagates upward through `AppointmentsPage` → `ConfirmDialog` → `useCancelAppointment`. Introduce `useAppointmentMutations` hook following the existing `useClientMutations` pattern for update + cancel operations.

## Architecture Decisions

| Decision | Choice | Alt | Rationale |
|---|---|---|---|
| Mode derivation | Derive internally from `appointment?.status` | Explicit `mode` prop | One prop (`appointment`) controls all modes; no risk of prop-mode mismatch |
| `onUpdated` vs `onCreated` | Separate callback props | Single `onSuccess` | Keeps semantics clear; create refetches full list, edit refetches to update matched card |
| Cancel on card, not modal | `onCancel` prop on `AppointmentCard` → `ConfirmDialog` in page | Cancel button inside modal | Product decision; cancelling from card surface is direct, no modal open/close dance |
| Hook pattern | Generic `useMutation<TArgs, TResponse>` like `useClientMutations.ts` | `useMutation` from TanStack Query | Existing project convention; zero new deps; consistent loading/error/reset API |

## Data Flow

```
Card click  ──→ setSelectedAppointment ──→ AppointmentModal(appointment) ──→ updateMutation ──→ onUpdated ──→ refetch
Card × icon ──→ setCancelTarget ──→ ConfirmDialog(confirm) ──→ cancelMutation ──→ refetch + clearCancelTarget
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/organisms/AppointmentModal.tsx` | Modify | Add `appointment` & `onUpdated` props; tri-mode (create/edit/view); status selector; conditional field locking |
| `src/components/organisms/AppointmentCard.tsx` | Modify | Add `onCancel` prop; render cancel icon (top-right) when status ∈ {0,1}; `stopPropagation` so icon doesn't trigger card `onClick` |
| `src/pages/AppointmentsPage.tsx` | Modify | Add `selectedAppointment` + `cancelTarget` state; wire `useAppointmentMutations`, `ConfirmDialog`, and card `onCancel` |
| `src/hooks/useAppointmentMutations.ts` | Create | `useUpdateAppointment()` + `useCancelAppointment()` following `useClientMutations` generic pattern |
| `src/locales/en/appointments.json` | Modify | Add `form.saveUpdate`, `form.statusLabel`, `form.close`, `cancel.*`, `errors.updateFailed`, `errors.cancelFailed` |
| `src/locales/es/appointments.json` | Modify | Same keys, Spanish translations |

## Interfaces / Contracts

### AppointmentModal — new/modified props

```typescript
export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;           // existing — create success
  onUpdated?: () => void;          // NEW — edit success refetch
  appointment?: Appointment;       // NEW — absent=create, present=edit/view (derived from status)
  workStartTime?: string;
  workEndTime?: string;
}
```

### AppointmentCard — modified props

```typescript
export interface AppointmentCardProps {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;  // NEW
}
```

### useAppointmentMutations

```typescript
export function useUpdateAppointment(): {
  mutate: (id: number, data: UpdateAppointmentDto) => Promise<Appointment | void>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
};

export function useCancelAppointment(): {
  mutate: (id: number) => Promise<Appointment | void>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
};
```

## AppointmentModal Tri-Mode Design

| Mode | Trigger | Fields Editable | Submit Button |
|---|---|---|---|
| **Create** | `appointment` prop absent | All (client, pet, date, time, notes) | "Save Appointment" |
| **Edit (pending)** | `appointment.status === 0` | Date, time, notes, status — pet READONLY | "Update" |
| **Edit (confirmed)** | `appointment.status === 1` | Notes ONLY — date, time, status, pet locked | "Update" |
| **View-only** | `appointment.status ∈ {2,3}` | None — all fields readonly | No save; only "Close" |

Pre-fill on open: `appointment` prop sets initial form state. On close, reset all state (existing `resetForm()` covers this).

## Status Transition Rules

| From | Valid To | In Dropdown | Notes |
|---|---|---|---|
| 0 (pending) | 1 (confirmed), 2 (completed) | 0, 1, 2 | Full progression available |
| 1 (confirmed) | 2 (completed) | 1, 2 | Cannot revert to pending |
| ANY | 3 (cancelled) | NOT in dropdown | Cancellation via card icon only |
| 2, 3 | none | N/A | Terminal — modal is view-only |

Backend PATCH validates transitions; frontend enforces via dropdown options.

## ConfirmDialog Integration

- `AppointmentCard.onCancel` sets `cancelTarget: Appointment | null` in `AppointmentsPage`
- `cancelTarget !== null` opens `ConfirmDialog` with:
  - `title`: `t('appointments:cancel.title')`
  - `message`: `t('appointments:cancel.message', { petName, date, time })`
  - `destructive: true`
- Confirm calls `cancelMutation.mutate(cancelTarget.id)` → on success, refetch appointments + clear `cancelTarget`

## i18n Key Design

**Namespace**: `appointments` (all keys under `src/locales/{en,es}/appointments.json`)

| Key | EN | ES |
|---|---|---|
| `form.editTitle` | ✅ exists | ✅ exists |
| `form.saveUpdate` | "Update" | "Actualizar" |
| `form.statusLabel` | "Status" | "Estado" |
| `form.close` | "Close" | "Cerrar" |
| `cancel.title` | "Cancel Appointment" | "Cancelar Cita" |
| `cancel.message` | "Cancel {{petName}}'s appointment on {{date}} at {{time}}?" | "¿Cancelar cita de {{petName}} el {{date}} a las {{time}}?" |
| `cancel.confirm` | "Yes, cancel it" | "Sí, cancelarla" |
| `errors.updateFailed` | "Failed to update the appointment. Please try again." | "Error al actualizar la cita. Inténtelo de nuevo." |
| `errors.cancelFailed` | "Failed to cancel the appointment. Please try again." | "Error al cancelar la cita. Inténtelo de nuevo." |

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (Vitest) | `useAppointmentMutations` loading/error/success states | Mock service layer; assert state transitions |
| Component (Vitest) | `AppointmentModal` tri-mode rendering + field locking | Render per mode; assert disabled/readonly fields |
| Component (Vitest) | `AppointmentCard` cancel icon conditional render | Test with status 0–3; assert icon presence/absence |
| Integration (Vitest) | `AppointmentsPage` state wiring: card click → modal, cancel → dialog | Render with mock data; simulate clicks |
| E2E (Playwright) | Full flows: edit save, cancel confirm | `data-testid` selectors; verify calendar refreshes |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Edit mode is gated by optional `appointment` prop; omitting it preserves existing create-only behavior. Cancel icon is gated by `onCancel` prop presence.

## Open Questions

None — all product decisions confirmed in proposal.
