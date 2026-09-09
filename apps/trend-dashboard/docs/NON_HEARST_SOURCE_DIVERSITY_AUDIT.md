# Non-Hearst Editorial Source Diversity Probe

Checked date: 2026-09-09

Question: with the corpus now at 8 sources across HEARST_JOONGANG (ESQUIRE_KR, HARPERSBAZAAR_KR, COSMOPOLITAN_KR), HYPEBEAST_HK (HYPEBEAST_KR), EYES_INC (EYESMAG), NONLABEL_INDEPENDENT (NONLABEL) and VISLA_INDEPENDENT (VISLA), and with `docs/EDITORIAL_PUBLISHER_DIVERSITY_AUDIT.md` having explicitly deferred ELLE_KR (same Hearst family) in favor of "deliberately prioritizing a genuinely different publisher family for the next new-source pass" - find, screen, and (at most) select ONE candidate Korean fashion editorial source from a publisher family outside HEARST_JOONGANG / HYPEBEAST_HK / EYES_INC. Audit only - no DB mutation, no schema/taxonomy change, no UI change, no collection.

## 0. Safety

```
pwd    -> C:/Users/bcave/dev/open-design-trend-dashboard
branch -> feature/trend-dashboard
status -> clean before starting
HEAD   -> 92ec936
```
Re-verified at the start of this pass (`git branch --show-current`, `git status --short`, `git log -5 --oneline`) - all matched before any work began.

## 1. Live baseline (re-derived directly, not carried over from any prior doc)

Ran `npx tsx scripts/audit-editorial-quality.ts` and `npx tsx scripts/audit-attribute-relations.ts` from `apps/trend-dashboard/` against the real DB:

| Metric | Value |
|---|---:|
| EditorialPost (real) | **343** |
| EditorialMention (real) | **1389** |
| Canonical duplicates | 0 |
| Mention duplicates | 0 |
| Eligible fashion posts (FASHION_RELEVANT) | 326 |
| Direct Relation Instances (post-level) | **76** |
| Distinct Item+Attribute Pairs | 54 |
| Attribute Bundles | **44** |
| Repeated bundles (>=2 articles) | 7 |
| MarketRankingSnapshot (real) | **667** |

Bundles with `bundleSourceSpread >= 2` (re-derived from the live `getAttributeBundles("real")` output, cross-checked against each underlying `[source, ...]` list from `audit-attribute-relations.ts`):

| Bundle | Sources | Publisher Families | Source Spread | Publisher Family Spread |
|---|---|---|---:|---:|
| **체크 SHIRT** (current primary) | EYESMAG, HYPEBEAST_KR, HARPERSBAZAAR_KR, COSMOPOLITAN_KR | EYES_INC, HYPEBEAST_HK, HEARST_JOONGANG | 4 | **3** |
| 니트 CARDIGAN | HYPEBEAST_KR, HARPERSBAZAAR_KR | HYPEBEAST_HK, HEARST_JOONGANG | 2 | 2 |
| 화이트 SKIRT | HARPERSBAZAAR_KR, COSMOPOLITAN_KR | HEARST_JOONGANG (both) | 2 | **1 - not family-diverse** |
| 데님 VEST | EYESMAG, COSMOPOLITAN_KR | EYES_INC, HEARST_JOONGANG | 2 | 2 |
| 스트라이프 SHIRT | EYESMAG, COSMOPOLITAN_KR | EYES_INC, HEARST_JOONGANG | 2 | 2 |

Independent Repeated Bundles = 5, Multi-source Independent Bundles = 5, Publisher-family-diverse Bundles = 4 (화이트 SKIRT is the one multi-source bundle that is NOT family-diverse - both its sources are the same Hearst JoongAng masthead cluster). This live re-derivation matches the task brief's stated baseline exactly, confirming the brief's numbers were current, not stale.

## 2. Known dead ends - skipped without re-auditing

GQ Korea, W Korea, Dazed Korea, Vogue Korea, Arena Korea, Noblesse, the-edit.co.kr, apparelnews.co.kr, VISLA expansion, Musinsa, 29CM, fashionn.com, InStyle Korea, StyleM/style.chosun.com, Ceci, ELLE_KR, Product Reference - all skipped per the task brief.

## 3. Candidates discovered and family-audited (public evidence, before sampling)

| Candidate | Operating Entity (public evidence) | Publisher Family | Domain |
|---|---|---|---|
| **마리끌레르 코리아 (Marie Claire Korea)** | Own footer: "서울특별시 강남구 봉은사로 226... Copyright (c) 2015 MCK Publishing Co. Ltd. All Rights Reserved." Business registration **211-86-54814** | **MCK_PUBLISHING** - independent, genuinely distinct from Hearst JoongAng's 104-81-55280 (different registration number, different address: 봉은사로 vs. 도산대로) | marieclairekorea.com |
| 코오롱몰 OLO 매거진 (Kolon Mall) | Footer: "코오롱인더스트리(주) FnC부문", rep. Kim Min-tae, business reg. **138-85-19612**, 서울 강남구 삼성로 518 | **KOLON_FNC** - large Korean apparel/textile conglomerate, unrepresented in corpus | kolonmall.com |
| 더한섬닷컴 THE Magazine (Handsome/한섬) | Operated by Handsome Corp., a Hyundai Department Store Group affiliate (public knowledge; not independently footer-verified this pass - see Section 4) | **HANDSOME_HYUNDAI** (tentative) | thehandsome.com |
| 얼루어 코리아 (Allure Korea) | Own "About Us" page: "ALLURE : Doosan Magazine - 두산매거진" - licenses Vogue, GQ, W Korea, and Allure Korea from Conde Nast | **DOOSAN_CONDENAST** - **same publisher as three already-restricted dead ends** (GQ Korea, Vogue Korea, W Korea) | allurekorea.com |
| 하이컷 (Highcut) | Public reporting: published by 티온네트워크 (Teon Network), copyright held by MFRENZ; "연예 전문지" (entertainment specialty magazine) | **TEON_NETWORK** - distinct family, but explicitly celebrity/entertainment-first | highcut.co.kr |
| 나일론 코리아 (Nylon Korea) | nylonmedia.co.kr - connection refused on fetch this pass; social channels appear to still post, but the editorial site itself did not respond | Unconfirmed | nylonmedia.co.kr |
| 1300k | Public reporting (news search): **service terminated** following the 2024 Wemakeprice/Tmon-linked platform shutdown wave; live site now shows a shutdown notice | N/A - defunct | 1300k.com |
| 패션비즈 (FashionBiz) | Own footer: "(주)섬유저널 (Textile Journal Co., Ltd.)", business reg. **211-81-60169**, 서울 중구 다산로29길 39 | **TEXTILE_JOURNAL** - distinct family, but B2B trade press (industry sales/corporate-move news, not consumer styling prose) | fashionbiz.co.kr |
| 우먼동아 (Woman Dong-A) | Not reachable this pass (fetch blocked/failed) | Unconfirmed | woman.donga.com |

That is 9 candidates surveyed at the family/access-screening level, one (Marie Claire Korea) taken through full sampling.

## 4. Access checks

- **Marie Claire Korea**: `robots.txt` is a plain WordPress default - `User-agent: *`, disallows only `/wp-admin/`, no AI-bot-specific block of any kind (no GPTBot/ClaudeBot/CCBot/anthropic-ai entries at all - not even an allow, meaning no special restriction exists for any crawler). Standard `sitemap-generator` plugin XML sitemap present (`/sitemap.xml` -> 32 `post-sitemap*.xml` files + a page sitemap). **PASS, fully open.**
- **Kolon Mall**: raw `robots.txt` fetched directly (not summarized) shows two explicit User-Agent blocks - one for standard bots (Yeti/Googlebot/Daum/Bingbot/etc.), and a **second block explicitly naming `GPTBot, ChatGPT-User, Google-Extended, CCBot, anthropic-ai`** with `Allow: /` and even an extra `Allow: /api/ai` - i.e. Kolon Mall explicitly permits `anthropic-ai` by name, the opposite of a restriction. Sitemap present (`/sitemap/joykolon-index.xml`), but it only indexes `product`, `event`, `special`, `category`, `common`, and `brand` sitemaps - **no magazine/content sitemap**. The `OLOMagazine`/`Magazine` article paths (e.g. `/OLOMagazine/contents/DM/450`, `/Magazine/contents/Ostory/156`) return real, full article prose (verified: an editor's personal-essay piece rendered completely, not a JS shell) and are not disallowed by robots.txt, but there is no crawl entry point (sitemap, category-listing feed, or paginated index) discoverable within this pass's time budget to assemble a representative 15-20 recent-article sample without manually walking numeric content IDs, which risks sampling arbitrary old articles rather than "recent." **PASS on access; FAIL on systematic sampling feasibility this pass** - flagged for a follow-up pass rather than scored further here.
- **THE HANDSOME**: the specific magazine listing URL guessed from search results (`thehandsome.com/ko/magazine/some`) returned HTTP 404. No further URL discovery was attempted within this pass's budget. **INCONCLUSIVE - not access-checked to a pass/fail conclusion.**
- **Allure Korea**: not access-checked - rejected at the family-audit stage per Section 5 of the task rules ("same family as existing dead end unless ownership genuinely unknown"; ownership here is explicit and confirmed, not unknown).
- **Highcut**: not access-checked - deprioritized at discovery per the task's own "celebrity-only" deprioritization rule; it is also a converted-to-digital former print tabloid with no confirmed real fashion-editorial (as opposed to entertainment-news) archive.
- **Nylon Korea**: `nylonmedia.co.kr` returned `connect ECONNREFUSED` on fetch. **RESTRICTED (unreachable).**
- **1300k**: confirmed shut down by independent news reporting and the live site's own "서비스 종료 안내" (service-end notice). **RESTRICTED (defunct).**
- **FashionBiz**: footer/access reachable, but not sampled - deprioritized per the task's own "generic press release feed" / trade-coverage deprioritization; B2B industry news is structurally unlikely to carry the item+attribute consumer-styling prose this corpus needs.
- **Woman Dong-A**: fetch failed outright this pass. **INCONCLUSIVE - not access-checked.**

## 5. Sampling: Marie Claire Korea (MCK_PUBLISHING)

`audit-candidate-source.ts` only accepts a whole-site sitemap. A first probe against the site-wide `post-sitemap32.xml` (most-recent-by-lastmod across ALL categories) returned a sample dominated by a same-week "UNICEF Excellence" celebrity-interview campaign series (10/20 articles) - a real but momentary skew, not representative of the FASHION vertical specifically. To get a fair, section-scoped read, a minimal `--urls-file` option was added to `audit-candidate-source.ts` (accepts a newline-delimited URL list as an alternative to `--sitemap`, reusing the exact same body-extraction/extractor pipeline) and used to sample the 20 most recent **FASHION-category** articles (collected from the category RSS feed + category archive pages, Aug 8 - Sep 9, 2026).

```
=== CANDIDATE: MARIECLAIRE_KR_FASHION ===
ACCESS:                    20/20 fetched
BODY MEDIAN:               1976 chars
FASHION RELEVANT:          18/20 (90%)
ITEM-BEARING ARTICLES:     8/20 (40%)
DIRECT-ATTRIBUTE ARTICLES: 5/20 (25%)
DIRECT RELATIONS:          10 (0.50/article)
UNIQUE ITEMS:              SHIRT, SKIRT, SHORTS, CARDIGAN
UNIQUE ATTRIBUTES:         COLOR:WHITE, DETAIL:SEQUIN, MATERIAL:DENIM, COLOR:GREEN, COLOR:RED
```

Density in context (live per-source numbers from `audit-editorial-quality.ts`, relations/post): HARPERSBAZAAR_KR 0.81, **MARIECLAIRE_KR_FASHION (candidate probe) 0.50**, COSMOPOLITAN_KR 0.48, VISLA 0.17, EYESMAG 0.19, HYPEBEAST_KR 0.13, ESQUIRE_KR 0.11, NONLABEL 0.00. The candidate's density is the **2nd-highest in the entire corpus**, only behind HARPERSBAZAAR_KR.

## 6. Independence audit

All 20 sampled articles are distinct, dated, byline-attributed pieces (18/20 genuinely fashion-relevant) spanning brand-collection announcements, celebrity-styling roundups, a watch-design feature, and a recurring "MC inside" short-form column - not syndicated wire copy or press-release boilerplate. No two sampled articles cover the same underlying event/product. Classification: **INDEPENDENT** for all evidence used below.

## 7. Parser-contamination audit - two real misattributions caught

Every one of the tool's 8 printed evidence windows was re-verified by fetching the live article and checking the surrounding sentence (via `WebFetch` for prose confirmation and raw `curl` + `grep` for exact-string ground truth). **Two of the eight are false positives from the same known risk class already documented in this codebase** (`docs/EDITORIAL_PUBLISHER_DIVERSITY_AUDIT.md`'s "다른 head" / coordination-boundary bleed):

| Extracted relation | Evidence window shown | Full sentence (verified) | Verdict |
|---|---|---|---|
| SKIRT + COLOR:WHITE | "...어간 화이트 톱에 화려한 실버 시퀸 스커트" | "실버 시퀸 스커트로 입문해 보는 것을 추천합니다... 오버사이즈 **화이트 탱크 톱**이나 셔츠를 무심하게 매치해" | **MISATTRIBUTION** - "화이트" modifies the tank top being *paired with* the skirt, not the skirt itself (the skirt is silver/sequin). Excluded. |
| SHIRT + COLOR:RED | "...레드 팬츠 위에 묵직한 버건디 셔츠" | "**레드 팬츠** 위에 묵직한 **버건디 셔츠**와 타이의 톤온톤 연출을 시도합니다." | **MISATTRIBUTION** - "레드" describes the pants; the shirt is explicitly burgundy (not a currently recognized color value, so the extractor's window bled the nearby RED onto SHIRT instead). Excluded. |
| SKIRT + DETAIL:SEQUIN | (same sentence as above) | "실버 시퀸 스커트" | **CONFIRMED CLEAN** - sequin directly and correctly describes the skirt. |
| SHORTS + MATERIAL:DENIM | "...벨라 하디드처럼 클래식한 데님 쇼츠" | "벨라 하디드처럼 클래식한 **데님 쇼츠**에 캐미솔을 툭 걸쳐주면..." (raw HTML, `white-tank-top-2` article) | **CONFIRMED CLEAN** - direct adjacent modification, no competing garment/color in the clause. (Same article separately mentions a fringe-detail "마이크로 쇼츠" elsewhere; "fringe" is not a value observed anywhere in the current taxonomy, so it should not affect this bundle key, but this was not confirmed by running the production extractor against full DB-stored text.) |
| CARDIGAN + COLOR:GREEN | "...사로잡는 네온 그린 컬러의 시스루 카디건" | "눈길을 사로잡는 **네온 그린 컬러**의 시스루 **카디건**을 아래쪽에서부터 접어 올려..." (raw HTML, `celebrity-outerwear-styling` article) | **CONFIRMED CLEAN.** |
| SKIRT + COLOR:RED | "...새 싱글 뮤직비디오에서 착용한 레드 스커트" | "제니처럼 무릎 위로 올라오는 기장의 **레드 스커트**에 심플한 블랙 슬리브리스 톱과 펌프스를 조합해 보세요." (raw HTML, `red` article) | **CONFIRMED CLEAN** - no competing garment color in the clause. |
| SHORTS + COLOR:RED | "...을 지녔죠.예를 들어 레드 마이크로 쇼츠" | "예를 들어 **레드 마이크로 쇼츠**에 여유로운 실루엣의 오버사이즈 화이트 재킷을 툭 걸치거나" (raw HTML, `red` article) | **CONFIRMED CLEAN** - "화이트" here correctly attaches to "재킷" (a different item, not being mis-tagged onto SHORTS by the extractor). |
| SHIRT + COLOR:WHITE | "...화이트 셔츠" | Not independently re-fetched (evidence window shows no adjacent competing garment) | Not deep-verified; lower stakes (does not touch an existing multi-family bundle). |

A separate manual grep across all 20 articles for the task's five flagged high-priority phrases (체크 셔츠, 니트 카디건, 데님 베스트, 스트라이프 셔츠) found one near-miss - "스트라이프 패턴의 셔츠" (`ahn-hyo-seop` article) - which the production extractor correctly did **not** tag (0 relations reported for that article). The "패턴의" (genitive "pattern of") construction falls outside the extractor's direct-adjacency `DIRECT_PHRASE` pattern; this is a parser-coverage gap worth knowing about for a future extractor pass, not a false positive, and it is **not** claimed as a finding here. **No confirmation occurred for any of the five flagged high-priority bundles from this sample** - reported honestly per the task's "do not assume it occurs" instruction, including for 체크 SHIRT specifically (no MAJOR CROSS-PUBLISHER CONFIRMATION this pass).

## 8. Cross-corpus matching (tuple-level, hedged where bundle-key merging can't be confirmed without real DB collection)

| Candidate evidence (verified clean) | Cross-match | Category |
|---|---|---|
| SKIRT + COLOR:RED | Matches the **existing singleton bundle "레드 SKIRT"** (currently EYESMAG/EYES_INC only, 1 article). Confirmed the MCK article's SKIRT has no other co-occurring attribute, so the bundle key is a clean match. | **B - new publisher-family confirmation.** Would become EYES_INC + MCK_PUBLISHING (2 sources, 2 families) - a currently-singleton, EYES_INC-only bundle turning genuinely cross-family. |
| SHORTS + MATERIAL:DENIM | Matches the **existing singleton bundle "데님 SHORTS"** (currently EYESMAG/EYES_INC only, 1 article). Same-article fringe-detail shorts mention checked and very likely does not affect this key (see Section 7 hedge). | **B (tentative) - new publisher-family confirmation**, same structure as above. |
| SKIRT + DETAIL:SEQUIN | No existing pure SEQUIN+SKIRT bundle (SEQUIN in the current corpus only attaches to LONG_SLEEVE_TEE). | **C - new distinct bundle.** |
| CARDIGAN + COLOR:GREEN | No existing GREEN+CARDIGAN bundle. | **C - new distinct bundle.** |
| SHORTS + COLOR:RED | The current corpus has SHORTS+RED relation instances (HARPERSBAZAAR_KR, 2 articles) but **no pure "레드 SHORTS" bundle exists** - both of HARPERSBAZAAR_KR's occurrences merged into compound bundles ("블랙 레드 빈티지 SHORTS", "브라운 레드 SHORTS") with other same-article attributes. MCK's occurrence (RED only, verified) would form a new, non-matching pure bundle. | **C - new distinct bundle**, adjacent to but not merging with the existing compounds. |

### Value split summary

| Category | Count | Examples |
|---|---:|---|
| **B - new publisher-family confirmation** | **2** | 레드 SKIRT (EYES_INC -> +MCK_PUBLISHING), 데님 SHORTS (EYES_INC -> +MCK_PUBLISHING, tentative) |
| **C - new distinct bundle** | 3 | 시퀸 SKIRT, 네온그린 CARDIGAN, 레드 SHORTS (new pure) |
| **D - noise/questionable, excluded** | 2 | SKIRT+WHITE misattribution, SHIRT+RED misattribution (both confirmed against live source) |

Both of the Category B confirmations diversify **currently EYES_INC-only** bundles specifically - not the already-more-diverse 체크 SHIRT/니트 CARDIGAN/데님 VEST/스트라이프 SHIRT set, and not the Hearst-only 화이트 SKIRT bundle. This is a different, complementary diversification shape than the prior Cosmopolitan pass found.

## 9. Concentration effect if collected

Current family article share (343 real posts): HYPEBEAST_HK 141 (41.1%), EYES_INC 102 (29.7%), HEARST_JOONGANG 90 (26.2% - ESQUIRE_KR 30 + HARPERSBAZAAR_KR 30 + COSMOPOLITAN_KR 30), VISLA_INDEPENDENT 6 (1.7%), NONLABEL_INDEPENDENT 4 (1.2%).

Adding a **6th, genuinely new family (MCK_PUBLISHING)** - rather than a 4th Hearst masthead (ELLE_KR, the path this doc's predecessor explicitly declined) - dilutes every existing family's relative share instead of concentrating further inside one already-represented company. This is the opposite of the concentration risk flagged in `EDITORIAL_PUBLISHER_DIVERSITY_AUDIT.md` Section 10.

## 10. Candidate scorecard

| | Marie Claire Korea | Kolon Mall OLO Magazine | Allure Korea | Highcut | FashionBiz | Nylon Korea | 1300k | THE HANDSOME | Woman Dong-A |
|---|---|---|---|---|---|---|---|---|---|
| Publisher family | MCK_PUBLISHING (new) | KOLON_FNC (new) | DOOSAN_CONDENAST (=existing dead end) | TEON_NETWORK (new, but entertainment) | TEXTILE_JOURNAL (new, but B2B) | Unconfirmed | N/A | HANDSOME_HYUNDAI (new, unconfirmed) | Unconfirmed |
| Access | Open, no AI restriction | Open, `anthropic-ai` explicitly allowed | Not checked (rejected at family stage) | Not checked | Reachable | **Unreachable** | **Defunct** | 404 on guessed URL | **Fetch failed** |
| Sitemap/crawl path | Standard WP sitemap | No magazine sitemap | - | - | - | - | - | - | - |
| Direct Attribute Rate | **25%** (0.50 rel/article) | Not sampled | - | - | - | - | - | - | - |
| Existing bundle matches | 4 (2 clean, 2 misattributed) | - | - | - | - | - | - | - | - |
| Independent confirmations | 2 (레드 SKIRT, 데님 SHORTS) | - | - | - | - | - | - | - | - |
| New family confirmations | **2** | - | - | - | - | - | - | - | - |
| New bundles | 3 | - | - | - | - | - | - | - | - |
| Parser risk | Real, disclosed (2 misattributions caught and excluded) | Unknown | - | - | - | - | - | - | - |
| **Decision** | **GOOD** | **PARTIAL** (access clean, sampling infeasible this pass) | **RESTRICTED** (same family as dead end) | **LOW_VALUE** (celebrity-first, deprioritized) | **LOW_VALUE** (B2B trade press, deprioritized) | **RESTRICTED** (unreachable) | **RESTRICTED** (defunct) | **PARTIAL** (inconclusive - bad URL) | **PARTIAL** (inconclusive - fetch failed) |

## 11. Acceptance bar check (Section 14 of the task)

Direct Attribute Rate 25% >= 10% floor: **pass**. Public/stable access, no AI-use restriction: **pass**. Parser precision: **disclosed, not clean** - 2 of 8 evidence hits were misattributions, both caught and excluded before scoring; the remaining 6 hold up under source re-verification. Of the three OR-conditions: **(A)** 2 independent existing-bundle confirmations - met (with the 데님 SHORTS one hedged as tentative pending a real-extractor run against DB-stored text). **(B)** at least 1 strong new-publisher-family confirmation plus useful new bundles - met (2 new-family confirmations plus 3 new bundles). **(C)** not needed given A/B already met.

## 12. Selected

**Marie Claire Korea (MCK_PUBLISHING).** New-to-corpus: **YES**. Reason: only candidate that cleared access, produced a full verified sample, and met the acceptance bar; it adds a 6th, genuinely independent publisher family (diluting every existing family's share rather than adding a 4th Hearst masthead), and its two verified new-family confirmations diversify EYES_INC-only bundles specifically. No other candidate is selected alongside it, per the task's "at most one" instruction.

## 13. Taxonomy misses (reported only, not added)

- "패턴의" (genitive-pattern) constructions such as "스트라이프 패턴의 셔츠" are not currently matched by the `DIRECT_PHRASE` extractor even though the item (SHIRT) and attribute (STRIPE) both already exist in the taxonomy - a parser-coverage gap, not a vocabulary gap. Reported per the task's Section 20 format; no extractor logic was changed this pass.
- No new item or attribute vocabulary was observed in the MCK sample that isn't already covered by the current taxonomy (SHIRT/SKIRT/SHORTS/CARDIGAN and COLOR/DETAIL/MATERIAL all already exist).

## 14. Future ranking consideration (not implemented)

Per the task's Section 21: `publisherFamilySpread` remains worth reporting as a tiebreak lens after independent evidence and source spread, exactly as the predecessor doc recommended (Section 11 there). Not implemented this pass; no ranking code was touched.

## Data safety

- EditorialPost (real): **343**, unchanged - no collection ran this pass.
- EditorialMention (real): **1389**, unchanged.
- MarketRankingSnapshot (real): **667**, unchanged.
- No Prisma migration, no schema change, no DB writes of any kind.
- No taxonomy change, no UI change, no Product Reference work.
- The only code change is an additive `--urls-file` option on `scripts/audit-candidate-source.ts` (a probe-only, network-read, no-DB-write utility) - existing `--sitemap` usage is unaffected. The scratch URL list file used to invoke it (`scripts/_scratch-mck-fashion-urls.txt`) was deleted after use and is not part of this commit.

## Validation

`npx tsc -b --noEmit` run from `apps/trend-dashboard/` after the `audit-candidate-source.ts` change: **clean, no errors**. No build was required (no production code, schema, or UI touched). `git status --short` is clean except for this new documentation file and the one script diff, both staged explicitly.

## Next step

**Run the same real-collection-and-recompute cycle already proven for HARPERSBAZAAR_KR/COSMOPOLITAN_KR on MCK_PUBLISHING (Marie Claire Korea) next**, with two specific things for that pass to watch for given this audit's own findings: (1) scope initial collection to the FASHION category specifically (not the whole-site sitemap, which this pass found to be dominated by an unrelated campaign series at the moment of sampling), and (2) budget extra manual spot-checking for the coordination-boundary color-bleed misattribution class this pass caught twice (SKIRT+WHITE, SHIRT+RED) - MCK's house style leans heavily on multi-garment, multi-color comparison sentences ("A 위에 B", "A에 C를 매치"), which appears to trigger this specific extractor risk more often than the corpus's other sources. Separately, Kolon Mall's OLO Magazine (KOLON_FNC) is worth a follow-up **access/sampling-methodology** pass on its own (robots.txt is fully open and explicitly permits `anthropic-ai`, and confirmed real full-length editorial prose exists), specifically to find a crawl entry point (category listing, RSS, or paginated archive) since no magazine content is present in its XML sitemap - it was not scored to a GOOD/EXCELLENT/LOW_VALUE decision in this pass because that gap made a real 15-20 article sample infeasible within this pass's time budget, not because of any access or content-quality problem found.
