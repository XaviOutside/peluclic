# Delta for appointment-calendar-frontend

## RENAMED Requirements

### Requirement: New Appointment Modal → Appointment Modal

(Migration: update any references from "New Appointment Modal" to "Appointment Modal" in docs and test descriptions)

## MODIFIED Requirements

### Requirement: AppointmentCard

Each appointment MUST render as an `AppointmentCard` inside its slot cell, showing pet name, client name, and a status badge. Clicking the card SHALL open the edit modal. Pending (0) and confirmed (1) cards SHALL display a cancel icon button in the top-right corner; clicking the cancel icon SHALL invoke `onCancel(appointment)` without triggering the card's `onClick`. Completed (2) and cancelled (3) cards SHALL NOT display the cancel icon.

(Previously: card only triggered the edit modal on click; no cancel icon existed)

#### Scenario: Card rendered in correct slot

- GIVEN an appointment for pet "Max" at Mon 10:00
- WHEN the calendar renders that week
- THEN a card labeled "Max" appears in the Monday 10:00 cell

#### Scenario: Cancel icon on pending appointment

- GIVEN a pending appointment (status=0) is rendered
- WHEN the card displays
- THEN a cancel icon button is visible in the top-right corner

#### Scenario: No cancel icon on completed appointment

- GIVEN a completed appointment (status=2) is rendered
- WHEN the card displays
- THEN no cancel icon button is visible

#### Scenario: Cancel icon click triggers onCancel only

- GIVEN a pending appointment card with a cancel icon
- WHEN the cancel icon is clicked
- THEN `onCancel(appointment)` is invoked with the appointment object
- AND the card's `onClick` is NOT triggered

### Requirement: Appointment Modal

The Sidebar "New Appointment" button MUST open the modal in create mode. Clicking an existing appointment card SHALL open the modal in edit mode, pre-filled with the appointment's data, with the pet field locked as readonly. In edit mode, the modal MUST include a status selector dropdown (Pending → Confirmed → Completed). On submit, create mode SHALL POST to `/api/v1/appointments`; edit mode SHALL PATCH to `/api/v1/appointments/:id`. On 409, display "Pet already booked at this time."

(Previously: modal was create-only — no edit mode, no status selector, no PATCH submit)

#### Scenario: Client FTS filters pet list

- GIVEN client "Maria" owns pets "Luna" and "Rocky"
- WHEN "Maria" is selected from search results
- THEN the pet dropdown shows only Luna and Rocky

#### Scenario: Successful modal submission (create)

- GIVEN valid client, pet, datetime, and notes entered
- WHEN "Save" is clicked
- THEN appointment is created, modal closes, calendar refreshes

#### Scenario: Successful modal submission (edit)

- GIVEN the modal is open in edit mode with valid updated notes
- WHEN "Save" is clicked
- THEN appointment is updated, modal closes, calendar refreshes

#### Scenario: Double-booking error in modal

- GIVEN the API returns 409
- WHEN the modal submission completes
- THEN an inline error "Pet already booked at this time" is shown

#### Scenario: Edit mode pre-fills fields

- GIVEN an appointment for pet "Max" at Mon 10:00 with notes "Use gentle shampoo"
- WHEN the card is clicked to open the edit modal
- THEN pet field shows "Max" and is readonly
- AND date shows the appointment date
- AND time shows 10:00
- AND notes shows "Use gentle shampoo"

#### Scenario: Status selector in edit mode

- GIVEN the modal is open in edit mode for a pending appointment
- WHEN the user interacts with the status dropdown
- THEN options displayed are: Pending, Confirmed, Completed
- AND the current status is pre-selected

## ADDED Requirements

### Requirement: Edit Mode Status Guard

When the modal opens in edit mode, the system MUST enforce status-based field restrictions. Confirmed appointments (status=1) SHALL lock all fields except notes. Completed (status=2) and cancelled (status=3) appointments SHALL render the modal as view-only with no editable fields and no save button.

#### Scenario: Confirmed appointment — notes only editable

- GIVEN a confirmed appointment (status=1) is opened in edit mode
- WHEN the modal renders
- THEN date, time, pet, and status fields are disabled
- AND the notes field is editable
- AND the save button is visible

#### Scenario: Completed appointment — view-only

- GIVEN a completed appointment (status=2) is opened
- WHEN the modal renders
- THEN all fields are display-only
- AND no save button is shown

#### Scenario: Cancelled appointment — view-only

- GIVEN a cancelled appointment (status=3) is opened
- WHEN the modal renders
- THEN all fields are display-only
- AND no save button is shown

### Requirement: Cancel Appointment from Calendar

The `AppointmentsPage` MUST render a `ConfirmDialog` when `onCancel` is triggered from an `AppointmentCard`. Confirming the dialog SHALL call `cancelAppointment(id)` and refresh the calendar on success.

#### Scenario: ConfirmDialog opens on cancel click

- GIVEN the user clicks the cancel icon on a pending appointment card
- WHEN `onCancel` fires
- THEN a `ConfirmDialog` appears with a cancel confirmation message

#### Scenario: Confirm cancel action

- GIVEN the `ConfirmDialog` is open for a cancel action
- WHEN the user clicks "Confirm"
- THEN `cancelAppointment(id)` is called
- AND the dialog closes
- AND the calendar refreshes, removing the cancelled appointment

#### Scenario: Dismiss cancel dialog

- GIVEN the `ConfirmDialog` is open for a cancel action
- WHEN the user clicks "Cancel" or closes the dialog
- THEN no mutation is triggered
- AND the appointment remains on the calendar

### Requirement: Calendar Refresh After Mutation

After a successful update or cancel mutation, the calendar MUST refetch appointments for the current visible week to reflect changes.

#### Scenario: Refresh after edit

- GIVEN an appointment is successfully edited via the modal
- WHEN the modal closes after save
- THEN the calendar refetches appointments for the visible week

#### Scenario: Refresh after cancel

- GIVEN an appointment is successfully cancelled
- WHEN the `ConfirmDialog` closes after confirmation
- THEN the calendar refetches appointments for the visible week

### Requirement: i18n Keys for Edit and Cancel

The EN and ES locale files MUST include new keys for: edit modal title, cancel confirmation prompt, status labels ("Pending", "Confirmed", "Completed", "Cancelled"), and error messages ("Pet already booked at this time", "Update failed", "Cancel failed").

#### Scenario: Edit modal title — EN

- GIVEN locale is EN
- WHEN the edit modal opens
- THEN the title reads "Edit Appointment"

#### Scenario: Edit modal title — ES

- GIVEN locale is ES
- WHEN the edit modal opens
- THEN the title reads "Editar Cita"

#### Scenario: Cancel confirmation — EN

- GIVEN locale is EN
- WHEN the cancel `ConfirmDialog` opens
- THEN the prompt reads "Cancel this appointment?"

#### Scenario: Cancel confirmation — ES

- GIVEN locale is ES
- WHEN the cancel `ConfirmDialog` opens
- THEN the prompt reads "¿Cancelar esta cita?"

#### Scenario: Status labels — EN

- GIVEN locale is EN
- WHEN the status selector renders
- THEN options are labeled "Pending", "Confirmed", "Completed"

#### Scenario: Status labels — ES

- GIVEN locale is ES
- WHEN the status selector renders
- THEN options are labeled "Pendiente", "Confirmada", "Completada"
