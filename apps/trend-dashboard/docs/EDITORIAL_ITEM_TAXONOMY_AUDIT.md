# Editorial Item Taxonomy Coverage Audit

Checked date: 2026-09-08

Goal: find out whether the second-largest bottleneck in Editorial planning evidence is **item taxonomy coverage** - real product nouns in the stored corpus that the current SUB_ITEM taxonomy simply cannot see - as opposed to attribute vocabulary or raw source coverage. Product Reference research is closed; this pass does not touch it, and where the two systems turned out to be coupled, Editorial yielded rather than crossing that boundary.

## Baseline (before this pass)

- `EditorialPost` REAL: 283. `EditorialMention` REAL: 916. `MarketRankingSnapshot` REAL: 667. FASHION_RELEVANT REAL: 272.
- Sources (5): EYESMAG 102, HYPEBEAST_KR 141, ESQUIRE_KR 30, NONLABEL 4, VISLA 6.
- Direct Attribute Relations: 15 emitted / 12 distinct `(item, attributeType, attributeValue)` pairs. Bundles: 8. Repeated bundles (>=2 articles): 2 (`라글란 시퀸 긴팔 티셔츠`, `재활용 원단 토트백`).
- Distinct SUB_ITEM values with real mentions: 12. Total SUB_ITEM mentions: 45.
- Items with any direct attribute today: `LONG_SLEEVE_TEE`, `TOTE_BAG`, `TRACK_JACKET`, `BACKPACK`, `BALL_CAP` - all bag/cap/tee family, exactly the bias the audit brief named.

## Baseline item coverage

Before this pass, `ITEM` (broad) coverage was: `T_SHIRT`, `JACKET`, `PANTS`, `BAG`, `HEADWEAR`, `HOODIE` - six buckets. Entire garment families had **zero** presence at either the broad `ITEM` or specific `SUB_ITEM` level: collared/woven shirts, coats, vests, down jackets. `SUB_ITEM` coverage was 16 rules (12 with real hits): bag family (`BODY_BAG`, `BACKPACK`, `SHOULDER_BAG`, `TOTE_BAG`), jacket family (`TRACK_JACKET`, `COACH_JACKET`, `WORK_JACKET`), tee family (`RINGER_TEE`, `LONG_SLEEVE_TEE`, `RUGBY_SHIRT`), pants (`WIDE_DENIM`, `WIDE_PANTS`), headwear (`KNIT_BEANIE`, `CAMP_CAP`, `BALL_CAP`, `BUCKET_HAT`).

## Unrecognized item candidates (real-corpus probe)

A read-only probe (33 candidate phrases spanning outerwear/bottoms/tops/bags, drawn from the audit brief's own examples) was run against all 272 FASHION_RELEVANT REAL posts, matching raw text only - no taxonomy involved yet.

**19 candidates cleared the project's taxonomy-addition threshold (>=2 articles OR >=2 sources):**

| Candidate | Family | Articles | Sources |
|---|---|---|---|
| SHIRT (셔츠, excl. 티셔츠) | TOPS | 60 | 4 |
| COAT (코트/코트) | OUTERWEAR | 37 | 3 |
| SHORTS (쇼츠/반바지) | BOTTOMS | 16 | 4 |
| VEST (베스트) | OUTERWEAR | 12 | 4 |
| GRAPHIC_TEE | TOPS | 6 | 2 |
| LEATHER_JACKET | OUTERWEAR | 5 | 4 |
| PARKA (파카) | OUTERWEAR | 5 | 4 |
| SKIRT (스커트/치마) | BOTTOMS | 5 | 2 |
| POLO_SHIRT | TOPS | 5 | 2 |
| PUFFER_JACKET | OUTERWEAR | 3 | 3 |
| BOMBER_JACKET | OUTERWEAR | 3 | 2 |
| DOWN_JACKET | OUTERWEAR | 3 | 2 |
| TRACK_PANTS | BOTTOMS | 3 | 2 |
| VARSITY_JACKET | OUTERWEAR | 3 | 2 |
| BLOUSON | OUTERWEAR | 3 | 1 |
| DENIM_JACKET | OUTERWEAR | 2 | 2 |
| DENIM_PANTS (청바지) | BOTTOMS | 2 | 2 |
| SWEATSHIRT (맨투맨) | TOPS | 2 | 2 |
| CARDIGAN (가디건) | TOPS | 2 | 2 |

**Rejected outright (single observation, below threshold):** `JUMPER` (1/1), `CARGO_PANTS` (1/1), `SWEAT_PANTS` (1/1), `ZIP_HOODIE` (1/1).

This alone answers the audit's own stop-rule (§29) in the negative: far more than 5 candidates showed real, repeated, multi-source evidence, so the item-taxonomy gap is real and worth acting on - not primarily a source/copy coverage problem.

## Direct relation opportunities

All 19 qualifying candidates were wired into `editorialRules` as a temporary probe and run through the real `extractDirectAttributeRelations` pipeline (same 20-char modifier window, same coordination/enumeration guard used by every existing item). Result: 41 relations emitted (up from 15), 37 distinct pairs (up from 12).

Ranked by **new valid direct relations unlocked** (the audit's own priority order - not raw mention count):

| Item | New direct relations | Articles | Sources |
|---|---|---|---|
| SHIRT | 8 (CHECK, BLACK, STRIPE, SUEDE, DENIM, WORKWEAR, EMBROIDERY, WASHED) | 60 | 4 |
| COAT | 4 (EMBROIDERY, WHITE, BLACK, SPORTY) | 37 | 3 |
| VEST | 3 (DENIM, KNIT, BLACK) | 12 | 4 |
| DOWN_JACKET | 2 (OUTDOOR, SPORTY) | 3 | 2 |
| SHORTS | 1 (DENIM) | 16 | 4 |
| POLO_SHIRT | 1 (CHECK) | 5 | 2 |
| SKIRT | 1 (RED) | 5 | 2 |
| VARSITY_JACKET | 1 (VINTAGE) | 3 | 2 |
| SWEATSHIRT | 1 (WASHED) | 2 | 2 |
| CARDIGAN | 1 (KNIT) | 2 | 2 |
| DENIM_JACKET | 1 (WASHED) | 2 | 2 |
| LEATHER_JACKET | 1 (KNIT) - **FALSE POSITIVE, see below** | 5 | 4 |
| PARKA, PUFFER_JACKET, BOMBER_JACKET, BLOUSON, DENIM_PANTS, GRAPHIC_TEE, TRACK_PANTS | 0 | - | - |

## Precision audit (manual, on the exploratory 19-item probe)

All 25 new distinct pairs were manually inspected against their evidence text (real corpus sentence + wide context). **24 VALID, 1 FALSE POSITIVE**, giving ~96% conservative precision on the exploratory set:

- **FALSE POSITIVE**: `LEATHER_JACKET | MATERIAL | KNIT` from "니트나 가죽 재킷" ("a knit [sweater] **or** leather jacket"). `나` here is the Korean alternation particle ("or"), listing two separate items - not modifying the jacket. The extractor's `COORDINATION` regex (`attribute-relations.ts`) currently guards `,`/`·`/`와`/`과`/`및`/`그리고` but not `나`. This is a genuine gap in the shared coordination guard, not an item-taxonomy problem - documented here as a finding, not fixed in this pass (fixing shared extraction-core regex is broader than "item taxonomy" scope; `LEATHER_JACKET` was excluded from the accepted set partly because its only candidate relation came from this exact false positive).
- All other 24 (SHIRT x8, COAT x4, VEST x3, DOWN_JACKET x2, SHORTS/POLO_SHIRT/SKIRT/VARSITY_JACKET/SWEATSHIRT/CARDIGAN/DENIM_JACKET x1 each) were verified as genuine direct modifiers with no coordination/enumeration leak and no substring collision, e.g. "하우스 체크 디테일을 더한 폴로 셔츠" (Burberry), "군용 니트 베스트" (Our Legacy), "빈티지 무드의 바시티 재킷" (Ralph Lauren), "워싱 데님 재킷" (Diesel x FFXIV), "아웃도어 무드의 다운 재킷" (BEAMS x TNF).

## Critical discovery: Product Reference isolation conflict

Wiring `SHIRT`, `SHORTS`, `SKIRT`, `SWEATSHIRT`, and `CARDIGAN` into `editorialRules` broke an **existing, passing** test (`verifyMultiBrandPortability`, a KIRSH "니트 롱 스커트" fixture expecting `AMBIGUOUS`, got `RESOLVED` instead).

Root cause: `product-reference/object-relations.ts#resolveSpecificItem` reuses `editorialRules` SUB_ITEM patterns as its **Tier-1** item check, and gives ANY Tier-1 match absolute priority over its own supplemental Tier-2 item list (`product-reference/taxonomy.ts`) - by design, documented in that file's own header comment. Product Reference's taxonomy **already independently defines** `SHIRT`, `SHORTS`, `SKIRT`, `SWEATSHIRT`, and `CARDIGAN` as Tier-2 supplemental items (added in an earlier, now-closed multi-brand pass). Before this Editorial pass, a name containing both "니트" (KNIT, Tier-2) and "스커트" (SKIRT, Tier-2) correctly fell through to Tier-2 and was flagged `AMBIGUOUS` (two Tier-2 items, no single resolution). Adding Editorial's own `SKIRT` gave Tier-1 exactly one match, so it resolved immediately and never reached the Tier-2 ambiguity check - silently changing Product Reference's own resolution behavior even though no Product Reference code was touched.

Cross-referencing all 19 candidates against Product Reference's own item list (`grep -oP 'value:\s*"\K[^"]+' src/collectors/product-reference/taxonomy.ts`) confirms 5 exact-name collisions: `SHIRT`, `SHORTS`, `SKIRT`, `SWEATSHIRT`, `CARDIGAN`. `COAT`, `VEST`, `DOWN_JACKET`, `VARSITY_JACKET`, `DENIM_JACKET` are not in that list.

Since "Product Reference research is now CLOSED" and Product Reference isolation is a protected invariant, these 5 items were **rejected from this round** rather than fixed by touching `object-relations.ts`'s tier-priority design (out of scope). This is disclosed as an architectural finding for a future, explicitly-scoped pass that reviews both systems together - not a quality problem with the 5 items themselves, whose corpus evidence and direct-relation opportunities (SHIRT alone: 8 relations, the single best candidate found) remain real and undisturbed for that future pass.

## Accepted items (5, this round)

All 5 cleared the threshold, produced verified-VALID direct attribute relations, and do not collide with Product Reference's taxonomy:

1. **COAT** (코트/coat) - excludes 코트니(name), 마스코트(mascot), 테니스 코트/농구 코트(tennis/basketball court), 코트 스니커즈, 코트 헤리티지, 코트화 - all real corpus false positives found and fixed during this pass. 트렌치코트/오버코트/레인코트 etc. still match, since "코트" is a true suffix of those.
2. **VEST** (베스트) - excludes 베스트셀러 (bestseller), a real corpus false positive.
3. **DOWN_JACKET** (다운 재킷/다운 자켓/down jacket).
4. **VARSITY_JACKET** (바시티 재킷/바시티 자켓/varsity jacket).
5. **DENIM_JACKET** (데님 재킷/데님 자켓/청자켓/denim jacket).

Category mapping added to `src/config/taxonomy.ts`: all 5 map to `OUTER`.

## Rejected items

| Item | Reason |
|---|---|
| SHIRT, SHORTS, SKIRT, SWEATSHIRT, CARDIGAN | Real evidence (SHIRT: 8 relations, 60 art/4 src - the single best candidate), but collide with Product Reference's own closed Tier-2 taxonomy; adding them breaks `verifyMultiBrandPortability`. Deferred to a future pass that reviews `object-relations.ts` tier priority. |
| LEATHER_JACKET | Real presence (5 art/4 src, best source spread of any candidate) but its only candidate direct relation was the `니트나` FALSE POSITIVE above; zero valid direct-attribute evidence. |
| POLO_SHIRT | 1 valid relation but single-source (EYESMAG only); below the top-10 cut once ranked by relation count then article/source presence. |
| PARKA, PUFFER_JACKET, BOMBER_JACKET, BLOUSON, DENIM_PANTS, GRAPHIC_TEE, TRACK_PANTS | Real multi-article/multi-source presence, but zero direct-attribute relations found in the current corpus (item mentioned, never directly modified) - same honest "presence but no direct attribute" state as the existing `KNIT_BEANIE`. |
| JUMPER, CARGO_PANTS, SWEAT_PANTS, ZIP_HOODIE | Single observation (1 article/1 source) - below the taxonomy-addition threshold. |

## Before / after

| Metric | Before | After |
|---|---|---|
| EditorialPost (REAL) | 283 | 283 (unchanged) |
| EditorialMention (REAL) | 916 | 968 |
| MarketRankingSnapshot (REAL) | 667 | 667 (unchanged) |
| Duplicate posts / mentions | 0 / 0 | 0 / 0 |
| Distinct SUB_ITEM values (real mentions) | 12 | 17 |
| Total SUB_ITEM mentions | 45 | 95 |
| Direct attribute relations (emitted / distinct) | 15 / 12 | 26 / 23 |
| Items with >=1 direct attribute | 5 | 10 |
| Attribute bundles | 8 | 18 |
| Repeated bundles (>=2 articles) | 2 | 2 (unchanged - all 11 new relations are single-article observations) |

New item article/source presence (final code, FASHION_RELEVANT scan): `COAT` 31 articles / 3 sources, `VEST` 11 / 3, `DOWN_JACKET` 3 / 2, `VARSITY_JACKET` 3 / 2, `DENIM_JACKET` 2 / 2.

## Precision audit (final accepted set)

All 11 new direct relations shipped in the final 5-item set were independently re-verified VALID (100% precision on the shipped set - the one false positive found during exploration belonged to `LEATHER_JACKET`, which was rejected, not shipped):

- `COAT`: EMBROIDERY ("플로럴 자수가 돋보이는 테일러드 코트", Givenchy), WHITE ("화이트 시스루 레인코트", PAF), BLACK ("매끈한 블랙 가죽 오버코트", Public School), SPORTY ("구조적인 스포츠 코트", Thom Browne).
- `VEST`: DENIM ("헐렁한 데님 베스트", Calvin Klein), KNIT ("군용 니트 베스트", Our Legacy), BLACK ("블랙 PrimaLoft 충전 다운 베스트", Denim Tears x BBC).
- `DOWN_JACKET`: OUTDOOR, SPORTY (both "...다운 재킷", BEAMS x The North Face Purple Label).
- `VARSITY_JACKET`: VINTAGE ("빈티지 무드의 바시티 재킷", Ralph Lauren).
- `DENIM_JACKET`: WASHED ("워싱 데님 재킷", Diesel x Final Fantasy XIV).

## New bundles (10 new, all single-observation)

| Bundle | Item | Articles | Sources | Strength |
|---|---|---|---|---|
| 자수 COAT | COAT | 1 | 1 | 단일 관측 |
| 화이트 COAT | COAT | 1 | 1 | 단일 관측 |
| 블랙 COAT | COAT | 1 | 1 | 단일 관측 |
| 스포티 COAT | COAT | 1 | 1 | 단일 관측 |
| 데님 VEST | VEST | 1 | 1 | 단일 관측 |
| 니트 VEST | VEST | 1 | 1 | 단일 관측 |
| 블랙 VEST | VEST | 1 | 1 | 단일 관측 |
| 아웃도어 스포티 DOWN JACKET | DOWN_JACKET | 1 | 1 | 단일 관측 |
| 빈티지 VARSITY JACKET | VARSITY_JACKET | 1 | 1 | 단일 관측 |
| 워싱 DENIM JACKET | DENIM_JACKET | 1 | 1 | 단일 관측 |

None of these are exaggerated as "trend" - all are single observations (단일 관측), same conservative labeling the existing `evidenceStrengthLabel`/`bundleEvidenceStrength` rules already enforce. `COAT` now has 4 distinct single-observation bundles across 2 sources (EYESMAG, HYPEBEAST_KR), the strongest signal of the new items but still below the 2-article repeated-bundle bar.

## Category coverage

| Category | Items with real evidence (after) |
|---|---|
| TOPS | (unchanged this round - no new TOP item shipped; SHIRT/SWEATSHIRT/CARDIGAN evidence exists but rejected, see above) |
| OUTERWEAR | +4: `COAT`, `VEST`, `DOWN_JACKET`, `VARSITY_JACKET`, `DENIM_JACKET` (plus existing `TRACK_JACKET`, `COACH_JACKET`, `WORK_JACKET`) |
| BOTTOMS | (unchanged this round - SHORTS/SKIRT evidence exists but rejected) |
| BAGS | (unchanged this round - already the strongest category) |
| ACCESSORIES | (unchanged this round) |

The item-presence bias toward bag/cap/tee items is measurably reduced: Outerwear went from 3 specific items with any real presence to 8, and from 0 to 5 items carrying a direct attribute relation.

## Dimension effect

Editorial's own attribute dimensions are `DETAIL`, `MATERIAL`, `COLOR`, `STYLE` (there is no `SILHOUETTE` or `FINISH` dimension in this system - those exist only in Product Reference's separate taxonomy, so they are correctly N/A here, not a gap). All 4 existing dimensions were unlocked by the new items:

- DETAIL: EMBROIDERY, WASHED
- MATERIAL: DENIM, KNIT
- COLOR: WHITE, BLACK
- STYLE: VINTAGE, SPORTY, OUTDOOR

## Remaining attribute gaps (observed, NOT implemented this pass)

Per the audit brief's own sequencing rule, attribute vocabulary stays frozen this pass. Observed during item-window inspection, for a future, separately-scoped MATERIAL pass:

| Candidate | Dimension | Articles | Example |
|---|---|---|---|
| 실크 (silk) | MATERIAL | 1 (moot - adjacent to rejected SHIRT) | "자수 장식의 실크 셔츠" |
| 새틴 (satin) | MATERIAL | 1 (moot - adjacent to rejected SHIRT) | "네이비 새틴 셔츠" |
| 개버딘 (gabardine) | MATERIAL | 3 | "트로피컬 개버딘 소재의 폭스필드 트렌치코트" |
| 코튼 (cotton) | MATERIAL | 2 | "발수 기능을 갖춘 코튼 개버딘 소재의 트렌치코트" |
| 오버사이즈 (oversized) | SILHOUETTE-like, no current dimension | 2 (1 article, repeated phrase) | "정제된 테일러링과 오버사이즈 코트" |

None of these individually would unlock a large number of new relations yet (1-3 articles each); flagged for a future missed-attribute-vocabulary pass, not actioned here.

## Primary signal

No new repeated (>=2 article) bundle was created this pass - all 11 new relations are single observations. The dashboard's primary planning bundle therefore remains the strongest pre-existing repeated bundle (`라글란 시퀸 긴팔 티셔츠` or `재활용 원단 토트백`, both 2 articles / 1 source, per `selectPrimaryPlanningBundle`'s existing priority rule). This pass changes item **coverage breadth**, not the current primary signal.

## Known limitations

- `COAT`'s "court" homonym risk is only partially closed. Exclusions were added for every real false-positive pattern found in this corpus (코트니, 마스코트, 테니스 코트, 농구 코트, 코트 스니커즈, 코트 헤리티지, 코트화). One residual case remains undetectable by pattern exclusion: bare "코트" meaning "court" with no fixed preceding collocate (e.g. a pure NBA article, "...변화된 로스터가 코트 위에서..."). This inflates `COAT`'s article-presence count by at most 1 article in the current corpus and produces **zero** fabricated attribute relations (confirmed via `describeItemContexts`: this occurrence outcome is `NO_ATTRIBUTE_IN_WINDOW`, never `RELATION`). Disclosed here rather than chased further, consistent with this project's existing practice of disclosing residual misses (see `docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md`, "Color Adjacency Gate").
- The `attribute-relations.ts` `COORDINATION` guard does not include the Korean alternation particle `나` ("or"), which produced the one false positive found in this pass (`LEATHER_JACKET`, rejected). This is a shared-extraction-core gap, not an item-taxonomy gap - left unfixed and undisclosed-as-fixed on purpose, since fixing shared regex is out of this pass's scope.
- SHIRT, SHORTS, SKIRT, SWEATSHIRT, CARDIGAN evidence is real, verified, and ready to ship, but blocked by the Product Reference tier-priority coupling described above. This is the single biggest remaining opportunity (SHIRT alone would double this pass's direct-relation yield) and requires a coordinated pass across both systems, not an Editorial-only change.

## Bottleneck

**ITEM TAXONOMY** was a real, measurable bottleneck (19 of 33 probed candidates cleared evidence thresholds; the corpus is far richer in outerwear/bottoms/tops vocabulary than 12 previously-recognized SUB_ITEM values could see), and this pass closed part of it (+5 items, +11 direct relations, +10 bundles, outerwear coverage 3->8 items). But the audit also surfaced a **MIXED** secondary result: the largest single opportunity found (SHIRT) is blocked not by corpus scarcity or attribute vocabulary, but by an **architectural coupling with Product Reference** that this pass is not authorized to resolve. Attribute vocabulary itself remains a smaller, separate, still-open gap (실크/새틴/개버딘/코튼/오버사이즈), correctly deferred per the brief's own sequencing rule.

## Data safety

- `EditorialPost` (REAL): 283, unchanged throughout.
- Canonical post duplicates (`source` + `externalPostId`): 0.
- Mention duplicates (`postId`, `type`, `value`): 0.
- `MarketRankingSnapshot` (REAL): 667, unchanged.

## Validation

- `npx tsc -b --noEmit`: pass.
- `npx tsx scripts/smoke-test.ts` (`npm test`): pass, including 2 new REGRESSION GUARD assertions for the 농구 코트/마스코트 exclusions found mid-pass, plus positive/negative extraction fixtures for all 5 accepted items and an explicit absence assertion for the 5 rejected-for-collision items.
- `npm run build` (`prisma generate && next build`): pass. Required routes present: `/`, `/editorial`, `/items`, `/items/[itemType]`, `/market`.
- No UI changes made; the existing `/items` and `/items/[itemType]` pages consume the new taxonomy automatically through `categoryOfSpecificItem`/`getSpecificItemEditorialDetail`, unchanged.

## Next step

Scope a follow-up pass that reconciles `editorialRules` and Product Reference's supplemental item list (`product-reference/taxonomy.ts`) - specifically, decide whether `resolveSpecificItem`'s Tier-1-always-wins rule should instead union both tiers before checking for ambiguity - so that `SHIRT`, `SHORTS`, `SKIRT`, `SWEATSHIRT`, and `CARDIGAN` (already evidenced, already precision-verified in this pass) can ship to Editorial without breaking Product Reference's own resolution guarantees.

---

# 2026-09-08 Decoupling Pass: Editorial / Product Reference Scope Separation

Checked date: 2026-09-08 (same day, follow-up pass). This section documents the architectural fix that resolved the "Next step" above and unblocked `SHIRT`, `SHORTS`, `SKIRT`, `SWEATSHIRT`, and `CARDIGAN`.

## Previous coupling (root cause trace)

- **Editorial item rules live in**: `src/collectors/editorial/mentions.ts` (`editorialRules`, exported, grows over time as new evidence-backed items are added).
- **Product Reference item rules live in**: `src/collectors/product-reference/taxonomy.ts` (`productReferenceItemRules`/`productReferenceAttributeRules`), consumed by `src/collectors/product-reference/object-relations.ts` and the older `src/collectors/product-reference/attributes.ts`.
- **Shared imports (before this pass)**: both `object-relations.ts` and `attributes.ts` imported `editorialRules` LIVE from `editorial/mentions.ts` and used its SUB_ITEM/attribute rules as an "existing" Tier-1 vocabulary.
- **Why `verifyMultiBrandPortability` changed**: `resolveSpecificItem()` checks `editorialRules` SUB_ITEM patterns first; if exactly one distinct value matches, it resolves immediately and **never even consults** `productReferenceItemRules` (Tier 2) - even when Tier 2 would have found a second, conflicting value. A KIRSH product name containing both "니트" (Tier-2 KNIT) and "스커트" (previously nowhere in Editorial, so invisible to Tier 1) used to fall through to Tier 2, find both KNIT and SKIRT, and correctly report `AMBIGUOUS`. Once Editorial's own SKIRT rule existed, Tier 1 found exactly one match (SKIRT) and resolved immediately, silently changing the answer to `RESOLVED` and never reaching the Tier-2 ambiguity check at all.
- **Coupling type**: **D (fallback from Product Reference to editorialRules) combined with C (shared precedence/order)** - not (A) shared canonical definitions and not simply (B) shared surface matching considered in isolation. The two systems maintain independent value dictionaries that happen to sometimes share a literal string; the actual defect is the **tier priority/fallback order** treating one system's live vocabulary as the other's authoritative first pass.
- **Escalation found while tracing this**: the coupling is broader than literal name collisions. Re-running the persisted 120-product regression sample against current code (before this pass touched anything) found item-bearing had already silently drifted from the documented 58/120 to **61/120** - caused by the *prior* Editorial pass's `COAT`/`VEST`/`DOWN_JACKET` additions, **none of which collide by name** with anything in `product-reference/taxonomy.ts`. Diffing old vs. new `resolveSpecificItem` output across all 120 products pinpointed the exact cause: `VEST` newly resolved KIRSH#7321 ("카라 셔링 우븐 베스트 집업"), `COAT` newly resolved two TNF Korea "...다운 코트..." products, and `DOWN_JACKET` reclassified one TNF Korea product from generic `JACKET` to the more specific `DOWN_JACKET` (net-neutral on the count, but still a changed resolution). 58 + 3 new = 61, exactly matching the drift. This proves avoiding literal name collisions (the previous pass's mitigation) is **not sufficient** - any new Editorial Tier-1 pattern can change Product Reference's output for any product name it happens to match a substring of, regardless of whether the value name itself collides.

## Why it was unsafe

Product Reference is closed, archived research with a decided, documented regression baseline (58/120 item-bearing, 32/120 attribute-bearing, 52 relations, 92.3% conservative precision - see `docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md`). A live import meant that baseline was never actually stable: it silently moved every time Editorial's own, unrelated taxonomy grew, with no test catching it (the existing test suite only pins specific hand-picked fixtures, not the full persisted 120-product sample as an exact count).

## New scope boundary

**Minimum-change shape chosen (option B from the three offered)**: `editorialRules` remains Editorial-only and keeps growing freely. Product Reference no longer imports it at all - it now reads `src/collectors/product-reference/frozen-editorial-vocabulary.ts`, a byte-for-byte, hand-copied, **permanently frozen** snapshot of `editorialRules` exactly as it stood at commit `7f75410` (the last commit before Editorial's item-taxonomy expansion work began - verified by re-running the persisted 120-product sample against that exact commit's `mentions.ts` and confirming it reproduces 58/120 item-bearing precisely). The frozen file has **zero import dependency** on `editorial/mentions.ts` - not a live re-export, not a computed subtraction, a fully independent literal array - so no future Editorial change, however large, can ever move Product Reference's output again. `resolveSpecificItem`'s Tier-1-always-wins priority rule is otherwise **unchanged** - only the *source* of "existing/Tier-1" moved from live to frozen.

A shared canonical enum was considered (option A) and rejected: Editorial and Product Reference already maintain genuinely independent vocabularies for different input shapes (multi-topic editorial prose vs. single-SKU product names) with different grammar rules (prefix-only modifier window vs. bidirectional color adjacency); forcing a shared canonical registry would have coupled two things that only accidentally share some value names, not fixed the actual defect (the fallback/priority mechanism).

## Canonical vs. recognition rules

- **Canonical item identity** can still coincide between the two systems (e.g. both may use the string `"CARDIGAN"`) - that is expected and fine; a cardigan is a cardigan in either domain.
- **Editorial recognition rules** (`editorial/mentions.ts`) decide what Editorial *article prose* tags as that item - full freedom to expand, refine, or exclude surface forms based on editorial-corpus evidence only.
- **Product Reference recognition rules** (`product-reference/taxonomy.ts` + the frozen snapshot) decide what a Product Reference *product name* resolves to - permanently pinned to the pre-expansion Editorial snapshot plus Product Reference's own supplemental vocabulary, never affected by Editorial's live rules again.
- One scope's vocabulary expansion can no longer silently change the other's extraction output - proven by `verifyEditorialProductReferenceScopeIsolation` (`scripts/smoke-test.ts`), using the exact real KIRSH/TNF Korea product names discovered during the coupling trace as regression fixtures.

## Product Reference freeze contract

Re-running the persisted 120-product manifests (`docs/product-reference-samples/*.jsonl`, `productName` only - no description is archived, per that folder's own README) against current, decoupled code:

| Metric | Documented baseline | Reproduced (before this pass, still coupled) | Reproduced (after decoupling) |
|---|---|---|---|
| Item-bearing | 58/120 = 48.3% | **61/120** (drifted) | **58/120 = 48.3%** (exact match) |
| Attribute-bearing | 32/120 = 26.7% | 24/120 | 22/120 (see note below) |
| Relations | 52 | 29 | 27 (see note below) |

Item-bearing is fully reproducible from the archived `productName`-only data alone, and now matches the documented baseline exactly, confirming the decoupling fix is correct and complete for that metric. Attribute-bearing/relations do **not** reproduce exactly from static data - and this is **not caused by this pass**: re-running the identical check against the pre-expansion commit `7f75410` taxonomy (i.e. with zero Editorial item-taxonomy changes of any kind) still produces only 22/120 attribute-bearing and 27 relations, not 32/120 and 52. Per `docs/product-reference-samples/README.md`, only `productName` is archived; description text was never persisted ("re-fetch each `canonicalUrl` to get current description text"), and the original 32/120 & 52 measurement was made against live-fetched descriptions at audit time. Re-fetching live descriptions now would be new source collection, forbidden for this pass. This gap in reproducibility is a pre-existing, disclosed limitation of the archived sample, independent of and unaffected by this decoupling work - confirmed by the fact that it is identical whether the frozen or the fully-current Editorial taxonomy is used.

**Conclusion**: the reproducible portion of the freeze contract (item-bearing) holds exactly. The non-reproducible portion (attribute-bearing/relations, dependent on undocumented live description text) is unchanged by this pass in either direction and was never something this architecture change could restore.

## Blocked items recovered

Re-audited against the current, unchanged 283-post corpus (272 FASHION_RELEVANT), deterministically, using the same `extractDirectAttributeRelations` pipeline as every other item in this taxonomy:

| Item | Articles | Sources | Valid direct relations |
|---|---|---|---|
| SHIRT | 33 | 4 | 7: CHECK, BLACK, STRIPE, SUEDE, DENIM, WORKWEAR, EMBROIDERY |
| SHORTS | 14 | 4 | 1: DENIM |
| SKIRT | 5 | 2 | 1: RED |
| CARDIGAN | 5 | 2 | 2: KNIT, STRIPE |
| SWEATSHIRT | 2 | 2 | 1: WASHED |

All 5 clear the acceptance bar (real current-corpus usage, >=1 manually verified valid relation, unambiguous semantics, acceptable precision) and ship this pass - no candidates were rejected this round; the max-5 cap (step 14) was exactly met.

### SHIRT deep review

Per-context inspection of all 59 raw SHIRT-pattern occurrences (33 articles) found and fixed three real collisions before shipping:

1. **`스웨트셔츠`/`스웨트 셔츠` (SWEATSHIRT) double-tagging as generic SHIRT** - real regression: "거친 듯 옅게 워싱된 라일락 컬러 스웨트셔츠" used to fire both `SHIRT+WASHED` and `SWEATSHIRT+WASHED` from identical evidence. Fixed with a negative lookbehind, mirroring the existing `티셔츠`/T_SHIRT exclusion.
2. **`T셔츠` (fused Latin-T form, distinct from `티셔츠`)** - "이번 컬래버레이션은 총 세 가지 T셔츠" was tagging generic SHIRT via a form the T_SHIRT rule itself doesn't recognize either. No attribute was ever attached (item-presence-only inflation, confirmed via `describeItemContexts`: `NO_ATTRIBUTE_IN_WINDOW`), but fixed anyway for correctness.
3. **`럭비 셔츠`/`rugby shirt` (existing, more-specific RUGBY_SHIRT) double-tagging** - found via an explicit collision test (not real-corpus evidence, since no real RUGBY_SHIRT article happened to also test this path); excluded for consistency with the SWEATSHIRT/T_SHIRT precedent - an item that already has its own dedicated, more-specific SUB_ITEM should not also double-tag the generic parent.

Compound real-corpus SHIRT subtypes with **no dedicated SUB_ITEM of their own** - `폴로 셔츠` (polo shirt), `오버셔츠`/`오버 셔츠` (overshirt), `워크웨어 셔츠` (workwear shirt) - are intentionally left matching generic SHIRT; that is the best available tag for them, and none currently clears its own independent >=2-article/source threshold as a standalone canonical.

No enumeration false positives: 2 of the 59 raw occurrences were correctly rejected by the existing coordination guard (comma/list boundaries), 10 had no preceding text at all (`NO_WINDOW`), and the remaining 39 had a real modifier window but no currently-tracked attribute inside it (candidate future MATERIAL vocabulary - see "Remaining attribute gaps" below).

### SWEATSHIRT

Real corpus forms actually present: `스웨트셔츠` (2 articles) only - bare `맨투맨` has **zero** occurrences in the current corpus (checked directly; the pattern is kept for future evidence but currently inert). `스웻` (the short/ambiguous form the brief specifically warned about, which could collide with sweatpants or generic fabric/style descriptions) does not appear anywhere in the corpus - never added, avoiding that risk entirely.

### CARDIGAN

Both real Korean spellings are present and distinct: `가디건` (2 articles: EYESMAG "아미 키즈", HYPEBEAST_KR "JENNIE x adidas") and `카디건` (3 additional HYPEBEAST_KR articles, found during this pass's audit and added - all genuine cardigan references, e.g. "청키한 풀집 니트 카디건", "돋보이는 도톰한 풀 지퍼 니트 카디건", none a misattributed generic-knit reference).

### SHORTS / SKIRT

`SHORTS` uses `\bshorts\b` (plural, word-bounded) in English - confirmed it never fires on the bare adjective "short" (explicit collision test added). Korean forms `쇼츠`/`반바지` are both real and unambiguous in this corpus - no "YouTube Shorts" or other homonym usage was found. `SKIRT` (`스커트`/`치마`) remains a clean product noun in every real occurrence; no collision found.

## Before / after (Editorial)

| Metric | Before this pass | After this pass |
|---|---|---|
| EditorialPost (REAL) | 283 | 283 (unchanged) |
| EditorialMention (REAL) | 968 | 1,025 |
| MarketRankingSnapshot (REAL) | 667 | 667 (unchanged) |
| Direct relations (emitted / distinct) | 26 / 23 | 41 / 35 |
| Bundles | 18 | 29 |
| Repeated bundles (>=2 articles) | 2 | 4 |
| Items with >=1 direct attribute | 10 | 15 |
| Distinct SUB_ITEM values (real mentions) | 17 | 22 |

New repeated bundles: `체크 SHIRT` (2 articles, **2 sources** - 여러 매체 동시 관찰, the strongest evidence tier of any bundle in the dataset) and `니트 CARDIGAN` (2 articles, 1 source - 반복 관측 · 특정 매체 집중).

## Precision (new relations, this pass)

All 12 distinct new relations (15 emissions) manually inspected against evidence text:

| Item | Attribute | Evidence | Classification |
|---|---|---|---|
| SHIRT | DETAIL:CHECK | "하우스 체크 디테일을 더한 폴로 셔츠" (Burberry) | VALID |
| SHIRT | DETAIL:CHECK | "일본산 코튼 울 체크 오버셔츠" (TDR) | VALID |
| SHIRT | COLOR:BLACK | "레드와 블랙이 섞인 옴브레 플레이드 셔츠" (VISLA) | VALID |
| SHIRT | DETAIL:STRIPE | "스트라이프 러닝 셔츠" (EYESMAG) | VALID |
| SHIRT | MATERIAL:SUEDE | "스웨이드 오버셔츠" (EYESMAG) | VALID |
| SHIRT | MATERIAL:DENIM | "일본산 데님 셔츠" (EYESMAG) | VALID |
| SHIRT | STYLE:WORKWEAR | "워크웨어 셔츠" (EYESMAG) | VALID |
| SHIRT | DETAIL:EMBROIDERY | "자수 장식의 실크 셔츠" (EYESMAG) | VALID |
| SHORTS | MATERIAL:DENIM | "레더 소재의 데님 쇼츠" (EYESMAG) | VALID |
| SKIRT | COLOR:RED | "레드 오스트리치 깃털 다발을 장식한 스커트" (EYESMAG) | VALID |
| SWEATSHIRT | DETAIL:WASHED | "거친 듯 옅게 워싱된 라일락 컬러 스웨트셔츠" (EYESMAG) | VALID |
| CARDIGAN | MATERIAL:KNIT | 3x: "청키한...니트 카디건", "...니트 카디건", "니트 랩 가디건" (HYPEBEAST_KR) | VALID |
| CARDIGAN | DETAIL:STRIPE | "범아프리카 스트라이프를 더한...니트 카디건" (HYPEBEAST_KR) | VALID |

**12 VALID, 0 QUESTIONABLE, 0 FALSE POSITIVE. Conservative precision: 100%** (well above the required >=95%). The one false positive found during this pass's exploratory probing (`LEATHER_JACKET+KNIT` from "니트나 가죽 재킷", an enumeration via the Korean "or" particle `나` that the shared `COORDINATION` regex doesn't guard) belonged to an item that was never shipped - `LEATHER_JACKET` was not one of the 5 items in scope for this pass (step 14 capped additions at exactly the 5 previously-blocked candidates) and remains unaddressed, same as before.

## Category coverage (items with direct attributes, after)

| Category | Items |
|---|---|
| TOPS | `LONG_SLEEVE_TEE`, `SHIRT`, `SWEATSHIRT`, `CARDIGAN` (4) |
| OUTERWEAR | `TRACK_JACKET`, `COAT`, `VEST`, `DOWN_JACKET`, `VARSITY_JACKET`, `DENIM_JACKET` (6) |
| BOTTOMS | `SHORTS`, `SKIRT` (2) |
| BAGS | `TOTE_BAG`, `BACKPACK` (2) |
| ACCESSORIES | `BALL_CAP` (1) |

OUTERWEAR is now the single largest category by direct-attribute item count - a direct reversal of the original bag/cap/tee bias this whole taxonomy-coverage effort set out to test.

## Current signal

`selectPrimaryPlanningBundle` now selects **"체크 SHIRT"** (2 articles, 2 independent sources - EYESMAG + HYPEBEAST_KR) as the dashboard's primary planning bundle, replacing the previous single-source repeated bundles (`라글란 시퀸 긴팔 티셔츠` / `재활용 원단 토트백`, both 1 source). This is a genuine evidence-strength improvement (multi-source repeated observation outranks single-source repeated observation under the existing, unchanged `bundleEvidenceStrength` priority rule) - not a sorting-logic change.

## Missed attribute candidates (audit only, not implemented)

| Candidate | Dimension | Item | Articles | Evidence |
|---|---|---|---|---|
| 칼라 (collar) | DETAIL-like | SHIRT | 2 | "턱시도에서 영감을 받은 윙 칼라 셔츠"; "밴드 칼라 워크 셔츠" |
| 버튼업 (button-up/front) | DETAIL | SHIRT | 2 | "숏슬리브 버튼업 셔츠"; "그래픽 버튼업 셔츠" |
| 실크 (silk) | MATERIAL | SHIRT | 1 | "자수 장식의 실크 셔츠" |
| 새틴 (satin) | MATERIAL | SHIRT | 1 | "네이비 새틴 셔츠" |
| 개버딘 (gabardine) | MATERIAL | COAT | 3 | "트로피컬 개버딘 소재의 폭스필드 트렌치코트" |
| 코튼 (cotton) | MATERIAL | COAT | 2 | "발수 기능을 갖춘 코튼 개버딘 소재의 트렌치코트" |

None individually would unlock enough relations to justify its own pass yet (1-3 articles each); carried forward as the next attribute-vocabulary decision point, per the frozen-attribute-vocabulary rule for this item-scope pass.

## Tests added

`scripts/smoke-test.ts`:
- `verifyEditorialProductReferenceScopeIsolation` (new function): pins the frozen snapshot's exact rule count (57) and physical distinctness from live `editorialRules`; asserts none of the 10 Editorial-only items (5 from the prior pass + 5 from this pass) ever appear in the frozen snapshot; 3 behavioral proofs using the real KIRSH/TNF Korea product names discovered during the coupling trace (VEST/COAT new-resolution cases, DOWN_JACKET reclassification case) confirming Product Reference's `resolveSpecificItem` output is byte-for-byte unaffected by Editorial's live rules in both directions; symmetric proof that Product-Reference-only items (`BLOUSE`, `ZIP_HOODIE`) never leak into `extractEditorialMentions`.
- `verifyDomesticFirstTaxonomy` (extended): category-mapping assertions for all 5 new items; positive extraction fixtures for each; SHIRT collision guards (T_SHIRT, T셔츠, SWEATSHIRT, RUGBY_SHIRT all correctly excluded from double-tagging as generic SHIRT); SHORTS boundary guard (bare "short" adjective never resolves).

## Validation

- `npx tsc -b --noEmit`: pass.
- `npx tsx scripts/smoke-test.ts` (`npm test`): pass, including the new scope-isolation test and all extended fixtures.
- `npm run build`: pass. Required routes present: `/`, `/editorial`, `/items`, `/items/[itemType]`, `/market`.
- Editorial quality re-audit (`audit-attribute-relations.ts`): 41 relations / 35 distinct / 29 bundles, matches the table above exactly.
- Product Reference frozen regression (persisted 120-product sample): item-bearing 58/120, exact match to the documented baseline - confirmed both immediately after the pure architectural decoupling (before any item was added) and again after all 5 items shipped, proving the freeze holds under load, not just at rest.
- Data safety: `EditorialPost` 283 (unchanged), canonical post duplicates 0, mention duplicates 0, `MarketRankingSnapshot` 667 (unchanged).

## Success criteria

A. Product Reference 120-product item-bearing output is unchanged (58/120, exact) - **met**.
B. Editorial safely shipped all 5 previously blocked item rules - **met**.
C. New relation conservative precision >=95% - **met (100%)**.
D. No semantic regressions - **met**: full existing test suite passes unchanged, including every pre-existing Product Reference and Editorial fixture.

## Next step

None required from this pass specifically - the architectural blocker is resolved and the 5 previously-identified high-value items have shipped. The next natural step for the *taxonomy* track (not required now) is the missed-attribute-vocabulary candidates listed above (칼라, 버튼업, 실크, 새틴, 개버딘, 코튼), each still below its own independent evidence threshold.
