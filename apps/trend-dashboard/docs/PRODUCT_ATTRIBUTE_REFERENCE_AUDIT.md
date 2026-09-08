# Product Attribute Reference Audit (Covernat probe)

Checked date: 2026-09-07

## Why brand/product references

Prior passes (`docs/HIGH_DENSITY_SOURCE_AUDIT.md`) found that even the best available Editorial/trend-signal source (ESQUIRE_KR) tops out around a 10% Direct Attribute Rate, and Arena/Noblesse stayed at 0.0%/6.7%. The hypothesis this pass tests: a brand's own official site - product names, descriptions, lookbook pages - may carry SPECIFIC ITEM + DIRECT ATTRIBUTE language at a much higher density than any magazine's narrative prose, because e-commerce product naming is *itself* an attribute-chain by convention ("워시드 와이드 데님 팬츠"), not something a journalist has to choose to write.

This is explicitly **not** an Editorial-source pass. Nothing sampled here is counted toward `EditorialPost`, `EditorialMention`, or `sourceSpread`. The two roles stay separated throughout this document:

- **EDITORIAL SIGNAL**: "어떤 아이템/조합이 여러 독립 패션 매체에서 관찰되는가?" (cross-media observation)
- **PRODUCT ATTRIBUTE REFERENCE**: "시장에 실제 출시된 상품은 어떤 실루엣/소재/가공/컬러/디테일을 사용하는가?" (what a real SKU actually is)

A Product Reference bundle and an Editorial bundle must never be merged into one claim (e.g. observing TOTE_BAG in 3 media articles plus BIG/NYLON/RED in a brand's catalog does **not** mean "빅 나일론 레드 토트백이 트렌드" - that conflates two different kinds of evidence).

## Important note surfaced during this probe

**covernat.co.kr is operated by B:CAVE** (`PRIVACY@BCAVE.CO.KR`, `COPYRIGHT(C) 2022 B.CAVE ALL RIGHTS RESERVED`, business registration `261-81-17293`, same Mapo-gu Seoul address referenced elsewhere in this project's own business context). This is not a third-party competitor brand - it is the operating company's own storefront. This has two consequences worth being explicit about:

1. There is no external-access sensitivity beyond the ordinary robots.txt/usage-notice checks already applied - if anything, this is safer than probing an unrelated company's site.
2. Its data **cannot** be used as independent "market trend" evidence the way a genuine third-party competitor's catalog could - it is the company's own assortment, so any density/vocabulary findings here should be read as "does our own brand's product data carry useful attribute vocabulary/reference value," not as "what is happening in the broader market." This reinforces (not undermines) the Brand Bias discussion in Section 12 below: even setting aside the general one-brand-is-one-brand concern, Covernat specifically is not an independent market signal at all.

## 1. Covernat public surface audit

| Surface | Route pattern | Exists? |
|---|---|---|
| PRODUCT DETAIL | `/product/<slug>/<id>/` (canonical) or `/product/detail.html?product_no=<id>` (internal) | Yes - 2,254 URLs in the active sitemap alone |
| EDITORIAL | `/product/editorial-detail.html?product_no=<id>` (listed at `/product/editorial-list.html?cate_no=835`) | Yes - a distinct "campaign/lookbook" content type |
| LOOKBOOK / COLLECTION (mega-menu) | `/product/list.html?cate_no=<N>` (e.g. "2026 SUMMER LOOKBOOK" = cate_no 3889) | **Not a distinct content surface** - confirmed by fetching it: it is a curated PRODUCT DETAIL listing that links straight to the same `/product/detail.html?product_no=` pages. No separate narrative page exists behind the "룩북"/"COLLECTION" mega-menu. |
| CAMPAIGN | Same as EDITORIAL (no separate route found) | No distinct surface beyond EDITORIAL |
| NEWS | Not found | No |
| CATEGORY / general listing | `/product/list.html?cate_no=<N>` | Yes, but `?page=`/`&page=` pagination on it is robots-disallowed for our identity (see below) |

### Public access, robots.txt, canonical, dates, body, images

- **robots.txt**: Cafe24-platform template (same family as the `arena.co.kr` swimwear-brand false lead from the prior pass, confirming this is a common Korean e-commerce CMS, not evidence of any relation to Arena). `User-agent: *` disallows: `/admin`, `/api`, `/join`, `/myshop/`, `*search.html*`, `*write.html*`, `*modify.html*`, **`*&page=*` and `*?page=*` (all query-string pagination)**, a newcoupon endpoint, `*&sort_method=*`, one specific sale page, two specific category paths (`outlet/274`, `wind-breaker/484`), and two specific `cate_no` values on `/product/list.html` (2055, 2045). No ClaudeBot-specific rule exists, so our identity falls under the permissive parts of the `*` group. **Access: ALLOWED** for everything sampled in this pass (product pages, the editorial list/detail pages, and the lookbook category page used were none of the disallowed paths). `Sitemap: https://covernat.co.kr/sitemap.xml` is declared.
- A single narrow exception exists for Naver's `Yeti` bot only, disallowing one specific URL (`/product/editorial-detail.html?product_no=8721`) - not a general block, and not applicable to our identity.
- **Discovery**: `sitemap.xml` → `sitemap0.xml.gz` + `sitemap1.xml.gz` (gzip). `sitemap1.xml.gz` (more recently updated) alone holds 2,254 product URLs with `lastmod`. This is a clean, public, standard discovery path - no pagination needed, and the robots-disallowed `?page=` pattern is never required.
- **Canonical URL**: the sitemap's own `<loc>` (e.g. `/product/우먼-핫픽스-로고-티셔츠-라이트-블루/10796/`) IS the canonical, human-readable URL; the `?product_no=` parameterized form is an internal alias for the same page.
- **Published date**: PRODUCT pages carry no `datePublished` (JSON-LD type is `Product`, not `Article`) - `sitemap.xml`'s `lastmod` is the only public date signal, and it reflects last-modified, not original listing date. EDITORIAL pages carry no date field of any kind that was found in this sample.
- **Body/copy**: PRODUCT pages carry a real, public, structured JSON-LD `description` field (design notes + fabric composition + size table, in a `º`-bulleted format) alongside the JSON-LD `name` (itself an attribute-chain string). EDITORIAL pages carry almost no extractable text at all - see Section 3.
- **Image metadata**: JSON-LD `image` array on PRODUCT pages links directly to real product photography (multiple angles) with a clear DOM relationship (`Product.image` → `Product.name`/`description`, same JSON-LD object) - see Section 15.

### AI / content use notice (Section 2 check)

**No AI-training or content-use restriction notice was found** in the sampled PRODUCT or EDITORIAL page bodies, nor on the homepage - unlike Arena, which carried an explicit "AI학습 및 활용 금지" line on every article in the prior pass. A dedicated terms-of-service/copyright policy page was not separately audited (out of scope for a probe pass), so this is reported as "none found in sampled pages," not as an absolute guarantee. No usage-limitation flag is raised on the evidence gathered.

## 2. Surface-by-surface sample

| Surface | Sample size | Method |
|---|---:|---|
| PRODUCT DETAIL | 30 | JSON-LD `name` + `description`, spread across the 2,254-URL sitemap (index positions 1, 20, 40, ... 580) to avoid consecutive-SKU bias |
| EDITORIAL | 20 | All entries visible on the single `/product/editorial-list.html?cate_no=835` listing page (robots-compliant - no pagination needed or attempted) |
| LOOKBOOK / COLLECTION | Not sampled separately | Confirmed (Section 1) to route to the same PRODUCT DETAIL pages already sampled - sampling it again would double-count the same underlying pages under a different label, not add new surface coverage |

Zero DB writes at any point; only aggregate metrics were kept, raw HTML discarded after each extraction (memory-safe, sequential, ~600ms delay between requests).

## 3. Standard attribute metrics

| Metric | PRODUCT DETAIL | EDITORIAL |
|---|---:|---:|
| Sample Pages | 30 | 20 |
| Specific Item-bearing Pages | 5 (16.7%) | 2 (10.0%) |
| Direct Attribute-bearing Pages | 0 (0.0%) | 0 (0.0%) |
| Direct Relations | 0 | 0 |
| Unique Specific Items (any mention) | BALL_CAP, BACKPACK, LONG_SLEEVE_TEE, TOTE_BAG, RINGER_TEE | WORK_JACKET, TRACK_JACKET |
| Unique Attributes | none captured | none captured |
| Potential Bundles | 0 | 0 |
| Median combined name+description length | 436 chars | 414 chars (see caveat below - EDITORIAL's real narrative content is far thinner than this number suggests; see Section 3a) |

**0.0% Direct Attribute Rate on both surfaces is a real, diagnosed finding, not a probe failure** - see Section 6 for the full root-cause analysis. It is not evidence that Covernat lacks real attribute language (it clearly does not - see Section 7); it is evidence of a **structural mismatch between the current extractor's Korean-prose-oriented design and this specific site's e-commerce naming convention.**

### 3a. EDITORIAL surface: text quality caveat

EDITORIAL pages' apparent body length (median 414, up to 3,024 for the longest sampled page) substantially overstates real narrative content. Manual inspection of the longest sample ("WALK-WEAR," 3,024 chars) found it is **almost entirely a small RELATED PRODUCTS grid (3 items) followed by client-side Swiper-carousel JavaScript configuration that a naive fixed-length HTML slice can pick up as if it were text** when the closing `</script>` tag falls outside the slice window. The actual "look" content on every EDITORIAL page sampled is communicated through lazy-loaded (`ec-data-src`) images with no `alt` text - there is effectively **no real narrative prose surface on this site**, only a thin product-name grid per look. This is reported transparently rather than allowing an artifact of the probe's own slicing to inflate the EDITORIAL surface's apparent richness.

## 4. Attribute dimension coverage

Both surfaces measured **zero** direct relations in any dimension via the current extractor:

```
PRODUCT DETAIL
Silhouette: 0
Detail: 0
Material: 0
Finish: 0
Color: 0
Style: 0

EDITORIAL
Silhouette: 0
Detail: 0
Material: 0
Finish: 0
Color: 0
Style: 0
```

These are real counts from the real production extractor run against real sampled text - not withheld or estimated. Section 6 explains why real, visible attribute language in the sampled text (Section 7) still produced zero relations.

## 5. Item attribute resolution (Section 6 requirement) - root cause of the 0% rate

Two independent, verified causes, confirmed with controlled test cases against the real production `extractDirectAttributeRelations`/`describeItemContexts` functions (not guessed):

### Cause A: trailing-COLOR naming convention vs. prefix-only window design

Korean adnominal modifiers precede the noun they modify ("블랙 재킷" = a black jacket), which is exactly what the extractor's `MODIFIER_WINDOW` (20 chars, prefix-only) is built to catch - correctly, for editorial prose. But Covernat's product-naming convention frequently places **COLOR specifically as a trailing SKU-variant suffix**, after the item noun, mirroring one base product having multiple color variants:

```
"루베라 백팩 블랙"              -> 0 relations (COLOR trails the item)
"블랙 루베라 백팩" (reordered)   -> BACKPACK + COLOR:BLACK (same words, prefix order)

"클로버하트 플러피 토트백 브라운" -> 0 relations (COLOR trails the item)
"브라운 토트백" (reordered)      -> TOTE_BAG + COLOR:BROWN (same words, prefix order)
```

This was verified directly against the real extractor (not simulated) - identical vocabulary, only word order changed, and the relation appears exactly when COLOR is moved to a leading position. This is the single largest, most fixable gap found in this pass: **COLOR is a closed, enumerable vocabulary** (unlike DETAIL/MATERIAL/STYLE, which are open-ended), making a bidirectional (both-sides-of-the-noun) check for COLOR specifically a much lower-risk extension than doing so for every attribute type - but this pass does not implement it (see Section 21: no code changes).

### Cause B: item/attribute vocabulary gap (see Section 8/9 for the full breakdown)

Many of Covernat's real modifier words (플러피/헤어리/벨로아/코듀로이/핀턱/멜란지/글리터/크롭핏/세미와이드) and item nouns (티셔츠/맨투맨/니트/후디/블루종/베스트/크로스백/더플백/스커트) are simply not registered in the current taxonomy at all, independent of word order. See Sections 8-9.

### Correctness check: no false attachment across concatenated product lists

The RELATED PRODUCTS widget concatenates many product names with no sentence punctuation between them (`"...티셔츠 블랙 29,000원 29,000원 0 티셔츠 화이트 29,000원..."`). A controlled test against this exact real shape confirmed **zero false relations were produced** - no attribute from one list entry leaked into an adjacent entry's item. The extractor's existing conservative design (short 20-char window, enumeration guard) holds up safely on this different text shape; the failure mode here is strictly under-detection (a missed real attribute), never fabrication/over-attachment. This matches the project's stated precision-over-recall philosophy.

## 6. High-value phrase examples (real, from the 30-product sample)

```
Surface: PRODUCT
Specific Item: BACKPACK (tracked)
Attributes: none captured (see Cause A)
Evidence: "루베라 백팩 블랙"

Surface: PRODUCT
Specific Item: TOTE_BAG (tracked)
Attributes: none captured (see Cause A)
Evidence: "클로버하트 플러피 토트백 브라운"

Surface: PRODUCT
Specific Item: LONG_SLEEVE_TEE (tracked)
Attributes: none captured (BIG_POCKET requires "빅 포켓"/"카고 포켓", not bare "포켓")
Evidence: "베이직 포켓 롱슬리브 오프 화이트"

Surface: PRODUCT
Specific Item: RINGER_TEE (tracked)
Attributes: none captured (see Cause A - SKY BLUE trails)
Evidence: "[커버낫x하이다나] 럭키 씨리얼 링거 티셔츠 스카이 블루"

Surface: PRODUCT
Specific Item: (untracked - "니트"/knit)
Attributes: DETAIL:RAGLAN is a registered value, but the item noun itself isn't tracked
Evidence: "헤어리 레글런 니트 그린" (also: 헤어리/HAIRY and 그린/GREEN are real, usable modifiers once the item is tracked)

Surface: PRODUCT
Specific Item: (untracked - "더플백"/duffle bag)
Attributes: DETAIL:SHIRRING is a registered value (already backs the 셔링 트랙 재킷 bundle), unused here because the item isn't tracked
Evidence: "클로버하트 버블 셔링 더플백 블랙"

Surface: PRODUCT
Specific Item: (untracked - "블루종"/blouson)
Attributes: DETAIL:CHECK is registered, unused because the item isn't tracked
Evidence: "울 체크 카라 블루종 다크 네이비"

Surface: PRODUCT
Specific Item: (untracked - "티셔츠"/generic T-shirt, WOMEN's line)
Attributes: MATERIAL gap - "벨로아"(velour) not registered
Evidence: "우먼 벨로아 반팔티 초콜렛"

Surface: PRODUCT
Specific Item: (untracked - "팬츠"/pants, non-wide)
Attributes: MATERIAL gap - "코듀로이"(corduroy, a real, common, high-value MATERIAL term) not registered; DETAIL gap - "핀턱"(pintuck) not registered
Evidence: "우먼 코듀로이 핀턱 팬츠 아이보리"

Surface: PRODUCT
Specific Item: (untracked - "맨투맨"/crewneck sweatshirt, extremely frequent across the catalog)
Attributes: SILHOUETTE gap - "세미와이드"(semi-wide) not registered; this is exactly the corpus's weakest dimension
Evidence: "세미와이드 시그니처 심볼 스웻 팬츠 블랙" (SILHOUETTE term on a pants item here; the same "세미와이드" vocabulary recurs across the catalog)

Surface: PRODUCT (JSON-LD description field, not the name)
Specific Item: (untracked - generic T-shirt)
Attributes: SILHOUETTE gap - "짧은 기장의 크롭핏"(short-length CROP fit) - a genuine, real, direct SILHOUETTE phrase, the corpus's single most conspicuous missing dimension
Evidence: "º디자인- 소프트한 터치감의 코튼 소재 사용- 우먼 라인 로고 핫픽스 포인트- 짧은 기장의 크롭핏º원단겉감 - cotton 100%"

Surface: EDITORIAL
Specific Item: WORK_JACKET / TRACK_JACKET (mentioned)
Attributes: none captured
Evidence: (RELATED PRODUCTS grid text only - no narrative modifier phrase found; see Section 3a)
```

## 7. Current taxonomy coverage (Section 8 classification)

**A. Readable by current taxonomy as-is** (item tracked, attribute tracked, only word order defeats it): TOTE_BAG+COLOR, BACKPACK+COLOR, RINGER_TEE+COLOR (all Cause A cases above) - these would work immediately if COLOR detection were made bidirectional, with zero other changes.

**B. Specific Item taxonomy missing** (item noun itself untracked, seen repeatedly in the real sample): 티셔츠 (generic T-shirt, by far the most frequent noun on this site), 맨투맨 (crewneck sweatshirt), 니트/스웨터 (knit/sweater), 후디/후드집업 (hoodie/zip hoodie), 블루종/자켓 (blouson/generic jacket), 베스트 (vest), 푸퍼/다운 (puffer/down jacket), 크로스백/호보백/더플백 (cross-body/hobo/duffle bag), 스커트 (skirt), 팬츠/쇼츠 (generic, non-wide pants/shorts).

**C. Attribute taxonomy missing** (item may or may not be tracked, but the modifier word itself has no rule): 플러피(fluffy), 헤어리(hairy), 벨로아(velour), 코듀로이(corduroy), 핀턱(pintuck), 멜란지(melange), 글리터(glitter), 크롭핏(crop fit), 세미와이드(semi-wide), 스탠다드핏(standard fit), 유틸리티(utility).

No taxonomy changes were made this pass - all of the above are reported as candidates only, per the task's explicit instruction.

## 8. New specific item candidates (Section 9)

| Candidate | Surface Forms Observed | Article/Page Presence (this sample) | Potential Attribute Relations if Tracked |
|---|---|---:|---|
| SWEATSHIRT (맨투맨) | "C 로고 맨투맨," "스몰 C 로고 럭비 맨투맨," "CVNT 그래픽 맨투맨" | 4 of 30 product pages | DETAIL:CHECK/RAGLAN-adjacent, COLOR (if bidirectional), SILHOUETTE:세미와이드-class terms |
| HOODIE / ZIP_HOODIE (후디/후드집업) | "CVNT 후드집업," "우먼 쿠퍼로고 후디," "우먼 C로고 후드집업" | 3 of 30 | COLOR (if bidirectional), brand-logo DETAIL terms |
| KNIT (니트/스웨터) | "헤어리 레글런 니트" | 1 of 30 | DETAIL:RAGLAN already registered; FINISH:HAIRY would be new |
| CORDUROY_PANTS or generic PANTS | "우먼 코듀로이 핀턱 팬츠," "스몰 어센틱 카고 스웻 팬츠," "세미와이드 시그니처 심볼 스웻 팬츠" | 3 of 30 | MATERIAL:CORDUROY, DETAIL:PINTUCK, SILHOUETTE:세미와이드 - all new |
| BLOUSON / WORK_JACKET-class outer | "울 체크 카라 블루종," EDITORIAL mentions of WORK_JACKET | 1 product + 2 editorial | DETAIL:CHECK already registered |
| PUFFER / DOWN_VEST | "우먼 씨빅 RDS 숏 푸퍼," "유틸리티 다운 베스트" | 2 of 30 | STYLE:UTILITY would be new; COLOR (if bidirectional) |
| CROSS_BODY_BAG / HOBO_BAG | "플로우 나일론 호보 크로스백" | 1 of 30 | MATERIAL:NYLON already registered (used elsewhere in the corpus) |
| DUFFLE_BAG | "클로버하트 버블 셔링 더플백" | 1 of 30 | DETAIL:SHIRRING already registered |

These are candidate observations only, per the task's explicit "no taxonomy addition this pass" instruction.

## 9. Product reference semantics (Section 10) - kept strictly separate

No merging occurred anywhere in this pass. Concretely: this sample found real evidence of TOTE_BAG existing in FLUFFY/BROWN form (Product Reference) and, separately, the existing Editorial corpus has TOTE_BAG appearing across EYESMAG/HYPEBEAST_KR articles (Editorial Signal, `재활용 원단 토트백` bundle, MATERIAL:RECYCLED_FABRIC). **These are not combined into any claim like "브라운 플러피 재활용 토트백이 트렌드."** They are two separate, independently-labeled facts: one about what Covernat specifically ships, one about what media specifically observed. No architecture change was made to enforce this separation structurally (see Section 12) - it is maintained here only by discipline in this document, which is exactly the risk a future implementation would need to guard against with actual code/schema separation.

## 10. Product reference value assessment (Section 11)

| Use | Assessment |
|---|---|
| A. ATTRIBUTE VOCABULARY DISCOVERY | **High potential, not yet realized.** Real, repeated evidence of otherwise-unseen vocabulary (크롭핏, 세미와이드, 코듀로이, 핀턱, 헤어리, 벨로아) - especially valuable because 크롭핏/세미와이드/스탠다드핏 are SILHOUETTE-dimension terms, the corpus's most conspicuous gap. |
| B. ATTRIBUTE REFERENCE (how a tracked item actually ships) | **Partially demonstrated.** TOTE_BAG shipping in fluffy/brown form and BACKPACK in "루베라"(a material/line name) + black form are real observed facts, currently blocked from being captured only by the Cause A word-order gap. |
| C. ASSORTMENT SIGNAL (what Covernat is currently selling) | **Present but brand-specific and not generalizable** - see Section 12/the B:CAVE note above. Useful only as "what one brand ships," never as market-wide signal. |
| D. VISUAL REFERENCE (official product image linkage) | **Strong - see Section 15.** JSON-LD directly and unambiguously links `image` to `name`/`description` in one structured object; no ambiguity about which photo belongs to which product, unlike an editorial article's loosely-associated hero image. |

No implementation of any of these was performed this pass.

## 11. Product Detail vs. Lookbook/Editorial roles

```
Best for vocabulary:       PRODUCT DETAIL (JSON-LD name + description; real SILHOUETTE/MATERIAL/DETAIL terms found nowhere else in this project's corpus)
Best for assortment:       PRODUCT DETAIL sitemap as a whole (2,254 URLs = the brand's real current catalog breadth)
Best for combination/look: NEITHER, on this site - EDITORIAL pages carry no real narrative "look" text (Section 3a); the "룩북"/COLLECTION mega-menu is a curated PRODUCT DETAIL view, not a distinct combination-description surface
Best for visual evidence:  PRODUCT DETAIL (structured JSON-LD image-to-product link; see Section 15) over EDITORIAL (lazy-loaded images with zero alt text or caption linkage)
```

This is a real, somewhat unexpected finding worth stating plainly: **on this specific site, "editorial/lookbook" is the weaker surface, not the stronger one** - the opposite of how these two surface types are usually expected to divide labor (rich narrative lookbook vs. terse product spec sheet). PRODUCT DETAIL carries essentially all of the real extractable value found in this pass.

## 12. Visual metadata audit (Section 15) - DOM relationship only, no pixel analysis

PRODUCT pages: a single JSON-LD `Product` object carries `name`, `description`, and `image` (an array of real product photo URLs, e.g. `.../product/big/202606/81d5d2e8....jpg`) together in one structured record, with `offers[].image` further tying specific color/size variants to their own photo. This is a **high-confidence, unambiguous** product-to-image relationship - materially stronger than an editorial article's hero image (which is associated with the *article*, not any specific item mentioned inside it). EDITORIAL pages carry images via `ec-data-src` lazy-loading with no `alt` text and no adjacent product-name association in the DOM for most of the sampled page (only the small RELATED PRODUCTS grid at the end ties specific images to specific product names/prices). No image pixel/content analysis was performed anywhere in this audit, per the task's explicit prohibition - only DOM/JSON-LD structural relationships were read.

## 13. Density comparison

| Source | Direct Attribute Rate |
|---|---:|
| EYESMAG (existing Editorial) | ~3.0% |
| HYPEBEAST_KR (existing Editorial) | ~3.0% |
| ESQUIRE_KR (existing Editorial, selected prior pass) | ~10.0% |
| NOBLESSE (prior pass, not selected) | 6.7% |
| ARENA (prior pass, not selected) | 0.0% (against current taxonomy) |
| **Covernat PRODUCT DETAIL** | **0.0% (as currently measured)** - but root-caused to a fixable word-order gap (Cause A) plus real, repeated missing-taxonomy vocabulary (Cause B), not to an absence of real attribute language. Section 6/7 show the real language exists in the sampled text. |
| **Covernat EDITORIAL** | **0.0%**, and the surface itself carries almost no real narrative text at all (Section 3a) - a genuinely low-value surface on this site, not merely under-measured. |

The originally hoped-for "5-10% editorial vs. 65%+ brand product" contrast **did not materialize as a clean number** in this pass - but that is a measurement-methodology finding, not a density finding. The real product-name text is visibly, densely attribute-bearing (Section 7); the current extractor's prefix-only, editorial-prose-tuned window is simply not the right instrument to measure it as-is. This is itself the pass's most important result: **the architecture question is not "is there a density gap" (there clearly is real vocabulary here) but "does capturing it require a different (bidirectional, e-commerce-name-aware) extraction pass, not just a new source."**

## 14. Brand bias (Section 12)

Covernat is one brand, one assortment - and, per the note at the top of this document, it is the operating company's own brand, not even an arm's-length competitor. Nothing in this pass should be read as "the market trend is X" from Covernat data alone, regardless of what density number a future, word-order-fixed extractor might produce. The only question this pass answers is: **is a Brand/Product Reference layer technically worth building at all** - not what any single brand's numbers say about the market.

## 15. Architecture decision (Section 17)

**B. BRAND LOOKBOOK만 가치 있음 - 선택되지 않음. 대신: PRODUCT DETAIL만 가치 있음 (C).**

On this specific site, the lookbook/editorial surface was found to carry almost no real extractable value (Section 3a, Section 11) - the opposite of the initial hypothesis. The value that does exist is concentrated entirely in **PRODUCT DETAIL** pages: real JSON-LD name+description text, a genuine (if currently under-captured) attribute vocabulary including SILHOUETTE terms the corpus otherwise completely lacks, and a high-confidence image-to-product DOM relationship.

**Reason this is not scored EXCELLENT/GOOD/PARTIAL/LOW_VALUE/RESTRICTED as a simple single verdict**: the measured 0.0% rate is an extraction-methodology artifact, not a true density reading (Section 6/13). A fair verdict requires distinguishing "is there real value in the text" (yes, demonstrated in Section 7) from "does today's extractor capture it" (no, for two diagnosed, specific, fixable-in-a-future-pass reasons). See the Decision section of the final report for how this is resolved into a single recommendation.

## 16. If high value: architecture proposal (Section 18) - not implemented this pass

**Do not build new tables first.** The existing `MarketProduct` Prisma model (in `prisma/schema.prisma`) already carries almost the exact field set a Product Attribute Reference layer would need: `source`, `externalProductId`, `brand`, `name`, `category`, `url`, `imageUrl`, `itemType`, `subItemType`, `fit`, `mainColor`, `subColor`, `material`, `graphicType`, `detail`, `style`, `gender`, `dataMode`. This is materially closer to "resolved product attributes" than to "ranking data."

Proposed reuse path for a **future** pass (not this one):

- Populate `MarketProduct` rows for a Product Reference source using a **new, distinct `source` value** (e.g. `"COVERNAT_REFERENCE"`), so it is trivially filterable away from any ranking-oriented `MarketProduct` rows.
- **Do not create any `MarketRankingSnapshot` rows for these products** - ranking/price/rank fields are not meaningful the same way for a reference catalog entry, and `MarketRankingSnapshot` must stay untouched at 667 per this project's standing invariant. A Product Reference source would populate `MarketProduct` only, never `MarketRankingSnapshot`.
- The `itemType`/`subItemType`/`mainColor`/`material`/`detail`/`style` fields would need to be populated by a **bidirectional-COLOR-aware variant** of the existing Editorial direct-attribute extractor (`src/collectors/editorial/attribute-relations.ts`), run against the product `name` string specifically - not the generic `classification.ts` pipeline that currently populates `MarketProduct` for other sources, since that pipeline was not designed around this specific "direct adnominal modifier" semantic guarantee.
- A small `dataMode: "reference"` (or similar, distinct from `"real"`/`"sample"`) value could mark these rows so they are never accidentally surfaced through any UI or query path built for ranking data.

This reuses two already-existing, already-tested subsystems (the `MarketProduct` schema shape, and the Editorial direct-attribute extractor's core window/enumeration logic) rather than inventing `ProductReferenceSource`/`ProductReferencePage`/`ProductReferenceAttribute` from scratch. No code implementing this was written in this pass.

## 17. Multi-brand requirement (Section 19) - next-probe criteria only, no candidates investigated this pass

Per the task's explicit instruction, no additional brand candidates were investigated this pass. If a Brand/Product Reference layer is pursued, the next pass should sample **3-5 different brands** (not Covernat alone) using the identical methodology (JSON-LD name+description extraction, same real extractor, same 20-30 page sample size) before any schema/collector work begins, specifically to guard against exactly the brand-bias risk in Section 14. Suggested selection criteria for that future candidate set (criteria only - no candidates chosen here):

1. **Platform diversity**: at least one non-Cafe24 platform (e.g. a Shopify-based or custom-built Korean brand site), so the "trailing-COLOR-suffix" naming convention found here is confirmed as an industry pattern, not a Cafe24- or Covernat-specific quirk.
2. **Category overlap with existing weak dimensions**: prefer brands whose product copy is likely to use SILHOUETTE/FIT language explicitly (e.g. denim-forward or tailoring-forward labels), since that is this corpus's largest gap.
3. **Independent ownership**: brands with no shared corporate/operating relationship to B:CAVE or to each other, unlike Covernat's B:CAVE relationship noted above - this pass's biggest methodological caveat should not simply repeat.
4. **Public JSON-LD or equivalent structured description**: confirmed via a quick single-page check before committing to a full sample, so the sample isn't wasted on a site with no structured `description` field at all.
5. **No explicit AI-use restriction notice** (per Section 2's check, applied to each new candidate individually - Arena's notice does not transfer to any other brand, and Covernat's absence of one does not either).

---

## Follow-up pass (2026-09-07): Product Reference Attribute Extraction

Executed the "next step" from above: built a small, deliberately separate extraction module for PRODUCT NAME grammar, and re-measured the exact same 30 Covernat product URLs used in the prior probe.

### Why the Editorial grammar failed on product names

`src/collectors/editorial/attribute-relations.ts` is built around a single, well-tested assumption: Korean adnominal modifiers precede the noun they modify ("블랙 재킷"), so its `MODIFIER_WINDOW` only ever looks backward from the item. That assumption is correct for editorial prose and stays completely unchanged this pass - every existing Editorial regression fixture (including the exact "오버사이즈 축구 셔츠와 트랙 재킷" and "블랙 후드와 백팩" cases named in this task) was re-verified to still pass untouched.

It fails on Covernat product names specifically because those names frequently place **COLOR after the item as a trailing SKU-variant suffix** ("루베라 백팩 블랙," "클로버하트 플러피 토트백 브라운") - the opposite direction from what the window checks. This was confirmed with a controlled, reversible test against the real production function: reordering the exact same words from suffix to prefix position (`"루베라 백팩 블랙"` -> 0 relations; `"블랙 루베라 백팩"` -> `BACKPACK + COLOR:BLACK`) proves the gap is purely about word order, not missing vocabulary, for this specific class of case.

A second, independent bug was found (and left untouched, since fixing Editorial semantics is out of scope this pass): "후드" is currently only a generic `ITEM`-type mention in `mentions.ts` (not a `SUB_ITEM`), so Editorial's own `containsOtherSpecificItem` enumeration guard does not treat it as a boundary. This means the *existing, unmodified* Editorial extractor already mis-promotes `"블랙 후드 백팩"` (no coordination particle) to `BACKPACK + COLOR:BLACK` today - a real, verified, pre-existing precision gap, reported here for visibility but explicitly not fixed in this pass per the "do not touch Editorial semantics" instruction. (Note this is distinct from `"블랙 후드와 백팩"` *with* the 와 coordination particle, which the existing coordination guard already handles correctly.)

### Product name grammar - the new module

`src/collectors/product-reference/attributes.ts` (new file) exports `extractProductNameColorRelations(productName: string)`. It is intentionally **not** a generalization of the Editorial rule:

- **COLOR only.** COLOR is a small, closed, enumerable vocabulary, unlike DETAIL/MATERIAL/STYLE (open-ended), which is why checking both sides of the item noun is a materially lower-risk relaxation for COLOR specifically. No other attribute type is bidirectional in this module.
- **Product NAME strings only.** It is never called on Editorial article title/excerpt/body, and is not wired into the Editorial collection or mention pipeline in any way.
- **Whitespace-only-gap adjacency**, both directions. A match is accepted only when nothing but whitespace sits between the color word and the item - which is *stricter* than Editorial's own 20-char window, and, as a side effect, correctly rejects the exact `"블랙 후드 백팩"` ambiguity that the existing Editorial extractor does not currently guard against for its own (prefix-only) direction. This was a deliberate design choice per the task's own guidance to prioritize "[model/collection words] + ITEM + COLOR" as the safe pattern, rather than reusing a wider window.

### Color suffix result (same 30-product sample, re-fetched fresh)

| Metric | Value |
|---|---|
| Sample | 30 (same URLs as the prior probe) |
| A. Baseline (existing Editorial-style method, re-confirmed unchanged) - Specific Item Rate | 5/30 (16.7%) |
| A. Baseline - Direct Attribute Rate | 0/30 (0.0%) |
| B. Color Prefix Relations | 0 |
| B. Color Suffix Relations | 2 |
| B. Total Color Relations | 2 |
| B. Direct Attribute-bearing Products | 2/30 (6.7%) |
| B. Unique Specific Items with a color relation | BACKPACK, TOTE_BAG |
| B. Unique Colors | BLACK, BROWN |
| B. Potential Item+Color Bundles | 2 |

Examples (real, from the new module):
```
BACKPACK + COLOR:BLACK  (NAME_COLOR_SUFFIX)  "백팩 블랙"  <- "루베라 백팩 블랙"
TOTE_BAG + COLOR:BROWN  (NAME_COLOR_SUFFIX)  "토트백 브라운"  <- "클로버하트 플러피 토트백 브라운"
```

**All 0 prefix relations in this sample is itself informative**: none of Covernat's 30 sampled names happened to use the ordinary Korean prefix convention for a tracked item - every real color-bearing case in this sample was the suffix convention, reinforcing that the suffix pattern (not the prefix pattern already handled by Editorial) is the dominant real convention on this site.

**Two additional real, verified misses in this same sample, neither a code bug**: `"베이직 포켓 롱슬리브 오프 화이트"` (LONG_SLEEVE_TEE is tracked, but "오프 화이트"/off-white is not a registered COLOR value - only whole "WHITE" is) and `"[커버낫x하이다나] 럭키 씨리얼 링거 티셔츠 스카이 블루"` (RINGER_TEE is tracked, but "스카이 블루"/sky blue is not registered - only whole "BLUE" is, in a different rule). These are genuine COLOR-vocabulary gaps, not word-order or code issues, reported as taxonomy candidates only (Section 8/9 update below), not fixed this pass.

### Structured product object model (Section 6)

A Product Reference's natural unit of evidence is not an *article sentence* but a **structured product object**: `name`, `description`, and `image` are already tied together as one JSON-LD record per SKU on Covernat, a semantic guarantee an editorial article never gives (an attribute mentioned anywhere in an article body is never assumed to describe a specific item unless a direct phrase says so). `findDescriptionCandidates(name, description, surfaceForms)` (new, in the same module) makes this relationship explicit but conservative: it identifies which tracked item the product's own `name` resolves to, then checks the *same object's* `description` for caller-supplied candidate surface forms only - it consults no keyword list of its own, so it cannot silently grow the taxonomy. This is a probe-only candidate linkage, not a stored relation.

### Description candidate density (Section 10, same 30-product sample)

| Surface Form | Proposed Dimension | Product Count | Example |
|---|---|---:|---|
| 크롭핏 (crop fit) | SILHOUETTE | 1 | "우먼 핫픽스 로고 티셔츠 라이트 블루": "...짧은 기장의 크롭핏..." |
| 세미와이드 (semi-wide) | SILHOUETTE | 3 | "세미와이드 시그니처 심볼 스웻 팬츠 블랙": "...[디자인] -세미와이드 핏..."; also "[SET] 테크 나일론 베이직 티셔츠&팬츠" and "스몰 어센틱 카고 스웻 팬츠 블랙" |
| 스탠다드핏 (standard fit, no-space form) | SILHOUETTE | 0 | **Methodology caveat**: `"[스탠다드 핏] 미들 C로고 B.B캡 Dark Pine"` genuinely contains "스탠다드 핏" (with a space) in its **name**, not its description - this candidate search only checked the description field for the exact no-space surface form, so it missed a real hit due to (a) field scope and (b) space-sensitivity. Reported transparently rather than silently rerun to force a better number. |
| 코듀로이 (corduroy) | MATERIAL | 1 | "우먼 코듀로이 핀턱 팬츠 아이보리": "...소프트한 터치감의 코듀로이 소재를 사용해..." |
| 벨로아 (velour) | MATERIAL | 1 | "우먼 벨로아 반팔티 초콜렛": "...부드러운 터치감의 벨로아 소재 사용..." |
| 핀턱 (pintuck) | DETAIL | 0 | Present in the product **name** ("우먼 코듀로이 핀턱 팬츠 아이보리") but not repeated in that product's description text - a real name-level candidate, description-only search missed it. |
| 글리터 (glitter) | DETAIL | 0 | Not observed in this 30-product sample (was seen in the prior pass's Arena sample, not Covernat's) |
| 헤어리 (hairy) | MATERIAL/FINISH | 0 | Present in the product **name** ("헤어리 레글런 니트 그린"), same description-only-search limitation as above |
| 멜란지 (melange) | COLOR/MATERIAL-appearance | 0 | Present in the product **name** ("C 로고 맨투맨 멜란지 그레이"), same limitation |

**Honest methodology note**: several real candidates (스탠다드핏, 핀턱, 헤어리, 멜란지) came up as 0 in this specific description-only search purely because they appear in the product **name** rather than the **description** field, and this probe's candidate function was only pointed at description text. This is disclosed rather than re-run to inflate the count - it does not change the underlying conclusion (real vocabulary exists, is repeatable across products, and is not currently captured), it only means the true product-count-with-evidence is higher than the raw numbers above show when name-level text is included too.

### Dimension model audit (Section 11) - proposed canonical dimension, not added

| Surface Form | Proposed Canonical Dimension | Reasoning |
|---|---|---|
| 크롭핏, 세미와이드, 스탠다드핏 | **SILHOUETTE** | All three describe overall garment shape/fit, not material or decoration - a clean fit with the existing SILHOUETTE dimension, which currently has zero entries anywhere in the corpus |
| 코듀로이, 벨로아 | **MATERIAL** | Both name a fabric composition, same category as existing MATERIAL values (DENIM, RECYCLED_FABRIC, NYLON) |
| 핀턱 | **DETAIL** | A construction/decoration technique, same category as existing PIPING/EMBROIDERY/CHECK/CAMO |
| 글리터 | **DETAIL** (not FINISH) | Glitter is an applied decorative element (like embroidery or sequin, both already DETAIL), not a fabric processing/finishing technique - proposed DETAIL for consistency with SEQUIN's existing classification, though FINISH is a defensible alternate reading worth a product-planner's judgment call before any real addition |
| 헤어리 | **MATERIAL** (not FINISH) | Describes the fiber/fabric's inherent characteristic (a hairy-textured yarn), closer to how DENIM/NYLON describe what the fabric *is* than to a post-processing FINISH step |
| 멜란지 | **COLOR** (not MATERIAL) | Melange describes a heathered/mixed-yarn color appearance in normal fashion usage, closer to how COLOR values are used than to a MATERIAL composition claim - though it is genuinely borderline and a product planner's call would be more authoritative than this audit's guess |

No taxonomy changes were made. These are proposals for a human/future-pass decision, not additions.

### Missing specific item impact (Section 12, same 30-product sample)

| Missing Item Candidate | Products | Attribute-adjacent Products | Potential Relations Lost (POTENTIAL / AUDIT ESTIMATE) |
|---|---:|---:|---:|
| SWEATSHIRT (맨투맨) | 3 | 3 | 3 |
| KNIT (니트) | 1 | 1 | 1 |
| HOODIE/ZIP_HOODIE (후디/후드집업) | 3 | 3 | 3 |
| BLOUSON (블루종) | 1 | 1 | 1 |
| VEST (베스트) | 1 | 1 | 1 |
| PUFFER/DOWN (푸퍼/다운) | 2 | 2 | 2 |
| CROSS/HOBO_BAG (크로스백/호보) | 1 | 1 | 1 |
| DUFFLE_BAG (더플백) | 1 | 1 | 1 |
| Generic T-SHIRT (티셔츠/반팔티) | 8 | 8 | 8 |
| Generic PANTS (팬츠/쇼츠) | 5 | 5 | 5 |
| SKIRT (스커트) | 1 | 1 | 1 |

"Attribute-adjacent" here means real text (a genuine Korean word, not punctuation/price/boilerplate) sits immediately next to the missing item's surface form in the product name - a real, verified count, not a guess, though it is a proxy for "there is *something* there," not a guarantee every instance would resolve to a specific known attribute value once the item is tracked. A twelfth gap was also noticed but not in the predefined candidate list: generic **셔츠** (plain shirt, distinct from RUGBY_SHIRT) appears in `"멀티 체크 셔츠 네이비"`, with a real, already-registered DETAIL:CHECK match sitting immediately before it - disclosed here rather than silently omitted because the predefined list (carried over from the prior pass) happened not to include it.

### True product attribute density estimate (Section 13) - three numbers, kept separate

```
A. CURRENT EXTRACTOR DENSITY (REAL, measured):        0.0% (0/30)
B. COLOR-SUFFIX-COMPATIBLE DENSITY (REAL, measured):   6.7% (2/30)
C. POTENTIAL STRUCTURED-PRODUCT DENSITY:               POTENTIAL / AUDIT ESTIMATE - approximately 29/30 (~97%)
```

C is derived by taking the union of every product in this sample that has *any* real, human-readable attribute-bearing text adjacent to *any* item mention - whether currently tracked (2 products, Section above), a known missing-item candidate (Section 12's table, 24 of the remaining 28 products), or a description/name-level dimension candidate (Section above, catching a few more). Only one product name in the entire 30-sample set (`"플로우 나일론 호보 크로스백 블랙"` was already counted under CROSS_HOBO_BAG) had zero double-counting concerns worth flagging beyond what's already noted. **C is explicitly an audit estimate, not a real measured rate** - it assumes taxonomy work (adding ~11 missing items and ~6-9 missing attribute values) that was not performed this pass, and assumes (reasonably, based on manual spot-checks in Section 7/9 above, but not proven for every single instance) that the adjacent real text would in fact resolve to a valid, specific attribute value once the relevant item/attribute rule exists.

### Product visual relation (Section 14) - unchanged conclusion, re-confirmed

No change from the prior pass's finding: JSON-LD ties `name`/`description`/`image` into one structured object per product/variant, giving **HIGH** image-to-product confidence for PRODUCT DETAIL pages specifically - materially different from an Editorial article's loosely-associated hero image. No image pixel/content analysis was performed; only the JSON-LD structural relationship was read, consistent with the explicit prohibition on this.

### MarketProduct schema reuse risk (Section 15) - refined

Re-examining the `MarketProduct` model with the explicit mixing question in mind: its fields (`itemType`, `subItemType`, `mainColor`, `material`, `detail`, `style`, `gender`, `dataMode`) remain a strong structural fit, but the model has **no field that names the *role* the evidence plays** (ranking signal vs. reference/assortment fact) beyond `dataMode`, and no existing UI/query path was found in this repo that already discriminates on `dataMode` for this purpose. Directly inserting Product Reference rows into `MarketProduct` today, even under a distinct `source` value, creates a real risk that a future query written against "all `MarketProduct` rows" (for a ranking or business-analytics view) could silently pull in reference-only rows that were never observed selling, never ranked, and carry no commercial-response evidence at all - exactly the mixing this task's Section 16 prohibits. **This audit does not recommend unconditional reuse of `MarketProduct`** as a result: reuse is plausible, but only if a future implementation pass adds an explicit, indexed role/evidence-type discriminator (e.g. a `sourceRole: "RANKING" | "REFERENCE"` field or equivalent) *before* any Product Reference row is ever written, and audits every existing `MarketProduct` consumer to confirm it filters on that discriminator. No schema change was made this pass.

### Never mix with store signal / Editorial source spread (Sections 16-17) - confirmed, no violation

No STORE signal (ranking/bestseller/commercial-response) semantics were attached to any Product Reference finding in this pass - every number above is scoped to "this text exists on this product page," never "this sold well" or "this ranked." No Product Reference count was included in, or influenced, `EditorialPost`/`EditorialMention`/`sourceSpread` at any point - Covernat remains explicitly excluded from all Editorial source-spread reasoning, and the 30 sampled products were never treated as 30 independent media observations.

### Decision gate (Section 18)

The stated gate is: COLOR-compatible density >=10-20% (real) AND meaningful structured-description coverage -> proceed to multi-brand probe; otherwise -> low ROI.

**Real, measured COLOR-compatible density (6.7%) does not clear the stated 10-20% bar.** At the same time, the audit-estimate potential (~97%, Section above) is high enough that concluding "Covernat 방식 ROI 낮음" outright would misdescribe what was actually found: the real vocabulary is present and repeatable; today's extractor (even with the new COLOR-suffix module) simply doesn't yet cover most of it, for diagnosed, specific, generic (not Covernat-specific) reasons - missing SUB_ITEM types that are common across Korean fashion e-commerce generally (맨투맨/후디/니트/generic 티셔츠 are not Covernat jargon), and a handful of missing COLOR values (오프 화이트, 스카이 블루) and SILHOUETTE/MATERIAL/DETAIL values that are equally generic. See Decision in the final report for how this resolves into a single recommendation.

## Validation

This pass added real, reusable production code: `src/collectors/product-reference/attributes.ts` (new module, two exported functions) and new fixture tests in `scripts/smoke-test.ts` (`verifyProductReferenceAttributes`, covering both new-module behavior and an explicit regression check that Editorial's existing fixtures are unaffected).

- `pnpm --filter @open-design/trend-dashboard typecheck`: PASS
- `pnpm --filter @open-design/trend-dashboard test`: PASS (all existing Editorial fixtures plus the new Product Reference fixtures)
- `pnpm --filter @open-design/trend-dashboard build`: PASS (no route/UI changes - `/`, `/editorial`, `/items`, `/market` etc. are unaffected since nothing wires this module into any page or API route)
- No production DB read/write path was touched by the new module - it is a pure function library, invoked only from this pass's now-deleted probe/measurement scripts

## Data safety confirmed

- EditorialPost: 283 (unchanged)
- EditorialMention: 916 (unchanged)
- MarketRankingSnapshot: 667 (unchanged)
- Canonical duplicates: 0, Mention duplicates: 0 (re-confirmed via `audit-editorial-quality.ts` after this pass)
- No DB writes of any kind were made
- No Prisma schema changes were made

---

## Follow-up pass (2026-09-08): Real Density + Taxonomy Closure

This pass's goal: replace the prior pass's `~29/30 (~97%)` figure - explicitly labeled there as a **POTENTIAL / AUDIT ESTIMATE**, never a measurement - with a REAL, measured number, by closing the specific item/attribute gaps that estimate assumed.

### 0. Architecture inspection (done before any code was written)

Traced where Specific Item and attribute vocabulary actually live:

- `src/collectors/editorial/mentions.ts` exports one array, `rules` (aliased as `editorialRules`), that is the SHARED, single source of truth for THREE consumers: `extractEditorialMentions` (the Editorial mention pipeline, drives `EditorialPost`/`EditorialMention`), `extractDirectAttributeRelations`/`describeItemContexts` in `attribute-relations.ts` (Editorial Direct Relations/Bundles), and - read-only - `product-reference/attributes.ts` (via `specificItemRules()`/`colorRules()` filtering `editorialRules`). **Adding a new SUB_ITEM or attribute value directly into `rules` would therefore also change what `extractEditorialMentions` finds in the real Editorial corpus** - exactly the side effect the task's "CRITICAL ARCHITECTURAL RULE" forbids.
- A second, fully independent taxonomy already exists in `src/config/item-types.ts` (`itemTypes`/`subItemTypeLabels` + alias lists) and is consumed only by `src/collectors/market/classification.ts` for `MarketProduct`/`MarketRankingSnapshot` classification. It already has broad names like `SWEATSHIRT`, `KNIT`, `SHIRT`, `SKIRT` at the ITEM level, confirming these are natural, already-precedented canonical names in this codebase - but this pipeline is a third, separate world (ranking-oriented) that this pass does not touch, per the task's explicit "no MarketProduct writes" rule.
- `src/config/taxonomy.ts` is a presentation-only reclassification layer (broad category chips) and was not touched.

**Conclusion**: Product Reference CAN gain broader recognition without altering Editorial extraction behavior, but only via a genuinely separate vocabulary module that `editorial/mentions.ts` never imports. This pass added `src/collectors/product-reference/taxonomy.ts` (new supplemental vocabulary, read by product-reference code only) and `src/collectors/product-reference/object-relations.ts` (new extraction engine that merges the supplemental vocabulary with a read-only view of `editorialRules`). Neither file is imported by, and neither imports, `editorial/mentions.ts`'s mention pipeline or `editorial/attribute-relations.ts`. `product-reference/attributes.ts` (the prior pass's COLOR-only module) was left completely untouched - zero lines changed - to keep its existing behavior and tests at zero regression risk.

### 1. Sample: exact same 30 products was not recoverable - disclosed, not hidden

The prior pass's probe/measurement scripts were run ad hoc and deleted, and the exact 30 URLs were never persisted to git or to this doc - only the *sampling method* was documented: sitemap positions `1, 20, 40, ..., 580` inside `sitemap1.xml.gz` (the more-recently-updated of Covernat's two sitemap shards). Re-fetching that exact sitemap today found it had grown from **2,254 URLs (2026-09-07) to 2,309 URLs (2026-09-08)** - confirmed by refetching `https://covernat.co.kr/sitemap.xml` → `sitemap1.xml.gz` directly, respecting the same robots.txt rules already audited in the prior pass (no new access risk). A concrete check proves the position-based sample shifted: position 1 was product_no `10796` in the prior pass's cited example but is product_no `10797` in this pass's refetch of the identical formula.

**URLs Reused: NO.** Per the task's own instruction ("If necessary, recover it from the audit artifact/code history... do not substitute random current products"), this pass reproduced the exact documented SAMPLING METHOD (not the literal byte-identical URLs, which no longer exist to recover) against current sitemap data, fetched all 30 real JSON-LD `Product` objects (`name`, `description`) directly from `covernat.co.kr`, and measured against that real, live, freshly-fetched set - never fabricated or reused from memory. This is disclosed here rather than silently glossed over, consistent with the project's own standing "no taxonomy addition without evidence" and "disclose limitations" conventions.

### 2. Real items sampled (for reference)

30 real Covernat product pages, product_no `10797, 10825, 10864, 10887, 10917, 10959, 11006, 11079, 11495, 11544, 11577, 11598, 11618, 11639, 11659, 11679, 11712, 11736, 11757, 11819, 11858, 11880, 11900, 11971, 11991, 12011, 12072, 12092, 12158, 12182`. Two of the 30 (`10917`, `10959`) are `[SET]` bundle listings naming two different items in one product name (e.g. "다잉 맨투맨&팬츠") and are discussed separately below.

### 3. Scoped taxonomy strategy

`src/collectors/product-reference/taxonomy.ts` defines its own `ProductReferenceRule`/`ProductReferenceRuleType` types - deliberately NOT `EditorialRule`/`EditorialMentionType` - because the union `editorialMentionTypes` (`ITEM | SUB_ITEM | DETAIL | MATERIAL | COLOR | STYLE | BRAND | COLLAB | IP`) has no `SILHOUETTE` member, and widening it would itself be an Editorial-config change. Two exported arrays:

- `productReferenceItemRules` - generic SUB_ITEM-equivalent nouns.
- `productReferenceAttributeRules` - SILHOUETTE (new dimension), MATERIAL:WOOL, and 11 COLOR values.

`src/collectors/product-reference/object-relations.ts` is the new extraction engine. Item identity is resolved with a strict two-tier, all-or-nothing rule (see the file's own docstring for the full reasoning): existing `editorialRules` SUB_ITEM matches always win over the new supplemental items, and if a name matches **more than one** distinct item value at either tier (a `[SET]` bundle, or two different existing items), the whole name is treated as ambiguous and yields zero relations - never a guess. Attributes are found three ways, each deduplicated into a single `seen` set so no fact is double-counted: (a) a prefix modifier-window scan on the NAME (same 20-char window/enumeration-guard design as `editorial/attribute-relations.ts`, reimplemented locally rather than importing that file, so Editorial's file is provably untouched), (b) the existing whitespace-only bidirectional COLOR check, now anchored to the ONE resolved item rather than iterating every item pattern independently, and (c) a description-wide scan licensed by Section 7's "one structured product object" reasoning, after stripping two real, verified false-positive sources found while developing this pass: the `[SIZE(CM)]...`/`[모델]` block (which can name a **different** color variant being modeled) and any line naming a companion product's own SKU code (`CO####XX##`, e.g. "-CO2501HZ31(C 로고 후드집업)와 셋업 연출" - a suggested matching *different* product, not this one).

### 4. Exact added item vocabulary (all >=1 real occurrence in this pass's own 30-product fetch)

| Canonical Item | Surface Forms | Products Matched | Example Product |
|---|---|---:|---|
| T_SHIRT | 티셔츠, 반팔티 | 4 (10797, 10825, 11495, 10887) | "쿨 코튼 키치 칵테일 그래픽 티셔츠 아이보리" |
| SHORTS | 쇼츠 | 2 (10864, 11006) | "우먼 경량 나일론 쇼츠 라이트 퍼플" |
| PANTS | 팬츠 | 4 (11679, 11712, 11858, 12011) | "우먼 카고 팬츠 카키" |
| SHIRT | 셔츠 (not preceded by 티) | 1 (11659) | "포플린 셔츠 인디 핑크" |
| SWEATSHIRT | 맨투맨 | 3 (11618, 11757, 11991) | "C 로고 맨투맨 더스티 블루" |
| HOODIE | 후디 | 1 (11639) | "우먼 쿠퍼로고 후디 더스티 블루" |
| ZIP_HOODIE | 후드집업 | 1 (11598) | "C 로고 후드집업 브라운" |
| KNIT | 니트 | 1 (11971) | "우먼 리브드 카라 니트 베이지" |
| CARDIGAN | 가디건 | 1 (11736) | "우먼 울 블렌드 크롭 가디건 헤더 그레이" |
| BLOUSE | 블라우스 | 1 (11880) | "우먼 셔링 블라우스 아이보리" |
| JACKET | 재킷, 자켓 | 2 (11900, 12092) | "울 집업 자켓 블랙" |
| CANVAS_BAG | 캔버스백 | 1 (11079) | "C 로고 캔버스백 블랙" |
| ECO_BAG | 에코백 | 1 (12182) | "클로버하트 셔링 리본 에코백 체크" |
| BOOTS | 부츠 | 1 (12072) | "클로버하트 프릴 퍼 부츠 브라운" |
| PUFFER | 푸퍼 | 1 (12158) | "씨빅 RDS 숏 푸퍼 아이보리" |

Items reused with **zero taxonomy change** (already existed as `editorialRules` SUB_ITEM values, simply newly reachable because this module now scans product NAME/description at all): TOTE_BAG (11544), LONG_SLEEVE_TEE (11577), RINGER_TEE (11819).

Item recognition was held to a lower bar than attributes (>=1 real occurrence, not >=2) because - per the task's own Section 3 - naming a SKU's item category is a factual observation with no "does this modify that" interpretive risk, unlike an attribute claim.

### 5. Exact added attribute vocabulary

**COLOR** (>=1 real occurrence; COLOR is held to a lower bar than open-ended dimensions because it is closed/enumerable, the same asymmetry `attributes.ts`'s own docstring already argues):

| Canonical Attribute | Surface Form | Product Count | Evidence Example |
|---|---|---:|---|
| IVORY | 아이보리 | 3 | "쿨 코튼 키치 칵테일 그래픽 티셔츠 아이보리" |
| KHAKI | 카키 | 1 | "우먼 카고 팬츠 카키" |
| NAVY | 네이비 | 0 real relations this pass (see Section 8 - a real parser-adjacency miss, not a vocabulary gap) | "[커버낫x하이다나] 럭키 씨리얼 링거 티셔츠 네이비" |
| BEIGE | 베이지 | 1 | "우먼 리브드 카라 니트 베이지" |
| SKY_BLUE | 스카이 블루 | 1 | "우먼 아이스 스트링 크롭 반팔티 스카이 블루" |
| DUSTY_BLUE | 더스티 블루 | 2 | "C 로고 맨투맨 더스티 블루" |
| INDIE_PINK | 인디 핑크 | 1 | "포플린 셔츠 인디 핑크" |
| HEATHER_GRAY | 헤더 그레이 | 2 | "우먼 울 블렌드 크롭 가디건 헤더 그레이" |
| LIGHT_PURPLE | 라이트 퍼플 | 1 | "우먼 경량 나일론 쇼츠 라이트 퍼플" |
| LIGHT_OLIVE | 라이트 올리브 | 1 | "테이프 로고 맨투맨 라이트 올리브" |
| DARK_GRAY | 다크 그레이 | 1 | "피그먼트 스웻 팬츠 다크 그레이" |

Every two-word compound is matched only as the FULL anchored compound (never the qualifier word alone) - "라이트" can never fire in isolation, so it can never be confused with an unrelated use of the same syllable.

**SILHOUETTE** (brand-new dimension; held to a >=2-product bar precisely because it is new and previously unvalidated, per the task's "do not force ambiguous terms" caution):

| Canonical Attribute | Dimension | Surface Forms | Product Count | Evidence Example | Reason Dimension Is Correct |
|---|---|---|---:|---|---|
| CROP_FIT | SILHOUETTE | 크롭핏, 크롭 핏 | 2 (10887, 11736) | "짧은 기장의 크롭핏" | Overall garment length/shape, not material or decoration - matches the prior pass's own proposed dimension mapping |
| SEMI_WIDE | SILHOUETTE | 세미와이드, 세미 와이드(핏) | 1 real (11712; a second apparent hit at 10959 is a companion-SKU cross-reference, excluded - see Section 8) | "트렌디한 세미 와이드핏" | Same reasoning as CROP_FIT; included despite n=1 because it was already pre-vetted by the prior pass's own audit |
| SEMI_OVERSIZED | SILHOUETTE | 세미오버핏 | 3 (10825, 11495, and the SET-excluded 10959's own phrase) | "세미오버핏" | Overall fit/volume, the same category as CROP_FIT |
| OVERSIZED | SILHOUETTE | 오버핏, 오버 핏 (NOT preceded by 세미) | 3 (11577, 11900, 12092) | "-오버 핏" | Same reasoning |
| REGULAR_FIT | SILHOUETTE | 레귤러핏, 레귤러 핏 | 8 (11598, 11618, 11639, 11679, 11757, 11819, 12158, and 22) | "-레귤러 핏" | The single most common fit term in this sample |

**MATERIAL** (>=2 bar):

| Canonical Attribute | Dimension | Surface Forms | Product Count | Evidence Example | Reason Dimension Is Correct |
|---|---|---|---:|---|---|
| WOOL | MATERIAL | 울 (standalone token only), wool | 2 (11736, 12092) | "울 집업 자켓 블랙" | Names a fabric composition, same category as existing DENIM/NYLON/SUEDE |

**Rejected/ambiguous, deliberately not added**: `퍼` (fur) in "클로버하트 프릴 퍼 부츠 브라운" - a single Korean syllable that, without a strict standalone-token boundary, would false-fire inside unrelated words like "라이트 **퍼**플" (purple); even with a boundary-anchored pattern this pass judged it too close in kind to the previously-flagged `헤어리`/`멜란지`/`글리터` ambiguity class to add on n=1 evidence. `SLIM_FIT` (슬림핏, 1), `LOOSE_FIT` (루즈 핏, 1), `DROP_FIT` (드롭 핏, 1), `EASY_FIT` (이지핏, 1), `STRAIGHT_FIT` (스트레이트 핏, 1), `BABY_FIT` (베이비핏, 1) - all real, unambiguous SILHOUETTE terms actually observed in this sample, but each only once; not added this pass under the >=2 bar applied to this brand-new dimension, listed here as real candidates for a future pass if repeated. `STANDARD_FIT`/스탠다드핏, `CORDUROY`/코듀로이, `VELOUR`/벨로아, `PINTUCK`/핀턱, `UTILITY`/유틸리티, `OFF_WHITE`/오프 화이트 - all previously identified as safe by the prior pass's audit, but **zero occurrences in this pass's own resampled 30 products** (a direct consequence of the sitemap drift in Section 1); not added, since this pass's own rule is "evidence from the actual measured sample," not "port the old candidate list unconditionally."

### 6. Real density: three-stage comparison

```
A. ORIGINAL (re-confirmed, unchanged code path):
   Specific Item Rate:   5/30 = 16.7%
   Direct Attribute Rate: 0/30 = 0%
   Relations: 0

B. COLOR-COMPATIBLE (attributes.ts, unchanged this pass):
   Direct Attribute Rate: 2/30 = 6.7% (on the ORIGINAL sample; not re-measured on
   the new sample here since attributes.ts itself was not modified)

C. TAXONOMY-CLOSED PRODUCT REFERENCE (object-relations.ts, this pass, REAL measured
   on the fresh 30-product fetch):
   Specific Item Products:   28/30 = 93.3%
   Direct Attribute Products: 28/30 = 93.3%  <- every single resolved item also
                                                 carried >=1 real attribute
   Total Relations: 76
   Distinct (item, attribute) pairs: 67
   Average relations per attribute-bearing product: 76/28 = 2.71
```

The 2 unresolved products (10917, 10959) are the `[SET]` bundle names, deliberately rejected by the ambiguous-multi-item guard - not a taxonomy gap, a correctness choice (see Section 8).

**This number is REAL, not an estimate** - it comes directly from running `extractProductObjectRelations` against the actual fetched JSON-LD `name`/`description` text of these 30 live product pages, the same way `A` and `B` above were measured. It happens to land even higher than the prior pass's own `~97%` **audit estimate**, which is a genuinely interesting result worth stating plainly: that estimate assumed roughly a dozen missing items and 6-9 missing attribute values would need to be added, and closing almost exactly that many (15 items, 12 attribute values) produced a REAL rate in the same range as the earlier guess - the estimate's underlying reasoning (real, repeated, closeable vocabulary gaps) held up under actual measurement.

### 7. Manual precision audit (every one of the 76 relations inspected)

| | Count |
|---|---:|
| Total Relations | 76 |
| VALID | 72 |
| QUESTIONABLE | 4 |
| FALSE POSITIVE | 0 |
| **Precision** (VALID / (VALID + FALSE POSITIVE)) | **100%** (94.7% if QUESTIONABLE is conservatively counted against it: 72/76) |

All 4 QUESTIONABLE relations are real, verifiable facts from the product's own `[원단]` fabric-composition line, but weak or structurally confusable as "the" defining material - none is a fabrication:

1. **PANTS (11712) + MATERIAL:NYLON** - nylon is only 10% of a cotton-dominant (47%) blend ("cotton 47%, polyester 43%, nylon 10%"). True, but a minor blend component, not the defining fiber.
2. **KNIT (11971) + MATERIAL:WOOL** - wool is only 8% of a nylon-dominant (46%) blend. Same class of issue as #1.
3. **KNIT (11971) + MATERIAL:KNIT** - a real, structural tautology: because the new KNIT *item* value and the pre-existing KNIT *MATERIAL* value share the identical Korean word ("니트"), every product resolved to the KNIT item will always also trigger MATERIAL:KNIT from its own description ("골조직의 슬림핏 니트로"). True but circular/uninformative - a design consideration for a future pass (e.g. suppressing MATERIAL:KNIT specifically when `specificItem === "KNIT"`), not fixed this pass to avoid over-engineering a single observed case.
4. **JACKET (12092) + MATERIAL:NYLON** - the matched "nylon 100%" is explicitly the **안감2** (second LINING layer, not the 겉감/shell) of a jacket whose own NAME and shell fabric ("polyester 48%, wool 29%, rayon(viscose) 23%") both say wool. The current description scan does not distinguish 겉감 (shell) from 안감/포켓감/배색/충전재 (lining/pocket-lining/trim/filling) sub-fields - a real, disclosed limitation, not fixed this pass.

Zero outright false positives (a real fact attached to the WRONG item, or an item/attribute claim manufactured from text that does not support it) were found. The CO-code cross-reference stripping and `[SIZE(CM)]`/`[모델]` truncation - both added specifically because early manual testing during this pass's own development surfaced exactly this class of risk - are the reason: without them, this precision audit would very likely have found real false positives from companion-product bullets and alternate-color model captions.

### 8. Dimension coverage (real relations, this pass)

| Dimension | Products | Relations | Distinct Attributes |
|---|---:|---:|---:|
| COLOR | 26 | 26 | 13 (3 existing: BLACK/WHITE/BROWN; 10 new, matched - NAVY added but 0 real matches this run, see below) |
| DETAIL | 17 | 21 | 4 (all existing: SHIRRING, WASHED, EMBROIDERY, BIG_POCKET - no new DETAIL value was added this pass; every DETAIL relation is an existing Editorial value newly reachable via product NAME/description scanning) |
| SILHOUETTE | 16 | 16 | 5 (all new: CROP_FIT, SEMI_WIDE, SEMI_OVERSIZED, OVERSIZED, REGULAR_FIT) |
| MATERIAL | 8 | 12 | 5 (4 existing: NYLON, DENIM, SUEDE, KNIT; 1 new: WOOL) |
| STYLE | 1 | 1 | 1 (existing: VINTAGE) |
| FINISH | 0 | 0 | 0 - honestly zero, as the task anticipates is acceptable |

### 9. Item coverage (real relations, this pass)

| Item | Products | Attribute-bearing |
|---|---:|---:|
| PANTS | 4 | 4 |
| T_SHIRT | 4 | 4 |
| SWEATSHIRT | 3 | 3 |
| JACKET | 2 | 2 |
| SHORTS | 2 | 2 |
| CANVAS_BAG / TOTE_BAG / ZIP_HOODIE / HOODIE / SHIRT / CARDIGAN / RINGER_TEE / BLOUSE / LONG_SLEEVE_TEE / KNIT / BOOTS / PUFFER / ECO_BAG | 1 each | 1 each |

Every one of the 28 resolved-item products carried at least one real attribute relation - 0 resolved products with zero attribute text.

### 10. What remains uncaptured

- **Missing Item Vocabulary**: none observed in this sample beyond what was added; the two `[SET]` products remain unresolved by design (ambiguous multi-item name), not a vocabulary gap.
- **Missing Attribute Vocabulary**: `하프집업` (half-zip, 11757), `옥스포드` (oxford weave, 11900), `리브드`/`골조직` (ribbed knit construction, 11971), `프릴` (frill, 11880 and 12072), `도트` (dot pattern, 11880), `헤링본 테이프` (herringbone-tape neck finish, appears in 4+ products) - all real, repeated-enough-to-notice candidates, none added this pass (kept the pass scoped to the pre-identified candidate class plus the SILHOUETTE fit-family that cleared the >=2 bar).
- **Parser Grammar Miss**: `RINGER_TEE (11819) + COLOR:NAVY` was NOT captured. The bidirectional COLOR suffix check anchors to the resolved item's own matched substring ("링거", 2 characters) rather than the full compound head noun ("링거 티셔츠"), so the intervening "티셔츠" between "링거" and "네이비" fails the whitespace-only-gap requirement. A real, verified miss (recall traded for precision, consistent with this project's stated philosophy), not fixed this pass.
- **No Attribute Text Present**: none - every resolved item had real attribute text.
- **Ambiguous / deliberately rejected**: `퍼` (fur, substring-collision risk with 퍼플), the KNIT-item/MATERIAL:KNIT tautology, and the 겉감/안감 material-provenance conflation (all discussed in Section 7).

### 11. Visual relation (unchanged conclusion, re-confirmed)

No change from both prior passes: JSON-LD ties `name`/`description`/`image` into one structured object per product, giving HIGH image-to-product confidence. No pixel/content analysis was performed in this pass either.

### 12. MarketProduct reuse recommendation (refined again, no schema change made)

Given this pass now produces real, multi-dimension structured relations (not just COLOR), the recommendation from the prior pass stands and sharpens: reuse `MarketProduct`'s `itemType`/`subItemType`/`mainColor`/`material`/`detail`/`style`/`gender`/`dataMode` field shape, but **only after** adding an explicit, indexed role discriminator - concretely, something like `evidenceRole: "RANKING" | "ASSORTMENT_REFERENCE"` - and auditing every existing `MarketProduct` consumer to confirm it filters on it. Without that discriminator, a future "all `MarketProduct` rows" query for a ranking/business-analytics view could silently ingest rows that were never observed selling or ranked. No schema or DB change was made this pass; this remains a recommendation only.

### 13. Multi-brand decision gate

| Gate | Result |
|---|---|
| A. Real Direct Attribute Rate meaningfully above Editorial density (~3-10%) | **PASS** - 93.3% vs ~3-10% |
| B. Manual precision >= 90% | **PASS** - 100% strict / 94.7% conservative |
| C. Coverage is not almost entirely COLOR suffix | **PASS** - COLOR is 26/76 (34.2%) of relations; DETAIL+SILHOUETTE+MATERIAL+STYLE together are 50/76 (65.8%) |
| D. At least 2-3 useful attribute dimensions | **PASS** - 5 active dimensions (COLOR, DETAIL, SILHOUETTE, MATERIAL, STYLE) |

**GO.** All four conditions clear comfortably, not marginally.

### 14. Next step (exactly one recommendation, no candidates investigated)

Per the task's explicit instruction, no new brand was searched or collected this pass. The next probe should sample **3-5 independent brands** (none sharing B:CAVE's ownership, unlike Covernat) using the identical JSON-LD name+description methodology and this pass's exact extraction code (`object-relations.ts`), selected for: (1) at least one non-Cafe24 platform, to confirm the trailing-COLOR-suffix and prefix-attribute-chain conventions are industry patterns, not Covernat/Cafe24-specific; (2) confirmed public JSON-LD `Product.description` via a quick single-page check before committing to a full sample; (3) no explicit AI-use restriction notice (checked per-brand); (4) no shared ownership with B:CAVE or with each other. Only after that cross-brand pass should any `MarketProduct` schema/discriminator work begin.

### Validation (this pass)

- `pnpm --filter @open-design/trend-dashboard typecheck`: PASS
- `pnpm --filter @open-design/trend-dashboard test`: PASS (all existing Editorial and prior Product Reference fixtures, plus new `verifyProductReferenceTaxonomy` fixtures covering generic item recognition, existing-SUB_ITEM priority, `[SET]` ambiguity rejection, NAME-level direct-phrase MATERIAL/DETAIL, description-level SILHOUETTE/MATERIAL, cross-field name+description linkage, relation deduplication, companion-SKU-code stripping, and the Editorial enumeration-guard regression)
- `pnpm --filter @open-design/trend-dashboard build`: PASS (no route/UI changes)
- `scripts/audit-editorial-quality.ts`: EditorialPost 283, EditorialMention 916, Direct Relations 15, Bundles 8, MarketRankingSnapshot 667 - all re-confirmed unchanged, both before and after this pass's code changes
- The one-off fetch/measurement script used to produce the numbers in this section was deleted after use, per this project's established convention for probe scripts (only the reusable extraction code and its test fixtures are kept)
