import assert from "node:assert/strict";
import {
  articleContextVisual,
  deriveAdjacentVisualEvidence,
  selectWatchlistVisualEvidence,
  type WatchlistVisualEvidence
} from "../src/lib/watchlist-visual-evidence";
import type { BundleEvidenceArticle } from "../src/services/attribute-bundle-service";

const relationText = "하우스 체크 디테일을 더한 폴로 셔츠";
const bundle = {
  specificItem: "SHIRT",
  directAttributes: [{ type: "DETAIL", value: "CHECK", articlePresence: 1, sourceSpread: 1 }]
};
const article: BundleEvidenceArticle = {
  source: "EYESMAG",
  title: "버버리 CITY ICONS",
  url: "https://eyesmag.com/posts/164804/burberry-spring-2024-collection",
  publishedAt: new Date("2026-07-03T00:00:00.000Z"),
  imageUrl: "https://cdn.eyesmag.com/article-hero.jpg",
  evidenceImageUrl: null,
  imageRelation: "ARTICLE_HERO",
  evidenceText: relationText,
  sourceField: "BODY"
};
const post = {
  source: "EYESMAG",
  title: article.title,
  url: article.url,
  publishedAt: article.publishedAt,
  text: `화사와 나린은 버버리의 워드로브를 선보였다. ${relationText}.`,
  excerpt: null
};
const adjacentBlocks = [
  { blockIndex: 15, blockType: "IMAGE" as const, text: null, imageUrl: "https://cdn.eyesmag.com/shirt.jpg", caption: null },
  { blockIndex: 16, blockType: "TEXT" as const, text: `화사와 나린은 버버리의 워드로브를 선보였다. ${relationText}.`, imageUrl: null, caption: null }
];
const supportingTextBlock = { blockIndex: 16, blockType: "TEXT" as const, text: `화사와 나린은 버버리의 워드로브를 선보였다. ${relationText}.`, imageUrl: null, caption: null };

const verifiedAdjacent = deriveAdjacentVisualEvidence(bundle, article, post, adjacentBlocks);
assert.equal(verifiedAdjacent?.tier, "ADJACENT_BLOCK", "A mapped relation with an immediately adjacent image must produce ADJACENT only.");
assert.equal(verifiedAdjacent?.imageBlockIndex, 15);
assert.equal(verifiedAdjacent?.textBlockIndex, 16);
assert.equal(verifiedAdjacent?.articleUrl, article.url);

assert.equal(
  deriveAdjacentVisualEvidence(bundle, article, post, [
    { blockIndex: 14, blockType: "IMAGE", text: null, imageUrl: "https://cdn.eyesmag.com/distance-2.jpg", caption: null },
    supportingTextBlock
  ]),
  null,
  "A distance-2 image must never be promoted to ADJACENT."
);
assert.equal(
  deriveAdjacentVisualEvidence(bundle, article, post, [
    { blockIndex: 13, blockType: "IMAGE", text: null, imageUrl: "https://cdn.eyesmag.com/distance-3.jpg", caption: null },
    supportingTextBlock
  ]),
  null,
  "A distance-3 image must never be promoted to ADJACENT."
);
assert.equal(
  deriveAdjacentVisualEvidence(bundle, article, post, [
    { blockIndex: 10, blockType: "IMAGE", text: null, imageUrl: "https://cdn.eyesmag.com/direct.jpg", caption: relationText },
    supportingTextBlock
  ]),
  null,
  "DIRECT remains unavailable in the CURRENT presentation lane."
);

const context = articleContextVisual({ ...article, source: "HYPEBEAST_KR" });
assert.equal(context?.tier, "CONTEXT", "Article hero fallback must remain explicitly CONTEXT.");
assert.equal(context?.imageUrl, article.imageUrl);

const newerContext: WatchlistVisualEvidence = {
  ...context!,
  imageUrl: "https://cdn.eyesmag.com/shirt.jpg?width=640",
  publishedAt: new Date("2026-09-20T00:00:00.000Z")
};
const candidates = [newerContext, verifiedAdjacent!, context!];
const selected = selectWatchlistVisualEvidence(candidates, 3);
assert.equal(selected[0]?.tier, "ADJACENT_BLOCK", "ADJACENT must outrank even newer CONTEXT imagery.");
assert.equal(selected.filter((candidate) => candidate.imageUrl.includes("shirt.jpg")).length, 1, "Image identity must ignore URL query transforms.");
assert.deepEqual(selectWatchlistVisualEvidence(candidates, 3), selected, "Visual selection must be deterministic.");

const frozenRankOrder = ["CHECK_SHIRT", "STRIPE_SHIRT", "WHITE_SKIRT", "DENIM_SHORTS", "DENIM_SKIRT"];
selectWatchlistVisualEvidence(candidates, 3);
assert.deepEqual(frozenRankOrder, ["CHECK_SHIRT", "STRIPE_SHIRT", "WHITE_SKIRT", "DENIM_SHORTS", "DENIM_SKIRT"], "Presentation selection must not mutate Watchlist ranking order.");

console.log("Watchlist visual evidence tests passed");
