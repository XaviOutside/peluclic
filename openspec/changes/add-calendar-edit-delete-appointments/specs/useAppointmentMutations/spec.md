# useAppointmentMutations Specification

## Purpose

React hook providing `useUpdateAppointment` and `useCancelAppointment` mutations with loading, error, success, and reset state management. Wraps the existing `updateAppointment()` and `cancelAppointment()` service functions. Used by `AppointmentsPage` to drive edit and cancel flows on the calendar.

## Requirements

### Requirement: useUpdateAppointment Mutation

Exposes `{ mutate, isLoading, error, reset }`. `mutate(id, data)` SHALL PATCH the appointment via `updateAppointment()`. `isLoading` MUST be true during the call; `error` MUST surface API errors.

#### Scenario: Successful update

- GIVEN a valid appointment id and updated data
- WHEN `mutate(id, { notes: "new note" })` is called
- THEN `isLoading` transitions true → false
- AND `error` is null

#### Scenario: Validation error (422)

- GIVEN the API returns 422 with field-level errors
- WHEN `mutate(id, data)` is called
- THEN `error` contains the field validation messages
- AND `isLoading` is false

#### Scenario: Server error (500)

- GIVEN the API returns 500
- WHEN `mutate(id, data)` is called
- THEN `error` contains a generic error message
- AND `isLoading` is false

### Requirement: useCancelAppointment Mutation

Exposes `{ mutate, isLoading, error, reset }`. `mutate(id)` SHALL set status=3 via `cancelAppointment()`.

#### Scenario: Successful cancel

- GIVEN a valid appointment id
- WHEN `mutate(id)` is called
- THEN `isLoading` transitions true → false
- AND `error` is null

#### Scenario: Not found (404)

- GIVEN an appointment id that does not exist
- WHEN `mutate(id)` is called
- THEN `error` contains "Appointment not found"
- AND `isLoading` is false

### Requirement: Error State Reset

Both mutations MUST expose a `reset()` function that clears `error` without triggering a new mutation.

#### Scenario: Reset clears error

- GIVEN `useUpdateAppointment` has an active error
- WHEN `reset()` is called
- THEN `error` becomes null
- AND `isLoading` remains false

### Requirement: Loading State Guard

While `isLoading` is true, the consuming component MUST disable submit buttons and cancel actions to prevent duplicate mutations.

#### Scenario: Actions disabled during mutation

- GIVEN `isLoading` is true
- WHEN the user attempts to click "Save" or a cancel icon
- THEN the action is prevented
