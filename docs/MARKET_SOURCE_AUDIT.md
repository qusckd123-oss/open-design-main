# MARKET Source Audit

Last verified: 2026-09-02.

This audit separates whether data is collectible from what the collected data means. Product arrays are stored as verified ranking only when the source page itself confirms bestseller, popular, trending, or ranking semantics and the allowed public HTML exposes stable ordered products.

| Source | Target URL | Data Type | Ranking Scope | Ranking Semantic | Ranking Verified | robots.txt | Collection Method | Status | Reason | 10-20 Relevance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| END | `https://www.endclothing.com/us/clothing/clothing-bestsellers` | BEST_SELLER | DEPARTMENT / `CLOTHING` | Official `Men's Clothing Bestsellers` page; ordered product hits in server-rendered `__NEXT_DATA__` | YES | ALLOW | Public bestseller page HTML | SUPPORTED | Page title and embedded Algolia facet identify `Clothing / Clothing Bestsellers`; no query-parameter sort or API endpoint is required. Observed category is inferred after collection. | High |
| RAKUTEN_FASHION | `https://brandavenue.rakuten.co.jp/ranking/` | RANKING | SITEWIDE / `ALL_FASHION` | Official Rakuten Fashion popular ranking page; ordered public HTML links include rank badges | YES | ALLOW | Public ranking page HTML plus public item page metadata | SUPPORTED | Page title/H1 identify a fashion item popularity ranking, robots.txt allows `/ranking/` and `/item/`, and no private API or login flow is required. Rank is sitewide fashion ranking position; observed category is inferred from item metadata. | Medium |
| SSENSE | `https://www.ssense.com/` | POPULAR candidate | UNKNOWN | Trending sort exists, but stable no-query public route was not verified | NO | DISALLOW for `/*?sort=*` and `/api/` | Not collected | RESTRICTED | Verified collection would require sort query parameters or API paths that robots.txt disallows. | High |
| MUSINSA | `https://www.musinsa.com/main/musinsa/ranking` | RANKING candidate | CATEGORY candidate | Official ranking candidate | NO | DISALLOW | Not collected | RESTRICTED | robots.txt has `User-agent: *` / `Disallow: /`, so automated collection is disabled. | High |
| 29CM | `https://www.29cm.co.kr/` | UNKNOWN | UNKNOWN | No stable public ranking route confirmed | NO | PARTIAL | Not collected | RESTRICTED | Public pages are SPA/API dependent and no stable documented public ranking route was confirmed. | Medium |
| ZOZOTOWN | `https://zozo.jp/ranking/` | RANKING candidate | CATEGORY candidate | Official ranking candidate | NO | UNKNOWN | Not collected | RESTRICTED | Robots and ranking pages were not reliably retrievable from the local environment without errors. | High |
| KREAM | `https://kream.co.kr/` | POPULAR candidate | UNKNOWN | Popularity candidate | NO | UNKNOWN | Not collected | RESTRICTED | Public web access failed in the audit environment; collection would depend on app/private APIs. | High |
| WEAR | `https://wear.jp/ranking/` | UNKNOWN | UNKNOWN | General ranking page candidate | NO | PARTIAL | Manual review only | PARTIAL | General ranking page is public, but stable item-category ranking URLs were not identified. | Medium |
| SLAM_JAM | `https://www.slamjam.com/collections/t-shirts/products.json` | COLLECTION_ORDER | CATEGORY collection | Public Shopify collection order, not bestseller rank | NO | ALLOW | Shopify `products.json` | SUPPORTED | Collection JSON is accessible and allowed, but product order is not verified as popularity or bestseller ranking. | Medium |
| STUSSY | `https://www.stussy.com/collections/tees/products.json` | COLLECTION_ORDER | CATEGORY collection | Public Shopify collection order, not bestseller rank | NO | PARTIAL | Shopify `products.json` | SUPPORTED | Collection JSON is accessible; `sort_by` URLs are not used because robots disallows collection sort URLs. | High |

## END Verified Ranking Scope

- Active verified source: `END`.
- Stored semantic: `metricType = BEST_SELLER`, `rankingVerified = true`, `rankingScope = DEPARTMENT`, `rankingCategory = CLOTHING`.
- Rank definition: server-rendered order on the official END Clothing Bestsellers page, where first product is rank 1.
- Category handling: END does not expose stable no-query category-specific bestseller URLs for all target categories. The collector reads the official Clothing Bestsellers list and stores the internal product category as `observedCategory`.
- Current collected categories: `SHORT_SLEEVE_TSHIRT`, `JACKET`, `PANTS`.
- Unsupported END target categories in this first verified pass: `BAG`, `HEADWEAR`, because no verified accessories bestseller route was found.

## Rakuten Fashion Verified Ranking Scope

- Active verified source: `RAKUTEN_FASHION`.
- Stored semantic: `metricType = RANKING`, `rankingVerified = true`, `rankingScope = SITEWIDE`, `rankingCategory = ALL_FASHION`.
- Rank definition: ordered position on the official Rakuten Fashion popular ranking page, where first product is rank 1.
- Category handling: no stable category-specific public ranking URL was used in this pass. The collector reads the official sitewide fashion ranking and stores the internal product category as `observedCategory`.
- Collection boundary: public `/ranking/` HTML and public `/item/{id}/` pages only. `/front-api/`, login paths, and disallowed query filters are not used.
- Current collector scope: Rakuten Fashion sitewide TOP200 window, then target-category products are stored by internal observed category.
- Current collected categories: `SHORT_SLEEVE_TSHIRT`, `LONG_SLEEVE_TSHIRT`, `JACKET`, `PANTS`, `BAG`, `HEADWEAR`.
- New entry means `new to observed ranking`; ranking exit means `no longer observed in ranking`. These are not new product launch, sales decline, discontinuation, or inventory movement labels.

## Current Real Data Result

- REAL verified ranking snapshots: 382 (`END` 178, `RAKUTEN_FASHION` 204).
- REAL collection-order snapshots retained: 285.
- REAL total snapshots: 667.
- REAL sources: `END`, `RAKUTEN_FASHION`, `SLAM_JAM`, `STUSSY`.
- Duplicate `(marketProductId, source, periodDate, rankingScope, rankingCategory, observedCategory, audienceSegment)` snapshots: 0.
- REAL and SAMPLE data are separated by `dataMode`.

## Signal Rules

- `FAST_RISING`, `RISING`, `DROPPING`, `COOLING`, `bestRank`, `averageRank`, `rankVolatility`, `consecutiveRise`, and `consecutiveFall` are calculated only when `rankingVerified = true`.
- First END and Rakuten Fashion snapshots keep rank values but do not create rank movement signals because there is no history yet.
- `SLAM_JAM` and `STUSSY` remain assortment/catalog presence sources and are not mixed into verified ranking calculations.
- Movement is date-based: `1D`, `3D`, and `7D` require exact prior calendar dates. Missing dates remain `N/A`.
