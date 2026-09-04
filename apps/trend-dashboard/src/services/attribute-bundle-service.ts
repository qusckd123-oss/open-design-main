import { extractDirectAttributeRelations, type AttributeSourceField } from "@/collectors/editorial/attribute-relations";
import { prisma } from "@/db/client";
import { composeBundleName } from "@/lib/korean-labels";

/**
 * ITEM + ATTRIBUTE BUNDLES
 *
 * A bundle is a specific item plus the set of attributes that were found
 * DIRECTLY modifying that item inside one article. It is a strictly stronger
 * claim than article co-occurrence (see editorial-analytics-service's
 * getSpecificItemEditorialDetail), which only says "these appeared in the
 * same article".
 *
 * Relations are derived on demand from already-stored EditorialPost text
 * rather than persisted in their own table. At the current corpus size (148
 * REAL posts, of which only ~40 carry real body text) extraction costs
 * milliseconds, and skipping a table keeps EditorialPost/EditorialMention/
 * MarketRankingSnapshot completely untouched - no migration, no reparse, no
 * drift between a cached relation table and the article text it came from.
 * Revisit this if the corpus grows to a size where per-request extraction
 * stops being cheap.
 */

export type BundleAttribute = {
  type: string;
  value: string;
  articlePresence: number;
  sourceSpread: number;
};

export type BundleEvidenceArticle = {
  source: string;
  title: string;
  url: string;
  publishedAt: Date | null;
  imageUrl: string | null;
  evidenceText: string;
  sourceField: AttributeSourceField;
};

export type AttributeBundle = {
  key: string;
  specificItem: string;
  displayName: string;
  directAttributes: BundleAttribute[];
  bundleArticlePresence: number;
  bundleSourceSpread: number;
  latestObservedAt: Date | null;
  evidenceArticles: BundleEvidenceArticle[];
};

export type BundleEvidenceStrength = "단일 관측" | "반복 관측 · 특정 매체 집중" | "여러 매체 동시 관찰" | "강한 트렌드 후보";

type PostRelations = {
  postId: string;
  source: string;
  title: string;
  url: string;
  publishedAt: Date | null;
  imageUrl: string | null;
  byItem: Map<string, Array<{ type: string; value: string; evidenceText: string; sourceField: AttributeSourceField }>>;
};

/**
 * Evidence strength wording, mirroring the conservative rules already used
 * for editorial trends: raw counts never imply breadth, and only 3+ distinct
 * outlets WITH recent movement may be called a trend candidate.
 */
export function bundleEvidenceStrength(input: { articlePresence: number; sourceSpread: number; recentArticlePresence?: number }): BundleEvidenceStrength {
  if (input.sourceSpread >= 3 && (input.recentArticlePresence ?? 0) > 0) return "강한 트렌드 후보";
  if (input.sourceSpread >= 2) return "여러 매체 동시 관찰";
  if (input.articlePresence >= 2) return "반복 관측 · 특정 매체 집중";
  return "단일 관측";
}

async function loadPostRelations(dataMode: string): Promise<PostRelations[]> {
  // Same relevance gate as getEditorialTrendRows, so bundle article counts
  // reconcile with the trend numbers shown next to them.
  const posts = await prisma.editorialPost.findMany({
    where: { dataMode, fashionRelevance: "FASHION_RELEVANT" },
    select: { id: true, source: true, title: true, url: true, publishedAt: true, imageUrl: true, excerpt: true, text: true }
  });

  const rows: PostRelations[] = [];
  for (const post of posts) {
    const relations = extractDirectAttributeRelations(post);
    if (relations.length === 0) continue;
    const byItem = new Map<string, Array<{ type: string; value: string; evidenceText: string; sourceField: AttributeSourceField }>>();
    for (const relation of relations) {
      byItem.set(relation.specificItem, [
        ...(byItem.get(relation.specificItem) ?? []),
        { type: relation.attributeType, value: relation.attributeValue, evidenceText: relation.evidenceText, sourceField: relation.sourceField }
      ]);
    }
    rows.push({ postId: post.id, source: post.source, title: post.title, url: post.url, publishedAt: post.publishedAt, imageUrl: post.imageUrl, byItem });
  }
  return rows;
}

/**
 * Bundles are keyed by item + the exact attribute set observed together in a
 * single article. Attributes seen in different articles are never merged into
 * one multi-attribute bundle: TOTE_BAG+BIG (article 1) and TOTE_BAG+RED
 * (article 2) must not become "big red tote bag".
 */
export async function getAttributeBundles(dataMode = "real"): Promise<AttributeBundle[]> {
  const postRelations = await loadPostRelations(dataMode);

  type Acc = {
    specificItem: string;
    attributes: Array<{ type: string; value: string }>;
    articles: Set<string>;
    sources: Set<string>;
    latest: Date | null;
    evidence: BundleEvidenceArticle[];
  };
  const bundles = new Map<string, Acc>();
  // Per-attribute presence is counted across all articles where that
  // attribute was directly attached to the item, independent of bundle key.
  const attributeStats = new Map<string, { articles: Set<string>; sources: Set<string> }>();

  for (const post of postRelations) {
    for (const [specificItem, attributes] of post.byItem.entries()) {
      const unique = dedupeAttributes(attributes);
      const key = bundleKey(specificItem, unique);
      const acc = bundles.get(key) ?? {
        specificItem,
        attributes: unique.map(({ type, value }) => ({ type, value })),
        articles: new Set<string>(),
        sources: new Set<string>(),
        latest: null,
        evidence: []
      };
      acc.articles.add(post.postId);
      acc.sources.add(post.source);
      if (post.publishedAt && (!acc.latest || post.publishedAt > acc.latest)) acc.latest = post.publishedAt;
      const primary = unique[0];
      acc.evidence.push({
        source: post.source,
        title: post.title,
        url: post.url,
        publishedAt: post.publishedAt,
        imageUrl: post.imageUrl,
        evidenceText: primary?.evidenceText ?? "",
        sourceField: primary?.sourceField ?? "BODY"
      });
      bundles.set(key, acc);

      for (const attribute of unique) {
        const statKey = `${specificItem}|${attribute.type}|${attribute.value}`;
        const stat = attributeStats.get(statKey) ?? { articles: new Set<string>(), sources: new Set<string>() };
        stat.articles.add(post.postId);
        stat.sources.add(post.source);
        attributeStats.set(statKey, stat);
      }
    }
  }

  return [...bundles.entries()]
    .map(([key, acc]) => ({
      key,
      specificItem: acc.specificItem,
      displayName: composeBundleName(acc.specificItem, acc.attributes),
      directAttributes: acc.attributes.map((attribute) => {
        const stat = attributeStats.get(`${acc.specificItem}|${attribute.type}|${attribute.value}`);
        return {
          type: attribute.type,
          value: attribute.value,
          articlePresence: stat?.articles.size ?? 0,
          sourceSpread: stat?.sources.size ?? 0
        };
      }),
      bundleArticlePresence: acc.articles.size,
      bundleSourceSpread: acc.sources.size,
      latestObservedAt: acc.latest,
      evidenceArticles: acc.evidence.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)).slice(0, 5)
    }))
    .sort(
      (a, b) =>
        b.bundleSourceSpread - a.bundleSourceSpread ||
        b.bundleArticlePresence - a.bundleArticlePresence ||
        b.directAttributes.length - a.directAttributes.length ||
        a.displayName.localeCompare(b.displayName)
    );
}

/**
 * Direct attributes for one specific item, aggregated across articles. This
 * is the "[직접 속성 근거]" surface on the item detail page - strictly
 * separate from article co-occurrence.
 */
export async function getSpecificItemDirectAttributes(specificItem: string, dataMode = "real"): Promise<BundleAttribute[]> {
  const postRelations = await loadPostRelations(dataMode);
  const stats = new Map<string, { type: string; value: string; articles: Set<string>; sources: Set<string> }>();
  for (const post of postRelations) {
    for (const attribute of dedupeAttributes(post.byItem.get(specificItem) ?? [])) {
      const key = `${attribute.type}|${attribute.value}`;
      const stat = stats.get(key) ?? { type: attribute.type, value: attribute.value, articles: new Set<string>(), sources: new Set<string>() };
      stat.articles.add(post.postId);
      stat.sources.add(post.source);
      stats.set(key, stat);
    }
  }
  return [...stats.values()]
    .map((stat) => ({ type: stat.type, value: stat.value, articlePresence: stat.articles.size, sourceSpread: stat.sources.size }))
    .sort((a, b) => b.articlePresence - a.articlePresence || b.sourceSpread - a.sourceSpread || a.value.localeCompare(b.value));
}

function dedupeAttributes<T extends { type: string; value: string }>(attributes: T[]): T[] {
  const seen = new Set<string>();
  return attributes.filter((attribute) => {
    const key = `${attribute.type}|${attribute.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bundleKey(specificItem: string, attributes: Array<{ type: string; value: string }>): string {
  const sorted = attributes.map((attribute) => `${attribute.type}:${attribute.value}`).sort();
  return `${specificItem}#${sorted.join("+")}`;
}
