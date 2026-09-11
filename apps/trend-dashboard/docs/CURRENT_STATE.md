# Current State - Trend Dashboard

**This is a mutable snapshot, not policy.** For stable rules, see `AGENT_OPERATING_RULES.md`. For what to do next, see `NEXT_PRIORITIES.md`. A session reading this file should still verify live state itself before acting - see that file's "Future Short-Prompt Contract."

Last verified: 2026-09-11, read-only, directly against the DB (a fresh Claude Code session independently re-ran typecheck/test/build and the read-only quality audit against the then-uncommitted `EditorialVisualContextStrip` work before committing it - not assumed from a prior report).

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

## P2 Pre-Gate Usability Work (2026-09-10)

The user explicitly authorized safe UI-only P2 work before the first natural Monday P0 observation, while keeping the 2026-09-14 scheduled-run validation intact. The first change hides the misleading `데이터 범위` scope control on `/editorial`, where scope does not change Editorial results; gender filtering remains visible and unchanged. No service semantics, taxonomy, ranking, evidence clustering, schema, scheduler, or Market logic changed.

During validation, the live-data smoke test exposed several stale snapshot assumptions caused by legitimate corpus growth: TRACK_JACKET now has both `셔링 디테일의 트랙 재킷` and `스포티한 트랙 재킷` as direct phrases, KNIT_BEANIE now has a real `블랙 니트 비니` bundle, and the current primary/family counts have moved beyond the old 2026-09-09 snapshot. The smoke test was hardened to assert stable structural rules and synthetic regression fixtures instead of pinning mutable REAL-corpus winners/counts. This was test maintenance only; no parser, ranking, taxonomy, or DB logic changed.

**Second P2 fix (2026-09-10): unified specific-item Korean label rendering.** `/items` (`SpecificItemCard`) and `/editorial` (`EditorialRow`) were showing the raw English SUB_ITEM taxonomy value (via `trendValueLabel`, e.g. `TRACK JACKET`) while `/` (`EditorialTrendCard`) and the item detail page (`/items/[itemType]`) already showed the Korean label (`트랙 재킷`) via `specificItemKoreanLabel` for the exact same underlying value - the same item read differently depending on which screen a planner was on. Fixed by applying the same `specificItemKoreanLabel(value) ?? trendValueLabel(value)` fallback (reusing the existing helper, no dictionary expansion) at the three affected call sites: `src/app/items/page.tsx` (`SpecificItemCard`, always SUB_ITEM so no conditional needed), `src/app/editorial/page.tsx` (`EditorialRow`, gated on `row.type === "SUB_ITEM"` since this screen also renders DETAIL/MATERIAL/COLOR/STYLE rows that intentionally stay unmapped), and `src/app/page.tsx` (the `/`-page trend×store matrix table, gated on `row.dimension === "SUB_ITEM"`). `src/components/AttributeBundle.tsx`'s `englishSubtitle` and `/items`' `OverseasOnlyCard` (Market's own `subItemTypeLabel`/`itemTypeLabel` English vocabulary) were deliberately left untouched - both are already-correct, differently-scoped, pre-existing patterns, not instances of this bug. UI-only, content-call-site-level change; no taxonomy/extraction/ranking/schema/Market logic touched. Validated: `typecheck`, `test` (smoke), `build` all pass; read-only quality audit re-confirmed Canonical Duplicates 0, Mention Duplicates 0, Market (real) 667, EditorialPost 617 (587 FASHION_RELEVANT + 30 UNKNOWN) - unchanged from the snapshot above, confirming no live refresh ran during this pass.

## P2 Visual-First Baseline Audit (2026-09-11)

Completed the required rendered-UI, existing-image, evidence-boundary, and Instagram feasibility audit before any large visual-first implementation. See `docs/VISUAL_FIRST_TREND_BOARD_AUDIT.md`.

- Live repo/DB/scheduler state still matches the baseline above: 617 posts, 2781 mentions, 89 bundles, current primary `화이트 SKIRT`, Canonical Duplicates 0, Mention Duplicates 0, Market(real) 667; scheduler Ready/enabled with next run 2026-09-14 08:30 KST.
- Real rendered home at a 1280×720 viewport contains 0 images across a 2,465px document, confirming the current experience is text/count-first.
- All 587 fashion-relevant articles have an article-level image URL, and all 89 bundles have article-hero visual context in their retained evidence list.
- No real bundle has a document-position-confident direct/adjacent evidence image. Article heroes are therefore safe only as clearly labelled article visual context, never as a bundle hero or direct attribute/mood proof.
- No UI, collector, schema, taxonomy, ranking, scheduler, Market data, or DB state changed in this audit pass.

## P2 Editorial Visual Context Strip (2026-09-11)

The user approved the baseline audit and explicitly reopened the UI for the smallest visual-first implementation. The home `Current Signal` now renders `EditorialVisualContextStrip` from the current bundle's existing `evidenceArticles` only.

- Uses four to six images when available, capped at six; the current `화이트 SKIRT` bundle exposes five unique images.
- Removes duplicate image assets using host+path identity while preserving the existing newest-first evidence order. Image selection is UI-only and does not score or re-rank evidence.
- Every image remains attached to its publisher/date/title/original article link and is labelled `기사 비주얼 맥락` plus `기사 대표 이미지 · 아이템/속성/무드를 직접 증명하지 않음`.
- `BundleHeroImage` still accepts only `evidenceImageUrl` from `DIRECT_BLOCK`/`ADJACENT_BLOCK`; article heroes never enter that direct-evidence path.
- 1280×720 rendered verification: five images, five unique image identities, five evidence-article links, all five visible in the first viewport, no page-level horizontal overflow.
- 390×844 rendered verification: five unique images/links, strip begins at y≈687 and the first image at y≈790, so imagery appears in the first viewport; document width stays within the viewport with only the intentional inner horizontal strip scrolling.
- Validation passed: `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`; all five current images loaded at natural dimensions, browser console errors were empty, and the 3001 dev server was restored afterward.
- Read-only quality audit remained 617 posts / 2781 mentions, Canonical Duplicates 0, Mention Duplicates 0, and Market(real) 667.
- No collector, DB/schema, ranking, taxonomy, direct-relation, Market, scheduler, or live data change.

**Independent commit-time re-verification (2026-09-11, separate Claude Code session):** this work was found already implemented but uncommitted in the working tree. Before committing, this session re-read the diff against `VISUAL_FIRST_TREND_BOARD_AUDIT.md`'s Section 6 contract line by line, confirmed `BundleHeroImage`/`findHeroArticle` still only accept `evidenceImageUrl`, confirmed `evidenceArticles` is still capped at 5 by the frozen bundle-service `.slice(0, 5)` (so the six-image UI cap never actually exceeds it), and confirmed the diff touches only `src/app/page.tsx`, `src/components/AttributeBundle.tsx`, the new `src/lib/editorial-visual-context.ts`, and `scripts/smoke-test.ts` - no collector/service/schema file. Re-ran `typecheck` (clean), `test` (smoke test passed), and `build` (succeeded, all 16 routes). Re-rendered the live dev server at both required viewports with Playwright (the Chrome extension was unavailable this session): at 1280×720 the current primary `화이트 SKIRT` showed all 5 unique images fully inside the first viewport (strip box y 355-713) with 0 console/page errors and no horizontal overflow (docWidth 1280 == viewportWidth 1280); at 390×844 the strip began at y≈687 and the first image at y≈790 (matching the original implementation note), 5 unique images/links, 0 console/page errors, no horizontal overflow. Re-ran `scripts/audit-editorial-quality.ts` read-only: TOTAL POSTS (real) 617, TOTAL MENTIONS (real) 2781, CANONICAL DUPLICATES 0, MENTION DUPLICATES 0, Attribute bundles 89, MarketRankingSnapshot (real) 667 - all unchanged from the documented baseline, confirming no live data moved during this review. Committed as-is with no code changes beyond this doc/state alignment pass.

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
