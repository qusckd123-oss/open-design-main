# SKU Signal v1 design / diagnostic proposal

Status: **DESIGN ONLY**. No production SKU Signal, score, weight, threshold, priority, reorder recommendation, reorder quantity, or automatic action is implemented.

Snapshot basis: local ERP SKU snapshot as of `2026-09-09`, existing Analog Pace applicability/calibration artifacts, existing Current Risk diagnostics, existing selling-age calibration, and the already-local Sales Dashboard snapshot for raw STYLE context only. No external sync was run.

## Decision

**Proceed to a read-only lifecycle state-machine simulation. Another SKU fact fix is not required first.** The separate selling-age velocity and cover fields resolve the previously identified semantic blocker while preserving the legacy fields. The simulation must test routing, availability, missingness, and conflicts only. It must not decide whether to reorder or how much to reorder.

This is a readiness decision for a diagnostic simulation, not for production. Historical end-to-end evaluation remains blocked for supply-sensitive states because retained 25FW data has no weekly ERP on-hand, inbound, or open-supply snapshots.

## Objective and invariant

The future system should help a product planner reduce hundreds of color SKUs to a smaller **human review queue**. Final reorder quantity remains manual.

The unit of analysis is always the color SKU. STYLE may group sibling colors and provide later context, but it must never pre-filter, suppress, promote, or otherwise decide which color SKUs are inspected. A STYLE result is not a substitute for color demand, color stock, or color supply.

## Evidence architecture

The proposed architecture is a set of independent evidence families, not a blended score:

1. **Lifecycle/applicability** — determines which facts are valid at the SKU's completed selling age.
2. **Current demand/velocity** — completed-week color sales and both velocity definitions.
3. **On-hand inventory/stock cover** — current ERP stock plus cover calculated from an explicitly named velocity denominator.
4. **Inbound completion and remaining committed supply** — `inboundQty / orderQty` and raw `orderQty - inboundQty`; these describe supply position, not demand.
5. **Analog Pace percentile** — W2-W8 relative-performance context only.
6. **Trend** — direction of recent completed-week sales, retained separately from level/velocity.
7. **Forecast** — W9+ STYLE context only and never a SKU prefilter.

No pair of these families should be averaged, weighted, or collapsed into one number. In particular:

- high demand and low stock describe different phenomena;
- low current stock and remaining committed supply must remain distinct;
- Analog Pace is neither velocity nor a forecast;
- trend direction is not demand magnitude;
- STYLE Forecast cannot replace or overrule color-SKU facts;
- legacy and selling-age velocity/cover must not be averaged into a synthetic compromise.

## Lifecycle-aware evidence contract

Status terms:

- **Available**: the fact can be read from the current snapshot.
- **Display-only**: it may be shown but cannot route a review state at this lifecycle.
- **Unavailable**: the evidence is absent or not valid for this lifecycle.
- **Potentially actionable later**: it may participate in a future, separately approved human-review simulation. This does not mean an action exists now.

| Lifecycle | Lifecycle/applicability | Demand / velocity | On-hand / cover | Inbound / remaining supply | Analog Pace | Trend | STYLE Forecast |
|---|---|---|---|---|---|---|---|
| `PRE_SALE` | Available as the operational no-positive-sales state; actual launch status is not present | Completed demand unavailable; zero-valued legacy field is not usable velocity | On-hand available, cover unavailable; display-only | Available as supply setup; display-only | Unavailable | Raw label may exist but is not interpretable; display-only | Unavailable by contract |
| `WTD_ONLY` | Available; wait for first completed selling week | WTD quantity display-only; completed velocity unavailable | On-hand available, cover unavailable; display-only | Available; display-only | Unavailable; do not manufacture W1 | Unavailable for completed-week interpretation | Unavailable by contract |
| `W1` | Available; first completed selling week | Legacy and selling-age velocity available but display-only | On-hand and both covers available but display-only | Available but display-only | Unavailable; W1 is observation only | Available but display-only | Unavailable by contract |
| `W2-W8` | Available; Early Pace window | Both velocity facts available and potentially actionable later | On-hand and both covers available and potentially actionable later | Available and potentially actionable later, as a separate supply lens | Available and potentially actionable later as relative context only | Available and potentially actionable later | Unavailable by contract even when a raw STYLE join exists |
| `W9+` | Available; mature context | Both velocity facts available and potentially actionable later | On-hand and both covers available and potentially actionable later | Available and potentially actionable later | Unavailable; outside the Early Pace window | Available and potentially actionable later | Display-only STYLE context after SKU facts; never a prefilter or override |

Lifecycle transitions are factual and one-way for an as-of snapshot. A row with no positive completed sales remains operationally `PRE_SALE`; if its only positive sale is in WTD it is `WTD_ONLY`; the first positive completed week establishes `W1`, followed by `W2-W8` and `W9+`. Because the snapshot has no launch-date field, `PRE_SALE` cannot distinguish “not launched” from “launched but no positive sale.” A zero-sales completed week **after the first positive completed week** remains part of selling age. WTD never becomes a manufactured completed week.

## Current 26FW APP evidence availability

The reproducible artifact is `data/sku-signal-v1-design-diagnostic.json`, generated by `scripts/sku_signal_v1_design_diagnostic.py`.

| Stage | SKU | Selling-age velocity / cover | Analog Pace | On-hand / order / inbound / remaining calculable | Positive raw remaining supply | Forecast applicable |
|---|---:|---:|---:|---:|---:|---:|
| `PRE_SALE` | 254 | 0 / 0 | 0 | 254 / 254 / 254 / 254 | 239 | 0 |
| `WTD_ONLY` | 5 | 0 / 0 | 0 | 5 / 5 / 5 / 5 | 4 | 0 |
| `W1` | 31 | 31 / 31 | 0 | 31 / 31 / 31 / 31 | 27 | 0 |
| `W2-W8` | 149 | 149 / 149 | 149 | 149 / 149 / 149 / 149 | 102 | 0 |
| `W9+` | 0 | 0 / 0 | 0 | 0 / 0 / 0 / 0 | 0 | 0 |
| **Total** | **439** | **180 / 180** | **149** | **439 / 439 / 439 / 439** | **372** | **0** |

All 439 rows contain the legacy velocity field, but only the 180 rows with a positive completed selling week have semantically usable completed velocity. Both legacy and selling-age cover are available for the same 180 rows. Raw STYLE Forecast joins exist for 144 current APP SKUs, including 119 W2-W8 rows, but none is applicable under this contract because the current APP universe contains no W9+ SKU.

The five WTD-only SKUs remain data-wait cases, not errors: `WA2603CD65CM`, `WA2603HZ61PI`, `WA2603JK62BE`, `WA2603PT61PI`, and `WA2604PT16BL`.

Future diagnostic math must preserve current raw semantics. `orderQty <= 0` makes inbound completion unavailable and raises a data-quality reason. Missing order or inbound makes remaining supply unavailable. Negative remaining supply means inbound exceeds order and must not be clamped or called pending. Zero/non-positive velocity makes cover unavailable. Negative ERP stock and its resulting negative cover stay visible with a stock-verification reason; they are not silently floored to zero.

## Demand risk and supply risk must remain separate

Demand evidence asks whether a color is selling and how its completed-week pace is changing. Supply evidence asks how much is physically on hand and how much ordered quantity has not yet appeared as inbound.

The current snapshot can calculate raw remaining supply for every APP SKU, but `orderQty - inboundQty > 0` does not prove that supply is usable. It contains no PO ETA, cancellation, allocation, or receipt-confidence status. A future view should therefore show at least:

- current on-hand quantity;
- both named stock-cover values and their velocity denominators;
- inbound quantity and completion rate;
- raw remaining committed quantity;
- whether ETA/status confirmation is missing.

A low-on-hand SKU with relevant, confirmed, timely inbound is a supply-timing inspection. A low-on-hand SKU with no remaining committed supply is a supply-gap inspection. Treating them as the same condition would create avoidable false positives and hide the actual question the planner needs to answer.

## Legacy and selling-age fields during diagnosis

`weighted4CompletedWeekQty` and `stockCoverWeeks` remain unchanged legacy facts. `sellingAgeVelocityQtyPerWeek` and `sellingAgeStockCoverWeeks` are parallel facts with a different early-life meaning:

- legacy velocity uses the last four completed calendar rows, so pre-launch zero rows can depress W1-W3 velocity;
- selling-age velocity starts at the first positive completed-sales week, keeps post-launch zero weeks, uses the same normalized recency weights, and excludes WTD;
- each cover must remain visibly paired with its own velocity denominator;
- disagreement is itself diagnostic evidence and must not be resolved by averaging or silently replacing one field.

On 26FW APP, both versions are calculable for 180 SKUs. They match exactly for 47; the prior diagnostic comparison found 90/180 cases where legacy velocity was at least 25% lower under an already-existing descriptive comparison. That 25% comparison is an audit artifact, not a future rule. During simulation, record the two facts side by side and log disagreement; do not use the disagreement to assign a review state.

## Analog Pace role

Analog Pace is an early relative-performance cue for W2-W8. It compares a color SKU's cumulative progress with historical analog progress and expresses the result as a percentile. It answers, “How unusual is this early path relative to analogs?” It does not answer, “How many units will sell?” or “Should this SKU be reordered?”

Analog Pace therefore:

- is unavailable before W2 and after W8 under this design;
- never substitutes for actual velocity, stock, or remaining supply;
- never forecasts final demand or reorder quantity;
- remains `HOLD` for production;
- may be displayed beside other evidence in a read-only simulation without controlling it.

The next simulation should join the existing Analog Pace diagnostic by SKU; it should not recompute pace. It should preserve the existing selling week, percentile, analog method/cohort size, and missingness reason so the context remains auditable. Cohort construction, percentile ties, and fallback behavior stay owned by the existing Analog Pace artifact and remain unchanged.

The historical 25FW results show directional lift at some percentile slices, but imperfect precision and recall. Those calibration bands remain descriptive artifacts and are not business thresholds.

## STYLE Forecast role

Forecast is later-stage STYLE context in W9+ only. It may help a planner understand the broader style trajectory after the color SKU's own demand and supply facts are already visible. It cannot:

- remove a strong color SKU because the STYLE context is weaker;
- elevate a weak color SKU because the STYLE context is stronger;
- fill missing color inventory or supply facts;
- be used before SKU-level lifecycle/applicability is established;
- act as a color-SKU queue gate.

If a strong SKU fact conflicts with weaker STYLE context, the SKU stays visible and the planner inspects sibling-color mix and whether the style aggregate is masking color divergence. If a weak SKU fact conflicts with stronger STYLE context, the style context does not rescue the color; the planner inspects whether other colors are driving the STYLE result.

## Current factual archetypes

The existing usability audit's descriptive archetypes partition the 439 current APP SKUs as follows. These are observations, not future states:

| Existing descriptive archetype | Count |
|---|---:|
| `NO_COMPLETED_SALES` | 254 |
| `WTD_ONLY` | 5 |
| `W1_DISPLAY_ONLY` | 31 |
| `EARLY_SELLING_WITH_AMPLE_STOCK` | 144 |
| `LOW_ON_HAND_WITH_PENDING_SUPPLY` | 5 |

The design diagnostic also reproduces cross-lens intersections using only cutoffs already present in prior diagnostic artifacts: the prior pace simulation's percentile `>=75`, selling-age cover `<2` for low cover, and selling-age cover `>=4` for ample cover. They are not promoted to rules.

| Descriptive intersection | Current count | Example |
|---|---:|---|
| Higher early relative pace + ample cover | 30 | `WA2603CD11BL`, W2, pace percentile 100, selling-age cover 8.4167 weeks, on-hand 404, raw remaining 84 |
| Higher early relative pace + low cover | 5 | `WA2603CRT1BK`, W3, pace percentile 100, selling-age cover -2.0571 weeks, on-hand -48, raw remaining 93 |
| Low cover + pending raw supply | 5 | Same five low-cover rows; all have positive `orderQty - inboundQty` |
| Low cover + no pending raw supply | 0 | No current 26FW APP example; the architecture must still represent this state |
| Declining trend + ample cover | 10 | `WA2603CD56PI`, W4, declining, selling-age cover 119.6875 weeks, on-hand 383, raw remaining 6 |
| Applicable W9+ SKU/STYLE conflict | 0 | No current W9+ APP SKU; do not use the 144 raw joins as applicable evidence |

The five low-cover examples have negative ERP stock and positive raw remaining order. That combination demonstrates why low stock cannot be interpreted without supply status and why raw remaining quantity needs an ETA/status check before it can be called meaningful supply.

## Conflict matrix

The matrix defines the next human inspection, not an automated action.

| Evidence conflict | Preserve separately | Planner inspects next | What the design must not infer |
|---|---|---|---|
| Strong early relative pace + ample on-hand | Pace percentile, actual velocity, on-hand, both covers, remaining supply | Whether pace is sustained across completed weeks; color mix; inventory already sufficient for the relevant horizon | Pace alone means reorder review |
| Strong early relative pace + low on-hand | Pace, velocity, on-hand, cover, supply remainder | Stock accuracy; demand persistence; lead time; open supply status and ETA | Low cover plus pace automatically means reorder |
| Low on-hand + pending committed supply | On-hand/cover and remaining supply as separate supply facts | Confirmed open quantity, ETA, cancellation/allocation status, and whether arrival precedes the exposure window | Pending quantity is equivalent to available stock, or is automatically irrelevant |
| Low on-hand + no pending committed supply | On-hand/cover, zero/non-positive remainder, demand evidence | Data completeness, demand persistence, production/lead-time feasibility, minimums, and manual business constraints | A reorder quantity or automatic action |
| Declining recent trend + ample stock | Trend, velocity level, cover, on-hand | Whether decline is noise, seasonality, lost availability, or genuine slowing; sibling-color divergence | Decline alone means healthy, unhealthy, or no review |
| Strong SKU fact vs weaker STYLE context | Color demand/supply first; STYLE Forecast separately | Whether the style aggregate is diluted by other colors and whether this color remains exceptional | STYLE can suppress the SKU |
| Weak SKU fact vs stronger STYLE context | Color demand/supply first; STYLE Forecast separately | Whether other colors drive the STYLE result; color-specific inventory, demand, and substitution | STYLE can promote the SKU |

## Candidate human-facing vocabulary

These are **unimplemented design names only**. They are not current signals, assignments, priorities, recommendations, or actions, and no numeric boundary is proposed here.

| Candidate name | Possible human meaning |
|---|---|
| `OBSERVE` | Lifecycle or evidence is visible, but the row is not ready for a review decision |
| `DATA WAIT` | A completed week or required fact is not yet available |
| `EARLY WATCH` | W2-W8 evidence is ready for human observation, with Analog Pace shown only as context |
| `SUPPLY PENDING` | Current supply exposure coexists with raw remaining committed quantity that needs ETA/status confirmation |
| `REORDER REVIEW` | A future human queue name only; if ever approved, it asks for manual review and never sets quantity |
| `HEALTHY / NO URGENCY` | A future descriptive human conclusion, not an automatic suppression rule |

The safer UI model is compositional: one lifecycle label, independent demand/supply/pace/trend facts, explicit conflicts, and optional human disposition. A single all-purpose status would conceal why a row is present.

The next read-only simulation must not assign these candidate names. They remain vocabulary for later user research until a separate owner decision defines whether any should exist and what evidence would support them.

## Historical evaluation with current 25FW data

The retained 25FW Clean Analog sample contains 348 SKUs / 166 STYLEs.

Can be evaluated now:

- lifecycle/applicability from completed weekly SKU demand;
- legacy and selling-age velocity at W1-W8 checkpoints (348/348 coverage in the existing calibration design);
- trend derived from completed weekly demand;
- Analog Pace at the already-calibrated W2, W3, W4, W5, W6, and W8 checkpoints;
- relationship of those demand-side facts to final December order sell-through as a **calibration** outcome;
- STYLE Forecast behavior separately through its existing STYLE-level historical artifacts, without using it as a SKU gate.

Cannot be evaluated truthfully from current retained history:

- as-of weekly ERP on-hand inventory;
- true historical ERP stock cover;
- as-of inbound completion and remaining committed supply;
- whether pending supply was confirmed, delayed, cancelled, or received in time;
- historical demand-versus-supply conflict states;
- end-to-end false-positive/false-negative rates for a supply-sensitive review queue.

The existing `orderQty - observed cumulative sales` series is an explicitly non-ERP sensitivity proxy. It must not be relabeled as historical stock or used to claim historical stock-cover performance. A future end-to-end historical evaluation requires dated weekly SKU snapshots and planner disposition/outcome data.

The retained weekly demand can support a future read-only W7 Analog Pace checkpoint calculation, but the current saved Analog Pace calibration artifact does not tabulate W7. That is an artifact-coverage gap, not a stock-data gap, and no W7 result is invented here.

## Error definitions for a future review queue

These definitions are architectural; current data cannot estimate their rates.

**False-positive reorder review:** a SKU enters the human reorder queue, but contemporaneous facts would have shown no incremental review need. Examples include pace-only escalation while on-hand is ample; low on-hand whose confirmed inbound arrives within the relevant horizon; a declining SKU with ample stock; or a weak color promoted only because its STYLE Forecast is strong.

**False-negative:** a SKU stays out of the queue even though contemporaneous color demand and supply facts warranted human inspection. Examples include strong color evidence suppressed by weak STYLE context; low on-hand with no usable pending supply hidden by a strong STYLE sibling; delayed/cancelled supply treated as available; or inflated cover caused by using only the pre-launch-zero-depressed legacy velocity.

Neither definition implies an automatic reorder. The evaluation target is whether the right color SKU reached a planner's attention, while quantity and final disposition remain manual.

Measuring those errors later requires an explicit human ground-truth record per as-of date: whether review was appropriate, the planner's reason, confirmed open quantity/status/ETA, the relevant planning horizon, and the eventual disposition. Until those definitions and observations exist, “false positive” and “false negative” remain test-case categories rather than reportable rates.

## Next safe task

Build a **read-only SKU Signal v1 state-machine simulation** over the current local snapshot with these limits:

1. Route only lifecycle and evidence availability; do not assign candidate human-facing labels.
2. Emit independent fact blocks, missingness reasons, and conflict markers.
3. Keep legacy and selling-age fields side by side.
4. Join existing Analog Pace only in W2-W8 and STYLE Forecast only as W9+ context; recompute neither.
5. Do not emit a score, rank, priority, recommendation, automatic action, or reorder quantity.
6. Do not mutate production SKU schema or any protected STYLE logic.

The proposed diagnostic artifact shape is `meta`, descriptive `summary`, and SKU rows containing `sku`, `styleCode`, `lifecycle`, `evidenceAvailability`, `demandFacts`, `inventoryFacts`, `supplyFacts`, `analogPaceContext`, `trendContext`, `styleForecastContext`, `conflicts`, and `dataQuality`. It must not contain a production `signal`, `priority`, `reorderTiming`, recommendation, or action field. Protected STYLE logic specifically includes the Action Engine, P1/P2, priority, `reorderTiming`, STYLE Preview, STYLE Forecast, STYLE Stock Risk, Forecast logic, Analog Pace calibration, and existing reorder-monitor scoring.

Acceptance checks should use the current snapshot plus synthetic fixtures for branches the snapshot cannot exercise: W9+ with and without STYLE context, low cover with no pending supply, zero/non-positive order, missing inbound, negative remaining supply, zero velocity, and negative ERP stock. Synthetic fixtures verify contract routing only and must not be mixed into factual current counts.

In parallel planning, define a future weekly ERP snapshot retention contract including as-of date, SKU on-hand, ordered quantity, received quantity, open/cancelled quantity, expected receipt date, and planner disposition. Data acquisition is required before historical supply-state performance can be evaluated, but it is not a blocker for the read-only structural simulation.

## Direct answers

- **Q1 — Ready for read-only simulation?** Yes. The current facts are sufficient for a structural, read-only state-machine simulation; no further SKU fact fix is required first. They are not sufficient for production decisions.
- **Q2 — What can 25FW evaluate?** Lifecycle, completed-week demand/velocity, derived trend, existing Analog Pace checkpoints, and demand-side relationship to final sell-through. Historical on-hand, true stock cover, inbound completion, remaining supply, and supply-sensitive queue errors cannot be evaluated because weekly ERP snapshots are absent.
- **Q3 — Next safe task?** Read-only state-machine simulation using lifecycle, availability, and conflict display only. Specify future snapshot retention alongside it; do not sync now.
- **Q4 — What must never become one score?** Lifecycle, demand/velocity, on-hand/cover, inbound/remaining supply, Analog Pace, trend, and STYLE Forecast. Legacy and selling-age variants must also remain named separately.
- **Q5 — False positive?** A SKU is sent for reorder review when pace alone is high but stock is ample, when timely committed supply already resolves the exposure, or when STYLE context promotes a weak color.
- **Q6 — False negative?** A color needing human inspection is hidden by weak STYLE context, misleading pending-supply assumptions, or legacy velocity/cover semantics that understate current color demand.

SKU_SIGNAL_V1_DESIGN_READY
