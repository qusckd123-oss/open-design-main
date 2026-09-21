import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  parseSnapshotItemRow,
  selectCaptureFromHeaders,
  sortItemsByRank,
  summarizeArchiveDates,
  type ArchiveSnapshotHeader
} from "../src/services/watchlist-archive-service";

/**
 * Tests for the Watchlist Archive read layer (Phase 7A). Fixture-based only -
 * NO live network, NO database connection (same reason as
 * scripts/test-watchlist-snapshot.ts: this repo's DATABASE_URL points at a
 * real Postgres target, so structural/pure logic here must be verifiable
 * without ever calling `prisma`). Every function under test
 * (summarizeArchiveDates, selectCaptureFromHeaders, sortItemsByRank,
 * parseSnapshotItemRow) is intentionally I/O-free.
 *
 * Usage: npx tsx scripts/test-watchlist-archive.ts
 */

function header(overrides: Partial<ArchiveSnapshotHeader> & { id: string; businessDate: string; capturedAt: Date }): ArchiveSnapshotHeader {
  return {
    algorithmVersion: "watchlist-v1",
    dataMode: "real",
    gender: "all",
    triggeredBy: "manual",
    itemCount: 5,
    sourceEditorialPostCount: 100,
    sourceLatestPublishedAt: null,
    ...overrides
  };
}

function verifyDatesSortedNewestFirst() {
  const day1 = header({ id: "a", businessDate: "2026-09-14", capturedAt: new Date("2026-09-14T08:30:00Z") });
  const day2 = header({ id: "b", businessDate: "2026-09-21", capturedAt: new Date("2026-09-21T08:30:00Z") });
  const day3 = header({ id: "c", businessDate: "2026-09-15", capturedAt: new Date("2026-09-15T08:30:00Z") });

  const summaries = summarizeArchiveDates([day1, day2, day3]);
  assert.deepEqual(summaries.map((s) => s.businessDate), ["2026-09-21", "2026-09-15", "2026-09-14"], "dates must be sorted newest-first, regardless of input array order.");
}

function verifyLatestCaptureChosenForSameDayDuplicate() {
  const day = "2026-09-21";
  const earlier = header({ id: "a", businessDate: day, capturedAt: new Date("2026-09-21T00:30:00Z") });
  const later = header({ id: "b", businessDate: day, capturedAt: new Date("2026-09-21T09:00:00Z") });

  const summaries = summarizeArchiveDates([earlier, later]);
  assert.equal(summaries.length, 1, "same-day captures must be grouped into ONE date summary, never one row per capture.");
  assert.equal(summaries[0]!.captureCount, 2, "the capture count must reflect BOTH same-day snapshots - same-day duplicates must never be hidden.");
  assert.equal(summaries[0]!.latest.id, "b", "the later capturedAt must be selected as the date's default/latest header.");

  // selectCaptureFromHeaders must honor an explicit capture id even when it is not the latest.
  const captures = [later, earlier];
  assert.equal(selectCaptureFromHeaders(captures, "a")?.id, "a", "an explicitly requested capture id must be honored even if it is not the latest for that date.");
  assert.equal(selectCaptureFromHeaders(captures, null)?.id, "b", "with no explicit capture id, the latest capture must be selected.");
  assert.equal(selectCaptureFromHeaders(captures, "nonexistent-id")?.id, "b", "an unrecognized capture id must fall back to the latest capture, never throw or return null when captures exist.");
}

function verifyItemsOrderedByRank() {
  const items = [
    { rank: 3, bundleKey: "c" },
    { rank: 1, bundleKey: "a" },
    { rank: 2, bundleKey: "b" }
  ];
  const sorted = sortItemsByRank(items);
  assert.deepEqual(sorted.map((i) => i.bundleKey), ["a", "b", "c"], "items must be ordered by their persisted rank field, regardless of DB return order.");
}

function verifyNonexistentDateBehavior() {
  assert.equal(selectCaptureFromHeaders([], "any-id"), null, "an empty capture list (nonexistent date) must resolve to null, never throw or fabricate a header.");
}

function verifyEmptyArchiveBehavior() {
  assert.deepEqual(summarizeArchiveDates([]), [], "zero snapshot headers must summarize to an empty date list, never a fabricated placeholder date.");
}

function verifySnapshotItemRowParsing() {
  const attrs = [{ type: "DETAIL", value: "STRIPE", articlePresence: 3, sourceSpread: 2 }];
  const unknowns = ["실루엣 미확인", "소재 미확인"];
  const parsed = parseSnapshotItemRow({
    rank: 1,
    bundleKey: "SHIRT#DETAIL:STRIPE",
    specificItem: "SHIRT",
    signalName: "스트라이프 셔츠",
    displayName: "스트라이프 SHIRT",
    directAttributes: JSON.stringify(attrs),
    evidenceStrength: "반복 관측 · 서로 다른 사례",
    bundleArticlePresence: 5,
    bundleSourceSpread: 3,
    independentEvidenceClusterCount: 2,
    publisherFamilySpread: 2,
    latestObservedAt: new Date("2026-09-20T00:00:00Z"),
    observedFact: "관측된 사실",
    unknowns: JSON.stringify(unknowns),
    planningQuestion: "기획 검토 질문",
    isPrimarySignal: true,
    directionStatus: "NOT_COMPARABLE"
  });
  assert.deepEqual(parsed.directAttributes, attrs, "JSON-encoded directAttributes must round-trip back into a plain array, matching BundleAttribute[] shape.");
  assert.deepEqual(parsed.unknowns, unknowns, "JSON-encoded unknowns must round-trip back into a plain string[].");
  assert.equal(parsed.isPrimarySignal, true);
  assert.equal(parsed.directionStatus, "NOT_COMPARABLE");
}

function verifyArchiveNeverImportsLiveResolver() {
  // Structural boundary check, same technique test-watchlist-snapshot.ts and
  // test-refresh-editorial.ts already use for their own isolation
  // guarantees: assert by IMPORT SHAPE, not by running anything against a
  // real database. The Archive must answer "what did the Watchlist show" only
  // from persisted snapshot rows - never by recalculating from current
  // (mutable) EditorialPost/EditorialMention rows.
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const serviceSource = readFileSync(path.join(thisDir, "..", "src", "services", "watchlist-archive-service.ts"), "utf8");
  const pageSource = readFileSync(path.join(thisDir, "..", "src", "app", "archive", "page.tsx"), "utf8");

  for (const source of [serviceSource, pageSource]) {
    // Checks for an actual CALL (or import), not doc-comment prose that
    // merely mentions the name while explaining why it's absent.
    assert.ok(!source.includes("getAttributeBundles("), "the Archive read layer/page must never call getAttributeBundles(...) - it must render persisted snapshot rows only, never a live recalculation.");
  }
  // A type-only import of BundleAttribute (the JSON shape already persisted
  // on WatchlistSnapshotItem.directAttributes) is fine; importing anything
  // else from that module (a VALUE, i.e. a live resolver/function) is not.
  assert.ok(!/import\s*\{[^}]*\bBundleAttribute\b[^}]*\}\s*from\s*"\.\/attribute-bundle-service"/.test(serviceSource) || /import\s+type\s*\{[^}]*\}\s*from\s*"\.\/attribute-bundle-service"/.test(serviceSource), "watchlist-archive-service.ts may only take a type-only import from attribute-bundle-service.ts (the persisted BundleAttribute shape), never a live resolver value.");

  for (const writeVerb of [".update(", ".upsert(", ".delete(", ".deleteMany(", ".updateMany(", ".create("]) {
    assert.ok(!serviceSource.includes(`watchlistSnapshot${writeVerb}`), `watchlist-archive-service.ts must never call prisma.watchlistSnapshot${writeVerb} - the Archive read layer must be read-only.`);
    assert.ok(!serviceSource.includes(`watchlistSnapshotItem${writeVerb}`), `watchlist-archive-service.ts must never call prisma.watchlistSnapshotItem${writeVerb} - the Archive read layer must be read-only.`);
  }
}

function main() {
  verifyDatesSortedNewestFirst();
  verifyLatestCaptureChosenForSameDayDuplicate();
  verifyItemsOrderedByRank();
  verifyNonexistentDateBehavior();
  verifyEmptyArchiveBehavior();
  verifySnapshotItemRowParsing();
  verifyArchiveNeverImportsLiveResolver();
  console.log("Watchlist archive tests passed: date sort order, same-day multi-capture handling, item rank order, nonexistent-date/empty-archive safety, JSON round-trip, no-live-resolver structural boundary.");
}

main();
