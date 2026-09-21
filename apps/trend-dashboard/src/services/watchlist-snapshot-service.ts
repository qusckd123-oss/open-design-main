import { prisma } from "@/db/client";
import { businessDayKey } from "@/lib/business-time";
import type { PlanningGenderFilter } from "@/lib/planning-filters";
import { buildSignalInterpretation } from "@/lib/signal-interpretation";
import { getAttributeBundles, bundleEvidenceStrength, type AttributeBundle } from "./attribute-bundle-service";
import { selectRepeatedBundle, selectWatchlistBundles, WATCHLIST_ALGORITHM_VERSION } from "./watchlist-selection";

/**
 * WATCHLIST SNAPSHOT WRITER (Phase 6A - Archive foundation).
 *
 * See prisma/schema.prisma's WatchlistSnapshot doc comment for WHY this
 * exists (mutable EditorialPost/EditorialMention evidence + an on-demand,
 * never-persisted getAttributeBundles() means today's Watchlist cannot be
 * reconstructed later from source rows alone).
 *
 * This module calls the SAME resolvers the home page itself uses
 * (getAttributeBundles, selectWatchlistBundles, buildSignalInterpretation,
 * bundleEvidenceStrength) and persists their RESOLVED output - it never
 * reimplements ranking or interpretation. `resolveWatchlistSnapshotData` is
 * pure I/O-in (one read) with no writes, so a caller can resolve+print
 * (dry-run) without ever reaching `captureWatchlistSnapshot`.
 *
 * APPEND-ONLY: `captureWatchlistSnapshot` only ever calls
 * `prisma.watchlistSnapshot.create` (via a single nested-write transaction).
 * This module contains no `.update(`, `.upsert(`, `.delete(`, or
 * `.deleteMany(` call on either model, and no code path here writes to
 * EditorialPost, EditorialMention, or any Market* table - see
 * scripts/test-watchlist-snapshot.ts's structural boundary check.
 */

export type WatchlistSnapshotItemData = {
  rank: number;
  bundleKey: string;
  specificItem: string;
  signalName: string;
  displayName: string;
  directAttributes: AttributeBundle["directAttributes"];
  evidenceStrength: string;
  bundleArticlePresence: number;
  bundleSourceSpread: number;
  independentEvidenceClusterCount: number;
  publisherFamilySpread: number;
  latestObservedAt: Date | null;
  observedFact: string;
  unknowns: string[];
  planningQuestion: string;
  isPrimarySignal: boolean;
  directionStatus: "NOT_COMPARABLE";
};

export type WatchlistSnapshotData = {
  capturedAt: Date;
  businessDate: string;
  algorithmVersion: string;
  dataMode: string;
  gender: PlanningGenderFilter;
  sourceEditorialPostCount: number;
  sourceLatestPublishedAt: Date | null;
  items: WatchlistSnapshotItemData[];
};

/**
 * Shapes one already-selected, already-sorted bundle list into the resolved
 * row data a WatchlistSnapshotItem persists. Pure - no I/O, no DB - so it is
 * directly unit-testable against a hand-built AttributeBundle[] fixture
 * without touching getAttributeBundles or any database at all (see
 * scripts/test-watchlist-snapshot.ts "rank/order matches resolver").
 */
export function buildSnapshotItems(watchlistBundles: AttributeBundle[], repeatedBundle: AttributeBundle | null): WatchlistSnapshotItemData[] {
  return watchlistBundles.map((bundle, index) => {
    const interpretation = buildSignalInterpretation(bundle);
    const strength = bundleEvidenceStrength({
      articlePresence: bundle.bundleArticlePresence,
      sourceSpread: bundle.bundleSourceSpread,
      independentEvidenceClusterCount: bundle.independentEvidenceClusterCount
    });
    return {
      rank: index + 1,
      bundleKey: bundle.key,
      specificItem: bundle.specificItem,
      signalName: interpretation.signalName,
      displayName: bundle.displayName,
      directAttributes: bundle.directAttributes,
      evidenceStrength: strength,
      bundleArticlePresence: bundle.bundleArticlePresence,
      bundleSourceSpread: bundle.bundleSourceSpread,
      independentEvidenceClusterCount: bundle.independentEvidenceClusterCount,
      publisherFamilySpread: bundle.publisherFamilySpread,
      latestObservedAt: bundle.latestObservedAt,
      observedFact: interpretation.observedFact,
      unknowns: interpretation.unknowns,
      planningQuestion: interpretation.planningQuestion,
      isPrimarySignal: repeatedBundle != null && bundle.key === repeatedBundle.key,
      directionStatus: "NOT_COMPARABLE"
    };
  });
}

/**
 * Reads EditorialPost freshness context for the snapshot header, scoped
 * EXACTLY the same way loadPostRelations (attribute-bundle-service.ts)
 * scopes its own read (dataMode + fashionRelevance === FASHION_RELEVANT) -
 * so `sourceEditorialPostCount`/`sourceLatestPublishedAt` describe the same
 * corpus the bundles were actually resolved against, not a looser count.
 * Read-only.
 */
async function readSourceFreshness(dataMode: string): Promise<{ count: number; latestPublishedAt: Date | null }> {
  const [count, latest] = await Promise.all([
    prisma.editorialPost.count({ where: { dataMode, fashionRelevance: "FASHION_RELEVANT" } }),
    prisma.editorialPost.findFirst({
      where: { dataMode, fashionRelevance: "FASHION_RELEVANT", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true }
    })
  ]);
  return { count, latestPublishedAt: latest?.publishedAt ?? null };
}

/**
 * Assembles the full snapshot payload from already-fetched inputs. Pure - no
 * I/O, no DB - so header fields (businessDate via businessDayKey,
 * algorithmVersion, item order/shape via buildSnapshotItems) are directly
 * unit-testable against hand-built fixtures without a database connection
 * (see scripts/test-watchlist-snapshot.ts). `resolveWatchlistSnapshotData`
 * below is the thin I/O wrapper that fetches the inputs this function needs,
 * the same read/write separation this codebase already uses for
 * editorial-refresh (compare editorial-refresh-policy.ts's pure logic vs.
 * editorial-refresh-snapshot.ts's I/O).
 */
export function buildWatchlistSnapshotData(
  bundles: AttributeBundle[],
  freshness: { count: number; latestPublishedAt: Date | null },
  options: { dataMode: string; gender: PlanningGenderFilter; now: Date }
): WatchlistSnapshotData {
  const watchlistBundles = selectWatchlistBundles(bundles);
  const repeatedBundle = selectRepeatedBundle(bundles);

  return {
    capturedAt: options.now,
    businessDate: businessDayKey(options.now),
    algorithmVersion: WATCHLIST_ALGORITHM_VERSION,
    dataMode: options.dataMode,
    gender: options.gender,
    sourceEditorialPostCount: freshness.count,
    sourceLatestPublishedAt: freshness.latestPublishedAt,
    items: buildSnapshotItems(watchlistBundles, repeatedBundle)
  };
}

/**
 * Resolves the current Watchlist state exactly as the home page would render
 * it for (dataMode, gender), and shapes it into snapshot-ready data. Read-
 * only - zero DB writes. This is the entire "dry-run" surface: a caller can
 * print this return value and never call `captureWatchlistSnapshot`.
 */
export async function resolveWatchlistSnapshotData(dataMode = "real", gender: PlanningGenderFilter = "all", now: Date = new Date()): Promise<WatchlistSnapshotData> {
  const [bundles, freshness] = await Promise.all([getAttributeBundles(dataMode, gender), readSourceFreshness(dataMode)]);
  return buildWatchlistSnapshotData(bundles, freshness, { dataMode, gender, now });
}

export type CaptureWatchlistSnapshotResult = {
  snapshotId: string;
  itemCount: number;
  businessDate: string;
};

/**
 * Persists one resolved Watchlist state as a NEW, immutable
 * WatchlistSnapshot + WatchlistSnapshotItem rows. APPEND-ONLY: this function
 * never checks for or reuses an existing row for the same businessDate -
 * running it twice on the same day creates two distinct snapshots (see this
 * module's own doc comment and prisma/schema.prisma). The header + all items
 * are created in one nested-write `prisma.watchlistSnapshot.create` call, so
 * a snapshot is never left half-written (header with zero items) if the
 * process is interrupted mid-write.
 */
export async function captureWatchlistSnapshot(options: { dataMode?: string; gender?: PlanningGenderFilter; triggeredBy?: "scheduled" | "manual"; now?: Date } = {}): Promise<CaptureWatchlistSnapshotResult> {
  const dataMode = options.dataMode ?? "real";
  const gender = options.gender ?? "all";
  const triggeredBy = options.triggeredBy ?? "manual";
  const data = await resolveWatchlistSnapshotData(dataMode, gender, options.now ?? new Date());

  const created = await prisma.watchlistSnapshot.create({
    data: {
      capturedAt: data.capturedAt,
      businessDate: data.businessDate,
      algorithmVersion: data.algorithmVersion,
      dataMode: data.dataMode,
      gender: data.gender,
      sourceEditorialPostCount: data.sourceEditorialPostCount,
      sourceLatestPublishedAt: data.sourceLatestPublishedAt,
      triggeredBy,
      itemCount: data.items.length,
      items: {
        create: data.items.map((item) => ({
          rank: item.rank,
          bundleKey: item.bundleKey,
          specificItem: item.specificItem,
          signalName: item.signalName,
          displayName: item.displayName,
          directAttributes: JSON.stringify(item.directAttributes),
          evidenceStrength: item.evidenceStrength,
          bundleArticlePresence: item.bundleArticlePresence,
          bundleSourceSpread: item.bundleSourceSpread,
          independentEvidenceClusterCount: item.independentEvidenceClusterCount,
          publisherFamilySpread: item.publisherFamilySpread,
          latestObservedAt: item.latestObservedAt,
          observedFact: item.observedFact,
          unknowns: JSON.stringify(item.unknowns),
          planningQuestion: item.planningQuestion,
          isPrimarySignal: item.isPrimarySignal,
          directionStatus: item.directionStatus
        }))
      }
    },
    select: { id: true, itemCount: true, businessDate: true }
  });

  return { snapshotId: created.id, itemCount: created.itemCount, businessDate: created.businessDate };
}

/**
 * Read-time "latest snapshot for a date" selection - the append-only
 * counterpart to never overwriting a historical row. Pure: given a list of
 * headers (already filtered to one businessDate/dataMode/gender by the
 * caller's query), picks the one with the greatest `capturedAt`. Exported
 * for direct unit testing and for a future Archive read path; this module
 * does not itself perform the DB query, keeping the same read/write
 * separation as `resolveWatchlistSnapshotData` / `captureWatchlistSnapshot`.
 */
export function selectLatestSnapshotForDate<T extends { capturedAt: Date }>(snapshots: T[]): T | null {
  if (snapshots.length === 0) return null;
  return snapshots.reduce((latest, candidate) => (candidate.capturedAt > latest.capturedAt ? candidate : latest));
}
