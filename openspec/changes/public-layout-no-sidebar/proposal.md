# Proposal: Public Layout — No Sidebar

## Intent

Landing page renders full app shell (Sidebar, MobileNav, `md:ml-64` offset) — irrelevant chrome for discovery/onboarding. `LandingPage.tsx` also has buggy inline mobile nav (lines 124-141) duplicating `MobileNav` with dead `<a href="#">` links. Solution: layout-route pattern separating public from dashboard pages.

## Scope

**In:**
- `PublicLayout` wrapper — full-width, no Sidebar, no MobileNav
- `DashboardLayout` wrapper — existing Sidebar + MobileNav + offset
- Refactor `App.tsx` to React Router layout routes (`<Outlet />`)
- Remove inline mobile nav from `LandingPage.tsx` (lines 123-141)
- CTA "Prueba gratis" → `/register` (was `/clients/new`)
- `/register` placeholder stub page
- TDD: layout rendering tests, route behavior, CTA link assertion

**Out:**
- Auth / login / register implementation
- Sidebar or MobileNav redesign
- `/calendar`, `/settings`, `/support` implementation

## Capabilities

**New**: None — structural refactor. No new behavioral requirements.

**Modified**: None — no existing spec-level behavior change.

## Approach

React Router layout routes with `<Outlet />`:

```
PublicLayout (no chrome)            DashboardLayout (full shell)
├── / → LandingPage                 ├── /clients → ClientsPage
└── /register → placeholder         ├── /pets → PetsPage
                                    └── /services → ServicesPage
```

1. Extract Sidebar + `<main>` + MobileNav → `templates/DashboardLayout.tsx`
2. Create `templates/PublicLayout.tsx` — bare `<main>`, no offset
3. Rewrite App routes under layout wrappers
4. Delete LandingPage inline nav (lines 123-141)
5. Create `pages/RegisterPage.tsx` stub; update CTA link
6. Tests first: layout renders correctly per route, no duplicate nav, CTA → `/register`

## Affected Areas

| Area | Impact |
|------|--------|
| `src/App.tsx` | Modified — route restructuring |
| `src/pages/LandingPage.tsx` | Modified — remove inline nav; CTA link |
| `src/components/templates/PublicLayout.tsx` | New |
| `src/components/templates/DashboardLayout.tsx` | New |
| `src/pages/RegisterPage.tsx` | New — placeholder |

## Risks

| Risk | Mitigation |
|------|------------|
| CSS breakage on existing pages | DashboardLayout preserves identical DOM |
| Route matching regression | Tests before refactor |
| Dead link to `/register` stub | Placeholder clearly labeled; auth out of scope |

## Rollback Plan

Revert `App.tsx` to flat `<Routes>` with unconditional Sidebar/MobileNav. Delete new layout files.

## Dependencies

None — frontend-only refactor, no API/DB changes.

## Success Criteria

- [ ] Landing full-width at all breakpoints; no sidebar, no mobile nav
- [ ] Dashboard pages retain sidebar (desktop) + MobileNav (mobile)
- [ ] LandingPage lines 123-141 removed
- [ ] CTA "Prueba gratis" → `/register` (stub loads)
- [ ] 27 existing frontend tests pass; new layout tests added
- [ ] TDD: no production code without failing test
