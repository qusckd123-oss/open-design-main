import { prisma } from "@/db/client";
import { getAttributeBundles, selectPrimaryPlanningBundle } from "./attribute-bundle-service";
import { editorialSources, type EditorialSource } from "@/config/editorial-sources";

/**
 * A point-in-time read of the metrics every pass in this project's audit
 * chain has treated as the corpus's health indicators - the same fields
 * `scripts/audit-editorial-quality.ts` prints by hand, computed once here so
 * `scripts/refresh-editorial.ts` (the orchestration runner) can capture a
 * BEFORE and AFTER snapshot and diff them, instead of re-deriving this logic
 * inline. Read-only - never writes anything.
 */
export type EditorialRefreshSnapshot = {
  totalPosts: number;
  totalMentions: number;
  canonicalDuplicates: number;
  mentionDuplicates: number;
  marketSnapshots: number;
  bundles: number;
  independentRepeated: number;
  multiSourceIndependent: number;
  publisherFamilyDiverse: number;
  currentPrimary: string | null;
  perSource: Record<string, { postCount: number; mostRecentPublishedAt: Date | null }>;
};

export async function getEditorialRefreshSnapshot(): Promise<EditorialRefreshSnapshot> {
  const posts = await prisma.editorialPost.findMany({
    where: { dataMode: "real" },
    select: { id: true, source: true, canonicalUrl: true, url: true, publishedAt: true }
  });
  const mentionRows = await prisma.editorialMention.findMany({
    where: { post: { dataMode: "real" } },
    select: { postId: true, type: true, value: true }
  });
  const marketSnapshots = await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } });

  const canonicalCounts = new Map<string, number>();
  for (const post of posts) {
    const key = (post.canonicalUrl || post.url || "").trim().toLowerCase();
    if (!key) continue;
    canonicalCounts.set(key, (canonicalCounts.get(key) ?? 0) + 1);
  }
  const canonicalDuplicates = [...canonicalCounts.values()].filter((count) => count > 1).length;
  const mentionKeys = mentionRows.map((mention) => `${mention.postId}:${mention.type}:${mention.value}`);
  const mentionDuplicates = mentionKeys.length - new Set(mentionKeys).size;

  const perSource: EditorialRefreshSnapshot["perSource"] = {};
  for (const source of editorialSources) {
    const sourcePosts = posts.filter((post) => post.source === source);
    const mostRecent = sourcePosts.reduce<Date | null>((latest, post) => {
      if (!post.publishedAt) return latest;
      return !latest || post.publishedAt > latest ? post.publishedAt : latest;
    }, null);
    perSource[source] = { postCount: sourcePosts.length, mostRecentPublishedAt: mostRecent };
  }

  const bundles = await getAttributeBundles("real");
  const independentRepeated = bundles.filter((bundle) => bundle.independentEvidenceClusterCount >= 2).length;
  const multiSourceIndependent = bundles.filter((bundle) => bundle.bundleSourceSpread >= 2).length;
  const publisherFamilyDiverse = bundles.filter((bundle) => bundle.bundleSourceSpread >= 2 && bundle.publisherFamilySpread >= 2).length;
  const primary = selectPrimaryPlanningBundle(bundles);

  return {
    totalPosts: posts.length,
    totalMentions: mentionRows.length,
    canonicalDuplicates,
    mentionDuplicates,
    marketSnapshots,
    bundles: bundles.length,
    independentRepeated,
    multiSourceIndependent,
    publisherFamilyDiverse,
    currentPrimary: primary?.displayName ?? null,
    perSource
  };
}

export type { EditorialSource };
