/**
 * EVIDENCE-BOUND IMAGE RESOLUTION
 *
 * A bundle's hero image must never be the article's overall hero image
 * (EditorialPost.imageUrl) used as if it were a photo of the item+attribute
 * itself - that is exactly the "blue t-shirt on a 재활용 원단 토트백 card"
 * problem this module exists to prevent. An image may only back a bundle
 * when it sits in the SAME content block as the evidence text, or in a
 * block immediately ADJACENT to it. No pixel/content inspection of the
 * image is ever performed - only its position in the article's own document
 * structure relative to the evidence text.
 *
 * 2026-09 audit of the four editorial sources' body parsers
 * (src/collectors/editorial/rss.ts, read end-to-end, no network calls made):
 *
 *   - EYESMAG:       parseEyesmagRichBody walks only TipTap `text` nodes and
 *                     explicitly skips `slider`/`embed` nodes (the only place
 *                     an image could appear), so no image ever reaches the
 *                     flattened body, and no position is recorded.
 *   - HYPEBEAST_KR:   stripHtml() regex-strips ALL tags (including <img>)
 *                     from the RSS content:encoded body before it is stored;
 *                     the single hero image is pulled separately via
 *                     extractImage() with no link back to a position in text.
 *   - NONLABEL:       parseArticlePage uses the og:description meta tag as
 *                     `text` - never walks the article body at all.
 *   - VISLA:          parseVislaRichBody also calls stripHtml() on the
 *                     region before returning it; og:image is fetched
 *                     separately with no position data.
 *
 * On top of that, every one of those paths also runs `.replace(/\s+/g, " ")`
 * (directly, or via stripHtml), collapsing blank-line paragraph breaks into
 * plain spaces - so even paragraph-level boundaries are gone by the time
 * `EditorialPost.text` is written, independent of images.
 *
 * Net result: EditorialPost.text is - today, for all 148 REAL posts - always
 * a single unstructured block with no associated image. resolveEvidenceImage
 * therefore correctly returns "NONE" for every real post right now. This
 * module's logic is written and tested against synthetic block fixtures so
 * it is ready the moment a future collector pass (a deliberate, separately
 * decided change - not part of this pass) starts persisting block-level
 * image position; it does not require, and this pass does not perform, any
 * live re-collection.
 */

export type ImageRelationKind = "DIRECT_BLOCK" | "ADJACENT_BLOCK" | "ARTICLE_HERO" | "NONE";

export type ContentBlock = {
  text: string;
  imageUrl: string | null;
};

/**
 * Honest adapter from what is actually stored today. Real stored text has no
 * preserved block boundaries (see module doc), so this always yields at most
 * one block, and that block never carries an image - accurately reflecting
 * that no document-structure image data exists yet, rather than fabricating
 * paragraph or image boundaries that were never recorded.
 */
export function contentBlocksFromStoredText(text: string | null | undefined): ContentBlock[] {
  const trimmed = (text ?? "").trim();
  return trimmed ? [{ text: trimmed, imageUrl: null }] : [];
}

/**
 * Finds the block containing evidenceText (by substring match) and returns
 * an image only if that block, or a block immediately before/after it,
 * carries one. A distant image elsewhere in the article is never returned -
 * that would be no better than the article-hero fallback this exists to
 * replace.
 */
export function resolveEvidenceImage(
  blocks: ContentBlock[],
  evidenceText: string
): { kind: "DIRECT_BLOCK" | "ADJACENT_BLOCK" | "NONE"; imageUrl: string | null } {
  const trimmedEvidence = evidenceText.trim();
  if (!trimmedEvidence) return { kind: "NONE", imageUrl: null };
  const index = blocks.findIndex((block) => block.text.includes(trimmedEvidence));
  if (index === -1) return { kind: "NONE", imageUrl: null };

  const ownImage = blocks[index]?.imageUrl ?? null;
  if (ownImage) return { kind: "DIRECT_BLOCK", imageUrl: ownImage };

  const beforeImage = blocks[index - 1]?.imageUrl ?? null;
  if (beforeImage) return { kind: "ADJACENT_BLOCK", imageUrl: beforeImage };

  const afterImage = blocks[index + 1]?.imageUrl ?? null;
  if (afterImage) return { kind: "ADJACENT_BLOCK", imageUrl: afterImage };

  return { kind: "NONE", imageUrl: null };
}
