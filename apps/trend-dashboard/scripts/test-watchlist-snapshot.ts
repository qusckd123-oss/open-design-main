import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { businessDayKey } from "../src/lib/business-time";
import type { AttributeBundle } from "../src/services/attribute-bundle-service";
import { selectRepeatedBundle, selectWatchlistBundles, WATCHLIST_ALGORITHM_VERSION } from "../src/services/watchlist-selection";
import { buildSnapshotItems, buildWatchlistSnapshotData, selectLatestSnapshotForDate } from "../src/services/watchlist-snapshot-service";

/**
 * Tests for the Watchlist snapshot foundation (Phase 6A). Deliberately
 * mock/fixture-based - NO live network, NO database connection at all (this
 * repo's DATABASE_URL currently points at the production Neon database - see
 * .env.example - so this suite must never reach for `prisma` at all, unlike
 * scripts/smoke-test.ts's TEST-prefixed fixture-row convention). Every
 * function under test here (watchlist-selection.ts, and the pure half of
 * watchlist-snapshot-service.ts) is intentionally I/O-free so this is
 * possible - see those modules' own doc comments.
 *
 * Usage: npx tsx scripts/test-watchlist-snapshot.ts
 */

function bundle(overrides: Partial<AttributeBundle> & { key: string; specificItem: string }): AttributeBundle {
  return {
    displayName: overrides.specificItem,
    directAttributes: [],
    bundleArticlePresence: 1,
    bundleSourceSpread: 1,
    independentEvidenceClusterCount: 1,
    latestObservedAt: new Date("2026-09-20T00:00:00Z"),
    evidenceArticles: [],
    publisherFamilySpread: 1,
    ...overrides
  };
}

function verifyWatchlistSelectionMatchesResolver() {
  // Bundles are pre-sorted exactly as getAttributeBundles would return them
  // (source spread desc, then cluster count, etc.) - selection must never
  // re-sort, only pick+reorder.
  const checkShirt = bundle({ key: "SHIRT#DETAIL:CHECK", specificItem: "SHIRT", independentEvidenceClusterCount: 3, bundleSourceSpread: 3 });
  const stripeSkirt = bundle({ key: "SKIRT#DETAIL:STRIPE", specificItem: "SKIRT", independentEvidenceClusterCount: 1, bundleSourceSpread: 2 });
  const toteBag = bundle({ key: "TOTE_BAG#MATERIAL:RECYCLED_FABRIC", specificItem: "TOTE_BAG", independentEvidenceClusterCount: 2, bundleSourceSpread: 1 });
  const singleton = bundle({ key: "VEST#COLOR:BLACK", specificItem: "VEST", independentEvidenceClusterCount: 1, bundleSourceSpread: 1 });
  const sorted = [checkShirt, stripeSkirt, toteBag, singleton];

  // The repeated pick must be the first bundle with independentEvidenceClusterCount >= 2 IN SORT ORDER, never a different one.
  const repeated = selectRepeatedBundle(sorted);
  assert.equal(repeated?.key, checkShirt.key, "the repeated-bundle pick must be the first bundle (in the pre-sorted order) with independentEvidenceClusterCount >= 2.");

  const watchlist = selectWatchlistBundles(sorted);
  assert.equal(watchlist.length, 4, "all 4 bundles must be included when there are <= 5.");
  assert.deepEqual(
    watchlist.map((b) => b.key),
    [checkShirt.key, stripeSkirt.key, toteBag.key, singleton.key],
    "the repeated pick must be first; every other bundle must keep its original relative (pre-sorted) order - never re-sorted by this selection step."
  );

  // No qualifying bundle -> empty Watchlist (the page falls back to the tile grid; this function has no grid opinion, just returns []).
  const noRepeats = [stripeSkirt, singleton];
  assert.equal(selectRepeatedBundle(noRepeats), null, "with no bundle at independentEvidenceClusterCount >= 2, there must be no repeated pick.");
  assert.deepEqual(selectWatchlistBundles(noRepeats), [], "with no repeated bundle, the Watchlist selection must be empty - never falling back to bundles[0].");
}

function verifyTopFivePersistedInOrder() {
  const bundles: AttributeBundle[] = Array.from({ length: 8 }, (_, i) =>
    bundle({ key: `ITEM_${i}#DETAIL:X`, specificItem: `ITEM_${i}`, independentEvidenceClusterCount: i === 0 ? 2 : 1 })
  );
  const watchlist = selectWatchlistBundles(bundles);
  assert.equal(watchlist.length, 5, "the Watchlist must never exceed 5 items even when more bundles qualify for the tail slots.");

  const items = buildSnapshotItems(watchlist, selectRepeatedBundle(bundles));
  assert.equal(items.length, 5, "buildSnapshotItems must persist exactly as many rows as were selected - no silent truncation/expansion.");
  assert.deepEqual(items.map((i) => i.rank), [1, 2, 3, 4, 5], "rank must be assigned 1..N by position, matching WatchlistRow's own `position` prop.");
  assert.deepEqual(items.map((i) => i.bundleKey), watchlist.map((b) => b.key), "item order (by bundleKey) must exactly match the selected Watchlist order - never reordered again during shaping.");
  assert.equal(items[0]!.isPrimarySignal, true, "the featured/repeated bundle must be flagged isPrimarySignal on its own row.");
  assert.ok(items.slice(1).every((i) => i.isPrimarySignal === false), "no row other than the featured bundle may be flagged isPrimarySignal.");
}

function verifySignalNameMatchesUiInterpretation() {
  // WatchlistRow/SelectedSignalDetail both render buildSignalInterpretation(bundle).signalName,
  // never the raw bundle.displayName (see src/components/AttributeBundle.tsx) - the persisted
  // signalName must match that exactly, not fall back to displayName.
  const checkShirt = bundle({ key: "SHIRT#DETAIL:CHECK", specificItem: "SHIRT", displayName: "체크 SHIRT", directAttributes: [{ type: "DETAIL", value: "CHECK", articlePresence: 3, sourceSpread: 3 }], independentEvidenceClusterCount: 3, bundleSourceSpread: 3 });
  const [item] = buildSnapshotItems([checkShirt], checkShirt);
  assert.equal(item!.signalName, "체크 셔츠", "signalName must be the Korean-first composed name buildSignalInterpretation produces, not bundle.displayName verbatim.");
  assert.equal(item!.displayName, "체크 SHIRT", "displayName is still persisted separately as the raw bundle.displayName, for reference.");
  assert.ok(item!.observedFact.length > 0 && item!.planningQuestion.length > 0, "FACT/PLANNING QUESTION must be persisted verbatim from the interpretation, not left empty.");
  assert.equal(item!.directionStatus, "NOT_COMPARABLE", "a bundle-grain row has no comparable direction today - must be the explicit constant, never an invented value.");
}

function verifyBusinessDateCorrectness() {
  // 2026-09-15T05:49:18Z is 14:49:18 in Seoul -> Seoul calendar day is 2026-09-15.
  const midday = new Date("2026-09-15T05:49:18.000Z");
  assert.equal(businessDayKey(midday), "2026-09-15");

  // 2026-09-15T16:00:00Z is 2026-09-16 01:00 in Seoul -> Seoul calendar day rolls to 2026-09-16,
  // even though the UTC calendar day is still 2026-09-15. This is exactly the case a naive
  // `.toISOString().slice(0, 10)` would get wrong.
  const justAfterMidnightKst = new Date("2026-09-15T16:00:00.000Z");
  assert.equal(businessDayKey(justAfterMidnightKst), "2026-09-16", "businessDate must use the Asia/Seoul calendar day, not the UTC calendar day.");

  const data = buildWatchlistSnapshotData([], { count: 0, latestPublishedAt: null }, { dataMode: "real", gender: "all", now: justAfterMidnightKst });
  assert.equal(data.businessDate, "2026-09-16", "buildWatchlistSnapshotData must derive businessDate via businessDayKey(now), never a UTC-slice shortcut.");
}

function verifyAlgorithmVersionPersisted() {
  assert.equal(WATCHLIST_ALGORITHM_VERSION, "watchlist-v1", "a deliberate, hand-bumped provenance string - this exact test intentionally fails if the constant is renamed/bumped without updating this assertion, forcing a conscious review.");
  const data = buildWatchlistSnapshotData([], { count: 12, latestPublishedAt: null }, { dataMode: "real", gender: "uni", now: new Date("2026-09-21T00:00:00Z") });
  assert.equal(data.algorithmVersion, WATCHLIST_ALGORITHM_VERSION, "every snapshot payload must stamp the current algorithmVersion constant, never a hardcoded/stale string.");
  assert.equal(data.dataMode, "real");
  assert.equal(data.gender, "uni", "input scope (gender) must be persisted on the header exactly as passed in.");
  assert.equal(data.sourceEditorialPostCount, 12, "source freshness context must be persisted on the header, not silently dropped.");
}

function verifyRepeatedSameDayCapturePolicy() {
  // selectLatestSnapshotForDate is the read-time "latest for a date" rule -
  // append-only means the DB layer never deduplicates by businessDate itself,
  // so this pure selection is what a future Archive read path must use.
  const day = "2026-09-21";
  const earlier = { id: "a", capturedAt: new Date("2026-09-21T00:30:00Z"), businessDate: day };
  const later = { id: "b", capturedAt: new Date("2026-09-21T09:00:00Z"), businessDate: day };
  const evenLater = { id: "c", capturedAt: new Date("2026-09-21T09:00:00.001Z"), businessDate: day };

  assert.equal(selectLatestSnapshotForDate([earlier, later])?.id, "b", "the later capturedAt must win.");
  assert.equal(selectLatestSnapshotForDate([later, earlier, evenLater])?.id, "c", "order of the input array must not matter - the greatest capturedAt always wins, regardless of position.");
  assert.equal(selectLatestSnapshotForDate<typeof earlier>([])?.id, undefined, "an empty list has no latest snapshot.");
  assert.equal(selectLatestSnapshotForDate([earlier])?.id, "a", "a single snapshot is trivially its own latest.");
}

function verifyNoMutationOfEditorialOrMarketTables() {
  // Structural boundary check, same technique scripts/test-refresh-editorial.ts
  // already uses for its own taxonomy-isolation guarantee: assert by IMPORT/
  // CALL SHAPE, not by running anything against a real database.
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const serviceSource = readFileSync(path.join(thisDir, "..", "src", "services", "watchlist-snapshot-service.ts"), "utf8");
  const cliSource = readFileSync(path.join(thisDir, "snapshot-watchlist.ts"), "utf8");

  for (const table of ["editorialPost", "editorialMention", "marketRankingSnapshot", "marketProduct"]) {
    for (const writeVerb of [".update(", ".upsert(", ".delete(", ".deleteMany(", ".updateMany(", ".create("]) {
      assert.ok(!serviceSource.includes(`${table}${writeVerb}`), `watchlist-snapshot-service.ts must never call prisma.${table}${writeVerb} - the snapshot writer must only ever READ Editorial/Market tables, never write to them.`);
    }
  }

  for (const forbiddenWriteVerb of [".update(", ".upsert(", ".delete(", ".deleteMany(", ".updateMany("]) {
    assert.ok(!serviceSource.includes(`watchlistSnapshot${forbiddenWriteVerb}`), `watchlistSnapshot${forbiddenWriteVerb} must never appear - WatchlistSnapshot rows are append-only (create-only).`);
    assert.ok(!serviceSource.includes(`watchlistSnapshotItem${forbiddenWriteVerb}`), `watchlistSnapshotItem${forbiddenWriteVerb} must never appear - WatchlistSnapshotItem rows are append-only (create-only, via the parent's nested create).`);
  }
  assert.ok(serviceSource.includes("prisma.watchlistSnapshot.create("), "the writer must persist via exactly prisma.watchlistSnapshot.create (a single nested-write create), the one write path this suite verifies is append-only.");

  // The CLI must never write in --dry-run mode - assert by control flow shape:
  // the dry-run branch must return before captureWatchlistSnapshot (the only
  // write path) is ever reached.
  const dryRunBranch = cliSource.slice(cliSource.indexOf("if (dryRun) {"), cliSource.indexOf("const result = await captureWatchlistSnapshot"));
  assert.ok(!dryRunBranch.includes("captureWatchlistSnapshot"), "the --dry-run branch must never call captureWatchlistSnapshot (the only write path) - it must return before reaching it.");
  assert.ok(dryRunBranch.includes("resolveWatchlistSnapshotData"), "the --dry-run branch must still call resolveWatchlistSnapshotData (a read) so the dry-run actually resolves and prints something real, not a no-op.");
}

function verifyCliArgParsingFailsFast() {
  // Re-import lazily to avoid pulling the CLI's top-level main()/prisma
  // teardown side effects into this pure test's own module graph.
  return import("./snapshot-watchlist").then(({ parseSnapshotCliArgs }) => {
    assert.deepEqual(parseSnapshotCliArgs(["--help"]), { action: "help" });
    assert.deepEqual(parseSnapshotCliArgs(["-h"]), { action: "help" });

    const defaults = parseSnapshotCliArgs([]);
    assert.equal(defaults.action, "run");
    if (defaults.action === "run") {
      assert.equal(defaults.dryRun, false);
      assert.equal(defaults.gender, "all");
      assert.equal(defaults.dataMode, "real");
      assert.equal(defaults.triggeredBy, "manual");
    }

    const combined = parseSnapshotCliArgs(["--dry-run", "--gender=women", "--data-mode=sample", "--scheduled"]);
    assert.equal(combined.action, "run");
    if (combined.action === "run") {
      assert.equal(combined.dryRun, true);
      assert.equal(combined.gender, "women");
      assert.equal(combined.dataMode, "sample");
      assert.equal(combined.triggeredBy, "scheduled");
    }

    const badGender = parseSnapshotCliArgs(["--gender=everyone"]);
    assert.equal(badGender.action, "error", "an unrecognized --gender value must fail fast, never silently default.");

    const unknown = parseSnapshotCliArgs(["--totally-bogus"]);
    assert.equal(unknown.action, "error", "an unrecognized flag must fail fast, never fall through to a live run.");

    const helpWinsOverJunk = parseSnapshotCliArgs(["--help", "--totally-bogus"]);
    assert.equal(helpWinsOverJunk.action, "help", "--help must take priority over any other/unknown token present alongside it.");
  });
}

async function main() {
  verifyWatchlistSelectionMatchesResolver();
  verifyTopFivePersistedInOrder();
  verifySignalNameMatchesUiInterpretation();
  verifyBusinessDateCorrectness();
  verifyAlgorithmVersionPersisted();
  verifyRepeatedSameDayCapturePolicy();
  verifyNoMutationOfEditorialOrMarketTables();
  await verifyCliArgParsingFailsFast();
  console.log("Watchlist snapshot tests passed: selection/resolver parity, top-5 order, signal-name interpretation parity, KST businessDate, algorithmVersion, append-only same-day capture policy, no-mutation structural boundary, CLI arg parsing.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
