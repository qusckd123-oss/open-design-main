# Cross-Source Independent Signal Audit

Checked date: 2026-09-09

Question: can a NEW Korean fashion editorial source produce **independent, repeated ITEM + ATTRIBUTE confirmations** for the existing 29-bundle corpus - not just more articles? UI is frozen (no CSS/layout/component change). The existing trust architecture (`independentEvidenceClusterCount`, the roundup-absorption model in `src/services/attribute-bundle-service.ts`) is **not redesigned** in this pass - it is used exactly as-is to score new evidence.

## 0. Safety

```
pwd    -> C:/Users/bcave/dev/open-design-trend-dashboard
branch -> feature/trend-dashboard
status -> clean before starting
HEAD   -> cd9f942
```

Port 3000 (OneDrive original, PID 9912) was confirmed listening and left untouched throughout. Only port 3001 was started (for the final route check) and stopped afterward. No `git add .`/`git add -A`, no destructive git command, no DB reset/migration, no Product Reference work, no UI redesign.

## 1-2. Taxonomy frozen / known dead ends not re-audited

No Editorial item or attribute vocabulary was added during candidate comparison (Section 24 lists the one report-only observation found). Restated without re-auditing, per the task's own list: GQ Korea, W Korea, Dazed Korea (RESTRICTED, ClaudeBot disallowed), Arena Korea (explicit AI-training-restriction notice), the-edit.co.kr, apparelnews.co.kr (LOW_VALUE), VISLA expansion (low density), Noblesse (PARTIAL, 6.7% direct-attribute rate, insufficient exception), Musinsa/29CM/fashionn.com (JS/AJAX dead ends), Covernat (Type C, research closed).

## 3-4. New candidates discovered and access-checked

10 new domains were screened this pass (exceeds the 6-8 requirement), covering fashion-specific women's/lifestyle magazines not previously audited:

| Candidate | Domain | Access check result |
|---|---|---|
| Vogue Korea | vogue.co.kr | **RESTRICTED** - robots.txt names `ClaudeBot` explicitly in a disallow group alongside GPTBot/Google-Extended/Meta-ExternalAgent (`Disallow: /`). Stronger and more explicit than Arena's in-body notice - not sampled, per "no bypass." |
| Ceci (쎄씨) | ceci.co.kr | **UNREACHABLE** - DNS resolves (220.73.140.113) but every connection attempt (HTTP and HTTPS, with/without cert verification) timed out. Not a robots/access-policy block; a real network dead end. Not sampled. |
| InStyle Korea (mismatched) | instylekorea.com | **DISQUALIFIED, wrong site** - the domain now serves an unrelated Indonesian-language K-celebrity-gossip content farm (Jakarta timezone URLs, e.g. `/skandal-keluarga-ha-young-...`), not the InStyle magazine brand. Same class of error as the prior pass's Arena domain mixup - caught before sampling, not chased further. |
| StyleM (Chosun) | style.chosun.com | **DISQUALIFIED, repurposed domain** - TLS hostname mismatch on the expected cert; with verification bypassed for diagnosis only, the site resolves to "디지틀조선TV" (Digital Chosun TV), an unrelated video property, and its `sitemap.xml` is a stale 2018 auto-generated file pointing at a third domain (`dcbn.tv`). No real fashion content or discovery mechanism exists at this address today. Not sampled. |
| **Harper's Bazaar Korea** | harpersbazaar.co.kr | **ALLOWED** - `robots.txt`: `User-agent: *` -> only `/event/notice` disallowed; GPTBot/CCBot disallowed (not our identity). Sitemap: `sitemap/sitemap.xml`. Sampled. |
| **Elle Korea** | elle.co.kr | **ALLOWED** - identical robots pattern to Harper's Bazaar Korea. Sampled. |
| **Cosmopolitan Korea** | cosmopolitan.co.kr | **ALLOWED** - identical robots pattern. Sampled. |
| Marie Claire Korea | marieclairekorea.com | **ALLOWED** - standard WordPress robots (`Disallow: /wp-admin/` only). Sampled. |
| Womansense (우먼센스) | womansense.co.kr | **ALLOWED** - `Disallow: /admin/`; GPTBot disallowed only. Sampled (screened for fashion-content ratio). |
| L'Officiel Korea | lofficielkorea.com | **ALLOWED but structurally broken for this purpose** - `robots.txt` is `Allow: /` but its declared `Sitemap:` line points to `lofficielusa.com` (the wrong country edition), a real publisher config error, not an access restriction. No working Korea-specific article discovery path was found in the time budget; not sampled further this pass. |

## 5-6. Sampling and independent-confirmation-potential results

All sampling used the real production extractors (`extractEditorialMentions`, `classifyFashionRelevance`, `describeItemContexts`, `extractDirectAttributeRelations` via `scripts/audit-candidate-source.ts` and a scratch URL-list variant of it - zero DB writes, deleted after use). A real parser bug was found and fixed mid-audit (see box below) before any candidate's numbers were treated as final.

**Parser-safety finding (before-and-after honesty):** Harper's Bazaar Korea, Elle Korea, and Cosmopolitan Korea all run on the identical technical platform already used by `ESQUIRE_KR` (`/article/<id>` URLs, `atc_body_cont` body container, JSON-LD dates) - but this platform additionally embeds a site-wide "related reading" recirculation widget ("이 기사도 흥미로우실 거예요!") inside the same body container, which repeats OTHER articles' headlines verbatim on every page. A first probe pass that cut only at ESQUIRE_KR's existing markers (`관련기사` / `이 기사엔 이런 키워드`) produced 2 false-positive SHIRT+CHECK relations from the exact same recirculated headline card appearing on two unrelated Harper's Bazaar articles. Adding the widget header as a third cutoff marker removed both false positives (Harper's Bazaar: 27 -> 24 real relations; Elle: 13 -> 10; Cosmopolitan: 14 -> 14, unaffected in that sample). All numbers below are **post-fix**, and the fix is implemented in the real collector (`parseHarpersBazaarKrBody`), not just the probe script.

| Candidate | Sample | Fashion Relevant | Specific Item Rate | Direct Attribute Rate | Direct Relations | Rel/Article |
|---|---:|---:|---:|---:|---:|---:|
| **Harper's Bazaar Korea** | 20 | 18/20 (90%) | 13/20 (65%) | **8/20 (40%)** | 24 | **1.20** |
| Cosmopolitan Korea | 20 | 17/20 (85%) | 11/20 (55%) | 8/20 (40%) | 14 | 0.70 |
| Elle Korea | 20 | 11/20 (55%) | 9/20 (45%) | 4/20 (20%) | 10 | 0.50 |
| Marie Claire Korea | 20 | 9/20 (45%) | 3/20 (15%) | 2/20 (10%) | 4 | 0.20 |
| Womansense | 20 | 1/20 (5%)\* | - | 0/20 (0%) | 0 | 0.00 |

\* Womansense: a general lifestyle/culture/health/corporate-news magazine (sample topics included Frieze art fair coverage, an mRNA cancer-vaccine story, and SK Group governance news) with only occasional fashion content - correctly low fashion-relevance by composition, not a parser failure (manual spot-check of the one fashion article confirmed real extractable body text once container selection was corrected by id rather than class).

All three of Harper's Bazaar Korea, Cosmopolitan Korea, and Elle Korea far exceed every existing source's density (ESQUIRE_KR 10%, EYESMAG ~3%, HYPEBEAST_KR ~3%) and clear the task's own numeric acceptance bars outright (Direct Attribute Rate >=15%; Harper's Bazaar and Cosmopolitan both hit 40%). Per Section 12 ("select at most ONE"), **Harper's Bazaar Korea** was chosen as the strongest of the three on every axis (highest specific-item rate, highest attribute rate, highest relations/article, largest absolute sample coverage).

### Independent-confirmation check against the existing 29 bundles (pre-selection due diligence)

Checked the 20-article Harper's Bazaar Korea probe's canonical (item, attribute) pairs against all 29 existing bundles, then manually verified independence by reading full article context (not just the extractor's short evidence snippet):

| Existing bundle (before) | HB evidence found | Independence verdict |
|---|---|---|
| 체크 SHIRT (SHIRT+CHECK; Burberry EYESMAG + TDR HYPEBEAST_KR) | Article 1909247, "니트와 셔츠, 올가을엔 허리에 입으세요" (waist-tie styling feature): "화이트 티셔츠와 카키 팬츠처럼 편안한 옷차림에는 체크 셔츠를 허리에 둘러..." with shoppable callout "엔조 블루스 코튼 플란넬 체크 셔츠" | **INDEPENDENT** - a third, unrelated brand (엔조 블루스), a "how to style it" trend feature (not a drop/campaign announcement), unrelated to both existing evidence articles. |
| 니트 CARDIGAN (CARDIGAN+KNIT; Denim Tears x BBC + adidas x JENNIE, both HYPEBEAST_KR) | Article 1909318 (H&M 파인니트 가디건 shoppable callout) + Article 1909247 (니트나 카디건, styling body text with COS knitted-linen-cardigan callout) | **INDEPENDENT** - two more distinct, unrelated real products (H&M, COS), different genre (styling guide vs. drop/campaign) from both existing pieces, and from each other. |
| 레드 SKIRT (SKIRT+RED, singleton; Jacquemus "Le Bonheur" runway, EYESMAG) | Article 1909318, "올가을 레드 컬러 조합" (a red+purple vs. red+brown color-pairing styling guide): "...퍼플 니트와 레드 스커트를 상하의로 나눠 입는 식이다" | **INDEPENDENT** - generic styling advice with shoppable-product callouts, not the Jacquemus haute-couture ostrich-feather runway skirt; different genre, different outlet, ~2 months apart. |

This 3-for-3 independent-confirmation result (all real, all manually verified against full article text, none a press-release derivative or same-outlet restatement) is what justified moving to implementation rather than stopping at the probe stage.

## 7-9. Item-family coverage and new-vs-confirmation split (real 30-article collection, not just the 20-article probe)

The real production collector (`collectEditorialFeed("HARPERSBAZAAR_KR", 30, { days: 90 })`) was run for the actual pass; its output differs slightly from the 20-article probe (different article set, and the bundle-level "exact co-occurring attribute set" key groups some evidence differently than a flat relation count would suggest - see the honest disclosure below).

**A. Independent Existing-Bundle Confirmation (raw attribute-relation level, i.e. same specificItem+attributeType+attributeValue, regardless of what OTHER attribute also fired in that sentence):**

- `SHIRT + DETAIL:CHECK`: articles 2 -> 3, sources 2 -> **3** (EYESMAG, HYPEBEAST_KR, now HARPERSBAZAAR_KR all independently produced a direct CHECK+SHIRT relation).
- `SKIRT + COLOR:RED`: articles 1 -> 2, sources 1 -> **2** (EYESMAG's Jacquemus runway skirt + HARPERSBAZAAR_KR's styling-guide red skirt).
- `CARDIGAN + MATERIAL:KNIT`: articles 3 -> 6, sources 1 -> **2** (HYPEBEAST_KR's two existing products + three new distinct HARPERSBAZAAR_KR products: H&M, COS, and a third "더블 니트 가디건" from a separate HB shoes feature).

**B. New Distinct Bundles** (item+exact-attribute-set combinations that did not exist before): 11 new bundles (29 -> 40), including `화이트 SKIRT` (a genuinely new repeated, 2-independent-cluster bundle from two different HB products - a ruffled mini skirt and a frilled skirt), `니트 체크 SHIRT`, `니트 화이트 SKIRT`, `브라운 레드 SKIRT`, `스웨이드 와이드 팬츠`, `스트라이프 SHORTS`, and others (single-observation singletons, listed in the source-of-truth query, not reproduced in full here for length).

**Honest disclosure - why the display-level "체크 SHIRT" and "레드 SKIRT" bundle names did NOT gain a third/second article at the *bundle* level, even though the raw attribute relation above genuinely did:** the bundle key is "item + the *exact* set of attributes found together in one article" (frozen rule, `attribute-bundle-service.ts`, unchanged this pass). Harper's Bazaar Korea's real check-shirt sentence co-occurred `MATERIAL:KNIT` in the same evidence window ("도톰한 니트도 허리에 묶어주면 셔츠... 체크 셔츠를 허리에 둘러"), so the service correctly created a **separate** `니트 체크 SHIRT` bundle rather than merging into the existing pure-CHECK `체크 SHIRT` bundle. The same thing happened with `레드 SKIRT`: HB's red-skirt sentence sits in the same paragraph as a brown-skirt sentence in a red-vs-brown color-pairing feature, so the service correctly created a separate `브라운 레드 SKIRT` bundle. This is the frozen mechanism working exactly as designed ("attributes seen in different articles are never combined into one claim") on real, richer prose than the corpus had seen before - not a bug, and not something this pass changed. It is reported here in full because the honest headline is more nuanced than "체크 SHIRT tripled": the *raw signal* (an item+attribute pair being independently observed a third time) is real and strong, but the *dashboard label* a merchandiser would see for `체크 SHIRT` specifically stays at 2 articles/2 sources.

## 10-12. Scorecard and acceptance decision

| Metric | HARPERSBAZAAR_KR | Bar | Result |
|---|---:|---|---|
| Access | Public, robots-allowed | required | PASS |
| Direct Attribute Rate | 40% (probe) / 33% (real 30-article collection, 9/27 fashion-relevant posts) | >=10% | PASS, far exceeds |
| Independent confirmations of existing bundles | 3 raw-relation-level (CHECK+SHIRT x3 sources, RED+SKIRT x2 sources, KNIT+CARDIGAN x2 sources) | >=2 | PASS |
| New distinct bundles | 11 | >=3 | PASS |
| Decision | | | **EXCELLENT - SELECTED** |

Per Section 12, exactly one source was selected: **HARPERSBAZAAR_KR**. Elle Korea and Cosmopolitan Korea both also individually clear the acceptance bar on real data (see table in Section 5-6) and are recorded here as strong, ready candidates for a future pass, but are correctly **not implemented this pass** per the "select at most one" rule.

## 13-14. Dry run and real collection

Formal dry run (`collectEditorialFeed("HARPERSBAZAAR_KR", 20, { days: 90 })`, zero DB writes): **20/20 discovered, 20/20 within the 90-day window, 20/20 the real production path returned as candidates (18 FASHION_RELEVANT + 2 UNKNOWN, 0 NON_FASHION excluded)**, 0 HTTP anomalies, 6/20 direct-attribute-bearing, 21 direct relations, and the same 3 existing-bundle raw-relation matches found manually above (SKIRT+RED, CARDIGAN+KNIT x2, SHIRT+CHECK).

Real collection (`collect-korea-editorial.ts --source=HARPERSBAZAAR_KR --days=90 --limit-per-source=30`): **30/30 posts collected, 207 mentions written, 0 HTTP restrictions/refusals.** Port 3001 was not running before collection; port 3000 was confirmed listening (PID 9912, untouched) throughout.

## 15-16. Reparse and integrity

No reparse was required - HARPERSBAZAAR_KR's collector applies the full current mention/relation extraction pipeline at collection time (identical to ESQUIRE_KR's own collection path), and one new taxonomy-adjacent parser fix (the recirculation-widget marker) was already implemented in the real collector *before* the real 30-article run, not after.

| Check | Value |
|---|---:|
| Canonical duplicates | 0 |
| Mention duplicates | 0 |
| MarketRankingSnapshot (real) | 667 (untouched) |
| Future-dated posts | 0 |
| Missing publishedAt | 0 |
| Empty titles | 0 |
| Missing canonicalUrl | 0 |

## 17-19. Recompute and signal yield

| Metric | BEFORE | AFTER | Delta |
|---|---:|---:|---:|
| EditorialPost (real) | 283 | 313 | **+30** |
| EditorialMention (real) | 1,025 | 1,232 | **+207** |
| Direct Relation Instances | 41 | 66 | **+25** |
| Distinct Item+Attribute Pairs | 35 | 52 | **+17** |
| Bundles (total) | 29 | 40 | **+11** |
| Article-Repeated Bundles (articlePresence>=2) | 4 | 5 | **+1** (new: 화이트 SKIRT) |
| Multi-source Bundles (sourceSpread>=2) | 1 | 2 | **+1** (니트 CARDIGAN newly multi-source) |
| Bundles with >=2 Independent Evidence Clusters | 2 (체크 SHIRT, 니트 CARDIGAN) | 3 (+화이트 SKIRT) | **+1** |
| Bundles with >=2 clusters AND >=2 sources | 1 (체크 SHIRT) | 2 (+니트 CARDIGAN) | **+1** |
| Bundles with >=2 clusters AND 1 source | 1 (니트 CARDIGAN) | 1 (화이트 SKIRT replaces it in this category, since 니트 CARDIGAN moved up) | net 0, composition changed |
| Same-case Re-mention Bundles (articlePresence>=2, clusters=1) | 2 (라글란, 재활용) | 2 (unchanged) | 0 |
| Market (real) | 667 | 667 | 0 |

**Signal yield classification: HIGH.** Not because of the article count (+30, secondary per the task's own framing) but because:

1. An **existing single-source bundle became genuinely multi-source** (니트 CARDIGAN: 1 source/2 clusters -> 2 sources/**4 clusters**, now the highest independent-cluster count of any bundle in the corpus, from 3 more real, unrelated products).
2. The **primary planning signal changed for a real, evidence-backed reason** - the first time any pass in this corpus's history has actually moved the #1 signal (see Section 20).
3. A **new genuinely multi-cluster bundle** (화이트 SKIRT, 2 independent products) was created, not merely more singletons.
4. Two more existing item+attribute pairs (SHIRT+CHECK, SKIRT+RED) gained real independent cross-source relation-instance confirmation, disclosed honestly even though the bundle-display label didn't move (Section 7-9).

## 20. Current signal after this pass

Verified by calling the real, unmodified `selectPrimaryPlanningBundle(bundles)` directly (not hand-computed):

```
PRIMARY BUNDLE: 니트 CARDIGAN { item: CARDIGAN, articlePresence: 5, sourceSpread: 2, independentClusters: 4 }
```

**체크 SHIRT is no longer primary.** Exact evidence reason: both bundles tie at `bundleSourceSpread = 2` (sort criterion 1), but the sort's criterion 2 is `independentEvidenceClusterCount` descending, and 니트 CARDIGAN now has **4** independent clusters (Denim Tears x BBC, adidas x JENNIE, an H&M color-pairing feature, and a COS waist-tie feature - four unrelated real products, none same-source-and-window with another) versus 체크 SHIRT's unchanged **2**. This is the sort - untouched this pass - correctly responding to new, genuinely independent evidence. 체크 SHIRT still ranks #2 (ahead of every remaining bundle), and 라글란 시퀸 긴팔 티셔츠 (1 cluster) is confirmed still ranking behind both, per the updated real-data assertions in `scripts/smoke-test.ts`.

Confirmed rendering through the existing, unmodified UI: the home page (`/`) lists 니트 CARDIGAN ahead of 체크 SHIRT in its real HTML output, and `/items/CARDIGAN` shows HARPERSBAZAAR_KR as a contributing source - zero markup/layout/component changes were made to produce this.

## 21. Roundup heuristic regression

One real interaction was found and is disclosed rather than silently accepted: the `니트 CARDIGAN` bundle's 5 evidence articles trace to 4 clusters, not 5, because two same-source Harper's Bazaar Korea articles ("올가을 레드 컬러 조합...", 09-08, roundup-shaped by breadth - it touches SKIRT/CARDIGAN/WIDE_PANTS/SHORTS, i.e. >=3 distinct items - and "도심에서 마주한 벨라우영, 다샤의 올가을 슈즈", 09-02, a shoes feature) sit within the 7-day `SAME_CASE_WINDOW_DAYS` and were absorbed into one cluster by the existing, unmodified heuristic. Manually checking both articles' actual subjects (a color-pairing styling guide vs. a shoes feature) suggests these are plausibly two genuinely different cases that the source-and-timing-only heuristic cannot distinguish without entity-level matching - the same accepted limitation already documented in `EDITORIAL_SIGNAL_TRUST_AUDIT.md`'s original design (no brand/entity matching, by deliberate scope decision). This is **not a new defect introduced by this source** and **not a false merge of two unrelated dedicated articles via a hub** (the specific transitive-merge bug already fixed and regression-tested) - it is the known, tested, accepted single-hop absorption model doing what it was built to do. No change was made to the trust logic this pass, per the task's explicit instruction.

## 22. Source contribution

| Source | Bundles (any evidence) | Repeated Bundle Contributions | Independent Repeated Contributions | Multi-source Independent Contributions |
|---|---:|---:|---:|---:|
| EYESMAG | 17 | 1 | 1 | 1 |
| HYPEBEAST_KR | 11 | 4 | 2 | 2 |
| **HARPERSBAZAAR_KR** | **12** | **2** | **2** | **1** |
| ESQUIRE_KR | 1 | 0 | 0 | 0 |
| VISLA | 1 | 0 | 0 | 0 |
| NONLABEL | 0 | 0 | 0 | 0 |

HARPERSBAZAAR_KR immediately became the corpus's **second-most-productive source for independently-repeated evidence**, ahead of ESQUIRE_KR and VISLA (both still at zero repeated/independent contribution after two prior passes), and is the only source besides HYPEBEAST_KR to touch a genuinely multi-source-independent bundle.

## 23. Dimension contribution

| Dimension | Relation Instances | Bundles containing it | Independent Repeated Bundles (>=2 clusters) | Multi-source Independent Bundles |
|---|---:|---:|---:|---:|
| MATERIAL | 28 | 15 | 1 (니트 CARDIGAN) | 1 |
| DETAIL | 22 | 14 | 1 (체크 SHIRT) | 1 |
| COLOR | 25 | 14 | 1 (화이트 SKIRT) | 0 |
| STYLE | 7 | 6 | 0 | 0 |
| SILHOUETTE | N/A | N/A | N/A | N/A |
| FINISH | N/A | N/A | N/A | N/A |

(`SILHOUETTE`/`FINISH` remain outside Editorial's own attribute-type union, correctly reported as not applicable rather than zero, per the prior pass's precedent.) HARPERSBAZAAR_KR is the sole source of the corpus's first-ever COLOR-dimension independent-repeated bundle (화이트 SKIRT) - COLOR previously had 0 repeated bundles despite reasonable instance counts.

## 24. Attribute misses (report only, not implemented)

`audit-missed-attribute-vocabulary.ts` re-run against the full 313-post corpus surfaced one recurring, crystal-clear pattern from HARPERSBAZAAR_KR not currently in the taxonomy:

| Candidate | Dimension | Articles | Sources | Example | Potential Relations |
|---|---|---:|---:|---|---|
| 레오퍼드 (leopard print) | DETAIL | 1 (this pass) | 1 (HARPERSBAZAAR_KR) | "레오퍼드 패턴의 토트백" | TOTE_BAG + DETAIL:LEOPARD |

Only one article-source pair was found this pass (below a confident 1-3 addition threshold on its own), so per Section 24 it is reported only, not added. Everything else the audit surfaced (와이드 데님/WIDE_PANTS length descriptions, brand names, connective phrases) did not meet the crystal-clear bar.

## 25. UI frozen

No CSS, layout, or component file was touched. The new source's evidence was confirmed rendering through the existing, unmodified `/`, `/editorial`, and `/items/[itemType]` pages (see Section 20).

## 26. Product Reference freeze

Untouched this pass - `object-relations.ts`/`attributes.ts` import only `frozen-editorial-vocabulary.ts`, never `attribute-bundle-service.ts` or `rss.ts`. The frozen regression assertion in `scripts/smoke-test.ts` (`frozenEditorialRules.length === 57`, 58/120 item-bearing) passed unchanged as part of the full suite run after this pass's changes.

## 27. Data safety

- MarketRankingSnapshot (real): **667**, confirmed unchanged before and after collection.
- No Prisma migration; no schema change.
- `prisma/dev.db` is gitignored - this pass's data lives only in the local SQLite file, not in git.

## 29. Validation

- `npx tsc -b --noEmit`: **PASS**
- `npx tsx scripts/smoke-test.ts`: **PASS**, including new HARPERSBAZAAR_KR sitemap/body/article-page parser fixtures (sitemap filtering of daily-touched static pages, the new three-marker body cutoff including the recirculation-widget regression guard, canonical/date/image parsing) and two new real-sentence direct-relation fixtures (SHIRT+CHECK and CARDIGAN+KNIT, matching the real independent-confirmation evidence above), plus updated real-data primary-bundle assertions reflecting the new, correct 니트 CARDIGAN-is-primary state.
- `npm run build`: **PASS**. Required routes present: `/`, `/editorial`, `/items`, `/items/[itemType]`, `/market`.
- Routes checked on a locally started production server, port 3001 (stopped immediately after): `/` 200, `/editorial` 200, `/items` 200, `/items/CARDIGAN` 200, `/items/SHIRT` 200, `/market` 200. Port 3000 (PID 9912) confirmed listening and untouched throughout.
- Product Reference frozen regression: unchanged (58/120 item-bearing, 57 frozen rules), re-verified as part of the same full smoke-test run.

## Next bottleneck

**MIXED, leaning toward "which existing high-quality sources still have unsampled headroom" rather than "no more sources exist."** This pass found not one but *three* candidates (Harper's Bazaar Korea, Cosmopolitan Korea, Elle Korea) on the same technical platform that individually clear the acceptance bar - Elle Korea and Cosmopolitan Korea remain unimplemented only because Section 12 caps a single pass at one source, not because they are weak. The single next-best action is to **run the identical real-collection-and-recompute cycle this pass just ran for HARPERSBAZAAR_KR on Cosmopolitan Korea next** (already access-checked, already probe-sampled at 40% Direct Attribute Rate, same parser platform/fix already implemented and reusable) - it is the most concretely de-risked follow-up available, ahead of screening entirely new domains.
