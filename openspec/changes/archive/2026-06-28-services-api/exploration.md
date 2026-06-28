## Exploration: Services API Bounded Context

### Current State

pfmaster has two bounded contexts: **Clients** (`/api/v1/clients`) and **Pets** (`/api/v1/pets`). Both follow the identical Clean Architecture + DDD pattern. The **Services domain does NOT exist yet** — zero code anywhere (no model, types, routes, pages, components, or tests). Only documented in `AGENTS.md`.

The Service entity domain model per AGENTS.md:
```
Service: id, name, description, duration_minutes, price, active, status (0/1), created_at, updated_at, deleted_at
FULLTEXT(name, description)
```

### Affected Areas

None currently — this is a greenfield bounded context. However, these existing files will need modification to wire it in:
- `prisma/schema.prisma` — add Service model
- `api/index.ts` — import and wire ServiceController + router at `/api/v1/services`
- `src/App.tsx` — add Service routes and nav link

### Existing Pattern (Clients & Pets Template)

Both bounded contexts follow the EXACT same structure. Below is the Pets template (recommended template since it was built second and refined):

```
api/pets/
├── domain/
│   ├── Pet.ts              # Entity interface, enums (TINYINT unions), input types
│   ├── PetErrors.ts        # Domain error classes (NotFound, AlreadyDeleted, Validation)
│   └── IPetRepository.ts   # Repository interface (domain types only, no framework)
├── application/
│   ├── CreatePet.ts        # Validation + orchestration
│   ├── GetPet.ts           # Fetch-by-id (rejects soft-deleted)
│   ├── ListPets.ts         # Paginated list (supports clientId filter)
│   ├── UpdatePet.ts        # Field-level updates (excludes status)
│   ├── DeactivatePet.ts    # Sets status=INACTIVE
│   ├── SoftDeletePet.ts    # Sets deletedAt (idempotency: rejects already-deleted)
│   └── SearchPets.ts       # Sanitizes input → FTS query via repo
├── infrastructure/
│   └── PrismaPetRepository.ts  # Prisma implementation, mapToX(), $queryRaw for FTS
└── interface/
    ├── PetController.ts    # Express handlers, DTO mapping, error→HTTP mapping
    ├── petRouter.ts        # createPetRouter() factory, route order (search before :id)
    └── dtos/
        ├── CreatePetDto.ts     # camelCase API boundary
        ├── UpdatePetDto.ts     # Optional fields, status excluded
        └── PetResponseDto.ts   # toPetResponseDto(): TINYINT→string, Date→ISO
```

**Key pattern observations:**

| Aspect | Pattern |
|---|---|
| Domain entity | `interface X` + `type XStatus = 0 \| 1` + const enums |
| Domain errors | 3 classes: `NotFoundError(422)`, `AlreadyDeletedError(409)`, `ValidationError(422)` |
| Repository interface | return domain types only, no Prisma/Express imports |
| Use cases | constructor injection of `IXxxRepository`, single `execute()` method |
| Controller | receives all use cases via constructor, handles req→DTO→useCase→res |
| Router | factory function `createXxxRouter(controller)` → `Router` |
| Route order | `/search` MUST come before `/:id` |
| DTOs | camelCase API boundary; controller maps to snake_case domain inputs |
| Response DTO | `toXxxResponseDto()` maps TINYINT→string labels, Date→ISO 8601 |
| Repository | `prisma.x.create()` with soft-delete filtering, `$queryRaw` for FTS |
| FTS | `MATCH(cols) AGAINST(? IN BOOLEAN MODE)` via tagged template literals |
| Error mapping | `handleError()`: instanceof checks → 404/422/409 → 500 fallback |
| PATCH deactivate | `PATCH /:id/deactivate` → sets status=INACTIVE → returns updated entity |
| DELETE | `DELETE /:id` → sets deletedAt → 204 No Content |

### Prisma Service Model Status

**DOES NOT EXIST.** Only `Client` and `Pet` models in `prisma/schema.prisma`. No migration for services table exists.

Migrations present:
- `20260624175955_create_clients_table`
- `20260628162032_add_pet_model`

A new Prisma model + migration is required, following the same conventions:
- `TINYINT` for `active` (boolean flag) and `status` (0/1)
- `INT` for `price` (stored in cents per project rules)
- `@@fulltext([name, description])`
- `@@map("services")`
- No FK constraints (denormalized by design)
- `deleted_at` for soft-delete

### Required Endpoints (same pattern as Pets)

| Method | Route | Controller Method | Use Case | Status |
|---|---|---|---|---|
| POST | `/api/v1/services` | `createService` | `CreateServiceUseCase` | 201 |
| GET | `/api/v1/services` | `listServices` | `ListServicesUseCase` | 200 |
| GET | `/api/v1/services/search` | `searchServices` | `SearchServicesUseCase` | 200 |
| GET | `/api/v1/services/:id` | `getService` | `GetServiceUseCase` | 200 |
| PUT | `/api/v1/services/:id` | `updateService` | `UpdateServiceUseCase` | 200 |
| PATCH | `/api/v1/services/:id/deactivate` | `deactivateService` | `DeactivateServiceUseCase` | 200 |
| DELETE | `/api/v1/services/:id` | `deleteService` | `SoftDeleteServiceUseCase` | 204 |

No `reactivate` endpoint — neither Clients nor Pets backend has one (the frontend `reactivateClient` function is dead code — no matching backend route).

### Required Prisma Operations

```typescript
interface IServiceRepository {
  create(data: CreateServiceInput): Promise<Service>;
  findById(id: number): Promise<Service | null>;
  findAll(page: number, limit: number): Promise<Service[]>;
  update(id: number, data: UpdateServiceInput): Promise<Service>;
  softDelete(id: number): Promise<void>;
  search(sanitizedQuery: string): Promise<Service[]>;
}
```

No cascade methods needed (no child entities yet — Appointments don't exist).

### Entity Fields and Types/Enums

```typescript
// Domain entity
interface Service {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;       // stored as INT (minutes)
  price: number;                  // stored as INT (cents) per project rules
  active: ServiceActive;          // TINYINT: 0=false, 1=true
  status: ServiceStatus;          // TINYINT: 0=inactive, 1=active
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

type ServiceActive = 0 | 1;      // 0 = false (retired), 1 = true (available)
type ServiceStatus = 0 | 1;      // 0 = inactive, 1 = active

// Prisma schema mapping
active      Int  @db.TinyInt @default(1)   // 0=retired, 1=available
status      Int  @db.TinyInt @default(1)   // 0=inactive, 1=active
price       Int                            // cents (e.g. 2500 = $25.00)
duration_minutes Int                       // e.g. 60 = 1 hour
```

### Frontend Files Needed

Following the Atomic Design pattern:

```
src/
├── types/
│   └── service.ts                 # Service interface, CreateServiceInput, UpdateServiceInput
├── services/
│   └── service.ts                 # Typed fetch wrappers for /services endpoints
├── components/
│   ├── molecules/
│   │   └── ServiceForm.tsx         # Create/Edit form (name, description, duration, price, active)
│   └── organisms/
│       ├── ServiceTable.tsx        # Paginated table (name, duration, price, status, actions)
│       └── ServiceDetailCard.tsx   # Read-only detail view
└── pages/
    ├── ServiceListPage.tsx         # Table + search + create button
    ├── ServiceCreatePage.tsx       # Form → POST
    ├── ServiceEditPage.tsx         # Form → PUT (pre-populated)
    └── ServiceDetailPage.tsx       # Detail card + edit/delete/deactivate actions
```

Frontend routes (in `App.tsx`):
- `/services` → `ServiceListPage`
- `/services/new` → `ServiceCreatePage`
- `/services/:id` → `ServiceDetailPage`
- `/services/:id/edit` → `ServiceEditPage`

### Route: `/api/v1/services`

Consistent with `/api/v1/clients` and `/api/v1/pets`. No reason to deviate.

### Search: FULLTEXT Columns

`FULLTEXT(name, description)` — per AGENTS.md. Same pattern as Clients (`FULLTEXT(name, email)`) and Pets (`FULLTEXT(name, breed, notes)`).

### Cascade: Do Any Operations on Services Affect Other Domains?

**No — not currently.** Appointments don't exist yet. When Appointments ARE implemented, deactivating or soft-deleting a Service would need to cascade to its Appointments (similar to how `DeactivateClientUseCase` cascades to `petRepository.deactivateAllByClientId()`). The Services repository interface should anticipate this by NOT including cascade methods yet — they can be added when the Appointment domain is built.

The `DeactivateServiceUseCase` and `SoftDeleteServiceUseCase` should be designed to accept an optional `IAppointmentRepository` in the future, but for now only need `IServiceRepository`.

### Files That Need Modification

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `Service` model with `@@fulltext([name, description])` |
| (new migration) | `prisma migrate dev --name add_service_model` |
| `api/index.ts` | Import + wire `ServiceController`, `createServiceRouter`, `PrismaServiceRepository` |
| `src/App.tsx` | Add Service routes, nav link "Services" |

Plus ~37 new files (same count as Pets was ~43 — minus cascade-related methods since no Appointments exist).

### Key Observations

1. **Services has both `active` and `status`** — `active` is a business flag (retire a service without deleting), `status` is the standard soft-delete lifecycle flag. This is the only entity with dual boolean flags.
2. **`price` in cents** — per project rule #5: "Prices are stored as integers in cents." DTO must expose as whole-dollar float or formatted string.
3. **No FK relationships** — Services are referenced by Appointments (future) but per project rules, no FK constraints are defined.
4. **The `reactivateClient` in `src/services/client.ts` is dead code** — no backend route exists for it. Services should NOT include a reactivate endpoint unless explicitly requested.
5. **Pets does NOT have `reactivate`** — confirming the pattern is deactivate-only for now.
