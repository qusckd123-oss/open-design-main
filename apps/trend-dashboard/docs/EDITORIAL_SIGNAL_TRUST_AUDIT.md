# Editorial Signal Trust + Evidence Independence Audit

Checked date: 2026-09-08

Goal: now that item taxonomy coverage has been expanded, determine whether the strongest Editorial signals - the 4 repeated bundles, and specifically the current primary signal `체크 SHIRT` - are linguistically valid, repeated, recent, independently observed, and not duplicate/syndicated versions of one story. **The goal is to make CURRENT SIGNAL trustworthy, not to increase counts.** No new taxonomy, no new source collection, no Product Reference changes, no DB mutation - this is a read-only audit against the existing 283-post, 1,025-mention corpus.

## Metric definitions

The prior report's "Relations 41/35" shorthand was ambiguous. Traced to exact code (`scripts/audit-attribute-relations.ts`, `src/collectors/editorial/attribute-relations.ts#extractDirectAttributeRelations`):

- **Direct Relation Instances** (41): incremented once per `(post, specificItem, attributeType, attributeValue)` tuple where a direct relation was found. `extractDirectAttributeRelations` already dedupes *within one post* (its own `seen` set), so a given item+attribute pair counts once per article - but the **same pair recurring in a second, different article counts again**. This equals the sum, across every distinct pair, of how many articles support it (its `articlePresence`).
- **Distinct Item+Attribute Pairs** (35): the count of unique `(specificItem, attributeType, attributeValue)` keys, regardless of how many articles/sources back each one.

No third "eligible relations" concept exists in the code - only these two. `scripts/audit-attribute-relations.ts`'s console output was renamed to state both explicitly (no calculation changed); `docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md` got a one-line pointer to this section rather than being rewritten.

Bundle-level metrics (`src/services/attribute-bundle-service.ts#getAttributeBundles`) are a **different, stricter** grouping: a bundle key is `specificItem#sorted(type:value,...)` - one bundle per item **plus the exact attribute set found together in one article**. `bundleArticlePresence`/`bundleSourceSpread` count articles/sources supporting that *exact* set, not the item or a single attribute in isolation. This is why, e.g., `SHIRT` has both a `체크 SHIRT` bundle (CHECK only, 2 articles) and separate single-attribute bundles (`블랙 SHIRT`, `스트라이프 SHIRT`, etc.) rather than one merged "SHIRT" bundle - attributes seen in different articles are never combined into one claim.

## Bundle inventory (all 29, from `getAttributeBundles("real")` directly - no UI text)

| # | Bundle | Item | Attributes | Articles | Sources | Latest | Strength |
|---|---|---|---|---|---|---|---|
| 1 | 체크 SHIRT | SHIRT | DETAIL:CHECK | 2 | 2 | 2026-08-29 | 여러 매체 동시 관찰 |
| 2 | 라글란 시퀸 긴팔 티셔츠 | LONG_SLEEVE_TEE | DETAIL:RAGLAN, DETAIL:SEQUIN | 2 | 1 | 2026-09-03 | 반복 관측 · 특정 매체 집중 |
| 3 | 니트 CARDIGAN | CARDIGAN | MATERIAL:KNIT | 2 | 1 | 2026-09-02 | 반복 관측 · 특정 매체 집중 |
| 4 | 재활용 원단 토트백 | TOTE_BAG | MATERIAL:RECYCLED_FABRIC | 2 | 1 | 2026-09-03 | 반복 관측 · 특정 매체 집중 |
| 5 | 카모 자수 레드 볼캡 | BALL_CAP | COLOR:RED, DETAIL:CAMO, DETAIL:EMBROIDERY | 1 | 1 | 2026-09-03 | 단일 관측 |
| 6 | 나일론 체크 백팩 | BACKPACK | DETAIL:CHECK, MATERIAL:NYLON | 1 | 1 | 2026-07-03 | 단일 관측 |
| 7 | 니트 스트라이프 CARDIGAN | CARDIGAN | DETAIL:STRIPE, MATERIAL:KNIT | 1 | 1 | 2026-09-03 | 단일 관측 |
| 8 | 데님 스웨이드 SHIRT | SHIRT | MATERIAL:SUEDE, MATERIAL:DENIM | 1 | 1 | 2026-07-24 | 단일 관측 |
| 9 | 아웃도어 스포티 DOWN JACKET | DOWN_JACKET | STYLE:OUTDOOR, STYLE:SPORTY | 1 | 1 | 2026-09-01 | 단일 관측 |
| 10 | 니트 VEST | VEST | MATERIAL:KNIT | 1 | 1 | 2026-07-01 | 단일 관측 |
| 11 | 데님 토트백 | TOTE_BAG | MATERIAL:DENIM | 1 | 1 | 2026-07-01 | 단일 관측 |
| 12 | 데님 SHORTS | SHORTS | MATERIAL:DENIM | 1 | 1 | 2026-07-06 | 단일 관측 |
| 13 | 데님 VEST | VEST | MATERIAL:DENIM | 1 | 1 | 2026-08-18 | 단일 관측 |
| 14 | 레드 SKIRT | SKIRT | COLOR:RED | 1 | 1 | 2026-07-01 | 단일 관측 |
| 15 | 블랙 백팩 | BACKPACK | COLOR:BLACK | 1 | 1 | 2026-09-01 | 단일 관측 |
| 16 | 블랙 COAT | COAT | COLOR:BLACK | 1 | 1 | 2026-09-03 | 단일 관측 |
| 17 | 블랙 SHIRT | SHIRT | COLOR:BLACK | 1 | 1 | 2026-07-31 | 단일 관측 |
| 18 | 블랙 VEST | VEST | COLOR:BLACK | 1 | 1 | 2026-09-02 | 단일 관측 |
| 19 | 빈티지 VARSITY JACKET | VARSITY_JACKET | STYLE:VINTAGE | 1 | 1 | 2026-06-21 | 단일 관측 |
| 20 | 셔링 트랙 재킷 | TRACK_JACKET | DETAIL:SHIRRING | 1 | 1 | 2026-07-07 | 단일 관측 |
| 21 | 스트라이프 SHIRT | SHIRT | DETAIL:STRIPE | 1 | 1 | 2026-07-29 | 단일 관측 |
| 22 | 스포티 COAT | COAT | STYLE:SPORTY | 1 | 1 | 2026-09-02 | 단일 관측 |
| 23 | 워싱 DENIM JACKET | DENIM_JACKET | DETAIL:WASHED | 1 | 1 | 2026-08-28 | 단일 관측 |
| 24 | 워싱 SWEATSHIRT | SWEATSHIRT | DETAIL:WASHED | 1 | 1 | 2026-07-08 | 단일 관측 |
| 25 | 워크웨어 SHIRT | SHIRT | STYLE:WORKWEAR | 1 | 1 | 2026-07-01 | 단일 관측 |
| 26 | 자수 COAT | COAT | DETAIL:EMBROIDERY | 1 | 1 | 2026-07-01 | 단일 관측 |
| 27 | 자수 SHIRT | SHIRT | DETAIL:EMBROIDERY | 1 | 1 | 2026-07-01 | 단일 관측 |
| 28 | 체크 토트백 | TOTE_BAG | DETAIL:CHECK | 1 | 1 | 2026-07-03 | 단일 관측 |
| 29 | 화이트 COAT | COAT | COLOR:WHITE | 1 | 1 | 2026-07-01 | 단일 관측 |

Full article IDs/canonical URLs/evidence text for every bundle were pulled directly from the service (not reproduced in full here for length; see "Repeated bundle audit" below for the 4 that matter for ranking, all others are single-observation by definition and their one evidence article is listed inline above by date).

**29 total, 4 repeated (>=2 articles), 1 multi-source (bundle #1 only - every other bundle, repeated or not, is single-source).**

## Repeated bundle audit (manual relation verification)

All 4 repeated bundles' direct relations were manually re-inspected against full article body text (not just the stored `evidenceText` snippet).

### #1 - 체크 SHIRT (SHIRT + DETAIL:CHECK)

| | Article A | Article B |
|---|---|---|
| Source | EYESMAG | HYPEBEAST_KR |
| Date | 2026-07-03 | 2026-08-29 |
| Title | "화사와 나린이 함께한, 버버리의 새로운 백 캠페인 'CITY ICONS'" | "TDR, 테크니컬 소재와 장인정신으로 FW26 컬렉션 확장" |
| URL | eyesmag.com/posts/164804/burberry-spring-2024-collection | hypebeast.kr/2026/8/tdr-garbstore-fw26-collection-release-info |
| Evidence sentence | "...버버리 액티브웨어 컬렉션의 스포티한 셋업과 하우스 체크 디테일을 더한 폴로 셔츠, 탱크톱까지 더해..." | "...일본산 코튼 울 체크 오버셔츠와 시그니처 크라운 치노는 이 다재다능한 드롭을 완성한다." |
| Relation | VALID | VALID |

Both classified **VALID**: CHECK sits directly and cleanly in each item's own 20-char modifier window, with no coordination marker intervening. The Burberry article is primarily a BAG campaign piece (its other CHECK mentions correctly produced separate `BACKPACK`/`TOTE_BAG` bundles from different sentences - no cross-item bleed), and its shirt clause is a distinct, later sentence about the brand's wardrobe line. No enumeration risk (the list boundary in "폴로 셔츠, 탱크톱까지" falls *after* the item, not between CHECK and 셔츠). No look-caption ambiguity, no brand/model-name confusion (no product code or proper-noun standing in for "체크"). **Independence: Burberry CITY ICONS (bag/wardrobe campaign) and TDR's FW26 Garbstore-adjacent drop are unrelated brands, unrelated products, 57 days apart, different outlets - genuinely two independent editorial observations.**

### #2 - 라글란 시퀸 긴팔 티셔츠 (LONG_SLEEVE_TEE + DETAIL:RAGLAN + DETAIL:SEQUIN)

| | Article A (dedicated) | Article B (roundup) |
|---|---|---|
| Source | HYPEBEAST_KR | HYPEBEAST_KR |
| Date | 2026-09-01 | 2026-09-03 |
| Title | "Supreme, Larry Clark의 'Tulsa' 유산을 기념하는 FW26 협업 공개" | "이번 주 놓치지 말아야 할 8가지 드롭" |
| URL | .../supreme-larry-clark-collaboration-fall-2026-release-info | .../best-drops-september-week-1-... |
| Evidence sentence | "...시선을 끄는 시퀸 래글런 롱슬리브 톱과 포근한 집업 후디드 스웨트셔츠도 함께 선보이며..." | "...전면 사진 프린트로 장식한 후디드 바시티 재킷, 시퀸 라글란 롱슬리브 톱, 자연스러운 인물 사진을 그래픽으로 활용한 티셔츠가 주요 아이템이다." |
| Relation | VALID | VALID |

Both classified **VALID** (clean direct modifier, no coordination leak in either sentence). **Independence: LOW.** Article B is HYPEBEAST_KR's own weekly roundup, and its opening paragraph states outright: *"이번 주 드롭은 Supreme가 전설적인 Tulsa 아카이브를 기리는 사진 중심의 2026년 가을 협업으로 문을 연다"* - explicitly the same "Tulsa"/Larry Clark collaboration as Article A, published by the same outlet 2 days later. This is the **same real-world product** (Supreme x Larry Clark FW26), described independently in different words by the same newsroom (not a verbatim copy - phrasing differs, so this is **LIKELY PRESS-RELEASE DERIVATIVE**, not literal syndication), not two separate observations of two separate things.

### #3 - 니트 CARDIGAN (CARDIGAN + MATERIAL:KNIT)

| | Article A | Article B |
|---|---|---|
| Source | HYPEBEAST_KR | HYPEBEAST_KR |
| Date | 2026-09-02 | 2026-08-31 |
| Title | "Peezy가 미리 선보인 Denim Tears x Billionaire Boys Club 협업" | "JENNIE와 adidas Originals의 첫 협업, 'FUNCTIONAL GRACE'로 완성한 기능적 우아함" |
| URL | .../peezy-denim-tears-lookbook-fall-winter-2026-fw26-release-info | .../adidas-originals-by-jennie-fw26-functional-grace-... |
| Evidence sentence | "...중앙을 가로지르는 BBC 브랜딩과 왼쪽 상완의 Denim Tears 시그니처 레드·블랙·그린 스트라이프가 돋보이는 도톰한 풀 지퍼 니트 카디건이다." | "...랩어라운드 구조를 적용해 새롭게 디자인한 트랙 톱과 세트 트랙 팬츠, 니트 랩 가디건, 시어 슬리브리스 보디수트와 레깅스..." |
| Relation | VALID | VALID |

Both classified **VALID**. **Independence: HIGH despite being same-source.** These are two genuinely different, unrelated real products - a Denim Tears x Billionaire Boys Club zip-up cardigan (André Leon Talley tribute collection) and a completely separate adidas Originals x JENNIE ballet-inspired wrap cardigan. Per the audit brief's own instruction not to over-penalize same-source coverage of *different* stories: this is 2 real independent evidence clusters, just concentrated in one outlet's editorial breadth, not a duplicate.

### #4 - 재활용 원단 토트백 (TOTE_BAG + MATERIAL:RECYCLED_FABRIC)

| | Article A (dedicated) | Article B (roundup) |
|---|---|---|
| Source | HYPEBEAST_KR | HYPEBEAST_KR |
| Date | 2026-09-01 | 2026-09-03 |
| Title | "sacai TO GO, 파리에서 만나는 익스클루시브 피스" | "이번 주 놓치지 말아야 할 8가지 드롭" |
| URL | .../sacai-to-go-le-bon-marche-rive-gauche-event-announcement-info | .../best-drops-september-week-1-... |
| Evidence sentence | "...컬래버레이션 티셔츠를 비롯해 재활용 패브릭을 활용한 토트백, 플러시 참..." | "...협업 티셔츠, 아카이브 원단을 재활용해 만든 Zantan 토트백..." |
| Relation | VALID | VALID |

Both classified **VALID**. **Independence: LOW - identical to #2's pattern.** Same "sacai TO GO" Le Bon Marché pop-up, same outlet, 2 days apart (dedicated post then roundup mention). The roundup adds a product name ("Zantan") the dedicated article didn't use, confirming this is an independently-worded re-description of the same announcement (**LIKELY PRESS-RELEASE DERIVATIVE**), not a copy-paste, but still the same underlying observation event, not two.

**No FALSE POSITIVE relations found anywhere in the 4 repeated bundles - all 8 relation instances are linguistically VALID.** The trust problem is entirely on the independence axis, not the extraction-precision axis.

## Evidence independence cluster count

| Bundle | Articles | Sources | Independent Evidence Clusters | Basis |
|---|---|---|---|---|
| 체크 SHIRT | 2 | 2 | **2** | Different brands (Burberry/TDR), different outlets, 57 days apart |
| 라글란 시퀸 긴팔 티셔츠 | 2 | 1 | **1** | Same product (Supreme x Larry Clark), same outlet, 2 days apart - dedicated + roundup restating it |
| 니트 CARDIGAN | 2 | 1 | **2** | Different products (Denim Tears x BBC vs. adidas x JENNIE), same outlet |
| 재활용 원단 토트백 | 2 | 1 | **1** | Same product (sacai TO GO), same outlet, 2 days apart - dedicated + roundup restating it |

This is the audit's central finding: **raw article/source counts alone cannot distinguish bundle #3 (genuinely 2 independent observations, just 1 outlet) from bundles #2 and #4 (1 real observation, counted twice because the same outlet's own weekly roundup restated a story it had already covered days earlier).** Per the brief's own framing, "3 articles, 2 sources, 1 cluster" is materially weaker than "3 articles, 3 sources, 3 clusters" - here the comparable statement is that #2 and #4's "2 articles, 1 source" is actually **1 cluster**, no stronger than a well-evidenced singleton, while #3's "2 articles, 1 source" is genuinely **2 clusters**.

## Recency audit (current date: 2026-09-08; 90-day active window)

| Bundle | Latest date | Days since latest | Articles last 7d | Articles last 14d | Articles last 30d |
|---|---|---|---|---|---|
| 체크 SHIRT | 2026-08-29 | 10 | 0 | 1 | 1 |
| 라글란 시퀸 긴팔 티셔츠 | 2026-09-03 | 5 | 2 | 2 | 2 |
| 니트 CARDIGAN | 2026-09-02 | 6 | 1 | 2 | 2 |
| 재활용 원단 토트백 | 2026-09-03 | 5 | 2 | 2 | 2 |

`체크 SHIRT`'s older article (Burberry, 07-03) is 67 days old and outside the 7/14-day windows, but its newer article (TDR, 08-29) is 10 days old - comfortably inside the 90-day active corpus and close to the 14-day boundary. It is not the most recent of the 4 repeated bundles, but it is not stale either. No bundle in this dataset is being labeled "current" merely because it exists somewhere in the 90-day window without a check - all 4 have at least one article inside 14 days.

## Current sorting logic (traced, not changed)

`getAttributeBundles` (`src/services/attribute-bundle-service.ts`) sorts bundles by, in order:

1. `bundleSourceSpread` descending
2. `bundleArticlePresence` descending
3. `directAttributes.length` descending (attribute richness)
4. `displayName` alphabetical (final deterministic tiebreak)

`selectPrimaryPlanningBundle` then picks the first bundle in that already-sorted list with `bundleArticlePresence >= 2` (falling back to `bundles[0]` if none exist). **Recency is not part of the sort at all** - `latestObservedAt` is computed and stored but never compared.

Because `체크 SHIRT` is the *only* bundle in the entire 29-bundle set with `bundleSourceSpread >= 2`, it sorts to position #1 overall on criterion 1 alone and is immediately selected as the primary bundle. Ranking behavior for the *other* 3 repeated bundles (criteria 2-4, since all three tie at sourceSpread=1, articlePresence=2) is: `라글란 시퀸 긴팔 티셔츠` (2 attributes) > `니트 CARDIGAN` (1 attribute) > `재활용 원단 토트백` (1 attribute, loses the alphabetical tiebreak to CARDIGAN).

## Ranking sanity test - concrete contradictions found in current data

- **Primary-signal-level**: none. `체크 SHIRT` is correctly ranked #1 by every one of the five semantic priorities in the brief (independent source spread, independent evidence clusters, repeated evidence, precision, and it is also reasonably recent) - there is no data-backed argument that any other bundle should outrank it.
- **Secondary-order-level**: **yes, one, real.** `라글란 시퀸 긴팔 티셔츠` (1 independent cluster, per the analysis above) currently outranks `니트 CARDIGAN` (2 independent clusters) - purely because it happens to carry 2 tagged attributes (RAGLAN + SEQUIN, both from the same phrase) versus CARDIGAN's 1 (KNIT). Attribute count is an accident of how descriptively a single sentence was written, not a measure of evidence independence, and this ordering is backwards from what an evidence-independence-first ranking would produce.
- **Hypothetical scenarios named in the brief that do NOT occur in current data**: no bundle has `bundleArticlePresence >= 3` today (max is 2), so "1-source 3-article bundle outranking a 2-source 2-article bundle" cannot currently happen. No repeated bundle is anywhere near 70 days old (oldest repeated-bundle latest-date is 10 days), so "an old repeated bundle outranking recent multi-source evidence" also does not currently occur. These remain theoretical risks for a larger future corpus, not proven current-data errors, and are reported as such rather than fabricated.

## Ranking change decision

**Not implemented.** The one concrete contradiction found (#2 vs. #3 secondary ordering) does not affect the primary signal, which is already correct. A principled fix requires computing "independent evidence cluster count" - which, on the evidence gathered here, cannot be done with a cheap, purely-numeric proxy already in the schema: dates alone don't distinguish the two cases (both pairs are 1-8 days apart), and reliable brand/product-identity matching would require new named-entity vocabulary (e.g. tracking "Supreme," "sacai," "Denim Tears" as BRAND values) that step 24's taxonomy freeze forbids adding in this pass. A same-source-and-close-in-date heuristic without entity matching would be too blunt - it would just as easily misclassify bundle #3 (genuinely independent, same-source, close-in-date) as a duplicate. Per the brief's own conservative bar ("only if a real current-data ranking contradiction is proven" AND "no magic weighted score" AND "transparent, deterministic"), inventing a fuzzy same-story heuristic now would trade one form of untrustworthiness for another. This is documented as the audit's primary recommended follow-up (see "Next step"), not implemented today.

## Evidence tiers - recommendation

Current three labels (`단일 관측`, `반복 관측 · 특정 매체 집중`, `여러 매체 동시 관찰`) are **not sufficient** as currently used: `반복 관측 · 특정 매체 집중` is applied identically to bundle #2/#4 (1 real independent observation, restated) and bundle #3 (2 real independent observations) - two evidence qualities that should not read the same to a merchandiser. Recommended additional internal distinction, to be computed once a reliable independence-cluster signal exists (see "Next step" - **not implemented in this pass**, and no UI copy was added):

- **반복 관측 · 동일 사례 재언급** ("repeated observation, same case restated") - for the #2/#4 pattern: same outlet, same underlying product/announcement, described more than once.
- **반복 관측 · 서로 다른 사례** ("repeated observation, distinct cases") - for the #3 pattern: same outlet, genuinely different products, each independently reported.

The brief's own suggested distinction (여러 매체 · 동일 보도 흐름 vs. 여러 매체 · 독립 관찰) is aimed at the *multi-source* tier; the current data has only one multi-source bundle (#1) and it shows no press-derivative pattern, so that specific split cannot yet be evidenced from data - the single-source tier split above is the one this audit actually found and can justify.

## Press release risk

Checked every multi-source-or-repeated bundle's evidence phrasing for signs of copied brand-supplied text (same unusual adjective sequence, same long descriptive clause, same typo):

- Bundles #2 and #4: **not verbatim copies** of each other (dedicated vs. roundup phrasing differs materially - e.g. "재활용 패브릭을 활용한 토트백" vs. "아카이브 원단을 재활용해 만든 Zantan 토트백"), but both plausibly draw on the same underlying brand announcement/press kit for the same real event. Classified as **LIKELY PRESS-RELEASE DERIVATIVE**, evidence retained (not erased) and independence downgraded accordingly, per the brief's own instruction.
- Bundle #1 (체크 SHIRT): the two evidence sentences describe two unrelated brands' unrelated collections in distinct phrasing with no shared unusual language - no press-release-derivative signal.
- Bundle #3 (니트 CARDIGAN): two unrelated brands' unrelated products, no shared phrasing - no press-release-derivative signal.

## Story cluster / near-duplicate global check (all 283 posts)

- **Exact normalized-title duplicates**: none.
- **Near-identical titles** (Jaccard >= 0.6 on 2-word shingles): exactly one pair, both ESQUIRE_KR - "익숙한 이름부터 새로운 얼굴까지 'K뷰티'의 모든 것, 스킨케어 편" / "...메이크업 편" - a two-part beauty series with a shared naming template, not a duplicate (confirmed different subject matter: skincare vs. makeup) and not fashion-item-relevant to any bundle.
- **High body overlap across different canonical URLs** (5-word shingle Jaccard >= 0.3): **none found** across the entire 283-post corpus. No evidence of cross-domain syndicated/reposted full-article content.

No suspicious clusters requiring action; the only real independence concern found is the intra-outlet roundup-vs-dedicated-article pattern documented above, not cross-source syndication.

## Roundup effect

**Relations per article (top articles)**:

| Relations | Distinct items | Source | Date | Title |
|---|---|---|---|---|
| 5 | 3 | HYPEBEAST_KR | 2026-09-03 | 이번 주 놓치지 말아야 할 8가지 드롭 |
| 4 | 3 | EYESMAG | 2026-07-03 | 화사와 나린이 함께한, 버버리의 새로운 백 캠페인 'CITY ICONS' |
| 3 | 1 | ESQUIRE_KR | 2026-09-03 | 지드래곤부터 제이홉까지... '카무플라주' 5 |
| 2 | 2 (or 1) | (6 articles tied) | various | various |

The single highest-relation article in the corpus **is** the HYPEBEAST_KR weekly roundup, covering 8 unrelated brand drops in one post (Supreme, Palace, adidas x JENNIE, Cactus Jack x Nike, côte&ciel, sacai, PLEASURES x Umbro, Denim Tears x BBC). It touches 3 distinct items (LONG_SLEEVE_TEE, TOTE_BAG, CARDIGAN) across the corpus. **This is not automatically bad** - one dedicated multi-item article (like the #2-ranked Burberry piece, a single cohesive campaign covering bags AND wardrobe) legitimately produces several real relations. But for the roundup specifically, **2 of its 3 touched items (LONG_SLEEVE_TEE, TOTE_BAG) were already independently covered by the same outlet's own dedicated articles 2 days earlier** - meaning its marginal contribution to genuine new independent evidence is smaller than its raw relation count suggests. Its third touched item (CARDIGAN, via the Denim Tears mention) correctly produced its *own* separate single-observation bundle (#7, KNIT+STRIPE) rather than double-counting into bundle #3's KNIT-only pairing, because the roundup's phrasing ("스트라이프를 더한... 니트 카디건") differs from the dedicated article's ("도톰한 풀 지퍼 니트 카디건") - a useful accidental safeguard, not a designed one.

**Disproportionate: partially.** The roundup does not single-handedly fabricate a bundle's existence (every bundle it touches also has a legitimately independent or dedicated source), but it is the direct mechanical cause of 2 of the 4 "repeated" bundles looking stronger than they are.

## Source contribution

| Source | Articles (FASHION_RELEVANT) | Direct Relation Instances | Distinct Bundles | Repeated Bundle Contributions | Multi-source Bundle Contributions |
|---|---|---|---|---|---|
| EYESMAG | 101 | 19 | 17 | 1 | 1 |
| HYPEBEAST_KR | 134 | 18 | 11 | 4 | 1 |
| NONLABEL | 3 | 0 | 0 | 0 | 0 |
| VISLA | 6 | 1 | 1 | 0 | 0 |
| ESQUIRE_KR | 28 | 3 | 1 | 0 | 0 |

EYESMAG and HYPEBEAST_KR are the only sources currently producing any repeated or multi-source evidence; EYESMAG alone touches every one of bundle #1's two contributing sources at the article level (its Burberry piece) alongside HYPEBEAST_KR's TDR piece - both outlets are needed for the one genuinely multi-source bundle. NONLABEL, VISLA, and ESQUIRE_KR contribute real but thin direct-attribute evidence (1-3 instances each), none of it currently repeated or cross-confirmed.

## Attribute dimension contribution

| Dimension | Relation Instances | Distinct Bundles containing it | Repeated Bundles (>=2 articles) | Multi-source Bundles (>=2 sources) |
|---|---|---|---|---|
| DETAIL | 17 | 12 | 2 | 1 |
| MATERIAL | 12 | 9 | 2 | 0 |
| COLOR | 7 | 7 | 0 | 0 |
| STYLE | 5 | 4 | 0 | 0 |
| SILHOUETTE | N/A | N/A | N/A | N/A |
| FINISH | N/A | N/A | N/A | N/A |

Editorial's own attribute type system has exactly four dimensions (`DETAIL`, `MATERIAL`, `COLOR`, `STYLE`) - `SILHOUETTE` and `FINISH` do not exist anywhere in `editorial/mentions.ts`'s type union and are correctly reported as not applicable, not as a zero-value gap (those two dimensions exist only in the separate, frozen Product Reference taxonomy). DETAIL produces the most instances and is the only dimension present in the corpus's one multi-source bundle (CHECK). COLOR and STYLE, despite reasonable instance counts, have never yet co-occurred with a second observation of the same exact pair - every COLOR/STYLE bundle today is a singleton.

## Singletons with high-quality evidence (verification only, no promotion)

Spot-checked the highest-specificity 1-article bundles (#5 카모 자수 레드 볼캡: 3 co-occurring attributes in one sentence; #6 나일론 체크 백팩; #9 아웃도어 스포티 DOWN JACKET). All correctly remain labeled `단일 관측` by `bundleEvidenceStrength` regardless of how rich or clean their single piece of evidence is - the function only ever looks at `articlePresence`/`sourceSpread`, never attribute count, so no singleton can be mistakenly promoted. This is a structural guarantee, not something that needed fixing.

## Current signal decision

**Should `체크 SHIRT` remain CURRENT SIGNAL? YES.**

Reasoning, strictly from evidence/source/independence/recency (not fashion judgment):

- It is the only bundle in the 29-bundle corpus with genuine multi-source confirmation (`bundleSourceSpread = 2`).
- Both its articles were independently verified as **2 real, distinct evidence clusters** (unrelated brands Burberry and TDR, unrelated campaigns, 57 days apart) - the strongest independence result of any repeated bundle audited.
- Both direct relations are linguistically **VALID** with no enumeration, coordination, or brand-naming defects.
- Its most recent evidence (TDR, 08-29) is 10 days old - well within the 90-day active window and close to the 14-day recency boundary, not stale.
- By contrast, the two single-source repeated bundles that could theoretically compete on raw counts (#2, #4) both collapse to a single real independent observation once the intra-outlet roundup-vs-dedicated-article pattern is accounted for - they do not actually outweigh `체크 SHIRT`'s evidence.

## Bottleneck

**MIXED**, specifically **source independence** as the dominant sub-issue, not recency, not source-copy (no cross-domain syndication was found at all), and not taxonomy (item coverage is already adequate to produce this signal). The corpus currently has only 2 sources (EYESMAG, HYPEBEAST_KR) capable of producing any repeated/multi-source evidence at all, and the one outlet that produces the *most* raw repetition (HYPEBEAST_KR) does so partly through its own weekly-roundup format re-describing stories it already covered - a structural characteristic of that source's publishing cadence, not a corpus-wide duplication problem (confirmed via the global near-duplicate check: zero cross-source syndication found).

## Data safety

- `EditorialPost` (REAL): 283, unchanged - this pass performed zero DB writes.
- `EditorialMention` (REAL): 1,025, unchanged.
- `MarketRankingSnapshot` (REAL): 667, unchanged.
- No reparse was run (no taxonomy/extraction code changed).

## Validation

- `npx tsc -b --noEmit`: pass.
- `npx tsx scripts/smoke-test.ts` (`npm test`): pass, unchanged (no service/ranking/extraction code was modified - only a script's console-log labels and two docs).
- No build run required for a docs-only pass; routes were not touched.
- Product Reference frozen regression: not re-run (no shared code path was touched by this pass - `attribute-bundle-service.ts` and `editorial/attribute-relations.ts` were read but not edited).

## Next step

Build a deterministic "independent evidence cluster" signal for repeated bundles - starting with the cheapest reliable proxy available without new taxonomy (e.g., flag an evidence article as a "roundup" when its own relation set spans an unusually high number of distinct specific items, and treat a roundup's contribution to a bundle as non-independent whenever a dedicated, single-item-focused article from the *same source* already covers that bundle within a short time window) - then use it to (a) split the `반복 관측 · 특정 매체 집중` label into "동일 사례 재언급" vs. "서로 다른 사례" as recommended above, and (b) fix the one proven secondary-ranking contradiction (라글란 시퀸 긴팔 티셔츠 outranking 니트 CARDIGAN) without touching the already-correct `체크 SHIRT` primary signal.
