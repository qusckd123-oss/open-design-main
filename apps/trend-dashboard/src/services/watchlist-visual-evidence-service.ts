import { prisma } from "@/db/client";
import {
  articleContextVisual,
  deriveAdjacentVisualEvidence,
  findExactBundlePrimaryRelation,
  selectWatchlistVisualEvidence,
  type WatchlistVisualEvidence
} from "@/lib/watchlist-visual-evidence";
import type { AttributeBundle } from "@/services/attribute-bundle-service";

const MAX_WATCHLIST_BUNDLES = 5;
const MAX_ARTICLES_PER_BUNDLE = 5;
const MAX_ADJACENT_POSTS = 10;

/**
 * Read-only, batch-derived CURRENT presentation data. EYESMAG article text is
 * scanned in one bounded metadata query so older exact relations (including
 * the audited Burberry check-shirt article) are not hidden by the bundle's
 * recent-context window. Ordered blocks are fetched only for at most ten exact
 * item+attribute matches. The frozen bundle service/order is untouched.
 */
export async function getWatchlistVisualEvidence(
  bundles: readonly AttributeBundle[]
): Promise<Map<string, WatchlistVisualEvidence[]>> {
  const boundedBundles = bundles.slice(0, MAX_WATCHLIST_BUNDLES);
  const eyesmagPosts = boundedBundles.length === 0 ? [] : await prisma.editorialPost.findMany({
    where: { dataMode: "real", source: "EYESMAG" },
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take: 200,
    select: {
      id: true,
      source: true,
      title: true,
      url: true,
      publishedAt: true,
      text: true,
      excerpt: true
    }
  });
  const postsByBundle = boundedBundles.map((bundle) => ({
    bundle,
    posts: eyesmagPosts
      .filter((post) => findExactBundlePrimaryRelation(bundle, post) !== null)
      .slice(0, 2)
  }));
  const adjacentPostIds = [...new Set(postsByBundle.flatMap(({ posts }) => posts.map((post) => post.id))) ]
    .slice(0, MAX_ADJACENT_POSTS);
  const blocks = adjacentPostIds.length === 0 ? [] : await prisma.editorialContentBlock.findMany({
    where: { postId: { in: adjacentPostIds } },
    orderBy: [{ postId: "asc" }, { blockIndex: "asc" }],
    select: { postId: true, blockIndex: true, blockType: true, text: true, imageUrl: true, caption: true }
  });
  const blocksByPost = new Map<string, typeof blocks>();
  for (const block of blocks) {
    const list = blocksByPost.get(block.postId) ?? [];
    list.push(block);
    blocksByPost.set(block.postId, list);
  }

  return new Map(postsByBundle.map(({ bundle, posts }) => {
    const candidates: WatchlistVisualEvidence[] = [];
    const adjacentUrls = new Set<string>();
    for (const post of posts) {
      const relation = findExactBundlePrimaryRelation(bundle, post);
      if (!relation) continue;
      const article = {
        source: post.source,
        title: post.title,
        url: post.url,
        publishedAt: post.publishedAt,
        imageUrl: null,
        evidenceImageUrl: null,
        imageRelation: "NONE" as const,
        evidenceText: relation.evidenceText,
        sourceField: relation.sourceField
      };
      const adjacent = deriveAdjacentVisualEvidence(bundle, article, post, (blocksByPost.get(post.id) ?? []).map((block) => ({
        blockIndex: block.blockIndex,
        blockType: block.blockType as "TEXT" | "IMAGE",
        text: block.text,
        imageUrl: block.imageUrl,
        caption: block.caption
      })));
      if (adjacent) {
        candidates.push(adjacent);
        adjacentUrls.add(adjacent.articleUrl);
      }
    }
    for (const article of bundle.evidenceArticles.slice(0, MAX_ARTICLES_PER_BUNDLE)) {
      if (adjacentUrls.has(article.url)) continue;
      const candidate = articleContextVisual(article);
      if (candidate) candidates.push(candidate);
    }
    return [bundle.key, selectWatchlistVisualEvidence(candidates, 6)];
  }));
}
