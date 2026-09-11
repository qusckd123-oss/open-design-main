# 26FW Overseas PO Applicability

Status: **ROW-LEVEL CLASSIFICATION CONFIRMED / PRODUCTION ORDER REPLACEMENT STOPPED**
Source: `발주조회(250613_커버낫소싱) 26FW 260911.xlsx` (read-only, raw workbook remains outside Git)
Scope: current 26FW APP SKU fact as of 2026-09-09

## Excel structure

- One sheet: `발주조회(250613_커버낫소싱) 26FW 260911`.
- Dimensions: 1,443 rows x 93 columns; header row is row 3; 1,440 data rows.
- Required columns are `G 품번`, `J 발주번호`, `L 색상`, and `BP 발주수량`.
- There is no PO-row inbound quantity column. `Q 납기완료일` and `AH 입고마감` are status/date fields, not inbound quantities.
- Merged ranges are `A1:AH1`, `A2:AH2`, `AI1:BO2`, `BP1:CO1`, and `BP2:CO2`.
- No fully blank data rows and no repeated header rows were found.
- Actual overseas PO texts: `대만` 80 rows, `일본` 128, `글로벌` 110, `수주-대만` 89, `수주-일본` 160, and `수주-글로벌` 150.

Classification is performed on each physical PO row. `matchedKeywords` preserves every matching keyword, while the exclusive `classification` uses destination precedence `TAIWAN`, `JAPAN`, `GLOBAL`, then `ORDER_ONLY`. This prevents a row such as `수주-대만` from being counted twice in the 717-row total. No SKU, color, STYLE sibling, or `isSpecialMarket` propagation is allowed.

## Quantified scope

| Classification | Exclusive rows | Order qty |
|---|---:|---:|
| TAIWAN | 169 | 15,530 |
| JAPAN | 288 | 4,331 |
| GLOBAL | 260 | 5,019 |
| ORDER_ONLY | 0 | 0 |
| Total | 717 | 24,880 |

The keyword `수주` appears in 399 rows / 12,695 units, but every one of those rows also contains a destination keyword and is therefore included once in the exclusive counts above.

- Overseas PO scope: 717 rows / 304 SKU / 146 STYLE.
- Domestic and overseas PO mixed in the same SKU: 298 SKU.
- Overseas PO only: 6 SKU — `WA2603CRT1BK`, `WA2603CRT1GR`, `WA2603HD11LG`, `WA2603STT1BK`, `WA2603STT1WH`, `WA2603STT2CH`.
- Current 26FW APP affected: 304 / 439 SKU and 146 STYLE.
- Workbook coverage: 438 / 439 APP SKU. `WA2603CR16TC` is absent and remains `UNKNOWN` for this source.
- For all 304 affected APP SKU, current `data/sku-latest.json.orderQty` exactly equals the Excel total order quantity including overseas PO. This directly proves that current `orderQty` includes overseas PO.
- Full 298 mixed-SKU list, all 304 affected SKUs, row-level quantities, PO examples, reconciliation, and Analog Pace impact rows are retained in `data/sku-overseas-po-applicability.json`.

## Applicability decision

- `CONFIRMED_EXCLUDABLE_FROM_DOMESTIC_ORDER`: the 717 overseas PO rows / 24,880 units are row-level order facts and can be excluded from a domestic order fact.
- `CONFIRMED_EXCLUDABLE_FROM_DOMESTIC_INBOUND`: the business rule applies to receipts attributable to those overseas PO rows, but this workbook has no inbound quantity by PO row.
- `NEEDS_ADDITIONAL_SOURCE`: numeric correction of current `inboundQty` and `erpStockQty` requires a receipt/stock source carrying PO or market-route keys. The current workbook cannot allocate those quantities.
- `DOMESTIC_SALES_EXCLUSION_NOT_PROVEN`: the workbook contains no sales transaction/channel/market key. No quantity is removed from `cumulativeSalesQty`, completed weekly sales, WTD, or sales velocity.

## Current pipeline trace

`scripts/sku-sync.ts` reads one row per SKU/color from the ERP weekly workbook `품번별 판매추이분석(주간_월) 260909.xlsx`:

- `orderQty` <- ERP weekly `발주`.
- `inboundQty` <- ERP weekly `입고`.
- `cumulativeSalesQty` <- ERP weekly `판매`.
- `erpStockQty` <- ERP weekly `재고`.
- `weighted4CompletedWeekQty` <- last up to four completed calendar-week quantities with normalized 0.1/0.2/0.3/0.4 weights.
- `sellingAgeVelocityQtyPerWeek` <- completed weeks from first positive sale, using the same recent weighting.
- `stockCoverWeeks` <- `erpStockQty / weighted4CompletedWeekQty` when velocity is positive.
- `sellingAgeStockCoverWeeks` <- `erpStockQty / sellingAgeVelocityQtyPerWeek` when velocity is positive.
- Current Risk diagnostics read these facts without changing production risk/action logic.
- Current Analog Pace uses `orderQty` as the current progress denominator.

The PO workbook independently reproduces current `orderQty` for all 438 APP SKUs it contains, and all 304 affected SKU are exact total matches. It does not reproduce or split current inbound, sales, or stock.

## Before/after impact and STOP condition

No production SKU fact was replaced in this task. APP remains 439 SKU and actual protected production fields are unchanged.

If current `orderQty` were replaced with the confirmed domestic-only quantity:

- `orderQty` would change for 304 SKU by -24,880 units.
- `inboundQty`, `erpStockQty`, legacy/selling-age velocity, lifecycle, completed sales, WTD, and both Stock Cover fields would not be numerically changed by this workbook alone.
- ORDER-denominator Analog Pace would be mathematically affected for 123 current PACE_READY SKU / 64 STYLE.
- 118 of those SKU would receive a higher pace index solely because the denominator becomes smaller.
- Five overseas-only Special Market SKU would lose a positive domestic order denominator entirely.

Per the approved guardrail, production `orderQty` was not silently replaced and Analog Pace was not recalculated, promoted, or recalibrated. A method/schema decision is required before applying the domestic order fact to production.

## Special Market five

| SKU | PO rows | Domestic / overseas order | Overseas PO evidence | Direct-ship evidence |
|---|---|---:|---|---|
| WA2603CRT1BK | 1088 `대만`, 1320 `글로벌` | 0 / 150 | OVERSEAS_PO_CONFIRMED | DIRECT_SHIP_CONFIRMED (user-confirmed, retained) |
| WA2603CRT1GR | 1089 `대만`, 1321 `글로벌` | 0 / 150 | OVERSEAS_PO_CONFIRMED | DIRECT_SHIP_CONFIRMED (prior PO + logistics evidence, retained) |
| WA2603STT1BK | 1091 `대만`, 1322 `글로벌` | 0 / 150 | OVERSEAS_PO_CONFIRMED | DIRECT_SHIP_CONFIRMED (prior PO + logistics evidence, retained) |
| WA2603STT1WH | 1092 `대만`, 1323 `글로벌` | 0 / 150 | OVERSEAS_PO_CONFIRMED | DIRECT_SHIP_CONFIRMED (prior PO + logistics evidence, retained) |
| WA2603STT2CH | 1093 `대만`, 1324 `글로벌` | 0 / 150 | OVERSEAS_PO_CONFIRMED | DIRECT_SHIP_CONFIRMED (prior PO + logistics evidence, retained) |

The new workbook proves overseas PO status for each exact SKU/color. It does not independently prove direct shipment; therefore `OVERSEAS_PO_CONFIRMED` is stored separately and does not upgrade or propagate `DIRECT_SHIP_CONFIRMED`.

For `WA2603CRT1BK`, current facts remain order 150, inbound 57, cumulative sales 105, and ERP stock -48. The workbook proves domestic order quantity is 0. Combined with the separately user-confirmed direct-ship route, the negative ERP stock/cover is interpreted as a non-applicable domestic supply-flow artifact, not domestic stock shortage. The sales quantity itself is not removed because domestic-versus-overseas sales allocation is not proven by this workbook.

## Implementation and tests

- Added `scripts/overseas_po_applicability.py`, a reproducible PO-row parser and impact generator.
- Added `data/sku-overseas-po-applicability.json`, containing the full row-to-SKU evidence and impact lists without the raw workbook.
- Added 11 synthetic business-rule cases in `tests/overseas_po_applicability_test.py`, including mixed PO, multi-keyword, color isolation, Special Market without evidence, and overseas PO without Special Market metadata.
- Extended `config/special-market-direct-ship-evidence.json` with a separate `overseasPoStatus` / `overseasPoEvidence` block for the five exact SKUs.
- Extended the Special Market diagnostic to expose overseas PO evidence without treating it as direct-ship proof.
- Verification: Python 35/35, SKU sync 4/4, Forecast 6/6 plus reference validation, and build PASS.

## Required approval / additional sources

1. Decide whether production should preserve raw `orderQty` and add a separate `domesticOrderQty`, or replace `orderQty` and explicitly revise the ORDER-denominator Analog Pace contract. The latter changes 123 current PACE_READY rows and requires separate methodology approval.
2. Obtain PO-keyed receipt/inbound data to quantify `CONFIRMED_EXCLUDABLE_FROM_DOMESTIC_INBOUND` in current `inboundQty`.
3. Obtain market/channel-keyed ERP stock and sales data before changing `erpStockQty`, Stock Cover, or `cumulativeSalesQty`.

Until those decisions/sources exist, inbound, stock, and sales allocation remain `UNKNOWN` where not independently proven.
