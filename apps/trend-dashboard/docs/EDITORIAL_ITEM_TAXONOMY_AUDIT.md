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
