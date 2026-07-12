# Delta for Client Management Frontend

## ADDED Requirements

### Requirement: Row Delete Action on Client List

The client list MUST show a delete icon button per row (icon: `delete`, color: `text-status-error`). Clicking delete SHALL open a confirmation dialog. Confirming MUST call `useDeactivateClient` and update the UI.

#### Scenario: Confirm delete on client row

- GIVEN an active client in the listing
- WHEN user clicks the delete icon and confirms
- THEN the client is deactivated and the row updates to reflect the new status

#### Scenario: Cancel delete

- GIVEN user clicks delete on a client row
- WHEN user cancels in the confirmation dialog
- THEN no API call is made and the row is unchanged

### Requirement: Cross-Reference Buttons on Client List

The client list MUST render "Ver Mascotas" and "Ver Servicios" cross-ref buttons per row using the DataTable `crossRefActions` prop.

| Button | Icon | Target |
|--------|------|--------|
| Ver Mascotas | `pets` | `/pets?clientId={client.id}` |
| Ver Servicios | `receipt_long` | `/services` |

#### Scenario: "Ver Mascotas" navigates with client filter

- GIVEN a client with id=42
- WHEN user clicks "Ver Mascotas"
- THEN browser navigates to `/pets?clientId=42`

#### Scenario: "Ver Servicios" navigates to services listing

- GIVEN any client row
- WHEN user clicks "Ver Servicios"
- THEN browser navigates to `/services`
