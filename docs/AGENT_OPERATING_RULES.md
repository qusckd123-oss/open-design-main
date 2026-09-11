# Agent Operating Rules

Every session starts by verifying `pwd` and the repository root, then reading, in order:

1. `docs/AGENT_OPERATING_RULES.md`
2. `docs/CURRENT_STATE.md`
3. `docs/NEXT_PRIORITIES.md`

Inspect relevant source and documents before editing. Do not sync Sales Dashboard or ERP without an explicit user request. Never commit raw Excel, credentials, local browser profiles, or `dist`.

Protected production behavior: STYLE Action Engine, priority, reorderTiming, P1/P2, STYLE Preview, STYLE Forecast, STYLE Stock Risk, and the production SKU schema. Change these only when explicitly requested.

SKU analysis is SKU-first; STYLE is a grouping/container and must not pre-filter SKU scoring. Forecast, Analog Pace, and Current Risk are separate signals. Historical hold-out work is called calibration, never validation. Any numeric change requires regression tests.

Keep this repository separate from other projects under `open-design-main-1` (including trend dashboards). Do not guess business rules into production.

At the end of every meaningful task:

1. Update `docs/CURRENT_STATE.md` with actual results.
2. Update `docs/NEXT_PRIORITIES.md`.
3. Record completed work, unresolved issues, and the next safe task.
4. Return a short handoff: `HANDOFF UPDATED`, current state, next priority, and tests.

Future-session starter:

> Continue the wacky-product-planning-dashboard project from the current repo state. First read `docs/AGENT_OPERATING_RULES.md`, `docs/CURRENT_STATE.md`, and `docs/NEXT_PRIORITIES.md`. Verify the current working directory and repository before doing anything. Inspect relevant source files and execute only the highest-priority safe task. Do not sync external sources or modify protected production logic unless explicitly required.
