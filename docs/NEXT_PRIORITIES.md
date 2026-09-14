# Next Priorities

Immediate next step: run `npm run sales:sync` (live Sales Dashboard, local browser profile) then `npm run build`, and confirm in the browser that:
1. The "해외 판매" filter on `/reorder-monitor.html` shows the expected badge/share for `WA2603CRT1`/`WA2603STT2`/the other confirmed Special Market SKUs, and that `해외 판매 제외` correctly drops them from the `URGENT` list. See `docs/CURRENT_STATE.md` "Reorder Monitor overseas-sales filter".
2. The new "판매 기준: 전체 / 국내만(해외 제외)" toggle recalculates 판매율/최근완료주/4주가중속도/재고커버/판매추이/STOCK RISK/Preview Score for ALL rows (not just the 3 Taiwan-exclusive ones) when switched to "국내만", that the URGENT count and KPI tiles update accordingly, and that the drawer's history chart/label and signal list switch correctly. See `docs/CURRENT_STATE.md` "Reorder Monitor domestic sales-view toggle". A fresh sync is required first since the `domesticXxx` fields are computed at scrape time.
3. The drawer's history chart now shows the FULL sales trend since the SKU's first positive-sales week (not just 4 weeks), its title (`판매추이 · 전체/국내만 · <start>~<end> (N주)`) updates correctly for both toggle states, and the chart legend is visible. See `docs/CURRENT_STATE.md` "Reorder Monitor full sales-trend history + FCST formula breakdown". Also a fresh sync is required (`fullWeeklyHistory`/`domesticFullWeeklyHistory` computed at scrape time) — until then the chart falls back to the old 4-week view with a "재동기화 필요" note in the title, which is expected.
4. Open a row's forecast card and confirm the new "계산식 보기" block's numbers (Base FCST, Trend Factor, Adjusted FCST, FCST 판매율) match the numeric tiles shown just above it, and that the "FCST는 전체 채널 기준이며 판매 기준 토글의 영향을 받지 않습니다" disclosure reads correctly.

No test suite covers `scripts/sales-dashboard.mjs`'s browser-evaluated code yet (it only runs inside a live Playwright page); consider adding a focused unit test for `channelValue`/the overseas split logic and the `periodSalesAndQty`/`domesticOnly` split, extracted to plain functions, if this area gets touched again.

Open question for the owner (not yet resolved): now that the "판매 기준" toggle exists, does the boolean `해외 판매 제외` quick-filter (drops rows with ANY overseas sales) still need refinement — e.g. a percentage threshold — or does viewing 국내만 numbers via the toggle make that unnecessary? Revisit after the owner has used both in the live dashboard.

Current P0: FULLY IMPLEMENTED on 2026-09-11. The owner-approved contract preserves raw `orderQty` unchanged and adds separately named diagnostic-grade `domesticOrderQty`, `overseasOrderQty`, `domesticOrderQtyAvailable`, and `domesticOrderQtySource` fields, evidence-joined for 26FW APP only. The local SKU outputs were regenerated and verified; actual source counts are 304 `OVERSEAS_PO_WORKBOOK_EXCLUDED`, 134 `NO_OVERSEAS_PO_ROWS_IN_WORKBOOK`, 1 `OVERSEAS_PO_SOURCE_MISSING_FOR_SKU`, and 147 `OUT_OF_EVIDENCE_SCOPE_26FW_APP_ONLY`.

Analog Pace was NOT changed in this task and remains HOLD with its existing ORDER denominator. Whether ORDER-denominator Analog Pace should later switch to a domestic basis is a separate, still-open owner decision requiring explicit approval and its own recalibration/regression scope.

Current P0 data dependency: obtain PO-keyed receipt/inbound data and market/channel-keyed ERP stock/sales data. The order workbook proves order exclusion only; it cannot numerically split current `inboundQty`, `erpStockQty`, or `cumulativeSalesQty`. Keep these areas `UNKNOWN` and do not estimate exclusions.

The overseas PO audit is complete in `docs/SKU_OVERSEAS_PO_APPLICABILITY.md`. The new domestic-order fields are facts only; protected STYLE behavior and raw `orderQty` remain unchanged.

P0 status: RESOLVED. Age-aware velocity/cover separate fields are approved and implemented in `sku-sync.ts`.

SKU Signal v1 DESIGN status: COMPLETE. Read-only lifecycle/evidence state-machine simulation status: COMPLETE. Git checkpoint status: COMPLETE at `9f4948f`. Special Market/direct-ship diagnostic status: COMPLETE. Isolated read-only SKU evidence viewer status: COMPLETE and VERIFIED — user-run `npm.cmd run build`, `npm.cmd run sku:test` (4/4), `npm.cmd run forecast:test` (6/6 plus reference validation), and `node tests/sku-signal-v1-evidence.e2e.ts` (`{"ok":true,"rows":439}`) all passed against the real `vinext dev` server on 2026-09-11; see `docs/CURRENT_STATE.md`.

Current next priority: none currently defined for SKU Signal v1 or P0; await owner direction. The SKU Signal v1 state machine, SKU Signal v1 evidence viewer, Current Risk diagnostic, and Special Market diagnostic artifacts are now stale relative to the new `domesticOrderQty` field and may optionally be refreshed only as a separately approved future task. Do not refresh them automatically, and do not add scoring, ranking, thresholds, recommendations, reorder quantities, production labels, routing, Analog Pace changes, or external sync without explicit owner approval.

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

The direct-ship evidence task and planner evidence review are resolved. The next safe candidate is an isolated read-only viewer that translates the reviewed facts without changing their semantics. Do not add production SKU Signal logic, labels, priority, thresholds, reorder recommendation, Forecast changes, Analog Pace promotion, scoring, or external sync.

## Special Market / direct-ship applicability (2026-09-11)

- Current metadata has `isSpecialMarket`, derived from `[대만]` in the STYLE product name, but no direct-ship or logistics-route field.
- Exact-SKU Taiwan PO assignments plus the matching company logistics record confirm all five current Special Market SKUs as Taiwan direct ship. The four resolved SKUs are `WA2603CRT1GR`, `WA2603STT1BK`, `WA2603STT1WH`, and `WA2603STT2CH`; `WA2603CRT1BK` remains user-confirmed.
- 26FW APP: 439 SKU; Special Market 5 SKU / 3 STYLE; confirmed direct ship 5; Special Market direct-ship `UNKNOWN` 0; market scope `UNKNOWN` 295.
- Confirmed domestic Current Risk misclassification is 5 SKU. The 295 market-scope `UNKNOWN` rows remain a separate metadata-coverage gap and are not classified by inference.
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
- Planner evidence review is complete (`docs/SKU_SIGNAL_V1_PLANNER_EVIDENCE_REVIEW.md`). Verdict: PASS for a separately scoped isolated read-only viewer with copy guardrails; no schema or production behavior change is required.

## SKU Signal v1 planner evidence review completion (2026-09-11)

- Fixed sample: `WA2603CD12GR`, `WA2603CD65CM`, `WA2603CR14CM`, `WA2603CD11BL`, `WA2603CRT1BK`. Together they cover every populated lifecycle and all 7 current factual conflict/data-quality markers.
- Internal lifecycle/availability/marker enums are audit-safe but require planner-facing translation. `PRE_SALE` must not be shown as confirmed pre-launch because launch status is unknown.
- Confirmed Special Market direct-ship scope must be shown adjacent to preserved domestic ERP anomalies in any future viewer so raw negative facts are not misread as domestic supply-risk conclusions.
- Next safe candidate: isolated read-only evidence viewer only; no score, rank, threshold, priority, recommendation, routing, production label, or external sync.

## SKU Signal v1 evidence viewer completion (2026-09-11)

- Added `public/sku-signal-v1-evidence.html`, `public/js/sku-signal-v1-evidence.js`, static data copies `public/data/sku-signal-v1-state-machine.json` and `public/data/sku-special-market-applicability-diagnostic.json`, and `tests/sku-signal-v1-evidence.e2e.ts`.
- Applied the planner evidence review's exact wording guardrails for lifecycle, availability, conflict, and data-quality markers; joined the Special Market diagnostic as adjacent display-only context. No score, rank, priority, threshold, recommendation, reorder quantity, production label, routing, or external sync was added.
- Verified by the user on 2026-09-11 against the real `vinext dev` server: `npm.cmd run build` PASS, `npm.cmd run sku:test` 4/4, `npm.cmd run forecast:test` 6/6 plus reference validation, `node tests/sku-signal-v1-evidence.e2e.ts` → `{"ok":true,"rows":439}`. See `docs/CURRENT_STATE.md`.
- Superseded next task: none. No further safe SKU Signal v1 task is currently defined; await owner direction on P0 or on scoping any candidate human-facing vocabulary from `docs/SKU_SIGNAL_V1_DESIGN.md`.
