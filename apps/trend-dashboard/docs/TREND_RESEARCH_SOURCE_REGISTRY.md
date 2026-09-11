# Trend Research Source Registry

Checked date: 2026-09-11. Docs/config-independent audit - no code, config, schema, collector, taxonomy, or ranking change in this pass. No Instagram URL was fetched (see Section 1). Three public web URLs (HBX, Musinsa, Coverchord) were checked read-only (robots.txt + a single page/JSON fetch each) - the same depth of research already used in `docs/MARKET_SOURCE_AUDIT.md`, not a collector implementation.

Purpose: audit whether the 8 sources the user actually references for trend research are already reflected anywhere in this repo (editorial source / market source / manual reference / visual evidence source), classify each into a lane, and propose - design only - how a **Visual Diffusion / Style Context** lane would sit next to the existing, frozen Editorial and Market architectures without merging into either.

## 0. Live state verified before the audit

- Repo/branch: `C:/Users/bcave/dev/open-design-trend-dashboard`, `feature/trend-dashboard`
- HEAD at audit start: `a9b45993c7e475ac6f92151cdce45e8a177b3743` ("docs: audit ordered editorial visual-evidence feasibility")
- Working tree at audit start: clean
- EditorialPost(real): 617, EditorialMention(real): 2781, Bundles: 89, Canonical Duplicates: 0, Mention Duplicates: 0 (re-confirmed fresh, read-only, this pass)
- Market (`MarketRankingSnapshot`, `dataMode: "real"`): 667 (unchanged - nothing in this pass touches Market)
- Scheduler: `Ready`, last result `0`, next run **2026-09-14 08:30 KST** (unchanged)

## 1. What this pass did and did not fetch, and why

| Source group | Live fetch performed? | Reasoning |
|---|---|---|
| Instagram (all 5 URLs) | **No** | Per the user's own explicit boundary (no login bypass, no browser scraping, no private API, no access-restriction workaround) and this project's standing "safest level before P0" instruction, no Instagram URL was requested in this pass - not even a plain unauthenticated page load. Classification below is based on the user's own account names/description plus this repo's *already-existing* official-API feasibility research (`docs/VISUAL_FIRST_TREND_BOARD_AUDIT.md` Section 7), not re-derived from scratch. |
| `hbx.com/women` | Yes - `robots.txt` + one page fetch | Same evidentiary depth `docs/MARKET_SOURCE_AUDIT.md` already used for HBX's men's category; this is read-only research of a public commerce site, not a collector run. |
| `musinsa.com/content/list?contentCategoryCode=019002001` | Yes - `robots.txt` + one page fetch | Same reasoning; this URL was never previously evaluated in this repo (only `/main/musinsa/ranking` was). |
| `coverchord.com` | Yes - `robots.txt` + one public `products.json` fetch | Same reasoning; zero prior repo reference. The `products.json` fetch mirrors the exact, already-accepted Shopify public-collection method this codebase already uses for Slam Jam/Stussy - not a new technique. |

## 2. Existing repo coverage - what was already there, per source

| # | Source | Already in repo? | Where | Exact match to the given URL? |
|---|---|---|---|---|
| 1 | `instagram.com/p/DWY-0_5kYwy/` | No | - | - |
| 2 | `instagram.com/glowupmag/` | No | - | - |
| 3 | `instagram.com/nonlabel.mag/` | No (see caveat below) | - | - |
| 4 | `instagram.com/wis.magazine/` | No | - | - |
| 5 | `instagram.com/must.know.trend/` | No | - | - |
| 6 | `hbx.com/women` | Partial | `HBX` is a registered `marketSources` entry (`src/config/market-sources.ts`) and has one audited row in `docs/MARKET_SOURCE_AUDIT.md` - but only for `hbx.com/men/categories/t-shirts`. The bare `/women` hub was never evaluated before this pass. | No |
| 7 | `musinsa.com/content/list?...` | Partial | `MUSINSA` is a registered `marketSources` entry with a fully audited row (`docs/MARKET_SOURCE_AUDIT.md`, `docs/KOREA_SOURCE_AUDIT.md`) - but only for `musinsa.com/main/musinsa/ranking` (RESTRICTED). The `/content/list` magazine section was never evaluated before this pass. | No |
| 8 | `coverchord.com` | No | - | - |

**Caveat on #3**: `NONLABEL` (`nonlabel.co.kr`) is a registered `EditorialSource` (`src/config/editorial-sources.ts`, `publisherFamily: "NONLABEL_INDEPENDENT"`). Its name plausibly matches Instagram's `@nonlabel.mag`, but **this pass performed no live check of either site to confirm they are the same publisher** (confirming would require visiting the Instagram profile, which this pass deliberately avoided per Section 1). Treat the match as a plausible, human-verifiable-only hypothesis - never as a fact a collector should act on. Section 5 below explains exactly why this distinction must be structurally enforced regardless of the answer.

**Summary**: 5 of 8 sources (all 5 Instagram URLs, plus Coverchord) have **zero** prior repo reference of any kind. The other 3 (HBX, Musinsa, and NONLABEL-the-web-source) are registered, but registered for a *different URL/purpose* than the one given here - none of the 8 URLs, taken literally, was already covered end to end.

## 3. Per-source findings from this pass's own read-only checks

### 3.1 `hbx.com/women`

- `robots.txt`: wildcard `*` user-agent is allowed broadly; only auth/account/order/login paths are disallowed. `/women` is not blocked.
- Live fetch: HTTP 200, but the page is a **navigation hub** (category shortcut links, two promotional banners, login/newsletter widgets) - no product grid, no price, no embedded JSON (`__NEXT_DATA__`/JSON-LD) with product data. Structurally identical in kind to what a bare `/men` (not `/men/categories/t-shirts`) hub would look like.
- Conclusion: the *site* is exactly as accessible as the already-audited men's category, but `/women` itself is not a usable target - the equivalent of the already-audited `/men/categories/t-shirts` would be a specific `/women/categories/<item>` URL, not fetched in this pass (no category was specified by the user).

### 3.2 `musinsa.com/content/list?contentCategoryCode=019002001`

- `robots.txt`: confirmed fresh this pass - the wildcard fallback group (`Disallow: /`, applying to any unlisted UA including this project's own collector identity) still governs this path; no path-specific rule exists for `/content/` or `/content/list`. This is the **same restriction**, for the same structural reason, already documented for `/main/musinsa/ranking` - the domain-wide policy, not something specific to the ranking page.
- Live fetch: returned only the page's static header ("무신사 콘텐츠" - "Musinsa Content"); the actual content list did not appear in the fetched markup, consistent with client-side hydration after page load (the same pattern already documented as blocking 29CM and ZIGZAG in `docs/MARKET_SOURCE_AUDIT.md` - `__NEXT_DATA__`-shaped apps with empty server-rendered product/content state).
- Conclusion: **two independent blockers**, not one - robots-restricted for automated collection, AND (even if that were waived) no stable server-rendered structure exists to parse today. Distinct from the ranking page in one important way: this is Musinsa's *own in-house editorial/magazine section*, not a product ranking or assortment listing - see Section 4's lane discussion.

### 3.3 `coverchord.com`

- `robots.txt`: matches the standard Shopify-generated template (`/services`, `/sf_*`, `cart.js`, `/recommendations/products`, checkout/account disallows) - the same platform signature already confirmed for Slam Jam and Stussy in `docs/MARKET_SOURCE_AUDIT.md`. Public collection paths are not blocked.
- Live fetch: `https://coverchord.com/collections/all/products.json?limit=5` returned **real, valid product JSON** - first product "1.5 GAUGE BIG KNIT" (COMESANDGOES, ¥13,200, three colorways). This is the exact same public-JSON method already implemented and running for Slam Jam/Stussy - not a new integration technique.
- Conclusion: this is the single strongest, most concrete "ready to implement" finding in this audit. Prices in JPY suggest a Japanese select-shop, same category as this project's other JP-adjacent references (WEAR, Rakuten, BEAMS).

## 4. Lane classification

Four lanes, exactly as specified by the user - and, critically, **the lane is a property of the URL/account, not of the domain**. `musinsa.com` alone spans two different lanes depending on path (ranking page = C, content section = B/D); `nonlabel.co.kr` (web, lane A) and `@nonlabel.mag` (Instagram, lane B) must never be treated as one interchangeable "NONLABEL" source even if they share a publisher.

- **A. EDITORIAL DIRECT EVIDENCE** - verifies ITEM + ATTRIBUTE from text. None of the 8 sources qualify for this lane as given; the one already-registered lane-A source in this neighborhood (`NONLABEL` web) is untouched by anything in this pass.
- **B. VISUAL DIFFUSION / STYLE CONTEXT** - repeated styling/mood/silhouette reference; never direct-attribute or sales proof. All 5 Instagram sources, plus `musinsa.com/content/list`.
- **C. MARKET / ASSORTMENT** - real store product exposure/ranking; never over-read as sales volume. `hbx.com/women` (once a real category URL is chosen), `coverchord.com`.
- **D. MANUAL RESEARCH ONLY** - valuable but not realistically automatable right now. Overlaps with B for the Instagram accounts (automation is blocked for a different reason - ToS/access, not value) and applies fully to `musinsa.com/content/list` (robots-blocked, not merely low-value).

## 5. The NONLABEL web/Instagram boundary - why it must never collapse

This is worth stating as its own section because it is the single highest-risk mistake this audit could otherwise enable.

- `NONLABEL` (`nonlabel.co.kr`) is today a trusted `EditorialSource`: its article text feeds `extractDirectAttributeRelations`, contributes to `bundleSourceSpread`/`independentEvidenceClusterCount`, and can appear as a `DIRECT_PHRASE` relation inside a ranked bundle.
- `@nonlabel.mag` (Instagram), even if a human later confirms it is operated by the same publisher, is an **entirely different evidence type**: a stream of images with no grammatical ITEM+ATTRIBUTE text to extract, no `EditorialPost.text` equivalent, and - per Section 1 - not automatable today without official API access this project does not have.
- If a future implementation ever links the two (e.g. a `relatedEditorialSource` metadata pointer, proposed in Section 6 as optional), that link must remain **metadata only** - it must never cause an Instagram image to be counted toward `bundleArticlePresence`, `bundleSourceSpread`, `independentEvidenceClusterCount`, or any ranking input, and it must never be displayed as if it were text-verified direct evidence. The existing `EditorialVisualContextStrip`'s own permanent disclaimer pattern (`기사 대표 이미지 · 아이템/속성/무드를 직접 증명하지 않음`) is the right precedent to extend, not bypass, for this new lane.

## 6. Proposed Visual Diffusion source model (design only - no config/schema change in this pass)

Two new, narrow shapes, structurally parallel to - and explicitly never merged with - `EditorialSourceConfig`/`EditorialMention` and `MarketRankingSnapshot`:

```ts
// One registered account/source a planner watches for repeated visual context.
// Config-shape only, mirroring EditorialSourceConfig's spirit - NOT a proposal
// to add this to editorialSourceConfigs itself, which stays text/direct-relation only.
type VisualDiffusionSourceConfig = {
  id: string;                    // e.g. "IG_GLOWUPMAG"
  platform: "INSTAGRAM" | "WEB_MAGAZINE" | "OTHER";
  handle: string;                // e.g. "@glowupmag"
  profileUrl: string;
  role: string[];                // e.g. ["EDITORIAL", "STYLING_REFERENCE"]
  collectionMethod: "MANUAL_CURATION" | "OFFICIAL_API_AUTHORIZED" | "OFFICIAL_EMBED_ONLY";
  relatedEditorialSource: EditorialSource | null; // optional, metadata-only cross-reference (see Section 5) - e.g. "NONLABEL" for @nonlabel.mag, left null until a human confirms it
  note: string;                  // why this account matters, human-written
};

// One human-curated observation of one specific image/post - never auto-generated.
type VisualDiffusionReference = {
  sourceId: string;              // -> VisualDiffusionSourceConfig.id, or "AD_HOC" for a one-off permalink like the DWY-0_5kYwy example
  permalink: string;             // the exact post/page URL
  capturedAt: string;            // ISO timestamp of when a human noted it
  itemContext: string | null;    // optional link to a specific bundle/item this seems related to - human-assigned, never auto-inferred from the image
  moodLabels: string[];          // small, human-curated controlled vocabulary - same constraint as EDITORIAL_ORDERED_VISUAL_EVIDENCE_AUDIT.md's EditorialVisualMoodObservation
  reviewerNote: string | null;
  reviewedBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};
```

Constraints, restated because they are the entire point of this model (identical spirit to `EDITORIAL_ORDERED_VISUAL_EVIDENCE_AUDIT.md` Section 8's mood-lane rules, extended to cover an external platform):

- Never merged into `EditorialMention`, `extractDirectAttributeRelations`, `attribute-bundle-service.ts`, or `MarketRankingSnapshot`. No ranking input anywhere reads from this model.
- `moodLabels` are chosen by a human from a small curated vocabulary - never generated from an image, alt text, or caption by any code path.
- Only `OFFICIAL_EMBED_ONLY` or manual permalink storage is in scope until an account is genuinely `OFFICIAL_API_AUTHORIZED` (owned/partner account + Meta app + owner authorization, per `VISUAL_FIRST_TREND_BOARD_AUDIT.md` Section 7's already-established feasible-paths list). No image binary is cached or transformed without a separate rights review, exactly as already stated for editorial article images.
- `relatedEditorialSource` is optional, nullable, human-set metadata only - it exists so a planner can SEE the NONLABEL web/Instagram relationship if confirmed, without ever letting the system infer or act on it.

**Nothing above is implemented in this pass.** It is a design proposal for a future, separately reviewed, explicitly-approved pass - consistent with the instruction to keep this pass docs/config-independent.

## 7. How a product planner actually uses this in the visual-first "요즘 뭐가 뜨는가?" card

Extending the existing, frozen home-screen contract (`VISUAL_FIRST_TREND_BOARD_AUDIT.md` Section 5) with one new, clearly separated section - order and existing sections unchanged:

1. **ITEM** - Korean specific-item label (unchanged, from the existing bundle).
2. **DIRECT ATTRIBUTE(S)** - dimension-labelled chips from the exact bundle only (unchanged).
3. **MOOD/STYLE** - a direct STYLE relation chip if one exists in text, else `직접 무드 근거 없음` (unchanged - this slot is still never filled by an image or an Instagram post).
4. **VISUAL EVIDENCE** - the existing `DIRECT_BLOCK`/`ADJACENT_BLOCK` hero slot (unchanged; still empty for all real data today, per `EDITORIAL_ORDERED_VISUAL_EVIDENCE_AUDIT.md`).
5. **EDITORIAL VISUAL CONTEXT** - the existing `EditorialVisualContextStrip` (unchanged; article heroes, `기사 대표 이미지` disclaimer).
6. **NEW - 반복 노출된 스타일링 레퍼런스 ("Visual Diffusion References")** - a distinctly labelled, visually separated section (different heading, different disclaimer, never intermixed with #5's grid) showing human-curated `VisualDiffusionReference` entries whose `itemContext` a reviewer has pointed at this bundle:
   - thumbnail via official embed or an outbound link only (never a cached/transformed copy without rights review)
   - source account (e.g. `@glowupmag`) and platform
   - permalink (opens the original post)
   - human-set `moodLabels` (e.g. `빈티지`, `워크웨어`) shown as plain tags, visually distinct from the DIRECT ATTRIBUTE chips in #2
   - reviewer attribution and date
   - a permanent disclaimer, mirroring #5's pattern: `사람이 직접 선별한 스타일링 참고 자료 · 아이템/속성/무드의 직접 증거 아님, 판매량 아님`
7. Concise strength/source/date copy, then detailed counts below the first viewport (unchanged).

This gives a planner exactly the reading order implied by the product goal - item, then proven attributes, then proven mood (rare today), then any structurally-proven image (currently always empty), then editorial article context (implemented), then - new - a human-reviewed "here's how people are actually styling/photographing this" reference lane, with every lane honestly labelled for what kind of evidence it is.

## 8. Full per-source table

| Source | Current repo coverage | Recommended lane | Automatic collection feasibility | Image usefulness | Legal/access risk | Recommended action | Timing |
|---|---|---|---|---|---|---|---|
| `instagram.com/p/DWY-0_5kYwy/` | None | B | None automated (single post); manual curation only, optionally displayed via Instagram's official oEmbed for front-end display (no persistence/analytics per Meta's own oEmbed guidance) | High - exactly the concrete single-reference example planners want | Low if limited to human-curated permalink + official embed/outbound link, no scraping/caching | Treat as the reference example for the `VisualDiffusionReference` "AD_HOC" shape (Section 6) | Manual only |
| `instagram.com/glowupmag/` | None | B | None without official Instagram professional-account API access + owner/partner authorization (`VISUAL_FIRST_TREND_BOARD_AUDIT.md` Section 7) | High per the user's own framing (fast visual trend read) | Medium-High for any bulk/automated approach; Low if permalink-only | Register as a `VisualDiffusionSourceConfig` "MANUAL_CURATION" account-level watch entry (design only this pass) | Manual only now; revisit `OFFICIAL_API_AUTHORIZED` only if a partnership/owner authorization becomes available |
| `instagram.com/nonlabel.mag/` | None (web `NONLABEL` is registered but is a separate lane-A source - see Section 5) | B, structurally isolated from the web `NONLABEL` editorial source | Same as `glowupmag` - none without official API + authorization | High | Medium-High automated / Low permalink-only; **additional risk**: accidental conflation with the trusted web NONLABEL editorial source if not kept structurally separate | Same as `glowupmag`; if a human confirms the publisher match, record it only via the optional, metadata-only `relatedEditorialSource` field - never merge evidence | Manual only |
| `instagram.com/wis.magazine/` | None | B | Same as `glowupmag` | High | Same as `glowupmag` | Same as `glowupmag` | Manual only |
| `instagram.com/must.know.trend/` | None | B | Same as `glowupmag` | High | Same as `glowupmag` | Same as `glowupmag` | Manual only |
| `hbx.com/women` | Partial - HBX registered as a `marketSources` entry, but only `/men/categories/t-shirts` was previously audited | C (once a real category URL is chosen - `/women` itself is a navigation hub, not a product page, confirmed this pass) | Partial, same tier as the existing HBX row - public HTML opens (robots allows it), no stable JSON/ranking API, would need the same not-yet-built HTML parser | Medium - real product photography exists on category/product pages, useful as market-assortment visual context, not editorial mood | Low - public HTML, robots-compliant, same precedent as the existing HBX row | Extend `MARKET_SOURCE_AUDIT.md`'s HBX row with a women's-category counterpart once a specific `/women/categories/<item>` URL is chosen; `/women` root is not a usable target as given | After P0 (new collector-adjacent scope); browsing it directly is fine any time |
| `musinsa.com/content/list?contentCategoryCode=019002001` | Partial - MUSINSA registered as a `marketSources` entry, but only `/main/musinsa/ranking` was previously audited, and that page is a different lane entirely | B/D (this is Musinsa's own in-house editorial/magazine section, not product ranking - the existing MUSINSA market-source registration does not cover it) | Restricted - robots.txt's wildcard fallback blocks this path too (confirmed fresh), and the page content did not render server-side in this pass's own fetch (client-hydrated, same limitation pattern as 29CM/ZIGZAG) | Unconfirmed this pass (content didn't render) but plausibly high for a human browsing it directly | Medium - robots-restricted for automated collection; respect it, per this project's standing "no robots.txt workarounds" principle | Manual research reference only; if a specific piece is worth referencing, curate it as a human permalink (same model as Instagram), never scrape the section | Manual only |
| `coverchord.com` | None | C | **High/SUPPORTED** - confirmed this pass to be a Shopify storefront with a public `products.json` endpoint returning real product data, the exact same proven method already running for Slam Jam and Stussy in this codebase | Medium-High - Shopify product JSON typically includes per-variant image URLs, useful as market-assortment visual context | Low - public JSON, robots-compliant, same precedent already accepted twice in this codebase | Add `COVERCHORD` to `marketSources`/`market-sources.ts` and a `SUPPORTED` row in `MARKET_SOURCE_AUDIT.md`, mirroring the existing Slam Jam/Stussy collector config | **Ready now as a small, isolated, config-only follow-up** - not implemented in this docs-only pass, and independent of the Editorial P0 gate (it is a Market source, unrelated to the editorial scheduler) |

## 9. What changed vs. what did not

- **New**: this document; two pointer lines in `CURRENT_STATE.md`/`NEXT_PRIORITIES.md` (Section 10 below).
- **Unchanged**: `editorialSourceConfigs`, `marketSources`, `market-sources.ts`, `MARKET_SOURCE_AUDIT.md`, any collector, any schema, any taxonomy, any ranking logic, `EditorialVisualContextStrip`, the P0 gate, the scheduler. No live editorial refresh ran. Market(real) remained 667; EditorialPost(real)/EditorialMention(real)/Bundles remained 617/2781/89, Canonical/Mention Duplicates remained 0/0 throughout this pass.

## 10. Decisions needed before any of this is implemented

1. **Coverchord**: ~~approve the small, isolated, config-only follow-up~~ **Approved and implemented 2026-09-11** (same-session follow-up to this audit). Added `COVERCHORD` to `marketSources`/`market-sources.ts` and a `SUPPORTED` row + category mapping in `market-category-map.ts`/`MARKET_SOURCE_AUDIT.md`, mirroring Slam Jam/Stussy exactly. Category handles (`tops`, `jackets-coats`, `bottoms`, `bags`, `hats-caps`) were freshly verified live and non-empty, and checked against a fresh `robots.txt` fetch, before being added - see `MARKET_SOURCE_AUDIT.md`'s new "Coverchord" section for the full evidence. Config-only: no collector logic, schema, ranking, or Editorial code touched. **Not yet run** - no `collect:market --source=COVERCHORD` invocation has happened, and `typecheck`/`build` validation plus a live git commit are still pending local shell access (see this pass's own handoff note in `CURRENT_STATE.md`).
2. **HBX women's category**: which specific `/women/categories/<item>` path(s) should be audited to produce a real women's-side counterpart to the existing men's row?
3. **Instagram accounts**: approve registering the 4 accounts (plus the 1 example permalink) as `MANUAL_CURATION`-tier `VisualDiffusionSourceConfig` entries (a config/UI question, not a collector question) - and decide who is the human reviewer in practice, and what triggers adding a new permalink.
4. **NONLABEL cross-reference**: should a human explicitly verify whether `@nonlabel.mag` and `nonlabel.co.kr` share a publisher before setting `relatedEditorialSource`, and if so, who does that check (this pass deliberately did not, per Section 1)?
5. **Musinsa content section**: confirm there is no interest in pursuing this further given the double robots/hydration blocker - or flag it purely as a manual browsing reference with no future automation attempt.
6. **Visual Diffusion References UI** (Section 7, item 6): does this ship as part of the next post-P0 visual-first pass, or wait until the `EditorialVisualMoodObservation` lane from `EDITORIAL_ORDERED_VISUAL_EVIDENCE_AUDIT.md` is built first, so both human-review lanes share one workflow?

None of these decisions were made in this pass.
