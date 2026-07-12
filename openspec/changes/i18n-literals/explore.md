# Exploration: Internationalize All Hardcoded Literals

## Current State

### The Spanish/English Tangle

The codebase has **no i18n library** and already shows a **chaotic mix of Spanish and English**:

| Area | Language | Examples |
|---|---|---|
| Sidebar/MobileNav | **Spanish** | "Clientes", "Mascotas", "Servicios", "Nueva Cita", "Configuración", "Soporte" |
| Landing Page | Mixed ES/EN | Hero: "Prueba gratis" / "Ver Demo" but features: "Smart Scheduling", "Client Directory" |
| Module Tabs | **Spanish** | "Clientes", "Mascotas", "Servicios" (duplicated in 3 pages) |
| Form Labels | **English** | "Name", "Email", "Phone", "Species", "Breed", "Sex" |
| Form Placeholders | **English** | "Client full name", "client@example.com", "Pet name" |
| Detail Cards | **English** | "Email", "Phone", "Secondary Phone", "Address", "Notes", "Created" |
| List Column Headers | **Spanish** | "Cliente", "Contacto", "Notas", "Mascota", "Especie", "Raza", "Estado" |
| Action Buttons | Mixed | "Ver detalles", "Editar", "Desactivar" (ES) but "View", "Edit", "Deactivate" (EN in tables) |
| Confirm Dialogs | Mixed | "Desactivar cliente" (ES) but "Deactivate Client" (EN) in detail pages |
| Validation Messages | **English** | "Name is required", "Please enter a valid email address" |
| Error Messages | **English** | "Failed to create client. Please try again.", "Action failed" |
| Empty States | **Spanish** | "No hay clientes registrados." / "No hay mascotas registradas." |
| Pagination | **English** | "Showing page X of Y (Z total)", "Previous", "Next" |
| 404 Page | **Spanish** | "Página no encontrada", "Volver al inicio" |
| HTML Document | `lang="es"` | `<html lang="es">` but title "PelGat — Grooming Manager" |

This means an i18n effort is also a **normalization** effort — we need to pick one canonical language per literal and provide translations for the other.

### i18n Infrastructure: None

- **Zero i18n dependencies** in `package.json`
- No custom `LanguageContext`, `useTranslation` hook, or locale files
- No language detection logic
- No locale-aware formatting (dates already use `toLocaleDateString('en-US')` hardcoded)
- The `<html lang="es">` in `index.html` is the only i18n hint — and it's wrong half the time since most UI is English

---

## Affected Files (35+ files)

### Pages (15 files)
| File | Hardcoded Strings |
|---|---|
| `src/pages/LandingPage.tsx` | Hero copy, feature cards, footer, CTA buttons, image alt |
| `src/pages/RegisterPage.tsx` | "Coming Soon", registration message, "Volver al inicio" |
| `src/pages/ClientsPage.tsx` | Module tabs, column headers, action labels, confirm dialog, empty message, feedback messages |
| `src/pages/ClientCreatePage.tsx` | Page title, "Back", general error, button label |
| `src/pages/ClientEditPage.tsx` | Page title, "Back", "Client not found", "Back to clients" |
| `src/pages/ClientDetailPage.tsx` | Error states, "Pets" section, "Services by Pet", "Add Pet", confirm dialogs |
| `src/pages/PetsPage.tsx` | Module tabs, column headers, action labels, confirm dialog, empty message |
| `src/pages/PetCreatePage.tsx` | Page title, "Back", error messages |
| `src/pages/PetEditPage.tsx` | Page title, "Back", "Pet not found", "Back to pets" |
| `src/pages/PetDetailPage.tsx` | Error states, "Linked Services", "No linked services", "Link a Service", modal text |
| `src/pages/ServicesPage.tsx` | Module tabs, column headers, action labels, confirm dialog, empty message |
| `src/pages/ServiceCreatePage.tsx` | Page title, "Back", error messages |
| `src/pages/ServiceEditPage.tsx` | Page title, "Back", "Service not found", "Back to services" |
| `src/pages/ServiceDetailPage.tsx` | Error states, confirm dialog messages |

### Components — Organisms (9 files)
| File | Hardcoded Strings |
|---|---|
| `src/components/organisms/Sidebar.tsx` | Nav labels, brand name, tagline, CTA button, alt text |
| `src/components/organisms/MobileNav.tsx` | Nav labels |
| `src/components/organisms/DataTable.tsx` | "No items found.", "Try Again", "Actions" header |
| `src/components/organisms/PageHeader.tsx` | Default placeholder "Search..." |
| `src/components/organisms/ClientDetailCard.tsx` | Field labels, "Not provided", "Back to list", action buttons |
| `src/components/organisms/PetDetailCard.tsx` | Field labels, "Not provided", "Male"/"Female"/"Unknown", "Back to list" |
| `src/components/organisms/ServiceDetailCard.tsx` | Field labels, "Not provided", "Back to list", action buttons |
| `src/components/organisms/ClientTable.tsx` | Column headers, empty message, dropdown actions, aria-labels |
| `src/components/organisms/PetTable.tsx` | Column headers, empty message, dropdown actions, "Client #" pattern |
| `src/components/organisms/ServiceTable.tsx` | Column headers, empty message, dropdown actions, "N/A" |

### Components — Molecules (8 files)
| File | Hardcoded Strings |
|---|---|
| `src/components/molecules/ClientForm.tsx` | All 6 field labels, all 6 placeholders, submit button text |
| `src/components/molecules/PetForm.tsx` | All 8 field labels, all placeholders, sex options, submit button |
| `src/components/molecules/ServiceForm.tsx` | All 4 field labels, all placeholders, submit button |
| `src/components/molecules/StatusBadge.tsx` | "Active", "Inactive" |
| `src/components/molecules/ConfirmDialog.tsx` | Default "Confirm", "Cancel" |
| `src/components/molecules/Pagination.tsx` | "Showing page X of Y (Z total)", "Previous", "Next", aria-label |
| `src/components/molecules/SearchInput.tsx` | Default placeholder "Search..." |
| `src/components/molecules/SearchBar.tsx` | Default placeholder, "Search" button |
| `src/components/molecules/ModuleTabs.tsx` | "Module tabs" aria-label |

### Other Frontend Files (5 files)
| File | Hardcoded Strings |
|---|---|
| `src/App.tsx` | 404 page: "Página no encontrada", "Volver al inicio" |
| `src/utils/validation.ts` | 18 validation error messages |
| `src/utils/format.ts` | `toLocaleDateString('en-US', ...)`, em dash placeholder |
| `src/main.tsx` | (minimal — just renders) |
| `index.html` | `<title>`, `lang="es"` |

---

## Literal Inventory

### Estimated Count: **~130–150 distinct literals** across 15 categories

### Category Breakdown

| Category | Count | Examples |
|---|---|---|
| Navigation (sidebar, tabs, mobile) | 18 | "Dashboard", "Calendario", "Clientes", "Mascotas", "Servicios" |
| Landing Page (hero, features, footer) | 20 | "Manage your grooming salon with ease.", "Smart Scheduling", "Privacy Policy" |
| Page Titles (create/edit/detail) | 12 | "Create Client", "Edit Pet", "Client not found" |
| List Column Headers | 15 | "Cliente", "Contacto", "Especie", "Raza", "Duración", "Precio" |
| Detail Card Field Labels | 22 | "Email", "Phone", "Species / Breed", "Date of Birth", "Notes" |
| Form Labels & Placeholders | 35 | "Name", "Client full name", "e.g. Dog, Cat, Bird", "Weight (kg)" |
| Action Buttons & Links | 25 | "Ver detalles", "Editar", "Desactivar", "Delete", "Link a Service" |
| Status Labels | 6 | "Active", "Inactive", formatSex ("Male"/"Female"/"Unknown") |
| Confirm Dialogs | 12 | "Desactivar cliente", "¿Estás seguro...?" |
| Feedback/Toast Messages | 15 | "{name} desactivado.", "Failed to create client." |
| Validation Errors | 18 | "Name is required", "Please enter a valid email address" |
| Empty States | 8 | "No hay clientes registrados.", "No linked services" |
| Pagination | 5 | "Showing page X of Y", "Previous", "Next" |
| Search & Placeholders | 8 | "Buscar clientes...", "Search...", "Search" |
| 404 & Registration | 10 | "Página no encontrada", "Volver al inicio", "Coming Soon" |
| Generic/Misc (in code) | 10 | "Not provided", "—", "N/A", "Client #", "Actions", aria-labels |

### Repeated Literals (Duplicate Across Files)

| Literal | Occurrences |
|---|---|
| "Clientes" / "Mascotas" / "Servicios" (module tabs) | **3x** (ClientsPage, PetsPage, ServicesPage — exact same array) |
| "Volver al inicio" | **2x** (App.tsx, RegisterPage) |
| "Deactivate" / "Reactivate" / "Edit" / "Delete" | **3-5x** (ClientTable, PetTable, ServiceTable + all detail cards) |
| "Not provided" | **3x** (all three detail cards) |
| "Back to list" | **3x** (all three detail cards) |
| "&larr; Back" | **6x** (all create/edit pages) |
| "Search..." (default placeholder) | **2x** (PageHeader, SearchInput) |
| "Actions" (table header) | **1x** (DataTable) + **3x** (table aria-labels) |
| "Name" / "Notes" (form labels) | **2x** each (ClientForm + PetForm, ClientForm + PetForm) |
| MODULE_TABS constant | **3x** identical array with no shared import |
| "Error al desactivar." / "Error al eliminar." | **3x** (ClientsPage, PetsPage, ServicesPage) |

---

## Current i18n State

| Aspect | Status |
|---|---|
| i18n library | ❌ None |
| Locale detection | ❌ None — `<html lang="es">` hardcoded |
| Locale files | ❌ None |
| Date formatting | ⚠️ `toLocaleDateString('en-US', ...)` hardcoded — broken for Spanish users |
| Number formatting | ⚠️ `$X.XX` with `toFixed(2)` — needs locale-aware currency formatting |
| Current UI language | Mixed Spanish/English (inconsistent) |

---

## Recommended Approach

### Library: `react-i18next`

`react-i18next` is the de facto standard for React i18n:
- Mature (v15+), well-maintained, excellent TypeScript support
- `useTranslation()` hook with namespace support
- Plurals, interpolation (`{{name}}`), nested keys
- React 19 compatible
- Lightweight (~5KB gzipped)
- VSCode extension for key extraction/validation
- Built-in `Trans` component for HTML-rich translations

**Alternatives considered and rejected:**
- `react-intl` (FormatJS) — more powerful ICU MessageFormat, but heavier and overkill for a CRUD app
- Custom `LanguageContext` + JSON — would work but wastes time reinventing interpolation, namespace support, and dev tooling

### File Structure

```
src/
├── locales/
│   ├── en/
│   │   ├── common.json      # Shared: navigation, actions, status, pagination, errors
│   │   ├── landing.json     # Landing page hero, features, footer
│   │   ├── clients.json     # Client pages, forms, columns, confirm dialogs
│   │   ├── pets.json        # Pet pages, forms, columns, confirm dialogs
│   │   ├── services.json    # Service pages, forms, columns, confirm dialogs
│   │   └── validation.json  # All validation error messages
│   └── es/
│       ├── common.json
│       ├── landing.json
│       ├── clients.json
│       ├── pets.json
│       ├── services.json
│       └── validation.json
└── i18n.ts                   # i18next configuration + init
```

**Why namespaced by domain?**
- Keeps files under ~30 keys each (manageable)
- Each domain module loads only what it needs
- Avoids mega-JSON with 150+ flat keys

### Key Naming Convention

Dot-notation: `namespace.section.key`

```
common.nav.clients: "Clients"
clients.list.header.name: "Client"
clients.form.label.name: "Name"
clients.form.placeholder.name: "Client full name"
clients.confirm.deactivate.title: "Deactivate Client"
validation.required: "{{field}} is required"
```

This is structured, grep-friendly, and the VSCode i18n-ally plugin autocompletes it.

### Interpolation Strategy

Template strings with dynamic values use i18next interpolation:

```json
// Before
`${confirmTarget.name} desactivado.`

// After
"clients.feedback.deactivated": "{{name}} desactivado."
```

Used via: `t('clients.feedback.deactivated', { name: confirmTarget.name })`

### Language Detection

- Default: `navigator.language` (browser preference)
- Fallback: `en`
- No user preference persistence in v1 (out of scope — no auth system)
- Can add a language switcher toggle later

### What to Normalize

The source-of-truth language for keys should be **English** (the locale key names), but the **default display language** should match the browser detection. Since the existing HTML says `lang="es"`, the default / fallback should remain Spanish for users who don't have an explicit browser preference — but the actual default should honor the browser.

For the normalization pass:
1. Each literal gets ONE canonical key
2. Both Spanish and English translations are provided in their respective files
3. The current mixed-language UI is resolved by having complete translations in both languages

---

## Backend i18n Scope

### Should It Be Included?

**Not in v1.** Here's why:

1. **Backend error messages are developer-facing** — they go to logs (`logger.warn/error`), not to end users. The user-facing errors the frontend displays come from the API response body's `error` field, which is already a controlled set of ~15 strings.

2. **The current pattern is already good**: controllers have a `handleError` function that maps domain errors to HTTP status codes, and the generic fallback is "Internal server error" (a controlled, non-leaky message).

3. **For proper backend i18n** you'd want error codes (like `CLIENT_NOT_FOUND`, `INVALID_ID`) instead of human-readable strings in the API response, and the frontend would translate those codes. That's a separate architectural change — clean, but out of scope for "extract all literals into es.json and en.json."

4. **Spanish backend messages would be wrong** for English users hitting the API directly.

**Recommendation**: For this change, **frontend-only i18n**. The 3 backend error strings that surface to users are already generic enough:
- `"Internal server error"` — always display via frontend translation
- `"Invalid id — must be a positive integer"` — 422 validation, frontend can catch generic
- `"Too many requests, please try again later"` — rate limit, frontend can translate

A future iteration could add error codes to the API response (`{ error: "Internal server error", code: "INTERNAL_ERROR" }`) and have the frontend map codes to translated messages.

---

## Risks

1. **BREAKING CHANGE**: Every `.tsx` file changes — requires branch strategy and careful review to avoid merge conflicts with ongoing work.

2. **Test breakage**: ~35 test files reference hardcoded text (`getByText('Create Client')`, `getByRole` with English labels). All tests need updating to use translation keys or mock `useTranslation()`. This is the largest effort.

3. **Form label coupling**: The `Input` atom receives `label` as a prop string. After i18n, those strings come from translation keys. The `Input` component itself needs no changes — only the callers change. But the `Select` atom's `options` prop arrays (sex, client list) contain labels that need i18n too.

4. **`formatSex`, `formatDuration` in detail cards** — these return hardcoded strings like "Male", "Female", "minutes". After i18n, they either need to receive a `t` function or become hooks (which changes the signature).

5. **Date formatting** — `formatDate` uses `toLocaleDateString('en-US')` hardcoded. After i18n, this should use the current locale. `formatServiceDate` returns DD/MM/YYYY always — that format may not work for US users.

6. **Material Symbols icon names** — `icon: 'group'`, `icon: 'pets'` are Google Fonts API identifiers, **not** translatable — they must not be extracted.

7. **Interpolation in confirm dialogs** — strings like `"¿Estás seguro de que deseas desactivar a ${confirmTarget.name}?"` need the interpolation variable name to match in both languages. Review every template literal.

8. **MODULE_TABS duplication** — currently defined 3x identically. Should be extracted to a shared constant or a `useModuleTabs()` hook that handles the i18n.

---

## Recommendation

1. **Install `react-i18next` + `i18next`** as the i18n framework
2. **Create 6 namespaced JSON files** per language (12 files total) following the structure above
3. **Extract and normalize** all ~130-150 literals, providing both `es` and `en` translations
4. **Replace all hardcoded strings** with `t('key')` calls across 35+ files
5. **Fix `formatDate`** to use the current locale instead of hardcoded `'en-US'`
6. **Extract MODULE_TABS** to a shared constant/hook
7. **Update all tests** to mock `useTranslation()` or use translation-aware queries
8. **Exclude backend** from this change — scope is frontend only
9. **Set up language detection** in `i18next.init()` with `navigator.language` and Spanish fallback

### Estimated Files Changed: **40-45 files**
- 15 pages
- 10 organisms
- 8 molecules
- 1 validation.ts
- 1 format.ts
- 1 App.tsx
- 1 index.html
- 12 new locale JSON files
- 1 new `i18n.ts` config
- ~35 test files updated
