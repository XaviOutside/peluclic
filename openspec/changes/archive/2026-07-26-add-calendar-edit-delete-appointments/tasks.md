# Tasks: Add Appointment Edit and Cancel to Calendar

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~620 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: hook + i18n → PR 2: Card + Modal → PR 3: Page + E2E |
| Delivery strategy | ask-always |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | useAppointmentMutations hook + i18n keys | PR 1 | `npx vitest run src/hooks/useAppointmentMutations.test.ts` | `npx vitest run --config vitest.frontend.config.ts` | Revert `src/hooks/useAppointmentMutations.ts`; i18n keys are additive, harmless if reverted alone |
| 2 | AppointmentCard cancel icon + AppointmentModal edit/view modes | PR 2 | `npx vitest run src/components/organisms/AppointmentCard.test.tsx src/components/organisms/AppointmentModal.test.tsx` | `npm run dev` → calendar page, click card, verify edit modal; verify cancel icon on pending card | Revert Card + Modal changes; page still compiles (new props optional) |
| 3 | AppointmentsPage wiring + ConfirmDialog + E2E tests | PR 3 | `npx playwright test e2e/appointments.spec.ts` | Full flow: create → edit → cancel → verify refresh | Revert Page + E2E changes; hook and components still present but unused |

---

## Phase 1: Foundation — Hook + i18n

- [x] 1.1 **RED** — Write `src/hooks/useAppointmentMutations.test.ts`: test `useUpdateAppointment` success, 422, 500; `useCancelAppointment` success, 404; `reset()` clears error; loading state guards submit. (Spec: useAppointmentMutations §1-4)
- [x] 1.2 **GREEN** — Create `src/hooks/useAppointmentMutations.ts`: `useUpdateAppointment()` + `useCancelAppointment()` following `useClientMutations` generic `useMutation` pattern. Each exposes `{ mutate, isLoading, error, reset }`. (Spec: useAppointmentMutations §1-4; Design: §4)
- [x] 1.3 **REFACTOR** — Verify hook matches `useClientMutations` conventions exactly; ensure `reset()` clears error without triggering mutation. Run tests green.

### Acceptance Criteria
- All hook tests pass (`npx vitest run src/hooks/useAppointmentMutations.test.ts`)
- Hook exports match the design contract: `useUpdateAppointment()` → `{ mutate: (id, data) => Promise, isLoading, error, reset }`, `useCancelAppointment()` → `{ mutate: (id) => Promise, isLoading, error, reset }`
- Re-throws `HttpError` so callers can inspect status codes
- Dependencies: none (services already exist)

- [x] 1.4 Add i18n keys to `src/locales/en/appointments.json`: `form.saveUpdate`, `form.statusLabel`, `form.close`, `cancel.*` (title, message, confirm), `errors.updateFailed`, `errors.cancelFailed`. (Spec: appointment-calendar-frontend §i18n; Design: §8)
- [x] 1.5 Add i18n keys to `src/locales/es/appointments.json`: matching Spanish translations. (Spec: appointment-calendar-frontend §i18n)

### Acceptance Criteria
- JSON is valid (parse succeeds)
- EN keys: title="Update", statusLabel="Status", close="Close", cancel.title="Cancel Appointment", cancel.message with interpolation, cancel.confirm="Yes, cancel it", errors.updateFailed/cancelFailed
- ES keys: "Actualizar", "Estado", "Cerrar", "Cancelar Cita", "¿Cancelar cita de {{petName}} el {{date}} a las {{time}}?", "Sí, cancelarla", error messages in Spanish

---

## Phase 2: Components — Card + Modal

- [x] 2.1 **RED** — Write `AppointmentCard.test.tsx` additions: test cancel icon visible for status 0 and 1; hidden for status 2 and 3; clicking icon calls `onCancel` only (not `onClick`); icon not rendered when `onCancel` prop absent (backward compat). (Spec: appointment-calendar-frontend §AppointmentCard)
- [x] 2.2 **GREEN** — Modify `src/components/organisms/AppointmentCard.tsx`: add optional `onCancel` prop to `AppointmentCardProps`; render cancel icon (top-right, 16×16 material icon `close`) when `onCancel` present AND `appointment.status ∈ {0,1}`; `stopPropagation` on icon click so card `onClick` does not fire. (Design: §3, §4)
- [x] 2.3 **REFACTOR** — Check icon sizing on tight slots; ensure `data-testid="appointment-cancel-icon"` for E2E selects. Run tests green.

### Acceptance Criteria
- All Card tests pass
- Cancel icon renders only for pending and confirmed
- Icon click does NOT open modal (stopPropagation)
- Card without `onCancel` renders identically to before (regression)

- [x] 2.4 **RED** — Write `AppointmentModal.test.tsx` additions: test edit mode pre-fills fields (pet readonly, date, time, notes); confirmed (status=1) locks all fields except notes; completed/cancelled (status=2,3) render view-only (no save button, all fields disabled); status selector renders Pending/Confirmed/Completed options with current pre-selected; PATCH submission on save in edit mode; create mode unchanged. (Spec: appointment-calendar-frontend §AppointmentModal, §Edit Mode Status Guard)
- [x] 2.5 **GREEN** — Modify `src/components/organisms/AppointmentModal.tsx`: add `appointment?: Appointment` and `onUpdated?: () => void` props; derive mode from `appointment?.status`; pre-fill form from `appointment` on open; add status `<select>` in edit mode with transition-valid options (pending→confirmed/completed, confirmed→completed only); enforce field locking per tri-mode table; submit calls `createAppointment()` or `updateAppointment()` based on mode; view-only mode renders readonly fields with only "Close" button. (Design: §2, §3, §6)
- [x] 2.6 **REFACTOR** — Extract `AppointmentForm` molecule if conditional logic exceeds ~30 lines (per risk mitigation). Check a11y: readonly inputs need `aria-readonly`, disabled fields need `aria-disabled`. Run tests green.

### Acceptance Criteria
- All Modal tests pass
- Create mode: all fields editable, "Save Appointment" submit
- Edit pending: pet readonly, status selector visible (0→1→2), all other fields editable, "Update" submit
- Edit confirmed: only notes editable, rest locked, "Update" submit
- View-only (completed/cancelled): no editable fields, no save button, only "Close"
- Existing `form.editTitle` key used for modal title in edit mode (already exists in i18n)

---

## Phase 3: Page Wiring + Integration

- [x] 3.1 **RED** — Write `AppointmentsPage.test.tsx` additions: test card click sets `selectedAppointment` and opens modal in edit mode; cancel icon click sets `cancelTarget` and opens ConfirmDialog; confirming cancel calls `cancelAppointment`; dismissing dialog does nothing; successful edit/cancel refetches appointments. (Spec: appointment-calendar-frontend §Cancel Appointment from Calendar, §Calendar Refresh)
- [x] 3.2 **GREEN** — Modify `src/pages/AppointmentsPage.tsx`: add `selectedAppointment` state (`Appointment | null`); add `cancelTarget` state (`Appointment | null`); import `useAppointmentMutations`; pass `appointment={selectedAppointment}` + `onUpdated={handleUpdated}` to `AppointmentModal`; pass `onCancel={handleCardCancel}` to `CalendarWeek` → `AppointmentCard`; render `ConfirmDialog` when `cancelTarget !== null` with i18n keys; wire confirm → `cancelMutation.mutate(id)` → refetch + clear `cancelTarget`; update `handleAppointmentClick` to set `selectedAppointment` instead of just opening modal. (Design: §2, §7)
- [x] 3.3 Wire `onCancel` prop through `CalendarWeek` to `AppointmentCard`. Ensure `CalendarWeek` passes `onCancel` and `onClick` to each `AppointmentCard`.
- [x] 3.4 **REFACTOR** — Ensure loading states from mutations disable action buttons during mutation. Add `data-testid` attributes: `appointment-edit-modal`, `cancel-confirm-dialog`, `cancel-confirm-btn`. Run all page tests green.

### Acceptance Criteria
- All Page tests pass
- Clicking card → modal opens in edit mode with pre-filled data
- Clicking cancel icon → ConfirmDialog opens with pet name, date, time
- Confirming cancel → appointment removed from calendar
- Dismissing cancel → appointment remains unchanged
- Editing + saving → calendar refreshes
- New "New Appointment" button still opens create-mode modal (regression)
- Existing sidebar "New Appointment" flow unchanged (regression)

---

## Phase 4: E2E + Verification

- [x] 4.1 **RED** — Write E2E flow in `e2e/appointments.spec.ts`: (a) create appointment → click card → edit notes → save → verify notes updated on calendar; (b) create appointment → click cancel icon → ConfirmDialog → confirm → verify appointment removed from calendar; (c) create appointment → complete it via status selector → verify card shows as completed, no cancel icon. Use `data-testid` selectors. (Spec: appointment-calendar-frontend §all scenarios)
- [x] 4.2 Run full E2E suite: `npx playwright test e2e/appointments.spec.ts`. All tests pass.

### Acceptance Criteria
- Edit flow E2E passes: card click → pre-filled modal → edit notes → save → refreshed calendar shows updated notes
- Cancel flow E2E passes: cancel icon → dialog confirm → appointment removed from calendar
- Status transition E2E passes: pending → completed via modal → card status badge updates
- All existing E2E tests still pass (regression)

- [x] 4.3 Run full test suite: `npm test && npm run test:frontend && npx playwright test` (executed during sdd-verify; 557 frontend + 521 backend passing; E2E 6/6 require Docker)

---

## Phase 5: Manual Verification Checklist

- [ ] 5.1 Create an appointment → click card → verify modal opens with pre-filled data and pet field is readonly
- [ ] 5.2 Edit notes of a pending appointment → save → verify calendar refreshes with updated notes
- [ ] 5.3 Change status of a pending appointment to "Confirmed" via modal → save → reopen → verify only notes is editable
- [ ] 5.4 Open a confirmed appointment → verify date/time/status/pet are locked; edit notes → save → verify refresh
- [ ] 5.5 Open a completed/cancelled appointment → verify all fields are view-only with no save button
- [ ] 5.6 Click cancel icon on a pending card → verify ConfirmDialog → confirm → verify appointment removed
- [ ] 5.7 Click cancel icon on a pending card → verify ConfirmDialog → dismiss → verify appointment still present
- [ ] 5.8 Verify cancel icon absent on completed and cancelled cards
- [ ] 5.9 Switch locale to ES → verify all edit/cancel/status labels in Spanish
- [ ] 5.10 Verify create-only flow unaffected: click "New Appointment" → modal in create mode → save → appears on calendar
- [ ] 5.11 Verify sidebar "New Appointment" trigger still works (regression)
- [ ] 5.12 Test on smallest slot size (30-min cell) → verify cancel icon does not overflow card

---

## Risk Notes
- **Card space**: If 16×16 cancel icon is too tight on 30-min slots, fallback to a long-press pattern (design alt).
- **Modal complexity**: If conditional logic exceeds ~30 lines, extract `AppointmentForm` molecule per design risk mitigation.
- **Optimistic UI**: No optimistic updates in v1 — always refetch after mutation to avoid race conditions with week navigation.
- **Confirmed guard**: Frontend dropdown enforces status transitions; backend validates. Frontend is defense-in-depth, not sole authority.
