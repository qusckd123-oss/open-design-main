# ERP Weekly SKU Source Schema

## Inspected source

- Workbook: `품번별 판매추이분석(주간_월) 260909.xlsx`
- Worksheet size: 591 rows x 46 columns
- Header: two rows with merged week groups
- Snapshot date: `2026-09-09`

The workbook filename and the final workbook period both identify the same snapshot date. The parser checks workbook periods for every candidate file and does not select by file modification time alone.

## Header structure

Row 1 groups columns into `기본사항`, `수불수량`, and merged three-column weekly periods. Row 2 contains the actual field names.

| Columns | Fields | Parser use |
| --- | --- | --- |
| A:B | 품번, 색상 | `styleCode`, `colorCode`, concatenated `sku` |
| C:F | 최초판매가, 현판매가, 최초입고일, 최초출고일 | inspected, not required by the v1 contract |
| G:M | 발주, 입고, 출고, 판매, 판매율, 재고, 기간판매 | SKU facts |
| N:AT | each date: 기간수량, 누계수량, 수량판매율 | direct weekly history |

The source does not contain a product-name column. `productName`, season, category, product group, gender group, and special-market status are joined from the existing STYLE `latest.json`. ERP numerical facts remain authoritative in `sku-latest.json`.

Metadata enrichment uses the established project rules: exact `latest.json` metadata first, then the existing category-to-product-group mapping and STYLE-code season parser. Unknown category, gender, or special-market status remains explicitly unknown; it is never silently converted to APP, UNISEX, or domestic.

## Observed definitions

- ERP `판매율` matches `판매 / 입고 * 100` in the inspected rows.
- `orderSellThrough` is calculated separately as `판매 / 발주 * 100`.
- `inboundSellThrough` is calculated separately as `판매 / 입고 * 100`.
- ERP `재고` is preserved as `erpStockQty`; it is not assumed to equal Sales Dashboard available stock.
- `inventoryBalanceGap = 입고 - 판매 - 재고` is diagnostic only.
- `weighted4CompletedWeekQty` remains the protected legacy completed-calendar metric: the latest up to four completed calendar rows, WTD excluded, normalized with `[0.1, 0.2, 0.3, 0.4]`.
- `stockCoverWeeks` remains the protected legacy cover fact: `erpStockQty / weighted4CompletedWeekQty` only when legacy velocity is positive.
- `sellingAgeVelocityQtyPerWeek` is a separate production-safe SKU fact: completed weekly history only, WTD excluded, starting at the first strictly positive completed sales week, with leading pre-launch rows excluded. Post-launch zero and negative rows remain in the latest up to four selling-age weeks and use the same normalized recency weights.
- `sellingAgeStockCoverWeeks` is a separate production-safe SKU fact: `erpStockQty / sellingAgeVelocityQtyPerWeek` only when selling-age velocity is positive. ERP stock is not clamped, so zero or negative ERP stock produces zero or negative cover when velocity is positive.

## Weekly cutoff

The final `2026-09-09` group falls inside the `2026-09-07` to `2026-09-13` week and is stored as current WTD. Completed metrics end at `2026-09-06`. The cutoff is derived from the workbook snapshot date, not the machine execution date.

## Safety

Raw workbooks stay under `.local-sku-source/`, which is ignored by git and is not copied into build output. Published JSON contains only the source basename, never a local absolute path or workbook metadata.

## Metadata join diagnostic

For the `260909` snapshot, the ERP contains 285 WA STYLE codes and 586 valid COLOR SKU rows. The Sales Dashboard latest universe contains 1,144 WA STYLE rows, including 88 `WA2603` rows classified as `26FW`.

- Exact metadata matches: 88 STYLE
- Additional normalized matches: 0 STYLE
- True unmatched: 197 STYLE
- Normalization allowed: uppercase plus whitespace/hyphen removal
- Prefix deletion is never applied

The ERP workbook has no explicit season, category, gender, or brand column. Its 197 unmatched codes are therefore not assigned APP/ACC by code pattern. The two rows `WWA2603CA74/BK` and `WWA2603CA75/PU` are retained in exclusion diagnostics as `NON_WA_STYLE_PREFIX`; they are not force-mapped to WA. One additional workbook row is blank.
