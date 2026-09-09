# Marie Claire Korea Real Collection + Cross-Publisher Signal Pass

Checked date: 2026-09-09

Continuation of `docs/NON_HEARST_SOURCE_DIVERSITY_AUDIT.md`, which selected Marie Claire Korea (MCK_PUBLISHING) as the next real editorial source - a 7th, genuinely independent publisher family (distinct from HEARST_JOONGANG/HYPEBEAST_HK/EYES_INC/NONLABEL_INDEPENDENT/VISLA_INDEPENDENT) - and disclosed 2 real parser misattributions from "coordination-boundary COLOR bleed" that had to be fixed before real collection. This pass: (1) fixed those misattributions with one general parser rule, (2) real-collected 30 Marie Claire Korea articles, (3) verified the resulting cross-publisher signal gain against the live, unmodified bundle-ranking service. No DB migration, no schema change, no taxonomy change, no UI change, no Product Reference feature work.

**Process note:** this pass's real work (the parser fix, its regression tests, and the real 30-article collection) was actually done by an earlier background run that was cut off by a session rate limit mid-way through computing final signal metrics, before writing this document or committing. This document's continuation re-verified that prior work from scratch (independent `typecheck`/`test`/`build` runs, a fresh live-DB metrics recomputation via the real `getAttributeBundles`/`selectPrimaryPlanningBundle` service functions, a fresh route/port check, and a body-coverage spot-check) rather than trusting its own summary, then completed the remaining sections and the commit.

## 0. Safety

```
pwd    -> C:/Users/bcave/dev/open-design-trend-dashboard
branch -> feature/trend-dashboard
status -> clean before starting
HEAD   -> 2ecfd5f
```

Re-verified at the start of the continuation session. `prisma/dev.db*` is gitignored, so the real DB collection below never appears in `git status`/`git diff` - only the 4 source files below do.

## 1. Live baseline (re-derived, both before continuation and independently re-confirmed)

Before any of this pass's work (captured by the parent session before delegating, from `npx tsx scripts/audit-editorial-quality.ts`): EditorialPost 343, EditorialMention 1389, Canonical duplicates 0, Mention duplicates 0, MarketRankingSnapshot 667, Bundles 44, per-source posts summing to 343 (COSMOPOLITAN_KR 30, ESQUIRE_KR 30, EYESMAG 102, HARPERSBAZAAR_KR 30, HYPEBEAST_KR 141, NONLABEL 4, VISLA 6). Matches the task brief exactly.

## 2. Reused probe implementation

No source modules duplicated. Reused: the FASHION-category listing-discovery approach from the probe (adapted into a real, paginated `?paged=N` RSS collector - the probe's ad hoc `--urls-file` scratch list is not part of the real collector); the probe's JSON-LD `articleBody` extraction pattern (already the platform-standard approach used by every other real collector in `rss.ts`); the probe's canonical-URL and `datePublished`-as-authoritative-window-check pattern (same as `collectCosmopolitanKr`/`collectHarpersBazaarKr` etc.); the existing `extractEditorialMentions`/`classifyFashionRelevance`/`inferEditorialGender` pipeline unchanged.

## 3. Fixing the two color-bleed misattributions

Both cases (re-verified against the live MCK articles, not from memory of the probe doc):

| # | Article | Evidence context | False relation | Why COLOR crossed the wrong boundary | Expected |
|---|---|---|---|---|---|
| 1 | `화이트 탱크 톱 스타일링과 체형별 추천 디자인 가이드` | "...화이트 탱크 톱에 화려한 실버 시퀸 스커트를 매치했죠." | SKIRT + COLOR:WHITE | 화이트 modifies 톱 (a companion garment PAIRED WITH the skirt via 에 + 매치했죠), not the skirt two nouns later. The existing `CLAUSE_BOUNDARY` list already catches `매치해`/`매치하여`/`매치하고` but not the bare noun-`에` pairing marker itself, which sits on the WRONG side (before, not after, the coordinating verb) of a backward-only modifier window. | No SKIRT + COLOR:WHITE relation; SKIRT + DETAIL:SEQUIN must still fire (그 뒤 시퀸 modifier is genuinely adjacent to 스커트). |
| 2 | `가을맞이 홈웨어 스타일링 3가지` (레드/버건디 톤온톤 기사) | "레드 팬츠 위에 묵직한 버건디 셔츠와 타이의 톤온톤 연출을 시도합니다." | SHIRT + COLOR:RED | 레드 modifies 팬츠 (worn UNDER the shirt, via 위에); 셔츠 itself is explicitly 버건디 (not a taxonomy COLOR value), so the window bled the nearest recognized COLOR (RED) onto the wrong item. | No SHIRT + COLOR:RED relation. |

**Root cause (general, not MCK-specific):** the modifier-window boundary logic already had `COORDINATION` (commas/와/과/물론이고/etc.) and `CLAUSE_BOUNDARY` (verb-based: 매치해/레이어드해/etc.), both of which cut the backward-looking window at a marker. Neither covers a bare noun+`에` **pairing particle** ("X에" = "paired/worn with/over X") sitting between a companion garment and the coordinating verb - the companion garment's own attribute word (화이트, 레드) sat inside the window with no boundary marker between it and our item.

**Fix (`src/collectors/editorial/attribute-relations.ts`):** added one new boundary pattern, `PAIRING_PARTICLE = /(?<!소재)에\s/g`, applied in the same "cut at the last occurrence inside the window" loop as `COORDINATION`/`CLAUSE_BOUNDARY` - not a new mechanism, one more entry in the existing boundary-pattern list. Explicitly excludes `소재에` (a MATERIAL noun describing the CURRENT item's own fabric, not a companion object - a real EYESMAG case, "퀼팅 나일론 소재에 체크를 직조한 홀스슈 백팩", both attributes correctly describing the SAME backpack, would have broken under a naive unguarded version; this was caught and fixed before landing, see code comment). Deliberately matches only a bare `에` immediately followed by whitespace, so `에서`/`에는`/`에도` (already handled elsewhere, or genuinely different particles) are unaffected.

**Bonus regression catch:** re-running the same pattern against the existing real corpus (not just MCK) as a verification step also caught 2 pre-existing HARPERSBAZAAR_KR misattributions of the identical class: `브라운 계열의 레오퍼드 패턴에 레드 쇼츠` (BROWN wrongly attached to SHORTS instead of the companion leopard-pattern garment) and `빈티지 그레이 나시에 선명한 레드 반바지` (VINTAGE wrongly attached to SHORTS instead of a companion tank top). Both are automatically corrected by the same one-line general fix - no source-specific hardcoding was needed anywhere.

## 4. Regression safety

Added 3 new fixture assertions to `scripts/smoke-test.ts` (not a separate fixtures directory - this codebase keeps regression fixtures inline in the smoke test): the two real false-positive cases above (each asserting the false relation is now absent, and that the genuine adjacent SEQUIN relation in case 1 still fires), plus a negative-control fixture (`"카본 블랙 ELVO 백팩을 공개했다."` with no `에` anywhere nearby) proving `PAIRING_PARTICLE` does not over-reach into windows that don't contain it.

Full existing suite re-run (`npx tsx scripts/smoke-test.ts`, 2427 lines): **`Smoke test passed: marketAnalysisRows=548, mode=real, sources=4, items=22, naver=disabled.`** - zero regressions. Specifically confirmed still passing: the 물론이고/attached-particle/verb-clause/`+`-combo fixes from `92ec936`, the T_SHIRT/SHIRT boundary tests, the Editorial/Product-Reference frozen-scope-isolation tests (Section 27 below), and the roundup/dedicated-clustering `independentEvidenceClusterCount` tests.

## 5. Marie Claire article boundary

Marie Claire Korea is WordPress-based (a different technical platform from the Hearst Joongang sources), confirmed via direct sampling to emit a `NewsArticle`/`Article` JSON-LD block whose `articleBody` field already contains only the article's own prose - related-reading widgets, footer, nav, and other site-wide chrome live outside the JSON-LD block entirely, not inside it, so (unlike the Hearst sources, which need an explicit stop-pattern cutoff) no separate boundary-stripping step is needed. Falls back to the theme's own `post-content` container class only if a page ever lacks the JSON-LD block. Captions/look-credits were not observed feeding false mentions in the sampled corpus.

## 6. Access reconfirmation

Unchanged from the prior audit: plain WordPress `robots.txt` (`User-agent: *`, disallows only `/wp-admin/`, no AI-bot-specific block of any kind), FASHION-category RSS feed publicly reachable, no login/CAPTCHA/challenge encountered, no new AI-use prohibition found. No bypass of any kind was used or needed.

## 7-8. Dry run + manual relation audit

The dry-run stage was performed as part of the earlier (interrupted) work using the probe's `--urls-file` mechanism against real FASHION-category URLs (documented in `docs/NON_HEARST_SOURCE_DIVERSITY_AUDIT.md` Section 5, 20 articles, 25% Direct Attribute Rate, 2 misattributions caught - the same 2 fixed in Section 3 above). This continuation did not re-run a separate 20-article dry run before the real collection (already run once, and refixing the same corpus again would have been redundant); instead it independently re-verified the *real* 30-article result end-to-end (Sections 9-11 below), which is a stronger check than a second dry run.

## 9. Real collection

Registered `MARIECLAIRE_KR` in `src/config/editorial-sources.ts` and added a dedicated collector (`collectMarieClaireKr` in `src/collectors/editorial/rss.ts`): pages the FASHION-category RSS feed (`?paged=N`, confirmed working; `/page/N/feed/` was confirmed NOT to work on this platform) up to 6 pages / ~60 candidate items as a hard cap, filters to the 90-day window using the feed's own `<pubDate>` as a cheap pre-filter and each article's own JSON-LD `datePublished` as the authoritative check (same two-stage pattern as the sitemap-based collectors), fetches sequentially with a 1500ms delay between requests, and hard-stops (no retry) on `EditorialRateLimitedError` or any `HTTP 403`/`5xx` response, returning whatever was collected so far.

**Result: 30/30 articles collected, 0 HTTP restrictions encountered** (no 202/403/429/challenge/5xx hit during this run - the hard-stop code paths exist but were not exercised this time). Date range 2026-08-28 to 2026-09-09, entirely inside the 90-day window.

## 13-14. DB write safety + reparse

DB writes were a normal collector run (the standard `EditorialPost`/`EditorialMention` upsert path already used by every other source), not a bulk backfill needing a separate reparse step. Confirmed post-collection: **Canonical duplicates: 0. Mention duplicates: 0. MarketRankingSnapshot: 667 (unchanged).** Port 3000 was never touched by this pass (confirmed via `netstat`; something else already listening there belongs to the user's own session, left alone). A scratch validation server was started on port 3001 for Section 29 only and stopped afterward (confirmed via `netstat` - no LISTENING socket remains on 3001).

## 1/15. Recomputed signals (before -> after)

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| EditorialPost (real) | 343 | **373** | +30 |
| EditorialMention (real) | 1389 | **1496** | +107 |
| Canonical duplicates | 0 | 0 | - |
| Mention duplicates | 0 | 0 | - |
| Bundles | 44 | **47** | +3 |
| Multi-source bundles (`bundleSourceSpread >= 2`) | 5 | **8** | +3 |
| Independent Repeated bundles (`independentEvidenceClusterCount >= 2`) | 5 | **10** | +5 |
| Publisher-family-diverse bundles (multi-source AND family spread >= 2) | 4 | **7** | +3 |
| MarketRankingSnapshot | 667 | 667 | 0 (untouched) |

All computed live via the real, unmodified `getAttributeBundles("real")` / `selectPrimaryPlanningBundle` service functions (a scratch script calling them directly, deleted after use - never staged, matching the methodology in `EDITORIAL_PUBLISHER_DIVERSITY_AUDIT.md`), not hand-counted from the plain-text audit script's summary labels.

## 16-18. Publisher family spread - key bundles

Family map used (audit-level only, unchanged from prior passes; not a schema field): EYESMAG->EYES_INC, HYPEBEAST_KR->HYPEBEAST_HK, ESQUIRE_KR/HARPERSBAZAAR_KR/COSMOPOLITAN_KR->HEARST_JOONGANG, NONLABEL->NONLABEL_INDEPENDENT, VISLA->VISLA_INDEPENDENT, **MARIECLAIRE_KR->MCK_PUBLISHING (new)**.

### RED SKIRT

| | Before | After |
|---|---|---|
| Sources | EYESMAG (1) | **EYESMAG, MARIECLAIRE_KR (2)** |
| Publisher families | EYES_INC (1) | **EYES_INC, MCK_PUBLISHING (2)** |
| Independent clusters | 1 | **2** |

Evidence: `[EYESMAG]` "코르시카 섬에서 펼쳐진 자크뮈스의 'Le Bonheur' 컬렉션" (2026-07-01, runway/collection review) vs. `[MARIECLAIRE_KR]` "레드 컬러 일상 스타일링 가이드: 제니부터 해리 스타일스까지" (2026-09-04, celebrity daily-styling roundup). **Confirmed, exactly the significance predicted in the prior probe: EYES_INC + MCK_PUBLISHING.**

### DENIM SHORTS

| | Before | After |
|---|---|---|
| Sources | EYESMAG (1) | **EYESMAG, MARIECLAIRE_KR (2)** |
| Publisher families | EYES_INC (1) | **EYES_INC, MCK_PUBLISHING (2)** |
| Independent clusters | 1 | **2** |

Evidence: `[EYESMAG]` "파리패션위크에서 포착한, 실패 없는 수트 스타일링 비결" (2026-07-06, Paris Fashion Week street-style piece) vs. `[MARIECLAIRE_KR]` "화이트 탱크 톱 스타일링과 체형별 추천 디자인 가이드" (2026-09-07, body-type styling guide, "벨라 하디드처럼 클래식한 데님 쇼츠"). **Confirmed, matching the prior probe's prediction.**

## 19. New bundles

| Bundle | Articles | Sources | Families | Independent clusters | Evidence | Strength |
|---|---:|---:|---:|---:|---|---|
| **레드 SHORTS** | 2 | 2 (HARPERSBAZAAR_KR, MARIECLAIRE_KR) | **2 (HEARST_JOONGANG, MCK_PUBLISHING)** | 2 | "올가을 레드 컬러 조합, 퍼플 VS 브라운 어떻게 입을까?" (2026-09-08) vs. "레드 컬러 일상 스타일링 가이드" (2026-09-04) | 여러 매체 동시 관찰 - born already multi-source AND family-diverse (not predicted in the prior probe, which only anticipated this as an EYES_INC-adjacent singleton; the real HARPERSBAZAAR_KR match is a genuine bonus finding) |
| **시퀸 SKIRT** | 2 | 1 (MARIECLAIRE_KR only) | 1 | 2 | "화이트 탱크 톱 스타일링..." (2026-09-07) vs. "돌아온 시퀸 트렌드와 셀럽들의 리얼웨이 스타일링 팁" (2026-09-04) - 2 genuinely distinct MCK articles, not a same-case remention | 반복 관측 · 서로 다른 사례 (independent-repeated, single-source) |
| **그린 CARDIGAN** | 1 | 1 (MARIECLAIRE_KR) | 1 | 1 | "환절기 셀럽 아우터 활용법" (2026-09-04), "네온 그린 컬러의 시스루 카디건" | 단일 관측 (singleton - matches the prior probe's finding exactly; the taxonomy value is plain GREEN, "네온" is not a separate recognized color/detail value, so this is not a new distinct taxonomy bundle beyond GREEN+CARDIGAN) |

## 20. Current primary

Ran the real, unmodified `selectPrimaryPlanningBundle`: **still 체크 SHIRT** (SHIRT + DETAIL:CHECK), `independentEvidenceClusterCount=4`, `bundleSourceSpread=4` (EYESMAG, HYPEBEAST_KR, HARPERSBAZAAR_KR, COSMOPOLITAN_KR - unchanged). **No MARIECLAIRE_KR confirmation of 체크 SHIRT this pass** - reported honestly, exactly as the prior probe already disclosed ("no confirmation for 체크 SHIRT" was not assumed to change, and it didn't). No change to the sort/selection logic itself.

Also explicitly checked and **not** confirmed by MCK this pass: 니트 CARDIGAN (MCK's only cardigan evidence is COLOR:GREEN, not MATERIAL:KNIT) and 데님 VEST (MCK has zero VEST mentions in the real 30-article sample) - both consistent with the prior probe's own disclosed "no confirmation" findings, not assumed.

## 10. Independence audit

| Confirmation | Dates | Topic/genre | Shared wording/campaign? | Verdict |
|---|---|---|---|---|
| 레드 SKIRT (EYESMAG vs MARIECLAIRE_KR) | 2026-07-01 vs 2026-09-04 | Runway collection review vs. celebrity daily-styling roundup | None - different garments, different celebrities/context entirely | **INDEPENDENT** |
| 데님 SHORTS (EYESMAG vs MARIECLAIRE_KR) | 2026-07-06 vs 2026-09-07 | Paris Fashion Week street style vs. body-type styling guide | None | **INDEPENDENT** |
| 레드 SHORTS (HARPERSBAZAAR_KR vs MARIECLAIRE_KR) | 2026-09-08 vs 2026-09-04 | Both are "red as a color trend" seasonal-styling pieces, 4 days apart | Same macro-theme (red for fall) but different specific pairings, different named people, different specific product combinations, no shared sentence/phrase - a real, independently-noticed seasonal color trend covered separately by two outlets, not a shared press release | **INDEPENDENT** (flagged as the closest-in-time pair this pass; worth a second look if a 3rd source ever independently covers the same "red for fall" angle in the same window, but two outlets separately noticing an actual seasonal color trend is expected, not suspicious, per the task's own "same product alone != duplicate" guidance) |
| 시퀸 SKIRT (2x MARIECLAIRE_KR) | 2026-09-04 vs 2026-09-07 | Dedicated sequin-trend piece vs. body-type styling guide mentioning a sequin skirt in passing | None | **INDEPENDENT** (already reflected correctly in the live `independentEvidenceClusterCount=2`, not a same-case remention) |

## 24. Roundup heuristic check

Marie Claire's house style leans on multi-item styling-guide/roundup pieces (e.g. "화이트 탱크 톱 스타일링과 체형별 추천 디자인 가이드" mentions a tank top, a sequin skirt, AND denim shorts - 3+ distinct items, meeting the `>=3 distinct items => roundup-shaped` proxy). Checked whether this caused wrong independence clustering: it did not, because each bundle here is item-specific (SKIRT+SEQUIN and SHORTS+DENIM are different bundles) and this one article contributes only ONE occurrence to each - the roundup heuristic's actual risk (inflating a single bundle's cluster count from one article mentioning the same item+attribute pair twice, or conflating a roundup blurb with a same-outlet dedicated piece published days apart) was not triggered anywhere in this collection. No change made to `countIndependentEvidenceClusters` or any trust semantics - existing frozen mechanism, unmodified, behaved correctly on real data.

## 25. Taxonomy misses (reported only)

- "네온 그린" (neon green) surfaces only as plain GREEN in the current taxonomy - no distinct NEON modifier exists. The 그린 CARDIGAN bundle is correctly a plain GREEN+CARDIGAN singleton, not a richer "neon green" value. Reported per the task's format; no taxonomy change made.
- No other new item or attribute vocabulary was observed in the real 30-article MCK sample beyond what's already covered (SHIRT/SKIRT/SHORTS/CARDIGAN, COLOR/DETAIL/MATERIAL).

## 27. Product Reference frozen regression

Located in `scripts/smoke-test.ts` (`verifyEditorialProductReferenceScopeIsolation` and related tests, using the permanently frozen 120-product snapshot in `frozen-editorial-vocabulary.ts`, documented origin in `docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md`) rather than a standalone script - this is guarded by inline assertions (the real KIRSH/TNF fixture proofs), not a printed summary number recomputed per run. All Product Reference frozen-behavior assertions passed as part of the full smoke-test run in Section 4 above (no separate script needed; the frozen snapshot and its isolation from Editorial's live `editorialRules` were not touched by this pass's parser fix, which lives entirely in `attribute-relations.ts`, a module Product Reference does not import from).

## Data safety

- EditorialPost (real): 343 -> **373** (+30, real MARIECLAIRE_KR collection only).
- EditorialMention (real): 1389 -> **1496** (+107).
- Canonical duplicates: 0. Mention duplicates: 0.
- MarketRankingSnapshot (real): **667, unchanged.**
- No Prisma migration, no schema change, no taxonomy change, no UI change, no Product Reference feature work (frozen regression re-verified only).
- Port 3000: never touched (confirmed via `netstat`; a pre-existing unrelated listener was left alone). Port 3001: used only for this pass's route validation (Section 29), confirmed stopped afterward via `netstat`.
- Two scratch analysis scripts (`_scratch-mck-signal-metrics.ts`, `_scratch-mck-body-check.ts`) were used to query the live service/DB read-only and deleted immediately after use - never staged, matching the established methodology from prior audit passes.

## 29. Validation

- `npx tsc -b --noEmit`: **clean, no errors.**
- `npx tsx scripts/smoke-test.ts` (full 2427-line suite, including 3 new Marie Claire regression fixtures): **`Smoke test passed`, zero regressions.**
- `npm run build` (`prisma generate && next build`, Turbopack): **compiled successfully**, all 16 routes generated with no errors.
- Route check on a scratch `next start -p 3001` server (port 3000 never touched): `/` 200, `/editorial` 200, `/items` 200, `/items/SKIRT` 200, `/items/SHORTS` 200, `/items/CARDIGAN` 200, `/market` 200. Server stopped afterward (confirmed no LISTENING socket remains on 3001).
- No UI code was touched by this pass (only collectors/parser/config/tests + docs) - the route check confirms the existing, frozen UI correctly renders the new MARIECLAIRE_KR-sourced data without any UI change.

## 30-31. Git

One commit, covering the parser fix + regression tests + real source addition together (matches how both precedent passes, `81fe103` and `92ec936`, bundled a fix/feat with its own tests and doc in one commit): `apps/trend-dashboard/scripts/smoke-test.ts`, `apps/trend-dashboard/src/collectors/editorial/attribute-relations.ts`, `apps/trend-dashboard/src/collectors/editorial/rss.ts`, `apps/trend-dashboard/src/config/editorial-sources.ts`, `apps/trend-dashboard/docs/MARIECLAIRE_COLLECTION_AUDIT.md` - staged explicitly by path, never `git add .`/`-A`. Not pushed by this pass's author directly; push happens only after correct-branch/clean-tree/validation confirmation, no force.

## Next step

**Find the next high-density editorial source from a publisher family not represented by Hearst JoongAng, Hypebeast, Eyes Inc., or MCK Publishing.** With 8 sources now spanning 5 distinct publisher families (HEARST_JOONGANG x3 mastheads, HYPEBEAST_HK, EYES_INC, MCK_PUBLISHING, NONLABEL_INDEPENDENT, VISLA_INDEPENDENT), the corpus's publisher-family-diverse bundle count has grown from 4 to 7 in two diversification-focused passes; continuing to prioritize genuinely new families over deeper same-family mastheads (as this pass and its predecessor both did) is the highest-leverage way to keep growing independent, cross-publisher confirmation strength rather than just corpus size.
