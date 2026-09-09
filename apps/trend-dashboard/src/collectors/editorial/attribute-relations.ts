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
// belongs to a different list element, not to this item. 물론이고/뿐만
// 아니라/뿐 아니라 ("not only X but also Y") and a bare "+" added 2026-09-09
// after real COSMOPOLITAN_KR false positives: "데님 팬츠는 물론이고 러블리한
// 미니스커트" (DENIM describes 팬츠, not 미니스커트 two items later in an
// explicit "not only X, but also Y" list) and "안은진표 니트 + 체크 스커트"
// (a common Korean fashion-editorial "itemA + itemB" outfit-combo callout -
// 니트 is a separate top, not a material describing the check skirt), both
// the same enumeration shape 와/과/및/그리고 already guard against.
const COORDINATION = /[,、·・+]|와\s|과\s|및\s|그리고\s|물론이고|뿐만\s?아니라|뿐\s?아니라/g;

// Clause-boundary verbs: a phrase ending in one of these pairing/exclusion
// verbs describes a DIFFERENT object than whatever follows, even with no
// coordination punctuation. Found on real data: COSMOPOLITAN_KR "블랙 빅백을
// 매치해 코트를 제외한..." - the bag being matched is a separate item from the
// coat, and the sentence goes on to explicitly EXCLUDE the coat from the
// black color scheme ("코트를 제외한 모든 이너와 액세서리를 블랙으로 통일") -
// the literal opposite of what a naive window match would suggest. Applied
// with the same "cut at the last occurrence inside the window" rule as
// COORDINATION, not a new mechanism.
const CLAUSE_BOUNDARY = /매치해|매치하여|매치하고|레이어드해|레이어드하여|코디해|코디하여|페어링해|제외한|제외하고/g;

// Pairing particle: a bare 에 immediately after a companion GARMENT noun
// ("팬츠 위에", "톱에") marks that noun as a DIFFERENT object being paired/worn
// with our item, even with no coordination punctuation or CLAUSE_BOUNDARY verb
// before our item - the pairing verb itself (매치했죠/걸치거나/입고 등) sits
// AFTER the item, outside this backward-looking window, so it can't be caught
// there. Found on real data during the 2026-09-09 Marie Claire Korea probe:
// "...화이트 톱에 화려한 실버 시퀸 스커트를 매치했죠" (a white top PAIRED WITH a
// sequin skirt - 화이트 describes 톱, not the skirt) and "레드 팬츠 위에 묵직한
// 버건디 셔츠와 타이의 톤온톤 연출을 시도합니다" (a shirt worn OVER red pants -
// 레드 describes 팬츠, not the already-explicitly-버건디 shirt). The same
// pattern, re-run against the existing real corpus as a regression check, also
// caught 2 pre-existing HARPERSBAZAAR_KR misattributions: "브라운 계열의
// 레오퍼드 패턴에 레드 쇼츠" (BROWN described a companion leopard-pattern
// garment, not the shorts) and "빈티지 그레이 나시에 선명한 레드 반바지"
// (VINTAGE/GRAY described a companion tank top, not the shorts).
//
// "소재에" (a MATERIAL noun, not a garment) is explicitly excluded: unlike a
// companion garment, "소재" describes the CURRENT item's own fabric
// composition, not a different object being paired with it - real EYESMAG
// data has "퀼팅 나일론 소재에 체크를 직조한 홀스슈 백팩" (a backpack made of
// quilted NYLON material with CHECK woven onto it - both attributes correctly
// describe the SAME backpack). A first, unguarded version of this pattern
// wrongly stripped that NYLON, found and reverted via the same old-vs-new
// full-corpus diff used to verify the two intended fixes above.
//
// Deliberately matches only a BARE 에 immediately followed by whitespace, not
// a longer particle - "에서" (년에서/매장에서, a location, not a companion
// object) and "에는"/"에도" (already handled by the narrower ATTACHED_PARTICLE
// guard right after a matched attribute) both have a syllable between 에 and
// the space, so neither matches this pattern. Applied with the same "cut at
// the last occurrence inside the window" rule as COORDINATION/CLAUSE_BOUNDARY,
// not a new mechanism.
const PAIRING_PARTICLE = /(?<!소재)에\s/g;

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
  let cut = 0;
  for (const boundaryPattern of [COORDINATION, CLAUSE_BOUNDARY, PAIRING_PARTICLE]) {
    boundaryPattern.lastIndex = 0;
    for (const boundary of raw.matchAll(boundaryPattern)) {
      cut = Math.max(cut, (boundary.index ?? 0) + boundary[0].length);
    }
  }
  const window = raw.slice(cut);
  return window.trim() ? window : null;
}

function containsOtherSpecificItem(window: string, currentItem: string): boolean {
  return specificItemRules().some((rule) => rule.value !== currentItem && rule.patterns.some((pattern) => pattern.test(window)));
}

/**
 * A genuine Korean adnominal modifier sits directly before its head noun with
 * NO particle in between ("니트 카디건", "카본 블랙 ELVO 백팩"). If the
 * matched attribute text is instead immediately followed by 에/에는/에도/에서/도
 * before the item, the attribute word is functioning as an independent noun
 * phrase in its own right - a separate garment being paired with or
 * contrasted against the item, not describing it. Found on real data during
 * the 2026-09-09 Cosmopolitan Korea probe ("...깊은 브이넥 니트에 카키 셔츠를
 * 레이어드해..." - a knit top LAYERED WITH a khaki shirt, not "a knit shirt")
 * and, on closer inspection, already present undetected in the existing
 * corpus from HARPERSBAZAAR_KR: "넉넉한 레드 니트에는 와이드 팬츠" (a knit
 * paired WITH wide pants) and "도톰한 니트도 허리에 묶어주면 셔츠" (a knit OR a
 * shirt tied at the waist - alternatives being compared, not "a knit shirt").
 *
 * 가/이/은/는 were deliberately tried and REJECTED for this guard: a first
 * draft included them and broke real, correct, currently-valid relations -
 * "자수가 돋보이는 테일러드 코트" (embroidery STANDS OUT ON a tailored coat)
 * and "블랙이 섞인 옴브레 플레이드 셔츠" (black IS MIXED IN a plaid shirt) are
 * legitimate Korean relative-clause modifiers ("[X가/이 verb-는] item"), a
 * completely different, common, and valuable construction that must not be
 * confused with the 에/도 pairing-or-comparison pattern above. This guard
 * intentionally does not attempt to distinguish every possible construction
 * (e.g. a hedge like "레드에 가까운 컬러" is a theoretical residual risk with
 * no observed occurrence in this corpus) - it fixes only the specific,
 * verified real failures, per the project's own precision-over-recall
 * philosophy. It does not touch MODIFIER_WINDOW, the COORDINATION boundary,
 * or any taxonomy rule.
 */
const ATTACHED_PARTICLE = /^(에는|에도|에서|도|에)(?![가-힣])/;

/**
 * Alternation particle 나/이나 ("A or B"): unlike ATTACHED_PARTICLE above,
 * which only guards the character immediately after the matched attribute
 * word, this checks the ENTIRE remaining path from the attribute to the item
 * - because the coordinated noun the attribute actually describes is not
 * always the word directly touching the particle. Found on real data during
 * the 2026-09-09 saturation-audit follow-up: "옷차림이... 니트나 카디건, 셔츠
 * 한 장을 허리에 둘러보자" (HARPERSBAZAAR_KR) lists 니트/카디건/셔츠 as three
 * alternative garments to tie at the waist - 니트 is immediately followed by
 * 나, caught by the same anchored logic as ATTACHED_PARTICLE. But "빈티지한
 * 데님이나 와이드 팬츠" (HARPERSBAZAAR_KR, a different article) shows the
 * harder case: 이나 attaches to 데님, not directly to the STYLE match 빈티지
 * two syllables earlier ("빈티지한 데님" is one alternative NP, "와이드 팬츠"
 * the other) - an anchored-only check would miss VINTAGE here even though it
 * describes 데님, not the wide pants. This was the same problem class
 * documented as unfixed in docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md ("니트나
 * 가죽 재킷" -> false LEATHER_JACKET+KNIT, left unaddressed as out of that
 * pass's scope).
 *
 * Deliberately checked ANYWHERE in the remaining text (not anchored at
 * position 0 like ATTACHED_PARTICLE) precisely because the boundary can sit
 * past an intervening word - but still narrowly scoped: only the short
 * (<=20 char) span between one already-matched attribute keyword and one
 * already-matched item is ever searched, never arbitrary article text, so
 * this cannot "broadly reject every syllable 나" - a 나/이나 occurring
 * anywhere else in the article (before the attribute match, or outside any
 * modifier window entirely) is never inspected. The same (?![가-힣]) guard as
 * ATTACHED_PARTICLE excludes word-internal collisions (e.g. "바나나", "그러나
 * 이 셔츠는" mid-word/mid-phrase "나" followed by another Hangul syllable is
 * never treated as this particle; a 다-ending sentence connector like
 * "그러나" only matches here if it is itself followed by non-Hangul, i.e.
 * genuinely word-final).
 *
 * Full-corpus re-verification (all 373 real posts, old-vs-new relation diff)
 * found exactly 4 relations removed, all confirmed false positives on
 * inspection of the real sentence: CARDIGAN+MATERIAL:KNIT ("니트나 카디건"),
 * WIDE_PANTS+MATERIAL:DENIM and WIDE_PANTS+STYLE:VINTAGE (both from "빈티지한
 * 데님이나 와이드 팬츠" - the same "modifier attaches to the nearer of two
 * 이나-coordinated nouns" pattern applies to both attributes in this one
 * sentence), and SHIRT+COLOR:WHITE ("오버사이즈 화이트 탱크 톱이나 셔츠" -
 * 화이트 precedes the whole 이나-coordinated pair from outside it; a prior
 * pass (docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md Section 17) had called this
 * one VALID under a narrower reading, but the same structural pattern as the
 * other 3 confirmed false positives applies here too - 탱크 톱 is simply not
 * an independently taxonomized SUB_ITEM, which is why it survived that
 * earlier, narrower check undetected, not because it is grammatically
 * different). Zero other relations changed - re-verified against every prior
 * regression fixture (attached-particle, pairing-particle, 물론이고, verb
 * clause, +, roundup clustering, SHIRT boundaries) with no weakening.
 */
const ALTERNATION_PARTICLE = /(이나|나)(?![가-힣])/;

function isGenuineModifier(window: string, matchText: string, matchIndex: number): boolean {
  const after = window.slice(matchIndex + matchText.length);
  return !ATTACHED_PARTICLE.test(after) && !ALTERNATION_PARTICLE.test(after);
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

function firstMatch(window: string, patterns: RegExp[]): { text: string; index: number } | null {
  for (const pattern of patterns) {
    const match = window.match(pattern);
    if (match && match.index !== undefined && isGenuineModifier(window, match[0], match.index)) {
      return { text: match[0], index: match.index };
    }
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
