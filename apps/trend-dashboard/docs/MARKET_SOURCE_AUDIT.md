# Market Source Feasibility Audit

Checked date: 2026-08-28 (Korea STORE rows refreshed 2026-09-03 - see `docs/KOREA_SOURCE_AUDIT.md` for the full deep-audit evidence)

This audit records which sources can be collected without bypassing access controls. The project does not use login-only data, CAPTCHA bypasses, private API reverse engineering, robots.txt workarounds, or rate-limit evasion.

## Summary

| Source | Target URL | Ranking Available | Category Ranking | Public Access | robots.txt | Official API | Structured Data | Collection Method | Status | Reason |
|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| MUSINSA | https://www.musinsa.com/main/musinsa/ranking | Yes | Yes | Yes | Disallow for `User-agent: *` | No public ranking API found | Not used | None | RESTRICTED | robots.txt fallback blocks automated collection. |
| 29CM | https://www.29cm.co.kr/store/best-items | Official 베스트 page exists, semantic confirmed | Not collectible | Yes (200, no challenge) | Allow for `User-agent: *`, target route not disallowed | No public ranking API found | None - `__NEXT_DATA__` present but `dehydratedState.queries` is empty; no JSON-LD product data | None | RESTRICTED | Deep audit 2026-09-03: robots and access are fine, but the ranking list only exists via an undocumented internal API (`/api/v4/best/items`-style); using it is out of scope. |
| ZOZOTOWN | https://zozo.jp/ranking/ | Yes | Yes | No in local audit | Unknown | No public ranking API found | Not verified | None | RESTRICTED | Robots/ranking pages were not reliably retrievable from the local environment. |
| KREAM | https://kream.co.kr/ | Yes | Limited | No in local audit | Unknown | No public ranking API found | App/API dependent | None | RESTRICTED | Public access failed; collection would depend on private app/API behavior. |
| ABLY | https://a-bly.com/ | Not evaluated (robots-blocked) | Not evaluated | Not fetched | `Disallow: /` for `User-agent: *` except `/$` and `/app*`; only Googlebot gets broader access | No public ranking API found | Not fetched | None | RESTRICTED | Deep audit 2026-09-03: robots.txt blocks every ranking/category path for a non-Google collector identity. |
| ZIGZAG | https://zigzag.kr/categories | Not collectible - no product data reachable | Not collectible | Yes (200, no challenge) | Allow for `User-agent: *` (only `GPTBot` disallowed) | No public ranking API found | None - `__NEXT_DATA__` present but `dehydratedState.queries` is empty on both `/` and `/categories` | None | PARTIAL | Deep audit 2026-09-03: robots is open and pages load, but the entire catalog is client-hydrated via an internal app API with zero SSR/HTML product data. |
| W Concept | https://www.wconcept.co.kr/Best | Not evaluated (robots-blocked) | Not evaluated | Not fetched | Strict whitelist: `Disallow: /` for `User-agent: *`, only named crawlers allowed | No public ranking API found | Not fetched | None | RESTRICTED | Deep audit 2026-09-03: full-site robots disallow for any non-whitelisted UA. |
| EQL | https://www.eqlstore.com | Not evaluated (robots-blocked) | Not evaluated | Not fetched | Strict whitelist: `Disallow: /` for `User-agent: *`, `Allow: /$` only | No public ranking API found | Not fetched | None | RESTRICTED | Deep audit 2026-09-03: same full-site robots disallow pattern as W Concept. |
| WEAR Japan | https://wear.jp/ranking/ | Yes | Not stable | Yes | Partial allow | No public ranking API found | HTML | Manual review only | PARTIAL | General ranking opens; tested item-category ranking paths returned 404. |
| Rakuten Fashion | https://brandavenue.rakuten.co.jp/ranking/ | Yes | Not stable | Yes | Allow with API/front restrictions | Rakuten APIs require app credentials and are not ranking-specific here | HTML | Candidate HTML parser | PARTIAL | Public ranking HTML opens, but parsing is less stable than JSON feeds. |
| BEAMS | https://www.beams.co.jp/ranking/ | Unknown | Unknown | No in local audit | Unknown | No public ranking API found | Not verified | None | RESTRICTED | Robots/page checks were not reliably retrievable. |
| SSENSE | https://www.ssense.com/en-us/men/clothing?sort=trending-desc | Yes | Yes | No in local audit | Disallows `sort` query | No public ranking API found | HTML | None | RESTRICTED | Trending sort URL is disallowed by robots and page access failed. |
| END. | https://www.endclothing.com/us/clothing | Limited | Yes | Yes | Partial allow, catalog/search restrictions | No public ranking API found | HTML | Manual import candidate | PARTIAL | Public HTML opens, but no stable public ranking JSON was selected. |
| Slam Jam | https://www.slamjam.com/collections/t-shirts/products.json | No sales rank | Yes, collection order | Yes | Allows collection paths; sort/filter blocked | Shopify public JSON | JSON | Shopify `products.json` collection order | SUPPORTED | Public JSON is accessible without restricted query parameters. |
| Stussy | https://www.stussy.com/collections/tees/products.json | No sales rank | Yes, collection order | Yes | Allows collection paths; `sort_by` and `limit` query blocked | Shopify public JSON | JSON | Shopify `products.json` collection order | SUPPORTED | Public JSON is accessible without query parameters. |
| HBX | https://hbx.com/men/categories/t-shirts | Limited | Yes | Yes | Partial allow | No public ranking API found | HTML | Manual import candidate | PARTIAL | Public HTML opens, but a stable automated ranking parser was not selected. |
| Bodega | https://bdgastore.com/collections/t-shirts/products.json | No sales rank | Yes | Yes | Allows collection paths | Shopify public JSON | JSON | Not selected | NOT_USEFUL | Tested collection returned no products for the target handle. |
| Coverchord | https://coverchord.com/collections/tops/products.json | No sales rank | Yes, collection order | Yes | Allows collection paths; `sort_by`, `+`/`%2B`, combined `filter`, `ls=` query patterns blocked | Shopify public JSON | JSON | Shopify `products.json` collection order | SUPPORTED | Added 2026-09-11 (`docs/TREND_RESEARCH_SOURCE_REGISTRY.md` Section 3.3/8/10). Public JSON confirmed live for `tops`, `jackets-coats`, `bottoms`, `bags`, `hats-caps`; no query parameters used, matching `getSourceCategoryUrl`'s existing no-query-param behavior. |
| Rednape | https://rednape.kr/category/new-arrivals/23/ | No sales rank | Yes, catalog listing order | Yes | Allow for category/product paths; only admin/cart/account/search-query paths disallowed (standard Cafe24 boilerplate) | No public ranking API found; no JSON endpoint of any kind found | HTML (server-rendered) | Config registered 2026-09-14; HTML-parsing collector NOT YET IMPLEMENTED | CONFIG_ONLY | Registered 2026-09-14 as a config-only entry (`docs/TREND_RESEARCH_SOURCE_REGISTRY.md`-style precedent, see "Rednape" section below). Category and product pages confirmed server-rendered via read-only `WebFetch`; no products.json/JSON API exists (unlike Slam Jam/Stussy/Coverchord), so this needs a new HTML-parsing collector class, not yet designed or written. Zero rows collected. |

## Supported Real Sources

### Slam Jam

- Method: public Shopify collection `products.json`.
- Interpretation: category collection exposure order, not sales volume.
- Current categories:
  - `SHORT_SLEEVE_TSHIRT`: `/collections/t-shirts/products.json`
  - `JACKET`: `/collections/jackets/products.json`
  - `PANTS`: `/collections/pants/products.json`
  - `BAG`: `/collections/accessories/products.json`
  - `HEADWEAR`: `/collections/hats/products.json`
- Default stable volume: up to 30 products per category from Shopify default response.

### Stussy

- Method: public Shopify collection `products.json`.
- Interpretation: category collection exposure order, not sales volume.
- Current categories:
  - `SHORT_SLEEVE_TSHIRT`: `/collections/tees/products.json`
  - `JACKET`: `/collections/outerwear/products.json`
  - `PANTS`: `/collections/pants/products.json`
  - `BAG`: `/collections/bags/products.json`
  - `HEADWEAR`: `/collections/headwear/products.json`
- Important limitation: do not append `?limit=` or `sort_by` query parameters because robots.txt includes restrictions for those patterns.

### Coverchord

- Added 2026-09-11, approved as a small, isolated, config-only follow-up per `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` Section 10 decision 1 - independent of the Editorial P0 gate.
- Method: public Shopify collection `products.json`. Same proven technique already running for Slam Jam/Stussy - no new integration pattern.
- Interpretation: category collection exposure order, not sales volume. Prices observed in JPY (Japanese select shop).
- Current categories (each verified live and non-empty via a read-only fetch on 2026-09-11, no query parameters):
  - `SHORT_SLEEVE_TSHIRT`: `/collections/tops/products.json` (broadest available top-level category handle for tees; e.g. "SUVIN COTTON TEE")
  - `JACKET`: `/collections/jackets-coats/products.json` (e.g. "NEW NORMAL SOLOTEX SUIT JACKET")
  - `PANTS`: `/collections/bottoms/products.json` (e.g. "AF OVER PANT - HEAVYWEIGHT COTTON RIPSTOP")
  - `BAG`: `/collections/bags/products.json` (e.g. "BAGUETTE TOTE SMALL")
  - `HEADWEAR`: `/collections/hats-caps/products.json` (e.g. "NY EAR CAP")
- robots.txt confirmed (2026-09-11): `/collections/` and `/products/` are allowed for `User-agent: *`; only `sort_by`, `+`/`%2B`/`%2b`, combined `filter`, and `ls=` query patterns are disallowed. The collector's own `getSourceCategoryUrl` never appends a query string, so no disallowed pattern is ever requested.
- The site's `collections.json` also exposes many brand/campaign/promotional collection handles (e.g. `fcp-01-tops`, `gold30-hats-caps`) not used here - only the plain top-level category handles above were selected, matching the Slam Jam/Stussy pattern of one stable handle per `RankingCategory`.

### Rednape

**Config-only, registered 2026-09-14. No collector implemented. No rows collected.** Unlike Slam Jam/Stussy/Coverchord, Rednape has no `products.json`/JSON API of any kind - this section exists to record the verified platform evidence a future HTML-parsing collector design would start from, not to claim collection support exists today.

- **Verified URL patterns** (via read-only `WebFetch`, 2026-09-14):
  - Category: `rednape.kr/category/{slug}/{numeric-id}/` - e.g. `/category/new-arrivals/23/`, `/category/accessories/45/`, `/category/best-20/26/`, `/category/outers/28/` (only the first two were fetched and verified in depth; the others were seen listed in the sitemap but not opened).
  - Product: `rednape.kr/product/{korean-slug}/{numeric-id}/` - e.g. `/product/unisex-강추-1993-기모-후드티-3c/24/`, `/product/unisex-기획-글로시-나일론-라이트-패딩-3c/19/`. The slug itself already embeds Korean item-type/material terms.
  - Pagination: category pages expose `?page=N` as literal pagination-control `href`s (confirmed `?page=1`/`?page=2`/`?page=3` present on `/category/new-arrivals/23/`).
  - Sitemap: `rednape.kr/sitemap.xml` - flat, lists category and product URLs directly.
- **robots.txt** (fetched 2026-09-14): disallows only `/admin/`, `/api/`, `/order/`, `/basket/`, `/checkout/`, `/login/`, `/member/`, `/myshop/`, query-parameterized `/search.html`, and `/board/*/write.html` - standard Cafe24 platform boilerplate. Category and product paths are explicitly allowed. Declares crawl-delay (1s Googlebot / 2s Yeti / 5s Bingbot) and a sitemap at `/sitemap.xml`. No blocking issue of the kind found on mmm-mag.co.kr (which explicitly disallows `ClaudeBot`).
- **Platform evidence for "Cafe24"**: the `/admin/`, `/myshop/`, and `/board/*/write.html` robots.txt paths, plus the `/category/{slug}/{id}/` and `/product/{slug}/{id}/` URL shape, and a `cafe24img`-style image CDN observed on the sampled product page, are all hallmark Cafe24 storefront-platform conventions. This is inferred platform evidence, not a vendor confirmation from the site operator.
- **Server-rendered vs. client-hydrated**: confirmed server-rendered. A sampled product page (`/product/unisex-강추-1993-기모-후드티-3c/24/`) returned full name, price, color options, and material composition in raw HTML without JS execution; a sampled category page (`/category/new-arrivals/23/`) returned 20 product listings (names, prices, images) directly in raw HTML, with no login required for either.
- **Sampled product-field evidence** (one product page, `/product/unisex-강추-1993-기모-후드티-3c/24/`):
  - Name: "[UNISEX] 강추! 1993 기모 후드티 (3C)"
  - Price: 39,800 KRW
  - Colors: White / Black / Burgundy, one free size
  - Material: "면 100%" (100% cotton), described as a soft cotton blend
  - Fit measurements: total length 68cm, shoulder width 54cm, chest 63cm, sleeve length 60cm
  - Images: embedded via a `cafe24img`-style CDN URL, directly linked in raw HTML
- **Sampled category-listing evidence** (`/category/new-arrivals/23/`, first page): 20 products, mixed item types including long sleeves (e.g. "터니 링 슬럽 롱슬리브"), pants (e.g. "패널 다잉 절개 코튼 팬츠"), and other long sleeves, jackets, and knitwear referenced generically. This is a cross-item-type, recency-sorted section, not scoped to one `RankingCategory` - the config entry maps it only to the two types with a concretely quoted example (`LONG_SLEEVE_TSHIRT`, `PANTS`), not to every type the section may contain.
- **Explicit status**: `src/config/market-sources.ts` and `src/config/market-category-map.ts` register `REDNAPE` with `method: "CAFE24_CATEGORY_HTML"` and `rankingVerified: false`. `createMarketCollector` (`src/collectors/market/index.ts`) has no case for this method and falls through to `UnsupportedMarketCollector` - so even if collection were attempted against this config today, it would safely no-op with an `UNSUPPORTED` result, not silently succeed. **No HTML parser has been designed or written. No database rows exist for this source.**

## Ranking Interpretation

Collected rank means top ranking presence within a source/category feed. It does not mean:

- absolute sales volume
- total market supply
- total product count in the market
- demographic demand

Dashboard wording should use `Ranking Presence`, `Top Ranking Share`, or equivalent wording instead of `Supply` or `Market Saturation`.

## Historical Data

No stable public historical ranking endpoint was found for the supported sources. Real backfill is not generated or inferred. Trend changes become valid only after future snapshots are collected on different dates.

## Collector Entry

```bash
npm run collect:market -- --source=SLAM_JAM --category=SHORT_SLEEVE_TSHIRT --limit=50
npm run collect:market -- --all --all-categories --limit=50
```

The collector stores records with `dataMode=real`. Sample and manual import data remain separated.
