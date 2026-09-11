# SKU Current Risk diagnostic design

Status: diagnostic-only design, not production logic.

## Purpose

Provide an auditable SKU-first view of current operating context using facts already present in `data/sku-latest.json`. STYLE is retained only as metadata context; it does not pre-filter or score SKUs.

The generator is `scripts/sku_current_risk_diagnostic.py` and writes `data/sku-current-risk-diagnostic.json`; the current public diagnostic view uses the mirrored `public/data/sku-current-risk-diagnostic.json`. It does not sync Sales Dashboard or ERP and does not alter production scoring.

## Independent lenses

| Lens | Existing input | Diagnostic output |
|---|---|---|
| Completed-week velocity | `weighted4CompletedWeekQty`, `sellingAgeVelocityQtyPerWeek`, and `completedWeeklyHistory` | completed weeks, completed sales, legacy velocity, selling-age velocity, latest/previous week, WoW |
| ERP stock | `erpStockQty` | stock quantity and whether stock is present |
| Inbound completion | `inboundQty`, `orderQty` | completion percentage and descriptive band |
| Remaining order | `orderQty - inboundQty` | raw remaining quantity and boolean presence |
| Trend | `salesTrend` | existing trend label, unchanged |
| Stock cover | `stockCoverWeeks`, `sellingAgeStockCoverWeeks` | legacy cover, selling-age cover, and descriptive legacy cover band |

Current WTD is intentionally not folded into completed-week velocity. A missing or zero completed velocity is surfaced as `NO_COMPLETED_VELOCITY`; no completed week is manufactured.

## Observation bands

The bands (`UNDER_2_WEEKS`, `2_TO_4_WEEKS`, `OVER_4_WEEKS`, and inbound `NO_INBOUND`/`PARTIAL`/`COMPLETE_OR_OVER`) are display groupings for design review only. They are not thresholds, risk labels, priorities, reorder timing, SKU Signal, Forecast inputs, or production rules.

The output has no aggregate risk score and no rank. Consumers should show the lenses side by side and preserve `dataQuality` alongside the facts. The selling-age fields are display-only in this diagnostic and are not an implicit recommendation. Any future threshold, signal, or action requires a separately approved design and numeric regression tests.

## Safe next task

Next safe task is SKU Signal v1 DESIGN / diagnostic proposal only. Do not implement scoring, thresholds, priority, reorder recommendations, Forecast changes, Analog Pace promotion, or production behavior.
