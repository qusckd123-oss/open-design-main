import type { AttributeBundle } from "./attribute-bundle-service";

/**
 * WATCHLIST SELECTION (2026-09-21, extracted from src/app/page.tsx's
 * previously-inline logic as part of the Phase 6A snapshot foundation - see
 * prisma/schema.prisma's WatchlistSnapshot doc comment).
 *
 * This is the SAME selection rule the home page has used since the
 * 2026-09-14 P1 Watchlist UX pass, moved here unchanged so the page render
 * path and the snapshot writer (watchlist-snapshot-service.ts) share exactly
 * one implementation instead of two copies that could silently drift apart.
 * It does NOT reimplement or alter getAttributeBundles's own sort (that
 * remains frozen, Category B logic in attribute-bundle-service.ts per
 * docs/AGENT_OPERATING_RULES.md) - this only picks which already-sorted
 * bundles become the Watchlist and in what order.
 *
 * Explicit, deliberately-bumped provenance string for anything derived from
 * this selection rule (or buildSignalInterpretation's presentation, which a
 * snapshot also freezes) - never derived from an unstable runtime value
 * (git SHA, package.json version). Bump this by hand if the selection rule
 * or the interpretation fields a snapshot persists ever change, so an old
 * WatchlistSnapshot row can always be told apart from a new-shape one.
 */
export const WATCHLIST_ALGORITHM_VERSION = "watchlist-v1";

/**
 * The bundle-first planning-insight pick: a bundle backed by >=2 INDEPENDENT
 * evidence clusters (see AttributeBundle.independentEvidenceClusterCount).
 * Same threshold `selectPrimaryPlanningBundle` uses, but returns null (never
 * a bundles[0] fallback) when nothing qualifies - the page renders the
 * uniform tile grid instead of forcing a hero out of ordinary single
 * observations. See src/app/page.tsx's own doc comment for why this is
 * deliberately NOT selectPrimaryPlanningBundle itself.
 */
export function selectRepeatedBundle(bundles: AttributeBundle[]): AttributeBundle | null {
  return bundles.find((bundle) => bundle.independentEvidenceClusterCount >= 2) ?? null;
}

/**
 * The Watchlist model: the top five bundles from getAttributeBundles's SAME
 * frozen sort, reordered only enough to put the repeated-bundle pick (if
 * any) first/default-selected - never a new selection rule. Returns an empty
 * array when there is no genuinely repeated bundle (the page falls back to
 * the "Current Signal" uniform grid in that case, which this function has no
 * opinion about).
 */
export function selectWatchlistBundles(bundles: AttributeBundle[]): AttributeBundle[] {
  const repeatedBundle = selectRepeatedBundle(bundles);
  if (!repeatedBundle) return [];
  return [repeatedBundle, ...bundles.filter((bundle) => bundle.key !== repeatedBundle.key)].slice(0, 5);
}
