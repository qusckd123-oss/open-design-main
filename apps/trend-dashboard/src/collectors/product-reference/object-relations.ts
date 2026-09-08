import { editorialRules } from "@/collectors/editorial/mentions";
import { productReferenceAttributeRules, productReferenceItemRules, type ProductReferenceRuleType } from "./taxonomy";

/**
 * STRUCTURED PRODUCT OBJECT RELATIONS
 *
 * This module is the taxonomy-closed successor to the COLOR-only relations
 * in `product-reference/attributes.ts` (which it does not modify or replace
 * - that file's exports and tests are untouched). It answers a strictly
 * wider question using the SAME "one product object" evidence unit as
 * Section 7 of the task this module was built for: given a product's own
 * `name` and `description` (a single JSON-LD record, never an editorial
 * article), what SPECIFIC ITEM does it represent, and what SILHOUETTE /
 * MATERIAL / DETAIL / STYLE / COLOR attributes does that same item carry?
 *
 * It reads vocabulary from two sources and never writes back to either:
 *   - `editorialRules` (`src/collectors/editorial/mentions.ts`) - reused
 *     read-only, exactly as `product-reference/attributes.ts` already does.
 *     Existing SUB_ITEM/attribute values here always win over the
 *     supplemental ones below (see `resolveSpecificItem`).
 *   - `productReferenceItemRules` / `productReferenceAttributeRules`
 *     (`./taxonomy.ts`) - the PRODUCT_REFERENCE-only supplemental
 *     vocabulary this pass added. Never merged into `editorialRules`.
 *
 * Nothing in this file is imported by, or imports, any Editorial collection
 * or mention code path. Running this module cannot change
 * `extractEditorialMentions` or `extractDirectAttributeRelations` output.
 *
 * ITEM IDENTITY (one item per product, or none)
 * ----------------------------------------------
 * A product NAME may textually contain more than one item-shaped token (a
 * bundled "[SET] 맨투맨&팬츠" product, or a branded sub-item name like "링거
 * 티셔츠" that also contains the generic word "티셔츠"). Silently picking one
 * would risk attaching a real attribute to the wrong item, or attaching a
 * SET product's color to only one of its two pieces. So item resolution is
 * a strict, two-tier, all-or-nothing rule:
 *   1. Check every existing `editorialRules` SUB_ITEM pattern. If exactly one
 *      DISTINCT value matches anywhere in the name, that is the item -
 *      supplemental generic items are never even consulted (this is what
 *      makes "링거 티셔츠" resolve to the existing RINGER_TEE, not the new
 *      generic T_SHIRT). If two or more distinct existing values match, the
 *      name is ambiguous and yields NO relations.
 *   2. Only if no existing SUB_ITEM matched at all, check the supplemental
 *      generic items. Again: exactly one distinct value wins; two or more
 *      (e.g. "맨투맨&팬츠") is ambiguous and yields NO relations, exactly
 *      like Editorial's own enumeration guard rejects a coordinated list
 *      instead of guessing which item a modifier belongs to.
 *
 * NAME-LEVEL ATTRIBUTES (DETAIL/MATERIAL/SILHOUETTE/STYLE)
 * ----------------------------------------------------------
 * Reuses the exact modifier-window size (20 chars) and enumeration guard
 * concept already proven safe in `editorial/attribute-relations.ts` -
 * scanning only the text immediately before the resolved item, and only
 * SILHOUETTE, an entirely new dimension. Coordination-punctuation
 * splitting is deliberately not reimplemented here, because rejecting the
 * whole name on so much as a second EXISTING or SUPPLEMENTAL item value in
 * the window is already at least as conservative for the short, single-noun
 * product names this module reads.
 *
 * NAME-LEVEL COLOR (bidirectional)
 * -----------------------------------
 * Anchored to the SAME resolved item as everything else in this module
 * (unlike the independent, all-items-at-once loop in
 * `attributes.ts#extractProductNameColorRelations`), so a name like "[콜랩]
 * 럭키 씨리얼 링거 티셔츠 네이비" always reports its color against RINGER_TEE,
 * never against the generic T_SHIRT match that also happens to be present.
 *
 * DESCRIPTION-LEVEL ATTRIBUTES
 * -------------------------------
 * Per Section 7's structured-product-object license: because `name` and
 * `description` are one JSON-LD record about one SKU (never a multi-topic
 * editorial article), an approved attribute keyword found anywhere in the
 * CLEANED description is attributed to the item resolved from `name` - no
 * adjacency/window requirement, unlike Editorial prose. "Cleaned" matters:
 * two real, verified hazards in Covernat's own description convention were
 * stripped first (see `cleanDescriptionForScan`), because leaving them in
 * was measured to produce real false positives during this pass's own
 * development against the live 30-product sample:
 *   1. The `[SIZE(CM)]...` measurement block and everything after it
 *      (including a `[모델]` section that can name a DIFFERENT color variant
 *      being worn in a photo than the one this product page/SKU is for).
 *   2. Any line naming a companion product's own internal SKU code
 *      (`CO####XX##`, e.g. "-CO2501HZ31(C 로고 후디 집업)와 셋업 연출") - this
 *      describes a DIFFERENT product being suggested as a matching set, not
 *      this product's own attributes.
 *
 * COLOR IS DELIBERATELY EXCLUDED FROM THIS DESCRIPTION SCAN. This was found,
 * not assumed: the 2026-09-08 multi-brand portability pass (see
 * docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md) measured KIRSH product
 * descriptions restating an "available colors" list shared across every
 * color variant of a design (e.g. "컬러 : 베이지, 블랙" appearing verbatim on
 * both the beige-labeled AND the black-labeled product page for the same
 * design) - scanning it unconditionally produced 9 real, verified false
 * positives (a sibling variant's color attached to the wrong page) out of
 * only 33 KIRSH relations. Unlike DETAIL/MATERIAL/SILHOUETTE/STYLE design
 * bullets - which describe THIS exact SKU throughout Covernat, KIRSH, and
 * PAF alike - a "colors this design comes in" list describes the whole
 * design family, not the one page it happens to render on. Removing COLOR
 * from this function cost zero real relations on Covernat (every one of its
 * 26 COLOR relations came from the NAME-anchored bidirectional check below,
 * never from `descriptionRelations`) while eliminating all 9 KIRSH false
 * positives - a strictly positive, evidence-driven precision fix.
 *
 * DEDUPLICATION (Section 10)
 * -----------------------------
 * One relation per (item, attributeType, attributeValue) even when the same
 * fact is independently confirmed in both the name and the description
 * (a real, observed case: "우먼 셔링 블라우스" also restates "셔링 디테일" in
 * its own description) - `extractProductObjectRelations` keeps one `seen`
 * set across all three extraction passes for exactly this reason.
 */

export type ProductObjectRelation = {
  specificItem: string;
  attributeType: ProductReferenceRuleType;
  attributeValue: string;
  relationKind: "NAME_DIRECT_PHRASE" | "NAME_COLOR_PREFIX" | "NAME_COLOR_SUFFIX" | "DESCRIPTION_OBJECT";
  evidenceText: string;
};

export type ProductObjectInput = {
  name: string;
  description?: string | null;
};

export type SpecificItemResolution =
  | { status: "RESOLVED"; item: string; index: number; matchedText: string }
  | { status: "AMBIGUOUS" }
  | { status: "NONE" };

type CombinedRule = { type: ProductReferenceRuleType; value: string; patterns: RegExp[] };

// COLOR is handled by its own bidirectional NAME-anchored check
// (`nameColorRelations`) everywhere in this module - never by a
// whole-text scan. See the module docstring's "COLOR IS DELIBERATELY
// EXCLUDED" note for why `descriptionRelations` must not include it.
const SCANNABLE_DIMENSIONS: ProductReferenceRuleType[] = ["DETAIL", "MATERIAL", "SILHOUETTE", "STYLE"];

// Same proven window size as `editorial/attribute-relations.ts`'s
// MODIFIER_WINDOW - not imported (that file is left untouched by this pass)
// but deliberately kept identical since product names are, if anything,
// even more tightly packed than editorial prose.
const MODIFIER_WINDOW = 20;

// Same proven window size as `attributes.ts`'s ADJACENT_WINDOW for the
// bidirectional COLOR check.
const COLOR_ADJACENT_WINDOW = 14;

const SIZE_MARKER = "SIZE(CM)";
const COMPANION_SKU_CODE = /\bCO\d{3,5}[A-Z]{1,4}\d{0,3}\b/;

function existingSubItemRules(): CombinedRule[] {
  return editorialRules
    .filter((rule) => rule.type === "SUB_ITEM")
    .map((rule) => ({ type: "SUB_ITEM" as const, value: rule.value, patterns: rule.patterns }));
}

function existingAttributeRules(types: ProductReferenceRuleType[]): CombinedRule[] {
  return editorialRules
    .filter((rule) => (types as string[]).includes(rule.type))
    .map((rule) => ({ type: rule.type as ProductReferenceRuleType, value: rule.value, patterns: rule.patterns }));
}

function supplementalAttributeRules(types: ProductReferenceRuleType[]): CombinedRule[] {
  return productReferenceAttributeRules.filter((rule) => types.includes(rule.type));
}

function combinedAttributeRules(types: ProductReferenceRuleType[]): CombinedRule[] {
  return [...existingAttributeRules(types), ...supplementalAttributeRules(types)];
}

function globalPattern(pattern: RegExp) {
  return new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
}

function ruleMatches(text: string, rules: CombinedRule[]): Array<{ value: string; index: number; text: string }> {
  const hits: Array<{ value: string; index: number; text: string }> = [];
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      for (const match of text.matchAll(globalPattern(pattern))) {
        if (match.index === undefined) continue;
        hits.push({ value: rule.value, index: match.index, text: match[0] });
      }
    }
  }
  return hits;
}

/**
 * Resolves the single specific item a product NAME refers to, or reports why
 * it could not (ambiguous, e.g. a [SET] name with two different items; or
 * none, e.g. no tracked item noun present at all). See the module docstring
 * for the two-tier existing-then-supplemental priority rule.
 */
export function resolveSpecificItem(name: string): SpecificItemResolution {
  const existingHits = ruleMatches(name, existingSubItemRules());
  const existingValues = new Set(existingHits.map((hit) => hit.value));
  if (existingValues.size > 1) return { status: "AMBIGUOUS" };
  if (existingValues.size === 1) {
    const value = [...existingValues][0]!;
    const first = existingHits.filter((hit) => hit.value === value).sort((a, b) => a.index - b.index)[0]!;
    return { status: "RESOLVED", item: value, index: first.index, matchedText: first.text };
  }

  const genericHits = ruleMatches(name, productReferenceItemRules);
  const genericValues = new Set(genericHits.map((hit) => hit.value));
  if (genericValues.size > 1) return { status: "AMBIGUOUS" };
  if (genericValues.size === 1) {
    const value = [...genericValues][0]!;
    const first = genericHits.filter((hit) => hit.value === value).sort((a, b) => a.index - b.index)[0]!;
    return { status: "RESOLVED", item: value, index: first.index, matchedText: first.text };
  }

  return { status: "NONE" };
}

function nameDirectPhraseRelations(name: string, resolved: { item: string; index: number }) {
  const start = Math.max(0, resolved.index - MODIFIER_WINDOW);
  const window = name.slice(start, resolved.index);
  if (!window.trim()) return [];

  const otherItemInWindow =
    ruleMatches(window, existingSubItemRules()).some((hit) => hit.value !== resolved.item) ||
    ruleMatches(window, productReferenceItemRules).some((hit) => hit.value !== resolved.item);
  if (otherItemInWindow) return [];

  const found: Array<{ type: ProductReferenceRuleType; value: string; evidenceText: string }> = [];
  for (const rule of combinedAttributeRules(SCANNABLE_DIMENSIONS)) {
    const hit = ruleMatches(window, [rule])[0];
    if (!hit) continue;
    found.push({ type: rule.type, value: rule.value, evidenceText: window.trim() });
  }
  return found;
}

function nameColorRelations(name: string, resolved: { item: string; index: number; matchedText: string }) {
  const itemStart = resolved.index;
  const itemEnd = resolved.index + resolved.matchedText.length;
  const beforeWindow = name.slice(Math.max(0, itemStart - COLOR_ADJACENT_WINDOW), itemStart);
  const afterWindow = name.slice(itemEnd, Math.min(name.length, itemEnd + COLOR_ADJACENT_WINDOW));

  const colorRules = combinedAttributeRules(["COLOR"]);
  const found: Array<{ value: string; evidenceText: string; relationKind: "NAME_COLOR_PREFIX" | "NAME_COLOR_SUFFIX" }> = [];
  const seenColor = new Set<string>();

  for (const rule of colorRules) {
    for (const match of ruleMatches(beforeWindow, [rule])) {
      const gap = beforeWindow.slice(match.index + match.text.length);
      if (!/^\s*$/.test(gap)) continue;
      if (seenColor.has(rule.value)) continue;
      seenColor.add(rule.value);
      found.push({ value: rule.value, evidenceText: `${match.text}${gap}${resolved.matchedText}`, relationKind: "NAME_COLOR_PREFIX" });
    }
    for (const match of ruleMatches(afterWindow, [rule])) {
      const gap = afterWindow.slice(0, match.index);
      if (!/^\s*$/.test(gap)) continue;
      if (seenColor.has(rule.value)) continue;
      seenColor.add(rule.value);
      found.push({ value: rule.value, evidenceText: `${resolved.matchedText}${gap}${match.text}`, relationKind: "NAME_COLOR_SUFFIX" });
    }
  }
  return found;
}

/**
 * Strips the two real, verified false-positive sources found in Covernat's
 * own description convention (see module docstring) before any attribute
 * scan runs against description text.
 */
export function cleanDescriptionForScan(description: string): string {
  const beforeSize = description.split(SIZE_MARKER)[0] ?? description;
  return beforeSize
    .split(/[\r\n]+/)
    .filter((line) => !COMPANION_SKU_CODE.test(line))
    .join(" ");
}

function descriptionRelations(description: string) {
  const cleaned = cleanDescriptionForScan(description);
  const found: Array<{ type: ProductReferenceRuleType; value: string; evidenceText: string }> = [];
  for (const rule of combinedAttributeRules(SCANNABLE_DIMENSIONS)) {
    const hit = ruleMatches(cleaned, [rule])[0];
    if (!hit) continue;
    const evidenceText = cleaned.slice(Math.max(0, hit.index - 10), hit.index + hit.text.length + 10).trim();
    found.push({ type: rule.type, value: rule.value, evidenceText });
  }
  return found;
}

/**
 * The single entry point this pass adds: given one product's own `name` and
 * `description`, returns every direct item+attribute relation this module
 * can support, deduplicated to one relation per (item, dimension, value)
 * regardless of how many of the three extraction passes (name direct-phrase,
 * name bidirectional color, description) independently found it.
 *
 * Returns an empty array (never throws, never guesses) when the item cannot
 * be resolved or is ambiguous - see `resolveSpecificItem`.
 */
export function extractProductObjectRelations(input: ProductObjectInput): ProductObjectRelation[] {
  const name = input.name.replace(/\s+/g, " ").trim();
  if (!name) return [];

  const resolved = resolveSpecificItem(name);
  if (resolved.status !== "RESOLVED") return [];

  const seen = new Set<string>();
  const relations: ProductObjectRelation[] = [];

  for (const hit of nameDirectPhraseRelations(name, resolved)) {
    const key = `${hit.type}:${hit.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    relations.push({ specificItem: resolved.item, attributeType: hit.type, attributeValue: hit.value, relationKind: "NAME_DIRECT_PHRASE", evidenceText: hit.evidenceText });
  }

  for (const hit of nameColorRelations(name, resolved)) {
    const key = `COLOR:${hit.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    relations.push({ specificItem: resolved.item, attributeType: "COLOR", attributeValue: hit.value, relationKind: hit.relationKind, evidenceText: hit.evidenceText });
  }

  if (input.description && input.description.trim()) {
    for (const hit of descriptionRelations(input.description)) {
      const key = `${hit.type}:${hit.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      relations.push({ specificItem: resolved.item, attributeType: hit.type, attributeValue: hit.value, relationKind: "DESCRIPTION_OBJECT", evidenceText: hit.evidenceText });
    }
  }

  return relations;
}
