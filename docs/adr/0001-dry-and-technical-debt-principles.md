# ADR-0001: DRY and Technical Debt Principles

**Status**: accepted

**Date**: 2026-07-12

## Context

The pfmaster codebase has grown across 4 SDD cycles (client listing, notes column, listing page actions). Multiple developers and AI agents touch the same files. Without explicit guardrails, we risk:

- Duplicated logic across bounded contexts (e.g., the same validation pattern implemented differently in clients vs. pets)
- Dead parallel implementations (e.g., `ClientListPage.tsx` and `ClientsPage.tsx` coexisting)
- Divergent patterns for the same concept (e.g., `Pet.notes` pattern not followed when adding `Client.notes`)
- Pre-existing lint/build errors silently accumulating
- Speculative abstractions built "just in case"

The AGENTS.md already covers Clean Architecture and code smells, but lacks explicit DRY and technical debt management principles that agents must follow.

## Decision

Add a **DRY & Technical Debt (MANDATORY)** section to `AGENTS.md` under **Code Conventions**, establishing:

1. **DRY as a first-class architectural principle**:
   - Extract, don't duplicate — same logic in two places is a maintenance bomb
   - Single source of truth — every business rule, constant, and type lives exactly once
   - Follow existing patterns exactly — divergence IS technical debt
   - Reuse existing infrastructure before creating new abstractions

2. **Technical debt management**:
   - Shortcuts documented with `// TODO(#issue): …` linked to a GitHub issue
   - Boy Scout Rule: leave every file touched cleaner than found
   - Track pre-existing issues; never silently accept lint/build warnings
   - Avoid speculative generality — abstract only with 2+ concrete use cases

## Consequences

**Easier**:
- Agents have explicit permission (and obligation) to clean up debt in-scope
- New fields follow established patterns mechanically (e.g., `Client.notes` → `Pet.notes`)
- Codebase converges toward consistency with each SDD cycle
- Debt is visible and tracked, not hidden

**More difficult**:
- Quick one-off fixes require a TODO and issue link — adds friction to "just get it done" moments
- Requires discipline during reviews to enforce the Boy Scout Rule scoping
- Pre-existing debt must be triaged before new work can proceed cleanly

**Follow-up**:
- Audit existing `// TODO` comments and create GitHub issues for untracked ones
- Review `ClientListPage.tsx` vs `ClientsPage.tsx` — consolidate or deprecate the legacy page
- Add `MAX_NOTES_LENGTH` constant shared between Client and Pet (tracked as follow-up from `add-client-notes-column`)
