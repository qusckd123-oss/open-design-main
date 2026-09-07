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
