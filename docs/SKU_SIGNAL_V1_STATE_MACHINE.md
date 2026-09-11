# SKU Signal v1 read-only state-machine simulation

Status: **READ-ONLY DIAGNOSTIC SIMULATION**. This is not a production SKU Signal and does not assign a score, rank, weight, priority, timing, recommendation, reorder quantity, automatic action, or candidate human-facing label.

Snapshot basis: the existing local ERP SKU snapshot as of `2026-09-09`, the existing Analog Pace coverage artifact, the already-local STYLE snapshot, and the existing usability/design diagnostics. No external sync, login, browser network, ERP refresh, or Sales Dashboard refresh was run.

## Deliverables and reproducibility

- Generator: `scripts/sku_signal_v1_state_machine.py`
- Artifact: `data/sku-signal-v1-state-machine.json`
- Focused tests: `tests/sku_signal_v1_state_machine_test.py`
- Command: `python scripts/sku_signal_v1_state_machine.py`

The generator reads source artifacts and writes a new diagnostic file. It does not mutate `data/sku-latest.json`, `data/latest.json`, production UI files, or any protected production field.

## Lifecycle contract

| Lifecycle | Factual meaning | Applicability |
|---|---|---|
| `PRE_SALE` | No positive completed sale and no positive current-WTD sale. Launch status is unknown. | Completed demand and cover unavailable; inventory/supply display-only. |
| `WTD_ONLY` | Positive sales exist only in current WTD. | Wait for the first completed selling week; W1 is not manufactured. |
| `W1` | First positive completed selling week. | Observation/display-only. |
| `W2-W8` | Two through eight completed selling-age weeks. | Early Pace applicability window; existing Analog Pace context is joined. |
| `W9+` | Nine or more completed selling-age weeks. | Mature SKU facts; STYLE Forecast may appear after SKU facts as display-only context. |

Selling age begins at the first positive completed-sales week. A later zero-sales completed week remains part of selling age. Current WTD is excluded from completed-week velocity and pacing.

## Independent evidence families

Every one of the 439 rows remains a color-SKU row. Evidence is stored in separate blocks and is never blended:

1. lifecycle and applicability;
2. cumulative, completed, and WTD demand plus legacy and selling-age velocity;
3. ERP on-hand plus each stock-cover value paired with its own velocity denominator;
4. order, inbound, completion rate, and raw remaining order;
5. joined Analog Pace context only for W2-W8;
6. trend context;
7. STYLE Forecast context only for W9+, display-only and never a SKU gate.

STYLE Forecast categorical output is not copied into SKU rows. A raw STYLE join outside W9+ is recorded factually, while its context remains null. Adding or removing STYLE context cannot change row membership or lifecycle.

## Current snapshot reconciliation

| Measure | Count |
|---|---:|
| 26FW APP color SKU | 439 |
| PRE_SALE | 254 |
| WTD_ONLY | 5 |
| W1 | 31 |
| W2-W8 | 149 |
| W9+ | 0 |
| W2-W8 Analog Pace available | 149 / 149 |
| Selling-age velocity available | 180 / 439 |
| Selling-age stock cover available | 180 / 439 |
| ERP on-hand available | 439 / 439 |
| Order available | 439 / 439 |
| Inbound available | 439 / 439 |
| Raw remaining order calculable | 439 / 439 |
| Applicable STYLE Forecast context | 0 |
| Non-W9+ row with non-null STYLE context | 0 |

These counts exactly match the current design and usability diagnostics. The current snapshot contains no W9+ SKU, so the W9+ STYLE branches are verified with synthetic fixtures rather than invented current rows.

## Factual conflicts and data quality

Markers describe exact source conditions only. They do not imply urgency, health, reorder need, or any other business conclusion.

| Marker | SKU count | Interpretation |
|---|---:|---|
| `LEGACY_VS_SELLING_AGE_VELOCITY_DIFFERENT` | 133 | Both numeric values exist and are not exactly equal. |
| `LEGACY_VS_SELLING_AGE_COVER_DIFFERENT` | 133 | Both numeric values exist and are not exactly equal. |
| `ANALOG_PACE_PRESENT_OUTSIDE_W2_W8` | 31 | Existing numeric Pace output is present outside its v1 applicability window; it is not exposed as context. |
| `STYLE_FORECAST_RAW_JOIN_OUTSIDE_W9_PLUS` | 144 | A raw STYLE join exists, but SKU-row Forecast context remains null by contract. |
| `NEGATIVE_ERP_STOCK` | 5 | Negative ERP on-hand is preserved for verification. |
| `NEGATIVE_STOCK_COVER` | 5 | Negative cover is preserved; it is not floored to zero. |
| `NEGATIVE_REMAINING_ORDER` | 63 | Inbound exceeds order. Raw `orderQty - inboundQty` is preserved and is not called pending. |

The current snapshot has no missing order, missing inbound, non-positive order, or W2-W8 Pace-missing row. Those required branches are covered by synthetic tests. Completion is unavailable when order is missing/non-positive or inbound is missing. Remaining order is unavailable when order or inbound is missing. Cover is unavailable when its velocity denominator is missing or non-positive, while any raw source cover remains visible for audit.

## Limitations

- This is a current-snapshot state-machine simulation, not historical end-to-end evaluation.
- No historical weekly ERP on-hand, inbound, open-supply, ETA, cancellation, or allocation snapshots exist in the retained sample.
- Raw remaining order does not prove that supply is confirmed, usable, or timely.
- Analog Pace remains `HOLD` for production and is joined without recalculation or calibration changes.
- The current universe has no W9+ row; current STYLE Forecast applicability is therefore zero.
- No isolated prototype page was added in this step. The JSON is intentionally the smallest auditable implementation surface.

## Exact next recommendation

Run a planner evidence review on a fixed sample of rows from each currently populated lifecycle and every factual marker. Confirm field wording, missingness clarity, and whether the independent fact blocks answer the planner's inspection questions. Do not define labels, thresholds, scores, rankings, recommendations, or production routing in that review. Only after that review should an isolated read-only viewer be considered as a separately scoped task.

Production behavior changed: **NO**.

SKU_SIGNAL_V1_STATE_MACHINE_READY
