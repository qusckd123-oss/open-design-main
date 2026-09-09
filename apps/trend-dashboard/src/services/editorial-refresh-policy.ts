import type { EditorialRefreshSnapshot } from "./editorial-refresh-snapshot";

/**
 * PURE decision logic for the editorial refresh runner
 * (scripts/refresh-editorial.ts) - no prisma, no network, no filesystem.
 * Deliberately separated from the runner's I/O so it can be unit-tested with
 * plain fixtures (docs/EDITORIAL_REFRESH_OPERATIONS.md, "Tests"). Every
 * function here is a straight input->output mapping.
 *
 * `SourceCollectionOutcome` is defined here (not in
 * scripts/collect-korea-editorial.ts, which imports it back) so this
 * services-layer module never depends on a scripts/-layer one.
 */

export type SourceCollectionOutcome = {
  source: string;
  status: "SUCCESS" | "RATE_LIMITED" | "FAILED";
  posts: number;
  newPosts: number;
  updatedPosts: number;
  mentions: number;
  error?: string;
};

export type SourceAction = "SKIP_SOURCE" | "STOP_ENTIRE_RUN" | "WARN_ONLY";

export type SourceClassification = {
  action: SourceAction;
  reason: string;
};

/**
 * Classifies one source's collection outcome into an action, per
 * docs/EDITORIAL_REFRESH_OPERATIONS.md "Failure Policy". Deliberately
 * conservative: a single source's failure - of ANY kind, including an
 * unexpected exception this function has never seen before - is always
 * SKIP_SOURCE, never STOP_ENTIRE_RUN. "One failed source should not destroy
 * successful updates from other sources" is treated as an absolute rule, not
 * a default with exceptions - STOP_ENTIRE_RUN is reserved for orchestration-
 * level failures (e.g. the database itself is unreachable), which surface
 * outside this function entirely, in the runner's own top-level try/catch,
 * never as a per-source outcome.
 */
export function classifySourceOutcome(outcome: SourceCollectionOutcome): SourceClassification {
  if (outcome.status === "SUCCESS") return { action: "WARN_ONLY", reason: "success" };
  if (outcome.status === "RATE_LIMITED") {
    return { action: "SKIP_SOURCE", reason: `rate-limited/refused by host (${outcome.error ?? "no detail"}) - safely stopped, partial results (if any) already saved` };
  }
  // FAILED: any other exception (network error, timeout, unexpected parser
  // throw, listing-structure change, etc.). Classified uniformly as
  // SKIP_SOURCE - the task's own examples (HTTP 403, HTTP 429, timeout,
  // parser returns zero unexpectedly, body extraction collapse, listing
  // structure change) are all real, disparate failure modes that a fixed
  // heuristic on the error message could easily misclassify; treating all of
  // them the same (skip this source, keep going, report clearly) is the
  // conservative choice the task's own Section 8 asks for.
  return { action: "SKIP_SOURCE", reason: `collection failed: ${outcome.error ?? "unknown error"}` };
}

export type ZeroResultGuardResult = {
  warn: boolean;
  reason: string;
};

/**
 * A source returning 0 NEW posts is normal and expected on most runs -
 * skipUrls already means "0 new" usually just means "nothing published since
 * last time," not a health problem. This guard exists only to catch the
 * different, rarer case the task calls out: a historically active source's
 * discovery/listing mechanism silently breaking (a site redesign) - a real
 * incident already seen once in this corpus with HYPEBEAST_KR (see rss.ts's
 * "page 32 was refused and the whole batch reported zero" comment, fixed by
 * partial-return, not by this guard).
 *
 * Uses only data already available from the refresh's own before/after
 * snapshot - no new collector introspection required. Fires ONLY when a
 * source that has existing posts (this is not its first-ever run) returns 0
 * new posts on a SUCCESSFUL (non-error) run AND its most recent stored
 * article is already older than `staleThresholdDays`. The threshold default
 * (21 days) is a deliberately conservative multiple of the weekly refresh
 * cadence this project's own source cadence table recommends
 * (docs/EDITORIAL_REFRESH_OPERATIONS.md, "Refresh Cadence") - three missed
 * weekly cycles, not one, so an ordinary slow week never triggers a false
 * alarm. This is a WARN, never an automatic action - a human decides whether
 * the source is actually broken.
 */
export function checkZeroResultGuard(
  source: string,
  before: { postCount: number; mostRecentPublishedAt: Date | null },
  outcome: SourceCollectionOutcome,
  now: Date = new Date(),
  staleThresholdDays = 21
): ZeroResultGuardResult {
  if (outcome.status !== "SUCCESS") return { warn: false, reason: "not applicable - source did not complete successfully this run" };
  if (outcome.newPosts > 0) return { warn: false, reason: "new posts were found - source is healthy" };
  if (before.postCount === 0) return { warn: false, reason: "source has no prior history to compare against (first run or never collected)" };
  if (!before.mostRecentPublishedAt) return { warn: false, reason: "source has prior posts but no publishedAt to compare against - cannot evaluate staleness" };
  const ageDays = (now.getTime() - before.mostRecentPublishedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > staleThresholdDays) {
    return {
      warn: true,
      reason: `${source} returned 0 new posts and its most recent stored article is ${ageDays.toFixed(0)} days old (threshold ${staleThresholdDays}) - possible listing/discovery breakage, review manually before assuming "no new articles"`
    };
  }
  return { warn: false, reason: `0 new posts, but most recent article is only ${ageDays.toFixed(0)} days old - consistent with normal publishing cadence` };
}

export type QualityGateLevel = "PASS" | "WARN" | "FAIL";

export type QualityGateResult = {
  level: QualityGateLevel;
  name: string;
  detail: string;
};

/**
 * All gates from docs/EDITORIAL_REFRESH_OPERATIONS.md "Quality Gates",
 * evaluated against a before/after snapshot pair. Deliberately returns EVERY
 * gate's result (not just failures) so a report can show a full checklist,
 * not just problems.
 */
export function evaluateQualityGates(
  before: EditorialRefreshSnapshot,
  after: EditorialRefreshSnapshot,
  sourceResults: SourceCollectionOutcome[]
): QualityGateResult[] {
  const gates: QualityGateResult[] = [];

  gates.push(
    after.canonicalDuplicates > 0
      ? { level: "FAIL", name: "canonical duplicates", detail: `${after.canonicalDuplicates} canonical URL(s) now shared by >1 post` }
      : { level: "PASS", name: "canonical duplicates", detail: "0" }
  );

  gates.push(
    after.mentionDuplicates > 0
      ? { level: "FAIL", name: "mention duplicates", detail: `${after.mentionDuplicates} duplicate (postId, type, value) mention row(s)` }
      : { level: "PASS", name: "mention duplicates", detail: "0" }
  );

  gates.push(
    after.totalPosts < before.totalPosts
      ? { level: "FAIL", name: "EditorialPost count", detail: `decreased ${before.totalPosts} -> ${after.totalPosts} - a data refresh must never delete real posts` }
      : { level: "PASS", name: "EditorialPost count", detail: `${before.totalPosts} -> ${after.totalPosts}` }
  );

  gates.push(
    after.marketSnapshots !== before.marketSnapshots
      ? { level: "FAIL", name: "Market untouched", detail: `MarketRankingSnapshot changed ${before.marketSnapshots} -> ${after.marketSnapshots} during an editorial-only refresh - this must never happen` }
      : { level: "PASS", name: "Market untouched", detail: `${after.marketSnapshots}` }
  );

  const zeroResultWarnings = sourceResults.filter((outcome) => outcome.status === "SUCCESS" && outcome.newPosts === 0);
  gates.push(
    zeroResultWarnings.length > 0
      ? { level: "WARN", name: "zero-result sources", detail: `${zeroResultWarnings.length} source(s) returned 0 new posts - see per-source zero-result guard for whether this is expected` }
      : { level: "PASS", name: "zero-result sources", detail: "all sources found new or no-longer-applicable content normally" }
  );

  // "Relation/bundle count changes drastically -> WARN and audit." No prior-
  // run history exists to derive a statistically grounded threshold from, so
  // this uses a deliberately generous, documented-as-a-judgment-call bound
  // (>=25% swing in bundle count) rather than an arbitrary tight one -
  // conservative in the sense of rarely false-alarming, not in the sense of
  // being precisely tuned.
  const bundleDeltaRatio = before.bundles === 0 ? 0 : Math.abs(after.bundles - before.bundles) / before.bundles;
  gates.push(
    bundleDeltaRatio >= 0.25
      ? { level: "WARN", name: "bundle count stability", detail: `bundle count moved ${before.bundles} -> ${after.bundles} (${(bundleDeltaRatio * 100).toFixed(0)}%) - review before trusting the new signal set` }
      : { level: "PASS", name: "bundle count stability", detail: `${before.bundles} -> ${after.bundles}` }
  );

  const failedSources = sourceResults.filter((outcome) => outcome.status !== "SUCCESS");
  gates.push(
    failedSources.length === sourceResults.length && sourceResults.length > 0
      ? { level: "FAIL", name: "source availability", detail: "every source failed this run - likely a systemic issue (network, DB, or a shared code path), not independent per-source flakiness" }
      : { level: "PASS", name: "source availability", detail: `${sourceResults.length - failedSources.length}/${sourceResults.length} sources succeeded` }
  );

  return gates;
}

export function worstGateLevel(gates: QualityGateResult[]): QualityGateLevel {
  if (gates.some((gate) => gate.level === "FAIL")) return "FAIL";
  if (gates.some((gate) => gate.level === "WARN")) return "WARN";
  return "PASS";
}
