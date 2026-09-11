# Next Priorities

P0 status: RESOLVED. Age-aware velocity/cover separate fields are approved and implemented in `sku-sync.ts`.

SKU Signal v1 DESIGN status: COMPLETE. Read-only lifecycle/evidence state-machine simulation status: COMPLETE. Git checkpoint status: COMPLETE at `9f4948f`. Special Market/direct-ship diagnostic status: COMPLETE.

Current next priority: obtain authoritative SKU-level shipment-route/direct-ship evidence for the four unresolved Special Market candidates. Update the exact-SKU evidence registry and regenerate the diagnostic only; retain `UNKNOWN` when evidence is absent.

Unresolved candidates: `WA2603CRT1GR`, `WA2603STT1BK`, `WA2603STT1WH`, `WA2603STT2CH`. Do not propagate the confirmed `WA2603CRT1BK` evidence to its STYLE sibling.

## P0 — Applicability and data integrity

- The five former DATA_UNRESOLVED rows are confirmed WTD_ONLY / WAIT_FOR_FIRST_COMPLETED_WEEK from stored snapshot evidence. Keep them outside the Early Pace denominator until a completed sales week exists; do not manufacture W1.
- Preserve the corrected lifecycle semantics: W1 display-only; W2-W8 Early Pace; W9+ mature context. Do not reuse stale 15/439, 15/90, 75-failure, or 90-mature figures.
- Preserve the corrected official coverage denominator: PACE_READY / EARLY_PACE_APPLICABLE = 149 / 149; historical calibration remains unchanged.

## P1 — SKU Current Risk design

P0 is resolved: the five former DATA_UNRESOLVED rows are confirmed WTD_ONLY / WAIT_FOR_FIRST_COMPLETED_WEEK from stored snapshot and parser evidence. DATA_UNRESOLVED is 0; cumulative vs completed+WTD is exact 439/439, while completed-only remains informational (exact 291, within ±1 42, remaining mismatch 106).

Use existing completed-week velocity, selling-age velocity, ERP stock, inbound completion, remaining order, trend, and stock cover as facts/context. The approved separate fields are now present in SKU JSON, but they remain facts only. Do not convert them into thresholds, rank, priority, Forecast, Analog Pace, stockRisk, previewScore, reorder recommendation, or SKU Signal production logic.

## P2 — Analog Pace production review

Revisit HOLD only after Early Pace applicability and coverage improve. Do not promote thresholds from calibration to production automatically.

## P3 — SKU Signal v1

Design is complete in `docs/SKU_SIGNAL_V1_DESIGN.md`. The current facts support a read-only lifecycle/evidence state-machine simulation, not a production SKU Signal. The simulation may emit lifecycle, independent facts, missingness reasons, and conflict markers only. It must not implement scoring, weights, business thresholds, rank, priority, reorder recommendation, reorder quantity, or automatic action.

## P4 — ERP source automation

Evaluate EIS/API or another controlled source for future ERP SKU snapshot automation. Do not sync during ordinary analysis sessions.

Safe next task after direct-ship evidence resolution: review a fixed sample from each populated lifecycle and factual conflict/data-quality marker in `data/sku-signal-v1-state-machine.json`. Confirm evidence wording and missingness clarity only. Do not add production SKU Signal logic, labels, priority, thresholds, reorder recommendation, Forecast changes, Analog Pace promotion, scoring, or external sync.

## Special Market / direct-ship applicability (2026-09-11)

- Current metadata has `isSpecialMarket`, derived from `[대만]` in the STYLE product name, but no direct-ship or logistics-route field.
- Exact-SKU user evidence confirms only `WA2603CRT1BK` as Taiwan direct ship. Its domestic inbound/on-hand/cover/supply-risk interpretation is not applicable; observed demand remains separate.
- 26FW APP: 439 SKU; Special Market 5 SKU / 3 STYLE; confirmed direct ship 1; Special Market direct-ship `UNKNOWN` 4; market scope `UNKNOWN` 295.
- Confirmed domestic Current Risk misclassification is 1 SKU. Four additional Special Market SKUs have the same negative ERP stock/cover pattern and are possible misclassifications, but must remain `UNKNOWN` until authoritative shipment evidence is available.
- Contract, evidence registry, generator, artifact, tests, and report are diagnostic-only. No production risk/reorder logic or protected behavior changed.
- Verification: combined Python diagnostic suite 29/29, SKU regression 4/4, Forecast regression 6/6 plus reference validation.

## P1 completion note (2026-09-10)

- Completed the safe diagnostic design in `docs/SKU_CURRENT_RISK_DIAGNOSTIC.md`.
- Generator: `scripts/sku_current_risk_diagnostic.py`; snapshot: `data/sku-current-risk-diagnostic.json`.
- Superseded next task: the age-aware velocity/cover contract is now approved and implemented as separate fields. Keep diagnostic bands out of production decisions.
- The isolated read-only prototype is now available at `public/sku-current-risk-diagnostic.html`; it uses only the diagnostic snapshot and independent lenses.
- Unresolved: no approved business thresholds or aggregate risk definition exists; do not invent one, and do not implement SKU Signal, SKU priority, Forecast changes, or production thresholds.

## Usability audit note (2026-09-10)

- Completed `SKU_CURRENT_RISK_USABILITY_AUDIT.md` and `sku-current-risk-usability-audit.json` with full-universe diagnostics kept separate from 26FW APP.
- Recommendation is `FIX_FIRST`, not GO: Current Risk evidence is not semantically stable enough for SKU Signal v1 DESIGN until selling-age velocity and cover semantics are resolved.
- Superseded next task: separate age-aware fields are now implemented with regression tests; preserve existing legacy fields and protected production behavior.

## Selling-age contract calibration (2026-09-10)

- Completed `SKU_SELLING_AGE_VELOCITY_CONTRACT.md`, `SKU_SELLING_AGE_VELOCITY_CALIBRATION.md`, `sku_selling_age_velocity_calibration.py`, and `sku-selling-age-velocity-calibration.json`.
- Recommendation is `ADD_AGE_AWARE_SEPARATE_FIELDS`, pending business/owner approval; `weighted4CompletedWeekQty` and `stockCoverWeeks` remain protected legacy facts.
- 25FW Clean Analog: 348 SKU / 166 STYLE; W1-W8 coverage 100% within the clean rows. Pre-launch zero distortion is concentrated in W1-W3; age-aware stability is modestly better, while outcome relationship is tied/slightly lower early and identical from W3 onward.
- No historical weekly ERP stock snapshots were retained; true ERP stock-cover bin calibration is therefore unavailable. The order-minus-observed-sales proxy in the artifact is supplemental and not a production stock fact.
- At calibration time there was no production schema/data mutation, SKU Signal, Forecast change, Analog Pace promotion, threshold, Action Engine, priority, or reorderTiming change.
- Superseded next task: contract approval and separate-field pipeline implementation are complete.

## Selling-age separate field implementation (2026-09-10)

- Implemented approved fields `sellingAgeVelocityQtyPerWeek` and `sellingAgeStockCoverWeeks` in `sku-sync.ts`.
- Regenerated `data/sku-latest.json` and `public/data/sku-latest.json` from the existing local ERP snapshot only. No external sync.
- Updated the isolated read-only SKU Current Risk diagnostic data/view to show legacy and selling-age velocity/cover side by side. Display-only; no aggregate signal, rank, threshold, priority, reorder recommendation, or action.
- 26FW APP coverage remains 439 total; selling-age velocity/cover 180 rows; lifecycle counts PRE_SALE 254, WTD_ONLY 5, W1 31, W2 59, W3 43, W4 30, W5 2, W6 4, W7 9, W8 2.
- Superseded next task: SKU Signal v1 DESIGN is complete.

## SKU Signal v1 design completion (2026-09-10)

- Added `SKU_SIGNAL_V1_DESIGN.md`, `sku_signal_v1_design_diagnostic.py`, `sku-signal-v1-design-diagnostic.json`, and a focused unit test.
- Current 26FW APP evidence: 439 SKU; selling-age velocity/cover 180; W2-W8 Analog Pace 149/149; on-hand/order/inbound/remaining supply facts 439/439; raw STYLE Forecast joins 144 but W9+ applicable context 0 because there are no current W9+ APP rows.
- Demand and supply remain independent. Raw `orderQty - inboundQty` is positive for 372 SKU but has no ETA/cancellation/allocation status and must not be treated as guaranteed timely supply.
- Historical 25FW demand-side evaluation is feasible; historical supply-state and end-to-end queue error evaluation remain unavailable without dated weekly ERP stock/supply snapshots.
- Next safe task: build a read-only lifecycle/evidence state-machine simulation with no score, rank, priority, recommendation, quantity, action, protected STYLE change, or external sync.
- Verification: focused Python suite 13/13, SKU regression 4/4, Forecast regression 6/6 plus reference validation.

## SKU Signal v1 state-machine completion (2026-09-10)

- Added a reproducible read-only generator and 439-row local artifact with independent lifecycle, demand, inventory, supply, Analog Pace, trend, and lifecycle-gated STYLE Forecast context.
- Reconciled PRE_SALE 254, WTD_ONLY 5, W1 31, W2-W8 149, W9+ 0; Analog Pace 149/149; selling-age velocity/cover 180/439; ERP stock/order/inbound/remaining 439/439.
- Preserved 5 negative ERP stock/cover rows and 63 negative remaining-order rows without clamping. Recorded exact legacy-versus-selling-age disagreements and raw context joins outside their applicability windows as factual markers only.
- STYLE Forecast remains null/not-applicable on all current rows and cannot change SKU membership or lifecycle. No production behavior or protected field changed.
- Verification passed: 13/13 focused Python tests, 4/4 SKU regressions, 6/6 Forecast regressions plus reference validation, deterministic artifact regeneration, and protected-field hash comparison. No build was required because this step added no public asset.
- Next safe task is a planner evidence review on a fixed row sample. An isolated read-only viewer may be considered only after that review and as a separate scope.
