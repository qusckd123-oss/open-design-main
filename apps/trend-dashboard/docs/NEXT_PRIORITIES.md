# Next Priorities - Trend Dashboard

Short by design. For rules, see `AGENT_OPERATING_RULES.md`. For live numbers, see `CURRENT_STATE.md`. Pick the highest tier with a real, live task in it - don't manufacture work in a tier just because it's next.

## P0 - Operations

- Observe the first naturally scheduled Monday refresh (next: **2026-09-14 08:30 KST**) - don't intervene preemptively.
- After it runs: verify logs (`apps/trend-dashboard/logs/editorial-refresh/`), verify source health (all 8 sources succeeded / any rate-limited), verify DB/signal deltas look sane (no sudden collapse, no duplicate-count regression).
- React only to real failures - a WARN-level quality gate (e.g. a single zero-result source, or a bundle-count swing under 25%) is not a failure.

## P1 - Quality Maintenance

- Parser/source-health fixes **only when real evidence shows a problem** (a failing source, a reproduced parsing bug, a duplicate that shouldn't exist).
- No speculative taxonomy expansion of any kind.

## P2 - Product-Planning Usability

- User explicitly authorized safe UI-only pre-gate work on 2026-09-10 while P0 remains pending. First fix completed: `/editorial` no longer shows the no-op domestic/overseas scope toggle; gender filtering remains.
- Next safe pre-gate candidate: unify specific-item Korean label rendering across planner-facing screens without changing taxonomy or extraction semantics.
- Larger P2 work (trust explanation, actionability layer, broader IA changes) should still wait until P0 operational stability has been confirmed at least once for real after the scheduled run above.

## P3 - Optional Future Research

- A new publisher family: only when source diversity becomes a *demonstrated* bottleneck again (it currently isn't - see `docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md` Section 20).
- New taxonomy vocabulary: only when the current corpus proves a recoverable trust-tier signal exists to capture (not a speculative "might help" addition).

## Explicitly NOT Current Priority

Do not pursue these unless the user explicitly reopens them in-session:

- More generic source collection.
- BAGS taxonomy, ACCESSORIES taxonomy, COAT taxonomy (tried, reverted - see `docs/EDITORIAL_CATEGORY_COVERAGE_GAP_AUDIT.md`).
- Product Reference (closed/frozen).
- Ranking redesign (current sort order is documented, working, and frozen - see `CURRENT_STATE.md` "Current Ranking Order").
- Scheduler redesign (current Windows Task Scheduler setup is working - verify, don't rebuild).
