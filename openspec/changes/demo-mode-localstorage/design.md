# Design: Demo Mode with localStorage

## Technical Approach

Introduce a **Storage Provider Pattern** — an `IStorage` interface with two implementations (`ApiStorage` wraps `http()`, `LocalStorage` uses `localStorage`). A React context (`StorageModeProvider`) detects the active mode from `pf_demo:mode` in localStorage and provides the correct storage instance. Service files (`src/services/*.ts`) are refactored to delegate through the context instead of calling `http()` directly. Hooks, pages, components, and types are untouched.

## Architecture Decisions

### Decision: Storage Provider Pattern

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| **Storage Provider Pattern** (IStorage + ApiStorage + LocalStorage + React context) | ~6 new files, ~30-method interface | **Chosen** — minimal blast radius, zero hook/page changes, testable impls independently, future paid mode is a one-line switch |
| Direct localStorage branching in services | Fewer files | Rejected — violates DRY, hard to test cleanly, future paid mode touches every service file again |
| Backend in-memory mode | No frontend changes | Rejected — violates "no backend needed for demo" requirement |

**Rationale**: The exploration confirmed this is the only approach that leaves hooks, pages, and components untouched. The extra abstraction cost (~6 files) pays for itself immediately.

### Decision: LocalStorage key namespace `pf_demo:`

**Choice**: `pf_demo:{entity,nextIds,mode}` prefixed keys.  
**Alternatives**: `pfmaster_demo_*` (longer), bare keys (collision risk).  
**Rationale**: Consistent namespace, copy-paste safe, easy to clear (`Object.keys(localStorage).filter(k => k.startsWith('pf_demo:'))`).

### Decision: LandingPage at `/`, mode redirect

**Choice**: LandingPage renders at `/` via `PublicLayout` when `mode === null`. Once demo selected, navigating `/` redirects to `/clients`.  
**Alternatives**: Separate `/landing` route (confusing), conditional render in `App` (breaks layout nesting).  
**Rationale**: Keeps existing `App.tsx` routing intact. `DashboardLayout` wrappers are unchanged. The mode-gate is a single conditional before `<Routes>`.

## Data Flow

```
User opens app → main.tsx → StorageModeProvider mounts
                                  │
                    reads localStorage('pf_demo:mode')
                                  │
                    ┌─────────────┴─────────────┐
                    │ null                      │ 'demo'
                    ▼                           ▼
            LandingPage shown            LocalStorage created
            (mode selector)                     │
                    │                 pf_demo:clients, pets, etc.
            User clicks "Try Demo"              │
                    │                    App routes render
            setItem('pf_demo:mode','demo')      │
                    │                Pages → Hooks → services/*.ts
            navigate(/clients)                 │
                                   storageContext.getStorage()
                                          │
                                   LocalStorage.listClients()
                                          │
                                   JSON.parse(localStorage('pf_demo:clients'))
                                          │
                                   [paginate] → PaginatedResponse<Client>

Data operations (CRUD):
  Page → Hook → Service function → storageContext.storage.method()
                                         │
                    ┌────────────────────┴────────────────────┐
                    │ demo                                     │ api
                    ▼                                          ▼
         LocalStorage.{method}()                    ApiStorage.{method}()
                    │                                          │
         localStorage.setItem()                    http() → /api/v1/*
```

## IStorage Interface (30 methods)

```typescript
// Clients (8)
listClients(page: number, limit: number): Promise<PaginatedResponse<Client>>
getClient(id: number): Promise<Client>
createClient(data: CreateClientDto): Promise<Client>
updateClient(id: number, data: UpdateClientDto): Promise<Client>
deleteClient(id: number): Promise<void>
reactivateClient(id: number): Promise<Client>
deactivateClient(id: number): Promise<Client>
searchClients(query: string): Promise<Client[]>

// Pets (7)
listPets(page: number, limit: number, clientId?: number): Promise<PaginatedResponse<Pet>>
getPet(id: number): Promise<Pet>
createPet(data: CreatePetInput): Promise<Pet>
updatePet(id: number, data: UpdatePetInput): Promise<Pet>
deletePet(id: number): Promise<void>
deactivatePet(id: number): Promise<Pet>
searchPets(query: string): Promise<Pet[]>

// Services (7)
listServices(page: number, limit: number, petId?: number): Promise<PaginatedResponse<Service>>
getService(id: number): Promise<Service>
createService(data: CreateServiceInput): Promise<Service>
updateService(id: number, data: UpdateServiceInput): Promise<Service>
deleteService(id: number): Promise<void>
deactivateService(id: number): Promise<Service>
searchServices(query: string): Promise<Service[]>

// Appointments (5)
listAppointments(start: string, end: string): Promise<Appointment[]>
getAppointment(id: number): Promise<Appointment>
createAppointment(data: CreateAppointmentDto): Promise<Appointment>
updateAppointment(id: number, data: UpdateAppointmentDto): Promise<Appointment>
cancelAppointment(id: number): Promise<Appointment>

// Settings (3)
getSettings(): Promise<CompanySettings>
updateSettings(data: UpdateSettingsDto): Promise<CompanySettings>
uploadLogo(file: File): Promise<CompanySettings>
```

## LocalStorage Schema

```
pf_demo:mode       → "demo" | "api"   (<100 bytes, mode flag)
pf_demo:clients    → JSON.stringify(Client[])   (array, ~250 KB at 1k records)
pf_demo:pets       → JSON.stringify(Pet[])      (array, ~250 KB at 1k records)
pf_demo:services   → JSON.stringify(Service[])  (array, ~200 KB at 1k records)
pf_demo:appointments → JSON.stringify(Appointment[]) (array, ~150 KB)
pf_demo:settings   → JSON.stringify(CompanySettings) (singleton object, ~200 bytes)
pf_demo:nextIds    → JSON.stringify({ clients, pets, services, appointments }) (~100 bytes)
```

**ID generation**: `nextIds` tracks per-entity auto-increment. On `create*()`, read `nextIds.entity`, use as new ID, increment and save. IDs are contiguous from 1 upward.

**Soft delete**: `delete*()` sets `deletedAt: new Date().toISOString()` on the entity. `list*()` and `get*()` filter out `deletedAt !== null` records. `search*()` also excludes soft-deleted records.

**Deactivation**: `deactivate*()` sets `status: 'inactive'`. Deactivated records still appear in list/search (unlike soft-deleted).

**Search**: Case-insensitive `String.includes()` on relevant fields. Clients: name, email. Pets: name, breed, notes. Services: name, description. No FTS operators — pure substring.

**Pagination**: `list*()` implementations use `Array.slice((page - 1) * limit, page * limit)` and `Math.ceil(total / limit)`.

**Error handling**: Every read wraps `JSON.parse` in try/catch — returns empty array/object on corruption. `localStorage.setItem` wrapped in try/catch for `SecurityError` (private browsing).

## Route Design

```tsx
// App.tsx — minimal change
function App() {
  const { mode } = useStorageMode();
  const isResolved = mode !== null;

  if (!isResolved) {
    return <LandingPage />;  // no layout chrome — standalone
  }

  // Existing routes unchanged
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/clients" replace />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<DashboardLayout />}>
        {/* all existing dashboard routes unchanged */}
      </Route>
    </Routes>
  );
}
```

The `LandingPage` is shown **outside** `<Routes>` — it's a mode-gate, not a route. Current `LandingPage.tsx` is refactored: "Get Started" becomes "Try Demo" (calls `setMode('demo')`, navigates), "Try Demo" button becomes "Log In" (inactive, shows "Coming soon" toast).

## Component Structure

```
LandingPage (page — modified)
  ├── Button (atom — existing) — "Try Demo" CTA
  ├── Button (atom — existing) — "Log In" (inactive variant)
  └── (uses existing design tokens: --surface, --primary-container, --on-surface, etc.)

ModeGate (new — inline in App.tsx, not a separate component)
  Conditionally renders LandingPage vs App routes based on `useStorageMode().mode === null`

StorageModeProvider (new — src/storage/storageContext.tsx)
  ├── Detects pf_demo:mode from localStorage (synchronous render)
  ├── Instantiates LocalStorage or ApiStorage
  └── Provides storage + mode via React context
```

The LandingPage already exists at `src/pages/LandingPage.tsx` with hero section, bento grid features, and footer. It just needs button text/link changes.

## File Change Map

| File | Action | Description |
|------|--------|-------------|
| `src/storage/IStorage.ts` | **Create** | 30-method interface, typed per-domain |
| `src/storage/ApiStorage.ts` | **Create** | Delegates to existing `http()`; 1:1 method mapping |
| `src/storage/LocalStorage.ts` | **Create** | Full CRUD, search (substring `includes`), pagination (`Array.slice`), soft delete, ID generation |
| `src/storage/useStorageMode.ts` | **Create** | Reads `pf_demo:mode`, exposes `{ mode, setMode, storage, isResolved }` |
| `src/storage/storageContext.tsx` | **Create** | `StorageModeProvider` — mounts context, instantiates storage impl, exposes via `useStorage()` |
| `src/pages/LandingPage.tsx` | **Modify** | Replace `/register` CTA with `setMode('demo')+navigate(/clients)`, add "Log In" button (disabled, toast "Coming soon") |
| `src/services/client.ts` | **Modify** | Each function: `storage.listClients(...)` instead of `http(...)`; import storage from context |
| `src/services/pet.ts` | **Modify** | Same pattern — delegate to `storage.*` |
| `src/services/service.ts` | **Modify** | Same pattern — delegate to `storage.*` |
| `src/services/appointments.ts` | **Modify** | Same pattern — delegate to `storage.*` |
| `src/services/settings.ts` | **Modify** | Same pattern; `uploadLogo` remains direct fetch in both modes |
| `src/main.tsx` | **Modify** | Wrap `<App />` in `<StorageModeProvider>` |
| `src/App.tsx` | **Modify** | Add mode-gate: `if (!isResolved) return <LandingPage />`; redirect `/` to `/clients` when resolved |
| `src/services/http.ts` | **None** | Unchanged |
| `src/hooks/*.ts` (15 files) | **None** | Unchanged contracts |
| `src/pages/*.tsx` (all except LandingPage) | **None** | Unchanged |
| `src/types/*.ts` (all) | **None** | Unchanged |
| `vite.config.ts` | **None** | Proxy remains; never hit in demo mode |
| Backend (`api/`) | **None** | No changes |
| `docker-compose.yml` | **None** | No changes |

**Service file modification pattern** (applied consistently to all 5 files):

```typescript
// BEFORE
import { http } from '@/services/http';
export function listClients(page = 1, limit = 20) {
  return http<PaginatedResponse<Client>>(`/clients?page=${page}&limit=${limit}`);
}

// AFTER
import { getStorage } from '@/storage/storageContext';
export function listClients(page = 1, limit = 20) {
  const storage = getStorage();
  return storage.listClients(page, limit);
}
```

Note: `getStorage()` is a module-level accessor pattern — no hook needed in service files because the context is already mounted by `StorageModeProvider` in `main.tsx`. The storage instance is stored in a module-scoped variable set during provider mount.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit** — `LocalStorage` | All 30 methods: CRUD, search (includes), pagination, soft delete, deactivation, ID generation, JSON corruption recovery, empty state | Vitest + jsdom. Before each test: `localStorage.clear()`. Test each domain independently. |
| **Unit** — `ApiStorage` | All 30 methods delegate to `http()` with correct args | Vitest + vi.mock on `http()`. Verify endpoint, method, body — not response shape (that's http's job). |
| **Unit** — `useStorageMode` | Initial null state → set to 'demo' → persisted in localStorage → subsequent mount reads 'demo' | Vitest + jsdom. Test no localStorage → null; setMode('demo') → mode='demo'. Test SecurityError fallback. |
| **Unit** — `storageContext` | Provider mounts, provides storage instance | Vitest + testing-library. Render wrapper, verify `useStorage()` returns non-null. |
| **Integration** — Service files | Client service calls storage.listClients not http | Vitest. Mock storage context, verify delegation. |
| **Component** — LandingPage | "Try Demo" button sets mode and navigates; "Log In" shows toast | Vitest + testing-library + mock useStorageMode. |
| **E2E** | Full demo flow: land → click "Try Demo" → create client → verify persistence on refresh | Playwright. Deferred — E2E layer is NOT_CONFIGURED in this project. |
| **Existing tests** | All 57 existing tests (30 API + 27 frontend) must pass unchanged | Run full suite. Service tests that mock `http()` must be updated to mock `getStorage()` instead. |

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Rollout / Migration

No migration required — this is a fully additive change. Existing behavior (API mode) is preserved as `ApiStorage` implementation. The default mode is `null` (unresolved), which triggers LandingPage. No data migration path between demo and paid exists in v1.

## Open Questions

None — all technical decisions are resolved.
