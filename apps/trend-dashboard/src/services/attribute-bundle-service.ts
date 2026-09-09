import { extractDirectAttributeRelations, type AttributeSourceField } from "@/collectors/editorial/attribute-relations";
import { contentBlocksFromStoredText, resolveEvidenceImage, type ImageRelationKind } from "@/collectors/editorial/image-relation";
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
  /** Article hero image (EditorialPost.imageUrl) - a picture of the ARTICLE, never the item. Safe for an evidence-article thumbnail, never a bundle hero. */
  imageUrl: string | null;
  /** Set only when resolveEvidenceImage found DIRECT_BLOCK/ADJACENT_BLOCK evidence - the only image safe to use as a bundle hero. */
  evidenceImageUrl: string | null;
  imageRelation: ImageRelationKind;
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
  /**
   * Independent evidence cluster count (2026-09-09 signal trust pass - see
   * docs/EDITORIAL_SIGNAL_TRUST_AUDIT.md, "Ranking change decision"). Unlike
   * bundleArticlePresence, this collapses two same-source articles into ONE
   * cluster when one is roundup-shaped and the other is a dedicated piece
   * published within SAME_CASE_WINDOW_DAYS of it - the audit's own real
   * finding (두 개 HYPEBEAST_KR weekly-roundup mentions each restated a
   * story the SAME outlet had already covered in a dedicated article 2 days
   * earlier). Always >= 1 for any non-empty bundle, and always
   * <= bundleArticlePresence.
   */
  independentEvidenceClusterCount: number;
  latestObservedAt: Date | null;
  evidenceArticles: BundleEvidenceArticle[];
};

export type BundleEvidenceStrength =
  | "단일 관측"
  | "반복 관측 · 동일 사례 재언급"
  | "반복 관측 · 서로 다른 사례"
  | "여러 매체 동시 관찰"
  | "강한 트렌드 후보";

type PostRelations = {
  postId: string;
  source: string;
  title: string;
  url: string;
  publishedAt: Date | null;
  imageUrl: string | null;
  blocks: ReturnType<typeof contentBlocksFromStoredText>;
  byItem: Map<string, Array<{ type: string; value: string; evidenceText: string; sourceField: AttributeSourceField }>>;
};

// A post whose OWN relations span this many or more distinct specific items
// is treated as "roundup-shaped" for independence clustering - a multi-brand
// weekly digest, not a dedicated single-product write-up. Empirically every
// dedicated REAL article in the corpus touches <=2 distinct items; the one
// weekly-roundup article (and one full bag+wardrobe campaign piece) touch
// exactly 3. See docs/EDITORIAL_SIGNAL_TRUST_AUDIT.md, "Roundup effect".
const ROUNDUP_BREADTH_THRESHOLD = 3;

// Two SAME-SOURCE evidence articles, exactly one of them roundup-shaped,
// published within this many days of each other, are treated as the SAME
// underlying observation (a roundup restating a story its own outlet
// already covered) rather than two independent repetitions. Every real
// same-case pair found in the audit was 2 days apart; 7 days leaves room for
// a typical weekly-digest cadence while still requiring the breadth
// asymmetry below to actually fire - it never merges two dedicated articles
// or two roundups from the same source just for being close in time.
const SAME_CASE_WINDOW_DAYS = 7;

type ClusterInput = { source: string; publishedAt: Date | null; breadth: number };

/**
 * Independent evidence cluster count for one bundle's full (unsliced)
 * evidence list. Deterministic, service-time only - no DB field, no new
 * taxonomy, no brand/entity matching. Exported for direct unit testing.
 *
 * Model (deliberately NOT a transitive union-find over all pairs - see
 * below for why): every "dedicated" article (breadth < ROUNDUP_BREADTH_
 * THRESHOLD) is always its own independent cluster, full stop - two
 * dedicated articles from the same source, however close in time (e.g. the
 * audit's real Denim Tears x BBC + adidas x JENNIE pair, 2 days apart, same
 * outlet, genuinely different products), NEVER merge with each other. A
 * "roundup-shaped" article (breadth >= ROUNDUP_BREADTH_THRESHOLD) is only
 * ever ABSORBED into an existing dedicated article's cluster - contributing
 * zero additional clusters - when at least one dedicated article in the
 * same bundle shares its source and sits within SAME_CASE_WINDOW_DAYS of it
 * (the audit's real 라글란 시퀸/재활용 원단 pattern: a weekly roundup restating
 * a story its own outlet already covered in a dedicated piece). An
 * unabsorbed roundup (no correlated dedicated article) counts as its own
 * cluster. Two roundup-shaped articles never merge with each other.
 *
 * Why not transitive union-find: if article A (dedicated) and article C
 * (dedicated, unrelated to A) both happen to sit within the window of the
 * SAME roundup B, a naive pairwise-merge-then-union would fuse A and C into
 * one cluster via B as a hub - incorrectly treating two unrelated dedicated
 * pieces as "the same case" merely because one roundup mentioned both. The
 * absorption model below lets B disappear into *a* dedicated cluster
 * without ever linking A and C to each other.
 */
export function countIndependentEvidenceClusters(articles: ClusterInput[]): number {
  const dedicated = articles.filter((article) => article.breadth < ROUNDUP_BREADTH_THRESHOLD);
  const roundups = articles.filter((article) => article.breadth >= ROUNDUP_BREADTH_THRESHOLD);

  let clusters = dedicated.length;
  for (const roundup of roundups) {
    const absorbed = dedicated.some((article) => {
      if (article.source !== roundup.source) return false;
      if (!article.publishedAt || !roundup.publishedAt) return false;
      const daysApart = Math.abs(article.publishedAt.getTime() - roundup.publishedAt.getTime()) / 86_400_000;
      return daysApart <= SAME_CASE_WINDOW_DAYS;
    });
    if (!absorbed) clusters += 1;
  }
  return clusters;
}

/**
 * Evidence strength wording, mirroring the conservative rules already used
 * for editorial trends: raw counts never imply breadth, and only 3+ distinct
 * outlets WITH recent movement may be called a trend candidate. The two
 * "반복 관측" labels require `independentEvidenceClusterCount` precisely
 * because raw article count alone cannot tell a genuinely repeated
 * observation (서로 다른 사례) from a roundup restating its own outlet's
 * dedicated coverage (동일 사례 재언급) - see countIndependentEvidenceClusters.
 */
export function bundleEvidenceStrength(input: {
  articlePresence: number;
  sourceSpread: number;
  independentEvidenceClusterCount?: number;
  recentArticlePresence?: number;
}): BundleEvidenceStrength {
  if (input.sourceSpread >= 3 && (input.recentArticlePresence ?? 0) > 0) return "강한 트렌드 후보";
  if (input.sourceSpread >= 2) return "여러 매체 동시 관찰";
  if (input.articlePresence >= 2) {
    return (input.independentEvidenceClusterCount ?? input.articlePresence) >= 2 ? "반복 관측 · 서로 다른 사례" : "반복 관측 · 동일 사례 재언급";
  }
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
    rows.push({
      postId: post.id,
      source: post.source,
      title: post.title,
      url: post.url,
      publishedAt: post.publishedAt,
      imageUrl: post.imageUrl,
      blocks: contentBlocksFromStoredText(post.text),
      byItem
    });
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

  // Breadth (distinct specific items with a direct relation) per post,
  // computed once up front - the cheap, deterministic "is this a roundup"
  // proxy countIndependentEvidenceClusters relies on.
  const breadthByPost = new Map(postRelations.map((post) => [post.postId, post.byItem.size]));

  type Acc = {
    specificItem: string;
    attributes: Array<{ type: string; value: string }>;
    articles: Set<string>;
    sources: Set<string>;
    latest: Date | null;
    evidence: BundleEvidenceArticle[];
    clusterInputs: ClusterInput[];
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
        evidence: [],
        clusterInputs: []
      };
      acc.articles.add(post.postId);
      acc.sources.add(post.source);
      if (post.publishedAt && (!acc.latest || post.publishedAt > acc.latest)) acc.latest = post.publishedAt;
      acc.clusterInputs.push({ source: post.source, publishedAt: post.publishedAt, breadth: breadthByPost.get(post.postId) ?? 1 });
      const primary = unique[0];
      const resolved = primary ? resolveEvidenceImage(post.blocks, primary.evidenceText) : { kind: "NONE" as const, imageUrl: null };
      const imageRelation: ImageRelationKind = resolved.kind !== "NONE" ? resolved.kind : post.imageUrl ? "ARTICLE_HERO" : "NONE";
      acc.evidence.push({
        source: post.source,
        title: post.title,
        url: post.url,
        publishedAt: post.publishedAt,
        imageUrl: post.imageUrl,
        evidenceImageUrl: resolved.imageUrl,
        imageRelation,
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
      independentEvidenceClusterCount: countIndependentEvidenceClusters(acc.clusterInputs),
      latestObservedAt: acc.latest,
      evidenceArticles: acc.evidence.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)).slice(0, 5)
    }))
    .sort(
      (a, b) =>
        b.bundleSourceSpread - a.bundleSourceSpread ||
        b.independentEvidenceClusterCount - a.independentEvidenceClusterCount ||
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

/**
 * Bundles are already sorted (source spread, then independent evidence
 * cluster count, then article presence, then attribute richness) by
 * getAttributeBundles, so the first bundle for a given specific item is its
 * strongest direct-attribute evidence. Used to
 * highlight one bundle at the top of the item detail page - TOTE_BAG has
 * one (재활용 원단 토트백), TRACK_JACKET has none (direct attributes = 0).
 */
export async function getPrimaryBundleForItem(specificItem: string, dataMode = "real"): Promise<AttributeBundle | null> {
  const bundles = await getAttributeBundles(dataMode);
  return bundles.find((bundle) => bundle.specificItem === specificItem) ?? null;
}

/**
 * The bundle hero image must be document-position evidence (DIRECT_BLOCK or
 * ADJACENT_BLOCK to the attribute's evidence text), never the article's
 * overall hero image (imageUrl/ARTICLE_HERO) used as a stand-in product
 * photo - that is exactly how an unrelated article's hero photo ends up
 * looking like "the" recycled-fabric tote bag. Picked deterministically -
 * the first evidence article (already sorted newest-first) that has one -
 * and the same image may legitimately be reused across bundles that share
 * an evidence article. Returns null (never a guessed image, never a hero
 * fallback) when no evidence article has a position-confident image, so the
 * UI falls back to an attribute-centric panel instead.
 */
export function selectBundleHeroImage(evidenceArticles: BundleEvidenceArticle[]): string | null {
  return evidenceArticles.find((article) => article.evidenceImageUrl)?.evidenceImageUrl ?? null;
}

/**
 * Bundle-first planning-insight priority: a bundle backed by >=2 INDEPENDENT
 * evidence clusters (even from one source) is the most concrete signal
 * available, a single-observation bundle is still stronger than a bare
 * specific-item mention with no proven attribute, and neither is fabricated
 * when the REAL corpus has none - callers must fall back to the older
 * specific-item insight only when this returns null.
 *
 * Qualifies on `independentEvidenceClusterCount`, not raw
 * `bundleArticlePresence` (2026-09-09 signal trust pass - see
 * docs/EDITORIAL_SIGNAL_TRUST_AUDIT.md): a bundle with 2 articles from the
 * same outlet that turn out to be one dedicated piece plus that outlet's own
 * roundup restating it is only 1 real independent observation, no stronger
 * than a well-evidenced singleton, and must not be promoted as if it were.
 * `bundles` is expected pre-sorted (as getAttributeBundles already returns,
 * cluster count is its 2nd sort key), so the first qualifying bundle
 * encountered is also the strongest one.
 */
export function selectPrimaryPlanningBundle(bundles: AttributeBundle[]): AttributeBundle | null {
  return bundles.find((bundle) => bundle.independentEvidenceClusterCount >= 2) ?? bundles[0] ?? null;
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
