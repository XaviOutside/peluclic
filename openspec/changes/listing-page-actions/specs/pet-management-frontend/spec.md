# Delta for Pet Management Frontend

## ADDED Requirements

### Requirement: Cross-Reference Buttons on Pet List

The pet list MUST render cross-ref buttons per row using the DataTable `crossRefActions` prop. The PetsPage SHALL read `?clientId=` query param to enable pre-filtered listing from cross-ref navigation.

| Button | Icon | Target | Condition |
|--------|------|--------|-----------|
| Ver Servicios | `receipt_long` | `/services?petId={pet.id}` | Always visible |
| Ver Cliente | `person` | `/clients/{pet.clientId}` | Always visible |

#### Scenario: "Ver Servicios" navigates with pet filter

- GIVEN pet id=7
- WHEN user clicks "Ver Servicios"
- THEN browser navigates to `/services?petId=7`

#### Scenario: "Ver Cliente" navigates to owner

- GIVEN pet with clientId=42
- WHEN user clicks "Ver Cliente"
- THEN browser navigates to `/clients/42`

### Requirement: Query Param Filter Support on PetsPage

The PetsPage MUST read `?clientId=` from the URL and merge it into the initial filter state, so navigation from ClientsPage "Ver Mascotas" pre-filters the pet listing. The filter SHALL be clearable.

#### Scenario: clientId query param pre-filters

- GIVEN user navigates to `/pets?clientId=42`
- WHEN PetsPage loads
- THEN only pets belonging to client 42 are listed
- AND the client filter is clearable by the user
