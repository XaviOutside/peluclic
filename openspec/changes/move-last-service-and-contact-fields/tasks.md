# Tasks: Move Last Service Date into Client Info Row

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~15 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |
| Decision needed before apply | Yes |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Move lastServiceDate into Cliente column; drop column 4; adjust spans | Single PR | TDD: test expectations updated first (RED), then code change (GREEN) |

## Phase 1: TDD — RED (Update test expectations)

- [ ] 1.1 `src/pages/ClientsPage.test.tsx:58` — Change "renders four columns with headers" description to "renders **three** columns with headers"
- [ ] 1.2 `src/pages/ClientsPage.test.tsx:65` — Remove `expect(screen.getAllByText('Último servicio').length).toBeGreaterThan(0)` line (column 4 header no longer exists)
- [ ] 1.3 `src/pages/ClientsPage.test.tsx:79–83` — Reframe "renders last service date in DD/MM/YYYY format" test: date now lives in Cliente column, not standalone. Verify `screen.getByText('15/06/2026')` is present in a `text-sm text-on-surface-variant` element within the same Cliente column block (adjacent to `#42`)

## Phase 2: TDD — GREEN (Apply code changes)

- [ ] 2.1 `src/pages/ClientsPage.tsx:48–55` — Add `lastServiceDate` line to Cliente column render: a third `<br />` + `<span className="text-sm text-on-surface-variant">` wrapping `formatServiceDate(c.lastServiceDate)`, at current line 53 (after `#{c.id}` line)
- [ ] 2.2 `src/pages/ClientsPage.tsx:91–95` — Delete column 4 definition (Último servicio: header, render, span, mobileVisible)
- [ ] 2.3 `src/pages/ClientsPage.tsx:55` — Change Cliente span: `sm:col-span-3` → `sm:col-span-4`
- [ ] 2.4 `src/pages/ClientsPage.tsx:83` — Change Contacto span: `sm:col-span-3` → `sm:col-span-5`

## Phase 3: Verification

- [ ] 3.1 Run `npm test -- src/pages/ClientsPage.test.tsx` — all 6 tests pass
- [ ] 3.2 Run full test suite `npm test` — no regressions
- [ ] 3.3 `npm run build` — TypeScript compiles cleanly with no errors
- [ ] 3.4 Visual check (dev server): desktop 3-column grid renders correctly; mobile card shows date in client identity block; Estado still hidden on mobile
