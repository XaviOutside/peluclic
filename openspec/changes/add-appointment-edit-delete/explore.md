## Exploration: Add Edit & Delete to Calendar Appointments Page

**Date:** 2026-07-25  
**Scope:** Frontend UI for editing and canceling appointments from the calendar page  
**Artifact store:** hybrid (openspec + engram)

---

### 1. Current Calendar Page Implementation

| File | Role |
|---|---|
| `src/pages/AppointmentsPage.tsx` | Main page component. Fetches weekly appointments via `listAppointments(start, end)`, renders `CalendarWeek` + `AppointmentModal`. |
| `src/components/organisms/CalendarWeek.tsx` | CSS Grid weekly calendar (7 columns × time slots). Maps appointments to grid cells, renders `AppointmentCard` per slot. |
| `src/components/organisms/AppointmentCard.tsx` | Card inside a grid cell showing pet name, client name, time, status badge. `onClick` callback currently opens the create modal. |
| `src/components/organisms/AppointmentModal.tsx` | **Create-only** modal: ClientSearch → pet dropdown → DateTimePicker → notes → submit. No edit mode exists. |

**Key observation:** The comment on line 93 of `AppointmentsPage.tsx` explicitly says:

> `// For v1, clicking opens the modal (view-only would be phase 2)`

The `handleAppointmentClick` callback does nothing useful — it just calls `setIsModalOpen(true)` without passing any appointment data. The modal is always in "create" mode.

**Data flow:**
1. `AppointmentsPage` computes `weekStart` from URL param `?week=` or today
2. Calls `listAppointments(weekStart, weekEnd)` → `GET /api/v1/appointments?start=&end=`
3. Response includes `AppointmentDetails[]` with `petName` and `clientName` joined
4. Data passed to `CalendarWeek` which filters into grid cells
5. Each slot renders `AppointmentCard(appointment, onClick)`

---

### 2. Existing Appointment Edit/Delete Functionality

#### Backend — FULLY IMPLEMENTED ✅

| Layer | Artifact | Status |
|---|---|---|
| Router | `PATCH /api/v1/appointments/:id` | ✅ `appointmentRouter.ts:36` |
| Router | `DELETE /api/v1/appointments/:id` | ✅ `appointmentRouter.ts:41` (soft delete = cancel) |
| Controller | `AppointmentController.update()` | ✅ `AppointmentController.ts:123` |
| Controller | `AppointmentController.cancel()` | ✅ `AppointmentController.ts:155` |
| Use Case | `UpdateAppointmentUseCase.execute()` | ✅ `UpdateAppointment.ts:26` |
| Use Case | `CancelAppointmentUseCase.execute()` | ✅ `CancelAppointment.ts:16` |
| Repository | `IAppointmentRepository.update()` | ✅ updates status/notes/scheduledAt |
| Repository | `IAppointmentRepository.softDelete()` | ✅ sets status=3 + deletedAt=NOW() |
| Repository | `IAppointmentRepository.hardDelete()` | ✅ exists but **NO HTTP route exposes it** |
| Tests | Unit tests for both use cases | ✅ `UpdateAppointment.test.ts`, `CancelAppointment.test.ts` |

#### Frontend — HALF IMPLEMENTED ⚠️

| Layer | Artifact | Status |
|---|---|---|
| Types | `UpdateAppointmentDto` | ✅ `src/types/appointment.ts:39` |
| Service | `updateAppointment(id, data)` | ✅ `src/services/appointments.ts:29` |
| Service | `cancelAppointment(id)` | ✅ `src/services/appointments.ts:38` |
| Storage | `ApiStorage.updateAppointment` → `PATCH` | ✅ `ApiStorage.ts:154` |
| Storage | `ApiStorage.cancelAppointment` → `DELETE` | ✅ `ApiStorage.ts:158` |
| Storage | `LocalStorage.updateAppointment` | ✅ `LocalStorage.ts:541` |
| Storage | `LocalStorage.cancelAppointment` | ✅ `LocalStorage.ts:562` |
| UI | Appointment edit modal/form | ❌ **MISSING** |
| UI | Cancel/delete confirmation | ❌ **MISSING** |
| UI | Edit/delete actions on card | ❌ **MISSING** |
| Hooks | `useAppointment` / `useAppointmentMutations` | ❌ **MISSING** (no appointment hooks exist) |

**Conclusion:** The API + storage layer is complete. Only the UI components and hooks are missing.

---

### 3. Appointment Domain Model

```
Appointment {
  id: number;
  petId: number;
  clientId: number;         // denormalized from pet, never updated
  scheduledAt: Date;
  status: AppointmentStatus; // 0=pending, 1=confirmed, 2=completed, 3=cancelled
  notes: string | null;     // max 500 chars
  deletedAt: Date | null;   // non-null = soft-deleted
  createdAt: Date;
  updatedAt: Date;
}
```

**Business rules affecting edit/delete:**
- **Completed appointments (status=2) are IMMUTABLE** — 422 error on any modification attempt
- **Cancelled/deleted appointments (deletedAt != null) are IMMUTABLE** — 404 error
- **Double-booking check**: rescheduling triggers `existsByPetAndTime()`, returns 409 on conflict
- **No foreign keys**: referential integrity enforced at application layer
- **Cancel = soft delete**: sets `status=3` + `deletedAt=NOW()`, record persists for history

**Implication for UI:** The edit and delete buttons should be hidden or disabled for completed (status=2) and cancelled (status=3) appointments.

---

### 4. Frontend Types and Services

**Types** (`src/types/appointment.ts`):
```typescript
interface Appointment { id, petId, petName, clientId, clientName, scheduledAt, status, notes, createdAt, updatedAt }
interface CreateAppointmentDto { petId, scheduledAt, notes? }
interface UpdateAppointmentDto { scheduledAt?, notes?, status? }  // all optional
```

**Services** (`src/services/appointments.ts`):
```typescript
listAppointments(start, end)  → GET /appointments?start=&end=
getAppointment(id)            → GET /appointments/:id
createAppointment(data)       → POST /appointments
updateAppointment(id, data)   → PATCH /appointments/:id
cancelAppointment(id)         → DELETE /appointments/:id
```

All delegate to the active storage implementation (`ApiStorage` or `LocalStorage`).

**Hooks:** There are **ZERO** appointment hooks in `src/hooks/`. Compare to clients which have:
- `useClient.ts`, `useClients.ts` — data fetching
- `useClientMutations.ts` — deactivate, reactivate, hardDelete, export

---

### 5. Existing Appointment UI Components

| Component | Path | Current Role |
|---|---|---|
| `AppointmentCard` | `src/components/organisms/AppointmentCard.tsx` | Display-only card with `onClick` callback. No edit/delete actions. |
| `AppointmentModal` | `src/components/organisms/AppointmentModal.tsx` | **Create-only** modal. No `appointment` prop for edit mode. No `mode` prop. |
| `CalendarWeek` | `src/components/organisms/CalendarWeek.tsx` | Grid layout. Passes `onAppointmentClick` through to each card. |

**What needs to change:**
- `AppointmentCard`: add edit/delete action buttons (or a context menu / click handler that opens an actions overlay)
- `AppointmentModal`: add an `edit` mode with `initialAppointment?: Appointment` prop, pre-fill form, change submit to use `updateAppointment`
- `CalendarWeek`: potentially pass additional callbacks (`onEdit`, `onDelete`)
- `AppointmentsPage`: manage the new state for edit vs create mode, handle delete confirmation

---

### 6. API Endpoints

All required endpoints already exist:

| Method | Path | Controller Method | Use Case | Status |
|---|---|---|---|---|
| `GET` | `/api/v1/appointments?start=&end=` | `listWeek()` | `ListAppointmentsUseCase` | ✅ |
| `GET` | `/api/v1/appointments/:id` | `getById()` | `GetAppointmentUseCase` | ✅ |
| `POST` | `/api/v1/appointments` | `create()` | `CreateAppointmentUseCase` | ✅ |
| `PATCH` | `/api/v1/appointments/:id` | `update()` | `UpdateAppointmentUseCase` | ✅ |
| `DELETE` | `/api/v1/appointments/:id` | `cancel()` | `CancelAppointmentUseCase` | ✅ |

**No backend work needed.** The backend is fully wired in `api/index.ts:202-209`.

---

### 7. Design System Patterns

**How other entities handle edit/delete (pattern to follow):**

| Pattern | Example | Mechanism |
|---|---|---|
| Edit via dedicated page | `ServiceEditPage.tsx` | Route `/services/:id/edit`, uses `ServiceForm` with initial data, `updateService()` on submit |
| Detail page with action buttons | `ClientDetailPage.tsx` | `ClientDetailCard` receives `onEdit`, `onDeactivate`, `onHardDelete` callbacks |
| Destructive confirmation | `ClientDetailPage.tsx` + `ConfirmDialog.tsx` | Opens `ConfirmDialog` with `destructive=true`, confirms before mutation |
| Mutation hooks | `useClientMutations.ts` | Dedicated hooks wrapping service calls with loading/error state |

**Recommended pattern for appointments:**
Since the calendar page is inherently browse-oriented (not a detail page), the best UX patterns are:

1. **Click card → edit modal** (reuse `AppointmentModal` in edit mode). This mirrors the current create flow and keeps context on the calendar.
2. **Inline delete button on card or in modal** — destructive, requires `ConfirmDialog`.
3. **No dedicated edit page** — the calendar page IS the browse surface; modals keep the user's place.

**i18n keys already exist** in `src/locales/en/appointments.json`:
- `form.editTitle`: "Edit Appointment" — ready to use
- Missing: delete/cancel confirmation messages, toast/notification strings

**DESIGN.md** references:
- Appointment cards: colored left-border strip (already implemented in `AppointmentCard`)
- Cards on white surface with soft diffused shadow
- Calendar: white background, subtle grey lines, teal appointment blocks

---

### Approaches

#### Approach A: Modal-first (recommended)

Click appointment card → open `AppointmentModal` in "edit" mode with pre-filled data. Edit form allows changing date/time, pet, notes, and status. Save button calls `updateAppointment()`. Delete/cancel button inside the modal triggers `ConfirmDialog` → `cancelAppointment()`.

**Pros:**
- Minimal new components — extends existing `AppointmentModal`
- Consistent UX with create flow (same modal, different mode)
- Keeps user on calendar page (no navigation)
- Reuses `DateTimePicker`, `ClientSearch`, pet dropdown

**Cons:**
- `AppointmentModal` gets more complex (needs `mode` prop, `initialAppointment`, different submit logic)
- Two-step delete (modal → confirm dialog)

**Effort:** Medium

#### Approach B: Inline card actions + dedicated edit modal

Add edit/delete icon buttons directly on each `AppointmentCard`. Edit opens a separate `EditAppointmentModal`. Delete uses inline confirmation (or `ConfirmDialog`).

**Pros:**
- Faster access to delete (fewer clicks)
- Cleaner separation — create and edit are different components
- Cards are self-contained

**Cons:**
- Small cards (30-min slot height) have limited space for buttons
- Two different modals to maintain (create vs edit)
- More components to build from scratch

**Effort:** Medium-High

#### Approach C: Click card → detail sidebar/panel

Click opens a side panel or inline detail view with edit and delete actions. This is the most "desktop app" pattern but requires significant layout refactoring.

**Pros:**
- Native desktop feel
- Non-disruptive to calendar view

**Cons:**
- Massive layout change to `CalendarWeek`
- Not mobile-friendly
- Highest effort, least payoff for v1

**Effort:** High

---

### Recommendation

**Approach A — Modal-first, extend `AppointmentModal` for edit mode.**

This is the most practical for v1 because:
1. The backend is complete — zero API changes needed
2. `AppointmentModal` already has all form fields (`ClientSearch`, pet select, `DateTimePicker`, notes)
3. The i18n key `form.editTitle` already exists
4. It follows the existing UX pattern (create via modal → edit via same modal)
5. The `ConfirmDialog` molecule already exists and is used by `ClientDetailPage` for destructive actions
6. `AppointmentCard` already has `onClick` wired — just change the behavior

---

### What's Missing (Implementation Checklist)

| Area | Item | Effort |
|---|---|---|
| Hooks | Create `useAppointmentMutations.ts` with `useUpdateAppointment`, `useCancelAppointment` | Low |
| Component | Add `mode` prop to `AppointmentModal` (`create | edit`) | Medium |
| Component | Add `initialAppointment` prop to `AppointmentModal` for pre-filling edit form | Low |
| Component | Wire edit mode submit to call `updateAppointment` instead of `createAppointment` | Low |
| Component | Add "Cancel Appointment" button inside modal (in edit mode) | Low |
| Component | Wire `ConfirmDialog` for cancel confirmation inside modal | Low |
| Component | Add a context popup or dropdown on `AppointmentCard` click (to choose edit vs cancel) | Medium |
| Page | Update `AppointmentsPage.handleAppointmentClick` to open modal in edit mode with selected appointment | Low |
| Page | Update `AppointmentsPage.handleModalCreated` to handle both create and edit refreshes | Low |
| i18n | Add cancel/delete confirmation strings to `appointments.json` | Low |
| i18n | Add "Delete Appointment" and related strings to both `en` and `es` locale files | Low |
| Styling | Conditionally hide edit/delete for completed (status=2) and cancelled (status=3) appointments | Low |
| Tests | Unit tests for `useAppointmentMutations` hook | Medium |
| Tests | Update `AppointmentModal` tests for edit mode | Medium |
| Tests | Update `AppointmentsPage` tests for edit flow | Medium |

**Total estimated effort:** Medium (backend: done; frontend: ~6-8 components/files to create/modify)

---

### Risks

1. **Modal complexity** — Adding edit mode to `AppointmentModal` will make it the most complex modal in the app. Keep it under ~200 lines, extract a `useAppointmentForm` hook if needed.
2. **Double-booking on edit** — Rescheduling via edit must trigger the same 409 conflict handling as create. The backend handles this; frontend just needs to display the error.
3. **LocalStorage consistency** — `LocalStorage.updateAppointment` doesn't refresh `petName`/`clientName` if the pet changes. In edit mode, if the pet dropdown is readonly (recommended for v1), this is a non-issue.
4. **No appointment hooks exist yet** — This is a new paradigm. Follow the exact same pattern as `useClientMutations.ts` (wrapping service calls with `useState` for loading/error).

### Ready for Proposal

**Yes.** The backend is fully implemented and tested. The frontend service layer is complete. Only UI work remains — extending the existing modal, adding a confirmation dialog, and wiring the click handlers. The pattern is well-established by `ClientDetailPage` (ConfirmDialog + mutations). Scope is well-bounded.
