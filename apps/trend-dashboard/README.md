# Trend Signal Dashboard MVP

Market-first dashboard for 10s-20s unisex casual and street fashion planning.

The current primary goal is to identify which products, item types, colors, fits, graphics, and details are appearing strongly or rising quickly in external market ranking/presence data.

## Current Direction

Primary analysis:

- MARKET data from approved public collectors or manual imports
- category ranking/presence snapshots over time
- item/sub-item and attribute aggregation
- cross-market opportunity signals

Secondary features are preserved but excluded from the default Dashboard:

- SALES: gated by `ENABLE_INTERNAL_SALES=false`
- NAVER trends: gated by `ENABLE_NAVER_TRENDS=false`

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- SheetJS `xlsx`

## Data Architecture

Core MARKET models:

- `MarketProduct`
- `MarketRankingSnapshot`
- `ImportRun`
- `ImportError`

Important fields:

- `MarketProduct.dataMode`: `sample`, `import`, or `real`
- `MarketRankingSnapshot.rankingScope`: `SITEWIDE`, `DEPARTMENT`, `CATEGORY`, `SUBCATEGORY`, or `UNKNOWN`
- `MarketRankingSnapshot.rankingCategory`: the category/scope where the source actually applies rank, e.g. `ALL_FASHION` or `CLOTHING`
- `MarketRankingSnapshot.observedCategory`: internal observed item category, e.g. `SHORT_SLEEVE_TSHIRT`, `JACKET`, `BAG`
- `MarketRankingSnapshot.audienceSegment`: default `ALL`
- `MarketRankingSnapshot.rawData`: compact collector debug payload, not full HTML

Duplicate policy:

- Product: `source + externalProductId`
- Snapshot: `marketProductId + source + periodDate + rankingScope + rankingCategory + observedCategory + audienceSegment`

Running the same collector or importing the same file again updates the same snapshot instead of creating duplicates.

## Verified Ranking Sources

Current verified ranking collectors:

- `END`: `BEST_SELLER`, `rankingVerified=true`, `rankingScope=DEPARTMENT`, `rankingCategory=CLOTHING`
- `RAKUTEN_FASHION`: `RANKING`, `rankingVerified=true`, `rankingScope=SITEWIDE`, `rankingCategory=ALL_FASHION`

## Ranking Scope

Rank is interpreted only inside the source scope that produced it.

- Rakuten Fashion rank is sitewide fashion ranking position. If rank 12 is a bag, display it as `Sitewide Rank #12, Category: BAG`; do not read it as `BAG category rank #12`.
- END rank is Clothing Bestseller position. If rank 8 is a jacket, display it as `Clothing Bestseller #8, Category: JACKET`; do not read it as category-specific jacket bestseller rank.
- `observedCategory` is the dashboard's internal item/category classification after collection.
- Rakuten collection currently reads the public sitewide ranking window and then stores only target-category products observed inside that window. `NEW_ENTRY` means `new to observed ranking`, not new product launch.
- Ranking exits mean `no longer in observed ranking`, not sales decline, discontinuation, or product removal.

Verified ranking rank is not:

- absolute sales volume
- total market supply
- total category inventory
- demographic demand

Use terms such as `Verified Ranking Presence`, `TOP10 Presence`, `TOP20 Presence`, or `TOP50 Presence`. Avoid interpreting this as market-wide supply or saturation.

## Environment

```env
DATABASE_URL="file:./dev.db"
DATA_SOURCE="mock"
ENABLE_INTERNAL_SALES="false"
ENABLE_NAVER_TRENDS="false"
NAVER_DATA_MODE="mock"
NAVER_API_KEY_ID=""
NAVER_API_KEY=""
NAVER_API_HUB_CLIENT_ID=""
NAVER_API_HUB_CLIENT_SECRET=""
NAVER_API_HUB_BASE_URL="https://naverapihub.apigw.ntruss.com"
NAVER_SHOPPING_CATEGORY_CODE="50000000"
MUSINSA_USER_AGENT="TrendSignalDashboard/0.1"
MARKET_COLLECTOR_USER_AGENT="TrendSignalDashboard/0.1 (+local market audit)"
```

## Install

```bash
cd apps/trend-dashboard
npm install
npm run db:setup
npm run db:seed
```

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main Routes

- `/` Market Pulse Dashboard
- `/editorial` Editorial (magazine) trend verification
- `/market` Market product ranking/presence table
- `/items` Item and sub-item trend table
- `/items/[itemType]` Item detail
- `/import` File upload and paste import

Secondary routes:

- `/sales`
- `/ranking`
- `/categories`
- `/products/[id]`
- `/trends`
- `/settings/keywords`
- `/demand` NAVER Shopping Insight demand signal (REAL data only - see NAVER Demand Signal section). Not linked in primary navigation while NAVER Shopping Insight is unused, but the route/service/schema/tests are preserved unchanged.

## Real Market Collection

Source audit is documented in `docs/MARKET_SOURCE_AUDIT.md`.

Supported automated real collectors:

- `END`: official public Clothing Bestsellers page
- `RAKUTEN_FASHION`: official public sitewide fashion ranking page plus public item pages
- `SLAM_JAM`: public Shopify `products.json` collection feeds, assortment only
- `STUSSY`: public Shopify `products.json` collection feeds without restricted query parameters, assortment only

Run one source/category:

```bash
npm run collect:market -- --source=END --category=SHORT_SLEEVE_TSHIRT --limit=50
```

Run verified ranking sources only:

```bash
npm run collect:verified-market
```

Run assortment sources only:

```bash
npm run collect:assortment-market
```

Run all supported sources and priority categories manually:

```bash
npm run collect:market -- --all --all-categories --limit=50
```

Priority categories:

- `SHORT_SLEEVE_TSHIRT`
- `JACKET`
- `PANTS`
- `BAG`
- `HEADWEAR`

The Shopify endpoints currently return up to 30 products by default. The collector does not append restricted `sort_by` or `limit` query parameters.

Unsupported/restricted sources are not scraped through fallback browser automation. They are recorded in the source audit instead.

## Daily Collection

Daily verified ranking collection does not require the Next.js dev server or port 3000. It only runs the collectors and Prisma database writes.

Windows helper:

```cmd
scripts\collect-verified-market.cmd
```

Logs are written to:

```text
logs/market-collection/YYYY-MM-DD.log
```

The log contains command output, source status, saved rows, failed rows, and exit code. It does not print environment secrets.

## Windows Task Scheduler

Create a daily 09:00 scheduled task from an elevated PowerShell session:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/register-market-task.ps1
```

The script uses Task Scheduler `StartWhenAvailable`, so Windows can run it when the PC becomes available after a missed schedule. If the PC is powered off and not later available, that day's collection will not run. Check `logs/market-collection/` after the first scheduled run.

## Signal Confidence

Ranking signal confidence is based on distinct collected snapshot dates:

- `BASELINE`: fewer than 2 snapshot dates
- `EARLY_DATA`: 2-3 snapshot dates
- `ACTIVE_SIGNAL`: 4 or more snapshot dates

Movement signals are calculated only for `rankingVerified=true` rows and only when an exact prior calendar date exists.

- `1D`: current `periodDate` compared with the snapshot exactly 1 calendar day earlier
- `3D`: current `periodDate` compared with the snapshot exactly 3 calendar days earlier
- `7D`: current `periodDate` compared with the snapshot exactly 7 calendar days earlier

If 09/03 has data but 09/02 does not, 09/03 `1D` remains `N/A`; it does not fall back to 09/01. Missing history is not treated as zero movement.

## Market Source Status

Current automated collector status:

- `MUSINSA`: `RESTRICTED`, robots fallback disallows automated collection.
- `29CM`: `PARTIAL`, official BEST semantic is visible, but stable public product rows or a documented public ranking feed were not verified.
- `ZOZOTOWN`: `RESTRICTED` in local audit, public ranking access was not reliably retrievable.
- `KREAM`: `RESTRICTED`, public access failed and private APIs are not used.
- `WEAR`: `PARTIAL`, general ranking is public but stable item-category ranking URLs were not identified.
- `END`: `SUPPORTED`, verified Clothing Bestseller ranking.
- `RAKUTEN_FASHION`: `SUPPORTED`, verified sitewide fashion ranking.
- `SLAM_JAM`: `SUPPORTED`, public Shopify collection JSON.
- `STUSSY`: `SUPPORTED`, public Shopify collection JSON.

## Market Import

Supported input:

- CSV
- XLS
- XLSX
- pasted table from Excel or Google Sheets

Minimum useful columns:

- `rank`
- `brand`
- `productName`
- `url` or `externalProductId`

If the file has no `source` or `periodDate`, set them on the Import screen.

Optional columns:

- `rankingCategory`
- `audienceSegment`
- `category`
- `itemType`
- `subItemType`
- `price`
- `salePrice`
- `discountRate`
- `reviewCount`
- `likeCount`
- `imageUrl`
- `fit`
- `mainColor`
- `subColor`
- `graphicType`
- `detail`
- `style`
- `gender`

Column aliases are configured in `src/config/import-mapping.ts`.

## Import Preview

Before commit, `/import` shows:

- source
- data date
- detected rows
- detected columns
- mapped fields
- unmapped fields
- duplicate candidates in the uploaded or pasted data

Import failures are row-scoped and saved in `ImportError`; one bad row does not break the whole import.

## Templates

- `public/templates/market-import-template.csv`
- `public/templates/market-import-template.xlsx`
- `public/templates/sales-import-template.csv`
- `public/templates/sales-import-template.xlsx`

Regenerate XLSX templates:

```bash
npm run templates:generate
```

## Sample Data

Reset sample data:

```bash
npm run data:reset-sample
```

Sample MARKET data:

- 4 sources: `MUSINSA`, `29CM`, `ZOZOTOWN`, `KREAM`
- 240 products
- 12 weeks
- 2,592 ranking snapshots
- designed examples for rising, fast-rising, cooling, new entry, and cross-market signals

Sample rows are marked `dataMode=sample`. Manual imports use `dataMode=import`. Automated collectors use `dataMode=real`.

Dashboard and market analytics prefer `real` if at least one real market snapshot exists; otherwise they fall back to `sample`.

## Korea Editorial History

Daily collection uses the currently supported Korean editorial sources only:

```bash
npm run collect:korea-editorial
```

Historical baseline backfill scans the same supported public feeds, sitemaps, and listings without adding new sources:

```bash
npm run backfill:korea-editorial -- --days=90 --limit-per-source=100
```

Editorial trend analytics separate `STORE`, `EDITORIAL`, and `ASSORTMENT` semantics. Editorial results use `fashionRelevance=FASHION_RELEVANT`, keep raw mention counts, and add `sourceSpread` plus source-normalized `mentionRateBySource` so one high-volume source does not dominate the interpretation by count alone.

Gender is stored at both post and mention level. `MEN` is not treated as `UNISEX`; unclear evidence remains `UNKNOWN`. UNI/WOMEN views should use conservative minimum sample thresholds before showing strong trend language.

### Specific item extraction coverage

`extractEditorialMentions` (`src/collectors/editorial/mentions.ts`) is the SPECIFIC_ITEM/DETAIL/MATERIAL/COLOR/STYLE classifier applied to already-fetched post title/text. To check what it is currently missing without re-fetching anything from the network:

```bash
npm run audit:specific-item-phrases
```

This is read-only and reports candidate phrases (drawn from the taxonomy's own examples plus common EN/KO synonyms) that are not yet captured, with article count, source count, and example articles. Only add a new alias/rule once it shows real repeat evidence (2+ articles or 2+ sources) in this report - a single sighting stays unmatched rather than becoming a new taxonomy entry.

After adding/fixing rules in `mentions.ts`, regenerate `EditorialMention` rows from the REAL `EditorialPost` text already in the database (no network fetch, `EditorialPost` identity/count is untouched - only its mentions are deleted and re-derived):

```bash
npm run reparse:editorial-mentions
```

## NAVER Demand Signal

DEMAND SIGNAL is a separate semantic axis from EDITORIAL (magazine trend) and STORE (verified ranking). It answers "what are people searching/clicking in NAVER's shopping area", not "what's selling" and not "what's featured in editorial content". The `/demand` route and the Dashboard's "네이버에서 관심이 커지는 상품 유형" section only ever use `dataMode=real` NAVER Shopping Insight data; mock/demo data (used by `/trends`, the legacy secondary Search Trend view) never enters this view.

Official API only: NAVER API Hub (`https://naverapihub.apigw.ntruss.com`), `/shopping/v1/category/keyword/age`. No private/undocumented NAVER endpoints, cookies, sessions, or browser scraping are used.

Credentials (set in `.env`, never commit real values):

```env
NAVER_API_HUB_CLIENT_ID=""
NAVER_API_HUB_CLIENT_SECRET=""
```

(or the older-style `NAVER_API_KEY_ID` / `NAVER_API_KEY` pair - either works, see `firstNonEmpty` in the adapters). Obtain these from the NAVER Cloud Platform console (API Gateway / API Hub product) under your own NCP account; this project does not proxy or share credentials. Check status without printing secret values:

```bash
npm run test:naver-real
```

Semantic rules enforced in code:

- **PLANNING gender** (`TrendKeyword.planningGender`: `UNISEX` | `WOMEN`) is which product-planning area a keyword belongs to. **SHOPPER gender** (`KeywordShoppingAgeSnapshot.gender`: `ALL` | `FEMALE` | `MALE`) is who searched/clicked. These are never converted into each other - `FEMALE` shopper interest is not `WOMEN` product signal.
- Age groups use NAVER's own official Shopping Insight decade buckets (`10` = 10-19세, `20` = 20-29세) - never a synthesized range like "15-24".
- 10대/20대 are requested together in one API call (`ages: ["10","20"]`), so comparing them side by side is valid (same normalization context). Never compare ratios across separate API requests/keywords as if they were on the same scale.
- The `ratio` is NAVER's own relative index (0-100 within the requested window), not absolute search/click volume and not sales. UI shows point (`pt`) change, not `%` change, to avoid misreading a percent-of-an-index as a percent-of-volume.
- DEMAND only becomes part of a Planning Insight decision (`기획 검토 강화` / `수요형 아이템` / `관찰 우선순위 낮음`) alongside EDITORIAL evidence - it never substitutes for STORE, and STORE stays a separate, honestly-empty axis until a verified domestic STORE source exists.

Specific-item keyword mapping and aliases live in `src/collectors/naver/keywords.ts` (`specificItem`, `planningGender` per keyword) - extend this list only once real Korean search-intent phrasing is confirmed, matching `docs/` audit conventions elsewhere in this project.

## Signals

Product signal:

- `HOT`
- `RISING`
- `FAST_RISING`
- `NEW_ENTRY`
- `STABLE`
- `COOLING`
- `DROPPING`
- `INSUFFICIENT_DATA`

First real snapshots with no earlier period remain `INSUFFICIENT_DATA`. The app does not fake rank movement from a baseline collection.

For verified market data, `NEW_ENTRY` means a product was not observed in the prior calendar day's verified ranking scope and is now observed. Ranking exit means the product was observed in the prior calendar day's verified ranking scope and is not observed now. These labels describe ranking observation boundaries only.

Item signal:

- `HIGH_OPPORTUNITY`
- `TREND_CONFIRMED`
- `EARLY_SIGNAL`
- `SATURATED`
- `COOLING`
- `STABLE`
- `INSUFFICIENT_DATA`

Thresholds are configured in `src/config/business-signal.ts`.

## Validation

```bash
npm run db:push
npm run typecheck
npm test
npm run build
```

On Windows PowerShell, if script execution blocks `npm.ps1`, use:

```bash
cmd /c npm run typecheck
```

## Future

- official API or licensed commerce feeds
- approved Korean market source integration
- scheduled weekly market collection
- social signal layer
- product-image based attribute tagging
- optional reactivation of Sales and NAVER as secondary decision layers
