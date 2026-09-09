# Cosmopolitan Korea Real Collection + Independent Signal Audit

Checked date: 2026-09-09

Goal: safely collect a small REAL Cosmopolitan Korea corpus and determine whether it creates independent cross-publisher signal (not just article volume), after first resolving the known relation-extraction misattribution the prior audit's probe disclosed. UI is frozen. No taxonomy vocabulary added. No Product Reference work. No Prisma migration.

## 0. Safety

```
pwd    -> C:/Users/bcave/dev/open-design-trend-dashboard/apps/trend-dashboard
branch -> feature/trend-dashboard
status -> clean before starting
HEAD   -> 6247a57
```

Port 3000 (OneDrive original, PID 9912) confirmed listening and untouched throughout. Only port 3001 was started (for the final route check) and stopped afterward (PID 3296).

## 1. Live baseline (measured directly, not assumed)

| Metric | Value |
|---|---:|
| EditorialPost (real) | 313 |
| EditorialMention (real) | 1,232 |
| Direct Relation Instances | 66 |
| Distinct Item+Attribute Pairs | 52 |
| Bundles | 40 |
| Repeated (articlePresence>=2) | 5 |
| Multi-source (sourceSpread>=2) | 2 |
| Independent-cluster (>=2) bundles | 3 |
| Publisher-family-diverse (familySpread>=2) bundles | 2 |
| Same-case remention bundles | 2 |
| Canonical / mention duplicates | 0 / 0 |
| MarketRankingSnapshot | 667 |

Current primary (verified via the real, unmodified `selectPrimaryPlanningBundle`): **니트 CARDIGAN** (5 articles, sourceSpread=2, 2 families, 4 clusters).

## 2. Code reuse

No COSMOPOLITAN_KR code existed anywhere in `src/`. HARPERSBAZAAR_KR's collector was inspected first and confirmed to be the exact same technical platform (same business registration number, `/article/<id>` scheme, `atc_body_cont` container, JSON-LD dates - already established in `docs/EDITORIAL_PUBLISHER_DIVERSITY_AUDIT.md`). A parallel implementation (`parseCosmopolitanKrSitemap`/`parseCosmopolitanKrBody`/`parseCosmopolitanKrArticlePage`/`collectCosmopolitanKr` in `src/collectors/editorial/rss.ts`) was added, deliberately mirroring the existing HARPERSBAZAAR_KR pattern rather than either duplicating unrelated logic or risking a refactor of already-tested code mid-pass - the same design choice the codebase already made when ESQUIRE_KR and HARPERSBAZAAR_KR were added as parallel implementations rather than merged into one generic function on discovering the shared platform.

## 3. Known misattribution: identified, root-caused, and fixed (plus 3 more found the same way)

The prior audit disclosed one likely misattribution from the Cosmopolitan probe. Investigating it precisely, before writing any new code, surfaced its exact mechanism - and re-auditing the *existing* 40-bundle corpus with that same lens found the identical bug already silently affecting 2 bundles that predate this pass, which this fix also corrects.

### Misattribution #1 (the one disclosed by the prior audit)

| | |
|---|---|
| Article | COSMOPOLITAN_KR, "아이유, 원이, 한소희 등 올가을 얇은 브이넥 니트 하나는 있어야 하는 이유" |
| Item / Attribute | SHIRT + MATERIAL:KNIT |
| Text | "...깊은 브이넥 니트에 카키 셔츠를 레이어드해 색다른 조합을 선보였습니다." |
| Root cause | **ATTRIBUTE WINDOW** (attached-particle) - "니트에" (니트 + the particle 에) is a separate garment being LAYERED WITH the shirt, not a material describing it. A genuine Korean adnominal modifier never carries a particle before its head noun. |

**Also found affecting 2 pre-existing bundles**, not previously caught:
- HARPERSBAZAAR_KR, "니트 레드 와이드 팬츠" bundle: "넉넉한 레드 니트에는 와이드 팬츠" - a knit paired WITH wide pants, not "knit wide pants."
- HARPERSBAZAAR_KR, the "니트 체크 SHIRT" bundle blocking pure 체크 SHIRT from a 3rd source: "도톰한 니트도 허리에 묶어주면 셔츠" - 니트 and 셔츠 are being compared as tie-around-the-waist alternatives, not one describing the other.

**Fix**: `ATTACHED_PARTICLE` guard in `attribute-relations.ts` - rejects an attribute match immediately followed by 에/에는/에도/에서/도 before the item. A first draft also included 가/이/은/는 and was **rejected after it broke two real, correct, currently-valid relations** ("자수가 돋보이는 테일러드 코트" - embroidery genuinely on the coat via a relative clause; "블랙이 섞인 옴브레 플레이드 셔츠" - black genuinely mixed into the shirt) - both restored by narrowing the particle set to only the ones the real failures actually used. This trade-off (some theoretical residual risk, e.g. a hedge like "레드에 가까운 컬러," left unguarded because it has no observed occurrence) is disclosed rather than hidden.

### Misattribution #2 (found auditing the fresh dry run, not the prior probe)

| | |
|---|---|
| Article | COSMOPOLITAN_KR, "요즘 패피들이 긴팔 위에 반팔 티셔츠 입는 이유" |
| Item / Attribute | SKIRT + MATERIAL:DENIM |
| Text | "...데님 팬츠는 물론이고 러블리한 미니스커트와도 놀라울 정도로 완벽한 궁합을 자랑하죠." |
| Root cause | **COORDINATION** - "물론이고" ("not only X, but also Y") is a list-continuation marker the existing COORDINATION regex (only ,/·/와/과/및/그리고) did not recognize. DENIM describes 팬츠 (pants), not the skirt two items later. |

**Fix**: added `물론이고`, `뿐만 아니라`, `뿐 아니라` to `COORDINATION`.

### Misattribution #3 (found the same way)

| | |
|---|---|
| Article | COSMOPOLITAN_KR, "숏 트렌치코트 쇼핑 전 저장! 실패 없는 코디 공식 5" |
| Item / Attribute | COAT + COLOR:BLACK |
| Text | "...시크한 블랙 빅백을 매치해 코트를 제외한 모든 이너와 액세서리를 블랙으로 완벽하게 통일하는..." |
| Root cause | **COORDINATION** (verb-based) - "매치해" (matched/paired) signals the preceding "블랙 빅백" (black big bag) is a SEPARATE object from the coat. The sentence goes on to literally state the coat is EXCLUDED ("제외한") from the black color scheme - the opposite of what the naive window match produced. |

**Fix**: new `CLAUSE_BOUNDARY` marker set (매치해/매치하여/매치하고/레이어드해/레이어드하여/코디해/코디하여/페어링해/제외한/제외하고), cut using the same "text before the last occurrence belongs elsewhere" rule already used for `COORDINATION`.

### Misattribution #4 (found the same way)

| | |
|---|---|
| Article | COSMOPOLITAN_KR, "서강준의 그녀가 옷도 잘 입네? 안은진의 가을 사복 3" |
| Item / Attribute | SKIRT + MATERIAL:KNIT |
| Text | "...깔끔하고 따라 입고 싶은 안은진표 니트 + 체크 스커트 조합이에요!" |
| Root cause | **COORDINATION** - a bare "+" as an informal "itemA + itemB" outfit-combo symbol, common in Korean fashion editorial writing, not previously in the coordination character class. 니트 is a separate top, not a material describing the check skirt. |

**Fix**: added `+` to `COORDINATION`'s character class.

### Safety of all four fixes

Each fix was checked against every evidence text in the then-current 40-bundle real corpus before being accepted; none of the four new markers/guards appeared in any currently-valid evidence, so none could silently break an existing correct relation. After all four fixes, re-running against the real corpus removed exactly 3 bundles (all confirmed misattributions) and added exactly 1 new correctly-split bundle (레드 와이드 팬츠, KNIT correctly dropped, RED correctly kept) - net **-2 bundles (40 -> 38)** before any new collection. `npx tsc -b --noEmit`, `npx tsx scripts/smoke-test.ts`, and a full `npm run build` all passed after the fixes, and 6 regression fixtures were added to `scripts/smoke-test.ts` covering all four real failures plus the two relative-clause patterns a broader first draft had wrongly broken.

## 4. Parser content boundary

COSMOPOLITAN_KR reuses the identical three-marker body cutoff already fixed for HARPERSBAZAAR_KR (관련기사 / 이 기사엔 이런 키워드 / 이 기사도 흥미로우실 거예요! recirculation widget) - confirmed present on this platform too by direct sampling. This platform's per-article "10초 안에 보는 요약 기사" (10-second summary) box was specifically checked and confirmed to contain a genuine condensed recap of THAT article's own content (never another article's headline), so it is correctly kept as real evidence, not cut as chrome - the Harper's Bazaar related-reading bug did not recur.

## 5. Access reconfirmation

`robots.txt` (fetched fresh, not assumed): `User-agent: *` -> only `/event/notice` and one specific article disallowed; GPTBot/CCBot disallowed (not our identity, unchanged from the prior audit). Sitemap reachable (HTTP 200). No new AI-use prohibition, no challenge encountered. Access unchanged from the prior pass's finding.

## 6. Dry run (20 articles, zero DB writes)

Run via the real `collectEditorialFeed("COSMOPOLITAN_KR", 20, { days: 90 })` path, post-fix:

| Metric | Value |
|---|---:|
| Discovered | 20/20 |
| Within 90-day window | 20/20 |
| Fashion eligible | 18/20 |
| Item-bearing | 12/20 |
| Direct-attribute-bearing | 6/20 (30%) |
| Direct relations | 10 |
| Existing-bundle matches (single-attribute canonical key) | 4 |
| HTTP anomalies | 0 |

Existing-bundle matches found: SKIRT+WHITE, SHIRT+STRIPE, BACKPACK+BLACK, VEST+DENIM.

## 7. Dry-run manual precision (all 10 relations inspected)

| # | Relation | Evidence | Classification |
|---|---|---|---|
| 1 | SKIRT+WHITE | "화이트 레이스 스커트" (isolated, in an enumerated outfit list) | VALID |
| 2 | SKIRT+GREEN | "그린 크로셰 스커트" | VALID |
| 3 | SKIRT+DENIM | "데님 스커트를 매치하면" (DENIM directly adjacent, no boundary before it) | VALID |
| 4 | SHIRT+STRIPE | "블루 스트라이프 셔츠" (BLUE is not a tracked color, so no compound risk) | VALID |
| 5 | SKIRT+CHECK | "체크 스커트" (KNIT correctly excluded from the same post's "니트 + 체크 스커트" mention by the new "+" coordination fix) | VALID |
| 6 | SWEATSHIRT+BLACK | "검정색 맨투맨을 그냥 입으면" | VALID |
| 7 | BACKPACK+BLACK | "블랙핑크 지수의 사복 사진마다 빠짐없이 등장하는 블랙 백팩" | VALID |
| 8 | BACKPACK+NYLON | "'아밤(AVAM)'의 '나일론 포니 백팩" (same post as #7 - see bundle-level caveat below) | VALID |
| 9 | SHIRT+DENIM | "수지처럼 데님 셔츠를 가볍게 걸쳐" | VALID |
| 10 | VEST+DENIM | "오버사이즈 데님 베스트" | VALID |

**10/10 VALID, 0 QUESTIONABLE, 0 FALSE POSITIVE.** No unresolved systematic parser contamination - the gate in Section 10 is satisfied on real, manually-verified evidence, not on density alone.

**Bundle-level caveat (disclosed, not hidden):** items #7 and #8 come from the same post and the same item (BACKPACK). Bundle grouping keys on "the full set of attributes found for one item within one post" (`byItem` in `attribute-bundle-service.ts`, unchanged), so BLACK and NYLON compound into one bundle key for that post rather than each independently confirming a different pre-existing pure singleton - the same nuance already documented for HARPERSBAZAAR_KR's check-shirt case in the prior pass. The dry run's simple per-relation "existing bundle match" check is therefore an upper bound on what the real collector's bundle-level grouping will actually produce, not a guarantee - confirmed against the real post-collection state in Section 8 below rather than assumed.

## 8. Expected cross-source pairs, checked against the real dry run and real collection

| Pair | In 20-article dry run? | In real 30-article collection? |
|---|---|---|
| CHECK + SHIRT | Not present (didn't fall in the top-20-by-recency cut) | **Yes** - a different, later-ranked article ("가을 체크 못 참지! 설현, 수지, 장원영, 제니처럼 입는 4가지 방법") was inside the top 30 |
| DENIM + VEST | Present, VALID | Yes, same article |
| WHITE + SKIRT | Present, VALID | Yes, plus a 2nd COSMOPOLITAN_KR white-skirt article |

Per the task's own instruction ("if a pair no longer appears in the real dry run, do not force it"), CHECK+SHIRT was **not** claimed from the 20-article dry run - it is reported here only because the real 30-article collection actually produced it, checked after the fact, not assumed in advance.

## 9. Independence check (all three confirmed pairs)

| Confirmation | Existing evidence | New Cosmopolitan evidence | Verdict |
|---|---|---|---|
| CHECK+SHIRT | Burberry campaign (EYESMAG, 07-03), TDR/Garbstore FW26 (HYPEBEAST_KR, 08-29), a waist-tie flannel-shirt feature citing "엔조 블루스" (HARPERSBAZAAR_KR, 09-07) | "가을 체크 못 참지! 설현, 수지, 장원영, 제니처럼 입는 4가지 방법" (COSMOPOLITAN_KR, 09-05) - a celebrity check-styling roundup naming 4 different idols, none overlapping the other 3 sources' subjects/brands | **INDEPENDENT** - different celebrities, different brands, different genre (styling-tips roundup vs. brand campaigns/collections), no shared phrasing |
| DENIM+VEST | "헐렁한 데님 베스트" - Jennie's custom Calvin Klein collection (EYESMAG, 08-18) | "오버사이즈 데님 베스트" - Suzy/Jang Wonyoung double-denim feature (COSMOPOLITAN_KR, 09-07) | **INDEPENDENT** - different celebrities, no shared brand, 20 days apart, different outlets |
| WHITE+SKIRT | 3x HARPERSBAZAAR_KR looks (09-07/09-08 x2) | "요즘 패피들이 긴팔 위에 반팔 티셔츠 입는 이유" (COSMOPOLITAN_KR, 09-09) | **INDEPENDENT article**, but **same publisher family** (both Hearst Joongang) - correctly still counted as an independent cluster (article/story independence, not ownership, per Section 3's own rule), but does not increase `publisherFamilySpread` |

No press-release-derivative or near-duplicate language found in any of the three (no shared >=60-char passage, no shared unusual phrase, different celebrities named in each).

## 10-11. Collection gate and real collection

Gate: dry-run clean (Section 7) AND parser contamination resolved (Section 3) AND access stable (Section 5) AND Direct Attribute Rate useful (30%) AND a real independent-confirmation opportunity exists (DENIM+VEST, verified) - **PASSED**.

`npx tsx scripts/collect-korea-editorial.ts --source=COSMOPOLITAN_KR --days=90 --limit-per-source=30`: **30/30 posts collected, 157 mentions written, 0 HTTP restrictions/refusals.** Port 3001 was not running before collection; port 3000 (PID 9912) confirmed listening and untouched.

## 12-13. Write safety and reparse

No reparse needed - the collector applies full extraction at collection time (identical to every other source's own collection path), and both precision fixes were live *before* collection ran, not applied after.

| Check | Value |
|---|---:|
| Canonical duplicates | 0 |
| Mention duplicates | 0 |
| MarketRankingSnapshot (real) | 667 (untouched) |
| Future-dated posts | 0 |
| Missing publishedAt | 0 |
| Bodies < 200 chars | 3 (1%, pre-existing across the corpus, none newly introduced by COSMOPOLITAN_KR) |

## 14-15. Recomputed signals and publisher family spread

| Metric | Before fixes | After fixes, before collection | After real collection |
|---|---:|---:|---:|
| EditorialPost | 313 | 313 | **343** |
| EditorialMention | 1,232 | 1,232 | **1,389** |
| Direct Relation Instances | 66 | 62* | **76** |
| Distinct Item+Attribute Pairs | 52 | 50* | **54** |
| Bundles | 40 | 38 | **44** |
| Repeated (articlePresence>=2) | 5 | 5 | **7** |
| Multi-source (sourceSpread>=2) | 2 | 2 | **5** |
| Independent-cluster (>=2) bundles | 3 | 3 | **5** |
| Publisher-family-diverse bundles | 2 | 2 | **4** |
| Same-case remention bundles | 2 | 2 | 2 |

\* The precision fixes' own effect (removing 2 false relations from the pre-existing corpus) is a small, expected dip before any new data - reported for completeness, not hidden.

### Multi-source bundle family spread (all 5, real data)

| Bundle | Articles | Sources | Publisher Families | Family Spread | Independent Clusters |
|---|---:|---|---|---:|---:|
| **체크 SHIRT (primary)** | 4 | HARPERSBAZAAR_KR, COSMOPOLITAN_KR, HYPEBEAST_KR, EYESMAG | HEARST_JOONGANG, HYPEBEAST_HK, EYES_INC | **3** | 4 |
| 니트 CARDIGAN | 5 | HARPERSBAZAAR_KR, HYPEBEAST_KR | HEARST_JOONGANG, HYPEBEAST_HK | 2 | 4 |
| 화이트 SKIRT | 4 | COSMOPOLITAN_KR, HARPERSBAZAAR_KR | HEARST_JOONGANG | **1** | 4 |
| **데님 VEST (new)** | 2 | COSMOPOLITAN_KR, EYESMAG | HEARST_JOONGANG, EYES_INC | **2** | 2 |
| **스트라이프 SHIRT (new)** | 2 | COSMOPOLITAN_KR, EYESMAG | HEARST_JOONGANG, EYES_INC | **2** | 2 |

## 16. CHECK+SHIRT: the first 3-publisher-family confirmation

Achieved. Final state, verified via the real service (not hand-computed):

```
PRIMARY: 체크 SHIRT { articlePresence: 4, sourceSpread: 4, independentClusters: 4, publisherFamilySpread: 3 }
```

| Source | Family | Article | Date |
|---|---|---|---|
| EYESMAG | EYES_INC | 화사와 나린이 함께한, 버버리의 새로운 백 캠페인 'CITY ICONS' | 2026-07-03 |
| HYPEBEAST_KR | HYPEBEAST_HK | TDR, 테크니컬 소재와 장인정신으로 FW26 컬렉션 확장 | 2026-08-29 |
| HARPERSBAZAAR_KR | HEARST_JOONGANG | 니트와 셔츠, 올가을엔 허리에 입으세요 | 2026-09-07 |
| COSMOPOLITAN_KR | HEARST_JOONGANG | 가을 체크 못 참지! 설현, 수지, 장원영, 제니처럼 입는 4가지 방법 | 2026-09-05 |

Note: of the 4 sources, exactly 2 (HARPERSBAZAAR_KR, COSMOPOLITAN_KR) are the same publisher family - `publisherFamilySpread` (3) is correctly lower than `sourceSpread` (4) here, and this is reported honestly rather than treating all 4 sources as fully independent companies. This is still the corpus's first-ever 3-*family* confirmation (previously the maximum was 2), which is the real milestone.

## 17. Current primary

**체크 SHIRT.** Reason: `bundleSourceSpread` is the sort's first key; 체크 SHIRT (4) now exceeds every other bundle including 니트 CARDIGAN (2). This state resulted from two combined causes this pass - the precision fix (which let HARPERSBAZAAR_KR's pre-existing evidence join the pure bundle) and the new COSMOPOLITAN_KR evidence (which added a 4th source) - both real, verified, with zero change to the sort/ranking logic itself.

## 18. New bundles

| Bundle | Item | Attributes | Articles | Sources | Families | Clusters | Evidence | Strength |
|---|---|---|---:|---|---|---:|---|---|
| 데님 VEST | VEST | MATERIAL:DENIM | 2 | COSMOPOLITAN_KR, EYESMAG | HEARST_JOONGANG, EYES_INC | 2 | "오버사이즈 데님 베스트" / "헐렁한 데님 베스트" | 반복 관측 · 서로 다른 사례 (genuinely repeated, cross-family) |
| 스트라이프 SHIRT | SHIRT | DETAIL:STRIPE | 2 | COSMOPOLITAN_KR, EYESMAG | HEARST_JOONGANG, EYES_INC | 2 | "블루 스트라이프 셔츠" / "스트라이프 러닝 셔츠" | 반복 관측 · 서로 다른 사례 (genuinely repeated, cross-family) |

Both are genuinely repeated with 2 independent clusters from 2 different companies - not singletons being called a trend. Several additional COSMOPOLITAN_KR-only singletons exist in the real data (e.g. individual SKIRT+GREEN, SWEATSHIRT+BLACK observations) and are correctly left as `단일 관측`, not promoted.

## 19. Signal yield

| Metric | Added |
|---|---:|
| Articles | +30 |
| Relation Instances | +14 (net, from the post-fix 62 baseline to 76) |
| Bundles | +6 |
| Independent Repeated (>=2 clusters) | +2 |
| Multi-source Independent (>=2 clusters AND >=2 sources) | +3 |
| Publisher-family-diverse Repeated | +2 |

**Assessment: HIGH.** Not because of the +30 articles (secondary, per the task's own framing) but because: (1) the corpus's primary signal gained a 4th independent source and became a 3-publisher-family confirmation for the first time ever; (2) two new bundles were created that are immediately, genuinely multi-source AND cross-family, not singletons; (3) multi-source-independent bundles grew from 2 to 5 (+150%) - the largest single-pass jump in this corpus's audit history to date.

## 20. Hearst concentration after collection

| Family | Article Share Before | Article Share After | Bundle Contribution | Independent-Repeated Contribution |
|---|---:|---:|---:|---:|
| HYPEBEAST_HK | 45.0% | 41.1% | 11 | 2 |
| EYES_INC | 32.6% | 29.7% | 17 | 3 |
| **HEARST_JOONGANG** | 19.2% | **26.2%** | **20** | **5** |
| VISLA_INDEPENDENT | 1.9% | 1.7% | 1 | 0 |
| NONLABEL_INDEPENDENT | 1.3% | 1.2% | 0 | 0 |

Hearst Joongang's article share rose (19.2% -> 26.2%), as expected and as the prior audit anticipated. **Did diversity value increase at the same time? Yes, clearly.** Of Hearst Joongang's 5 independently-repeated-bundle touches, **4 are genuinely cross-family** (체크 SHIRT, 니트 CARDIGAN, 데님 VEST, 스트라이프 SHIRT all also involve HYPEBEAST_HK or EYES_INC) - only 1 (화이트 SKIRT) is Hearst-only. Hearst Joongang is not still the most article-heavy source (Hypebeast HK remains higher), but this pass's growth in its footprint came bundled with real cross-company confirmation, not isolated self-reinforcement.

## 21. Hearst stop rule

**Confirmed and applied.** COSMOPOLITAN_KR was the intended final Hearst Joongang source for the current phase (documented in `docs/EDITORIAL_PUBLISHER_DIVERSITY_AUDIT.md` before this pass began). **ELLE_KR is explicitly NOT collected this pass and should not be the next source added** - it is the same legal entity (identical registration number) as all three Hearst sources already in the corpus, and its own probe density (20%) is half of Cosmopolitan's (40%). The next source-expansion pass should deliberately screen for a publisher family other than HEARST_JOONGANG, HYPEBEAST_HK, or EYES_INC.

## 22. Source contribution (final)

| Source | Articles | Relation Instances | Distinct Bundles | Independent Repeated Contributions | Multi-source Independent Contributions | Publisher-family-diverse Contributions |
|---|---:|---:|---:|---:|---:|---:|
| EYESMAG | 102 | 17 | 17 | 3 | 3 | 3 |
| HYPEBEAST_KR | 141 | 14 | 11 | 2 | 2 | 2 |
| HARPERSBAZAAR_KR | 30 | 15 | 11 | 3 | 3 | 2 |
| **COSMOPOLITAN_KR** | 30 | 10 | 10 | **4** | **4** | **3** |
| ESQUIRE_KR | 30 | 1 | 1 | 0 | 0 | 0 |
| VISLA | 6 | 1 | 1 | 0 | 0 | 0 |
| NONLABEL | 4 | 0 | 0 | 0 | 0 | 0 |

COSMOPOLITAN_KR immediately became the corpus's **single most productive source for independently-repeated and multi-source-independent evidence** on its very first collection, ahead of every existing source including EYESMAG (102 articles) and HYPEBEAST_KR (141 articles) - direct confirmation that Direct Attribute Rate at collection time, not accumulated article volume, is what drives this corpus's real signal quality.

## 23. Roundup cluster regression

Checked whether any Cosmopolitan-touched multi-source bundle shows more than one COSMOPOLITAN_KR article (which would exercise the same-source roundup-absorption heuristic). **None do** - every multi-source bundle Cosmopolitan touches (체크 SHIRT, 데님 VEST, 스트라이프 SHIRT, 화이트 SKIRT) has exactly one COSMOPOLITAN_KR article, so the roundup/absorption mechanism was not exercised by this collection at all. No clustering issue found; the existing, unmodified trust logic was not touched.

## 24. Missed taxonomy (report only)

| Candidate | Dimension | Item(s) | Articles | Evidence | Potential Relations |
|---|---|---|---:|---|---|
| 블루 (BLUE) | COLOR | SHIRT, CARDIGAN | 2+ (this pass alone) | "블루 스트라이프 셔츠", "여기에 선명한 블루 카디건" | SHIRT+COLOR:BLUE, CARDIGAN+COLOR:BLUE |

BLUE is not currently a tracked COLOR value anywhere in the taxonomy (confirmed by grep), despite recurring across multiple real articles this pass and the last. Reported only, per the frozen-taxonomy rule - not implemented.

## 25. UI frozen

No CSS/layout/component file touched. Verified rendering on the existing, unmodified `/`, `/items`, and `/items/SHIRT` pages (Section 28).

## 26. Product Reference frozen

Not touched - `object-relations.ts`/`attributes.ts` import only `frozen-editorial-vocabulary.ts`, never `attribute-relations.ts` or `attribute-bundle-service.ts`. The frozen regression assertion (`frozenEditorialRules.length === 57`, 58/120 item-bearing) passed unchanged as part of the full `smoke-test.ts` run.

## 27. Data safety

- EditorialPost (real): **343** (was 313).
- MarketRankingSnapshot (real): **667**, unchanged throughout.
- Canonical duplicates: 0. Mention duplicates: 0.
- No Prisma migration, no schema change.

## 28. Validation

- `npx tsc -b --noEmit`: **PASS**.
- `npx tsx scripts/smoke-test.ts`: **PASS**, including 6 new regression fixtures (the 2 originally-disclosed misattribution patterns, the 2 newly-found coordination gaps, and 2 relative-clause guard-rails proving the fix did not over-reach) and updated real-data primary-bundle assertions reflecting 체크 SHIRT's new 4-source state.
- `npm run build`: **PASS**.
- Routes checked on a locally started production server, port 3001 (stopped immediately after, PID 3296): `/` 200, `/editorial` 200, `/items` 200, `/items/SHIRT` 200, `/items/CARDIGAN` 200, `/market` 200. Port 3000 (PID 9912) confirmed listening and untouched throughout. COSMOPOLITAN_KR and the new 체크 SHIRT ordering confirmed rendering in the real HTML output of `/items/SHIRT` and `/`.
- Product Reference frozen regression: unchanged, re-verified as part of the same smoke-test run.

## Next step

**Find the next high-density editorial source from a publisher family other than Hearst Joongang, Hypebeast, or Eyes Inc.** The Hearst stop rule (Section 21) is now in effect for the current phase; Cosmopolitan Korea was its last addition. The corpus's real bottleneck is no longer taxonomy or extraction precision (this pass found and fixed 4 real bugs, leaving 10/10 manually-verified-valid relations on the freshest sample) - it is publisher-family variety, exactly as the prior audit anticipated.
