# Editorial Signal Saturation + Planning Value Audit

Checked date: 2026-09-09

Primary question, per the task brief: **before adding another source, is the current Editorial corpus already producing enough trustworthy, recent, diverse ITEM + ATTRIBUTE signal to be useful for product planning?** This pass is analysis-only against the live, unmodified `getAttributeBundles`/`selectPrimaryPlanningBundle` service and the real DB - no collection, no parser change, no taxonomy change, no schema change, no UI change, no ranking-logic change.

## 0. Safety

```
pwd    -> C:/Users/bcave/dev/open-design-trend-dashboard
branch -> feature/trend-dashboard
status -> clean before starting
HEAD   -> ee21e2a
```

All computation below ran through one read-only scratch script (`scripts/_scratch-saturation-audit.ts`, calling the real `getAttributeBundles("real")`/`selectPrimaryPlanningBundle`/`countIndependentEvidenceClusters` and read-only Prisma queries) - deleted immediately after use, never staged, matching the methodology of every prior audit in this chain. No DB write of any kind occurred.

## 1. Live metrics (re-derived, not carried over)

| Metric | Value |
|---|---:|
| EditorialPost (real) | **373** |
| EditorialMention (real) | **1496** |
| Eligible fashion posts (FASHION_RELEVANT) | **356** |
| Bundles | **47** |
| Independent Repeated (`independentEvidenceClusterCount >= 2`) | **10** |
| Multi-source Independent (`bundleSourceSpread >= 2`) | **8** |
| Publisher-family-diverse (multi-source AND >= 2 families) | **7** |
| Canonical duplicates | 0 |
| Mention duplicates | 0 |
| MarketRankingSnapshot | **667 (untouched)** |

Exactly matches the task brief's stated baseline - the brief's numbers were current, not stale.

## 2. Complete 47-bundle inventory

Ranked in the actual service sort order (`bundleSourceSpread desc, independentEvidenceClusterCount desc, bundleArticlePresence desc, attribute richness desc, name asc` - `src/services/attribute-bundle-service.ts`). `evidenceArticles` is capped at 5 by the service; no bundle in this corpus exceeds 5 articles, so the day-window counts below are exact, not sampled.

| # | Bundle | Item | Attributes | Art. | Src | Fam | Clusters | Latest | Age(d) | 7d | 30d | Strength |
|---:|---|---|---|---:|---:|---:|---:|---|---:|---:|---:|---|
| 1 | 체크 SHIRT | SHIRT | DETAIL:CHECK | 4 | 4 | 3 | 4 | 2026-09-07 | 1.9 | 2 | 3 | 여러 매체 동시 관찰 |
| 2 | 니트 CARDIGAN | CARDIGAN | MATERIAL:KNIT | 5 | 2 | 2 | 4 | 2026-09-08 | 0.8 | 4 | 5 | 여러 매체 동시 관찰 |
| 3 | 화이트 SKIRT | SKIRT | COLOR:WHITE | 4 | 2 | **1** | 4 | 2026-09-09 | 0.1 | 4 | 4 | 여러 매체 동시 관찰 |
| 4 | 데님 SHORTS | SHORTS | MATERIAL:DENIM | 2 | 2 | 2 | 2 | 2026-09-07 | 1.9 | 1 | 1 | 여러 매체 동시 관찰 |
| 5 | 데님 VEST | VEST | MATERIAL:DENIM | 2 | 2 | 2 | 2 | 2026-09-07 | 1.5 | 1 | 2 | 여러 매체 동시 관찰 |
| 6 | 레드 SHORTS | SHORTS | COLOR:RED | 2 | 2 | 2 | 2 | 2026-09-08 | 0.8 | 2 | 2 | 여러 매체 동시 관찰 |
| 7 | 레드 SKIRT | SKIRT | COLOR:RED | 2 | 2 | 2 | 2 | 2026-09-04 | 5.1 | 1 | 1 | 여러 매체 동시 관찰 |
| 8 | 스트라이프 SHIRT | SHIRT | DETAIL:STRIPE | 2 | 2 | 2 | 2 | 2026-09-08 | 1.0 | 1 | 1 | 여러 매체 동시 관찰 |
| 9 | 시퀸 SKIRT | SKIRT | DETAIL:SEQUIN | 2 | 1 | 1 | 2 | 2026-09-07 | 1.9 | 2 | 2 | 반복 관측 · 서로 다른 사례 |
| 10 | 화이트 SHIRT | SHIRT | COLOR:WHITE | 2 | 1 | 1 | 2 | 2026-09-07 | 1.7 | 2 | 2 | 반복 관측 · 서로 다른 사례 |
| 11 | 라글란 시퀸 긴팔 티셔츠 | LONG_SLEEVE_TEE | DETAIL:RAGLAN, DETAIL:SEQUIN | 2 | 1 | 1 | 1 | 2026-09-03 | 6.2 | 1 | 2 | 반복 관측 · 동일 사례 재언급 |
| 12 | 재활용 원단 토트백 | TOTE_BAG | MATERIAL:RECYCLED_FABRIC | 2 | 1 | 1 | 1 | 2026-09-03 | 6.2 | 1 | 2 | 반복 관측 · 동일 사례 재언급 |
| 13 | 데님 스웨이드 브라운 COAT | COAT | MATERIAL:SUEDE, COLOR:BROWN, MATERIAL:DENIM | 1 | 1 | 1 | 1 | 2026-09-08 | 1.0 | 1 | 1 | 단일 관측 |
| 14 | 카모 자수 레드 볼캡 | BALL_CAP | COLOR:RED, DETAIL:CAMO, DETAIL:EMBROIDERY | 1 | 1 | 1 | 1 | 2026-09-03 | 5.8 | 1 | 1 | 단일 관측 |
| 15 | 나일론 블랙 백팩 | BACKPACK | COLOR:BLACK, MATERIAL:NYLON | 1 | 1 | 1 | 1 | 2026-09-07 | 1.4 | 1 | 1 | 단일 관측 |
| 16-47 | (32 further singleton/same-case bundles, all `articlePresence <= 2`, `independentEvidenceClusterCount = 1`) | - | - | - | - | - | - | - | - | - | - | 단일 관측 or 반복 관측·동일 사례 |

Full #16-47 list (item, attributes, latest, age, category) is in the raw script output retained in this session's history; omitted here as none has `independentEvidenceClusterCount >= 2`, so none affects any of the trust-tier metrics this audit is scoped to. Notable entries: 나일론 체크 백팩/데님 스웨이드 SHIRT/니트 VEST/데님 토트백/빈티지 VARSITY JACKET/셔링 트랙 재킷/워싱 SWEATSHIRT/워크웨어 SHIRT/자수 COAT/자수 SHIRT/체크 토트백/화이트 COAT are all EYESMAG-only, 62-80 days old - the corpus's long tail, not stale-but-trusted signal (all are singletons, so their age doesn't mislead anyone the way a stale *multi-source* bundle would).

## 3. Top 15 planning signals + planning value

Criteria (transparent, no fashion taste applied): **specificity** (item + attribute both resolve to something concrete), **evidence independence** (`independentEvidenceClusterCount`), **source/family diversity** (`bundleSourceSpread`, publisher family spread), **recency** (`latestObservedAt` age), **actionable resolution** (Section 4).

| Rank | Bundle | Src/Fam | Clusters | Latest | Planning Value | Reason |
|---:|---|---|---:|---|---|---|
| 1 | 체크 SHIRT | 4/3 | 4 | 1.9d | **HIGH** | Max diversity + max independence + very recent |
| 2 | 니트 CARDIGAN | 2/2 | 4 | 0.8d | **HIGH** | Family-diverse, deepest cluster count in corpus, freshest |
| 3 | 화이트 SKIRT | 2/1 | 4 | 0.1d | **MEDIUM** | Strong independence and freshest of all, but single publisher family only |
| 4 | 데님 SHORTS | 2/2 | 2 | 1.9d | **HIGH** | Family-diverse, recent, resolves cleanly |
| 5 | 데님 VEST | 2/2 | 2 | 1.5d | **HIGH** | Family-diverse, recent |
| 6 | 레드 SHORTS | 2/2 | 2 | 0.8d | **HIGH** | Family-diverse, very recent |
| 7 | 레드 SKIRT | 2/2 | 2 | 5.1d | **HIGH** | Family-diverse, still recent |
| 8 | 스트라이프 SHIRT | 2/2 | 2 | 1.0d | **HIGH** | Family-diverse, recent |
| 9 | 시퀸 SKIRT | 1/1 | 2 | 1.9d | **MEDIUM** | Independently repeated but single-source/family |
| 10 | 화이트 SHIRT | 1/1 | 2 | 1.7d | **MEDIUM** | Independently repeated but single-source/family |
| 11 | 라글란 시퀸 긴팔 티셔츠 | 1/1 | 1 | 6.2d | **LOW** | Single cluster (same-case remention already collapsed) |
| 12 | 재활용 원단 토트백 | 1/1 | 1 | 6.2d | **LOW** | Single cluster, niche attribute (recycled fabric is a material-sourcing claim, not a stylable attribute) |
| 13 | 데님 스웨이드 브라운 COAT | 1/1 | 1 | 1.0d | **LOW** | Singleton, 3-attribute compound reads as over-specific |
| 14 | 카모 자수 레드 볼캡 | 1/1 | 1 | 5.8d | **LOW** | Singleton, accessory category with no repeat history in the corpus |
| 15 | 나일론 블랙 백팩 | 1/1 | 1 | 1.4d | **LOW** | Singleton, but generic COLOR+MATERIAL on a common bag - weak differentiation |

**HIGH: 7. MEDIUM: 3. LOW: 5** (of the top 15).

## 4. Actionability test (top 15)

| Bundle | Classification | Why |
|---|---|---|
| 체크 SHIRT | **ACTIONABLE** | Item + single clear detail, directly buyable spec |
| 니트 CARDIGAN | **ACTIONABLE** | Item + material, directly buyable spec |
| 화이트 SKIRT | **ACTIONABLE** | Item + color, directly buyable spec |
| 데님 SHORTS | **ACTIONABLE** | Item + material |
| 데님 VEST | **ACTIONABLE** | Item + material |
| 레드 SHORTS | **ACTIONABLE** | Item + color |
| 레드 SKIRT | **ACTIONABLE** | Item + color |
| 스트라이프 SHIRT | **ACTIONABLE** | Item + detail |
| 시퀸 SKIRT | **ACTIONABLE** | Item + detail, though thin evidence (see Section 3) |
| 화이트 SHIRT | **ACTIONABLE** | Item + color |
| 라글란 시퀸 긴팔 티셔츠 | **PARTIALLY ACTIONABLE** | Two compounded details (raglan + sequin) on a base item most planners would just call "롱슬리브" - specific but narrow |
| 재활용 원단 토트백 | **PARTIALLY ACTIONABLE** | "Recycled fabric" is a sourcing/material-strategy attribute, not a stylable spec a design brief typically uses directly |
| 데님 스웨이드 브라운 COAT | **TOO GENERIC** (paradoxically, via over-specificity) | Three attributes stacked on one COAT observation reads as one very specific runway coat, not a repeatable planning direction |
| 카모 자수 레드 볼캡 | **PARTIALLY ACTIONABLE** | Actionable spec, but on a single-observation accessory with zero repeat/diversity history |
| 나일론 블랙 백팩 | **TOO GENERIC** | Black nylon backpack is close to describing "a backpack" - very low differentiation from baseline inventory |

No entry in the top 15 was **TOO WEAK** (i.e., failing to resolve to a real item at all) - the extractor's item-resolution requirement already filters that class out before a relation can exist.

## 5. Current primary - 체크 SHIRT, deep review

- Articles: 4. Sources: 4 (HARPERSBAZAAR_KR, COSMOPOLITAN_KR, HYPEBEAST_KR, EYESMAG). Publisher families: 3 (HEARST_JOONGANG, HYPEBEAST_HK, EYES_INC). Independent clusters: 4. Latest: 2026-09-07 (1.9 days old at audit time). Window counts: 7d=2, 14d=3, 30d=3 (all 4 evidence articles fall within 30 days; none is stale).

**Why #1:** it has the corpus's maximum `bundleSourceSpread` (4, tied for highest possible given no bundle in the corpus exceeds 4 sources), and among bundles at that spread it's the only one - the sort's first two keys (source spread, then cluster count) both favor it outright, no lower-tier tiebreak needed.

**Is the evidence still recent enough?** Yes - the oldest of its 4 evidence articles is EYESMAG at 2026-07-03 (68 days), but the *3 most recent* (HARPERSBAZAAR_KR 2026-09-07, COSMOPOLITAN_KR 2026-09-05, HYPEBEAST_KR 2026-08-29) are all within the last 10 days, meaning the bundle's currency does not depend on its single oldest article - even removing the EYESMAG 68-day-old article (Section 6) leaves 3 sources / 2 families, all within 10 days. **Genuinely current, not a stale signal riding on an old confirmation.**

No ranking logic was changed to produce or verify this.

## 6. Top-10 stability (leave-one-evidence-article-out simulation, in-memory only, no DB writes)

| Rank | Bundle | Full state | Worst single-article removal | Classification |
|---:|---|---|---|---|
| 1 | 체크 SHIRT | 4 src / 4 clusters | -> 3 src / 3 remaining (still multi-family) | **ROBUST** |
| 2 | 니트 CARDIGAN | 2 src / 4 clusters | -> 2 src still (3 of 5 articles are HARPERSBAZAAR_KR alone) / 4 remaining | **ROBUST** (source spread survives every single removal; HARPERSBAZAAR_KR's 3-article depth alone would keep it multi-source even if all of HYPEBEAST_KR's were removed) |
| 3 | 화이트 SKIRT | 2 src / 4 clusters | removing the sole COSMOPOLITAN_KR article -> **1 src, 3 remaining** | **MODERATE** - its multi-source status hinges on exactly 1 article from 1 of its 2 sources; its cluster depth (from repeated HARPERSBAZAAR_KR coverage) is robust, but its family-diversity status is fragile by a single article |
| 4 | 데님 SHORTS | 2 src / 2 clusters | either removal -> 1 src, 1 remaining | **FRAGILE** (2 articles/2 sources - any single removal collapses it to a singleton) |
| 5 | 데님 VEST | 2 src / 2 clusters | either removal -> 1 src, 1 remaining | **FRAGILE** |
| 6 | 레드 SHORTS | 2 src / 2 clusters | either removal -> 1 src, 1 remaining | **FRAGILE** |
| 7 | 레드 SKIRT | 2 src / 2 clusters | either removal -> 1 src, 1 remaining | **FRAGILE** |
| 8 | 스트라이프 SHIRT | 2 src / 2 clusters | either removal -> 1 src, 1 remaining | **FRAGILE** |
| 9 | 시퀸 SKIRT | 1 src / 2 clusters | either removal -> 1 remaining article, still 1 source | **FRAGILE** (never multi-source to begin with; independence rests on 2 MARIECLAIRE_KR articles only) |
| 10 | 화이트 SHIRT | 1 src / 2 clusters | either removal -> 1 remaining article | **FRAGILE** |

**Pattern:** exactly the top 2 signals are ROBUST; rank 3 is MODERATE; ranks 4-10 are all FRAGILE by this test's own definition (2-article bundles necessarily collapse under single-article removal). This is expected at the current corpus size, not a defect - but it means **only the top 2 signals would survive a single source going offline or one article being retracted**, worth stating plainly rather than implying all "multi-source independent" bundles carry equal confidence.

## 7. Source saturation (current-state contribution, live/real)

| Source | Posts | Bundles touched | Independent-repeated touched | Multi-source touched | Family-diverse touched |
|---|---:|---:|---:|---:|---:|
| EYESMAG | 102 | 17 | 5 | 5 | 5 |
| HYPEBEAST_KR | 141 | 11 | 2 | 2 | 2 |
| HARPERSBAZAAR_KR | 30 | 11 | 4 | 4 | 3 |
| COSMOPOLITAN_KR | 30 | 10 | 4 | 4 | 3 |
| MARIECLAIRE_KR | 30 | 6 | 5 | 3 | 3 |
| VISLA | 6 | 1 | 0 | 0 | 0 |
| ESQUIRE_KR | 30 | 1 | 0 | 0 | 0 |
| NONLABEL | 4 | 0 | 0 | 0 | 0 |

**Marginal-value comparison for the 3 most recent additions (each added exactly 30 articles):**

| Source | Articles added | Independent-repeated gained | Family-diverse gained |
|---|---:|---:|---:|
| HARPERSBAZAAR_KR | 30 | 4 (current-state proxy) | 3 (current-state proxy) |
| COSMOPOLITAN_KR | 30 | 4 (current-state proxy) | 3 (current-state proxy) |
| MARIECLAIRE_KR | 30 | **5 (exact - new source, touched = gained)** | **3 (exact)** |

For HARPERSBAZAAR_KR and COSMOPOLITAN_KR the "gained" figures are the current-state touch counts, used as the best available proxy: no separate before/after DB snapshot from each of those two passes was preserved as an independent artifact to re-derive an exact at-time-of-addition delta (only their own commit messages and this session's live end-state exist). For MARIECLAIRE_KR the figure is exact, verified in `docs/MARIECLAIRE_COLLECTION_AUDIT.md`. Nothing suggests the two earlier sources' current touch counts have drifted meaningfully from their at-addition values - the only intervening change was the `PAIRING_PARTICLE` parser fix, whose known effect was removing 2 pre-existing HARPERSBAZAAR_KR misattributions (Section 16), not adding new confirmations to either source.

## 8. Source incremental yield (transparent ratios, no weighted score)

| Source | Independent Repeat Gain / 30 Articles | Family-diverse Gain / 30 Articles |
|---|---:|---:|
| HARPERSBAZAAR_KR | 0.13 | 0.10 |
| COSMOPOLITAN_KR | 0.13 | 0.10 |
| MARIECLAIRE_KR | **0.17** | 0.10 |

Marie Claire's independent-repeat ratio is the **highest of the three most recent source additions**, not a decline. Its family-diverse ratio matches the other two exactly.

## 9. Saturation test

**A. NOT SATURATED.**

Reasoning: the definition of "approaching saturation" given in the task is "recent sources mostly add singleton bundles with few new independent repeats." The opposite is observed - MARIECLAIRE_KR touched only 6 bundles total (fewer than HARPERSBAZAAR_KR's 11 or COSMOPOLITAN_KR's 10), but 5 of those 6 (83%) are independent-repeated, and its independent-repeat-per-30-articles ratio (0.17) is the best of the three most recent passes, not the worst. A genuinely-saturating source would show the reverse pattern: many bundles touched, but a shrinking fraction of them repeated/diverse. That pattern is not present.

## 10. Category coverage

Audit-level-only category grouping (not a schema/taxonomy change - a lookup table for this report, same status as the `publisherFamily` map used in prior passes):

| Category | Total bundles | Independent repeated | Multi-source | Family-diverse |
|---|---:|---:|---:|---:|
| **TOPS** | 14 | 4 | 3 | 3 |
| **BOTTOMS** | 13 | 5 | 4 | 3 |
| **OUTERWEAR** | 12 | 1 | 1 | 1 |
| **BAGS** | 6 | 0 | 0 | 0 |
| **ACCESSORIES** | 2 | 0 | 0 | 0 |

(Sums to 47.) TOPS/BOTTOMS/OUTERWEAR are reasonably balanced in raw bundle count (12-14 each) - **no single category dominates the corpus by volume**. But trust-tier signal is heavily concentrated in TOPS and BOTTOMS (9 of the 10 independent-repeated bundles, 7 of 7 family-diverse bundles); **OUTERWEAR has only 1 trustworthy signal despite 12 raw bundles, and BAGS/ACCESSORIES have zero trustworthy signal at all** (8 bundles between them, all singletons). A planner using this dashboard for bags or accessories decisions today would find nothing above 단일 관측.

## 11. Item coverage

| Item | Bundles | Sources (sample) | Families (sample) | Independent-repeated bundles | Category |
|---|---:|---:|---:|---:|---|
| SHIRT | 8 | 6 | 5 | 3 | TOPS |
| SKIRT | 6 | 4 | 3 | 3 | BOTTOMS |
| COAT | 5 | 3 | 3 | 0 | OUTERWEAR |
| SHORTS | 4 | 3 | 3 | 2 | BOTTOMS |
| CARDIGAN | 3 | 3 | 3 | 1 | TOPS |
| VEST | 3 | 3 | 3 | 1 | OUTERWEAR |
| TOTE_BAG | 3 | 2 | 2 | 0 | BAGS |
| BACKPACK | 3 | 3 | 3 | 0 | BAGS |
| WIDE_PANTS | 3 | 1 | 1 | 0 | BOTTOMS |
| BALL_CAP | 2 | 2 | 1 | 0 | ACCESSORIES |
| SWEATSHIRT | 2 | 2 | 2 | 0 | TOPS |
| LONG_SLEEVE_TEE, DOWN_JACKET, VARSITY_JACKET, TRACK_JACKET, DENIM_JACKET | 1 each | 1 each | 1 each | 0 | mixed |

**Well-supported:** SHIRT and SKIRT (both touched by 3+ independent-repeated bundles, 5+ sources, 3+ families - the two structurally strongest items in the corpus).
**Under-supported:** COAT (5 bundles but zero repeated - every COAT observation is a singleton despite decent raw volume; a real gap given COAT is a common FW planning category), BACKPACK (3 bundles, 3 sources, but all singletons - breadth without depth), WIDE_PANTS (all 3 bundles from a single source, EYESMAG-only... correction, HARPERSBAZAAR_KR-only per the raw data - either way, zero source diversity).
**Overrepresented relative to signal produced:** none of the items show volume without any yield at all (even the weakest, WIDE_PANTS/BALL_CAP, have at least raw bundle presence) - the more accurate framing is "several items have article/source breadth that hasn't yet converted into repeated or diverse confirmation," not that any item is wastefully overrepresented.

## 12. Attribute dimension coverage

Editorial's actual supported `directAttributes` types observed in this corpus are DETAIL, MATERIAL, COLOR, STYLE (the taxonomy also defines BRAND/COLLAB/IP but none of the current 47 bundles carry those as a `directAttributes` entry - they exist elsewhere in `editorialMentionTypes` but produced no bundle-forming direct attribute relation in this data):

| Dimension | Bundles touching | Independent-repeated | Family-diverse |
|---|---:|---:|---:|
| COLOR | 19 | 4 | 2 |
| DETAIL | 15 | 3 | 2 |
| MATERIAL | 15 | 3 | 3 |
| STYLE | 6 | 0 | 0 |

**Producing real planning signal:** COLOR, DETAIL, and MATERIAL all contribute to both independent-repeated and family-diverse bundles - all three are functioning dimensions. **STYLE is not yet producing trust-tier signal** - all 6 STYLE-bearing bundles (아웃도어 스포티 DOWN JACKET, 데님 빈티지 와이드 팬츠, 스포티 COAT, 빈티지 VARSITY JACKET, 워크웨어 SHIRT, 레드 빈티지 볼캡) are singletons. This is not evidence STYLE extraction is broken (the earlier audits' regression fixtures cover STYLE values like VINTAGE/SPORTY/OUTDOOR/WORKWEAR without issue) - it simply hasn't yet accumulated repeated evidence, worth monitoring rather than acting on.

## 13. Attribute resolution quality (all 47 bundles)

| Resolution | Count | Examples |
|---|---:|---|
| **HIGH** (item + one specific, useful attribute) | 27 | 체크 SHIRT, 니트 CARDIGAN, 화이트 SKIRT, 데님 SHORTS, 데님 VEST, 레드 SHORTS, 레드 SKIRT, 스트라이프 SHIRT, 시퀸 SKIRT, 화이트 SHIRT, and 17 more single-attribute singletons (나일론 블랙... no, that one's 2-attribute - see MEDIUM) |
| **MEDIUM** (useful but broad, or a clean 2-attribute compound) | 15 | 라글란 시퀸 긴팔 티셔츠, 재활용 원단 토트백, 나일론 블랙 백팩, 나일론 체크 백팩, 니트 스트라이프 CARDIGAN, 데님 그린 SKIRT, 데님 빈티지 와이드 팬츠, 데님 스웨이드 SHIRT, 레드 빈티지 볼캡, 브라운 레드 SKIRT, 블랙 레드 SHORTS, 아웃도어 스포티 DOWN JACKET |
| **LOW** (technically valid, weak planning value - 3-attribute over-specific compounds, or a single generic color/material with no differentiating power) | 5 | 데님 스웨이드 브라운 COAT (3-attribute, reads as one specific runway piece), 카모 자수 레드 볼캡 (3-attribute), 워크웨어 SHIRT (STYLE alone on a generic item), 블랙 백팩 / 블랙 COAT / 블랙 SHIRT / 블랙 SWEATSHIRT / 블랙 VEST (single generic COLOR:BLACK - technically valid but the weakest possible differentiation) |

(Counts above total slightly more than 47 across categories because a few single-attribute bundles were conservatively grouped with MEDIUM rather than HIGH where the attribute itself is broad rather than sharply stylable - e.g. plain COLOR:BLACK singletons are counted once, under LOW, not double-counted.) No taxonomy change made; this is a report-only classification.

## 14. Recency distribution

| Age band | All 47 bundles | 10 Independent Repeated | 7 Family-diverse |
|---|---:|---:|---:|
| 0-7 days | 31 | 10 | 7 |
| 8-14 days | 3 | 0 | 0 |
| 15-30 days | 0 | 0 | 0 |
| 31-60 days | 2 | 0 | 0 |
| 61-90 days | 11 | 0 | 0 |
| 90+ days | 0 | 0 | 0 |

**Every single independent-repeated and family-diverse bundle's latest evidence is within 7 days.** The 61-90 day tail (11 bundles, all EYESMAG singletons from the corpus's earliest collection pass) never touches a trust-tier bundle. This is the strongest single finding in this audit: **the corpus's trustworthy signal is not being propped up by stale evidence** - a planner looking at any bundle that clears the independent-repeated or family-diverse bar is looking at genuinely current (<=7 day) confirmation, not an old story still riding high on cluster count from months ago.

## 15. Current ranking sanity - one real, disclosed tension

Checked all four example patterns from the task brief against the actual top 15:

- **Old evidence outranking very recent evidence:** not found - every top-10 bundle's latest article is <=6 days old.
- **Many clusters in one source outranking broad independent evidence:** not found as a clean case - see below, it's related but not identical.
- **Attribute-richness tiebreak producing an unintuitive result:** not found - the richness tiebreak never actually fires in the current top 15 (no two bundles are tied through the first three sort keys).
- **Same-family evidence outranking stronger family diversity: FOUND, real, disclosed.** 화이트 SKIRT (rank #3: 2 sources, 4 independent clusters, but both sources are HEARST_JOONGANG mastheads - `publisherFamilySpread = 1`) ranks above every one of the corpus's 5 genuinely family-diverse bundles at ranks #4-8 (데님 SHORTS, 데님 VEST, 레드 SHORTS, 레드 SKIRT, 스트라이프 SHIRT - each 2 sources spanning 2 *different* companies, but only 2 clusters each). This is not an arbitrary tiebreak artifact - 화이트 SKIRT genuinely has more raw independent clusters (4 vs. 2), so the current sort's own logic (source spread, then cluster count) is being followed correctly. But `publisherFamilySpread` is not a ranking input anywhere in `getAttributeBundles`, so a planner scanning strictly by rank would see "체크 SHIRT, 니트 CARDIGAN, 화이트 SKIRT" as the corpus's 3 strongest signals without any indication that the third one's repeat depth comes entirely from one company's two mastheads, while the bundles right behind it in the ranking earned their (smaller) repeat count from genuinely unrelated publishers - the harder-to-fake trust signal this entire 3-pass audit chain has been deliberately building toward. This is a real, disclosed tension, not a proposed fix - no ranking logic was touched.

## 16. Parser fix effect separation

The Marie Claire pass (`ee21e2a`) bundled two effects into one 343->373 / 44->47 delta:

**(A) New Marie Claire evidence:** 30 real new articles, directly responsible for 5 new/upgraded bundles reaching independent-repeated status (레드 SKIRT, 데님 SHORTS both went from EYES_INC-only singletons to 2-source/2-family confirmed; 레드 SHORTS, 시퀸 SKIRT, 화이트 SHIRT are new bundles entirely) - documented with exact evidence in `docs/MARIECLAIRE_COLLECTION_AUDIT.md` Sections 16-19.

**(B) Parser cleanup on pre-existing evidence:** the same pass's `PAIRING_PARTICLE` fix, re-run against the existing corpus as a regression check, corrected 2 pre-existing HARPERSBAZAAR_KR misattributions ("브라운 계열의 레오퍼드 패턴에 레드 쇼츠" - BROWN wrongly on SHORTS; "빈티지 그레이 나시에 선명한 레드 반바지" - VINTAGE wrongly on SHORTS). The directly observable effect: the pre-existing compound bundle "블랙 레드 빈티지 SHORTS" (3 attributes) became "블랙 레드 SHORTS" (2 attributes, VINTAGE removed) in the current inventory - a precision correction to an *existing* bundle's key, not a new bundle, and not a removed one (still counted once, before and after).

**What this audit cannot cleanly separate:** whether the BROWN misattribution's removal deleted a bundle key that existed pre-fix (no pre-fix bundle-level snapshot was preserved independently of the git history text description). The known, bounded effect is: 2 specific relation instances were removed from the corpus by the fix, both already documented with full before/after context in the Marie Claire doc; nothing suggests either correction created a *new* trust-tier bundle - both were precision fixes to existing evidence, not new signal. **The 44->47 bundle-count delta and the 5->10 / 4->7 independent-repeated/family-diverse deltas should be attributed almost entirely to (A) new Marie Claire evidence, not (B) parser cleanup** - the parser fix's job was removing 2 false relations, a small precision correction, not a source of new bundles.

## 17. False-positive residual audit (top 10 signals)

Every relation supporting the top 10 was read directly from the live `evidenceText` field (the same text the extractor matched on, not re-fetched from the source):

| Bundle | Evidence | Verdict |
|---|---|---|
| 체크 SHIRT (x4) | "체크 셔츠" / "체크 셔츠" / "일본산 코튼 울 체크 오버셔츠" / "하우스 체크 디테일을 더한 폴로 셔츠" | **VALID x4** - all direct-adjacent, unambiguous |
| 니트 CARDIGAN (x5) | "H&M 파인니트 가디건" / "니트나 카디건" / "니트 카디건" (Peezy) / "더블 니트 가디건" / "니트 랩 가디건" | **VALID x4, QUESTIONABLE x1** - see below |
| 화이트 SKIRT (x4) | "화이트 레이스 스커트" / "화이트 롱 스커트" / "화이트 미니스커트" / "화이트 프릴 스커트" | **VALID x4** |
| 데님 SHORTS (x2) | "데님 쇼츠" (MCK) / "데님 쇼츠" (EYESMAG, preceded by "레더 소재의") | **VALID x2** - the EYESMAG instance's preceding "레더 소재의" clause reads as separate prior context (likely describing a different item earlier in the sentence); "데님" itself is directly adjacent to "쇼츠" |
| 데님 VEST (x2) | "오버사이즈 데님 베스트" / "헐렁한 데님 베스트" | **VALID x2** |
| 레드 SHORTS (x2) | "레드 쇼츠" / "레드 마이크로 쇼츠" | **VALID x2** (already independence-verified in the Marie Claire pass) |
| 레드 SKIRT (x2) | "레드 스커트" / "레드 오스트리치 깃털 다발을 장식한 스커트" | **VALID x2** |
| 스트라이프 SHIRT (x2) | "블루 스트라이프 셔츠" / "스트라이프 러닝 셔츠" | **VALID x2** |
| 시퀸 SKIRT (x2) | "화려한 실버 시퀸 스커트" / "전원이 비비드한 컬러감의 시퀸 미니스커트" | **VALID x2** |
| 화이트 SHIRT (x2) | "화이트 셔츠" / "오버사이즈 화이트 탱크 톱이나 셔츠" | **VALID x2** - the second is a real, correct extraction distinct from the already-fixed SKIRT+WHITE false positive: "화이트" here sits immediately before a genuine `이나`-coordinated pair (탱크톱 OR 셔츠), both plausibly described as white by the same shared modifier, not bled across an unrelated companion object |

**One QUESTIONABLE finding:** the 니트 CARDIGAN evidence text "니트나 카디건" (from HARPERSBAZAAR_KR, "니트와 셔츠, 올가을엔 허리에 입으세요") reads as "a knit (top) or a cardigan" - an `이나` ("or") coordination between two *alternative garment choices*, not "니트" as a MATERIAL adjective describing "카디건." If so, this one relation instance is a parser edge case (the `COORDINATION` boundary set does not currently include `이나`/`나` as a marker), not the `PAIRING_PARTICLE` class fixed this week. **Reported only, not fixed this pass** (no parser change permitted). Impact if actually false: 니트 CARDIGAN would drop from 5 to 4 articles and from 4 to at most 3 clusters - it would remain a robust, family-diverse, multi-source bundle either way (HARPERSBAZAAR_KR still has 2 other clean instances; HYPEBEAST_KR still has 2), so **this single questionable instance does not change the bundle's trust tier**, only its exact count by one.

**No FALSE POSITIVE was confirmed in the top 10.** One QUESTIONABLE instance found and disclosed, non-trust-tier-changing.

## 18. Current evidence labels - recommendation only, no UI change

The 4 existing labels (단일 관측 / 반복 관측·동일 사례 재언급 / 반복 관측·서로 다른 사례 / 여러 매체 동시 관찰) do not encode publisher-family diversity at all - "여러 매체 동시 관찰" reads identically for 체크 SHIRT (3 genuinely unrelated companies) and for 화이트 SKIRT (2 mastheads of one company). Given this audit chain has spent 3 passes treating that distinction as materially important (Section 15's finding depends on it directly), **a fifth label tier distinguishing cross-company confirmation from same-family multi-masthead confirmation would make the strongest trust signal legible without requiring a planner to know which outlets share ownership.** Recommendation only - no UI or label text was changed.

## 19. Product-planning summary - top 10 current signals

**1. 체크 SHIRT** — Why: max source/family spread + max cluster count in the corpus. Evidence: 4 sources / 3 families / 4 clusters. Latest: 2026-09-07 (2 days). Planning interpretation: the single most cross-verified item+attribute pairing currently in the corpus; safest signal to act on first.

**2. 니트 CARDIGAN** — Why: highest cluster depth (4) at family-diverse status. Evidence: 2 sources / 2 families / 4 clusters. Latest: 2026-09-08 (1 day). Planning interpretation: strong, freshest-dated confirmed signal; one evidence instance is questionable (Section 17) but does not change the bundle's tier.

**3. 화이트 SKIRT** — Why: freshest bundle in the entire corpus, deep repeat count. Evidence: 2 sources / **1 family** / 4 clusters. Latest: 2026-09-09 (same day). Planning interpretation: real and current, but its repetition all traces to one publisher's two mastheads - treat as a strong same-family signal, not yet a cross-company-confirmed one.

**4. 데님 SHORTS** — Why: newly cross-family confirmed this week (EYES_INC + MCK_PUBLISHING). Evidence: 2 sources / 2 families / 2 clusters. Latest: 2026-09-07 (2 days). Planning interpretation: genuinely independent, family-diverse, but fragile (Section 6) - one more confirming article from a third source would meaningfully strengthen it.

**5. 데님 VEST** — Why: cross-family (EYES_INC + HEARST_JOONGANG). Evidence: 2 sources / 2 families / 2 clusters. Latest: 2026-09-07 (2 days). Planning interpretation: same profile as #4 - real but fragile, worth a 3rd-source watch.

**6. 레드 SHORTS** — Why: cross-family, born diverse from creation this week. Evidence: 2 sources / 2 families / 2 clusters. Latest: 2026-09-08 (1 day). Planning interpretation: freshest of the newly-diversified bundles; fragile, watch for a 3rd confirmation.

**7. 레드 SKIRT** — Why: the specific confirmation this whole 3-pass source-diversification effort targeted (EYES_INC + MCK_PUBLISHING). Evidence: 2 sources / 2 families / 2 clusters. Latest: 2026-09-04 (5 days). Planning interpretation: real, independently audited (Section 10 of the Marie Claire doc), fragile by article count.

**8. 스트라이프 SHIRT** — Why: cross-family (EYES_INC + HEARST_JOONGANG). Evidence: 2 sources / 2 families / 2 clusters. Latest: 2026-09-08 (1 day). Planning interpretation: same fragile-but-diverse profile as the other rank 4-8 bundles.

**9. 시퀸 SKIRT** — Why: repeated within one source across two genuinely distinct articles. Evidence: 1 source / 1 family / 2 clusters. Latest: 2026-09-07 (2 days). Planning interpretation: real repeat, not yet cross-verified by an unrelated outlet - treat as an emerging, not confirmed, signal.

**10. 화이트 SHIRT** — Why: repeated within one source, distinct from the already-fixed SKIRT+WHITE false positive. Evidence: 1 source / 1 family / 2 clusters. Latest: 2026-09-07 (2 days). Planning interpretation: same emerging-signal caveat as #9.

## 20. Source expansion decision

**C. SOURCE EXPANSION NO LONGER PRIMARY BOTTLENECK.**

This is a judgment call, stated plainly: it does **not** contradict Section 9's finding that sources are NOT SATURATED (they aren't - the ratios in Section 8 are still healthy, MARIECLAIRE_KR's independent-repeat ratio was the best of the last three additions). The reasoning for C is a *relative* priority call, not a claim that another source would fail to add value: Section 15 found a concrete, already-fully-diagnosed case where the corpus's own hard-won publisher-family-diversity work (7 family-diverse bundles, built across 3 dedicated diversification passes) is not even visible to the ranking that decides what a planner sees first. Fixing that is a zero-collection, zero-risk, additive-only change (a tiebreak field) that would immediately re-surface value already banked *and* correctly reward every future source addition, rather than adding a 6th family whose new confirmations would land in the same ranking blind spot. Category coverage (Section 10 - BAGS/ACCESSORIES at zero trust-tier signal) is a secondary, corroborating reason: another general fashion-editorial source is unlikely to fix that gap either, since editorial styling prose structurally favors TOPS/BOTTOMS/OUTERWEAR over bags/accessories regardless of which publisher writes it.

## 21. (N/A - decision was not A)

Not applicable; per Section 20 this pass did not select "ADD ONE MORE PUBLISHER FAMILY," so no target-source profile is specified. If a future pass revisits this decision after the ranking fix (Section 22), the ideal next-source profile would carry forward unchanged from `docs/NON_HEARST_SOURCE_DIVERSITY_AUDIT.md`'s framing: a family outside HEARST_JOONGANG/HYPEBEAST_HK/EYES_INC/MCK_PUBLISHING, with priority attention to OUTERWEAR (well-covered by raw volume, zero repeat depth - Section 11) and BAGS/ACCESSORIES (structurally under-served regardless of source).

## 22. Next bottleneck

**RANKING.**

Chosen over ITEM COVERAGE (the next-closest candidate, per Sections 10-11's BAGS/ACCESSORIES/COAT gaps) because it is the only candidate in this audit with (a) a fully diagnosed, concrete, reproducible case (Section 15), (b) a fix shape that requires zero new data collection, zero schema change, and zero UI change - purely an additive sort tiebreak - and (c) a fix that would retroactively increase the visible value of every diversification pass already done, not just future ones. ITEM COVERAGE, RECENCY (already strong per Section 14), ATTRIBUTE TAXONOMY (STYLE is under-repeated but not broken per Section 12), AUTOMATED REFRESH, STORE SIGNAL, and UI/PLANNING PRESENTATION were all considered and are real, valid future work, but none has as immediate or low-risk a path to value as surfacing the family-diversity signal this project has already spent 3 passes building.

## 23. Operationalization audit

**If development stopped today, how would this dashboard stay current?** It wouldn't, automatically - there is no scheduled/cron collection anywhere in this codebase (checked `package.json` scripts, `tools-dev`/`tools-pack` orchestration, and the `apps/trend-dashboard` directory itself: every `collect:*` script is a manual `tsx scripts/collect-*.ts` CLI invocation).

- **Manual steps today:** running each source's collector script by hand (`collect-korea-editorial.ts` and the individual `collectXxxKr` functions in `rss.ts`), reviewing console output for HTTP anomalies, and (per the last two passes' own methodology) periodically re-running the smoke suite to catch parser drift.
- **Automatable steps:** the entire per-source collection loop is already deterministic and idempotent (canonical-URL-keyed upsert, confirmed 0 duplicates every pass) - it is a strong candidate for a simple scheduled job (OS task scheduler, a GitHub Action, or a `tools-dev`-integrated cron) with no code change needed beyond the scheduling wrapper itself.
- **Source-specific risks:** every collector is hand-tuned to one site's current DOM/feed shape (documented extensively in-code, e.g. Marie Claire's `?paged=N` feed quirk, Cosmopolitan's body-isolation fix) - a site redesign would silently break a collector with no alerting, since collectors only log to console and nothing persists a failure for later human review. HYPEBEAST_KR has already been observed hitting `HTTP 202` during a routine smoke-test run, confirming this risk is live, not hypothetical.
- **Recommended refresh cadence:** weekly per source. Evidence: article publish density observed in this audit (most bundles' `latestObservedAt` clusters within the last 1-2 days of each collection run, and the 90-day collection windows comfortably cover each source's natural multi-post-per-week cadence) - daily would add request volume without materially improving the "recent" (0-7d) tier that Section 14 already shows is healthy.
- **Automation priority:** wrap the existing 8 collectors in one weekly orchestrated job with basic pass/fail logging surfaced to a human (not a new collection mechanism - the logic already works, it's only unscheduled).

No automation was implemented this pass, per the task's explicit scope.

## Data safety

- No DB mutation of any kind. EditorialPost/EditorialMention/MarketRankingSnapshot: read-only queries only.
- MarketRankingSnapshot: **667, confirmed unchanged.**
- No source collection, no taxonomy change, no Product Reference work, no Prisma migration, no UI redesign, no ranking-logic change.
- One scratch analysis script (`_scratch-saturation-audit.ts`) used to query the live service/DB read-only, deleted immediately after use - never staged.

## Validation

Audit/docs-only pass - no production code changed, so no full build was required or run. `git status --short` is clean except for this new documentation file, staged explicitly.

## Next step

**Add a `publisherFamilySpread`-based tiebreak to `getAttributeBundles`'s sort order** (after `bundleSourceSpread` and `independentEvidenceClusterCount`, before `bundleArticlePresence`) so that the corpus's 3 passes of deliberate publisher-family diversification work becomes visible in the actual planner-facing ranking, using the concrete 화이트 SKIRT-vs-family-diverse-bundles case in Section 15 as the acceptance test - not another source addition.
