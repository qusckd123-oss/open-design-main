# Agent Operating Rules - Trend Dashboard

Stable rules for any agent (Claude Code, OpenAI Codex, or otherwise) continuing work on this project. This file changes rarely - it is policy, not state. For the current data snapshot, see `CURRENT_STATE.md`. For what to actually work on next, see `NEXT_PRIORITIES.md`.

**A future session should read all three of these files first**, verify the live repo/DB state against what `CURRENT_STATE.md` claims, and only then act. See "Future Short-Prompt Contract" at the bottom.

## Project Separation Rule

Two separate repos may be active on this machine at the same time. **Do not confuse them, and do not act on one from a session scoped to the other.**

| | TREND DASHBOARD (this repo) | PRODUCT PLANNING DASHBOARD |
|---|---|---|
| Agent normally used | Claude Code | May run concurrently under OpenAI Codex |
| Repo | `C:/Users/bcave/dev/open-design-trend-dashboard` | `C:/Users/bcave/OneDrive - (주)비케이브/open-design-main-1` |
| Branch (this repo) | `feature/trend-dashboard` | n/a |

- The Product Planning Dashboard's Codex process (often `codex.js --yolo`) is **expected, legitimate, concurrent activity** - not an anomaly to investigate or an intrusion to stop.
- Trend-dashboard agents must **NEVER** modify anything under the OneDrive repo path.
- Trend-dashboard agents must **NEVER** terminate or interfere with Codex (or any other) processes merely because they are running concurrently on the same machine.
- **Do not attribute any change in this repo's data or files to another agent/process without direct evidence that its actual working directory or command line targets THIS repo** (`open-design-trend-dashboard`). Process *name* alone (`node.exe`, `codex.js`) is not evidence - check the actual command line / working-directory argument. A 2026-09-10 incident investigation initially suspected a concurrent Codex session of mutating this repo's Market data; direct command-line inspection showed every Codex process's `--working-dir` pointed at the OneDrive repo, not this one - the suspicion was unfounded. See `CURRENT_STATE.md`'s incident note and `docs/EDITORIAL_REFRESH_OPERATIONS.md`'s "2026-09-10 Addendum" for the full writeup.

## Worktree / Git Safety

- Correct path: `C:/Users/bcave/dev/open-design-trend-dashboard`. Never touch `C:\Users\bcave\OneDrive - (주)비케이브\open-design-main-1` (see Project Separation Rule above).
- Correct branch: `feature/trend-dashboard`.
- Never touch port 3000 (reserved, per `docs/EDITORIAL_REFRESH_OPERATIONS.md` "DB / SQLite Write Safety").
- Git staging: explicit files only (`git add <path>`). Never `git add .` / `git add -A`.
- Never force-push. Never `git reset --hard` / `git clean` / discard-uncommitted-work commands without first running `git status` and understanding what would be lost.
- Never rewrite history on shared work (`--amend` on an already-pushed commit, interactive rebase) unless explicitly asked.

## Data Safety

- **Market isolation**: `MarketRankingSnapshot` (production-scoped as `dataMode: "real"`) must never be touched by Editorial work. No code path in `scripts/refresh-editorial.ts`, `scripts/collect-korea-editorial.ts`, or any Editorial collector references the `marketRankingSnapshot` Prisma model at all - this is a structural guarantee, not a convention to remember. **"Market" always means the `dataMode: "real"` count, never the raw unfiltered table count** - the raw table also holds ~2,592 pre-existing `dataMode: "sample"` seed rows from a single 2026-08-28 bulk load that are not part of the production metric. See `CURRENT_STATE.md` for the current real-scoped count.
- **Product Reference is frozen/closed research.** Do not resume it. (`docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md`: "Product Reference research is closed; this pass does not touch it.") Do not import from `product-reference/` in any Editorial-refresh code path - this is asserted structurally in `scripts/test-refresh-editorial.ts`'s taxonomy-isolation check.
- **SQLite location**: `apps/trend-dashboard/prisma/dev.db`, resolved from `DATABASE_URL="file:./dev.db"` relative to `prisma/schema.prisma`. Local-only, gitignored, not deployed anywhere - there is no cloud/hosted copy of this database.
- **Refresh runner**: `scripts/refresh-editorial.ts` (`pnpm refresh:editorial` from `apps/trend-dashboard/`). Full behavior, flags, phases, and failure/quality-gate policy documented in `docs/EDITORIAL_REFRESH_OPERATIONS.md` - read that file before touching this script. As of 2026-09-10 it is CLI-hardened: `--help`/`-h` prints usage and exits 0 doing nothing else, and any unrecognized argument fails fast (non-zero exit, no DB/network access) via `src/services/editorial-refresh-cli.ts`. **Never run this command live to "just check" something** - `--help` for usage, `--dry-run` for a real-but-non-writing validation (note: `--dry-run` still makes real network requests), and prefer the unit tests (`scripts/test-refresh-editorial.ts`) for anything that doesn't need live data.
- **Scheduler behavior**: Windows Task Scheduler task `Wakiwilly Trend Dashboard - Editorial Refresh` runs `apps/trend-dashboard/scripts/run-scheduled-refresh.ps1` (which invokes exactly `corepack pnpm refresh:editorial --json`) weekly, Monday 08:30 KST. Do not recreate or modify it unless verification shows it is actually broken (wrong schedule, disabled, failing runs) - inspect with `Get-ScheduledTask`/`Get-ScheduledTaskInfo` first, always read-only, before considering any change.

## Editorial Semantics

- The planning unit is the **ITEM + direct ATTRIBUTE relation** (e.g. "화이트 SKIRT"), extracted per-article by `extractDirectAttributeRelations` (`src/collectors/editorial/attribute-relations.ts`) - a pure function of stored post text.
- **Article co-occurrence within the same piece is not direct evidence.** Only text where an attribute is grammatically, directly attached to a specific item counts as a relation instance.
- **Bundles** (`getAttributeBundles`, `src/services/attribute-bundle-service.ts`) key on `specificItem + the exact sorted attribute set found together in one article` - a stricter grouping than the item or a single attribute alone. Two articles describing the same item with different attribute sets produce two different bundles, not one merged claim. This is a **frozen mechanism** - do not redesign it. See `docs/EDITORIAL_SIGNAL_TRUST_AUDIT.md` "Metric Definitions" for the precise, code-traced definitions of every metric name used here and in `CURRENT_STATE.md`.
- **`independentEvidenceClusterCount`** scores real article/story independence (via the roundup-absorption model), regardless of publisher ownership. **Same publisher family does NOT automatically collapse evidence into one cluster** - independence is about the article/story, not the company. This mechanism is frozen; do not redesign it (`docs/EDITORIAL_REFRESH_OPERATIONS.md` "Roundup Heuristic": "this code stays frozen... No redesign.").
- **`publisherFamilySpread`** is a *separate*, read-only ranking tiebreak on top of `independentEvidenceClusterCount` - it exists specifically so a 2-masthead-same-family bundle does not outrank a genuinely 2-different-company bundle on cluster count alone (`docs/EDITORIAL_RANKING_FAMILY_DIVERSITY_AUDIT.md`). It does not change what counts as an independent cluster; it only affects sort order among bundles that are already tied.
- **Source expansion is currently paused** - `docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md` Section 20 concluded source expansion is no longer the primary bottleneck. Do not add a new source speculatively; see `NEXT_PRIORITIES.md` P3 for the actual bar.

## UI Freeze

**The UI layout is frozen.** No CSS/component/layout redesign unless the user explicitly reopens this. This has been an explicit, repeated constraint across essentially every prior audit pass in `docs/*.md` - treat it as a hard default, not a per-task judgment call.

## Automation Boundary

**Safe to automate** (Category A): running `scripts/refresh-editorial.ts` on schedule, with no code/taxonomy changes between runs. Idempotent, gated, reported.

**Never automate** (Category B - human-reviewed only):
- Any edit to `src/collectors/editorial/mentions.ts` (taxonomy) or `attribute-relations.ts` (extraction/boundary logic).
- Any edit to `attribute-bundle-service.ts`'s sort/ranking logic.
- Any new source addition (`src/config/editorial-sources.ts` + a new collector in `rss.ts`).
- Running `scripts/reparse-editorial-mentions.ts` (full corpus reparse) - only ever justified immediately after a Category B code change.
- Any Product Reference work (frozen - see Data Safety above).
- Any taxonomy expansion of any kind, including re-attempting BAGS/ACCESSORIES/COAT coverage. This was tried and **reverted** - a 100%-precision taxonomy addition still fragmented an existing multi-source bundle via the exact-attribute-set bundle key (`docs/EDITORIAL_CATEGORY_COVERAGE_GAP_AUDIT.md`, "Do not pursue further BAGS/ACCESSORIES/COAT taxonomy work"). If this priority ever returns, that doc's own suggested next lead (a DETAIL:BELT candidate) is the documented starting point, not a fresh attempt at the item-canonical approach.
- Any Prisma schema/migration change.
- Any UI change (see "UI Freeze" above).

The hard operational rule behind all of this: **automated refresh must never modify taxonomy, ranking logic, or schema** - only data (new posts/mentions from existing sources via existing collectors). See `docs/EDITORIAL_REFRESH_OPERATIONS.md` "Bundle-Key Fragmentation Lesson" for the full reasoning.

## Stop Conditions

Stop and ask the user (don't guess, don't self-remediate) if you encounter:
- A dirty working tree you don't recognize (uncommitted changes not obviously yours) - inspect with `git status`/`git diff` before touching anything.
- An unexpected Market (`dataMode: "real"`) count change - Market must never move from Editorial work; investigate read-only before assuming corruption (see the 2026-09-10 false-alarm writeup in `CURRENT_STATE.md` for how to do this correctly - filter by `dataMode`, don't just raw-count the table).
- Canonical or mention duplicates appearing where the quality gates previously reported 0.
- Any sign of parser/taxonomy collapse (a source's relation/bundle output dropping sharply with no corresponding real-world explanation).
- An unknown/unexplained DB mutation - trace it with read-only queries (`groupBy` by `dataMode`/`createdAt`/`importRunId` is usually enough) before concluding anything, including before concluding it's a problem.
- An access restriction (network, filesystem, credentials) blocking a planned step.
- An unexpected signal collapse (bundle/relation counts dropping) immediately after a code change - bisect before assuming the change is safe.
- Evidence that another process IS writing to this specific repo/DB concurrently (verified via actual command-line/working-directory inspection, not process name) - this is different from the expected-and-fine Product Planning Dashboard Codex session; see Project Separation Rule.

## Validation Expectations

Match validation depth to what changed:
- **Docs-only change**: no build required. Sanity-check cross-references against the actual current code/data before publishing.
- **Pure-logic code change** (e.g. `src/services/*.ts`): `pnpm typecheck` + the relevant `scripts/test-*.ts` file(s). No live DB/network run needed if the change is unit-testable, and prefer that over a live run.
- **Any change touching a collector, the refresh runner, or DB read/write code**: `pnpm typecheck` + `pnpm test` (includes `smoke-test.ts`) + the specific `test-refresh-editorial.ts` suite. A live `--dry-run` (real network, zero DB writes) is the appropriate "does this actually work" check for collector-touching changes - a full LIVE run is not, outside the normal schedule.
- **Never** run a real (non-dry-run, non-scheduled) `refresh:editorial` invocation just to test something. This is not a hypothetical caution - it is exactly what caused the 2026-09-10 incident (see `CURRENT_STATE.md` and `docs/EDITORIAL_REFRESH_OPERATIONS.md`'s addendum). Use `--help`, `--dry-run`, or the unit tests instead.

## Future Short-Prompt Contract

A fresh session (Claude Code or Codex) should be started with:

> Continue the trend-dashboard project from the repo state.
> Read AGENT_OPERATING_RULES.md, CURRENT_STATE.md, and NEXT_PRIORITIES.md.
> Verify the live repo state, execute only the highest-priority safe task,
> validate it, update CURRENT_STATE.md if state changed, then commit and push.

The agent must:
- Read all three control docs first.
- Verify live repo/DB state itself (don't trust a stale snapshot at face value - `CURRENT_STATE.md` can be minutes-to-weeks old depending on when it was last touched).
- Choose only ONE task, from `NEXT_PRIORITIES.md`'s highest live-priority tier.
- Not reopen a closed/frozen track (Product Reference, BAGS/ACCESSORIES/COAT taxonomy, UI redesign, ranking-architecture redesign) without the user explicitly reopening it in this session.
- Not invent stale baseline values - re-derive from the DB/repo, the same way this pass's own investigation did (see `CURRENT_STATE.md`'s incident note for a worked example of "verify, don't assume").
- Validate all completion claims per "Validation Expectations" above.
- Update `CURRENT_STATE.md` after any meaningful state change (data, code, or docs).
- Commit/push only when actual repo files changed - explicit `git add <path>` staging, normal push, no force.

This contract is intentionally host-agnostic: it depends only on reading files and running repo commands, not on any Claude-specific or Codex-specific background-agent feature.
