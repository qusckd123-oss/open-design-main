# NAVER DataLab API Review

Checked on 2026-08-27 against official NAVER/NAVER Cloud documentation.

## Current Availability

NAVER Developers announced that Search API, Search Trend API, and Shopping Insight API are being migrated to NAVER API HUB. New applications through NAVER Developers are blocked after 2026-07-31. Existing NAVER Developers keys issued before that cutoff are supported until 2027-06-30, after which NAVER API HUB is required.

Official API HUB base URL:

```text
https://naverapihub.apigw.ntruss.com
```

## Authentication

NAVER API HUB uses request headers:

```text
X-NCP-APIGW-API-KEY-ID: {Client ID}
X-NCP-APIGW-API-KEY: {Client Secret}
Content-Type: application/json
```

The app reads:

```text
NAVER_API_KEY_ID or NAVER_API_HUB_CLIENT_ID
NAVER_API_KEY or NAVER_API_HUB_CLIENT_SECRET
NAVER_API_HUB_BASE_URL
```

## Search Trend API

- Method: `POST`
- URI: `/search-trend/v1/search`
- Metric: relative search volume index, not absolute search volume
- `ratio`: relative value with the highest value in the requested result set set to 100
- `timeUnit`: `date`, `week`, `month`
- `keywordGroups`: up to 5 groups per request, up to 20 keywords per group

Age support:

| API code | Official age range |
| --- | --- |
| `1` | 0-12 |
| `2` | 13-18 |
| `3` | 19-24 |
| `4` | 25-29 |

The requested exact `15-19` and `20-24` cuts are not directly available in Search Trend. This MVP uses `13-18`, `19-24`, and `25-29` to avoid mislabeling official data.

## Shopping Insight API

Keyword trend by age is available at:

```text
POST /shopping/v1/category/keyword/age
```

It returns shopping search click trend data by category and keyword. It requires a NAVER Shopping category code and supports decade-level age groups only:

| API code | Official age range |
| --- | --- |
| `10` | 10-19 |
| `20` | 20-29 |
| `30` | 30-39 |
| `40` | 40-49 |
| `50` | 50-59 |
| `60` | 60+ |

Because this project needs finer teen/early-20s planning signals, v0.2 implements Search Trend first and keeps Shopping Insight as a documented future adapter target.

v0.3 adds the Shopping Insight keyword-age adapter as a separate metric. It stores data in `KeywordShoppingAgeSnapshot`, not `KeywordTrendSnapshot`.

Shopping category is required. The category code is managed per keyword through `TrendKeyword.naverShoppingCategory` and `src/config/naver-shopping-category.ts`.

Default category mapping:

| Keywords | NAVER category |
| --- | --- |
| TOP / BOTTOM apparel keywords | `50000000` 패션의류 |
| 백팩, 크로스백, 나일론백, 볼캡, 비니, 키링, 백참 | `50000001` 패션잡화 |

## Comparability Rule

NAVER `ratio` is a relative index, not a count. This app calculates 1W/4W/12W changes only within the same keyword, same age group, same source, and same request strategy. It does not present the value as search volume or sales volume.

Search Trend age current ratios are not used to decide which age group has stronger interest. They are normalized inside each request window, so the UI only compares each age group's own time momentum such as 1W, 4W, and 12W change.

Shopping Insight age values are also relative indices. The app keeps them labeled as `Relative Shopping Click Index` and does not convert them into absolute click volume or sales volume.

## Implemented State

- `NaverSearchTrendMockAdapter`: generates 12 weeks of trend data for all seeded fashion keywords and age groups.
- `NaverSearchTrendRealAdapter`: calls NAVER API HUB when credentials are present; otherwise records a failed collection result.
- `NaverShoppingInsightMockAdapter`: generates 12 weeks of 10-19 and 20-29 shopping click index data.
- `NaverShoppingInsightRealAdapter`: calls `/shopping/v1/category/keyword/age` when credentials are present.
- `npm run test:naver-real`: checks the real API with `그래픽 반팔` without storing snapshots.
- `npm run backfill:naver -- --weeks=104`: backfills active DB keywords and upserts duplicate periods.
- Dashboard and `/trends` screens display source and metric labels.
