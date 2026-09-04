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
