# Editorial Category Coverage Gap Audit

Checked date: 2026-09-09

Follow-up to `docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md`, which found BAGS and ACCESSORIES at zero independent-repeated/multi-source/family-diverse signal, and COAT/OUTERWEAR under-supported relative to its raw bundle volume. This pass diagnosed why, prototyped an evidenced fix, and - after full-corpus verification revealed a real net-negative side effect on existing trust-tier signal - **reverted the code change and shipped this as an audit-only pass.** No taxonomy change is live; the corpus is unchanged.

## 0. Safety

```
pwd    -> C:/Users/bcave/dev/open-design-trend-dashboard
branch -> feature/trend-dashboard
status -> clean before starting
HEAD   -> faa9b48
```

Confirmed clean at both the start AND end of this pass - all taxonomy code changes made mid-pass were reverted via `git checkout --` after the finding in Section 8 below, verified with a second `git status --short`.

## 1. Live baseline (confirmed, matches task brief exactly)

| Metric | Value |
|---|---:|
| EditorialPost | 373 |
| EditorialMention | 1496 |
| Bundles | 46 |
| Independent Repeated | 9 |
| Multi-source Independent | 8 |
| Publisher-family-diverse | 7 |
| MarketRankingSnapshot | 667 |
| Current Primary | 체크 SHIRT |

## 2. Category inventory

| Category | Bundles | Sources | Independent Repeated | Multi-source | Family-diverse |
|---|---:|---:|---:|---:|---:|
| TOPS | 14 | 6 | 3 | 3 | 3 |
| BOTTOMS | 12 | 4 | 5 | 4 | 3 |
| OUTERWEAR | 12 | 4 | 1 | 1 | 1 |
| BAGS | 6 | 3 | 0 | 0 | 0 |
| ACCESSORIES | 2 | 2 | 0 | 0 | 0 |

Confirms the saturation audit's finding exactly: raw bundle volume is reasonably balanced (TOPS/BOTTOMS/OUTERWEAR all 12-14), but trust-tier signal concentrates in TOPS+BOTTOMS. BAGS and ACCESSORIES have zero trust-tier signal on only 6 and 2 raw bundles respectively - genuinely the thinnest categories by volume, not just by trust-tier conversion rate.

## 3-7. Deep audit: BAGS, ACCESSORIES, COAT/OUTERWEAR

**BAGS - currently recognized items:** BACKPACK (3 bundles, 3 sources/families, 0 repeated), TOTE_BAG (3 bundles, 2 sources, 0 repeated), SHOULDER_BAG (0), BODY_BAG (0).

**Unrecognized bag-noun search** (full 373-post corpus, not assumed): 파우치 (5 articles), 크로스백 (1), 클러치 (1), 슬링백 (2) were the only candidates with any real hits. **All rejected** on inspection:
- 파우치: every occurrence is either an enumeration item in a product list ("미니 베니티, 립스틱 파우치, 오일 블로팅 페이퍼"), a component of ANOTHER item ("파우치 포켓이 특징인 Duxville 재킷" - a pocket *style* on a jacket, not a standalone pouch), a brand/model name (AÓOS NANO 파우치), or has no adjacent recognized attribute at all.
- 클러치: false hit entirely - the one occurrence is "수직 클러치 방식의... 크로노그래프" (a **watch clutch mechanism**, not a bag).
- 슬링백: false hit entirely - both occurrences are "슬링백 힐" (a **slingback-style heel/shoe**, not a bag).
- 크로스백: 1 occurrence, no adjacent recognized attribute, too sparse to evaluate.

**Zero viable new BAG item candidates found.** Also checked whether existing bag items (BACKPACK/TOTE_BAG) have an ATTRIBUTE gap: searched 레더/가죽 (LEATHER, the single highest-count missing attribute corpus-wide, 42 raw hits) and 캔버스 (CANVAS, 16 raw hits) for direct adjacency to any bag item via the real `describeItemContexts` introspection tool (not raw keyword counting) - **zero hits** for either material against any bag item. BAGS has no recoverable item OR attribute signal in the current corpus.

**ACCESSORIES - currently recognized items:** BALL_CAP (2 bundles, 2 sources, 0 repeated), CAMP_CAP/BUCKET_HAT/KNIT_BEANIE (0 each) - all four are headwear only.

**Unrecognized accessory-noun search:** 스카프 (12), 벨트 (24), 선글라스 (6), 넥타이 (3), 머플러 (1), 장갑 (4, mostly non-fashion senses - rubber gloves, pilot gloves). Full-sentence manual verification (not truncated snippets) found:
- **스카프 (SCARF): 2 clean, valid, directly-adjacent relations** - "빈티지한 프린팅 스카프" (ESQUIRE_KR, correctly protected from an earlier 셔츠 by the existing comma-COORDINATION cut) and "레드 스카프" (MARIECLAIRE_KR, correctly protected from a preceding 화이트-블라우스 by the existing PAIRING_PARTICLE cut on "드레스에").
- **선글라스 (SUNGLASSES): 2 clean, valid relations** - "빈티지 로데오 버클 장식의 선글라스" (EYESMAG) and "볼드한 블랙 선글라스" (MARIECLAIRE_KR).
- **머플러 (MUFFLER): 1 clean, valid relation** - "빈티지한 머플러나 툭 걸친 백" (COSMOPOLITAN_KR) - correctly unaffected by the 나-alternation boundary since 빈티지 reaches 머플러 before the 나 particle appears.
- **벨트 (BELT): rejected as too noisy for this pass.** 24 raw occurrences split across at least 3 different roles - a genuine standalone item in a few cases ("가죽 벨트로 룩을 완성했다"), a styling-credits list format dominant in HARPERSBAZAAR_KR ("벨트는 스타일리스트 소장품" - 6+ occurrences, no attribute at all), and - most interestingly - very commonly a **DETAIL word on ANOTHER item** ("벨트 디테일의 그레이 트위드 코트", "벨트 장식 플리츠 스커트" - belt-as-decoration on a coat/skirt, not belt-as-item). Adding BELT as a competing SUB_ITEM risks enumeration conflicts with the items it's actually decorating; the cleaner path (a DETAIL:BELT value on existing items) is a real candidate for a **future, dedicated** pass, not squeezed into this one given the precision risk already found with LEATHER (Section 8).
- 넥타이/장갑: no clean candidates found (enumeration bleed or non-fashion senses).

**COAT/OUTERWEAR:** COAT already has 5 bundles / 3 sources / 3 families but 0 repeated. A real-corpus adjacency check for 레더/가죽 (LEATHER) against COAT specifically (via `describeItemContexts`) found **3 genuinely clean, directly-adjacent instances across 2 sources**: HYPEBEAST_KR ("블랙 가죽 오버코트") and HARPERSBAZAAR_KR (2 separate articles: "레더 코트", "스웨이드 염소 가죽 코트"). A 4th candidate (EYESMAG, "가죽 견장을 더한 코트") was found and **rejected** - the same sentence explicitly states the coat's real fabric is silk-cotton poplin; "가죽 견장" is a detachable leather epaulette, a distinct attached accessory, not the coat's material.

## 8. Item gap vs. attribute gap - the central diagnostic

| Category | Diagnosis |
|---|---|
| **BAGS** | **C - source/copy scarcity.** No item gap, no attribute gap - the corpus's bag-related mentions simply don't carry adjacent descriptive prose. Zero recoverable signal by any method tried. |
| **ACCESSORIES** | **A - item taxonomy gap.** 5 manually-verified valid relations exist across 3 currently-unrecognized items (SCARF, SUNGLASSES, MUFFLER), using only already-existing attribute values (VINTAGE, RED, BLACK) - no attribute gap once the items themselves are recognized. |
| **COAT/OUTERWEAR** | **B - attribute taxonomy gap.** The item is already well-recognized (5 bundles, 3 sources); the missing piece is MATERIAL:LEATHER, which has 3 clean, cross-source adjacent instances once you look for it directly (`describeItemContexts`) rather than via raw keyword counts. |

**Overall: E - mixed**, with a different specific cause per category - exactly the outcome the task's own framing anticipated as a real possibility.

## 9-10. Attribute misses + audit estimate (frozen before implementation)

| Candidate | Dimension | Target | Valid relations found | Sources/families |
|---|---|---|---:|---|
| SCARF (new item) | - | ACCESSORIES | 2 (STYLE:VINTAGE, COLOR:RED) | ESQUIRE_KR, MARIECLAIRE_KR |
| SUNGLASSES (new item) | - | ACCESSORIES | 2 (STYLE:VINTAGE, COLOR:BLACK) | EYESMAG, MARIECLAIRE_KR |
| MUFFLER (new item) | - | ACCESSORIES | 1 (STYLE:VINTAGE) | COSMOPOLITAN_KR |
| LEATHER (new attribute) | MATERIAL | mainly COAT | 3 clean (COAT) + 1 borderline (SHORTS, resolved VALID on full-sentence review) + 1 COACH_JACKET (레더/가죽 generalizing from 양가죽) | HYPEBEAST_KR, HARPERSBAZAAR_KR x2, EYESMAG |

**Audit estimate: 10 additional manually-verified-valid relations, using 3 new item canonicals + 1 new attribute canonical** (well under the 5+5 ceiling). **Potential additional bundles: ~8-10. Potential additional independent-repeat/multi-source unlocks: 0 predicted** even before implementation - none of the 10 candidate relations share an identical attribute *set* with another candidate or with existing evidence for the same item, so none was expected to immediately create a repeated/multi-source bundle. This was flagged as a real limitation of the estimate going in, and confirmed exactly by implementation (Section 18).

## 11. Implementation gate

**PASSED** on the "≥5 additional manually verified valid relations" branch (10 found, all individually confirmed VALID via full-sentence manual inspection - see Section 13 for the complete precision audit). The "≥2 independent repeated bundles unlockable" branch was NOT met (0 predicted, 0 delivered) - the gate is an OR, so this alone would still license implementation.

## 12-16. Implementation attempt (built, verified, then reverted)

Implemented, in `src/collectors/editorial/mentions.ts` and `attribute-relations.ts`: 3 new SUB_ITEM canonicals (SCARF, SUNGLASSES, MUFFLER, using only existing attribute values) and 1 new MATERIAL canonical (LEATHER, Korean-only pattern `레더|가죽`, with a narrow `(?!\s*견장)` exclusion for the one genuine cross-item-transfer false positive found). Followed the exact same full-corpus before/after diff methodology as every prior pass in this chain.

**Two real false positives were found and fixed during verification, before the net-effect analysis in Section 17-18:**
1. **"LEATHER PLEATS" (a capitalized HYPEBEAST_KR product-line name)** falsely matched an English `\bleather\b` pattern - fixed by dropping the English alternative entirely (a full-corpus check confirmed every non-Korean "leather" occurrence in this corpus is a brand/organization/campaign name, never a genuine material description; Korean 레더/가죽 had zero such collisions).
2. **"가죽 견장을 더한 코트" (leather epaulette added to a coat)** - the coat's own real fabric is explicitly stated as silk-cotton poplin in the same sentence. A general "더한/더해" clause-boundary fix was tried first and **rejected**: a full-corpus regression check showed it also incorrectly cut 2 real, pre-existing, correct relations ("체크 디테일을 더한 폴로 셔츠", "스트라이프를 더한... 니트 카디건" - constructions where the attribute word *itself* is what's "added," a structurally different and far more common pattern). Fixed instead with the narrow `가죽(?!\s*견장)` exclusion, the same style already used for COAT's own 코트니/마스코트 exclusions.

After both fixes: **10 relations added, 0 removed, 0 regressions** in the standard full-corpus diff - 100% precision on the shipped set, verified by full-sentence manual inspection of every one (Section 17 below has the complete table).

## 17. New relation precision audit

| Relation | Source | Verdict | Note |
|---|---|---|---|
| SCARF+STYLE:VINTAGE | ESQUIRE_KR | VALID | Comma-coordinated cleanly away from a preceding SHIRT |
| SCARF+COLOR:RED | MARIECLAIRE_KR | VALID | PAIRING_PARTICLE correctly protects it from a preceding companion blouse/dress |
| SUNGLASSES+STYLE:VINTAGE | EYESMAG | VALID | Nested nominal nested modifier chain, no boundary crossed |
| SUNGLASSES+COLOR:BLACK | MARIECLAIRE_KR | VALID | Directly adjacent |
| MUFFLER+STYLE:VINTAGE | COSMOPOLITAN_KR | VALID | 나-particle sits after 머플러, outside the backward window |
| SHORTS+MATERIAL:LEATHER | EYESMAG | VALID | "레더 소재의 데님 쇼츠" = "leather-material denim-*style* shorts" - a real, self-consistent fashion-writing construction (style name + actual material), re-verified on close full-sentence reading after an initial mis-parse |
| COAT+MATERIAL:LEATHER | HYPEBEAST_KR | VALID | Directly adjacent, no boundary issue |
| COAT+MATERIAL:LEATHER | HARPERSBAZAAR_KR (x2, 2 different articles) | VALID | Both directly adjacent |
| COACH_JACKET+MATERIAL:LEATHER | HYPEBEAST_KR | VALID | 양가죽 ("sheepskin") deliberately generalizes to LEATHER, consistent with how KNIT already generalizes |

**10/10 VALID, 0 QUESTIONABLE, 0 FALSE POSITIVE - 100% conservative precision**, well above the 95% target, and re-confirmed with zero regressions to any of the 78 pre-existing relations via the standard full-corpus diff.

## 18. Trust-tier impact - the actual reason this was reverted

Precision was perfect. **Net trust-tier effect was not.** Recomputing the full corpus with the change live:

| Metric | Before | After (with taxonomy change) | Delta |
|---|---:|---:|---:|
| Bundles | 46 | 54 | +8 |
| Independent Repeated | 9 | **7** | **-2** |
| Multi-source Independent | 8 | **7** | **-1** |
| Publisher-family-diverse | 7 | **6** | **-1** |

**Zero new independent-repeated, multi-source, or family-diverse bundles were created in BAGS, ACCESSORIES, or COAT/OUTERWEAR** - exactly as the audit estimate (Section 10) predicted going in, since none of the 10 new relations shared an identical attribute *set* with another instance (bundles merge on the FULL set of co-occurring attributes per article, not on any single shared attribute - a real architectural nuance this pass's own naive expectation got wrong initially: finding LEATHER on 2 different sources' COAT mentions does NOT automatically create one shared multi-source bundle if each instance also carries different OTHER attributes).

**Worse, two PRE-EXISTING trust-tier bundles were casualties of two distinct, real side effects:**

1. **Bundle-key fragmentation.** "데님 SHORTS" (EYES_INC + MCK_PUBLISHING, one of the corpus's flagship cross-family confirmations from the Marie Claire pass) had exactly 2 evidence articles: an EYESMAG one and a MARIECLAIRE_KR one, both keyed on `MATERIAL:DENIM` alone. Adding LEATHER gave the EYESMAG instance a *second* attribute (`MATERIAL:DENIM, MATERIAL:LEATHER`), changing its bundle key and splitting it into a new singleton ("데님 레더 SHORTS") - leaving the original "데님 SHORTS" bundle with only the MARIECLAIRE_KR instance, now also a singleton. Both resulting singletons are individually accurate (the EYESMAG shorts genuinely IS both denim-styled and leather-material), but the corpus's genuine cross-family confirmation was destroyed as a side effect.
2. **Roundup-heuristic reclassification.** "시퀸 SKIRT" (2 independent MARIECLAIRE_KR articles, previously 2 clusters) dropped to 1 cluster - with **neither of its own 2 articles' evidence changing at all.** Recognizing SUNGLASSES gave one of its 2 source articles ("화이트 탱크 톱 스타일링과 체형별 추천 디자인 가이드") a 3rd distinct recognized item (alongside its existing SKIRT and SHORTS relations), crossing the `countIndependentEvidenceClusters` roundup-breadth threshold and reclassifying that article as "roundup-shaped." Once roundup-shaped, it became eligible for absorption into the *other* 시퀸 SKIRT article's cluster (same source, within the same-case time window), per the existing, unmodified absorption logic - collapsing 2 independent clusters into 1. This is not a bug in the roundup heuristic; it is the heuristic behaving exactly as designed on more complete input data. But it demonstrates a real, previously-invisible coupling: **recognizing a new item anywhere in an article can silently change the trust classification of an unrelated bundle**, purely through the article's "breadth" score.

**Both side effects were reachable only by actually implementing and recomputing - no static analysis of the 10 candidate relations in isolation would have predicted either.** Given the explicit instruction not to touch ranking/trust-computation logic this pass (Section 0), and given fixing either side effect properly would require exactly that kind of change, **the taxonomy addition was reverted in full** rather than shipped with known collateral damage to metrics this project has spent 4 dedicated passes building.

## 19. Before/after category table (as actually measured, then reverted)

| Category | Relations (before/after) | Bundles (before/after) | Indep. Repeated | Multi-source | Family-diverse |
|---|---|---|---|---|---|
| BAGS | 78/78 relations touching BAGS unchanged | 6/6 | 0/0 | 0/0 | 0/0 |
| ACCESSORIES | +5 relations | 2/7 | 0/0 | 0/0 | 0/0 |
| COAT/OUTERWEAR | +5 relations | 12/14 | 1/1 | 1/1 | 1/1 |
| **Corpus-wide** | 78/88 | 46/54 | **9/7** | **8/7** | **7/6** |

All figures were measured with the real, live `getAttributeBundles` before the revert; none are estimated. **This table is retained for transparency even though the change was not shipped** - it is the actual, verified reason for the decision in Section 23.

## 20. Source-copy bottleneck

Per-source article counts for the 3 target categories (from the real corpus, unaffected by this pass's revert):

| Source | BAGS-touching relations | ACCESSORIES-touching relations (incl. candidates) | COAT-touching relations |
|---|---:|---:|---:|
| EYESMAG | most (BACKPACK/TOTE_BAG evidence, largest raw post count) | 1 (SUNGLASSES candidate) | several (incl. rejected epaulette) |
| HYPEBEAST_KR | some (BACKPACK/TOTE_BAG evidence) | 0 | 1 (clean LEATHER) |
| HARPERSBAZAAR_KR | 0 | 1 (SCARF candidate) | 2 (both clean LEATHER) |
| COSMOPOLITAN_KR | some (BACKPACK evidence) | 1 (MUFFLER candidate) | 0 |
| ESQUIRE_KR | 0 | 1 (SCARF candidate) | 0 |
| MARIECLAIRE_KR | 0 | 2 (SCARF + SUNGLASSES candidates) | 0 |
| VISLA, NONLABEL | 0 | 0 | 0 |

No single source dominates target-category copy - candidates are thinly spread across 5-6 different sources, none producing enough volume on its own to reach a repeated/multi-source bundle. This is consistent with the Section 8 diagnosis: it is not that one publication under-serves these categories while another over-serves them - it is that editorial fashion writing generally treats bags/accessories/coat-materials as secondary mentions across the board, regardless of publisher.

## 21. Current primary

**체크 SHIRT** - unchanged, per the real, unmodified `selectPrimaryPlanningBundle`. No ranking logic was touched this pass (forbidden per Section 0), and the (reverted) taxonomy change never altered `bundleSourceSpread=4`, the value that decides this bundle's rank #1 status.

## 22. Stop rule

**Applies, and applies more strongly than its own original framing anticipated.** The stop rule as written concerns finding zero recoverable evidence (source/copy scarcity). This pass found real, evidenced, 100%-precision recoverable evidence (10 relations) - and still concluded taxonomy work should stop, because implementing that evidence produced zero net trust-tier gain in the target categories AND a net trust-tier loss corpus-wide. **No further vocabulary pass is recommended for BAGS/ACCESSORIES/COAT.**

## 23. Next decision

**D. CURRENT CORPUS DOES NOT SUPPORT THESE CATEGORIES WELL ENOUGH; KEEP THEM AS LOWER-CONFIDENCE AREAS.**

Not A or B (a category-targeted source search) - the source-copy bottleneck (Section 20) shows candidates thinly spread across nearly every existing source, not concentrated in one gap a new source would obviously fill; there is no clear "this one publisher would fix it" signal the way there was for the original publisher-family diversification passes. Not C either (category coverage is not yet acceptable - BAGS/ACCESSORIES genuinely have zero trust-tier signal). **D** is the accurate, disclosed state: these three categories should be presented (or reasoned about) as lower-confidence areas of the dashboard until either (a) a future source addition happens to bring real bag/accessory/coat-material copy as a side effect of solving a different problem, or (b) the roundup-heuristic/bundle-key coupling found in Section 18 is addressed in a dedicated ranking-architecture pass - neither of which this pass's own scope permits attempting.

## 24. Operationalization note

Not applicable - decision was D, not C.

## Data safety

- EditorialPost: **373, unchanged** (confirmed both before and after the full revert).
- EditorialMention: **1496, unchanged** - no taxonomy change is live; the mid-pass implementation's own EditorialMention count was never persisted (relations are computed on-demand, same as every prior pass in this chain) and is moot after the revert regardless.
- MarketRankingSnapshot: **667, unchanged.**
- Canonical duplicates: 0. Mention duplicates: 0.
- No source collection, no ranking change, no publisher-family change, no Prisma migration, no Product Reference work, no UI work.
- `git checkout -- scripts/smoke-test.ts src/collectors/editorial/attribute-relations.ts src/collectors/editorial/mentions.ts` was used to revert the mid-pass implementation once Section 18's finding was confirmed - a targeted revert of exactly the 3 files touched, not a broad `reset`/`clean`. All scratch analysis/verification scripts were deleted immediately after use, never staged.

## Validation

Audit-only, net result. `npx tsc -b --noEmit`: clean (both mid-pass with the taxonomy change, and after the revert). `npx tsx scripts/smoke-test.ts`: **`Smoke test passed`** both mid-pass (with new fixtures added for the taxonomy change, since removed with the revert) and after the revert (confirming the tree is back to exactly HEAD `faa9b48`'s behavior, zero drift). No build was required (no shipped code change survives this pass). Product Reference frozen regression: unaffected either way - the (reverted) changes were confined to `mentions.ts`/`attribute-relations.ts`, which Product Reference's frozen-snapshot architecture (per `docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md`) is explicitly isolated from.

## Next step

**Do not pursue further BAGS/ACCESSORIES/COAT taxonomy work.** If category coverage for these three areas becomes a priority again, the more promising lead surfaced by this pass is the DETAIL:BELT candidate (Section 7) - a belt-as-decoration-on-another-item pattern with real corpus volume, structurally different from (and likely lower collateral-damage risk than) the item-canonical approach tried and reverted here - worth a dedicated, narrowly-scoped future pass of its own, separate from any ranking-architecture work needed to address the bundle-key-fragmentation and roundup-heuristic coupling this pass exposed.
