# Tasks: Public Layout — No Sidebar

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~310 (140 prod + 170 test) |
| Actual changed lines | ~427 (326 new + 101 modified) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Layout components + route refactor + cleanup + tests | Single PR | Under 400 lines; all interdependent |

## Phase 1: Layout Components — TDD

- [x] 1.1 **RED** — `src/components/templates/DashboardLayout.test.tsx`: render inside `<MemoryRouter>`, assert `<Sidebar>` + `<MobileNav>` present, main has class `md:ml-64`, `<Outlet />` renders child content
- [x] 1.2 **GREEN** — Extract Sidebar + `<main>` + MobileNav from `App.tsx` into `src/components/templates/DashboardLayout.tsx`; use `<Outlet />` for child slot
- [x] 1.3 **RED** — `src/components/templates/PublicLayout.test.tsx`: render inside `<MemoryRouter>`, assert NO `<Sidebar>` + NO `<MobileNav>`, assert `<main>` has NO `md:ml-64`, `<Outlet />` renders child content
- [x] 1.4 **GREEN** — Create `src/components/templates/PublicLayout.tsx`: bare `<main>` wrapper, no offset, `<Outlet />`

## Phase 2: Route Refactor — TDD

- [x] 2.1 **RED** — `src/App.test.tsx`: render `App` at `/` → assert `PublicLayout` renders LandingPage, no `Sidebar`/`MobileNav` in DOM
- [x] 2.2 **RED** — `src/App.test.tsx`: render `App` at `/clients` → assert `DashboardLayout` renders ClientsPage, `Sidebar` + `MobileNav` in DOM
- [x] 2.3 **GREEN** — Refactor `src/App.tsx` routes to layout-route pattern: `<Route element={<PublicLayout />}>` wraps `/`; `<Route element={<DashboardLayout />}>` wraps `/clients`, `/pets`, `/services` and their children; preserve `/register` and `*` catch-all

## Phase 3: LandingPage Cleanup + RegisterPage — TDD

- [x] 3.1 **RED** — `src/pages/LandingPage.test.tsx`: assert NO `<nav className="fixed bottom-0 …">` in rendered output; CTA "Prueba gratis" `<NavLink to="/register">`
- [x] 3.2 **GREEN** — Remove inline mobile nav (lines 123–141) from `src/pages/LandingPage.tsx`; change CTA `to="/clients/new"` → `to="/register"`
- [x] 3.3 **RED** — `src/pages/RegisterPage.test.tsx`: render at `/register`, assert placeholder heading "Register" or "Coming Soon" visible
- [x] 3.4 **GREEN** — Create `src/pages/RegisterPage.tsx` stub with placeholder content and `<NavLink to="/">` back link

## Phase 4: Verification

- [x] 4.1 Run `npm run test:frontend` — confirm 27+ existing tests pass + all new tests green
- [x] 4.2 Verify all 6 success criteria: landing full-width no chrome, dashboard retains chrome, inline nav gone, CTA → `/register`, test count up, TDD cycle respected
