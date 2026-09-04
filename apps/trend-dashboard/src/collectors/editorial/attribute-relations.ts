import { editorialRules } from "./mentions";

/**
 * DIRECT ATTRIBUTE RELATIONS
 *
 * The article-level EditorialMention table answers "did this article mention
 * X?". It cannot answer "does this attribute actually describe THIS item?".
 * Those are different claims, and conflating them is the single biggest
 * fabrication risk in this dataset: a roundup article that covers 8 unrelated
 * product drops will co-mention TRACK_JACKET and RED without there being any
 * such thing as a red track jacket in it.
 *
 * This extractor only emits a relation when the attribute is positioned as a
 * direct modifier of the item noun. Korean is head-final, so an attribute
 * modifying an item appears immediately BEFORE it ("카본 블랙 ELVO 백팩").
 * Anything separated from the item by a coordination boundary (,/·/와/과/및/
 * 그리고) or by another item noun is treated as enumeration, not modification,
 * and is rejected - e.g. "오버사이즈 축구 셔츠와 트랙 재킷" must NOT yield an
 * oversized track jacket.
 *
 * Only DIRECT_PHRASE is currently emitted. DIRECT_SENTENCE (a looser
 * same-sentence grammatical link) is intentionally left unimplemented: the
 * current REAL corpus produced no unambiguous case for it, and a looser rule
 * would manufacture relations rather than find them.
 */

export type AttributeRelationKind = "DIRECT_PHRASE";
export type AttributeSourceField = "TITLE" | "SUMMARY" | "BODY";

export type DirectAttributeRelation = {
  specificItem: string;
  attributeType: string;
  attributeValue: string;
  relationKind: AttributeRelationKind;
  evidenceText: string;
  sourceField: AttributeSourceField;
};

export type AttributeRelationInput = {
  title?: string | null;
  excerpt?: string | null;
  text?: string | null;
};

const ATTRIBUTE_TYPES = new Set(["DETAIL", "MATERIAL", "COLOR", "STYLE"]);

// How far back from the item noun a modifier may sit.
//
// Deliberately tight (20 chars). Widening this to 40 immediately produced a
// false positive on the real corpus: in "스무스 블랙 후드가 일체형으로 더해져
// 입을 수 있는 베스트로 펼쳐지는 RENO 숄더백", 블랙 modifies 후드, not the
// 숄더백 ~38 characters later. Real positives all sit well inside 20 chars
// ("카본 블랙 ELVO 백팩", "재활용 패브릭을 활용한 토트백"). Recall is traded
// for precision on purpose: a missed relation is recoverable, a fabricated
// product attribute is not.
const MODIFIER_WINDOW = 20;

// Coordination markers. Text before the LAST of these inside the window
// belongs to a different list element, not to this item.
const COORDINATION = /[,、·・]|와\s|과\s|및\s|그리고\s/g;

const specificItemRules = () => editorialRules.filter((rule) => rule.type === "SUB_ITEM");
const attributeRules = () => editorialRules.filter((rule) => ATTRIBUTE_TYPES.has(rule.type));

export function extractDirectAttributeRelations(input: AttributeRelationInput): DirectAttributeRelation[] {
  const fields: Array<[AttributeSourceField, string]> = [
    ["TITLE", input.title ?? ""],
    ["SUMMARY", input.excerpt ?? ""],
    ["BODY", input.text ?? ""]
  ];

  const seen = new Set<string>();
  const relations: DirectAttributeRelation[] = [];

  for (const [sourceField, raw] of fields) {
    if (!raw.trim()) continue;
    const segments = sourceField === "TITLE" ? [normalize(raw)] : splitSentences(raw);
    for (const segment of segments) {
      for (const relation of relationsInSegment(segment, sourceField)) {
        const key = `${relation.specificItem}:${relation.attributeType}:${relation.attributeValue}`;
        if (seen.has(key)) continue;
        seen.add(key);
        relations.push(relation);
      }
    }
  }
  return relations;
}

/**
 * AUDIT-ONLY introspection. Reports, for every specific-item occurrence, what
 * the extractor actually saw and why it did or did not emit a relation. It
 * reuses the very same segmentation/window/guard code paths below, so an audit
 * can never drift from extraction behaviour. Nothing here changes extraction:
 * `extractDirectAttributeRelations` is untouched by this function existing.
 *
 * `wideContext` deliberately reaches further back than MODIFIER_WINDOW so an
 * audit can distinguish the two very different failure modes:
 *   1. a real modifier exists but sits outside the strict window, versus
 *   2. the sentence simply never describes the product at all.
 */
export type ItemContextOutcome = "RELATION" | "NO_WINDOW" | "ENUMERATION" | "NO_ATTRIBUTE_IN_WINDOW";

export type ItemContext = {
  specificItem: string;
  matchedText: string;
  sourceField: AttributeSourceField;
  window: string;
  wideContext: string;
  outcome: ItemContextOutcome;
  matchedAttributes: Array<{ type: string; value: string }>;
};

const WIDE_CONTEXT_WINDOW = 70;

export function describeItemContexts(input: AttributeRelationInput): ItemContext[] {
  const fields: Array<[AttributeSourceField, string]> = [
    ["TITLE", input.title ?? ""],
    ["SUMMARY", input.excerpt ?? ""],
    ["BODY", input.text ?? ""]
  ];

  const contexts: ItemContext[] = [];
  for (const [sourceField, raw] of fields) {
    if (!raw.trim()) continue;
    const segments = sourceField === "TITLE" ? [normalize(raw)] : splitSentences(raw);
    for (const segment of segments) {
      for (const itemRule of specificItemRules()) {
        for (const match of matchAll(segment, itemRule.patterns)) {
          const wideContext = segment.slice(Math.max(0, match.index - WIDE_CONTEXT_WINDOW), match.index + match.text.length);
          const window = modifierWindow(segment, match.index);
          if (!window) {
            contexts.push({ specificItem: itemRule.value, matchedText: match.text, sourceField, window: "", wideContext, outcome: "NO_WINDOW", matchedAttributes: [] });
            continue;
          }
          if (containsOtherSpecificItem(window, itemRule.value)) {
            contexts.push({ specificItem: itemRule.value, matchedText: match.text, sourceField, window, wideContext, outcome: "ENUMERATION", matchedAttributes: [] });
            continue;
          }
          const matchedAttributes: Array<{ type: string; value: string }> = [];
          for (const attributeRule of attributeRules()) {
            if (firstMatch(window, attributeRule.patterns)) matchedAttributes.push({ type: attributeRule.type, value: attributeRule.value });
          }
          contexts.push({
            specificItem: itemRule.value,
            matchedText: match.text,
            sourceField,
            window,
            wideContext,
            outcome: matchedAttributes.length > 0 ? "RELATION" : "NO_ATTRIBUTE_IN_WINDOW",
            matchedAttributes
          });
        }
      }
    }
  }
  return contexts;
}

function relationsInSegment(segment: string, sourceField: AttributeSourceField): DirectAttributeRelation[] {
  const found: DirectAttributeRelation[] = [];
  for (const itemRule of specificItemRules()) {
    for (const match of matchAll(segment, itemRule.patterns)) {
      const window = modifierWindow(segment, match.index);
      if (!window) continue;
      // Another specific item inside the modifier zone means we are inside an
      // enumeration ("축구 셔츠와 트랙 재킷"), so the modifier is not ours.
      if (containsOtherSpecificItem(window, itemRule.value)) continue;

      for (const attributeRule of attributeRules()) {
        const attributeMatch = firstMatch(window, attributeRule.patterns);
        if (!attributeMatch) continue;
        found.push({
          specificItem: itemRule.value,
          attributeType: attributeRule.type,
          attributeValue: attributeRule.value,
          relationKind: "DIRECT_PHRASE",
          evidenceText: `${window}${match.text}`.trim().slice(-120),
          sourceField
        });
      }
    }
  }
  return found;
}

/**
 * The modifier zone: text immediately before the item noun, cut at the last
 * coordination boundary so only the current list element remains.
 */
function modifierWindow(segment: string, itemIndex: number): string | null {
  const start = Math.max(0, itemIndex - MODIFIER_WINDOW);
  const raw = segment.slice(start, itemIndex);
  if (!raw.trim()) return null;
  COORDINATION.lastIndex = 0;
  let cut = 0;
  for (const boundary of raw.matchAll(COORDINATION)) {
    cut = (boundary.index ?? 0) + boundary[0].length;
  }
  const window = raw.slice(cut);
  return window.trim() ? window : null;
}

function containsOtherSpecificItem(window: string, currentItem: string): boolean {
  return specificItemRules().some((rule) => rule.value !== currentItem && rule.patterns.some((pattern) => pattern.test(window)));
}

function matchAll(segment: string, patterns: RegExp[]): Array<{ index: number; text: string }> {
  const hits: Array<{ index: number; text: string }> = [];
  for (const pattern of patterns) {
    const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    for (const match of segment.matchAll(global)) {
      if (match.index === undefined) continue;
      hits.push({ index: match.index, text: match[0] });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

function firstMatch(window: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = window.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function splitSentences(text: string): string[] {
  return normalize(text)
    .split(/(?<=[.!?。])\s+|(?<=다\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
