import { resolveOrderedEvidenceImage, type OrderedEvidenceBlock } from "@/collectors/editorial/image-relation";
import { extractDirectAttributeRelations } from "@/collectors/editorial/attribute-relations";
import type { AttributeSourceField } from "@/collectors/editorial/attribute-relations";
import type { AttributeBundle, BundleEvidenceArticle } from "@/services/attribute-bundle-service";

export type WatchlistVisualTier = "ADJACENT_BLOCK" | "CONTEXT";

export type WatchlistVisualEvidence = {
  tier: WatchlistVisualTier;
  imageUrl: string;
  source: string;
  title: string;
  articleUrl: string;
  publishedAt: Date | null;
  relationText: string | null;
  textBlockIndex: number | null;
  imageBlockIndex: number | null;
};

export type OrderedEvidencePost = {
  source: string;
  title: string;
  url: string;
  publishedAt: Date | null;
  text: string | null;
  excerpt: string | null;
};

export type BundlePrimaryRelation = { evidenceText: string; sourceField: AttributeSourceField };

const VISUAL_LIMIT = 6;

/**
 * Derives only the audited EYESMAG adjacency tier. Captions are not promoted
 * to DIRECT here: CURRENT's supported evidence lane is ADJACENT or context.
 */
export function deriveAdjacentVisualEvidence(
  bundle: Pick<AttributeBundle, "specificItem" | "directAttributes">,
  article: BundleEvidenceArticle,
  post: OrderedEvidencePost,
  blocks: readonly OrderedEvidenceBlock[]
): WatchlistVisualEvidence | null {
  if (post.source !== "EYESMAG" || !article.evidenceText.trim()) return null;

  const allowedAttributes = new Set(bundle.directAttributes.map((attribute) => `${attribute.type}|${attribute.value}`));
  const relation = extractDirectAttributeRelations({
    title: post.title,
    excerpt: post.excerpt,
    text: post.text ?? ""
  }).find((candidate) =>
    candidate.specificItem === bundle.specificItem &&
    allowedAttributes.has(`${candidate.attributeType}|${candidate.attributeValue}`) &&
    candidate.evidenceText === article.evidenceText
  );
  if (!relation) return null;

  const resolved = resolveOrderedEvidenceImage(blocks, relation.evidenceText);
  if (resolved.kind !== "ADJACENT_BLOCK" || !resolved.imageUrl) return null;

  const textBlock = blocks.find((block) => block.blockType === "TEXT" && Boolean(block.text?.includes(relation.evidenceText)));
  const imageBlock = blocks.find((block) =>
    block.blockType === "IMAGE" && block.imageUrl === resolved.imageUrl &&
    Boolean(textBlock && Math.abs(block.blockIndex - textBlock.blockIndex) === 1)
  );
  if (!textBlock || !imageBlock) return null;

  return {
    tier: "ADJACENT_BLOCK",
    imageUrl: imageBlock.imageUrl!,
    source: post.source,
    title: post.title,
    articleUrl: post.url,
    publishedAt: post.publishedAt,
    relationText: relation.evidenceText,
    textBlockIndex: textBlock.blockIndex,
    imageBlockIndex: imageBlock.blockIndex
  };
}

/** Mirrors the existing exact item+attribute-set bundle boundary without changing its ranking/service. */
export function findExactBundlePrimaryRelation(
  bundle: Pick<AttributeBundle, "specificItem" | "directAttributes">,
  post: OrderedEvidencePost
): BundlePrimaryRelation | null {
  const expected = new Set(bundle.directAttributes.map((attribute) => `${attribute.type}|${attribute.value}`));
  const unique = new Map<string, BundlePrimaryRelation>();
  for (const relation of extractDirectAttributeRelations({
    title: post.title,
    excerpt: post.excerpt,
    text: post.text ?? ""
  })) {
    if (relation.specificItem !== bundle.specificItem) continue;
    const key = `${relation.attributeType}|${relation.attributeValue}`;
    if (expected.has(key) && !unique.has(key)) {
      unique.set(key, { evidenceText: relation.evidenceText, sourceField: relation.sourceField });
    }
  }
  if (unique.size !== expected.size || [...expected].some((key) => !unique.has(key))) return null;
  return unique.values().next().value ?? null;
}

export function articleContextVisual(article: BundleEvidenceArticle): WatchlistVisualEvidence | null {
  if (!article.imageUrl || !article.url) return null;
  return {
    tier: "CONTEXT",
    imageUrl: article.imageUrl,
    source: article.source,
    title: article.title,
    articleUrl: article.url,
    publishedAt: article.publishedAt,
    relationText: null,
    textBlockIndex: null,
    imageBlockIndex: null
  };
}

/** ADJACENT always precedes context; dates and all tie-breaks are stable. */
export function selectWatchlistVisualEvidence(
  candidates: readonly WatchlistVisualEvidence[],
  limit = VISUAL_LIMIT
): WatchlistVisualEvidence[] {
  const safeLimit = Math.max(0, Math.min(VISUAL_LIMIT, Math.trunc(limit)));
  if (safeLimit === 0) return [];

  const tierOrder = (tier: WatchlistVisualTier) => tier === "ADJACENT_BLOCK" ? 0 : 1;
  const sorted = [...candidates].sort((a, b) =>
    tierOrder(a.tier) - tierOrder(b.tier) ||
    (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0) ||
    a.source.localeCompare(b.source) ||
    a.articleUrl.localeCompare(b.articleUrl) ||
    a.imageUrl.localeCompare(b.imageUrl)
  );

  const selected: WatchlistVisualEvidence[] = [];
  const seenImages = new Set<string>();
  let remaining = sorted;
  while (remaining.length > 0 && selected.length < safeLimit) {
    const tier = remaining[0]!.tier;
    const sameTier = remaining.filter((candidate) => candidate.tier === tier);
    const otherTier = remaining.filter((candidate) => candidate.tier !== tier);
    const freshTier = sameTier.filter((candidate) => !seenImages.has(imageIdentity(candidate.imageUrl)));
    if (freshTier.length === 0) {
      remaining = otherTier;
      continue;
    }

    const usedSources = new Set(selected.filter((candidate) => candidate.tier === tier).map((candidate) => candidate.source));
    const next = freshTier.find((candidate) => !usedSources.has(candidate.source)) ?? freshTier[0]!;
    selected.push(next);
    seenImages.add(imageIdentity(next.imageUrl));
    remaining = remaining.filter((candidate) => candidate !== next);
  }
  return selected;
}

function imageIdentity(imageUrl: string): string {
  try {
    const parsed = new URL(imageUrl);
    return `${parsed.hostname.toLowerCase()}${parsed.pathname}`;
  } catch {
    return imageUrl.split(/[?#]/, 1)[0]?.toLowerCase() ?? "";
  }
}
