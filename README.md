# Peluclic — Plataforma gestión peluquerías caninas

Plataforma de gestión integral para peluquerías caninas. Gestiona clientes, mascotas, servicios de peluquería y citas con un calendario semanal, búsqueda full-text y multi-idioma (EN/ES).

---

## 🐾 Funcionalidades

### Clientes
- Alta, edición, baja y reactivación de clientes con datos de contacto (nombre, email, teléfono principal y secundario, dirección).
- Búsqueda **Full-Text Search** con ngram (3 caracteres mínimos), debounce 300ms, filtro post-acento (insensible a tildes) y exclusión de stopwords en español e inglés.
- Listado paginado con indicador de estado (activo/inactivo) y fecha del último servicio.

### Mascotas
- CRUD completo de mascotas vinculadas a un cliente (nombre, especie, raza, sexo, fecha de nacimiento, peso, notas médicas).
- Búsqueda FTS por nombre, raza y notas.
- Vista embebida de mascotas dentro de la ficha del cliente.

### Servicios de Grooming
- Catálogo de servicios (nombre, descripción, duración en minutos, precio en dólares).
- Activación/desactivación de servicios sin borrar histórico.
- Búsqueda FTS por nombre y descripción.
- Opción de vincular servicios a tipos de mascota.

### Calendario de Citas
- **Vista semanal** (lunes a domingo) con grid CSS personalizado — sin dependencias externas de calendario.
- **Navegación semanal** ← anterior / siguiente → desde la semana actual.
- **Modal de nueva cita** superpuesto al calendario: búsqueda FTS de cliente → selector de mascota → fecha/hora → notas libres.
- **Doble reserva bloqueada**: misma mascota + misma fecha/hora → 409 Conflict.
- Horario laboral configurable desde Company Settings (fallback L-V 8:00-18:00).
- Barra lateral con botón «New Appointment» y enlace directo a `/calendar`.

### Configuración de la Empresa
- Nombre, tagline, logo (PNG ≤1MB, preview + upload + remove).
- Días laborables (lunes a domingo) y horario (inicio/fin en intervalos de 30 min).
- Idioma de la interfaz (inglés/español) persistido.
- Sidebar dinámico con logo, nombre y tagline cargados desde la API.

### Multi-idioma (i18n)
- Soporte completo EN/ES con **react-i18next** y 7 namespaces: `common`, `landing`, `clients`, `pets`, `services`, `validation`, `appointments`.
- Detección automática de idioma del navegador + persistencia en backend.
- 40+ claves de traducción por namespace.

---

## 🗺️ Roadmap (Features Previstas)

| Feature | Descripción |
|---|---|
| **Login / Autenticación** | Sistema multi-usuario con roles (admin, groomer, recepción) y JWT. |
| **Facturación** | Generación de facturas por cita completada con cálculos de impuestos y PDF. |
| **Control Horario** | Registro de entrada/salida del personal con reporting de horas trabajadas. |
| **Comandos por Voz** | Creación de citas y búsqueda de clientes mediante reconocimiento de voz en el navegador (Web Speech API). |
| **Integración WhatsApp** | Atención automática del calendario vía WhatsApp Business API: recordatorios, confirmaciones y booking por chat. |
| **Notificaciones** | Email y push para recordatorios de cita 24h antes. |
| **Dashboard Analytics** | KPIs: ingresos semanales, tasa de ocupación, servicios más demandados, retención de clientes. |
| **App Móvil Nativa** | React Native con el mismo design system y API. |

---

## 🏗️ Arquitectura

### Clean Architecture (Backend)

El backend sigue **Clean Architecture** con dependencias que apuntan hacia adentro — las capas externas conocen a las internas, nunca al revés:

```
┌──────────────────────────────────────┐
│  Infrastructure (DB, HTTP, drivers)  │  ← Prisma, Express, repositorios concretos
│  ┌────────────────────────────────┐  │
│  │  Interface (controllers, DTOs) │  │  ← Rutas, controladores, serialización
│  │  ┌──────────────────────────┐  │  │
│  │  │  Application (use cases) │  │  │  ← Casos de uso, orquestación, sin deps de framework
│  │  │  ┌────────────────────┐  │  │  │
│  │  │  │  Domain (entities) │  │  │  │  ← Entidades, value objects, interfaces de repositorio
│  │  │  └────────────────────┘  │  │  │
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

Cada bounded context (`clients`, `pets`, `services`, `appointments`, `settings`) es autónomo con sus 4 capas. Las dependencias se inyectan en `api/index.ts` siguiendo el mismo patrón para todos los contextos.

### Atomic Design (Frontend)

El frontend sigue **Atomic Design**: `atoms → molecules → organisms → pages`. Los componentes se organizan por responsabilidad creciente:

| Nivel | Ejemplos |
|---|---|
| **Atoms** | `StatusBadge`, `SearchInput`, botones, inputs |
| **Molecules** | `ClientSearch`, `DateTimePicker`, `AppointmentCard`, `Pagination` |
| **Organisms** | `CalendarWeek`, `AppointmentModal`, `Sidebar`, `ClientTable` |
| **Pages** | `AppointmentsPage`, `ClientsPage`, `SettingsPage` |

### DDD — Bounded Contexts

```
api/
├── clients/       → Gestión de clientes (CRUD + FTS + reactivación)
├── pets/          → Gestión de mascotas (CRUD + FTS + búsqueda por cliente)
├── services/      → Catálogo de servicios (CRUD + FTS)
├── appointments/  → Citas (CRUD + doble-booking + listado semanal)
├── settings/      → Configuración de empresa (singleton + logo upload)
├── shared/        → Entidades base, utilidades, sanitización FTS, errores
└── observability/ → Logging (Pino), métricas, tracing
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | React 19 + TypeScript (strict) | Tipado estricto, cero `any`, `interface` para shapes y `type` para unions |
| **Build** | Vite 6 | HMR instantáneo, tree-shaking, path aliases (`@/`) |
| **Estilos** | Tailwind CSS v4 | `@theme` con CSS custom properties (sin `tailwind.config.js` v3), design tokens desde `DESIGN.md` |
| **Testing** | Vitest + Testing Library | Unitarios y de componente; 423+ tests |
| **E2E** | Playwright | Flujos críticos con `data-testid` como selectores estables |
| **Backend** | Node.js + Express 4 + tsx | REST con TypeScript en runtime; controladores inyectados por constructor |
| **ORM** | Prisma 5 | Migraciones, cliente tipado, queries parametrizadas; **nunca SQL raw en rutas** |
| **Base de Datos** | MySQL 8 (Docker) | `FULLTEXT` indexes con ngram parser (`ngram_token_size=3`), collation `utf8mb4_0900_ai_ci` |
| **Búsqueda** | MySQL FTS (ngram) | `MATCH ... AGAINST` en modo NATURAL LANGUAGE, post-filtro acentual (stripAccents) + stopwords (~50 palabras ES/EN) |
| **Logging** | Pino 9 | Structured JSON logging con niveles warn/error/debug |
| **DevOps** | Docker Compose | 3 servicios: `app` (Vite dev server), `api` (Express + tsx), `db` (MySQL 8) |

---

## 🚀 Instalación

### Requisitos

- **Node.js** ≥ 20
- **Docker** y **Docker Compose**
- **MySQL 8** (gestionado por Docker)

### Desarrollo Local

```bash
# 1. Clonar
git clone https://github.com/XaviOutside/pfmaster.git
cd pfmaster

# 2. Variables de entorno
cp .env.example .env
# Editar .env con credenciales de BD y configuración

# 3. Levantar servicios
docker compose up -d

# 4. Instalar dependencias
npm install

# 5. Ejecutar migraciones
docker compose exec api npx prisma migrate dev

# 6. Seed de datos
docker compose exec api npx tsx prisma/seed.ts

# 7. Abrir en navegador
open http://localhost:5173
```

### Despliegue en VPS

```bash
# 1. VPS con Ubuntu 22.04, Docker + Docker Compose instalados
# 2. Clonar el repo y configurar .env para producción
# 3. Construir y arrancar
docker compose -f docker-compose.prod.yml up -d --build

# 4. Configurar Nginx como reverse proxy
#    - Frontend en puerto 5173 (o build estático servido por Nginx)
#    - API en puerto 3001
#    - HTTPS con Let's Encrypt (certbot)

# 5. Health check
curl https://tudominio.com/api/v1/health
```

### Comandos Útiles

```bash
docker compose ps                  # Estado de servicios
docker compose logs -f api         # Logs del backend
docker compose exec api npx prisma studio  # Interfaz visual de BD
npm run lint                       # ESLint + TypeScript check
npm run build                      # Build de producción
npm test                           # Tests unitarios y de componente
npm run e2e                        # Playwright E2E tests
```

---

## 🔐 Seguridad y Calidad

### SDLC Gates (3 niveles)

| Gate | Cuándo | Qué verifica | Bloqueante |
|---|---|---|---|
| **Pre-commit** | Antes de `git commit` | `npm run lint` (0 errores), `npm run build` (0 errores), `npm test` (todos pasan) | Cualquier fallo |
| **Pre-push / PR** | Antes de push o crear PR | Ídem + 0 warnings | Cualquier fallo |
| **Pre-merge** | Antes de mergear a `main` | `snyk test` (0 críticas/altas), `snyk code test` (0 findings), `npm audit` | Cualquier finding |

### Herramientas de Seguridad

| Herramienta | Función |
|---|---|
| **SonarQube** | Análisis estático: code smells, complejidad cognitiva, duplicación, hotspots de seguridad. Quality Gate debe pasar antes de merge. |
| **Snyk** | Escaneo de dependencias (CVEs en npm) + SAST (vulnerabilidades en código). Críticas/altas bloquean merge; excepciones documentadas en `.snyk`. |
| **OWASP Top 10** | Revisión manual por feature — sin excepciones. |

### Middleware de Seguridad (activo en `api/index.ts`)

- `helmet()` — CSP, X-Frame-Options, X-Content-Type-Options, HSTS
- `cors()` — whitelist de orígenes configurable (`CORS_ORIGIN`)
- `express-rate-limit` — 100 peticiones / 15 min por IP (10,000 en desarrollo)
- `app.disable('x-powered-by')` — oculta versión de Express
- Manejador global de errores — nunca expone stack traces

### Decisiones de Seguridad

- **Sin foreign keys**: integridad referencial en capa de aplicación. Columnas referenciales son `INT` con comentario documentando la relación. Diseño desnormalizado intencional.
- **Enums como TINYINT**: todos los campos de estado/sexo/categoría son `TINYINT` con mapping documentado a TypeScript union types. Nunca strings planos.
- **Precios en centavos**: enteros para evitar errores de punto flotante. Los DTOs convierten a dólares para la UI.
- **Timestamps en UTC**: la BD almacena UTC; el frontend convierte a zona horaria local.
- **Sanitización FTS**: `sanitizeFtsQuery()` elimina los 6 operadores (`+`, `-`, `*`, `"`, `(`, `)`) antes de `AGAINST()` para prevenir inyección FTS.
- **Queries parametrizadas**: todo acceso a BD usa Prisma (`$queryRaw` con tagged templates). Cero interpolación de strings con input de usuario.

### Code Smells (10 categorías — revisión obligatoria por feature)

Long Method, Large Class/Component, Duplicate Code, Dead Code, Magic Numbers/Strings, Deep Nesting, Primitive Obsession, Feature Envy, Inappropriate Intimacy, God Object.

### Principios DRY & Deuda Técnica (ADR-0001)

- **DRY como principio de arquitectura**: single source of truth para reglas de negocio, constantes, tipos y validaciones.
- **Boy Scout Rule**: dejar cada archivo más limpio de lo que estaba.
- **Atajos documentados**: `// TODO(#issue): …` vinculado a un issue de GitHub.
- **Abstracción con 2+ casos de uso**: no crear abstracciones «por si acaso» (speculative generality).

---

## 🌿 Gitflow

Flujo **trunk-based development** con ramas de feature de vida corta:

```
main
  └── feat/nombre-feature → PR → merge a main → eliminar rama
```

### Convenciones de Commit

**Conventional Commits**: `feat(scope): mensaje`, `fix(scope): mensaje`, `test(scope): mensaje`.

### Flujo de PR

1. Crear rama desde `main`: `feat/nombre-feature`
2. Implementar con TDD (Red → Green → Refactor)
3. Cada work unit es un commit atómico con tests
4. PR con descripción clara: qué, por qué, cómo probar
5. Pasan los 3 gates (lint, build, tests) → review → merge
6. Eliminar rama local y remota

Para cambios grandes (>400 líneas), se usan **stacked PRs** (4 PRs apilados mergeándose secuencialmente a `main`).

---

## 🤖 Framework de Desarrollo (AI-Assisted)

El desarrollo de pfmaster utiliza un stack de herramientas de productividad asistida por IA que funcionan como un framework integrado:

### OpenCode

**Cliente IDE** con agentes especializados y skills. Gestiona la orquestación de tareas, delegación a sub-agentes, y el ciclo completo de SDD (Spec-Driven Development).

### Gentle AI

**Orquestador SDD** que coordina el ciclo de vida de cambios: proposal → specs → design → tasks → apply → verify → archive. Ejecuta revisiones adversariales (4R: risk, resilience, readability, reliability) y gestiona presupuestos de revisión por PR (400 líneas). Controla políticas de PR (stacked-to-main, feature-branch-chain) y gates de seguridad pre-commit/pre-push/pre-merge.

### OpenSpec

**Sistema de especificaciones** basado en archivos que documenta cada capacidad del producto como delta specs. Cada cambio SDD produce specs que se sincronizan al source of truth (`openspec/specs/`):

```
openspec/
├── specs/           ← Source of truth (9 capability specs)
│   ├── client-management-frontend/
│   ├── pet-management-backend/
│   ├── pet-management-frontend/
│   ├── services-api-backend/
│   ├── services-api-frontend/
│   ├── link-pet-services-frontend/
│   ├── appointment-backend/
│   ├── appointment-calendar-frontend/
│   └── i18n-infrastructure/
├── changes/         ← Cambios activos
└── changes/archive/ ← Histórico de cambios completados
```

### ngram FTS (MySQL Full-Text Search)

Búsqueda **ngram** con token_size=3 que permite encontrar coincidencias parciales desde 3 caracteres. Se combina con:
- `FULLTEXT` indexes en `Client(name, email)`, `Pet(name, breed, notes)`, `Service(name, description)`
- Post-filtro acentual (`stripAccents`) para búsqueda insensible a tildes (ej: «garcía» encuentra «García»)
- Filtro de stopwords (~50 palabras ES/EN) para excluir términos sin valor semántico
- Sanitización de operadores FTS para prevenir inyección

### CodeGraph

**Grafo de conocimiento del código** — indexa cada símbolo, edge y archivo del workspace. Permite consultas estructurales en lenguaje natural (`codegraph_explore`), trazado de call paths (incluyendo dynamic dispatch como callbacks y React re-render), y análisis de blast-radius. Reduce drásticamente el coste de entender arquitectura y flujos.

### Engram

**Memoria persistente** que sobrevive entre sesiones y compactaciones. Almacena decisiones de arquitectura, bugs resueltos, convenciones establecidas y descubrimientos técnicos. Cada fase SDD persiste sus artefactos para que las fases siguientes los recuperen sin re-leer el código.

### MCP Servers

OpenCode se conecta a servidores **MCP (Model Context Protocol)** que amplían sus capacidades con herramientas externas especializadas:

| Servidor | Tipo | Propósito |
|---|---|---|
| **Context7** | Remoto | Documentación actualizada de librerías y frameworks. Resuelve IDs de paquetes (React, Prisma, Express, Tailwind, etc.) y devuelve snippets de código y API references con versión exacta. Evita depender de conocimiento desactualizado del modelo. |
| **Engram** | Local | Motor de memoria persistente con búsqueda FTS5, upserts por topic key, resolución de conflictos semánticos, y sesiones multi-proyecto. Expone herramientas `mem_save`, `mem_search`, `mem_context`, `mem_get_observation`, `mem_judge` y `mem_session_summary`. |
| **Stitch** | Remoto | Generación de design tokens Material 3 a partir de prompts de diseño. Produce paletas tonales completas (primary, secondary, tertiary, surface, error), tipografía (font families, sizes, weights), espaciado y elevación. El output se materializa en `DESIGN.md`. |

### Agentes y Sub-agentes

El desarrollo se organiza en una jerarquía de **agentes especializados** gestionados por OpenCode. El orquestador (`gentle-orchestrator`) coordina, delega y sintetiza — nunca ejecuta trabajo pesado inline.

#### Orquestador SDD

| Agente | Modelo | Rol |
|---|---|---|
| `gentle-orchestrator` | DeepSeek V4 Pro | Coordinador principal. Gestiona el ciclo SDD, aplica delegation triggers, ejecuta gates de seguridad y resuelve skills. |

Perfiles alternativos (por coste/velocidad): `sdd-orchestrator-cheap` (DeepSeek V4 Flash) y `sdd-orchestrator-go` (MiniMax M3).

#### Fases SDD (Sub-agentes ejecutores)

Cada fase del ciclo SDD se delega a un sub-agente especializado con contexto limpio:

| Sub-agente | Fase SDD | Responsabilidad |
|---|---|---|
| `sdd-init` | Init | Detecta stack, testing capabilities, inicializa persistence |
| `sdd-explore` | Explore | Investiga el codebase, compara enfoques, análisis de impacto |
| `sdd-propose` | Propose | Crea la propuesta de cambio: alcance, enfoque, riesgos |
| `sdd-spec` | Spec | Escribe delta specs con requisitos y escenarios |
| `sdd-design` | Design | Diseño técnico: arquitectura, componentes, decisiones |
| `sdd-tasks` | Tasks | Desglose en tareas implementables, forecast de PRs |
| `sdd-apply` | Apply | Implementa tareas con TDD (Red → Green → Refactor) |
| `sdd-verify` | Verify | Valida implementación contra specs, ejecuta tests |
| `sdd-archive` | Archive | Sincroniza delta specs al source of truth, mueve a archive |

#### Revisión Adversarial (4R + Judgment Day)

Sub-agentes de solo lectura que inspeccionan un diff inmutable y emiten hallazgos con evidencia concreta:

| Sub-agente | Lente | Alcance |
|---|---|---|
| `review-risk` | R1 Risk | Seguridad, permisos, exposición de datos, dependencias |
| `review-readability` | R2 Readability | Naming, complejidad, mantenibilidad, claridad |
| `review-reliability` | R3 Reliability | Tests, edge cases, determinismo, regresiones |
| `review-resilience` | R4 Resilience | Fallbacks, graceful degradation, observabilidad |
| `review-refuter` | Refuter | Evalúa hallazgos BLOCKER/CRITICAL — corrobora, refuta o declara inconcluso |

**Judgment Day** (revisión adversarial dual): dos jueces ciegos independientes (`jd-judge-a`, `jd-judge-b`) auditan en paralelo. Las discrepancias van a un refuter. Solo para cambios de altísimo riesgo.

#### Corrección y Soporte

| Sub-agente | Rol |
|---|---|
| `jd-fix-agent` | Corrección quirúrgica de issues confirmados en Judgment Day. Sin refactors innecesarios. |
| `sdd-onboard` | Walkthrough guiado del ciclo SDD completo sobre el codebase real. |
| `explore` / `general` | Sub-agentes nativos de OpenCode para exploración y tareas generales fuera del ciclo SDD. |

---

## 🎨 Diseño — De Stitch a DESIGN.md

El design system de pfmaster se generó a partir de **Stitch** (herramienta de generación de design tokens) y se materializó en:

### `DESIGN.md`

Documento canónico de diseño con:
- **Paleta tonal Material 3**: primary teal-cyan `#226D7A`, secondary sky blue `#B0E0E9`, tertiary warm brown `#8A5928`, surface `#F9F9FF`
- **Tipografía**: Open Sans (headlines + body) + Inter (labels, navegación, tablas de datos)
- **Espaciado**: grid fluido 1440px, base 8px, gutter 24px
- **Elevación**: sombras tonales + backdrop blur (glassmorphism) en modales
- **Formas**: bordes redondeados (0.5rem botones/inputs, pill-shaped para badges)
- **Personalidad**: "The Trusted Expert" — profesional, organizado, cálido

### Tokens de Tailwind

El archivo `src/index.css` consume los tokens de `DESIGN.md` mediante `@theme` de Tailwind CSS v4:

```css
@import 'tailwindcss';

@theme {
  --color-primary: #226D7A;
  --color-primary-container: #005460;
  --color-secondary: #B0E0E9;
  --color-tertiary: #8A5928;
  --color-surface: #F9F9FF;
  --color-surface-cream: #F9FCFD;
  --color-status-success: #4CAF50;
  --color-status-warning: #FFB300;
  --color-status-error: #E53935;
  --font-headline: 'Open Sans', sans-serif;
  --font-body: 'Open Sans', sans-serif;
  --font-label: 'Inter', sans-serif;
  --radius-default: 0.5rem;
  --spacing-base: 8px;
  --spacing-gutter: 24px;
}
```

### Ejemplo de Componente con Design Tokens

```tsx
// AppointmentCard.tsx — usa tokens del design system
export function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <article
      className={`
        bg-surface rounded-default p-(--spacing-gutter)
        border-l-4 border-primary shadow-md
        hover:shadow-lg transition-shadow cursor-pointer
      `}
    >
      <header className="flex items-center justify-between mb-2">
        <h3 className="font-headline text-lg font-bold text-primary-container">
          {appointment.petName}
        </h3>
        <StatusBadge status={appointment.status} />
      </header>
      <p className="font-label text-sm text-on-surface-variant">
        {appointment.clientName} · {formatTime(appointment.scheduledAt)}
      </p>
      {appointment.notes && (
        <p className="mt-2 font-body text-sm text-on-surface">
          {appointment.notes}
        </p>
      )}
    </article>
  );
}
```

---

## 📂 Estructura del Proyecto

```
pfmaster/
├── src/                          # Frontend (React + Vite + Tailwind v4)
│   ├── components/
│   │   ├── atoms/                # StatusBadge, SearchInput, etc.
│   │   ├── molecules/            # ClientSearch, DateTimePicker, Pagination, etc.
│   │   └── organisms/            # CalendarWeek, AppointmentModal, Sidebar, etc.
│   ├── pages/                    # Route targets: AppointmentsPage, ClientsPage, etc.
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # API client functions (axios)
│   ├── types/                    # Shared TypeScript interfaces
│   ├── utils/                    # Pure utilities (calendar, date formatting)
│   └── locales/{en,es}/          # i18n JSON namespaces
│
├── api/                          # Backend (Clean Architecture + Express)
│   ├── clients/                  # Bounded context: Clients
│   │   ├── domain/               # Entity, repository interface, errors
│   │   ├── application/          # Use cases
│   │   ├── interface/            # Controller, router, DTOs
│   │   └── infrastructure/       # Prisma repository
│   ├── pets/                     # Bounded context: Pets
│   ├── services/                 # Bounded context: Services
│   ├── appointments/             # Bounded context: Appointments
│   ├── settings/                 # Bounded context: Company Settings
│   ├── shared/                   # Base entities, utils, FTS sanitization
│   └── observability/            # Pino logger, metrics, tracing
│
├── prisma/
│   ├── schema.prisma             # Modelos: Client, Pet, Service, Appointment, CompanySettings
│   ├── migrations/               # SQL migrations
│   └── seed.ts                   # Datos de desarrollo
│
├── e2e/                          # Playwright end-to-end tests
├── openspec/                     # SDD specs + cambios (ver arriba)
├── docs/adr/                     # Architecture Decision Records
├── docker/                       # Dockerfiles + my.cnf
├── docker-compose.yml            # Dev environment (app, api, db)
├── DESIGN.md                     # Design system canónico (Stitch → tokens)
├── AGENTS.md                     # Instrucciones para agentes de IA
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 📄 Licencia

MIT © Peluclic
