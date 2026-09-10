# Editorial Refresh Operations

Checked date: 2026-09-09

How this dashboard's Editorial corpus stays current, and how it can keep doing so without a human repeatedly asking an agent to run collectors/reparse/audits by hand. This pass built and hardened a safe, idempotent, observable one-command refresh workflow. **It does not schedule anything** - per its own scope, scheduling is deliberately left for a follow-up pass after this document is reviewed.

## Current Architecture

### The real sequence, traced from the actual code (not assumed)

```
discover (per-source listing/sitemap/RSS walk, skipping already-known URLs)
  -> fetch article page
  -> parse (title/body/date/image via each source's own extractor)
  -> classify fashion relevance
  -> extract mentions (extractEditorialMentions)
  -> canonical upsert (EditorialPost, keyed on [source, externalPostId])
  -> mention refresh (delete + recreate EditorialMention rows for that post)
-- repeat per source, with per-source try/catch isolation --
-> [not run automatically] integrity audit (scripts/audit-editorial-quality.ts)
-> [computed on demand, not stored] bundle/signal derivation (getAttributeBundles, on every page render)
```

**Direct attribute relations and bundles are never persisted.** They are computed fresh from stored `EditorialPost.text` on every call to `getAttributeBundles()` - a page load, an audit script, or this refresh runner's own before/after snapshot. This means a routine data-only refresh can never leave stale relation/bundle data behind; there is nothing to leave stale.

### What already existed, reused as-is

- **`scripts/collect-korea-editorial.ts`** - the real per-source collector+upserter. Already had per-source `try/catch` isolation (Section "Failure Policy"), a `skipUrls` set to avoid re-fetching known URLs, and a **never-shrink body contract already applied uniformly to every source**, not just HYPEBEAST (see "Never-Shrink Body Contract" below). This pass refactored its per-source loop body into an exported `collectAndUpsertSource()` function so the new runner could call the exact same logic instead of duplicating it - `main()` still calls it in the same loop as before, unchanged CLI behavior.
- **`src/collectors/editorial/rss.ts`** - every one of the 8 source-specific collectors already raises `EditorialRateLimitedError` on HTTP 202/429/empty-body, and every listing-walk loop already does **partial-return-on-refusal** (stop and return what's already collected, never discard earlier pages). This is real, hardened behavior found in production incidents, not something this pass added - e.g. the code comment on `getHypebeastFashionEntries` documents a real 2026-09-07 incident where an unguarded throw discarded 31 already-read pages.
- **`scripts/audit-editorial-quality.ts`** - the existing, human-run integrity/quality report (duplicates, per-source density, data quality gates). Not imported by the new runner (kept independent to avoid risking a working, widely-referenced script), but its logic pattern is the direct model for the new `getEditorialRefreshSnapshot()` helper.
- **`src/config/editorial-sources.ts`** - `publisherFamily` is already centralized here (added in the prior ranking pass), not re-derived. The refresh runner's family-diverse metric reads `AttributeBundle.publisherFamilySpread` directly - no new mapping needed, satisfying Section 17 as "already true," not something to build.

### What this pass added

- **`scripts/collect-korea-editorial.ts`** - exported `collectAndUpsertSource()` (real logic, unchanged), added a `dryRun` option (skips only the write calls - `findUnique` reads still run for real, so dry-run reports accurate new-vs-updated counts), and **fixed a real entrypoint bug found during this pass's own validation** (see "Current Limitations").
- **`src/services/editorial-refresh-snapshot.ts`** - `getEditorialRefreshSnapshot()`: one read-only function returning the full before/after metric set (posts, mentions, duplicates, Market, bundles, trust-tier counts, current primary, per-source post counts/recency).
- **`src/services/editorial-refresh-policy.ts`** - pure, dependency-free decision logic: `classifySourceOutcome`, `checkZeroResultGuard`, `evaluateQualityGates`, `worstGateLevel`. No prisma, no network - unit-testable with plain fixtures.
- **`scripts/refresh-editorial.ts`** - the new orchestration runner (see "One-command Workflow").
- **`scripts/test-refresh-editorial.ts`** - the new test suite for the policy module (see "Tests").

## One-command Workflow

```bash
npx tsx scripts/refresh-editorial.ts [--dry-run] [--source=EYESMAG] [--days=90] [--limit-per-source=30] [--json] [--help]
# or, via package.json:
pnpm refresh:editorial -- [flags]
```

- **`--dry-run`** - real network discovery/fetch/parse per source (validates source health for real), zero DB writes. Reports what WOULD change.
- **`--source=X`** - refresh only one source (recovery/testing). Omit to refresh all 8 configured sources.
- **`--days=N`** - override the collection window (each collector's own default is currently 90 days if omitted).
- **`--limit-per-source=N`** - override the per-source article cap (default 30, matching `collect:korea-editorial`'s existing default).
- **`--json`** - also write a machine-readable report to `logs/editorial-refresh-report.json` (gitignored - `logs/` was already ignored before this pass; nothing new added to `.gitignore`).
- **`--help` / `-h`** - print usage and exit 0. Does nothing else: no DB preflight, no network, no collector call. See "2026-09-10 Addendum" below for why this is called out explicitly.
- **Any other/unrecognized argument** - fails fast with a non-zero exit code and prints usage, before any DB preflight, network request, or collector call. See addendum below.

Console report format:

```
=== EDITORIAL REFRESH COMPLETE ===
Sources: 7/8 success
New Posts: 12
Updated: 3
Mentions: 1496 -> 1540
Bundles: 46 -> 48
Independent Repeated: 9 -> 10
Multi-source: 8 -> 9
Family-diverse: 7 -> 8
Failures: HYPEBEAST_KR RATE_LIMITED - safely stopped
Current Signal: 체크 SHIRT
Quality gates: [PASS] canonical duplicates: 0 ...
```

## Source Matrix

| Source | Discovery | Active window | Access risk | Known caveats | Incremental-safe |
|---|---|---|---|---|---|
| EYESMAG | News sitemap (`.xml.gz`) | 90d | Low (public sitemap) | none disclosed beyond the general architecture | YES |
| HYPEBEAST_KR | HTML listing walk (`/fashion`, `/fashion/page/N`) | 90d | **Medium** - has produced real HTTP 202 during larger runs | Listing-walk already stops-and-returns-partial on refusal (real 2026-09-07 incident, already fixed in `rss.ts`) | YES, with the existing partial-return behavior - see "HYPEBEAST Special Case" |
| NONLABEL | HTML archive listing | 90d | Low | Smallest corpus (4-7 posts observed across this project's history) - naturally low volume, not a health signal | YES |
| VISLA | RSS feed | 90d | Low | Smallest-to-mid corpus | YES |
| ESQUIRE_KR | News sitemap | 90d | Low | Shares Hearst Joongang technical platform with HARPERSBAZAAR_KR/COSMOPOLITAN_KR | YES |
| HARPERSBAZAAR_KR | News sitemap | 90d | Low | Same platform as above | YES |
| COSMOPOLITAN_KR | News sitemap | 90d | Low | Same platform as above | YES |
| MARIECLAIRE_KR | Paginated RSS feed (`?paged=N`) | 90d | Low | Own collector (`collectMarieClaireKr`) hard-stops on 403/5xx (not just the shared `EditorialRateLimitedError` path) - a source-specific hardening already in place | YES |

All 8 are already collector-hardened enough for unattended incremental refresh. None requires new resilience work this pass.

## HYPEBEAST Special Case

Audited, not newly built. `getHypebeastFashionEntries` (rss.ts) already implements every behavior this task asked for: small pagination-driven batches, a `maxPages` ceiling (40), stop-on-refusal via `EditorialRateLimitedError`, and **partial return** of everything collected before the refusal - never a full-batch discard. This pass's own full-corpus smoke-test run (`npx tsx scripts/smoke-test.ts`) hit a real live HTTP 202 from HYPEBEAST_KR during this session and handled it exactly as designed: `"HYPEBEAST_KR fashion listing stopped early at page 2... refused automated request: HTTP 202"`, followed immediately by `Smoke test passed`. **The refresh pipeline can already invoke HYPEBEAST safely without a human** - no source-specific runner handling was needed beyond the general `classifySourceOutcome`/`RATE_LIMITED` path every source shares.

## DB / SQLite Write Safety

**Why writes can conflict with a running dev server:** SQLite's default rollback-journal mode takes an exclusive lock for the duration of a write transaction; a concurrent writer (or, in some SQLite configurations, even a concurrent long-lived reader) can see `SQLITE_BUSY`/"database is locked." Neither this project's `prisma/schema.prisma` nor its `DATABASE_URL` sets a WAL pragma or a busy-timeout explicitly, so Prisma's own defaults apply.

**Recommendation: do not change SQLite pragmas this pass** (explicitly forbidden - "Do NOT modify database pragmas casually" - and there is no evidence of a real, reproduced lock conflict from THIS refresh runner to justify it; the task's own premise references "previous work," not a finding from this pass). **The safest architecture available without a pragma change: run the refresh when the dev server on port 3001 is not actively serving a request, and never touch port 3000 (already an absolute rule).** For a manual/local workflow this is trivially satisfied (nothing else needs to be running at all - the whole point of a scheduled refresh is that no one is using the dashboard interactively at that moment). If a future pass finds real, reproduced lock contention against an ACTIVELY-used port 3001 server, WAL mode plus an explicit busy timeout is the standard, well-understood fix - deferred, not implemented, until there's real evidence it's needed.

**Port 3000 is never touched by this runner** - it contains no dev-server-launch or process-management code of any kind; it only calls prisma directly, exactly like every other script in `scripts/`.

## Idempotency

Verified, not assumed - during this pass's own live validation:

- Re-running `collect-korea-editorial.ts --source=NONLABEL` twice in a row (once via the runner's dry-run path calling real discovery, once directly) left `EditorialPost`/`EditorialMention` totals **exactly unchanged** the second time (376/1498 before and after), with `CANONICAL DUPLICATES: 0` and `MENTION DUPLICATES: 0` both times - the canonical `[source, externalPostId]` upsert key does its job.
- A repeated refresh with no new public articles cannot duplicate `EditorialPost` or `EditorialMention` (upsert + delete-then-recreate, both keyed on stable identity), cannot shrink a body (see below), cannot change canonical identity (the upsert key IS the canonical identity), and cannot touch `MarketRankingSnapshot` (no code path in any editorial collector or the new runner references the `marketRankingSnapshot` Prisma model at all).
- Relation/bundle counts ARE allowed to change between runs (real new evidence is real new evidence) - this is expected, not a violation of idempotency; what must stay deterministic is that the SAME stored text always produces the SAME derived relations, which `extractDirectAttributeRelations` already guarantees (a pure function of stored text, verified extensively across this project's whole audit-doc history).

## Never-Shrink Body Contract

**Applies to every current collector, not just HYPEBEAST** - confirmed by reading `collectAndUpsertSource`'s own logic directly, not assumed: `const keepExistingBody = (existing?.text?.length ?? 0) > (post.text?.length ?? 0)` runs for every source, unconditionally, before any upsert. The code's own comment traces the real originating incident (a HYPEBEAST multi-product roundup carrying more text in its RSS `content:encoded` than its article-page `post-body-content`) but the FIX was written generally, and a second existing script (`scripts/refresh-editorial-body.ts`) independently applies the identical rule. **One common contract already exists; no new work was needed here.**

## Refresh Phases (as actually implemented)

| Phase | What happens | Where |
|---|---|---|
| 1. Preflight | Read DB, capture BEFORE snapshot (posts/mentions/duplicates/Market/bundles/trust-tiers/primary/per-source recency) | `getEditorialRefreshSnapshot()`, called once at start |
| 2. Collect | Per source: discover (skipping known URLs) -> fetch -> parse -> classify. try/catch per source - one failure never stops the loop | `collectAndUpsertSource()` per source, in a plain `for` loop |
| 3. Canonical upsert | Embedded in Phase 2 - `[source, externalPostId]` upsert, never-shrink body/excerpt/image | same function |
| 4. Mention refresh | Embedded in Phase 2 - delete+recreate `EditorialMention` for touched posts only (see "Incremental Mention Parsing") | same function |
| 5. Integrity audit | AFTER snapshot; canonical/mention duplicate counts | `getEditorialRefreshSnapshot()`, called again at end |
| 6. Signal recompute | Bundle/trust-tier/primary delta, real `getAttributeBundles`/`selectPrimaryPlanningBundle`, unmodified | same snapshot call (bundles are always computed fresh, never stale) |
| 7. Report | Quality gates + console report + optional JSON | `evaluateQualityGates()` + `refresh-editorial.ts`'s own print/write logic |

## Failure Isolation

| Case | Classification | Reasoning |
|---|---|---|
| HTTP 202 | SKIP_SOURCE (via `RATE_LIMITED`) | Already raised as `EditorialRateLimitedError` by every collector; partial results (if any) already saved by the collector's own stop-and-return behavior |
| HTTP 403 | SKIP_SOURCE | Same generic `FAILED` classification as any other exception - conservative, uniform handling rather than a message-sniffing heuristic that could misclassify |
| HTTP 429 | SKIP_SOURCE (via `RATE_LIMITED` if the collector raises `EditorialRateLimitedError` for it, else generic `FAILED` - both land on SKIP_SOURCE either way) | Same |
| Timeout | SKIP_SOURCE | Same |
| Parser returns zero unexpectedly | Not an exception - handled by the **zero-result guard**, not `classifySourceOutcome` | See below |
| Body extraction collapse | Same as above if it manifests as 0 posts; SKIP_SOURCE if it manifests as a thrown error | - |
| Listing structure change | Same as above | - |
| DB write failure | **STOP_ENTIRE_RUN** (orchestration-level, not per-source) | Surfaces in the runner's own top-level `try/catch` around Phase 1's preflight snapshot read - if the DB itself is unreachable, no per-source work can proceed meaningfully |

**Every per-source failure classification is SKIP_SOURCE - never STOP_ENTIRE_RUN.** This is a deliberate, absolute rule (Section 8: "one failed source should not destroy successful updates from other sources"), tested explicitly in `scripts/test-refresh-editorial.ts` across 4 different synthetic error messages.

## Zero-Result Guard

Implemented in `checkZeroResultGuard()`. Fires (WARN, never an automatic action) only when a source with prior history returns 0 new posts on a run that otherwise completed successfully, AND its most recent stored article has gone stale beyond a conservative 21-day threshold (three missed weekly cycles at the recommended cadence, not one - chosen to avoid false alarms on an ordinary slow week). Uses only data already captured in the before/after snapshot - no new collector introspection was needed. A source's first-ever run, or a source that already failed/rate-limited this run, never also triggers this guard (avoids double-reporting the same underlying issue two different ways).

## Quality Gates

| Gate | Trigger | Level |
|---|---|---|
| Canonical duplicates | `> 0` | FAIL |
| Mention duplicates | `> 0` | FAIL |
| EditorialPost count | decreases | FAIL |
| Market untouched | `MarketRankingSnapshot` count changes at all | FAIL |
| Zero-result sources | any source returned 0 new posts this run | WARN (informational - see the per-source zero-result guard for whether it's actually concerning) |
| Bundle count stability | `>=25%` swing either direction | WARN |
| Source availability | every source failed | FAIL (likely systemic - network/DB - not independent flakiness) |

The 25% bundle-swing threshold is an explicit judgment call, documented as such in code - no historical multi-run baseline exists yet to derive a statistically-grounded number from. `worstGateLevel()` reduces the gate list to one overall PASS/WARN/FAIL; only FAIL sets a non-zero exit code.

## Refresh Cadence

**Source-specific, not one global number** - recommended from each source's own observed publish density across this project's audit history (not this pass's own new discovery):

- **Weekly** for most sources (EYESMAG, HYPEBEAST_KR, ESQUIRE_KR, HARPERSBAZAAR_KR, COSMOPOLITAN_KR, MARIECLAIRE_KR) - each has repeatedly shown several-posts-per-week density in every prior audit's per-source table, comfortably inside a 90-day window with room to spare; a weekly cadence keeps the "recency" trust signal (the saturation audit's Section 14 finding: all trust-tier bundle evidence is currently <=7 days old) intact without excess request volume.
- **Weekly or biweekly** for VISLA and NONLABEL - both are the corpus's lowest-volume sources by a wide margin (6 and 4 posts respectively as of this pass's baseline); a tighter cadence buys little.
- HYPEBEAST_KR's known 202-risk is not itself a reason for a DIFFERENT cadence - the existing partial-return behavior already absorbs it regardless of how often the refresh runs; a gentler cadence reduces how OFTEN that risk is exercised, not whether it's handled safely when it is.

## Collection Horizon

**90 days remains correct; do not shrink it this pass.** Every collector already does incremental discovery *within* that window (via `skipUrls`, computed from existing stored URLs before any fetch) - a routine refresh already does not re-process known articles, regardless of the window size. The 90-day figure controls how far back DISCOVERY walks looking for anything NOT yet known (protects against a long gap between refreshes, or a source's RSS/sitemap briefly omitting an article that a later walk would still catch), not how much work a normal refresh does. No collector currently exposes a narrower "just today" discovery mode, and building one is exactly the kind of collector-code change this task's Section 15 says not to make "unless current collectors already support it or change is clearly worthwhile" - neither is true here.

## Incremental Mention Parsing

**Already incremental at the per-post level, not a full 373-post reparse.** `collectAndUpsertSource` only recomputes `EditorialMention` rows for posts it actually touches this run (new or updated); every other post's mentions are left untouched. A SEPARATE, FULL corpus reparse (`scripts/reparse-editorial-mentions.ts`, network-free, DB-only) exists and remains correct - but it is explicitly Category B (parser/taxonomy maintenance), run only after a `mentions.ts`/`attribute-relations.ts` code change, never as part of routine data refresh. At the current 373-post scale, a full reparse takes on the order of seconds (network-free), so "full deterministic reparse may actually be safer" (Section 16) is true FOR THAT SEPARATE WORKFLOW - but it is not what routine data refresh does or should do, since routine refresh never touches parsing rules at all.

## Publisher Family Map

Already centralized in `src/config/editorial-sources.ts` (`EditorialSourceConfig.publisherFamily`, added in the prior ranking pass, unchanged this pass) - config-level TypeScript, no Prisma field. The refresh snapshot reads `AttributeBundle.publisherFamilySpread` (already a computed field on every bundle) directly; no new mapping or lookup was built.

## Roundup Heuristic

Frozen, per this pass's own explicit scope (Section 18: "this code stays frozen. Add only regression/sanity checks if missing. No redesign."). No new regression test was added for it specifically this pass - the existing `smoke-test.ts` already carries multiple real-data fixtures for `countIndependentEvidenceClusters`'s roundup/absorption behavior (documented extensively in that function's own code comments and exercised on every `pnpm test` run), and the category-coverage-gap pass immediately prior to this one (`docs/EDITORIAL_CATEGORY_COVERAGE_GAP_AUDIT.md`) is itself a real, recent, high-fidelity regression check of this exact mechanism (it found and fully documented a genuine interaction between new item recognition and roundup-breadth classification). No gap was found that needs a new sanity check added.

## Bundle-Key Fragmentation Lesson - Hard Operational Rule

**Automated refresh must NEVER modify taxonomy.** The category-coverage-gap pass proved, with real data, that even a 100%-precision taxonomy change can silently fragment an existing multi-source bundle (via exact-attribute-set bundle keys) or reclassify an unrelated bundle's independence (via the roundup-breadth heuristic) - side effects invisible to any pre-implementation analysis. This refresh runner's own code has no path that can add an item/attribute canonical: it imports only `collectEditorialFeed`, `extractEditorialMentions`, prisma, and its own snapshot/policy modules - never `mentions.ts`'s rule array as a write target. Any taxonomy change requires a **separate branch/pass, a before/after trust-tier comparison (exactly the methodology this whole audit-doc chain already uses), and manual human approval** - never bundled into a routine data refresh, automated or not.

## Runner Design

No existing single command performed a complete refresh before this pass (`collect:korea-editorial` collects but does not audit, gate, or report signal deltas). Implemented the smallest orchestration layer that reuses 100% of the existing collection logic: `scripts/refresh-editorial.ts` imports `collectAndUpsertSource` (unchanged real logic) and the two new snapshot/policy modules; it contains no collector or parser code of its own.

## Dry-Run Mode

Implemented cleanly, without a transaction simulator: `collectAndUpsertSource(source, { dryRun: true })` still performs the real network discovery/fetch/parse and the real `findUnique` classification read (so dry-run reports an accurate new-vs-updated count and genuinely validates source health), but skips the `upsert`/`deleteMany`/`createMany` write calls entirely. Verified live: a `--dry-run --source=VISLA` run left `EditorialPost`/`EditorialMention` totals bit-for-bit identical before and after.

## Source Filter

`--source=EYESMAG` (or any of the 8 configured source names) restricts a run to one source - useful for recovery after a single source's incident, or for testing. Unknown source names are rejected with a clear error before any work starts. Matches this repo's existing `--source=` convention already used by `collect-korea-editorial.ts` itself.

## Reporting

- **Human-readable**: printed to stdout in every run, matching the format in "One-command Workflow" above.
- **Machine-readable**: `logs/editorial-refresh-report.json` (only when `--json` is passed) - `logs/` was already gitignored before this pass; nothing new was added to `.gitignore`. Never committed; a future scheduler/monitor could read this file, but none was built this pass.

## Scheduler Environment Audit

**SQLite location, verified directly, not assumed:** `DATABASE_URL="file:./dev.db"` in `.env`, resolving to `apps/trend-dashboard/prisma/dev.db`. `.gitignore` already excludes `prisma/dev.db`, `prisma/dev.db-journal`, `prisma/dev.db-wal`, `prisma/dev.db-shm` - **the real database is local-only, untracked, and not deployed anywhere.** No Dockerfile, `vercel.json`, or any other deployment config exists anywhere in this app directory, and the README makes no deployment claims - this is confirmed to be a local-first, unhosted app (consistent with the parent monorepo's own "local-first, agent-agnostic design engine" framing in the root `README.md`).

**This single fact rules out cloud-based scheduling entirely for the purpose this task cares about** ("stay current" meaning the LOCAL dashboard a person actually looks at): a GitHub Actions runner (or any other cloud scheduler) would operate against its own ephemeral, empty database - any collection it performed would vanish when the job ends, never reaching the real `dev.db` this machine's `next dev`/`next start` actually serves from. Recommending GitHub Actions here would be recommending it "merely because it is convenient" - exactly what this task's own Section 25 warns against.

**Environment/secrets:** every currently-configured Editorial source (`EYESMAG`, `HYPEBEAST_KR`, `NONLABEL`, `VISLA`, `ESQUIRE_KR`, `HARPERSBAZAAR_KR`, `COSMOPOLITAN_KR`, `MARIECLAIRE_KR`) is a public RSS/sitemap/HTML source, fetched with a fixed User-Agent string (`"TrendSignalDashboard/0.1 (+editorial source audit)"`, hardcoded in `rss.ts`) - **no API key, token, or credential of any kind is required.** `.env`'s only real secret-shaped variables (`NAVER_API_KEY_ID`, `NAVER_API_KEY`) belong to the unrelated Naver Trends collector, currently disabled (`ENABLE_NAVER_TRENDS="false"`) and never touched by `refresh-editorial.ts`. Automation can run with zero secrets configured.

## Recommended Operating Model

**A. One-command manual refresh for now**, run locally on this machine (Windows) as `pnpm refresh:editorial` (optionally with a Windows Task Scheduler entry wrapping the exact same command, once this pass is reviewed - **not created in this pass**, per Section 33's explicit instruction).

**Why:** the SQLite persistence finding above is decisive - only something running ON this machine, against this machine's real `dev.db`, can actually update the data the dashboard serves. That collapses the realistic choices to "B: Windows scheduled local refresh" or "A: one-command manual refresh," which differ only in WHO presses the button, not in architecture. A is recommended as the CURRENT step specifically because Section 33 forbids creating the actual scheduled task in this pass - B is the natural next pass once this workflow has been used/reviewed at least once for real.

**Why not the alternatives:**
- **C. GitHub Actions** - ruled out structurally (see above), not by preference.
- **D. Deployment-side cron** - not applicable; there is no deployment.

## Automation Boundary

**Safe to automate** (Category A - Normal Data Refresh): running `scripts/refresh-editorial.ts` on a schedule, with no code/taxonomy changes between runs. Idempotent, gated, reported, fully within this pass's implementation.

**Never automate** (Category B - Parser/Taxonomy Maintenance, human-reviewed only):
- Any edit to `src/collectors/editorial/mentions.ts` (item/attribute taxonomy) or `attribute-relations.ts` (extraction/boundary logic).
- Any edit to `attribute-bundle-service.ts`'s sort/ranking logic.
- Any new source addition (`src/config/editorial-sources.ts` + a new collector function in `rss.ts`).
- Running `scripts/reparse-editorial-mentions.ts` (full corpus reparse) - only ever justified immediately after a taxonomy/parser code change, which is itself Category B.
- Any Product Reference work.

This is the direct, hard-operational-rule consequence of the bundle-key-fragmentation finding (see above) - not a new discovery this pass, a formalization of it.

## Current Data (this pass's own before/after)

Validated live during this pass (see "Idempotency" and "Dry-Run Mode" above for the exact runs). **One real incident occurred and was fixed during this pass's own validation - disclosed in full below**, not omitted.

## Current Limitations

- **A real bug was found and fixed during this pass's own dry-run validation.** `collectAndUpsertSource` was exported from `collect-korea-editorial.ts` for the new runner to import, but that file's own `main()` was still called unconditionally at module scope - meaning simply IMPORTING the file (as the new runner does) also re-ran the file's OWN CLI entrypoint, reading the SAME shared `process.argv`. The first live test of `refresh-editorial.ts --dry-run --source=NONLABEL` silently triggered a second, real, uncontrolled `collect-korea-editorial.ts` run for NONLABEL via this exact path, **writing 3 real posts and 2 mention rows to the database despite `--dry-run`** (confirmed via `audit-editorial-quality.ts`: `TOTAL POSTS` moved 373 -> 376 before any deliberate collection this pass). No data corruption resulted (0 canonical/mention duplicates both before and after, and the 3 posts are genuine, legitimately-collected NONLABEL content) - the posts were kept rather than deleted, consistent with this project's "never discard real work" principle, but this was a genuine, disclosed process incident, not a clean pass. **Fixed** with a standard Node ESM entrypoint guard (`import.meta.url` compared against `pathToFileURL(realpathSync(process.argv[1])).href`) - re-verified live afterward: an identical dry-run against a different source (VISLA) left post/mention counts bit-for-bit unchanged.
- SQLite lock-conflict risk against an actively-used port 3001 dev server is discussed but not reproduced or fixed this pass - no WAL/busy-timeout change was made, per the explicit "do not modify pragmas casually" instruction and the lack of a reproduced incident from this pass's own work.
- No scheduler (Windows Task Scheduler entry, cron, or otherwise) was created - by design, per Section 33.
- The bundle-count-swing quality gate's 25% threshold is a documented judgment call, not derived from multiple historical refresh runs (none exist yet to derive it from).

## Data Safety

- EditorialPost/EditorialMention: legitimately grew by the incident above (373->376 / 1496->1498) plus this pass's own deliberate dry-run/validation collection - no fabricated or corrupted rows; 0 canonical and 0 mention duplicates confirmed throughout.
- MarketRankingSnapshot: **667, unchanged** - no code path in this pass's new modules references the Market model at all.
- No taxonomy, ranking, Product Reference, or UI change.
- No Prisma schema/migration change.

## Validation

- `npx tsc -b --noEmit`: clean.
- `npx tsx scripts/test-refresh-editorial.ts`: passes (source classification across 4 failure-message fixtures, zero-result guard across 5 scenarios, all 7 quality gates, report JSON-serialization shape, taxonomy-isolation import-boundary check).
- `npx tsx scripts/smoke-test.ts`: passes unchanged - this pass touches no parser/taxonomy/ranking code path smoke-test.ts exercises.
- Live validation (not mocked): `--dry-run --source=NONLABEL` (initially exposed the entrypoint bug), `--dry-run --source=VISLA` (confirmed the fix, zero mutation), direct `collect-korea-editorial.ts --source=NONLABEL` invocation (confirmed idempotent re-run: identical totals, 0 duplicates).
- No build was required (no Next.js route/UI code touched); Product Reference frozen regression is unaffected (this pass's new code shares no import path with `product-reference/`, structurally verified in `test-refresh-editorial.ts`'s taxonomy-isolation check).

## 2026-09-10 Addendum: CLI Argument Hardening

**What happened:** an agent session ran `corepack pnpm refresh:editorial --help`, intending only to check usage. The runner's argv parsing at the time was an ad-hoc scan (`process.argv.find(...)`/`.includes(...)` against known flag names) with no "unknown argument" case at all - `--help` simply matched none of the known flags, fell through unchanged, and the runner proceeded to a full **LIVE** collection run (the default when `--dry-run` is absent), for real, against all 8 sources, exactly as if `--help` had never been typed. The run was interrupted (`TaskStop`) roughly 2m51s in, after 5 of 8 sources had completed.

**Data impact (verified read-only afterward, not assumed):**
- `EditorialPost`: 521 -> 617 (+96), all `createdAt` between 2026-09-10T00:33:37Z and 00:36:28Z. Per-source: HYPEBEAST_KR +6, EYESMAG +2, ESQUIRE_KR +30, HARPERSBAZAAR_KR +30, COSMOPOLITAN_KR +28. VISLA/NONLABEL/MARIECLAIRE_KR +0 - the interrupt landed cleanly between sources (MARIECLAIRE_KR is last in `editorialSources` order and never started), not mid-source.
- `EditorialMention`: 2199 -> 2781 (+582 total across the run; 699 rows carry today's `createdAt`, consistent with mention-refresh-on-upsert for both new and previously-existing posts touched this run).
- Quality, re-checked directly against the DB: 0 canonical URL duplicates (checked across the full table), 0 mention duplicates, 0 empty bodies/titles/URLs among the 96 new posts, 0 future-dated posts, bundles grew 65 -> 89 with 20 repeated (>=2 articles) - no signal collapse.
- **`MarketRankingSnapshot` (dataMode="real"): 667, confirmed unchanged** - this runner has no code path touching Market, and the `real`-scoped population's own `createdAt` range (2026-08-28 to 2026-09-02) predates the incident entirely. (A separate, momentary false alarm during investigation - an *unfiltered* raw count of 3259 - turned out to be 667 real rows plus 2592 pre-existing `dataMode="sample"` seed rows from a single 2026-08-28 bulk load, unrelated to this incident. Documented here only so a future session doesn't re-investigate the same non-issue.)
- **Disposition: the 96 extra posts and their mentions were kept, not reverted** - same "never discard real, legitimately-collected work" principle as the entrypoint-bug incident above. The corpus is simply ~15 hours fresher than the prior scheduled run's own report claimed.

**Fix:** argv parsing was extracted out of `refresh-editorial.ts` entirely, into a new pure module, **`src/services/editorial-refresh-cli.ts`** (`parseRefreshCliArgs`, `REFRESH_CLI_USAGE`) - no prisma, no network, no `process.exit`, same rationale/pattern as `editorial-refresh-policy.ts`. It returns a discriminated union (`"help" | "error" | "run"`) that the runner's `main()` must branch on as the literal first thing it does, before any `console.log`, DB preflight, or collector call:
- `--help` / `-h` -> print `REFRESH_CLI_USAGE` (+ the live known-sources list) and exit 0. Takes priority even if an unknown token is present alongside it, matching common CLI convention that help must always be reachable.
- Any token that is not one of the known flags (`--dry-run`, `--json`, `--help`, `-h`, `--source=`, `--days=`, `--limit-per-source=`) -> `"error"`, printed to stderr with usage, exit code 1. This is the actual fix: what used to silently fall through to a live run now fails fast, structurally, before the function even returns to `main()`.
- A non-numeric `--days=`/`--limit-per-source=` value is also a fail-fast error (previously would have silently produced `NaN` and been passed on to the collector).
- All previously-supported flags (`--dry-run`, `--source=X`, `--days=N`, `--limit-per-source=N`, `--json`) parse identically to before - regression-tested explicitly, including the scheduled wrapper's exact real invocation (`--json` alone).

**Validation performed (no live refresh run):**
- `npx tsx scripts/test-refresh-editorial.ts`: new `verifyCliArgParsing()` covers the exact incident case (`--help` must be `"help"`, never `"run"`), `-h`, `--help` alongside an unknown token, unknown flags (bare and `--key=value`), non-numeric numeric-flag values, the full default set, all flags combined, and the scheduled wrapper's literal `--json`-only invocation. Passes.
- `npx tsc -b --noEmit`: clean.
- `--help` and an unknown flag (`--bogus-flag`) were actually executed live (safe to do now: both paths structurally return before any DB/network code runs) - confirmed exit 0 / usage text, and exit 1 / usage text + error, respectively, both instantaneous, neither triggering a collection.
- `--dry-run` itself was **not** executed live during this hardening pass, on purpose - per its own documented behavior above, `--dry-run` still performs real network requests (only DB writes are skipped), and this pass's instruction was explicitly not to run another real refresh. Its behavior is covered by the unit test's `combined`/`wrapperInvocation` assertions instead.
- Windows Task Scheduler entry (`Wakiwilly Trend Dashboard - Editorial Refresh`) re-checked afterward: `Ready`, enabled, next run unchanged (2026-09-14 08:30 KST). The wrapper script (`scripts/run-scheduled-refresh.ps1`) was not modified and still invokes the exact same `corepack pnpm refresh:editorial --json`.

## Next Step

**Do not schedule yet, per this pass's own explicit scope.** Once this document and the runner have been reviewed, the concrete next pass is: create ONE Windows Task Scheduler entry running `pnpm refresh:editorial` (optionally `--json` for a persisted report trail) on the weekly cadence recommended above, and decide then whether `--json` output should feed any future lightweight monitoring. Not built here.
