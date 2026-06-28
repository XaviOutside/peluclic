# Design: Services API Bounded Context

## Architecture Overview

Greenfield bounded context at `/api/v1/services`, replicating the Pets Clean Architecture pattern identically. Four layers (domain → application → infrastructure → interface), DDD, no cross-context cascade (Appointments don't exist yet). Third nav tab: Clients → Pets → Services.

```
┌─ Interface ───────────────────────────────────────────┐
│  serviceRouter.ts ── ServiceController.ts ── DTOs/     │
│  (factory)           (constructor injection)           │
│  ┌─ Application ──────────────────────────────────┐   │
│  │  Create | Get | List | Update | Deactivate      │   │
│  │  SoftDelete | Search (7 use cases)              │   │
│  │  ┌─ Domain ────────────────────────────────┐   │   │
│  │  │ Service.ts | IServiceRepository.ts       │   │   │
│  │  │ ┌─ Shared (api/shared/domain/) ──────┐   │   │   │
│  │  │ │ errors.ts (NotFound, Validation,    │   │   │   │
│  │  │ │ AlreadyDeleted)                     │   │   │   │
│  │  │ └─────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────┘   │
│  ┌─ Infrastructure ───────────────────────────────┐   │
│  │  PrismaServiceRepository.ts                    │   │
│  │  └─ prisma.ts (shared singleton)               │   │
│  │  └─ sanitizeFtsQuery.ts (shared FTS util)      │   │
│  └────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

## Data Model

### Prisma Schema Addition

```prisma
model Service {
  id              Int       @id @default(autoincrement())
  name            String    @db.VarChar(255)
  description     String?   @db.Text
  durationMinutes Int?      @map("duration_minutes")
  price           Int       // cents (e.g. 2500 = $25.00)
  status          Int       @db.TinyInt @default(1) // 0=inactive, 1=active
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  @@fulltext([name, description])
  @@map("services")
}
```

Migration: `prisma migrate dev --name add_service_model` — adds `services` table with `TINYINT` status, `FULLTEXT(name, description)`, no FK constraints.

### Domain Types & DTO Mapping Contract

| DB Column | DB Type | Domain Type | API DTO (camelCase) |
|-----------|---------|-------------|---------------------|
| name | VARCHAR(255) | `string` | `name: string` |
| description | TEXT NULL | `string \| null` | `description: string \| null` |
| duration_minutes | INT NULL | `number \| null` | `durationMinutes: number \| null` |
| price | INT | `number` (cents) | `price: number` (dollars, e.g. 50.00) |
| status | TINYINT(0/1) | `ServiceStatus = 0 \| 1` + `SERVICE_STATUS` const | `'active' \| 'inactive'` |

`toServiceResponseDto()`: TINYINT→string, cents→dollars (`price / 100`), Date→ISO string, `deletedAt` omitted. Controller maps `CreateServiceDto`/`UpdateServiceDto` (camelCase, dollars) → domain input (cents). No `status` in `UpdateServiceDto` (blocked by controller — FR-4).

## Backend Layer Design

Constructor injection, `execute()` pattern. Uses shared domain errors from `api/shared/domain/errors.ts` (`NotFoundError → 404`, `ValidationError → 422`, `AlreadyDeletedError → 409`) — no need for domain-specific error subclasses.

| Use Case | Key Logic |
|----------|-----------|
| `CreateService` | `name` required 1-255, `price` required ≥ 0, `duration_minutes` optional > 0 |
| `GetService` | `findById` → 404 if null or soft-deleted |
| `ListServices` | Paginated (default page=1, limit=20, max=100). No server-side filter |
| `UpdateService` | Excludes `status` field. Validates provided fields |
| `DeactivateService` | Sets `status = SERVICE_STATUS.INACTIVE`. Idempotent (200 if already inactive) |
| `SoftDeleteService` | Sets `deletedAt`. 409 if already deleted |
| `SearchServices` | `sanitizeFtsQuery()` → `MATCH(name, description) AGAINST(? IN BOOLEAN MODE)`. `q=` required, else 400 |

### Shared Domain Errors (`api/shared/domain/errors.ts`)

Both `api/pets/domain/PetErrors.ts` and `api/clients/domain/ClientErrors.ts` contain identical error class logic copy-pasted with different names. Services uses shared errors from the start. The existing Pets/Clients contexts can be migrated later.

```typescript
// api/shared/domain/errors.ts — zero framework/DB imports

export class NotFoundError extends Error {
  constructor(entity: string, id: number) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class AlreadyDeletedError extends Error {
  constructor(entity: string, id: number) {
    super(`${entity} with id ${id} is already deleted`);
    this.name = 'AlreadyDeletedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Controller error mapping** (same for Services, Pets, Clients):
| Error type | HTTP status | Example |
|-----------|-------------|---------|
| `NotFoundError` | 404 | `throw new NotFoundError('Service', 5)` → `Service with id 5 not found` |
| `ValidationError` | 422 | `throw new ValidationError('Name is required')` |
| `AlreadyDeletedError` | 409 | `throw new AlreadyDeletedError('Service', 5)` |
| Any other | 500 | `Internal server error` (message logged, never exposed) |
| Invalid `:id` param | 422 | `Invalid id — must be a positive integer` (handled in controller before use case) |

**Repository** (`IServiceRepository`): `create`, `findById`, `findAll`, `update`, `softDelete`, `search`. No cascade methods. `PrismaServiceRepository.search()` uses `$queryRaw` with tagged template.

## Route Design

Order matters: `/search` before `/:id` to avoid Express interpreting "search" as an `:id`.

```
POST   /api/v1/services                          → 201 | createService
GET    /api/v1/services/search?q=<query>         → 200 | searchServices
GET    /api/v1/services?page=1&limit=20          → 200 | listServices
GET    /api/v1/services/:id                      → 200 | getService
PUT    /api/v1/services/:id                      → 200 | updateService
PATCH  /api/v1/services/:id/deactivate           → 200 | deactivateService
DELETE /api/v1/services/:id                      → 204 | deleteService
```

## Frontend Design

### Routing (`src/App.tsx` modifications)

Add 4 routes + nav tab "Services" (third, after Pets). Use `<a href="/services">` like existing tabs (hard nav — matching current pattern).

### Component Tree

```
ServiceListPage
├── SearchBar (molecule, reused)
├── ServiceTable (organism, NEW)
│   └── StatusBadge (molecule, reused)
└── Pagination (molecule, reused)

ServiceCreatePage / ServiceEditPage
└── ServiceForm (molecule, NEW — create/edit mode)
    ├── Input (atom, reused)
    ├── Select (atom, reused)
    └── Button (atom, reused)

ServiceDetailPage
├── ServiceDetailCard (organism, NEW)
│   └── StatusBadge (molecule, reused)
└── ConfirmDialog (molecule, reused — deactivate/delete)
```

### State Management

`useServices()` hook with component-local state (`useState`). No global store. Exposes: `services`, `isLoading`, `error`, `search(query)`, `refresh()`, `goToPage(n)`, plus all CRUD mutations. Optimistic update on create/update/delete. Search debounced at 300ms via `useRef + setTimeout`. Price input field converts user-entered dollars → cents on submit, cents → dollars on display (via `useServices` hook).

### Backend File Tree

```
api/services/
├── domain/
│   ├── Service.ts                  # Entity, DTOs, SERVICE_STATUS const
│   └── IServiceRepository.ts       # Repository interface
├── application/
│   ├── CreateService.ts
│   ├── GetService.ts
│   ├── ListServices.ts
│   ├── UpdateService.ts
│   ├── DeactivateService.ts
│   ├── SoftDeleteService.ts
│   └── SearchServices.ts
├── infrastructure/
│   └── PrismaServiceRepository.ts  # Prisma impl of IServiceRepository
└── interface/
    ├── ServiceController.ts        # Express controller
    ├── serviceRouter.ts            # Factory router function
    └── dtos/
        ├── CreateServiceDto.ts
        ├── UpdateServiceDto.ts
        └── ServiceResponseDto.ts

api/shared/
└── domain/
    └── errors.ts                   # NEW — NotFoundError, ValidationError, AlreadyDeletedError
```

### Frontend File Tree

```
src/types/service.ts                         # Service, CreateServiceInput, UpdateServiceInput
src/services/service.ts                       # 7 API functions (list, get, create, update, deactivate, delete, search)
src/hooks/useServices.ts                      # Single hook with full CRUD + search
src/components/organisms/ServiceTable.tsx      # Table: name, duration, price, status, actions
src/components/organisms/ServiceDetailCard.tsx # Read-only detail + action buttons
src/components/molecules/ServiceForm.tsx       # Create/edit form with validation
src/pages/ServiceListPage.tsx                 # Table + search + "New Service" button
src/pages/ServiceCreatePage.tsx               # Form → POST, redirect on success
src/pages/ServiceDetailPage.tsx               # Detail card + actions
src/pages/ServiceEditPage.tsx                 # Pre-populated form → PUT
```

**Services API wrapper** (`src/services/service.ts`) — 7 functions matching `client.ts` pattern, all using `http<T>()` from `@/services/http`.

## Data Flow

```
Browser → ServiceCreatePage → ServiceForm
  → onSubmit: dollars → cents conversion
    → POST /api/v1/services { name, price:4999, durationMinutes:60 }
      → ServiceController.createService()
        → maps CreateServiceDto → CreateServiceInput
          → CreateServiceUseCase.execute()
            → validates → PrismaServiceRepository.create()
              → prisma.service.create() → MySQL INSERT
            ← domain Service
          ← toServiceResponseDto() (cents→dollars)
        ← 201 { id:3, name:"Full Groom", price:49.99, status:"active", ... }
      ← Browser parses → redirects to /services/3
```

## File Dependency Graph

```
prisma/prisma.ts (singleton) ────────────────────────────┐
api/shared/utils/sanitizeFtsQuery.ts ────────────────────┤
api/shared/domain/errors.ts ◄── NotFoundError, etc       │
                                                         ▼
api/services/domain/Service.ts ◄── IServiceRepository.ts
                                                         │
api/services/application/*.ts ◄── domain/ + shared/      │
                                                         ▼
api/services/infrastructure/PrismaServiceRepository.ts ◄── domain/ + prisma.ts
                                                         │
api/services/interface/dtos/*.ts ◄── domain/              │
api/services/interface/ServiceController.ts ◄── application/ + dtos/
api/services/interface/serviceRouter.ts ◄── ServiceController
                                                         │
api/index.ts ◄── wire all services deps ──────────────────┘

src/types/service.ts ◄── mirrors API DTO
src/services/service.ts ◄── http.ts + types/service.ts
src/hooks/useServices.ts ◄── services/service.ts
src/components/**/*.tsx ◄── hooks + atoms/molecules (reused)
src/pages/*.tsx ◄── components + hooks
src/App.tsx ◄── pages
```

## Testing Strategy

| Layer | Config | Approach |
|-------|--------|----------|
| Use cases (7) | `vitest.config.ts` | Mock `IServiceRepository`. Test success + each validation rule |
| Controller | `vitest.config.ts` | Supertest + mocked use cases. Test status codes, DTO shape, error mapping |
| Repository | `vitest.integration.config.ts` | Real Prisma against MySQL. `@integration` tag |
| Frontend API | `vitest.frontend.config.ts` | `vi.stubGlobal('fetch')`. Test URL, method, body |
| Frontend hook | `vitest.frontend.config.ts` | `renderHook` with mocked `service.ts` |
| Frontend pages/components | `vitest.frontend.config.ts` | `@testing-library/react`. Loading/empty/error/data states |

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Shared domain errors | `api/shared/domain/errors.ts` with `NotFoundError`, `ValidationError`, `AlreadyDeletedError` | Eliminates copy-paste duplication. Both `PetErrors.ts` and `ClientErrors.ts` have identical logic with different class names. Services uses shared errors from the start. Existing contexts can be refactored later. |
| Single `status` field (no `active`) | Remove separate `active` column from AGENTS.md model | Proposal override. Pets/Clients have one `status`, Services should match. `active` flag was speculative copy from AGENTS.md |
| No cascade to Appointments | Skip cascade methods in repo interface | Appointments bounded context doesn't exist. Use case constructors can accept optional deps later |
| `LIST` returns all services (no server filter) | No `status` or `active` query param on `GET /` | Matches Clients/Pets pattern. Frontend filters locally |
| All mutations in single `useServices` hook | One hook, not separate list + detail + mutations | Simpler for this domain — Services won't have clientId-based embedded views like Pets does |
| ServiceForm as molecule (not organism) | Molecule level, same as `PetForm` and `ClientForm` | Consistency with existing Atomic Design classification |
| No `reactivate` endpoint | Omitted (dead code in Clients, absent in Pets) | Pattern consistency. Can be added later if needed |

## Open Questions

None — all decisions resolved in proposal and spec.
