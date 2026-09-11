# SKU Selling-Age Velocity Contract

Status: approved separate-field production-safe SKU schema extension. Implemented in `sku-sync.ts` on 2026-09-10. Protected legacy fields and production STYLE behavior remain unchanged.

## Decision

Decision: `ADD_AGE_AWARE_SEPARATE_FIELDS` is approved.

Keep `weighted4CompletedWeekQty` and `stockCoverWeeks` unchanged as protected legacy facts. Add these fields as separate facts in `data/sku-latest.json` and `public/data/sku-latest.json`:

- `sellingAgeVelocityQtyPerWeek`
- `sellingAgeStockCoverWeeks`

This preserves backward compatibility while making the semantic difference visible to a future SKU Signal review. These fields do not replace the legacy fields; 25FW evidence supports cleaner early semantics, but not a production threshold or signal design.

## Definitions

`sellingAgeVelocityQtyPerWeek` uses completed weekly sales only. Find the first completed week with quantity strictly greater than zero. Exclude every earlier calendar row, including pre-launch zero weeks, and exclude the current WTD row. From the first positive week through the latest completed week, take at most the latest four selling-age weeks and apply the normalized recency weights `[0.1, 0.2, 0.3, 0.4]` over the available rows. Thus W1/W2/W3 use the last 1/2/3 weights normalized to their own sum, and W4+ uses all four weights.

Post-launch zero quantities remain observed zero-sales weeks. Negative quantities after launch remain observed returns/reversals and are included as reported; they are not clamped or discarded. If there is no positive completed week, velocity is `null`.

`sellingAgeStockCoverWeeks` is `ERP stock / sellingAgeVelocityQtyPerWeek` when velocity is greater than zero. If velocity is zero, negative, missing, or not calculable, cover is `null`. When velocity is positive, ERP stock is not clamped: zero stock produces `0`, and negative stock produces a negative cover. Any positive-only or floor-at-zero display is a separately named, view-only interpretation and must never overwrite the raw candidate fact.

WTD is never folded into either candidate field. No cumulative or final outcome is used in the as-of calculation.

## Edge-case contract tests

The focused `sku-sync` fixture covers W1/W2/W3/W4+, leading pre-launch zeros, post-launch zero sales, negative return quantity, no positive completed sales, WTD exclusion, and zero/negative stock semantics. The tests assert legacy `weighted4CompletedWeekQty` and `stockCoverWeeks` outputs in the same fixtures.

## Production guardrails

- Do not feed these fields into Forecast, Analog Pace, STYLE logic, Action Engine, priority, `reorderTiming`, stock risk, preview score, reorder thresholds, or SKU Signal without a separate approval.
- Do not use this field as a threshold, rank, reorder recommendation, or SKU Signal input until a separate approval and regression task.
- Preserve raw ERP stock semantics in data. If the UI needs operational bins, create a clearly labeled view-only interpretation.
- Keep final sell-through and reorder events as calibration outcomes/descriptive evidence only, never as inputs to the checkpoint metric.

SKU_SELLING_AGE_FIELDS_PRODUCTION_READY
