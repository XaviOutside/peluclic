# Exploration: link-pet-services (REVISED — no junction table)

## Decision Override

Previous exploration (Approach 1, embedded in Pets with junction table `pet_services`) is **overridden** per user decision:

> **No junction table.** Add `pet_id` column directly to the existing `services` table. Each service can be linked to at most one pet (optional 1:1 from service to pet). Nullable column — unlink is `pet_id = NULL`.

---

## Current State

The `Service` model in Prisma is standalone — no relationship to pets or clients exists anywhere in the services bounded context:

```prisma
model Service {
  id              Int       @id @default(autoincrement())
  name            String    @db.VarChar(255)
  description     String?   @db.Text
  durationMinutes Int?      @map("duration_minutes")
  price           Int       // cents
  status          Int       @db.TinyInt @default(1)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  @@fulltext([name, description])
  @@map("services")
}
```

**Key architectural facts (unchanged):**
- No foreign keys — referential integrity is application-layer only
- Soft-delete everywhere — all reads filter `deletedAt IS NULL`
- Cross-context cascade exists: `SoftDeleteClient` calls `petRepository.softDeleteAllByClientId()`
- `SoftDeletePet` currently does NO cascade — this is where we need to add `serviceRepository.unlinkAllByPetId()`
- DTO transformation: domain snake_case + TINYINT → API camelCase + human-readable strings

**Frontend status:**
- `PetDetailPage.tsx` — shows pet details via `PetDetailCard`. No services section.
- `ClientDetailPage.tsx` — shows client details + embedded `PetTable`. No services section.
- `ServiceTable` organism already exists (used in Services list page)
- `useServices` hook exists with list/create/update/deactivate/delete/search
- `usePets` hook exists with `clientId` filter support
- `src/services/service.ts` — `listServices(page, limit)` — no filter params yet

---

## Affected Areas

### Backend (services bounded context — primary target)

| File | Change | Why |
|---|---|---|
| `prisma/schema.prisma` | MODIFY Service model: add `pet_id Int?` | Column to link service → pet |
| `prisma/migrations/<ts>_add_pet_id_to_services/` | NEW migration | `ALTER TABLE services ADD pet_id INT; CREATE INDEX` |
| `api/services/domain/Service.ts` | MODIFY: add `petId?: number \| null` to Service, CreateServiceInput, UpdateServiceInput | Domain entity now carries link |
| `api/services/domain/IServiceRepository.ts` | MODIFY: change `findAll` signature to accept filters; add `unlinkAllByPetId` | Repository needs filtering + cascade method |
| `api/services/infrastructure/PrismaServiceRepository.ts` | MODIFY: update `findAll` to filter by petId/clientId; implement `unlinkAllByPetId`; update `create`/`update`/`mapToService` for petId | Infrastructure implementation |
| `api/services/application/ListServices.ts` | MODIFY: add `petId?` and `clientId?` to `ListServicesParams` | Filter support |
| `api/services/application/CreateService.ts` | MODIFY: pass `petId` from input (no validation needed — nullable) | Link on create |
| `api/services/application/UpdateService.ts` | MODIFY: pass `petId` from input (allows unlink via null) | Link/unlink on update |
| `api/services/interface/dtos/ServiceResponseDto.ts` | MODIFY: add `petId: number \| null` to response; update mapper | Expose link to frontend |
| `api/services/interface/dtos/CreateServiceDto.ts` | MODIFY: add `petId?: number` (optional) | Accept link on create |
| `api/services/interface/dtos/UpdateServiceDto.ts` | MODIFY: add `petId?: number \| null` (optional, null = unlink) | Accept link/unlink on update |
| `api/services/interface/ServiceController.ts` | MODIFY: parse `petId`/`clientId` from query params; pass `petId` from body | Controller glue |

### Backend (pets bounded context — cascade)

| File | Change | Why |
|---|---|---|
| `api/pets/application/SoftDeletePet.ts` | MODIFY: inject `IServiceRepository`, call `unlinkAllByPetId(id)` before soft-delete | Cascade: orphan links |
| `api/index.ts` | MODIFY: wire `serviceRepository` into `SoftDeletePetUseCase` | DI wiring |

### Frontend

| File | Change | Why |
|---|---|---|
| `src/types/service.ts` | MODIFY: add `petId: number \| null` to Service; optional `petId?` to CreateServiceInput and UpdateServiceInput | Mirror DTO |
| `src/services/service.ts` | MODIFY: `listServices` accepts optional `petId?` and `clientId?` query params | Filter API calls |
| `src/hooks/useServices.ts` | MODIFY: `fetchList` accepts optional `petId?`/`clientId?`; no breaking changes to existing callers | Filter support in hook |
| `src/pages/PetDetailPage.tsx` | MODIFY: add "Linked Services" section below PetDetailCard using ServiceTable | Display link |
| `src/pages/ClientDetailPage.tsx` | MODIFY: add "Services by Pet" section fetching services grouped by pet | Display per-pet services |
| `src/pages/PetDetailPage.test.tsx` | MODIFY: add test cases for linked services section | TDD |
| `src/pages/ClientDetailPage.test.tsx` | MODIFY: add test cases for services-by-pet section | TDD |

### Test files to update (backend)

| File | Change |
|---|---|
| `api/services/application/ListServices.test.ts` | Add filter test cases (petId, clientId) |
| `api/services/application/CreateService.test.ts` | Add petId scenario |
| `api/services/application/UpdateService.test.ts` | Add link/unlink scenario |
| `api/services/interface/ServiceController.test.ts` | Add query param filter cases; body petId cases |
| `api/pets/application/SoftDeletePet.test.ts` | Add cascade test (services unlinked) |
| `api/services/infrastructure/` (no existing tests) | New integration test for unlinkAllByPetId |

---

## Approach (single option — user decision driven)

### Direct column on Services table (MANDATED)

Add `pet_id INT NULL` to `services`. No junction table, no new Prisma model, no separate routes. The service optionally references one pet.

- **Pros**: Minimal schema change (one column, one migration). No new routes (GET/services already handles list). Matches existing client_id-on-pet pattern exactly. DELETE (unlink) = PUT with petId=null. No new Prisma model.
- **Cons**: Limited to 1:1 service-to-pet (acceptable per user decision). Cannot link one service to multiple pets (out of scope). Schema comment needed documenting that this is intentionally 1:1, not an appointment table.
- **Effort**: Low — ~2 new + ~14 modified backend files, 0 new + ~5 modified frontend files

---

## Design Details

### Prisma Model Change

```diff
model Service {
  id              Int       @id @default(autoincrement())
+ pet_id          Int?      // ref: pets.id — nullable, 1:1 optional link (no FK)
  name            String    @db.VarChar(255)
  ...
}
```

**Index**: `@@index([pet_id])` — for filtering services by pet efficiently.

### API Filtering

Two new optional query params on `GET /api/v1/services`:

| Param | Behavior | Implementation |
|---|---|---|
| `?petId=5` | Filter services WHERE `pet_id = 5` | Simple WHERE clause in Prisma findMany |
| `?clientId=3` | Filter services for all non-deleted pets of client 3 | Requires JOIN: `services INNER JOIN pets ON services.pet_id = pets.id WHERE pets.client_id = 3 AND pets.deleted_at IS NULL` |

**clientId filter implementation**: Since Prisma has no relation defined between Service and Pet (no `@relation`), and the project avoids FK constraints, there are two options:

1. **$queryRaw with JOIN** — follows the existing pattern used by FTS (`search`). Parameterized tagged template:
   ```sql
   SELECT s.* FROM services s
   INNER JOIN pets p ON s.pet_id = p.id
   WHERE p.client_id = ? AND p.deleted_at IS NULL AND s.deleted_at IS NULL
   ORDER BY s.id ASC
   LIMIT ? OFFSET ?
   ```

2. **Two-step Prisma query** — fetch pet IDs first, then filter services by `pet_id IN [...]`. N+1 by design but simpler.

**Recommendation**: Option 1 (raw query with JOIN) — follows the established `search` pattern, single round-trip, already used for complex queries in this codebase.

### Repository Interface Changes

```typescript
// IServiceRepository.ts
export interface IServiceRepository {
  create(data: CreateServiceInput): Promise<Service>;
  findById(id: number): Promise<Service | null>;
  existsById(id: number): Promise<boolean>;
  findAll(params: FindAllParams): Promise<Service[]>;  // CHANGED signature
  update(id: number, data: UpdateServiceInput): Promise<Service>;
  softDelete(id: number): Promise<void>;
  search(sanitizedQuery: string): Promise<Service[]>;
  unlinkAllByPetId(petId: number): Promise<void>;       // NEW
}

export interface FindAllParams {
  page: number;
  limit: number;
  petId?: number;      // filter by linked pet
  clientId?: number;   // filter by client (JOIN through pets)
}
```

**Breaking change**: `findAll(page, limit)` → `findAll({ page, limit, ... })`. All callers must be updated. Alternatives considered:
- Add separate `findAllByPetId` / `findAllByClientId` methods → clutters interface with narrow methods. Following `IPetRepository.findAllByClientId` pattern would be consistent, but three methods for list + two filters is worse than one signature.
- Keep `findAll(page, limit)` and add `findAllWithFilters` → two methods doing almost the same thing.
- **Chosen**: Single `findAll(params)` with optional filters. Clean, testable, one method to maintain. Breaking change is small (one use case, one controller).

### Cascade on SoftDeletePet

```typescript
// SoftDeletePet.ts (after change)
export class SoftDeletePetUseCase {
  constructor(
    private readonly repository: IPetRepository,
    private readonly serviceRepository: IServiceRepository,  // NEW
  ) {}

  async execute(id: number): Promise<void> {
    // existing validation...
    await this.serviceRepository.unlinkAllByPetId(id);  // NEW: unlink before soft-delete
    await this.repository.softDelete(id);
  }
}
```

**unlinkAllByPetId implementation** (PrismaServiceRepository):
```typescript
async unlinkAllByPetId(petId: number): Promise<void> {
  await prisma.service.updateMany({
    where: { pet_id: petId, deletedAt: null },
    data: { pet_id: null },
  });
}
```

Uses `updateMany` — same pattern as `deactivateAllByClientId` / `softDeleteAllByClientId` in PrismaPetRepository. Only touches non-deleted services.

### Frontend Integration

#### PetDetailPage — add linked services table

Pattern follows `ClientDetailPage` embedding `PetTable`: add a card section with title + ServiceTable below `PetDetailCard`. Use `useServices` hook with `petId` filter.

```tsx
// Inside PetDetailPage, after PetDetailCard:
{pet && (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
      <h2 className="text-lg font-semibold text-gray-900">Linked Services</h2>
      <Button variant="primary" size="sm" onClick={handleAddService}>
        Add Service
      </Button>
    </div>
    <div className="px-6 py-4">
      <ServiceTable services={linkedServices} onEdit={...} onDelete={handleRemoveService} />
    </div>
  </div>
)}
```

**"Add Service" flow**: When user clicks "Add Service" on the linked services section, they need to pick an existing service and link it via PUT /api/v1/services/:serviceId with `{ petId: pet.id }`. This requires:
- Fetching all unlinked services (services with `petId === null`) to show in a dropdown — OR
- A searchable service selector component

**Simplest approach for v1**: Link on the Service create/edit form (add a Pet dropdown picker). On PetDetailPage, "Add Service" navigates to `/services/new?petId={petId}`. The service form pre-selects the pet. Editing a service allows changing/removing the petId. This reuses existing forms with minimal new UI.

#### ClientDetailPage — services grouped by pet

Fetch all services for this client: `GET /api/v1/services?clientId={id}`. Then group by `petId` on the frontend using the already-loaded pet list.

```tsx
// New section below existing PetTable:
<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
  <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
    <h2 className="text-lg font-semibold text-gray-900">Services by Pet</h2>
  </div>
  <div className="px-6 py-4">
    {pets.map(pet => {
      const petServices = allServices.filter(s => s.petId === pet.id);
      if (petServices.length === 0) return null;
      return (
        <div key={pet.id} className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{pet.name}</h3>
          <ServiceTable services={petServices} onEdit={...} onDelete={...} />
        </div>
      );
    })}
    {allServices.length === 0 && <EmptyState />}
  </div>
</div>
```

---

## Estimation

| Category | Files | Lines (est.) |
|---|---|---|
| **Backend — new files** | 1 (migration) | ~5 |
| **Backend — modified files** | 13 (domain, repo, use cases, controller, DTOs, DI wiring) | ~200 (deltas) |
| **Backend — modified tests** | 5 (ListServices, CreateService, UpdateService, Controller, SoftDeletePet) | ~150 (deltas) |
| **Prisma schema** | 1 | +3 lines |
| **Frontend — new files** | 0 | — |
| **Frontend — modified files** | 5 (types, services, hook, 2 pages) | ~120 (deltas) |
| **Frontend — modified tests** | 2 (page tests) | ~80 (deltas) |
| **Total new files** | **1** | — |
| **Total modified files** | **~26** | — |
| **Total new/changed lines** | — | **~560** |

---

## Recommendation

**Proceed.** This is the simplest possible implementation — one column, no new routes, natural fit within existing architecture. The design follows every established pattern in the codebase: nullable reference columns, updateMany for cascade, raw queries for JOINs, embedded component sections in detail pages.

---

## Risks

- **1:1 limitation** — if the user later wants multi-pet service assignments (e.g., "Bath" linked to two pets), this design does not support it. The user explicitly chose this constraint.
- **clientId filter JOIN** — the raw SQL query for clientId filtering introduces a second query path in `PrismaServiceRepository`. Must ensure parameterized binding (tagged template) to prevent SQL injection — same pattern as `search()`.
- **Soft-delete cascade race condition** — `unlinkAllByPetId` then `softDelete` are two separate transactions. If the unlink succeeds but softDelete fails, services remain unlinked from a pet that is NOT deleted. Low risk in practice but worth noting. Could wrap in a Prisma interactive transaction (`$transaction`) if needed.
- **PetDetailPage Add Service UX** — the v1 approach (navigate to /services/new) is functional but not seamless. A future improvement could be a pet-picker dropdown on the Service form or an inline "Quick Link" component. Acceptable for now.
- **ServiceTable props** — current `ServiceTable` has `onEdit` and `onDelete` (no `onView`, no `onDeactivate`). Adding `onRemove` (unlink) in the context of PetDetailPage would require either a new prop or overloading `onDelete`. Better to expose an `onRemove` callback that unlinks (sets petId=null) rather than soft-deletes. This may require a table variant or simple prop addition.

---

## Ready for Proposal

**Yes.** The approach is well-defined, fits existing architecture patterns exactly, and requires zero new routes or Prisma models. All needed changes map cleanly to existing layers.

