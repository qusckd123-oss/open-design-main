# MUSINSA Collection Feasibility Review

Checked on 2026-08-27.

## Access Policy

`https://www.musinsa.com/robots.txt` currently allows several named agents but blocks the wildcard fallback:

```text
User-agent: *
Disallow: /
```

The MVP collector uses `TrendSignalDashboard/0.1` by default, so direct automated collection from `www.musinsa.com` is treated as blocked. The real adapter checks robots.txt before loading the ranking page and records a failed `CollectionRun` instead of crawling when the path is not allowed.

## Target Page

- Ranking page inspected: `https://www.musinsa.com/main/musinsa/ranking`
- Robots file inspected: `https://www.musinsa.com/robots.txt`

## Field Feasibility

| Field | Status | Notes |
| --- | --- | --- |
| Category ranking | 현재 방식으로 수집 어려움 | Ranking URL exists, but direct app collector is blocked by wildcard robots rule. |
| Product ID | 수집 가능하지만 구조 변경 위험 있음 | Likely available in product URLs or embedded app data if access is permitted. Parser isolates this in `extractRawProductsFromHtml`. |
| Current rank | 수집 가능하지만 구조 변경 위험 있음 | Can be derived from displayed order or embedded rank fields if access is permitted. |
| Brand | 수집 가능하지만 구조 변경 위험 있음 | Expected in rendered/embedded product data, but exact key names may change. |
| Product name | 수집 가능하지만 구조 변경 위험 있음 | Expected in rendered/embedded product data, but exact key names may change. |
| Product URL | 수집 가능하지만 구조 변경 위험 있음 | Product links are likely stable enough when access is permitted. |
| Image URL | 수집 가능하지만 구조 변경 위험 있음 | Expected in image tags or embedded thumbnail fields. |
| Normal price | 수집 가능하지만 구조 변경 위험 있음 | Depends on page payload field naming. |
| Sale price | 수집 가능하지만 구조 변경 위험 있음 | Depends on page payload field naming. |
| Discount rate | 수집 가능하지만 구조 변경 위험 있음 | Depends on page payload field naming. |
| Review count | 현재 방식으로 수집 어려움 | Not guaranteed on ranking list without product detail calls. |
| Like count | 현재 방식으로 수집 어려움 | Often tied to user/session features and should not be assumed. |
| Sold out | 수집 가능하지만 구조 변경 위험 있음 | May be exposed in card labels or embedded flags. |
| Category | 수집 가능하지만 구조 변경 위험 있음 | If not present, internal mapping falls back from product name keywords. |
| Gender | 현재 방식으로 수집 어려움 | May require filters or product detail metadata. |
| New item | 수집 가능하지만 구조 변경 위험 있음 | Only if ranking card exposes a new badge or embedded boolean. |

## Implemented Collector State

- `MusinsaMockAdapter`: fully usable and remains the default.
- `MusinsaRealAdapter`: implemented with robots.txt preflight, raw HTML/Next data extraction hooks, normalization, category mapping, and partial failure reporting.
- Current expected real run result: `FAILED` with one `CollectionError` explaining that robots.txt blocks the default user-agent.

## Modification Points If Approved Access Becomes Available

- Raw extraction: `src/collectors/musinsa-real.ts`
- Category mapping: `src/collectors/category-map.ts`
- Persistence and collection runs: `src/services/collection-service.ts`
- CLI source switch: `scripts/collect-musinsa.ts`
