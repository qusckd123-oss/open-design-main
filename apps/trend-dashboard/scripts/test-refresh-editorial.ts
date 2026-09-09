import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  classifySourceOutcome,
  checkZeroResultGuard,
  evaluateQualityGates,
  worstGateLevel,
  type SourceCollectionOutcome
} from "../src/services/editorial-refresh-policy";
import type { EditorialRefreshSnapshot } from "../src/services/editorial-refresh-snapshot";

/**
 * Tests for the editorial refresh runner's PURE decision logic
 * (src/services/editorial-refresh-policy.ts). Deliberately mock/fixture-
 * based - no live network, no real database - per
 * docs/EDITORIAL_REFRESH_OPERATIONS.md "Tests": "Use mocks/fixtures. Do not
 * depend on live web for automated test suite." The runner's I/O (collector
 * calls, prisma reads/writes, console/file output) is intentionally kept
 * thin and separate from this logic specifically so it is testable this way.
 *
 * Usage: npx tsx scripts/test-refresh-editorial.ts
 */

function baseSnapshot(overrides: Partial<EditorialRefreshSnapshot> = {}): EditorialRefreshSnapshot {
  return {
    totalPosts: 373,
    totalMentions: 1496,
    canonicalDuplicates: 0,
    mentionDuplicates: 0,
    marketSnapshots: 667,
    bundles: 46,
    independentRepeated: 9,
    multiSourceIndependent: 8,
    publisherFamilyDiverse: 7,
    currentPrimary: "체크 SHIRT",
    perSource: {},
    ...overrides
  };
}

function outcome(overrides: Partial<SourceCollectionOutcome> = {}): SourceCollectionOutcome {
  return { source: "EYESMAG", status: "SUCCESS", posts: 5, newPosts: 5, updatedPosts: 0, mentions: 12, ...overrides };
}

function verifySourceClassification() {
  // Source success case.
  const success = classifySourceOutcome(outcome({ status: "SUCCESS" }));
  assert.equal(success.action, "WARN_ONLY", "a successful source outcome must not be treated as an actionable failure.");

  // HTTP 202/429-style rate limiting (the real, already-established
  // EditorialRateLimitedError path every collector in rss.ts uses) must
  // SKIP the source, never stop the entire run.
  const rateLimited = classifySourceOutcome(outcome({ status: "RATE_LIMITED", error: "https://hypebeast.kr/fashion/page/2 refused automated request: HTTP 202" }));
  assert.equal(rateLimited.action, "SKIP_SOURCE", "a rate-limited source must be skipped, not treated as a run-stopping failure.");
  assert.ok(rateLimited.reason.includes("202"), "the classification reason should retain the original error detail for the report.");

  // Single-source failure isolation: ANY failure kind (timeout, 403,
  // unexpected parser exception, listing-structure change) must classify as
  // SKIP_SOURCE - never STOP_ENTIRE_RUN - per the task's own conservative
  // failure-isolation requirement.
  for (const errorMessage of ["fetch failed: ETIMEDOUT", "HTTP 403", "Cannot read properties of undefined (reading 'match')", "unexpected token in JSON"]) {
    const failed = classifySourceOutcome(outcome({ status: "FAILED", error: errorMessage }));
    assert.equal(failed.action, "SKIP_SOURCE", `a FAILED outcome (${errorMessage}) must always be SKIP_SOURCE, never STOP_ENTIRE_RUN - single-source failures must never be classified as run-stopping.`);
  }
}

function verifyZeroResultGuard() {
  const now = new Date("2026-09-09T00:00:00Z");

  // Normal case: new posts found -> no warning regardless of history.
  const withNewPosts = checkZeroResultGuard("EYESMAG", { postCount: 102, mostRecentPublishedAt: new Date("2026-09-01") }, outcome({ newPosts: 3 }), now);
  assert.equal(withNewPosts.warn, false, "finding new posts must never trigger the zero-result guard.");

  // First-ever run for a source (no prior history) -> no warning, nothing to compare against.
  const firstRun = checkZeroResultGuard("NEW_SOURCE", { postCount: 0, mostRecentPublishedAt: null }, outcome({ newPosts: 0 }), now);
  assert.equal(firstRun.warn, false, "a source with no prior history must not trigger the guard on its first run.");

  // Zero new posts, but the source is still recently active (within the
  // conservative 21-day threshold) -> no warning, this is normal cadence.
  const recentlyActiveZero = checkZeroResultGuard("MARIECLAIRE_KR", { postCount: 30, mostRecentPublishedAt: new Date("2026-09-05") }, outcome({ newPosts: 0 }), now);
  assert.equal(recentlyActiveZero.warn, false, "0 new posts from a recently-active source (< threshold days stale) must not warn - normal publishing gaps happen.");

  // Zero new posts AND the source has gone stale beyond the threshold ->
  // WARN. This is the real incident class the guard exists for: a listing/
  // discovery mechanism silently breaking must not be read as "no new
  // articles."
  const stale = checkZeroResultGuard("EYESMAG", { postCount: 102, mostRecentPublishedAt: new Date("2026-08-01") }, outcome({ newPosts: 0 }), now);
  assert.equal(stale.warn, true, "0 new posts from a source that has gone stale beyond the threshold must WARN - possible listing/discovery breakage.");
  assert.ok(stale.reason.includes("EYESMAG"), "the warning must name the affected source.");

  // A source that FAILED (rate-limited or errored) must never trigger the
  // zero-result guard too - that would double-report the same underlying
  // problem under two different mechanisms.
  const failedSource = checkZeroResultGuard("HYPEBEAST_KR", { postCount: 141, mostRecentPublishedAt: new Date("2026-08-01") }, outcome({ status: "RATE_LIMITED", newPosts: 0 }), now);
  assert.equal(failedSource.warn, false, "a source that already failed/rate-limited this run must not ALSO trigger the zero-result guard - the failure is already surfaced.");
}

function verifyQualityGates() {
  const before = baseSnapshot();

  // Clean, healthy refresh: everything PASSes.
  const healthyAfter = baseSnapshot({ totalPosts: 385, totalMentions: 1540, bundles: 48, independentRepeated: 10, multiSourceIndependent: 9, publisherFamilyDiverse: 8 });
  const healthyGates = evaluateQualityGates(before, healthyAfter, [outcome({ status: "SUCCESS" })]);
  assert.equal(worstGateLevel(healthyGates), "PASS", "a normal, healthy refresh with real growth in every metric must not trigger any WARN/FAIL gate.");

  // Canonical duplicates -> FAIL.
  const dupCanonical = evaluateQualityGates(before, baseSnapshot({ canonicalDuplicates: 2 }), [outcome()]);
  assert.equal(worstGateLevel(dupCanonical), "FAIL", "canonical duplicates > 0 must FAIL the run.");

  // Mention duplicates -> FAIL.
  const dupMention = evaluateQualityGates(before, baseSnapshot({ mentionDuplicates: 3 }), [outcome()]);
  assert.equal(worstGateLevel(dupMention), "FAIL", "mention duplicates > 0 must FAIL the run.");

  // EditorialPost count decreasing -> FAIL (a data refresh must never delete real posts).
  const shrunkPosts = evaluateQualityGates(before, baseSnapshot({ totalPosts: 370 }), [outcome()]);
  assert.equal(worstGateLevel(shrunkPosts), "FAIL", "EditorialPost count decreasing must FAIL the run.");

  // Market changing during an editorial-only refresh -> FAIL. This is the
  // single most important gate this project's own history has repeatedly
  // asserted ("Market must remain 667 unless a separate Market refresh was
  // explicitly run" - true in every audit doc in this repo's history).
  const marketChanged = evaluateQualityGates(before, baseSnapshot({ marketSnapshots: 700 }), [outcome()]);
  assert.equal(worstGateLevel(marketChanged), "FAIL", "MarketRankingSnapshot changing during an editorial-only refresh must FAIL the run - this must never happen.");
  assert.ok(marketChanged.find((g) => g.name === "Market untouched")?.level === "FAIL");

  // Drastic bundle count swing (>=25%) -> WARN, not FAIL - a real signal
  // shift is plausible after real collection, but worth a human look.
  const drasticSwing = evaluateQualityGates(before, baseSnapshot({ bundles: 60 }), [outcome()]);
  assert.equal(worstGateLevel(drasticSwing), "WARN", "a >=25% bundle-count swing must WARN, not FAIL - it is plausible, not necessarily wrong.");

  // Every source failing -> FAIL (systemic issue, not independent flakiness).
  const allFailed = evaluateQualityGates(before, before, [outcome({ status: "FAILED" }), outcome({ status: "RATE_LIMITED", source: "HYPEBEAST_KR" })]);
  assert.equal(worstGateLevel(allFailed), "FAIL", "every source failing in the same run must FAIL - likely systemic (network/DB), not independent per-source flakiness.");

  // One source failing among several successes must NOT fail the run by
  // itself - failure isolation must hold at the gate-evaluation level too,
  // not just at the per-source classification level.
  const oneOfManyFailed = evaluateQualityGates(before, healthyAfter, [outcome({ status: "SUCCESS" }), outcome({ status: "RATE_LIMITED", source: "HYPEBEAST_KR" }), outcome({ status: "SUCCESS", source: "MARIECLAIRE_KR" })]);
  assert.notEqual(worstGateLevel(oneOfManyFailed), "FAIL", "one source failing among several successes must not FAIL the overall run - failure isolation.");
}

function verifyReportShape() {
  // The report/JSON structure the runner writes is a plain object built
  // directly from `before`/`after`/`outcomes`/`gates` - assert the shape a
  // consumer (a future scheduler/monitor) would rely on stays stable rather
  // than re-testing console formatting, which is not meaningfully unit-
  // testable and not where real risk lives.
  const before = baseSnapshot();
  const after = baseSnapshot({ totalPosts: 385 });
  const outcomes = [outcome()];
  const gates = evaluateQualityGates(before, after, outcomes);
  const report = { generatedAt: new Date().toISOString(), dryRun: false, before, after, outcomes, gates, worstGateLevel: worstGateLevel(gates) };
  assert.ok(typeof report.generatedAt === "string" && report.generatedAt.length > 0);
  assert.ok(Array.isArray(report.outcomes) && report.outcomes.length === 1);
  assert.ok(Array.isArray(report.gates) && report.gates.length > 0);
  assert.ok(["PASS", "WARN", "FAIL"].includes(report.worstGateLevel));
  assert.equal(JSON.parse(JSON.stringify(report)).before.totalPosts, before.totalPosts, "the report must serialize cleanly to JSON (the --json output format).");
}

function verifyNoTaxonomyOrCodeMutationBoundary() {
  // This is a documented operational rule (docs/EDITORIAL_REFRESH_OPERATIONS.md
  // "What Must Never Be Automated"), not something a runtime check can fully
  // enforce - but the structural guarantee IS testable: the refresh runner's
  // own module graph must never import mentions.ts's rule array or
  // attribute-relations.ts's boundary constants for WRITE purposes, and must
  // never import anything from product-reference/. Asserted here by import
  // shape, not by hashing source files (which would be brittle and outside
  // this task's scope).
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const policyModuleSource = readFileSync(path.join(thisDir, "..", "src", "services", "editorial-refresh-policy.ts"), "utf8");
  assert.ok(!policyModuleSource.includes("product-reference"), "the refresh policy module must never import from product-reference/ - taxonomy/product work is out of scope for automated refresh.");
  assert.ok(!policyModuleSource.includes('from "../collectors/editorial/mentions"'), "the refresh policy module must never import the taxonomy rule array directly - it only classifies outcomes, never touches parsing rules.");
}

async function main() {
  verifySourceClassification();
  verifyZeroResultGuard();
  verifyQualityGates();
  verifyReportShape();
  verifyNoTaxonomyOrCodeMutationBoundary();
  console.log("Refresh runner policy tests passed: source classification, zero-result guard, quality gates, report shape, taxonomy-isolation boundary.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
