# Delta for Storage Abstraction

## ADDED Requirements

### Requirement: IStorage Interface Contract
The system MUST define `IStorage` in `src/storage/IStorage.ts` with method signatures matching all existing `src/services/*.ts` exports: `list`, `get`, `create`, `update`, `delete` (soft delete), `reactivate`/`deactivate` (clients), `cancel` (appointments), `search`, and `uploadLogo` (settings). Every parameter name, type, and return type SHALL match exactly.

#### Scenario: IStorage methods match existing service signatures
- GIVEN the existing service files in `src/services/`
- WHEN `IStorage` is compared to each exported function
- THEN all parameter types, return types, and optional parameters match exactly, covering clients, pets, services, appointments, and settings domains

### Requirement: ApiStorage Delegation
`ApiStorage` MUST delegate every IStorage method to the corresponding `http()` call. Behavior SHALL be identical to the current service functions — no observable difference for any consumer.

#### Scenario: ApiStorage delegates to http()
- GIVEN ApiStorage is the active implementation
- WHEN `clients.list({ page: 1, limit: 20 })` is called
- THEN a GET request is sent to `/api/v1/clients?page=1&limit=20` AND the response shape matches `listClients()` from `src/services/client.ts`

### Requirement: LocalStorage Full CRUD
`LocalStorage` MUST implement all IStorage methods using browser localStorage. It SHALL auto-increment IDs via a `pf_demo:nextIds` key, search by substring `includes()`, paginate by `Array.slice()`, and soft-delete by setting `deletedAt` while filtering deleted records from list/get results.

#### Scenario: Create persists to localStorage with auto-increment ID
- GIVEN `pf_demo:clients` is `[]` and `pf_demo:nextIds.clients` is `0`
- WHEN a client `{ name: "Alice" }` is created
- THEN the record is persisted with `id: 1`, `pf_demo:nextIds.clients` becomes `1`, and the returned client includes all populated fields

#### Scenario: Soft delete filters records without removing
- GIVEN a client with `id: 1` exists
- WHEN `deleteClient(1)` is called
- THEN the record retains a `deletedAt` timestamp in localStorage AND subsequent `listClients()` / `getClient(1)` calls exclude it

#### Scenario: Substring search matches case-insensitively
- GIVEN clients `"Alice Brown"` and `"Bob White"` exist
- WHEN `searchClients("brown")` is called
- THEN only `"Alice Brown"` is returned

#### Scenario: Pagination returns correct slice
- GIVEN 25 clients exist in localStorage
- WHEN `listClients(2, 10)` is called
- THEN records 11–20 are returned with `meta: { total: 25, page: 2, limit: 10, totalPages: 3 }`

### Requirement: Storage Resolution
A React context provider MUST detect the active mode from `pf_demo:mode` at startup and supply the correct `IStorage` instance. A custom hook SHALL expose the resolved instance to consumers.

#### Scenario: Demo mode resolves to LocalStorage
- GIVEN `pf_demo:mode` equals `"demo"`
- WHEN the storage provider initializes
- THEN the hook returns a `LocalStorage` instance

#### Scenario: Default mode resolves to ApiStorage
- GIVEN `pf_demo:mode` is absent or not `"demo"`
- WHEN the storage provider initializes
- THEN the hook returns an `ApiStorage` instance

### Requirement: TypeScript Contract Compliance
Both `ApiStorage` and `LocalStorage` MUST satisfy `IStorage` under TypeScript strict mode. Missing or mismatched methods, parameters, or return types SHALL produce compile-time errors.

#### Scenario: Missing method fails compilation
- GIVEN `ApiStorage` or `LocalStorage` omits a method required by `IStorage`
- WHEN `tsc` checks the project under strict mode
- THEN a compilation error is reported
