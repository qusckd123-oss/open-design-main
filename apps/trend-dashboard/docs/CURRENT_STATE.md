# Current State - Trend Dashboard

**This is a mutable snapshot, not policy.** For stable rules, see `AGENT_OPERATING_RULES.md`. For what to do next, see `NEXT_PRIORITIES.md`. A session reading this file should still verify live state itself before acting - see that file's "Future Short-Prompt Contract."

Last verified: 2026-09-10, read-only, directly against the DB and running Task Scheduler state (not assumed from a prior report).

## Repo

- Worktree: `C:/Users/bcave/dev/open-design-trend-dashboard`
- Branch: `feature/trend-dashboard`
- HEAD as of this pass's own commit (CLI hardening + this handoff doc set): see `git log -1 --format="%H %s"` in that branch - this file is committed in the same commit, so its own HEAD reference would immediately go stale; don't hardcode a SHA here.
- Prior HEAD this pass started from: `8a6cef6` ("chore: add Task Scheduler wrapper for the weekly editorial refresh").

## Live Editorial/Market Signal State

Derived via `getEditorialRefreshSnapshot()` (`src/services/editorial-refresh-snapshot.ts` - the exact same function `scripts/refresh-editorial.ts` itself uses for its before/after report) plus `scripts/audit-editorial-quality.ts` (both read-only, re-run fresh for this snapshot, not copied from an old report):

| Metric | Value |
|---|---|
| EditorialPost (real) | 617 |
| EditorialMention (real) | 2781 |
| Direct Relation Instances | 179 |
| Distinct Item+Attribute Pairs | 92 |
| Bundles | 89 |
| Independent Repeated (`independentRepeated`) | 18 |
| Multi-source Independent (`multiSourceIndependent`) | 16 |
| Publisher-family-diverse (`publisherFamilyDiverse`) | 10 |
| Current Primary (`currentPrimary`) | "화이트 SKIRT" |
| Canonical Duplicates | 0 |
| Mention Duplicates | 0 |
| Market (`MarketRankingSnapshot`, `dataMode: "real"`) | 667 |

**"Market" always means the `dataMode: "real"`-scoped count (667).** The raw, unfiltered `MarketRankingSnapshot` table count is 3259 - it also holds ~2,592 pre-existing `dataMode: "sample"` rows from a single 2026-08-28 bulk seed load, unrelated to production. Never report the raw count as "Market" - see the incident note below for how this was verified.

Metric name definitions (precise, code-traced): `docs/EDITORIAL_SIGNAL_TRUST_AUDIT.md`, "Metric Definitions".

## Current Editorial Sources (8)

`EYESMAG`, `HYPEBEAST_KR`, `NONLABEL`, `VISLA`, `ESQUIRE_KR`, `HARPERSBAZAAR_KR`, `COSMOPOLITAN_KR`, `MARIECLAIRE_KR` (`src/config/editorial-sources.ts`).

## Current Publisher-Family Map

| Source | Publisher Family |
|---|---|
| VISLA | `VISLA_INDEPENDENT` |
| HYPEBEAST_KR | `HYPEBEAST_HK` |
| EYESMAG | `EYES_INC` |
| NONLABEL | `NONLABEL_INDEPENDENT` |
| ESQUIRE_KR | `HEARST_JOONGANG` |
| HARPERSBAZAAR_KR | `HEARST_JOONGANG` |
| COSMOPOLITAN_KR | `HEARST_JOONGANG` |
| MARIECLAIRE_KR | `MCK_PUBLISHING` |

8 sources, 6 distinct publisher families (ESQUIRE_KR/HARPERSBAZAAR_KR/COSMOPOLITAN_KR share `HEARST_JOONGANG`).

## Current Ranking Order

`getAttributeBundles()`'s sort (`src/services/attribute-bundle-service.ts`), most-significant key first:

1. `bundleSourceSpread` (desc)
2. `publisherFamilySpread` (desc) - tiebreak added 2026-09-09, see `docs/EDITORIAL_RANKING_FAMILY_DIVERSITY_AUDIT.md`
3. `independentEvidenceClusterCount` (desc)
4. `bundleArticlePresence` (desc)
5. `directAttributes.length` (desc)
6. `displayName` (alphabetical, ascending - final deterministic tiebreak)

This is frozen ranking logic - do not redesign without explicit user request (see `AGENT_OPERATING_RULES.md` "Automation Boundary").

## Scheduler Status

- Task: `Wakiwilly Trend Dashboard - Editorial Refresh`
- State: `Ready`, Enabled: `True`
- Trigger: Weekly, Monday 08:30 KST
- Last run: 2026-09-09 18:31 KST (an ad-hoc scheduled-task test, not the regular Monday slot), result code 0 (success)
- Next scheduled run: **2026-09-14 08:30 KST**
- Settings: `MultipleInstances=IgnoreNew`, `StartWhenAvailable=True`, `WakeToRun=True`
- Wrapper: `apps/trend-dashboard/scripts/run-scheduled-refresh.ps1` (invokes exactly `corepack pnpm refresh:editorial --json`)
- Logs: `apps/trend-dashboard/logs/editorial-refresh/` (gitignored)

Refresh command: `corepack pnpm refresh:editorial --json` (run from `apps/trend-dashboard/`). Full CLI usage/flags: `docs/EDITORIAL_REFRESH_OPERATIONS.md`.

## SQLite Location

`apps/trend-dashboard/prisma/dev.db`, resolved from `DATABASE_URL="file:./dev.db"` in `.env` relative to `prisma/schema.prisma`'s directory. Local-only, gitignored (`.gitignore` excludes `dev.db`, `dev.db-journal`, `dev.db-wal`, `dev.db-shm`), never deployed.

## Recent Important Fix: Editorial Refresh CLI Hardening (2026-09-10)

**Incident (brief, factual - full writeup in `docs/EDITORIAL_REFRESH_OPERATIONS.md`'s "2026-09-10 Addendum"):** an unintended extra live Editorial refresh occurred outside the normal weekly schedule because the refresh runner's argv parsing silently ignored `--help` (an unrecognized flag at the time) and fell through to a full LIVE run by default. It ran for ~2m51s before being interrupted.

- **Data quality was audited and found valid**: 96 new posts / 699 new mentions added, 0 canonical duplicates, 0 mention duplicates, 0 malformed rows, clean quality gates throughout - the interrupted run stopped cleanly between sources, not mid-write.
- **The resulting real articles were retained** - not reverted, per this project's standing "never discard real, legitimately-collected work" principle.
- **The CLI was hardened afterward**: `src/services/editorial-refresh-cli.ts` (new, pure, unit-tested) now makes `--help`/`-h` print usage and exit 0 doing nothing else, and any unrecognized argument fail fast (non-zero exit, before any DB/network access). Regression-tested in `scripts/test-refresh-editorial.ts`.
- **No Market corruption occurred** - `MarketRankingSnapshot` (`dataMode: "real"`) stayed at 667 throughout; a separate, momentary false alarm during investigation (an *unfiltered* raw count of 3259) turned out to be pre-existing `dataMode: "sample"` seed data from 2026-08-28, unrelated to this incident.
- **The concurrent Codex session investigated during this incident was unrelated** - it belongs to the separate Product Planning Dashboard repo (`C:\Users\bcave\OneDrive - (주)비케이브\open-design-main-1`), confirmed via direct command-line/working-directory inspection, not process name. See `AGENT_OPERATING_RULES.md`'s "Project Separation Rule."

This is historical context, not an active issue - the corpus is simply ~15 hours fresher than the prior scheduled run's own report claimed, with no lingering data-quality concern.

## Known Current Limitations

(Carried forward, still true as of this pass - see `docs/EDITORIAL_REFRESH_OPERATIONS.md` "Current Limitations" for the full list)
- The 25%-bundle-count-swing quality-gate threshold is a documented judgment call, not derived from multiple historical refresh runs.
- SQLite lock-conflict risk against an actively-used dev server port is discussed but not reproduced or fixed - no WAL/busy-timeout pragma change has been made.
- BAGS/ACCESSORIES/COAT category coverage remains genuinely low/zero trust-tier signal - tried and reverted, not a current work item (see `AGENT_OPERATING_RULES.md` "Automation Boundary").
- Product Reference research remains closed/frozen.

## Pointers to Detailed Audit Docs

This file is an index, not a duplicate. For the full history and reasoning behind current architecture:

- `docs/EDITORIAL_REFRESH_OPERATIONS.md` - the refresh runner's full architecture, phases, failure policy, quality gates, and the 2026-09-10 incident writeup.
- `docs/EDITORIAL_SIGNAL_TRUST_AUDIT.md` - precise metric definitions; ranking-contradiction fix.
- `docs/EDITORIAL_RANKING_FAMILY_DIVERSITY_AUDIT.md` - why/how `publisherFamilySpread` was added as a tiebreak.
- `docs/EDITORIAL_PUBLISHER_DIVERSITY_AUDIT.md` - same-family-does-not-collapse-evidence reasoning.
- `docs/EDITORIAL_CATEGORY_COVERAGE_GAP_AUDIT.md` - BAGS/ACCESSORIES/COAT taxonomy expansion attempt and revert, bundle-key-fragmentation mechanism.
- `docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md` - source-expansion-paused decision.
- `docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md` - Product Reference freeze statement; item-taxonomy coverage findings.
- `docs/CROSS_SOURCE_INDEPENDENT_SIGNAL_AUDIT.md`, `docs/COSMOPOLITAN_COLLECTION_AUDIT.md`, `docs/MARIECLAIRE_COLLECTION_AUDIT.md`, `docs/NON_HEARST_SOURCE_DIVERSITY_AUDIT.md` - per-source collection/integration passes.
- `docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md`, `docs/PRODUCT_ATTRIBUTE_REFERENCE_AUDIT.md` - Product Reference's own (frozen) history.
