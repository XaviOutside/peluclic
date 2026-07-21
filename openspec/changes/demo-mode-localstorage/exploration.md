## Exploration: Demo Mode with localStorage

### Current State

The pfmaster application is a **full-stack pet grooming management app** with these characteristics:

**Backend (Express + Prisma + MySQL)**
- Clean Architecture with 5 bounded contexts: `clients`, `pets`, `services`, `appointments`, `settings`
- Each context: `domain/` (entity + repository interface) → `application/` (use cases) → `interface/` (controller + router + DTOs) → `infrastructure/` (Prisma repository)
- Wiring in `api/index.ts`: manual DI — Prisma repos injected into use cases, use cases into controllers, routers mounted at `/api/v1/{context}`
- ~28 use cases total across all contexts (Create, Get, List, Update, Delete/Deactivate, Search for each core domain + Settings singleton)
- **No authentication** — single-user app with no login, no sessions, no middleware
- MySQL with soft deletes, FULLTEXT indexes, no FK constraints (enforced at app layer)

**Frontend (React 19 + TypeScript + Vite + Tailwind)**
- **Data flow**: `Pages → custom Hooks → Service functions → http() (fetch) → /api/v1/* → Backend`
- `src/services/{client,pet,service,appointments,settings}.ts` — typed fetch wrappers around `http()` helper
- `src/hooks/use{Clients,Client,Pets,Pet,Services}*.ts` — stateful hooks managing loading/error/data + mutations
- `src/pages/*.tsx` — page components consuming hooks and rendering atomic design components
- Vite proxy forwards `/api` to `http://localhost:3000`
- **Zero localStorage usage anywhere** — no offline storage, no caching, no feature flags

### Affected Areas

| Area | Impact |
|------|--------|
| `src/services/*.ts` (5 files) | **HIGH** — Must check mode and delegate to either API or localStorage |
| `src/services/http.ts` | **LOW** — Unchanged; only called in API mode |
| `src/hooks/*.ts` (15 files) | **NONE** — They call service functions, which remain the same contracts |
| `src/pages/*.tsx` | **NONE** — They consume hooks, which are unchanged |
| `src/types/*.ts` | **NONE** — Types remain identical |
| `src/main.tsx` | **LOW** — May need to detect mode and register storage provider |
| `vite.config.ts` | **LOW** — Proxy becomes optional in demo mode (no backend running) |
| `src/App.tsx` | **MEDIUM** — May need a landing page / mode selector |
| `api/index.ts` | **NONE** — Backend is not called in demo mode |
| `docker-compose.yml` | **NONE** |
| Tests (frontend) | **HIGH** — Need tests for localStorage adapters; existing tests mock `http()` |

### Domain Data Sizes (localStorage Feasibility)

| Entity | Estimated bytes/record | At 1000 records |
|--------|----------------------|-----------------|
| Client | ~250 bytes | ~250 KB |
| Pet | ~250 bytes | ~250 KB |
| Service | ~200 bytes | ~200 KB |
| Appointment | ~150 bytes | ~150 KB |
| Settings (singleton) | ~200 bytes | <1 KB |
| **Total** | | **~850 KB** |

localStorage limit is 5-10 MB per origin. At 1000 records per entity, usage is ~850 KB. **Well within limits even at 10x scale.**

### Approaches

#### 1. Storage Provider Pattern (Recommended)

Create a storage abstraction with two implementations: `ApiStorage` (calls `http()`) and `LocalStorage` (CRUD on localStorage). A React context + detection mechanism determines which to activate.

**New files:**
```
src/storage/
  IStorage.ts            # Interface: all CRUD operations matching service signatures
  ApiStorage.ts          # Delegates to current src/services/* http() calls
  LocalStorage.ts        # Full localStorage CRUD, search, pagination, ID generation
  useStorageMode.ts      # Hook: detects mode, returns storage instance
  storageContext.tsx      # React provider: StorageModeProvider
```

**Modified files:**
- `src/services/*.ts` — each function becomes `storage.listClients(...)` instead of `http(...)`
- `src/main.tsx` — wraps app in `StorageModeProvider`
- `src/App.tsx` — optionally adds a landing page to select demo vs paid

**localStorage structure:**
```
pf_demo:clients       → JSON array of Client[]
pf_demo:pets          → JSON array of Pet[]
pf_demo:services      → JSON array of Service[]
pf_demo:appointments  → JSON array of Appointment[]
pf_demo:settings      → JSON object of CompanySettings
pf_demo:nextIds       → { clients: N, pets: N, services: N, appointments: N }
```

**Search (demo mode)**: Simple case-insensitive substring `includes()` on relevant fields. No FTS needed for demo — works for the scale.

**Pagination (demo mode)**: Array slice + `Math.ceil`.

**Soft delete (demo mode)**: Set `deletedAt` to `new Date().toISOString()`. Items filtered out of list/get operations.

**Edge cases handled**:
- First visit (empty localStorage) — returns empty arrays, auto-generates starting IDs
- `localStorage` unavailable (private browsing on some browsers) — detect and show fallback message
- Data corruption — JSON.parse wrapped in try/catch with fallback to empty arrays
- Concurrent tabs — not a concern (single-user demo)

**Pros:**
- Minimal changes to existing code (hooks, types, pages, components all unchanged)
- Type-safe — `IStorage` interface enforces matching contracts
- Future paid version: one-line switch from `LocalStorage` to `ApiStorage`
- Easy to add more backends later (IndexedDB, SQLite via WASM)
- Testable — each storage impl tested independently

**Cons:**
- Need to reimplement CRUD, search, pagination in localStorage (but it's straightforward)
- Storage interface is ~30 methods (5 domains × ~6 operations each)
- Extra abstraction layer (~6 new files)

**Effort:** Medium

---

#### 2. Direct localStorage Branching in Services

In each `src/services/*.ts` file, add `if (isDemoMode())` branches. No abstraction layer.

**Example:**
```typescript
export function listClients(page, limit): Promise<PaginatedResponse<Client>> {
  if (isDemoMode()) {
    return localStorageListClients(page, limit);
  }
  return http<PaginatedResponse<Client>>(`/clients?page=${page}&limit=${limit}`);
}
```

**Pros:**
- Simpler to start — no interface to define, fewer files
- Easier to understand at a glance

**Cons:**
- **Violates DRY** — branching logic repeated in every function
- Harder to test cleanly — localStorage logic mixed with API logic in same file
- Future paid mode requires touching every service file again
- No compile-time guarantee that both implementations cover the same contract
- Harder to swap storage strategy later

**Effort:** Medium-Low (but higher maintenance cost)

---

#### 3. Backend In-Memory Mode (Rejected)

Run the Express server with in-memory repositories instead of Prisma, served from the same `localhost:3000`. Frontend unchanged.

**Why rejected:** The requirement states _"toda la información se guardará en el local storage de su navegador"_ — data must persist in the browser, not server memory. This approach also requires the backend to run, contradicting the "no backend needed" demo vision.

---

### Recommendation

**Approach 1 — Storage Provider Pattern.**

The extra abstraction cost (~6 files, ~30 method interface) pays for itself immediately:
1. Existing hooks and components are **completely untouched** — zero risk of regressions
2. TypeScript strict mode gives us confidence that both storage implementations satisfy the same contract
3. Future paid version transition is a one-line switch in the provider — not a sweeping code change
4. Testability is clean: mock the storage interface in hook tests, test each storage impl independently
5. Aligns with Clean Architecture philosophy (depend on abstractions, not concretions)

### Risks

- **localStorage quota**: Edge case — user creates thousands of records. Mitigation: show a warning banner when approaching ~4MB. Not a priority for v1.
- **Search quality**: localStorage substring search is less sophisticated than MySQL FTS. Acceptable for demo — users will understand it's a demo limitation.
- **Browser compatibility**: `localStorage` is unavailable in some private browsing modes (Safari). Mitigation: catch `SecurityError` on access and show an explanatory message.
- **Data loss**: localStorage is browser-specific and can be cleared. Expected for a demo — the paid version is the "safe" one.
- **TDD requirement**: `strict_tdd_mode: true` in config. Every new file must have a test written first.

### Ready for Proposal

Yes. The architecture is well-understood, the approach is clear, and the affected surface area is well-defined. Proceed to `sdd-propose` to formalize the scope and intent.
