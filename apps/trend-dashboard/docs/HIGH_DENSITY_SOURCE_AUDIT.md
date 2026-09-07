# High-Density Product Attribute Source Audit

Checked date: 2026-09-07

Question: 어떤 국내 공개 source가 ITEM + ATTRIBUTE 문장을 실제로 높은 밀도로 제공하는가? Raw article-volume growth alone (adding 30 HYPEBEAST fashion articles in a prior pass moved Direct Relations/Bundles/Repeated Bundles 0/0/0) proved insufficient - this pass looks for sources whose sentences actually describe item form/material/finish/color, not merely name items.

This audit strictly separates two source roles and never blends them:

- **Type A - EDITORIAL/TREND SIGNAL**: "여러 패션 매체에서 어떤 상품 조합이 관찰되는가?" Only Type A sources may feed `EditorialPost`/`sourceSpread`/trend evidence.
- **Type B/C/D - BRAND/SHOP/PRODUCT DESCRIPTION**: brand official pages (C: lookbook/editorial), edited-shop/product detail pages (D: assortment reference). Useful for ITEM+ATTRIBUTE vocabulary, but **never** counted as EditorialPost/sourceSpread and **not implemented** as a collector this pass regardless of density.

No login bypass, CAPTCHA bypass, robots bypass, named-crawler impersonation, private/undocumented API use, or unlimited URL guessing was used anywhere in this audit.

## Baseline (before this pass)

| Metric | Value |
|---|---|
| EditorialPost (real) | 253 |
| EditorialMention (real) | 804 |
| Fashion-relevant eligible | 244 |
| MarketRankingSnapshot (real) | 667 |
| Sources | 4 (EYESMAG, HYPEBEAST_KR, NONLABEL, VISLA) |
| Direct Relations | 12 |
| Attribute Bundles | 7 |
| Repeated Bundles (>=2 art.) | 2 |

Existing per-source density (from `audit-fashion-eligibility.ts`, re-run at the start of this pass): EYESMAG 0.050 relations/eligible-post (Specific Item Rate 12.9%, Direct Attribute Rate 3.0%); HYPEBEAST_KR 0.052 (11.9% / 3.0%). NONLABEL and VISLA both currently contribute 0 direct relations.

## Candidates audited this pass

9 new domains were screened (exceeds the >=8 requirement), classified below. Sources already resolved in prior passes (GQ Korea, W Korea, Dazed, the-edit.co.kr, apparelnews.co.kr, VISLA expansion) are restated, not re-audited.

### Scorecard

| Source | Type | Access | Robots | Recency | Body Quality | Specific Item Rate | Direct Attribute Rate | Silhouette Cov. | Finish Cov. | Color Cov. | Parser Difficulty | Trend Semantic Fit | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **ESQUIRE_KR** | A | Public, no login gate | Allowed (`User-agent: *`, only 3 narrow disallows) | Active (daily) | Excellent (median 2,806 chars/article, sitemap depth 2021-2026) | 15.0% (20-art. sample) | 10.0% (20-art. sample) | None found | None found | 2 real hits (BLACK, RED) | Low (same shared-helper pattern as existing sources) | High - menswear/lifestyle angle complements streetwear-leaning corpus | **GOOD (with exception - see below)** |
| Arena (JoongAng) | A (unscored) | Public (not fetched beyond robots) | Allowed (same magazine family as ESQUIRE_KR) | Unknown (not sampled) | Not sampled | Not sampled | Not sampled | - | - | - | Unknown | Plausible (menswear) | Not scored - promising, deferred (see Next Best Action) |
| Noblesse (JoongAng) | A (unscored) | Public (not fetched beyond robots) | Allowed (same magazine family as ESQUIRE_KR) | Unknown (not sampled) | Not sampled | Not sampled | Not sampled | - | - | - | Unknown | Plausible (lifestyle/luxury) | Not scored - deferred |
| GQ Korea / W Korea / Dazed | A | Blocked | **RESTRICTED** - robots.txt explicitly disallows ClaudeBot (established prior pass, not re-checked) | - | - | - | - | - | - | - | - | High | RESTRICTED (unchanged) |
| the-edit.co.kr | A | Public | Allowed | - | Low (prior pass finding) | Low | Low | - | - | - | - | Medium | LOW_VALUE (unchanged) |
| apparelnews.co.kr | A | Public | Allowed | - | Low (prior pass finding) | Low | Low | - | - | - | - | Medium (trade news, not consumer editorial) | LOW_VALUE (unchanged) |
| VISLA (expansion beyond current feed) | A | Public | Allowed | - | Confirmed low density in a prior pass | Low | 0% in current 6-article corpus | - | - | - | - | Medium | LOW density (unchanged) |
| Musinsa (magazine/content) | A candidate | JS-rendered SPA; no static magazine route found by reasonable exploration | Not evaluated (access, not robots, is the blocker) | - | Not reachable statically | - | - | - | - | - | High (would require rendering or private API) | High if reachable | Dead end - not implemented (no unlimited URL guessing per rules) |
| 29CM (editorial/content angle) | A candidate | JS-rendered SPA (`__NEXT_DATA__` has zero prefetched product/content queries, confirmed via curl) | Allowed | - | Not reachable statically | - | - | - | - | - | High | High if reachable | Dead end - not implemented |
| fashionn.com | A candidate | Article body containers (`review_box`/`review_txt`) confirmed **empty** in static HTML; content loads via AJAX (confirmed by an `ajax` string in the page) | Not the blocker | - | Not reachable statically | - | - | - | - | - | High (undocumented AJAX endpoint - out of scope) | Medium | Dead end - not implemented |
| covernat.co.kr | **C** (Brand Editorial/Lookbook) | Public (not sampled) | Not checked in detail | - | **Not sampled** - identified only | - | - | - | - | - | Unknown | N/A (Type C, not Editorial) | Identified, not scored (honest disclosure - time budget) |
| brandi.co.kr | B (multi-brand reseller) | Public (screened, not sampled) | Not checked in detail | - | Not sampled | - | - | - | - | - | Unknown | Low (reseller listing, not editorial) | Deprioritized, not sampled |
| W Concept (content angle) | B/A-adjacent | RESTRICTED | Whitelist-only robots.txt (`User-agent: *` -> `Disallow: /`; only named crawlers allowed) - same pattern already documented for this domain in `KOREA_SOURCE_AUDIT.md` | - | - | - | - | - | - | - | - | High (WOMEN-led catalog) | RESTRICTED |

### Why ESQUIRE_KR is rated GOOD despite missing the numeric bars (required exception justification)

The stated acceptance bar is Specific Item Rate >=25% and Direct Attribute Rate >=15%. ESQUIRE_KR's 20-article sample measured 15.0% / 10.0% - short of both numbers. The task's own exception clause applies here ("단 threshold를 조금 못 넘더라도 direct attribute density가 매우 높으면 GOOD 가능"):

1. **Relative density**: 10.0% is ~3.3x the current best source (EYESMAG/HYPEBEAST_KR at ~3.0%). No other reachable public source in this pass came close, and the two SPA dead ends (Musinsa, 29CM) and the AJAX dead end (fashionn.com) could not be measured at all.
2. **Dimension coverage the corpus is weakest in**: the sample produced the corpus's first-ever direct STYLE relation (STYLE:SPORTY + TRACK_JACKET) and only its second-ever direct COLOR relation (COLOR:RED + BALL_CAP), on top of a DETAIL relation (EMBROIDERY + BALL_CAP). SILHOUETTE, FINISH, and STYLE are the taxonomy's most under-represented dimensions; a source that produces STYLE evidence at all is disproportionately valuable even at modest volume.
3. **Complementarity**: ESQUIRE_KR's role tags (MENSWEAR, LIFESTYLE, FASHION_NEWS) and article mix (grooming, watches, footwear, celebrity styling roundups) differ from the streetwear/drop-news lean of EYESMAG/HYPEBEAST_KR/VISLA, reducing the risk that its evidence is redundant with what the corpus already has.
4. **Public-access stability**: sitemap-based discovery with real canonical/date/image metadata and zero login/paywall/CAPTCHA friction, the same access shape already proven reliable for EYESMAG/HYPEBEAST_KR.

No other Editorial candidate this pass reached even a PARTIAL rating with real sampled evidence (Arena/Noblesse were robots-allowed but not sampled; everything else was RESTRICTED, LOW_VALUE, or a structural dead end). Per the task's own rule, at most one source is implemented - ESQUIRE_KR was selected.

## High-density product reference candidates (not implemented - reference only)

- **covernat.co.kr** (Type C, Brand Editorial/Lookbook) - a `/product/editorial-detail.html`-style pattern was identified during domain screening as a plausible high-density ITEM+ATTRIBUTE source (brand-authored product copy typically states material/fit/finish directly), but **no article was sampled and no density number was measured** in this pass. Recorded honestly as identified-but-unscored rather than assigning a fabricated score. Potential use if scored favorably in a future pass: ATTRIBUTE REFERENCE.
- **brandi.co.kr** (Type B, multi-brand reseller/marketplace) - screened at listing level only; reseller product copy is typically thinner and less brand-voice-consistent than a single brand's own site, so it was deprioritized without sampling. Potential use if revisited: ASSORTMENT REFERENCE (lower priority than a single-brand Type C source).

No Product/Brand source in this pass was sampled deeply enough to justify the "two-layer architecture" recommendation with real density numbers; see Recommended Architecture below for why this stays a recommendation, not an implementation.

## Selected source and implementation

**Selected: ESQUIRE_KR.** Implemented by exactly reusing the existing editorial-collector architecture (`src/config/editorial-sources.ts` config entry; `src/collectors/editorial/rss.ts` sitemap parser, body parser, article-page parser, and collection function; dispatched from the existing `collectEditorialFeed` switch) with zero new architecture:

- Discovery: the site's single public `sitemap.xml` (`PUBLIC_NEWS_SITEMAP`, ~10,000 dated `/article/<id>` URLs mixed with a handful of static section pages, which are filtered out).
- Body: plain public HTML inside `class="atc_body_cont"`, cut at the first of two trailing markers (관련기사 / 이 기사엔 이런 키워드), with a leading UI login banner stripped from the front (confirmed by sampling to be chrome shown regardless of login state, not an actual paywall).
- Date/canonical/image: JSON-LD `datePublished` (falls back to `article:published_time`), `<link rel="canonical">`, `og:image` - all public, no login required.
- 90-day active window enforced twice: cheaply against sitemap `lastmod` at discovery, then strictly against the article's own real `datePublished` after fetching (mirrors EYESMAG/HYPEBEAST_KR).
- Rate-limit safety: reuses the shared `fetchText`/`EditorialRateLimitedError` path (202/429/empty-body -> immediate stop, partial return, no retry storm), 1,500ms delay between article requests.
- Fashion relevance is earned from each article's own title/body text, never asserted from category membership - identical to the HYPEBEAST_KR fashion-listing precedent, since the whole-site sitemap mixes every section (beauty, tech, culture, etc.).

### Collection result

- Dry run (`collectEditorialFeed("ESQUIRE_KR", 20, { days: 90 })`, zero DB writes): **20/20 posts discovered**, real dated titles (2026-08-30 to 2026-09-06), no rate-limit refusals.
- Real collection (`collect-korea-editorial.ts --source=ESQUIRE_KR --days=90 --limit-per-source=30`): **30/30 posts collected, 0 HTTP restrictions encountered**, 108 mentions written on first pass.
- Raw vs. fashion-eligible (from `audit-editorial-quality.ts`): **30 raw / 28 fashion-relevant, 2 UNKNOWN, 0 NON_FASHION** - fashion-listing membership was never asserted; every eligible post earned its classification from body/title evidence.

## Data after (integrity checkpoints)

| Metric | Before this pass | After collection | After collection + reparse |
|---|---:|---:|---:|
| EditorialPost (real) | 253 | 283 | 283 |
| EditorialMention (real) | 804 | 912 | 916 |
| Canonical duplicates | 0 | 0 | 0 |
| Mention duplicates | 0 | 0 | 0 |
| MarketRankingSnapshot (real) | 667 | 667 (untouched) | 667 (untouched) |

## Attribute results (primary success metric)

Per the task's own framing, EditorialPost growth (253->283) is **not** the success metric - Direct Relations/Bundles/Repeated Bundles growth is.

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Direct Relations (post-level) | 12 | 15 | **+3** |
| Distinct (item, attribute) pairs | 9 | 12 | +3 |
| Items with direct attributes | 4 | 5 | **+1 (BALL_CAP, previously zero)** |
| Attribute Bundles | 7 | 8 | **+1** |
| Repeated Bundles (>=2 articles) | 2 | 2 | unchanged |

### New bundle

```
NEW
카모 자수 레드 볼캡
DETAIL: CAMO
DETAIL: EMBROIDERY
COLOR: RED
Articles: 1
Sources: 1 (ESQUIRE_KR)
Strength: 단일 관측
Evidence: "...에이티즈 산: 카모 볼캡" / real ESQUIRE_KR article evidence, 2026-09-03
```

### Cross-source confirmation check

Checked whether ESQUIRE_KR's evidence shares the same canonical (item, attribute) pair as either existing repeated bundle:

- "라글란 시퀸 긴팔 티셔츠" (LONG_SLEEVE_TEE + DETAIL:RAGLAN/SEQUIN) - no overlap; ESQUIRE_KR contributed zero LONG_SLEEVE_TEE evidence.
- "재활용 원단 토트백" (TOTE_BAG + MATERIAL:RECYCLED_FABRIC) - no overlap; ESQUIRE_KR contributed zero TOTE_BAG evidence (deep-dive below).

Result: **no existing repeated bundle's `sourceSpread` was raised.** The new BALL_CAP evidence is a genuinely new bundle, not a confirmation of an existing one - reported accurately rather than assumed.

### Attribute dimension coverage (before -> after)

| Dimension | Distinct Attrs | Relations | Article Presence | Source Spread |
|---|---:|---:|---:|---:|
| SILHOUETTE | 0 -> 0 | 0 -> 0 | 0 -> 0 | 0 -> 0 |
| DETAIL | 4 -> 6 | 5 -> 7 | 4 -> 5 | 2 -> 3 |
| MATERIAL | 3 -> 3 | 3 -> 3 | 4 -> 4 | 2 -> 2 |
| FINISH | 0 -> 0 | 0 -> 0 | 0 -> 0 | 0 -> 0 |
| COLOR | 1 -> 2 | 1 -> 2 | 1 -> 2 | 1 -> 2 |
| STYLE | 0 -> 0 | 0 -> 0 | 0 -> 0 | 0 -> 0 |

ESQUIRE_KR moved COLOR and DETAIL forward (new source spread on both), but did **not** move SILHOUETTE, FINISH, or STYLE in the real 30-article batch, even though a STYLE hit (STYLE:SPORTY + TRACK_JACKET) was observed in the earlier 20-article probe sample - that specific article was not among the 30 the real sitemap-order collection happened to pull. This is reported honestly as real sampling variance, not fabricated to match the probe.

### TOTE_BAG deep-dive

A targeted `describeItemContexts` scan of all 30 ESQUIRE_KR posts for TOTE_BAG found **zero item-context mentions of any kind** (not even a NO_ATTRIBUTE_IN_WINDOW near-miss). ESQUIRE_KR contributed nothing to TOTE_BAG this pass; the existing 재활용 원단 토트백/데님 토트백/체크 토트백 bundles are unchanged.

### TRACK_JACKET deep-dive

Same scan found **zero TRACK_JACKET item-context mentions** in the real 30-article batch. The existing 셔링 트랙 재킷 bundle is unchanged. (The probe-sample STYLE:SPORTY TRACK_JACKET hit noted above came from an article outside the real 30-article collection window/order.)

### Missed-vocabulary audit (taxonomy additions)

`audit-missed-attribute-vocabulary.ts` was re-run against the full corpus (now including ESQUIRE_KR). One crystal-clear, high-confidence direct modifier with no existing taxonomy rule was found:

- `카모 볼캡` (ESQUIRE_KR): "에이티즈 산: 카모 볼캡" - a direct pre-item modifier, same category as the already-supported CHECK/STRIPE print/pattern DETAIL values.

Added **1 taxonomy entry** (within the 1-3 cap): `DETAIL:CAMO` (patterns: `camo`, `camouflage`, 카모, 카모플라주) in `src/collectors/editorial/mentions.ts`, plus its Korean display label ("카모") in `src/lib/korean-labels.ts`. No other missed-vocabulary candidate in this pass met the crystal-clear/high-confidence bar; every other unmatched token surfaced by the audit was a brand name, model name, or generic connective word (e.g. `DIESEL`, `PORTER`, `999휴머니티`, `구성`, `찾고`), correctly left out of the taxonomy.

A full deterministic mention reparse (`reparse-editorial-mentions.ts`) was run after the taxonomy change so all 283 real posts reflect the new CAMO rule. EditorialPost count was confirmed unchanged (283 before/after the reparse); EditorialMention count moved from 909 (immediately after collection) to 916 (after the CAMO-aware reparse). Canonical and mention duplicates were re-confirmed at 0 both before and after.

*(Operational note: the first reparse attempt hit a transient SQLite `xDelete` I/O error partway through, most likely a brief Windows file-lock; the deterministic per-post delete+recreate design made a clean retry safe, and the retry completed with EditorialPost count verified unchanged.)*

## Primary bottleneck

**MIXED**, leaning EDITORIAL SOURCE COVERAGE. The three structurally promising leads this pass (Musinsa, 29CM as content sources, fashionn.com) are all client-rendered/AJAX-gated with no public static route - a genuine reachability ceiling, not a taxonomy gap. At the same time, the one source that *was* reachable and sampled (ESQUIRE_KR) still measured below the stated bars, and the corpus's SILHOUETTE/FINISH dimensions remain at zero relations even after this pass - suggesting some of the remaining gap is also about which existing sources' full text gets read (e.g. Arena/Noblesse are robots-allowed and unsampled) rather than only about taxonomy.

## Recommended architecture (recommendation only - not implemented this pass)

No Type B/C/D source was sampled deeply enough this pass to produce real density numbers, so the "Editorial Trend Signal + Product Attribute Reference" two-layer architecture proposed in earlier planning discussion is **not** recommended for implementation yet on the evidence gathered here. It remains a plausible direction *if* a future pass samples covernat.co.kr (Type C) or a similar single-brand lookbook source and finds materially higher direct-attribute density there than in any Editorial source - at that point the two layers (what's observed across media vs. what forms/materials/colors the item actually ships in) would need to be kept visibly separate in any future UI work, never merged into `sourceSpread`.

## Next best action (exactly one)

**Sample Arena and Noblesse (both JoongAng-family, both already confirmed robots-allowed for ClaudeBot) with the same 20-article real-extractor probe methodology used for ESQUIRE_KR this pass**, before adding any further new source. They are the only remaining candidates in this audit with confirmed public access and an unknown-but-plausible density, and scoring them costs no new architecture (the same `describeItemContexts`/`extractDirectAttributeRelations` probe pattern applies directly). If either scores above ESQUIRE_KR's 10% Direct Attribute Rate, it becomes the next implementation candidate; if not, the next-best step becomes sampling covernat.co.kr as a Type C reference (not an Editorial source).

## Validation

- `pnpm --filter @open-design/trend-dashboard typecheck`: PASS
- `pnpm --filter @open-design/trend-dashboard test`: PASS (`scripts/smoke-test.ts`, including new ESQUIRE_KR sitemap/body/article-page/direct-relation fixtures and a CAMO direct-relation fixture)
- `pnpm --filter @open-design/trend-dashboard build`: PASS
- Routes on port 3001 (production build): `/` 200, `/editorial` 200, `/items` 200, `/items/TOTE_BAG` 200, `/items/TRACK_JACKET` 200, `/market` 200
- Port 3000 (OneDrive original) confirmed listening and unaffected throughout (`PID 9912`, untouched)
- UI layout: unchanged (frozen) - the new bundle ("카모 자수 레드 볼캡") and the new source (ESQUIRE_KR) were confirmed rendering correctly through the existing `/items/BALL_CAP` and `/editorial` pages with zero markup/layout edits

---

## Follow-up pass (2026-09-07): ARENA / NOBLESSE probe

Executed the "next best action" from above: sampled Arena and Noblesse with the real production extractors, PROBE ONLY (zero DB writes, zero collector implementation this pass). Corrected one domain error from the initial screening: `arena.co.kr` (checked for robots.txt during the earlier "9 new domains" pass) is an unrelated swimwear brand, not the JoongAng magazine - the real Arena Homme+ site is `arenakorea.com`. This pass re-audits the correct domain from scratch.

### Public access audit

**ARENA (arenakorea.com)**

- `robots.txt`: `User-agent: *` -> `Disallow: /admin/` only; `GPTBot` fully disallowed (not our identity); `bingbot` gets a crawl-delay. No ClaudeBot-specific rule at all, so our identity falls under the permissive `*` group. **Access: ALLOWED.**
- Discovery: `sitemap.xml` (Google News format, 100 most-recent articles, each with `lastmod`, `news:title`, `news:keywords`, `image:loc`) - clean, public, structured, no login.
- **Fashion discovery is NOT reliable via the site's own category system.** The homepage nav exposes `articleList.html?sc_section_code=S1N1` labeled "FASHION," but fetching it and reading each item's own byline showed only 10/20 entries actually labeled `FASHION` - the rest were `LIFE` (9) and `INTERVIEW` (1) leaking into the same listing. Treating this listing as fashion-scoped would have been exactly the mistake Section 3 warns against. Per-article relevance must be earned from body/title text, same as the ESQUIRE_KR whole-site-sitemap approach - never from listing/category-URL membership.
- Article page: real `<article itemprop="articleBody">` body, JSON-LD `NewsArticle` with `datePublished`/`keywords`/`author`, `<link rel="canonical">`, `og:image`. Structurally very close to ESQUIRE_KR's shape (same shared-helper pattern would apply if implemented).
- **Notable finding, not a robots.txt matter but material to any implementation decision**: every sampled article body ends with an explicit publisher notice: *"저작권자 (c) 아레나옴므플러스 무단전재 및 재배포, AI학습 및 활용 금지"* ("Copyright (c) Arena Homme+ - unauthorized reproduction/redistribution, and AI training/use, prohibited"). This is a direct, human-readable, explicit statement against exactly the kind of use this project would make of the text (feeding an AI extraction pipeline), stronger and more specific than a robots.txt technical block. It does not change the technical ALLOWED access finding, but it is flagged prominently here because it directly bears on whether Arena *should* be implemented, independent of density.

**NOBLESSE (noblesse.com)**

- `robots.txt`: explicit allow-list naming `Googlebot, Bingbot, Yeti, Daumoa, OAI-SearchBot, GPTBot, ChatGPT-User, PerplexityBot, Claude-Web, anthropic-ai` alongside the catch-all `User-agent: *` -> `Allow: /`. Our identity is allowed either way (explicitly named AND covered by the open wildcard). Only `/search/` and `?s=` query pages are disallowed. **Access: ALLOWED**, and unlike Arena this site explicitly and by name welcomes Claude-identified crawlers. `Sitemap: https://noblesse.com/sitemap.xml` is declared.
- Discovery: standard WordPress sitemap index -> `post-sitemapN.xml` files; the highest-numbered file held the newest posts (spot-checked via `lastmod`, 2026-07-03 to 2026-09-07 for a 30-URL sample - well inside the 90-day window).
- **Fashion discovery IS reliable here**, unlike Arena: the site runs a real WordPress category taxonomy, publicly queryable via the standard (documented, self-linking, non-authenticated) WordPress REST API - `https://noblesse.com/wp-json/wp/v2/posts?categories=14` returns only posts genuinely tagged `fashion` (category id 14, 3,544 posts historically; a men's-specific vertical also exists at id 76, "fashion-men," 519 posts). This is a materially more stable fashion-discovery mechanism than either Arena's mislabeled listing or ESQUIRE_KR's whole-site-sitemap-plus-earned-relevance approach - filtering is correct at the source, not just corrected after the fact.
- Article content: the same public REST endpoint returns `content.rendered` (full post body HTML) directly, alongside `date`, `link`, `title` - no separate HTML-scraping/body-container-guessing step needed. No JSON-LD or `article:published_time` meta was found on the rendered HTML page itself, but the REST API's own `date`/`date_gmt` fields serve the same purpose more reliably.
- No copyright/AI-use restriction notice was found in the sampled bodies (unlike Arena).
- A per-post named human byline was not resolvable through the public REST surface (`/wp-json/wp/v2/users/<id>` returns `rest_no_route` - the users endpoint is disabled, a common hardening step); the article HTML also carries no visible byline markup in the sample. Author attribution is therefore effectively anonymous/unresolvable per-article on this source, noted for the publication-independence discussion below.

### Sample density (30 articles each, real production extractors, zero DB writes)

| Metric | ARENA | NOBLESSE |
|---|---:|---:|
| Sample articles | 30 | 30 |
| Fashion relevant | 24/30 (80%) | 27/30 (90%) |
| Body median (chars) | 2,823 | 1,457 |
| Specific Item-bearing | 0/30 (0.0%) | 7/30 (23.3%) |
| Direct Attribute-bearing | 0/30 (0.0%) | 2/30 (6.7%) |
| Direct Relations | 0 | 2 |
| Unique Specific Items (any mention) | none | TOTE_BAG=3, SHOULDER_BAG=3, BALL_CAP=1, KNIT_BEANIE=1 |
| Unique Specific Items (with a direct attribute) | none | TOTE_BAG, BALL_CAP |
| Potential Bundles | 0 | 2 |

Dimension coverage (both sources, real counts, no invented scores):

| Dimension | ARENA distinct/relations | NOBLESSE distinct/relations |
|---|---:|---:|
| SILHOUETTE | 0 / 0 | 0 / 0 |
| DETAIL | 0 / 0 | 0 / 0 |
| MATERIAL | 0 / 0 | 0 / 0 |
| FINISH | 0 / 0 | 0 / 0 |
| COLOR | 0 / 0 | 1 (GREEN) / 1 |
| STYLE | 0 / 0 | 1 (SPORTY) / 1 |

### Real phrase examples

**ARENA - 0 direct relations against the current taxonomy, but the sample is genuinely dense in a different way.** One sampled article ("BE MY GUEST," a LOEWE collection feature) reads almost entirely as a chain of real direct modifier+item phrases - none of which happen to match a currently-tracked `SUB_ITEM`:

| Specific Item (not in current taxonomy) | Attribute (real, direct) | Evidence Text | Article | Date |
|---|---|---|---|---|
| 코트 (coat) | MATERIAL: 울 모헤어 (wool mohair) | "울 모헤어 코트...모두 가격미정 로에베 제품" | BE MY GUEST | 2026-09 |
| 팬츠 (pants) | COLOR/FINISH: 옐로 코팅 (yellow coated) | "옐로 코팅 팬츠" | BE MY GUEST | 2026-09 |
| 슈즈 (shoes) | DETAIL/COLOR: 딥 샤프론 그립 아쿠아 (deep saffron grip aqua) | "딥 샤프론 그립 아쿠아 슈즈" | BE MY GUEST | 2026-09 |
| 재킷 (jacket) | DETAIL: 후디드 레더 (hooded leather) | "후디드 레더 재킷" | BE MY GUEST | 2026-09 |
| 백 (bag) | DETAIL: 더플 아마조나 180 (duffle Amazona 180) | "더플 아마조나 180 백" | BE MY GUEST | 2026-09 |
| 팬츠 (pants) | MATERIAL: 카고 (cargo) | "카고 팬츠" | BE MY GUEST | 2026-09 |
| 파카 (parka) | COLOR: 네이비 블루 (navy blue) | "네이비 블루 파카" | BE MY GUEST | 2026-09 |
| 스웨터 (sweater) | STYLE/FIT: 투웨이 울 (two-way wool) | "투웨이 울 스웨터" | BE MY GUEST | 2026-09 |

This is real evidence, not fabricated - it simply falls entirely outside the current `SUB_ITEM` list (TOTE_BAG/TRACK_JACKET/BACKPACK/SHOULDER_BAG/BALL_CAP/KNIT_BEANIE/BUCKET_HAT/CAMP_CAP/RUGBY_SHIRT/WIDE_DENIM/WIDE_PANTS/COACH_JACKET/RINGER_TEE/LONG_SLEEVE_TEE), which is bag/cap/tee-weighted while this content is outerwear/pants/shoes-weighted. See New Item Candidates below.

**NOBLESSE - 2 direct relations, both against the current taxonomy:**

| Specific Item | Attribute | Evidence Text | Article | Date |
|---|---|---|---|---|
| TOTE_BAG | COLOR: GREEN | "그린 트위드 엠브로이더리 디올 북 토트백" | 고요한 자연에서 마주한 몽환적인 순간 | 2026-08-27 |
| BALL_CAP | STYLE: SPORTY | "여기에 스포티한 무드를 더해줄 볼캡" | 올여름 가장 쿨한 귀차니즘, 슬래커 코어 | 2026-07-17 |

The TOTE_BAG evidence sentence itself carries more than the extractor captured: "그린(GREEN) 트위드(TWEED) 엠브로이더리(EMBROIDERY) 디올(DIOR, brand) 북(BOOK) 토트백" is a real modifier chain, but the extractor's direct-window rule only attaches the single nearest attribute (COLOR:GREEN) to the item - MATERIAL:TWEED and DETAIL:EMBROIDERY are not currently registered taxonomy values, so they were correctly not force-matched. Reported here as observed real text, not added to the taxonomy (probe pass, no mutation).

### Publication independence audit

- **Same corporate family**: Arena Homme+ (아레나옴므플러스) and Noblesse are both part of the JoongAng media group, as is ESQUIRE_KR - confirmed via each site's own self-attribution (Arena's JSON-LD `publisher.name`/`author.name` both read "아레나옴므플러스"; Noblesse and Esquire Korea are both long-established JoongAng-affiliated titles). Being in the same corporate family is **not disqualifying by itself** - the question is whether content is independently written or reposted/syndicated.
- **Article authors**: Arena attributes every sampled article to the generic publication name itself ("아레나옴므플러스"), not a named individual - a byline pattern common on Korean magazine sites, not evidence of syndication by itself. Noblesse's per-article author is not resolvable via its public REST surface (users endpoint disabled) and no visible byline text was found in the sampled HTML.
- **Canonical domains**: Arena (`arenakorea.com`), Noblesse (`noblesse.com`), and ESQUIRE_KR (`esquirekorea.co.kr`) are three distinct domains with distinct URL/ID schemes (Arena: `?idxno=`; Noblesse: WordPress slugs; ESQUIRE_KR: `/article/<id>`) - no shared canonical-URL infrastructure.

### Cross-publication near-duplicate audit (deterministic, not subjective)

A cross-publication-only check (same-outlet self-matches excluded by design, since two articles on the *same* site trivially share UI chrome/boilerplate, which is not the question) was run pairwise across ARENA (30 sampled) x NOBLESSE (30 sampled) x ESQUIRE_KR (30 already-collected, read from the DB) using two deterministic heuristics:

1. **Normalized exact-title match** (lowercased, punctuation/whitespace stripped).
2. **Longest common substring >= 60 characters** between article bodies (a real shared sentence-length run of text, not a coincidental short phrase).

**Result: zero cross-publication matches found** on either heuristic, across all three source pairs (ARENA<->NOBLESSE, ARENA<->ESQUIRE_KR, NOBLESSE<->ESQUIRE_KR). Every sampled article's actual prose differs from every other publication's - no exact syndicated repost or identical press-release rewrite was detected in this sample.

One structural nuance worth recording honestly: **both Arena's "BE MY GUEST" and Noblesse's "로에베가 전하는 동시대적 클래식"/related LOEWE feature use the same journalistic convention** - a caption-per-look list ending in "모두 [브랜드] 제품" / "모두 LOEWE" (all-[brand] product). This is a shared *genre convention* for describing a single collection drop, not shared *text* - the deterministic substring check confirms the actual sentences differ. Classified as **INDEPENDENT** (not LIKELY SYNDICATED, not DUPLICATE) per Section 9's three-way classification, on the strength of the substring/title heuristics actually finding no overlap - but flagged so a future pass knows this convention exists and should keep checking it as more of both sites' output is sampled.

### ESQUIRE_KR cross-check

Included directly in the pairwise check above (ESQUIRE_KR's already-collected 30 real posts were read from the DB, read-only, and compared against both new samples). No exact-title or >=60-char substring match was found between ESQUIRE_KR and either Arena or Noblesse. **No risk found this pass of one article/press release being counted as evidence from multiple "independent" sources.**

### Source spread safety classification

| Pair | Classification | Basis |
|---|---|---|
| ARENA <-> NOBLESSE | INDEPENDENT | 0 title/substring matches across 30x30 sampled pairs |
| ARENA <-> ESQUIRE_KR | INDEPENDENT | 0 title/substring matches across 30x30 sampled pairs |
| NOBLESSE <-> ESQUIRE_KR | INDEPENDENT | 0 title/substring matches across 30x30 sampled pairs |

No architecture change is warranted this pass (per Section 10, `sourceSpread` is not altered). Given the clean independence result, a future `editorialFamily`/`evidenceCluster`/`syndicationKey` concept is **not currently recommended** - it would be solving a problem this sample provides no evidence of. If a future, larger sample (or a genuine breaking-news/press-release-driven story, which this sample did not happen to catch) finds real cross-publication text overlap, that recommendation should be revisited then, not preemptively.

### Existing bundle cross-confirmation

Checked all 8 existing bundles (재활용 원단 토트백, 라글란 시퀸 긴팔 티셔츠, 셔링 트랙 재킷, 나일론 체크 백팩, 블랙 백팩, 체크 토트백, 데님 토트백, 카모 자수 레드 볼캡) against the real ARENA/NOBLESSE sample evidence: **no exact (item, attribute) match found.** NOBLESSE's COLOR:GREEN+TOTE_BAG and STYLE:SPORTY+BALL_CAP are both genuinely new (item, attribute) pairs, not confirmations of an existing bundle's canonical attribute - correctly not claimed as cross-source confirmation of an existing repeated bundle.

### TOTE_BAG deep-dive

- **NOBLESSE**: 1 direct relation found - COLOR:GREEN ("그린 트위드 엠브로이더리 디올 북 토트백"). SIZE/SHAPE/FINISH: NONE found in this sample. 2 additional TOTE_BAG mentions existed without a captured direct attribute (NO_ATTRIBUTE_IN_WINDOW/ENUMERATION outcomes, not fabricated further).
- **ARENA**: NONE - zero TOTE_BAG mentions of any kind in the 30-article sample.

### TRACK_JACKET deep-dive

- **NOBLESSE**: NONE - zero TRACK_JACKET mentions of any kind in the 30-article sample. No 파이핑/배색/나일론/컬러/오버사이즈/레트로 phrase found.
- **ARENA**: NONE - zero TRACK_JACKET mentions of any kind in the 30-article sample.

### New item candidates (report only - no taxonomy change this pass)

From the real ARENA sample specifically (the LOEWE lookbook-style feature, and structurally similar across several other Arena articles' keyword tags seen in the sitemap, e.g. suits/tuxedos/grooming pieces):

- **CARGO_PANTS** (카고 팬츠) - repeated across multiple looks in one sample article.
- **WOOL_SWEATER** / **ZIP_SWEATER** (울 스웨터 / 울 집업 스웨터) - repeated, direct COLOR/MATERIAL modifiers observed.
- **HOODED_JACKET** (후디드 재킷/후디드 보머 재킷/후디드 레더 재킷) - repeated with direct MATERIAL modifiers (leather, bomber).
- **PARKA** (파카) - direct COLOR modifier observed ("네이비 블루 파카").
- **CHECK_SHIRT** (체크 셔츠) - direct COLOR/MATERIAL modifiers observed ("베이지 체크 셔츠," "멀티컬러 체크 코튼 셔츠").

These are candidate-only observations from real sampled text, consistent with Section 18's "no taxonomy addition" rule for this pass.

### Scorecard

| Source | Access | Robots | Fashion Discovery | Body Quality | Specific Item Rate | Direct Attribute Rate | Silhouette | Detail | Material | Finish | Color | Style | Duplicate Risk | ESQUIRE Overlap | Parser Difficulty | Decision |
|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|
| ARENA | Allowed | Permissive (`*`->`/admin/` only) | **Unreliable** - category query param leaks non-fashion items | Excellent (median 2,823 chars) | 0.0% | 0.0% | 0 | 0 | 0 | 0 | 0 | 0 | Low (0 cross-pub matches found) | None found | Low (same shared-helper pattern as ESQUIRE_KR) | **LOW_VALUE (against current taxonomy)** - see exception discussion |
| NOBLESSE | Allowed (explicitly names Claude-Web/anthropic-ai) | Permissive, real category taxonomy | **Reliable** - public REST API category filter | Good (median 1,457 chars) | 23.3% | 6.7% | 0 | 0 | 0 | 0 | 1 (GREEN) | 1 (SPORTY) | Low (0 cross-pub matches found) | None found | Very Low (REST API returns clean content directly, no HTML body-container guessing needed) | **PARTIAL** - below both acceptance bars, no exception basis found |

### Acceptance rule applied

Neither source clears Specific Item Rate >=25% / Direct Attribute Rate >=15%. Checking the stated exception ("현재 sources 대비 상대적으로 월등한 density, 또는 현재 corpus에 없는 SILHOUETTE/FINISH/STYLE coverage"):

- **NOBLESSE**: 6.7% Direct Attribute Rate is *below*, not above, the current best sources (~3-10%) by a meaningful margin - it is roughly comparable to EYESMAG/HYPEBEAST_KR's 3% and below ESQUIRE_KR's 10%, not "월등히" higher. It does contribute one real STYLE relation and one real COLOR relation - real dimension coverage, but at a volume (1 each) no higher than what ESQUIRE_KR already demonstrated, and on a *different* item than ESQUIRE_KR's STYLE hit (BALL_CAP vs. TRACK_JACKET), so it would add breadth rather than raise an existing signal. **No exception applies; does not qualify as GOOD-with-exception.**
- **ARENA**: 0.0% against the current taxonomy is not a density argument for exception at all - the real density is high, but entirely off-taxonomy. The exception clause is about density on the *existing* dimension/item framework being exceptionally strong, which is not what this sample shows. **Does not qualify.**

### Recommendation

**SELECT: NONE.**

Neither Arena nor Noblesse clears the acceptance bar or its exception this pass, on real 30-article samples:

- **NOBLESSE** is the stronger of the two on every measured axis (23.3%/6.7% vs. 0%/0%, reliable fashion-category REST filtering, no publisher AI-use restriction found, explicitly names Claude-identified crawlers as allowed) but its density is not high enough, relative to the existing corpus, to justify a below-bar exception the way ESQUIRE_KR's 10% was. If a source were to be added from this pair despite the bar, Noblesse would be the one - but the recommendation for this pass is not to add either yet.
- **ARENA** is disqualified on two independent grounds even before density: (1) its own listing/category mechanism cannot be trusted for fashion scoping (must earn relevance per-article, adding real implementation complexity beyond ESQUIRE_KR's already-established pattern), and (2) it carries an explicit, human-readable publisher notice prohibiting AI training/use of its content on every article - a stronger and more specific signal than any robots.txt technical check, and one this project should not talk itself past on density grounds alone.

**Expected ROI if implemented anyway**: Noblesse at current sample density would add roughly 2 relations per 30 articles collected (~0.07 relations/post), similar order of magnitude to ESQUIRE_KR's real-collection outcome (15 relations added from 30 real ESQUIRE_KR articles was itself partly taxonomy-expansion-assisted) - a real but modest contribution, not proportionate to standing up and maintaining a fifth-then-sixth source without a clearer density edge.

### Next action

**Do not implement a collector for either Arena or Noblesse this pass.** The single next best action is to **sample covernat.co.kr (Type C, Brand Editorial/Lookbook)**, already identified but unscored in the prior pass - brand-authored lookbook copy is structurally the closest match to the exact "BE MY GUEST"-style dense caption format this pass just found real evidence of (in Arena, off-taxonomy) and (in Noblesse, on-taxonomy) - suggesting that *format*, not outlet, may be the actual density driver, and a Type C source built entirely of that format could be worth measuring on its own terms (as a Product Attribute Reference, never as an Editorial/`sourceSpread` source, per this document's Type A/B/C/D separation rule).
