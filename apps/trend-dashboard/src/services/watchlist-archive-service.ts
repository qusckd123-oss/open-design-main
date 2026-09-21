import { prisma } from "@/db/client";
import type { BundleAttribute } from "./attribute-bundle-service";
import { selectLatestSnapshotForDate } from "./watchlist-snapshot-service";

/**
 * WATCHLIST ARCHIVE READ LAYER (Phase 7A).
 *
 * Read-only. Renders ONLY persisted WatchlistSnapshot/WatchlistSnapshotItem
 * rows (see prisma/schema.prisma's WatchlistSnapshot doc comment and
 * watchlist-snapshot-service.ts) - it never calls getAttributeBundles or any
 * other live resolver, and never reads EditorialPost/EditorialMention to
 * reconstruct a historical date. "What did the Watchlist show on date X" is
 * answered exclusively from what was actually captured on that date, which
 * may legitimately be nothing for any date before capture began.
 *
 * Pure/I-O split mirrors watchlist-snapshot-service.ts: the `summarize*` /
 * `select*` / `sortItemsByRank` functions below take already-fetched rows and
 * contain no `prisma` calls, so they are directly unit-testable without a
 * database connection (see scripts/test-watchlist-archive.ts).
 */

export type ArchiveSnapshotHeader = {
  id: string;
  capturedAt: Date;
  businessDate: string;
  algorithmVersion: string;
  dataMode: string;
  gender: string;
  triggeredBy: string;
  itemCount: number;
  sourceEditorialPostCount: number;
  sourceLatestPublishedAt: Date | null;
};

export type ArchiveSnapshotItem = {
  rank: number;
  bundleKey: string;
  specificItem: string;
  signalName: string;
  displayName: string;
  directAttributes: BundleAttribute[];
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
  directionStatus: string;
};

export type ArchiveDateSummary = {
  businessDate: string;
  captureCount: number;
  latest: ArchiveSnapshotHeader;
};

const HEADER_SELECT = {
  id: true,
  capturedAt: true,
  businessDate: true,
  algorithmVersion: true,
  dataMode: true,
  gender: true,
  triggeredBy: true,
  itemCount: true,
  sourceEditorialPostCount: true,
  sourceLatestPublishedAt: true
} as const;

/**
 * Groups already-fetched headers by businessDate, picks the latest capture
 * per date via the SAME append-only "latest wins" rule the snapshot writer
 * itself documents (selectLatestSnapshotForDate, reused verbatim - never
 * reimplemented here), and sorts dates newest-first. Multiple same-day
 * captures are counted, never hidden or collapsed into one row.
 */
export function summarizeArchiveDates(headers: ArchiveSnapshotHeader[]): ArchiveDateSummary[] {
  const byDate = new Map<string, ArchiveSnapshotHeader[]>();
  for (const header of headers) {
    const list = byDate.get(header.businessDate) ?? [];
    list.push(header);
    byDate.set(header.businessDate, list);
  }

  const summaries: ArchiveDateSummary[] = [];
  for (const [businessDate, list] of byDate) {
    const latest = selectLatestSnapshotForDate(list);
    if (!latest) continue;
    summaries.push({ businessDate, captureCount: list.length, latest });
  }

  return summaries.sort((a, b) => (a.businessDate < b.businessDate ? 1 : a.businessDate > b.businessDate ? -1 : 0));
}

/**
 * Picks one header from a same-date capture list: the explicitly requested
 * `captureId` if it actually belongs to this list, otherwise the latest
 * capture for that date (never an arbitrary/first-in-array fallback). `null`
 * only when the input list itself is empty (nonexistent date).
 */
export function selectCaptureFromHeaders(headers: ArchiveSnapshotHeader[], captureId: string | null): ArchiveSnapshotHeader | null {
  if (headers.length === 0) return null;
  if (captureId) {
    const requested = headers.find((header) => header.id === captureId);
    if (requested) return requested;
  }
  return selectLatestSnapshotForDate(headers);
}

/** Ranks are already assigned 1..N at capture time (see buildSnapshotItems) - this only guards against out-of-order DB return, never re-derives rank. */
export function sortItemsByRank<T extends { rank: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.rank - b.rank);
}

type RawSnapshotItemRow = {
  rank: number;
  bundleKey: string;
  specificItem: string;
  signalName: string;
  displayName: string;
  directAttributes: string;
  evidenceStrength: string;
  bundleArticlePresence: number;
  bundleSourceSpread: number;
  independentEvidenceClusterCount: number;
  publisherFamilySpread: number;
  latestObservedAt: Date | null;
  observedFact: string;
  unknowns: string;
  planningQuestion: string;
  isPrimarySignal: boolean;
  directionStatus: string;
};

/** Parses the two JSON-encoded string columns (directAttributes, unknowns) back into the shapes buildSnapshotItems originally serialized - the read-side mirror of that write. */
export function parseSnapshotItemRow(row: RawSnapshotItemRow): ArchiveSnapshotItem {
  return {
    rank: row.rank,
    bundleKey: row.bundleKey,
    specificItem: row.specificItem,
    signalName: row.signalName,
    displayName: row.displayName,
    directAttributes: JSON.parse(row.directAttributes) as BundleAttribute[],
    evidenceStrength: row.evidenceStrength,
    bundleArticlePresence: row.bundleArticlePresence,
    bundleSourceSpread: row.bundleSourceSpread,
    independentEvidenceClusterCount: row.independentEvidenceClusterCount,
    publisherFamilySpread: row.publisherFamilySpread,
    latestObservedAt: row.latestObservedAt,
    observedFact: row.observedFact,
    unknowns: JSON.parse(row.unknowns) as string[],
    planningQuestion: row.planningQuestion,
    isPrimarySignal: row.isPrimarySignal,
    directionStatus: row.directionStatus
  };
}

/**
 * All archive dates for (dataMode, gender), newest first, with per-date
 * capture counts and the latest header for each. One query - no N+1 across
 * dates.
 */
export async function listArchiveDates(dataMode = "real", gender = "all"): Promise<ArchiveDateSummary[]> {
  const headers = await prisma.watchlistSnapshot.findMany({
    where: { dataMode, gender },
    select: HEADER_SELECT
  });
  return summarizeArchiveDates(headers);
}

/** Every capture header for one exact businessDate, newest-first - used both to render "N captures" and to resolve an explicit ?capture= selection. */
export async function listCapturesForDate(businessDate: string, dataMode = "real", gender = "all"): Promise<ArchiveSnapshotHeader[]> {
  return prisma.watchlistSnapshot.findMany({
    where: { businessDate, dataMode, gender },
    select: HEADER_SELECT,
    orderBy: { capturedAt: "desc" }
  });
}

/** Full header + rank-ordered items for one exact snapshot id. `null` when the id does not exist (never throws). */
export async function getArchiveSnapshotDetail(snapshotId: string): Promise<{ header: ArchiveSnapshotHeader; items: ArchiveSnapshotItem[] } | null> {
  const snapshot = await prisma.watchlistSnapshot.findUnique({
    where: { id: snapshotId },
    include: { items: true }
  });
  if (!snapshot) return null;

  const header: ArchiveSnapshotHeader = {
    id: snapshot.id,
    capturedAt: snapshot.capturedAt,
    businessDate: snapshot.businessDate,
    algorithmVersion: snapshot.algorithmVersion,
    dataMode: snapshot.dataMode,
    gender: snapshot.gender,
    triggeredBy: snapshot.triggeredBy,
    itemCount: snapshot.itemCount,
    sourceEditorialPostCount: snapshot.sourceEditorialPostCount,
    sourceLatestPublishedAt: snapshot.sourceLatestPublishedAt
  };
  const items = sortItemsByRank(snapshot.items.map(parseSnapshotItemRow));
  return { header, items };
}
