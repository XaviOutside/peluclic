# Proposal: Add Appointment Edit and Cancel to Calendar

## Intent

Users can only CREATE appointments from the calendar today. To correct scheduling mistakes or cancel appointments, they must delete and recreate — losing context. The backend PATCH and DELETE routes already exist and are tested; the frontend service functions `updateAppointment()` and `cancelAppointment()` are wired. The gap is purely UI: the calendar cards and modal lack edit/cancel affordances.

## Scope

### In Scope
- **Edit modal**: extend `AppointmentModal` with an edit mode (pre-filled fields, PATCH on submit)
- **Card cancel button**: add a cancel icon to `AppointmentCard` → `ConfirmDialog` → `cancelAppointment()`
- **Status selector**: dropdown in edit modal for transitions (pending → confirmed → completed)
- **`useAppointmentMutations` hook**: `updateMutation` + `cancelMutation` with loading/error states
- **i18n keys**: update labels for edit title, cancel confirm, status selector, and error messages (EN + ES)
- **Immutable state guard**: completed (2) and cancelled (3) appointments are read-only — modal opens view-only, no card cancel button

### Out of Scope
- Editing the pet field — locked to the originally selected pet (product decision)
- Full edit for confirmed appointments — only notes editable when status=1 (product decision)
- Undo cancel — cancelled status is terminal
- Service picker or multi-pet appointments
- Appointment detail page — edit happens inline via modal

## Capabilities

### New Capabilities
- `useAppointmentMutations`: React hook wrapping `updateAppointment()` and `cancelAppointment()` with loading, error, and success state management

### Modified Capabilities
- `appointment-calendar-frontend`: `AppointmentModal` gains edit mode (pre-fill, status selector, PATCH submit); `AppointmentCard` gains cancel button; `AppointmentsPage` gains selected-appointment state, edit modal trigger, and `ConfirmDialog` for cancel

## Approach

1. **AppointmentCard**: add a cancel icon button (top-right corner) visible only when status ∈ {0,1}. Click propagates `onCancel(appointment)` instead of `onClick`.
2. **AppointmentsPage**: introduce `selectedAppointment` state. Card click sets it → modal opens in EDIT mode. Card cancel click sets `cancelTarget` → `ConfirmDialog` opens.
3. **AppointmentModal**: accept optional `appointment` prop. When present → edit mode: pre-fill pet (readonly `<input>`), date, time, notes, status. Submit calls `updateAppointment()` via the new hook. When absent → create mode (unchanged).
4. **Confirmed guard**: when `status === 1`, disable date/time/status fields; only notes editable.
5. **Immutable guard**: when `status ∈ {2,3}`, render modal as view-only (no editable fields, no save button).
6. **`useAppointmentMutations` hook**: `useMutation`-style with `mutate(id, data)`, `isLoading`, `error`, `reset`. Follow same pattern as `useServices` hook.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/AppointmentsPage.tsx` | Modified | Add selected/cancelTarget state, ConfirmDialog, hook integration |
| `src/components/organisms/AppointmentModal.tsx` | Modified | Add edit mode with optional `appointment` prop, status selector |
| `src/components/organisms/AppointmentCard.tsx` | Modified | Add cancel icon button with `onCancel` prop |
| `src/hooks/useAppointmentMutations.ts` | New | Mutation hook for update + cancel |
| `src/locales/en/appointments.json` | Modified | Add edit/cancel/status keys |
| `src/locales/es/appointments.json` | Modified | Add edit/cancel/status keys |

## Product Decisions

1. Pet field is READONLY in edit mode — cannot reassign appointment to a different pet
2. Cancel button lives on the card (not inside modal) — triggers `ConfirmDialog` directly
3. Status selector included in edit mode: pending (0) → confirmed (1) → completed (2)
4. Confirmed appointments (status=1) are restricted: only notes field is editable; date, pet, and status are locked

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Card space too tight for cancel icon | Med | Use 16×16 icon; test on smallest slot (30-min cell). If too cramped, use long-press pattern as fallback. |
| Modal complexity grows with conditional edit/create/view modes | Med | Extract `AppointmentForm` as a molecule if conditional logic exceeds ~30 lines. |
| Optimistic UI vs API race on week navigation | Low | Refetch after mutation success; no optimistic updates for v1. |

## Rollback Plan

- `AppointmentModal` edit mode is gated by optional `appointment` prop — omitting it returns to create-only. Card cancel button is additive — removing `onCancel` prop hides it. No database-level rollback needed (PATCH/DELETE already exist and tested).

## Dependencies

- Backend PATCH `PATCH /api/v1/appointments/:id` (already deployed, tested)
- Backend DELETE `DELETE /api/v1/appointments/:id` (already deployed, tested)
- `ConfirmDialog` molecule (already exists in `src/components/molecules/ConfirmDialog.tsx`)

## Success Criteria

- [ ] Clicking an appointment card opens the modal pre-filled with that appointment's data
- [ ] Editing notes + status and saving updates the appointment; calendar refreshes
- [ ] Pending appointment: all fields editable (except pet)
- [ ] Confirmed appointment: only notes editable
- [ ] Completed/cancelled appointment: modal opens view-only
- [ ] Cancel icon on card triggers ConfirmDialog; confirming sets status=3
- [ ] All i18n keys present in EN and ES locales
- [ ] Existing create flow unaffected (regression pass)
- [ ] `useAppointmentMutations` hook has at least 80% test coverage
