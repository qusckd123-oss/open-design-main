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

## Validation

No production code was changed this pass (all `scripts/probe-*.ts`/`scripts/verify-*.ts`/`scripts/dump-*.ts` temporary files were deleted after use, per this project's established pattern for one-off probes). `typecheck`/`test`/`build` were not re-run, per the task's own instruction ("code change가 없으면 typecheck/build는 불필요하게 반복하지 않아도 된다").

## Data safety confirmed

- EditorialPost: 283 (unchanged)
- EditorialMention: 916 (unchanged)
- MarketRankingSnapshot: 667 (unchanged)
- Canonical duplicates: 0, Mention duplicates: 0 (re-confirmed via `audit-editorial-quality.ts` after the probe)
- No DB writes of any kind were made
