/**
 * PRODUCT REFERENCE SUPPLEMENTAL TAXONOMY
 *
 * This is a DELIBERATELY SEPARATE vocabulary from `editorialRules` in
 * `src/collectors/editorial/mentions.ts`. It exists to close two real,
 * evidence-backed gaps found while measuring Covernat product pages
 * (`docs/PRODUCT_ATTRIBUTE_REFERENCE_AUDIT.md`):
 *
 *   1. Generic garment/bag nouns (맨투맨, 니트, 후디, 팬츠, 쇼츠, ...) that are
 *      extremely common in e-commerce product names but were never added to
 *      Editorial's SUB_ITEM set, because Editorial's own corpus never needed
 *      them at SUB_ITEM granularity.
 *   2. A SILHOUETTE dimension (핏/fit language: 오버핏, 레귤러핏, 크롭핏, ...)
 *      that does not exist anywhere in `editorialMentionTypes` at all.
 *
 * These rules are NEVER merged into `editorialRules` and NEVER imported by
 * `src/collectors/editorial/mentions.ts` or
 * `src/collectors/editorial/attribute-relations.ts`. Adding a value here has
 * ZERO effect on `extractEditorialMentions`, `extractDirectAttributeRelations`,
 * `EditorialPost`, or `EditorialMention` counts - the whole point of keeping
 * this a separate module is that Editorial's corpus/behavior must not change
 * as a side effect of closing Product Reference gaps (see the task's own
 * "CRITICAL ARCHITECTURAL RULE"). Only `src/collectors/product-reference/*`
 * files may import from this file.
 *
 * `type` is intentionally NOT `EditorialMentionType` (imported from
 * `@/config/editorial-sources`) - that union has no `"SILHOUETTE"` member,
 * and widening it would be an Editorial-config change this pass must not
 * make. `ProductReferenceRule` is a structurally similar but fully
 * independent type, so this file never needs Editorial's type surface to
 * change to express a new dimension.
 *
 * Every value below is included only because it was confirmed, by fetching
 * the real product JSON-LD, to actually appear in the specific 30-product
 * Covernat sample this pass measured (see
 * `docs/PRODUCT_ATTRIBUTE_REFERENCE_AUDIT.md`, "Real Density Before/After").
 * Nothing here is speculative vocabulary.
 */

export type ProductReferenceRuleType = "SUB_ITEM" | "SILHOUETTE" | "MATERIAL" | "COLOR" | "DETAIL" | "STYLE";

export type ProductReferenceRule = {
  type: ProductReferenceRuleType;
  value: string;
  patterns: RegExp[];
};

function rx(pattern: string, flags?: string) {
  return new RegExp(pattern, flags);
}

/**
 * Generic specific-item nouns. Each is included because it appears as the
 * head noun of at least one real sampled product NAME and has no existing
 * `editorialRules` SUB_ITEM that already covers it. Item recognition itself
 * carries no interpretive/attribute-fabrication risk (it is a factual "this
 * SKU is a X" observation, not a claim about what modifies what), so - per
 * the task's own Section 3 instruction - these are included at >=1 real
 * occurrence rather than held to the >=2 bar used for attributes below.
 *
 * Priority note: when resolving the specific item for a product NAME,
 * callers must check `editorialRules` SUB_ITEM patterns FIRST and only fall
 * back to these when none match - e.g. "토트백" must resolve to the existing
 * TOTE_BAG, "롱슬리브" to the existing LONG_SLEEVE_TEE, "링거 티셔츠" to the
 * existing RINGER_TEE, never to a generic value here. This file does not
 * enforce that ordering itself (it only defines vocabulary); the ordering is
 * enforced in `src/collectors/product-reference/object-relations.ts`.
 */
export const productReferenceItemRules: ProductReferenceRule[] = [
  // "티셔츠"/"반팔티": 4 of 30 sampled products (10797, 10825, 11495, and the
  // 10887 반팔티 case). Deliberately does not match "롱슬리브" or a
  // ringer/graphic-branded tee that already has its own tracked SUB_ITEM.
  { type: "SUB_ITEM", value: "T_SHIRT", patterns: [rx("티셔츠|반팔\\s?티")] },
  // "쇼츠": 2 of 30 (10864, 11006). Distinct from the untracked BERMUDA_SHORTS
  // idea in `config/taxonomy.ts` - this is the plain generic noun only.
  { type: "SUB_ITEM", value: "SHORTS", patterns: [rx("쇼츠")] },
  // "팬츠": 4 of 30 (11679, 11712, 11858, 12011) - none of these are the
  // already-tracked "와이드 팬츠"/"와이드 데님" phrasing.
  //
  // English alias "pants" added in the 2026-09-08 item-language pass: real
  // evidence on MMLG ("MM WIDE SWEAT PANTS", "WE REGULAR SWEAT PANTS" - 2
  // real occurrences neither one already covered by the existing English
  // "wide pants" SUB_ITEM pattern in editorialRules, since a THIRD word
  // ("SWEAT") sits between "WIDE"/"REGULAR" and "PANTS", breaking that
  // pattern's own contiguous-phrase match). No other brand in the
  // 2026-09-08 multi-brand sample used an English item noun at all (see
  // docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md, "Item Language Final Gate")
  // - this is the "SINGLE-BRAND BUT GENERIC" category, not MULTI-BRAND:
  // "pants" is included anyway because it is an unambiguous, universally
  // standard fashion noun, and adding it is a same-canonical alias (zero new
  // taxonomy surface), not a new concept.
  { type: "SUB_ITEM", value: "PANTS", patterns: [rx("팬츠|\\bpants\\b", "i")] },
  // "셔츠" (plain, e.g. 포플린 셔츠): 1 of 30 (11659). The lookbehind excludes
  // "티셔츠" - without it this would double-count every T_SHIRT match as a
  // SHIRT too, which is a real, verified false-duplication risk this pattern
  // specifically prevents.
  //
  // English alias "shirt" added in the 2026-09-08 item-language pass: real
  // evidence on MMLG ("CREW BUDDY MESH HF SHIRT" - 1 real occurrence).
  // Single-brand-but-generic, same reasoning as "pants" above - included at
  // n=1 specifically because it is a same-canonical alias for an
  // unambiguous, universally standard noun, not a new item type. The
  // negative lookbehind mirrors the Korean pattern's own T_SHIRT exclusion:
  // "T-SHIRT"/"T SHIRT" must resolve to T_SHIRT, never double-tag as SHIRT.
  { type: "SUB_ITEM", value: "SHIRT", patterns: [rx("(?<!티)셔츠"), rx("(?<!t-)(?<!t )\\bshirt\\b", "i")] },
  // "맨투맨": 3 of 30 (11618, 11757, 11991). The two [SET] product names that
  // also contain 맨투맨 (10917, 10959) are excluded upstream by the
  // multi-item-in-one-name ambiguity guard, not by this pattern.
  { type: "SUB_ITEM", value: "SWEATSHIRT", patterns: [rx("맨투맨")] },
  // "후디" (pullover hoodie): 1 of 30 (11639). Distinct spelling/word from
  // "후드집업" below - no overlap risk.
  //
  // English alias "hoodie" added in the 2026-09-08 item-language pass: real
  // evidence on MMLG ("SLOGAN HOODIE", "WORK TABLE HOODIE", "MM AFTERIMAGE
  // HOODIE", "TERRASHELL HOODIE JUMPER", "MMLG EARTH SKETCH HOODIE" - 5 real
  // occurrences, the single most repeated English item noun found in this
  // pass). Bare "HOOD" (distinct from "HOODIE") was deliberately NOT
  // aliased - "hood" alone names a garment PART, not a garment, and is a
  // real ambiguity risk this pass chose not to take on 1 thin occurrence.
  { type: "SUB_ITEM", value: "HOODIE", patterns: [rx("후디"), rx("\\bhoodie\\b", "i")] },
  // "후드집업" (zip hoodie): 1 of 30 (11598).
  { type: "SUB_ITEM", value: "ZIP_HOODIE", patterns: [rx("후드집업")] },
  // "니트" as a garment noun: 1 of 30 (11971). Deliberately distinct from the
  // pre-existing MATERIAL:KNIT value (a fabric construction, usable on any
  // garment) - this is the specific garment category itself.
  { type: "SUB_ITEM", value: "KNIT", patterns: [rx("니트")] },
  // "가디건": 1 of 30 (11736).
  { type: "SUB_ITEM", value: "CARDIGAN", patterns: [rx("가디건")] },
  // "블라우스": 1 of 30 (11880).
  { type: "SUB_ITEM", value: "BLOUSE", patterns: [rx("블라우스")] },
  // "스커트" (skirt): added in the 2026-09-08 multi-brand portability pass -
  // real evidence in 2 INDEPENDENT brands (KIRSH: "텍스처 패턴 니트 롱 스커트",
  // "러플 우븐 스커트"; The North Face Korea: "레깅스 스커트"), clearing the
  // ">=2 independent brands" bar in docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md.
  { type: "SUB_ITEM", value: "SKIRT", patterns: [rx("스커트")] },
  // "자켓"/"재킷" (generic, not TRACK_JACKET/COACH_JACKET/WORK_JACKET): 2 of 30
  // (11900, 12092).
  { type: "SUB_ITEM", value: "JACKET", patterns: [rx("재킷|자켓")] },
  // "캔버스백": 1 of 30 (11079).
  { type: "SUB_ITEM", value: "CANVAS_BAG", patterns: [rx("캔버스백")] },
  // "에코백": 1 of 30 (12182).
  { type: "SUB_ITEM", value: "ECO_BAG", patterns: [rx("에코백")] },
  // "부츠": 1 of 30 (12072).
  { type: "SUB_ITEM", value: "BOOTS", patterns: [rx("부츠")] },
  // "푸퍼" (puffer): 1 of 30 (12158).
  { type: "SUB_ITEM", value: "PUFFER", patterns: [rx("푸퍼")] },

  // "ballcap" (no-space compound spelling): added in the 2026-09-08
  // item-language pass. Real evidence on MMLG - 4 occurrences ("WASHED JUST
  // WALKING BALLCAP", "EMB. MM BALLCAP", "INITIAL M APPLIQUE BALLCAP",
  // "SCRIPT EM BALLCAP" - the most-repeated single English item spelling
  // after "hoodie"). This is NOT a new canonical item: `BALL_CAP` already
  // exists as an `editorialRules` SUB_ITEM (pattern requires the spaced
  // form "ball cap"/"baseball cap"/볼캡, which never matches MMLG's
  // unspaced "ballcap"). Using the SAME value here means
  // `resolveSpecificItem` treats both spellings as one identical canonical
  // item - this entry is only ever consulted when the existing spaced
  // pattern already failed to match, per the two-tier priority rule
  // documented in `object-relations.ts`. Bare generic "캡"/"CAP" (1 real
  // MMLG occurrence, "WORKERS CAP") was deliberately NOT added - it would
  // require a brand-new canonical item (no existing generic-cap value to
  // alias), and this pass's own bar for a new canonical item is >=2 real
  // occurrences (unlike a same-canonical alias, which this pass allows at
  // n=1 for a universally standard noun - see PANTS/SHIRT above).
  { type: "SUB_ITEM", value: "BALL_CAP", patterns: [rx("\\bballcap\\b", "i")] }
];

/**
 * Attribute vocabulary. SILHOUETTE is a brand-new dimension (the corpus's
 * previously most conspicuous gap, per the prior probe); each SILHOUETTE
 * value here required >=2 independent sampled products before being added,
 * specifically because it is a new, previously-unvalidated dimension and the
 * task warns against forcing coverage. COLOR values are held to a lower >=1
 * bar because COLOR is a small, closed, enumerable vocabulary with far lower
 * ambiguity risk than an open-ended dimension - the same asymmetry already
 * documented in `product-reference/attributes.ts`'s own module docstring.
 * MATERIAL:WOOL required >=2. Every count below is a REAL count from the
 * exact 30-product sample fetched for this pass, not an estimate.
 *
 * Every color surface form that pairs two Korean words (e.g. "더스티 블루")
 * is matched only as the FULL compound - never the qualifier word alone
 * ("더스티" is not, by itself, a registered pattern). This is a deliberate
 * precision choice: matching only the anchored compound means a word like
 * "라이트" ("light") can never fire in isolation and cannot be confused with
 * an unrelated use of the same syllable elsewhere in a product name.
 */
export const productReferenceAttributeRules: ProductReferenceRule[] = [
  // "크롭핏"/"크롭 핏": 2 of 30 (10887 description, 11736 name+description).
  { type: "SILHOUETTE", value: "CROP_FIT", patterns: [rx("크롭\\s?핏")] },
  // "세미와이드"/"세미 와이드(핏)": 1 of 30 as a real own-product description
  // (11712); a second apparent hit (10959) is a cross-reference to a
  // different companion SKU code and is excluded by the CO-code line filter
  // in object-relations.ts, not counted as real evidence for this value.
  { type: "SILHOUETTE", value: "SEMI_WIDE", patterns: [rx("세미\\s?와이드(?:핏)?")] },
  // "세미오버핏": 3 of 30 (10825, 10959 SET-excluded from item identity but
  // the phrase itself is real, 11495). Checked BEFORE plain OVERSIZED below.
  { type: "SILHOUETTE", value: "SEMI_OVERSIZED", patterns: [rx("세미\\s?오버\\s?핏")] },
  // "오버핏"/"오버 핏", NOT preceded by "세미": 3 of 30 (11577, 11900, 12092).
  { type: "SILHOUETTE", value: "OVERSIZED", patterns: [rx("(?<!세미\\s?)오버\\s?핏")] },
  // "레귤러핏"/"레귤러 핏": 8 of 30 (10917 SET-excluded, 11598, 11618, 11639,
  // 11679, 11757, 11819, 12158) - the single most common fit term in this
  // sample.
  { type: "SILHOUETTE", value: "REGULAR_FIT", patterns: [rx("레귤러\\s?핏")] },

  // "울" as a standalone token (not a substring of an unrelated word) or
  // "wool": 2 of 30 (11736 "울 블렌드", 12092 "울 집업 자켓"). The
  // whitespace/string-boundary requirement is the same kind of precision
  // guard the project already applies elsewhere for single-syllable terms -
  // without it, "울" would also match inside unrelated words.
  { type: "MATERIAL", value: "WOOL", patterns: [rx("(?:^|\\s)울(?:\\s|$)|\\bwool\\b", "i")] },
  // NOTE: 코듀로이/corduroy is NOT added here - it already exists as an
  // editorialRules MATERIAL value (added in an earlier, unrelated pass) and
  // is already reachable through `object-relations.ts`'s read-only merge of
  // `editorialRules`. The 2026-09-08 multi-brand pass confirmed it firing
  // for real on POST ARCHIVE FACTION's own description text - a genuine
  // cross-brand generalization finding for an EXISTING value, not a new
  // addition. See docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md.

  // COLOR: each a real trailing-suffix color observed in this sample.
  { type: "COLOR", value: "IVORY", patterns: [rx("아이보리")] }, // 10825, 11880, 12158
  { type: "COLOR", value: "KHAKI", patterns: [rx("카키")] }, // 11712
  { type: "COLOR", value: "NAVY", patterns: [rx("네이비")] }, // 11819
  { type: "COLOR", value: "BEIGE", patterns: [rx("베이지")] }, // 11971
  { type: "COLOR", value: "SKY_BLUE", patterns: [rx("스카이\\s?블루")] }, // 10887
  { type: "COLOR", value: "DUSTY_BLUE", patterns: [rx("더스티\\s?블루")] }, // 11618, 11639
  { type: "COLOR", value: "INDIE_PINK", patterns: [rx("인디\\s?핑크")] }, // 11659
  { type: "COLOR", value: "HEATHER_GRAY", patterns: [rx("헤더\\s?그레이")] }, // 11736, 11757
  { type: "COLOR", value: "LIGHT_PURPLE", patterns: [rx("라이트\\s?퍼플")] }, // 10864
  { type: "COLOR", value: "LIGHT_OLIVE", patterns: [rx("라이트\\s?올리브")] }, // 11991
  { type: "COLOR", value: "DARK_GRAY", patterns: [rx("다크\\s?그레이")] }, // 12011

  // "그레이"/"gray"/"grey" (bare, standalone base color): added in the
  // 2026-09-08 multi-brand portability pass on real TEXTUAL evidence from 2
  // INDEPENDENT brands - KIRSH ("멜란지 그레이") and The North Face Korea
  // ("... GRAY ...", "MELANGE_GREY", "CHARCOAL_GREY"). Honest disclosure:
  // neither of those two specific motivating examples actually produces a
  // captured relation, for reasons unrelated to this value's own vocabulary -
  // KIRSH wraps its suffix color in brackets ("[멜란지 그레이]"), and TNF's
  // compound forms put another word directly before "그레이"/"GREY"
  // ("MELANGE_"/"CHARCOAL_") - both already correctly rejected by the
  // existing whitespace-only-gap adjacency check, the same class of miss as
  // NAVY's own motivating example in the Covernat pass. See
  // docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md ("Parser Grammar Misses") for
  // the full disclosure and a real case (a clean, unwrapped "반팔 티 GRAY"
  // suffix) where this value does fire. HEATHER_GRAY/DARK_GRAY (both
  // Covernat-derived, spaced two-word compounds) are intentionally left as
  // separate, more specific values: a product whose color is stated as one
  // of those exact compounds will only match the compound (the compound's
  // own word, e.g. "헤더", sits directly between the item and "그레이", so
  // this base value's own adjacency check does not separately fire on it) -
  // no double-counting, and no regression to the existing compounds.
  { type: "COLOR", value: "GRAY", patterns: [rx("그레이|\\bgray\\b|\\bgrey\\b", "i")] }
];
