# Delta for Services API Frontend

## ADDED Requirements

### Requirement: Cross-Reference Button on Service List

The service list MUST render a "Ver mascota" cross-ref button per row using the DataTable `crossRefActions` prop. The button SHALL navigate to `/pets/{service.petId}`. When `petId` is null, the button SHALL be disabled. The ServicesPage SHALL read `?petId=` query param for pre-filtered listing.

| Button | Icon | Target | Condition |
|--------|------|--------|-----------|
| Ver mascota | `pets` | `/pets/{petId}` | Disabled when petId is null |

#### Scenario: Service associated with a pet

- GIVEN service with petId=7
- WHEN user clicks "Ver mascota"
- THEN browser navigates to `/pets/7`

#### Scenario: Service not associated with a pet

- GIVEN service with petId=null
- WHEN service row renders
- THEN "Ver mascota" button is disabled (non-clickable, visually dimmed)

### Requirement: Query Param Filter Support on ServicesPage

The ServicesPage MUST read `?petId=` from the URL and merge it into the initial filter. Navigation from PetsPage "Ver Servicios" SHALL pre-filter the service listing by pet.

#### Scenario: petId query param pre-filters

- GIVEN user navigates to `/services?petId=7`
- WHEN ServicesPage loads
- THEN only services for pet 7 are listed
- AND the pet filter is clearable
