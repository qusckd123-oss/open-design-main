import { frozenEditorialRules } from "./frozen-editorial-vocabulary";

/**
 * PRODUCT REFERENCE ATTRIBUTE EXTRACTION
 *
 * Reads item/color vocabulary from `frozen-editorial-vocabulary.ts` - a
 * permanently frozen snapshot, never the live `editorial/mentions.ts` - so
 * this module's output cannot drift when Editorial's taxonomy grows. See
 * that file's docstring and docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md,
 * "Previous Coupling", for why.
 *
 * This is a DELIBERATELY SEPARATE module from
 * `src/collectors/editorial/attribute-relations.ts`. It exists because
 * e-commerce product names follow a different grammar than editorial prose:
 * Korean articles put a modifier directly BEFORE the noun it describes
 * ("블랙 백팩"), but brand product names frequently append COLOR AFTER the
 * item as a trailing SKU-variant suffix instead ("루베라 백팩 블랙"). The
 * Editorial extractor's prefix-only window is correct for article prose and
 * must not be changed or widened for this convenience - doing so would risk
 * exactly the kind of cross-item attribute bleed the Editorial extractor was
 * built to prevent (see attribute-relations.ts's own docstring: "오버사이즈
 * 축구 셔츠와 트랙 재킷" must never become an oversized track jacket).
 *
 * Semantic differences from the Editorial extractor, both deliberate:
 *
 *  1. Only COLOR is checked here, and only in a PRODUCT NAME string - never
 *     an editorial article title/excerpt/body. COLOR is a closed, small,
 *     enumerable vocabulary (BLACK/WHITE/RED/...), unlike DETAIL/MATERIAL/
 *     STYLE, which are open-ended - so checking both sides of the item noun
 *     is a much lower-risk relaxation for COLOR specifically than it would
 *     be for any other attribute type. This module has no DETAIL/MATERIAL/
 *     STYLE/FINISH support and is not a generic bidirectional relaxation of
 *     the Editorial rule.
 *
 *  2. A match on either side is accepted ONLY when the gap between the color
 *     token and the item is whitespace-only (nothing else in between). This
 *     is a real precision fix, not a permissiveness: a plain 20-char window
 *     (as Editorial uses) would incorrectly promote "블랙 후드 백팩" to
 *     BACKPACK+COLOR:BLACK, because "후드" is currently only a generic
 *     `ITEM`-type mention (not a `SUB_ITEM`), so Editorial's own
 *     other-specific-item enumeration guard does not see it as a boundary.
 *     Requiring a whitespace-only gap rejects ANY intervening word - tracked
 *     or not - so this module is strictly safer against that specific
 *     ambiguity than reusing Editorial's own window logic would have been.
 */

export type ProductAttributeRelation = {
  specificItem: string;
  attributeType: "COLOR";
  attributeValue: string;
  relationKind: "NAME_COLOR_PREFIX" | "NAME_COLOR_SUFFIX";
  evidenceText: string;
};

// Tight on purpose: real observed color values are 1-2 Korean words
// ("블랙", "스카이 블루", "다크 네이비"). Wide enough to catch a two-word
// color, never wide enough to reach past a plausible second token.
const ADJACENT_WINDOW = 14;

const specificItemRules = () => frozenEditorialRules.filter((rule) => rule.type === "SUB_ITEM");
const colorRules = () => frozenEditorialRules.filter((rule) => rule.type === "COLOR");

function globalPattern(pattern: RegExp) {
  return new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
}

function matchAllPositions(text: string, patterns: RegExp[]): Array<{ index: number; text: string }> {
  const hits: Array<{ index: number; text: string }> = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(globalPattern(pattern))) {
      if (match.index === undefined) continue;
      hits.push({ index: match.index, text: match[0] });
    }
  }
  return hits;
}

/**
 * Extracts ITEM+COLOR relations from a single product NAME string (e.g. a
 * Cafe24/e-commerce JSON-LD `Product.name` field). Never call this with
 * editorial article text - it is intentionally not exported alongside, and
 * not wired into, the Editorial collection/mention pipeline.
 */
export function extractProductNameColorRelations(productName: string): ProductAttributeRelation[] {
  const name = productName.replace(/\s+/g, " ").trim();
  if (!name) return [];

  const seen = new Set<string>();
  const relations: ProductAttributeRelation[] = [];

  for (const itemRule of specificItemRules()) {
    for (const itemMatch of matchAllPositions(name, itemRule.patterns)) {
      const itemStart = itemMatch.index;
      const itemEnd = itemMatch.index + itemMatch.text.length;

      const beforeWindow = name.slice(Math.max(0, itemStart - ADJACENT_WINDOW), itemStart);
      const afterWindow = name.slice(itemEnd, Math.min(name.length, itemEnd + ADJACENT_WINDOW));

      for (const colorRule of colorRules()) {
        // PREFIX: "블랙 백팩" - color match must touch the item with only
        // whitespace between its end and the item's start.
        for (const colorMatch of matchAllPositions(beforeWindow, colorRule.patterns)) {
          const gap = beforeWindow.slice(colorMatch.index + colorMatch.text.length);
          if (!/^\s*$/.test(gap)) continue;
          const key = `${itemRule.value}:${colorRule.value}`;
          if (seen.has(key)) continue;
          seen.add(key);
          relations.push({
            specificItem: itemRule.value,
            attributeType: "COLOR",
            attributeValue: colorRule.value,
            relationKind: "NAME_COLOR_PREFIX",
            evidenceText: `${colorMatch.text}${gap}${itemMatch.text}`
          });
        }

        // SUFFIX: "백팩 블랙" - color match must touch the item with only
        // whitespace between the item's end and its start.
        for (const colorMatch of matchAllPositions(afterWindow, colorRule.patterns)) {
          const gap = afterWindow.slice(0, colorMatch.index);
          if (!/^\s*$/.test(gap)) continue;
          const key = `${itemRule.value}:${colorRule.value}`;
          if (seen.has(key)) continue;
          seen.add(key);
          relations.push({
            specificItem: itemRule.value,
            attributeType: "COLOR",
            attributeValue: colorRule.value,
            relationKind: "NAME_COLOR_SUFFIX",
            evidenceText: `${itemMatch.text}${gap}${colorMatch.text}`
          });
        }
      }
    }
  }

  return relations;
}

/**
 * PROBE-ONLY candidate linkage (not a stored relation, not a taxonomy
 * change): reports whether a structured product OBJECT's own description
 * text contains a known dimension keyword, linked to the item identified
 * from the SAME object's name - a semantic that only exists because name/
 * description/image are already tied together as one product record
 * (unlike an editorial article, where an attribute mentioned anywhere in
 * the body is never assumed to describe a specific item unless a direct
 * phrase says so). This function does not consult a keyword list of its
 * own; callers supply candidate surface forms explicitly so nothing here
 * can silently grow the taxonomy.
 */
export type ProductDescriptionCandidate = {
  specificItem: string | null;
  surfaceForm: string;
  evidenceText: string;
};

export function findDescriptionCandidates(productName: string, description: string, surfaceForms: string[]): ProductDescriptionCandidate[] {
  const itemMatches = specificItemRules().flatMap((rule) => (matchAllPositions(productName, rule.patterns).length > 0 ? [rule.value] : []));
  const specificItem = itemMatches[0] ?? null;
  const found: ProductDescriptionCandidate[] = [];
  for (const surfaceForm of surfaceForms) {
    if (description.includes(surfaceForm)) {
      const index = description.indexOf(surfaceForm);
      const evidenceText = description.slice(Math.max(0, index - 10), index + surfaceForm.length + 10);
      found.push({ specificItem, surfaceForm, evidenceText });
    }
  }
  return found;
}
