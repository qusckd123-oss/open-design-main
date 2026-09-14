# Current State - Trend Dashboard

**This is a mutable snapshot, not policy.** For stable rules, see `AGENT_OPERATING_RULES.md`. For what to do next, see `NEXT_PRIORITIES.md`. A session reading this file should still verify live state itself before acting - see that file's "Future Short-Prompt Contract."

Last verified: 2026-09-14, read-only, directly against the committed `refresh-20260914-083001.json`/`.log` machine-readable reports for the scheduled refresh (not re-derived from the DB this pass, since the refresh runner's own before/after snapshot - the same `getEditorialRefreshSnapshot()` function - already produced it fresh at refresh time).

## Repo

- Worktree: `C:/Users/bcave/dev/open-design-trend-dashboard`
- Branch: `feature/trend-dashboard`
- HEAD as of this pass's own commit (CLI hardening + this handoff doc set): see `git log -1 --format="%H %s"` in that branch - this file is committed in the same commit, so its own HEAD reference would immediately go stale; don't hardcode a SHA here.
- Prior HEAD this pass started from: `8a6cef6` ("chore: add Task Scheduler wrapper for the weekly editorial refresh").

## Live Editorial/Market Signal State

Derived via `getEditorialRefreshSnapshot()` (`src/services/editorial-refresh-snapshot.ts` - the exact same function `scripts/refresh-editorial.ts` itself uses for its before/after report) plus `scripts/audit-editorial-quality.ts` (both read-only, re-run fresh for this snapshot, not copied from an old report):

| Metric | Value |
|---|---|
| EditorialPost (real) | 734 |
| EditorialMention (real) | 3455 |
| Bundles | 110 |
| Independent Repeated (`independentRepeated`) | 25 |
| Multi-source Independent (`multiSourceIndependent`) | 20 |
| Publisher-family-diverse (`publisherFamilyDiverse`) | 11 |
| Current Primary (`currentPrimary`) | "스트라이프 SHIRT" |
| Canonical Duplicates | 0 |
| Mention Duplicates | 0 |
| Market (`MarketRankingSnapshot`, `dataMode: "real"`) | 667 |

Post-refresh as of the 2026-09-14 08:30 KST scheduled run (see "P0 Scheduled Refresh Observation" below). `Direct Relation Instances`/`Distinct Item+Attribute Pairs` aren't part of the refresh runner's own snapshot output, so they're left off this table rather than guessed - re-derive from `scripts/audit-editorial-quality.ts` if needed.

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
- Last run: **2026-09-14 08:30 KST (the first naturally scheduled Monday run)**, result code 0 (success) - see "P0 Scheduled Refresh Observation" below. Prior run: 2026-09-09 18:31 KST (an ad-hoc scheduled-task test, not a regular Monday slot).
- Next scheduled run: **2026-09-21 08:30 KST**
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

## P2 Editorial Ordered Visual Evidence Audit (2026-09-11)

Read-only architecture audit answering whether `DIRECT_BLOCK`/`ADJACENT_BLOCK` image-relation evidence can become real, and how. See `docs/EDITORIAL_ORDERED_VISUAL_EVIDENCE_AUDIT.md` for the full per-source breakdown.

- Re-verified live state matched the baseline above (617 posts across the 8 sources, 89 bundles, 129 retained evidence-article references, 0 with a `DIRECT_BLOCK`/`ADJACENT_BLOCK` image).
- Traced all 8 sources' parsers in `src/collectors/editorial/rss.ts`: every one destroys paragraph/image position at parse time (a single `stripHtml()`/flatten call per source), and none is stored raw - `EditorialPost` has no HTML/JSON field to reconstruct from.
- Confirmed via a read-only query that 0/617 stored `text` values contain even a literal newline - the destruction is already complete for every real row on disk, not a partially-preserved signal.
- Per-source feasibility for a future ordered-block collector: HIGH (EYESMAG - structured TipTap JSON tree already walked by existing code); MEDIUM (VISLA, HYPEBEAST_KR, the three Hearst Joongang sources, MARIECLAIRE_KR asymmetrically - text easy via JSON-LD, images hard); LOW (NONLABEL - no body-container parser exists at all yet for this source).
- Proposed (design only, no schema/migration) a minimal `OrderedContentBlock` shape and a separate human-reviewed `EditorialVisualMoodObservation` shape, and flagged that the future block model is a genuine revision of - not a drop-in reuse of - `image-relation.ts`'s current `ContentBlock` type.
- No code, schema, collector, taxonomy, ranking, or live data changed in this audit pass; no live network fetch was made.

## P2 Trend Research Source Registry (2026-09-11)

Docs/config-independent audit checking whether 8 sources the user actually references for trend research (5 Instagram accounts/posts, `hbx.com/women`, Musinsa's `/content/list` magazine section, `coverchord.com`) are already reflected in this repo, and how they map onto four lanes: EDITORIAL DIRECT EVIDENCE, VISUAL DIFFUSION/STYLE CONTEXT, MARKET/ASSORTMENT, MANUAL RESEARCH ONLY. See `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` for the full per-source table and design.

- 5 of 8 sources (all 5 Instagram URLs, plus `coverchord.com`) had zero prior repo reference. The other 3 (`HBX`, `MUSINSA`, and the web `NONLABEL` editorial source) are registered, but for a different URL/purpose than the one given here.
- No Instagram URL was fetched in this pass (per the user's own no-scraping/no-private-API boundary); classification for those 5 rests on the user's own account descriptions plus this repo's existing official-API feasibility research (`VISUAL_FIRST_TREND_BOARD_AUDIT.md` Section 7).
- Three public web URLs were checked read-only (`robots.txt` + one page/JSON fetch each, the same depth already used in `docs/MARKET_SOURCE_AUDIT.md`): `hbx.com/women` is a navigation hub with no product data (a real women's category URL would need choosing separately); `musinsa.com/content/list?contentCategoryCode=019002001` is robots-restricted for automated collection (same wildcard policy as the already-known ranking page) AND client-hydrated with no server-rendered content, and is Musinsa's own in-house editorial/magazine section rather than a market-ranking page; `coverchord.com` is a Shopify storefront with a confirmed public `products.json` endpoint returning real product data - the same proven method already running for Slam Jam/Stussy.
- Proposed (design only, no config/schema change) a `VisualDiffusionSourceConfig`/`VisualDiffusionReference` model, structurally parallel to but never merged into `EditorialMention`/ranking, plus a concrete home-screen "반복 노출된 스타일링 레퍼런스" section design extending the existing visual-first contract.
- Explicitly flagged: the web `NONLABEL` editorial source and Instagram `@nonlabel.mag` must stay structurally separate lanes even if a human later confirms the same publisher - never let an Instagram image inherit the web source's direct-evidence trust tier.
- Two concrete new-action candidates surfaced, neither implemented: `COVERCHORD` as a ready, low-risk Market-source addition (independent of the Editorial P0 gate); the 4 Instagram accounts plus 1 example permalink as `MANUAL_CURATION`-tier registry candidates.
- No code, config, schema, collector, taxonomy, ranking, or live data changed in this pass; Market(real) remained 667, EditorialPost(real)/EditorialMention(real)/Bundles remained 617/2781/89, Canonical/Mention Duplicates remained 0/0.

## Market Coverchord Source Addition (2026-09-11, validated and committed)

The user explicitly approved `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` Section 10 decision 1 (Coverchord) in this session. Implemented as a small, isolated, config-only change, independent of the Editorial P0 gate:

- `src/config/market-sources.ts`: added `"COVERCHORD"` to `marketSources` and a matching `normalizeMarketSource` branch.
- `src/config/market-category-map.ts`: added a `COVERCHORD` entry to `sourceCategoryConfigs` (`method: "SHOPIFY_PRODUCTS_JSON"`, `rankingVerified: false`, `rankingScope: "CATEGORY"`), mirroring Slam Jam/Stussy exactly. No change to `ShopifyMarketCollector`, `createMarketCollector`, the Prisma schema, Editorial code, ranking, or taxonomy - the existing generic Shopify collector picks the new source up automatically once registered.
- Category handles were freshly verified live via read-only `products.json` fetches on 2026-09-11 (not assumed/guessed): `SHORT_SLEEVE_TSHIRT` -> `/collections/tops/products.json`, `JACKET` -> `/collections/jackets-coats/products.json`, `PANTS` -> `/collections/bottoms/products.json`, `BAG` -> `/collections/bags/products.json`, `HEADWEAR` -> `/collections/hats-caps/products.json`. `robots.txt` was fetched fresh and confirmed these plain (no-query-string) paths are allowed - only `sort_by`, `+`/`%2B`/`%2b`, combined `filter`, and `ls=` query patterns are disallowed, none of which `getSourceCategoryUrl` ever appends.
- `docs/MARKET_SOURCE_AUDIT.md` updated: new `Coverchord` summary-table row (`SUPPORTED`) plus a full `### Coverchord` write-up section mirroring the existing Slam Jam/Stussy sections.
- `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` Section 10 decision 1 updated from "approve" to "approved and implemented," with a pointer back to this note.

**Validation completed 2026-09-11 (same session, resumed after `device_bash` recovered):**

- `git status --short` confirmed exactly the 6 expected files changed - no unexpected/unrecognized dirty-tree state, no cross-contamination with the separate OneDrive Product Planning Dashboard repo (its own concurrent Codex session's node processes were left untouched, per the Project Separation Rule).
- `corepack pnpm typecheck` passed clean.
- `corepack pnpm build` initially failed with `EPERM: operation not permitted, rename ... query_engine-windows.dll.node` - a Windows file-lock from the already-running 3001 dev server (PID identified precisely via `netstat -ano | findstr :3001`, confirmed as this project's own dev server by port + memory footprint before stopping only that one PID). After stopping it, `corepack pnpm build` succeeded cleanly: all 16 routes compiled, 0 errors.
- Committed as `4c1c307` ("feat: add COVERCHORD market source (config-only, mirrors Slam Jam/Stussy)") and pushed to `origin/feature/trend-dashboard`.
- No live `collect:market --source=COVERCHORD` run has happened yet - this is config only, zero rows collected yet. A manual `collect:market --source=COVERCHORD --category=BAG --limit=10`-style single-category run (real network, writes `dataMode=real` rows - a deliberate, human-invoked Market collection, not the gated Editorial refresh) can confirm end-to-end behavior whenever next useful.
- The 3001 dev server was stopped to unblock `build` and has not been restarted as of this note - restart with `corepack pnpm dev` before the next UI-judgment task.

## Trend Research Registry: Instagram MANUAL_CURATION Accounts (2026-09-14, docs-only, committed)

The user approved `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` Section 10 decision 3 in this session (Instagram accounts as `MANUAL_CURATION`-tier registry candidates). Implemented as a docs-only addition, independent of the Editorial P0 gate:

- Added Section 11 to `docs/TREND_RESEARCH_SOURCE_REGISTRY.md`: a 6-row table of `VisualDiffusionSourceConfig`-shaped entries (`id`, `platform: INSTAGRAM`, `handle`, `profileUrl`, `role: ["STYLING_REFERENCE", "CURATION"]`, `collectionMethod: MANUAL_CURATION`, `relatedEditorialSource: null`, human `note`) - 4 accounts the user confirmed directly (`@fashion_platform_seoul`, `@jentestore`, `@_xxpick`, `@humanretrogirl`), plus 2 more this pass found and independently verified, then the user approved for registration (`@fashion_curator_seoul`, `@celeb_fashion_magazine`).
- **No code, schema, collector, taxonomy, or ranking change** - `VisualDiffusionSourceConfig`/`VisualDiffusionReference` (Section 6) remain design-only with zero implementation in `src/` (confirmed via a fresh repo-wide search this pass); the 6 entries live only in the Markdown table.
- **No Instagram scraping** - each of the 6 (plus 2 more candidates the user did not approve: `@styleandrich.official`, `@dailyfashion_news`) was checked via a single read-only, unauthenticated fetch of that account's own public profile bio/display-name/follower-count only, no login, no private API, no post-content scraping.
- Every entry carries the project's standard disclaimer (사람이 직접 선별한 참고 자료 · 직접 증거 아님, 판매량 아님) and feeds no automated collector, `EditorialMention`, bundle service, or `MarketRankingSnapshot`.
- `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` Section 10 decision 3 updated from "pending approval" to "approved and registered," and `docs/NEXT_PRIORITIES.md` P2's Instagram candidate line updated to reflect the same, mirroring the Coverchord P0/P3 status-update pattern.

**Validation**: docs-only change - no build required per `AGENT_OPERATING_RULES.md` "Validation Expectations." Cross-references sanity-checked against live repo state: confirmed `VisualDiffusionSourceConfig` has no code implementation anywhere in `src/` before writing entries for it, and confirmed all 6 registered accounts (plus the 2 not approved) actually exist via their own live public profile pages before including any of them.

## P0 Scheduled Refresh Observation (2026-09-14, first natural Monday run)

The first naturally scheduled Windows Task Scheduler run (2026-09-14 08:30 KST, `Wakiwilly Trend Dashboard - Editorial Refresh`) fired on its own, unattended and un-intervened, exactly as `NEXT_PRIORITIES.md`'s P0 instructed ("observe... don't intervene preemptively"). This pass performed the full post-refresh checklist against the committed machine-readable reports (`logs/editorial-refresh/refresh-20260914-083001.json` / `.log`):

- **Exit code 0**, ran 08:30:01 -> 08:33:22 KST (~3m21s), `Mode: LIVE`, all 8 configured sources attempted.
- **Source health: 8/8 succeeded**, 0 failures. Per-source: `VISLA` posts=6 new=0 updated=6 mentions=37; `HYPEBEAST_KR` posts=20 new=20 updated=0 mentions=97; `EYESMAG` posts=4 new=4 updated=0 mentions=26; `NONLABEL` posts=3 new=1 updated=2 mentions=2; `ESQUIRE_KR` posts=30 new=30 updated=0 mentions=140; `HARPERSBAZAAR_KR` posts=30 new=30 updated=0 mentions=195; `COSMOPOLITAN_KR` posts=30 new=27 updated=3 mentions=188; `MARIECLAIRE_KR` posts=5 new=5 updated=0 mentions=38.
- **DB/signal deltas, all sane**: EditorialPost 617->734 (+117 new, +11 updated), EditorialMention 2781->3455 (+674), Bundles 89->110 (+21, a 23.6% swing - under the documented 25% threshold), IndependentRepeated 18->25, MultiSourceIndependent 16->20, PublisherFamilyDiverse 10->11, Market(`dataMode:"real"`) unchanged at 667 (confirming the Editorial refresh never touches Market data), Canonical Duplicates 0->0, Mention Duplicates 0->0. Current Primary moved from "화이트 SKIRT" to "스트라이프 SHIRT" - a legitimate ranking-order consequence of new evidence, not investigated further (ranking logic itself is frozen and unchanged).
- **Quality gates**: 6 PASS, 1 WARN (`zero-result sources: 1 source(s) returned 0 new posts`, i.e. `VISLA` - which returned 0 *new* posts but did successfully re-fetch and update all 6 existing ones, consistent with `VISLA` being this repo's lowest-volume source). Per `NEXT_PRIORITIES.md`'s own standing P0 policy ("a WARN-level quality gate, e.g. a single zero-result source... is not a failure"), this WARN required no intervention and none was taken.
- **No code, schema, collector, taxonomy, ranking, Market, or scheduler change** in this observation pass - purely reading the refresh runner's own already-committed output and updating this handoff doc to match. This is the first real, healthy P0 observation this project has had since the scheduler was stood up - the gate `NEXT_PRIORITIES.md`'s P2 section names ("after the healthy natural P0 observation and separate review") for the next visual-first architecture step (ordered content blocks, human-reviewed visual mood observations) is now cleared, pending that separate review.

## P2 Specific Combinations Card (2026-09-14, implemented and validated)

Directly addresses the user's 2026-09-11 live feedback that the home page's single `CurrentSignalHero` was "too generic to plan from" (e.g. showing just "화이트 스커트" with no sense of which specific combinations - color/detail/material - are actually appearing). This is the "구체성" half of that feedback (the separate "실제 착샷 evidence" half remains the still-unimplemented `VisualDiffusionReference` design in `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` Section 6/7).

**What changed**, both UI-only, no service/query/ranking/taxonomy change:

- `src/components/AttributeBundle.tsx`: replaced the old text-only `SecondaryBundleCard` (title + count line, no attributes, no image) with `SpecificComboCard` - same underlying bundle data, now rendered with the same `AttributeChip` breakdown `AttributeBundleCard` already uses, plus up to two small editorial-context thumbnails via the existing `selectEditorialVisualContext` helper (same image-identity dedup, same rule that these are article heroes only - never a bundle hero/`DIRECT_BLOCK` image, never counted as evidence), each thumbnail its own outbound link with source attribution and the same permanent disclaimer text used by `EditorialVisualContextStrip`. `bundleEvidenceStrength` is computed exactly as before, so a single-observation combination is still honestly labelled `단일 관측`, never upgraded in wording.
- `src/app/page.tsx`: the "New Observations" section (plain uppercase label, no Korean copy) is now a proper `SectionHeader` titled **구체적으로 뜨는 조합** ("Specific Combinations"), with an explicit description telling the planner these are additional concrete item+attribute combinations beyond the single hero, and that single-observation ones are labelled honestly. `secondaryBundles` raised from `slice(0, 4)` to `slice(0, 6)` (same already-sorted, unfiltered-ranking list - just showing more of it) and its grid changed from a cramped 4-column layout to a 2-column layout to fit the added imagery/chips. `SecondaryBundleCard` import replaced with `SpecificComboCard`; no other file imports the old name (checked via repo-wide search before removing it).
- No change to `attribute-bundle-service.ts`, extraction, ranking/sort, taxonomy, ranking, ordering, or which bundle becomes the hero - `CurrentSignalHero` itself is completely untouched, per the frozen-ranking/UI-freeze rules.

**Validation completed 2026-09-14** from `apps/trend-dashboard/`: `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build` all passed. A real Playwright-rendered check at 1440x1000 and 390x844 confirmed six cards, 12 successfully loaded editorial-context thumbnails, keyboard focus on every thumbnail link, no page-level horizontal overflow, and no application console errors. The app's `dev` script now pins port 3001 so `corepack pnpm dev` follows this repo's documented port boundary instead of Next.js's port-3000 default. The post-test read-only snapshot remained EditorialPost(real) 734, EditorialMention(real) 3455, Bundles 110, Market(real) 667, Canonical Duplicates 0, Mention Duplicates 0.

## P2 Visual Diffusion References Scaffold (2026-09-14, implemented empty and validated)

- `src/config/visual-diffusion-sources.ts` moves the six explicitly approved Instagram account-level watch entries into a typed, manual-curation-only config. It is not a collector and is not imported by ranking, extraction, Market, or DB-write code.
- `src/config/visual-diffusion-references.ts` defines the human-reviewed permalink reference shape and exact-item lookup. `visualDiffusionReferences` remains intentionally empty: no post, permalink, caption, mood, or item context was added without the user's exact-post approval. Only `status: "APPROVED"` references for an exact live `specificItem` can be returned.
- `src/components/VisualDiffusionReferences.tsx` provides the separate, permalink-only, permanently disclaimed UI lane described in `TREND_RESEARCH_SOURCE_REGISTRY.md`. `CurrentSignalHero` wires it after Editorial Visual Context, but it returns `null` while the reference list is empty; rendered desktop/mobile checks confirmed zero Visual Diffusion sections today.
- No Instagram image is fetched, hotlinked, cached, or transformed. No Prisma schema, collector, taxonomy, ranking, bundle service, or evidence semantics changed.

## P0 Product UX - Lead Signal Interpretation (2026-09-14, approved)

The `CurrentSignalHero` now includes one compact, Korean-first interpretation block that keeps three meanings visibly and verbally separate:

- **관측된 사실**: composed Korean item+direct-attribute name plus the existing bundle's article count, `independentEvidenceClusterCount`, media count, and latest observed date. No image, Market, ranking, or inferred product direction enters this sentence.
- **아직 확인되지 않음**: deterministic presentation-only gaps derived from the exact attribute dimensions present or absent. A verified `DETAIL:STRIPE`, for example, leaves stripe width/spacing/direction unresolved; verified MATERIAL/COLOR values leave only execution variables such as weight/weave/finish or tone/color-blocking/application area unresolved. Missing silhouette, material/color, style, and commercial response remain explicitly unknown rather than being inferred.
- **기획 검토 질문**: one fixed human-review question, `“{Korean item+attribute name}” 조합을 다음 단계 상품 조사 대상으로 볼 것인가?`. It is not a recommendation, forecast, or sales claim.

Only the lead hero changed: the six `SpecificComboCard`s, bundle ranking, services, collectors, taxonomy, schema, Market logic, and empty Visual Diffusion reference list are untouched. The old separate hero count/date line was removed because the factual row now carries those fields, avoiding duplication. Focused smoke-test coverage asserts Korean-first naming, exact fact provenance, attribute-aware unknown generation, missing-date honesty, and non-generic material/color handling.

Validation from `apps/trend-dashboard/`: `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, and `git diff --check` passed. Playwright checks at 1440x1000 and 390x844 confirmed one lead-only interpretation block, all three semantic labels, Korean hero heading `스트라이프 셔츠`, six unchanged secondary cards, no page-level horizontal overflow, and no application console errors. The lead-only Korean fallback is explicitly accepted for this scoped change; shared display-label consistency remains a separate future cleanup so secondary-card naming is unchanged.

## P0 Product UX - Coverage vs Recent Direction (2026-09-14, approved)

The home dashboard now keeps cumulative editorial coverage, comparable recent direction, and freshness as separate meanings. This is presentation-only; no collector, query, ranking comparator, taxonomy, schema, Market logic, or database row changed.

- **Existing recent-direction metric, verified before implementation**: `EditorialTrendRow.change7dArticlePresence` is the absolute difference between distinct-article presence in two equal windows anchored to the latest `publishedAt` across the fashion-relevant editorial mention corpus: current `(anchor - 7 days, anchor]` minus previous `(anchor - 14 days, anchor - 7 days]`. It is neither percentage growth nor cumulative count. The live anchor is `2026-09-13T23:00:00.000Z`; therefore the compared UTC windows are `(2026-09-06T23:00:00Z, 2026-09-13T23:00:00Z]` and `(2026-08-30T23:00:00Z, 2026-09-06T23:00:00Z]`.
- **Supported levels**: this metric exists for every aggregate `EditorialTrendRow`, including broad `ITEM`, specific `SUB_ITEM`, and attribute dimensions such as `DETAIL`, `MATERIAL`, `COLOR`, and `STYLE`. It does **not** exist for an exact specificItem+attribute bundle. The lead bundle therefore says `최근 방향 — 판단 불가 / 조합 단위 비교값 없음`; it never borrows the broader SHIRT direction. Its separate `최신 관측` field displays `bundle.latestObservedAt`.
- **Classification**: only internally consistent comparable-window values are labelled: delta `> 0` = `증가`, `< 0` = `감소`, `= 0` = `유지`; missing or inconsistent current/previous/delta values = `판단 불가`. No percentage or arbitrary threshold was added.
- **Filtered-view limitation**: the existing UNI/WOMEN filter selects aggregate rows by gender evidence but does not recompute article/source breadth or comparable windows within that gender. To avoid a false claim, those views label coverage `전체 기준` and recent direction `판단 불가 / 성별 필터 단위 비교값 없음`. No service/filter refactor was introduced.
- **Terminology/UI**: `구체적으로 뜨는 조합` is now `구체적으로 관측된 조합`; `매거진에서 뜨는 유형` is now `관련 아이템·속성 흐름`. The related-flow description states that ordering remains cumulative article-presence-first. Each row now shows `관측 강도` (coverage label + cumulative articles/outlets) and `최근 방향` (direction + absolute delta + both window counts) in separate columns. The lead signal shows `관측 강도 / 최근 방향 / 최신 관측` above the unchanged FACT / UNKNOWN / PLANNING QUESTION structure.
- **Ordering unchanged**: related editorial rows remain sorted by cumulative `articlePresence`, then `sourceSpread`, `mentionCount`, and label. Exact bundles retain the documented frozen six-key evidence ordering. A focused regression proves a higher-coverage declining row still stays ahead of a lower-coverage increasing row.

Live default examples at implementation time: SHIRT `141 articles, 7 outlets, 56 current vs 48 previous, +8 증가`; SKIRT `96, 6, 34 vs 44, -10 감소`; VEST `36, 7, 11 vs 11, 0 유지`; CARDIGAN `29, 6, 7 vs 18, -11 감소`. These are editorial publication-count directions only, never sales, demand, store ranking, or commercial promise.

Focused smoke tests cover positive, negative, zero, missing, and inconsistent direction inputs; coverage wording independence; absence of `뜨는` in a declining presentation; and unchanged cumulative ordering. Rendered desktop/mobile checks and final typecheck/test/build/diff-check validation passed before commit.

## P1 Product UX - Unified Watchlist (2026-09-14, approved and implemented)

Merges the former always-open `CurrentSignalHero` (1 bundle) and the separate six-card `구체적으로 관측된 조합` block into one coherent "상품기획 워치리스트" of exactly 5 signals - a single, coherent presentation of the same underlying ranked bundle list instead of two visually distinct systems for the same data. Presentation-only: no ranking comparator, query, service, taxonomy, schema, collector, or database row changed.

- **Selection, not a new ranking**: `repeatedBundle` (the existing "genuinely, INDEPENDENTLY repeated" gate, `independentEvidenceClusterCount >= 2` - unchanged) stays the default-selected signal, exactly as it was always the hero before. The remaining slots are the next bundles in the SAME frozen sort (`bundleSourceSpread`, `publisherFamilySpread`, `independentEvidenceClusterCount`, `bundleArticlePresence`, `directAttributes.length`, `displayName` - untouched), sliced to 5 total. Live order at implementation time: 스트라이프 셔츠, 화이트 스커트, 체크 셔츠, 데님 쇼츠, 니트 가디건.
- **Compact row vs. selected detail**: each compact `WatchlistRow` shows only position, Korean composed name, 관측 강도 (existing dots/label), an article/source count line, 최신 관측, up to two attribute chips, and at most one small `ARTICLE_HERO` thumbnail with a PERSISTENT VISIBLE caption ("기사 이미지", never a hover-only tooltip - mobile has no dependable hover state). FACT/UNKNOWN/PLANNING QUESTION, the always-`판단 불가` 최근 방향 (exact bundles still have no valid comparable-window momentum - stated once at the Watchlist/detail level, never per row), and the English taxonomy subtitle stay exclusive to `SelectedSignalDetail` (renamed from `CurrentSignalHero`; identical content, single-column layout so it fits a ~56%-width desktop pane).
- **Commercial-rank disambiguation**: numeric row positions (01-05) are visual order markers only. A persistent line under the section heading states "관측 근거 기준 정렬 · 성장·판매 순위 아님" - no `HOT`/`TRENDING`/`급상승`/`TOP`/`1위`/`추천 순위` wording anywhere.
- **Naming consistency fix (same pass)**: `WatchlistRow` and the Watchlist button `aria-label`s now reuse `buildSignalInterpretation(bundle).signalName` - the SAME Korean-first composition `SelectedSignalDetail` already used - instead of raw `bundle.displayName`, so a row and its own open detail never show two different names for one bundle (e.g. the old "스트라이프 SHIRT" row next to a "스트라이프 셔츠" detail heading). This reused the existing lead-only fallback map in `src/lib/signal-interpretation.ts` (`leadSignalItemLabels`) rather than touching the shared `specificItemKoreanLabel` dictionary or `bundle.displayName` itself - `AttributeBundleCard`, `BundleHighlight`, `/items`, and the item detail page render exactly as before.
- **Layout**: desktop (`lg:` and up) renders a ~44%/56% two-column CSS Grid - a vertical row list and a persistent selected-detail pane, both visible together without scrolling past a giant hero first. Mobile renders a plain vertical single-open accordion (row tapped -> its own detail expands directly beneath it, closing whichever other detail was open); no horizontal carousel. Both breakpoints share one DOM structure (the single conditionally-rendered detail node is CSS-repositioned on desktop via explicit `grid-row`/`grid-column` placement, not duplicated).
- **Client/server boundary**: `src/components/Watchlist.tsx` (new, `"use client"`) holds only `selectedKey` state and receives pre-rendered `{ key, ariaLabel, row, detail }` ReactNode content from `src/app/page.tsx` (a Server Component) - it imports nothing from `attribute-bundle-service.ts` or any other Prisma-adjacent module, keeping ranking/service/DB code out of the client bundle by construction.

Files touched: `src/app/page.tsx`, `src/components/AttributeBundle.tsx` (both modified), `src/components/Watchlist.tsx` (new). No other file changed.

Validation: `corepack pnpm typecheck`, `corepack pnpm test` (smoke test), `corepack pnpm build` (all 16 routes), and `git diff --check` all passed. Rendered Playwright checks at 1440x1000 and 390x844 confirmed: exactly 5 Watchlist signals in the unchanged order above; Korean-first names identical between each compact row and its own detail; selecting row 2 then row 3 correctly swapped the detail each time (`aria-expanded` toggled, only one `role="region"` open at a time on both breakpoints); persistent "기사 이미지" label visible without hover; no horizontal overflow (`doc width == viewport width` on both); zero console/page errors; Visual Diffusion strip still renders nothing (still empty, untouched). One transient `next dev` Turbopack worker-spawn panic (Windows `0xc0000142`, on `globals.css`, a file untouched by this change) was investigated and confirmed to be an unrelated local-environment issue, not a regression - `next build`'s production compile passed cleanly throughout, and `next dev --webpack` rendered normally for all rendered-UI verification.

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
- `docs/VISUAL_FIRST_TREND_BOARD_AUDIT.md` - visual-first baseline audit and the `EditorialVisualContextStrip` implementation record.
- `docs/EDITORIAL_ORDERED_VISUAL_EVIDENCE_AUDIT.md` - per-source feasibility for real `DIRECT_BLOCK`/`ADJACENT_BLOCK` image evidence; proposed (design-only) ordered-block and human-reviewed-mood data shapes.
- `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` - repo-coverage audit and lane classification for Instagram/HBX/Musinsa-content/Coverchord sources; proposed (design-only) Visual Diffusion source model; Section 11 holds the 6 approved Instagram `MANUAL_CURATION` registry entries.
- `docs/MARKET_SOURCE_AUDIT.md`, `docs/KOREA_SOURCE_AUDIT.md` - Market source feasibility/status per site, including the Slam Jam/Stussy Shopify-JSON precedent `TREND_RESEARCH_SOURCE_REGISTRY.md` extends to Coverchord.
- `docs/CROSS_SOURCE_INDEPENDENT_SIGNAL_AUDIT.md`, `docs/COSMOPOLITAN_COLLECTION_AUDIT.md`, `docs/MARIECLAIRE_COLLECTION_AUDIT.md`, `docs/NON_HEARST_SOURCE_DIVERSITY_AUDIT.md` - per-source collection/integration passes.
- `docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md`, `docs/PRODUCT_ATTRIBUTE_REFERENCE_AUDIT.md` - Product Reference's own (frozen) history.
