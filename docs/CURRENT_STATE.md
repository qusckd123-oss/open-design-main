# Current State

## Data sources and universe

- Sales Dashboard STYLE data: automated sync path exists; no external sync in this work.
- ERP SKU weekly raw: manual weekly snapshot.
- ERP: 586 valid SKU / 285 STYLE.
- APP: 200 STYLE / 439 SKU. ACC: 84 STYLE / 145 SKU. UNMAPPED: 1 STYLE / 2 SKU.
- Current 26FW APP: 439 SKU.

SKU Fact preserves orderQty, inboundQty, cumulativeSalesQty, erpStockQty, sell-throughs, weekly/WTD history, completed-week metrics, stock cover, and sales trend. STYLE Preview/Forecast/Stock Risk and Action Engine are production-controlled and unchanged.

## Calibration and forecast

- 25FW Clean Analog: 348 SKU / 166 STYLE.
- Forecast v1.1 exists and regression-tested; it is separate from Analog Pace.
- Analog Pace: ORDER denominator, PERCENTILE representation, production status HOLD.
- Base final >=60%: 37.58%.
- P90 final >=60%: W2 50.00%, W3 63.64%, W4 67.74%, W5 67.65%, W6 68.75%, W8 78.12%.
- Pace stability Spearman: W2-W3 0.8346, W3-W4 0.9294, W4-W6 0.9057.

## Applicability audit

- Confirmed CURRENT selling-week bug: completed history is oldest-to-newest and continuous across 10 periods (2026-07-05~2026-09-06); current selling week is `historyLength - firstPositiveIndex`, inclusive. Example: index 6 in 10 periods is W4, not W7.
- ALL_26FW_APP: 439; PRE-SALE/NOT_YET_APPLICABLE: 254; W1 display-only: 31; W2-W8 Early Pace applicable: 149; MATURE W9+: 0; WTD_ONLY / WAIT_FOR_FIRST_COMPLETED_WEEK: 5; DATA_UNRESOLVED: 0.
- Corrected PACE_READY: 149; PACE_FAILED: 0; official Early Pace coverage: 149 / 149 = 100.00%. Reference coverage: 149 / 439 = 33.94%; 149 / STARTED_SELLING 185 = 80.54%.
- Of the previous 75 Early Pace NO_CURRENT_PROGRESS failures, 70 were selling-week artifacts. The remaining 5 are now confirmed WTD_ONLY: cumulativeSalesQty=1, currentWtdQty=1, currentWtdPeriod=2026-09-07~09-13, completed history sum=0, and firstPositiveSalesPeriod=2026-09-09. All 90 supposed W9+ mature rows were selling-week artifacts. Corrected NO_CURRENT_PROGRESS is 0; these rows are not data errors and remain outside Pace until the first completed sales week.
- Five WTD_ONLY SKUs remain outside the Early Pace denominator: WA2603CD65CM, WA2603HZ61PI, WA2603JK62BE, WA2603PT61PI, WA2604PT16BL. No missing weekly history was manufactured.
- Reconciliation has two diagnostics: completed-only is exact 291, within ±1 42, remaining mismatch 106; completed-sum + currentWtdQty is exact 439, within ±1 0, remaining mismatch 0. The latter is the proper reconciliation; no completed W1 is manufactured for the five WTD_ONLY rows.
- Category Early Pace / Ready: CD 26/26, CR 15/15, HD 7/7, HZ 7/7, JK 1/1, KT 11/11, LT 20/20, PT 21/21, SH 10/10, SR 5/5, ST 26/26; DP and SO 0/0.
- Historical 25FW calibration remains unchanged: ORDER P90 final >=60% W2-W8 = 50.00%, 63.64%, 67.74%, 67.65%, 68.75%, 78.12%; Pace remains HOLD.

## Lifecycle

- PRE-SALE: no Pace.
- W1: display-only observation.
- W2-W8: Analog Pace + Current Risk diagnostic candidate.
- W9+: Current Risk / Trend / Forecast context.

Known limitations: ERP metadata is wider than Sales Dashboard STYLE universe; some gender and special-market metadata is unavailable/unknown; WTD is intentionally excluded from completed-week pacing; Analog Pace remains HOLD; no SKU Signal exists.

## P1 SKU Current Risk diagnostic (completed 2026-09-10)

- Added `scripts/sku_current_risk_diagnostic.py`, a read-only SKU-first reshaper of the existing `data/sku-latest.json` snapshot.
- Added `data/sku-current-risk-diagnostic.json` for the current 2026-09-09 ERP snapshot: 586 SKU rows.
- Exposes independent facts for completed-week velocity, ERP stock, inbound completion, raw remaining order, existing sales trend, and existing stock cover; STYLE is context only.
- Current diagnostic distribution: 328 rows have `NO_COMPLETED_VELOCITY`; stock-cover bands are ZERO 5, 2_TO_4_WEEKS 1, OVER_4_WEEKS 252, UNKNOWN 328; inbound bands are NO_INBOUND 252, PARTIAL 193, COMPLETE_OR_OVER 141.
- WTD is excluded from velocity and missing completed history is surfaced, never manufactured. No aggregate risk score, rank, SKU Signal, SKU priority, Forecast change, reorder threshold, or production logic was added.
- Added isolated read-only view `public/sku-current-risk-diagnostic.html` with local data at `public/data/sku-current-risk-diagnostic.json`; it supports descriptive filtering, sorting, and row detail only.
- Design note: `docs/SKU_CURRENT_RISK_DIAGNOSTIC.md`. Focused diagnostic tests, SKU/Forecast regressions, build, and diagnostic UI smoke test pass.

## SKU Current Risk usability audit (completed 2026-09-10)

- Added `scripts/sku_current_risk_usability_audit.py`, `data/sku-current-risk-usability-audit.json`, and `docs/SKU_CURRENT_RISK_USABILITY_AUDIT.md` as diagnostic-only artifacts.
- `sku-sync.ts` confirmed: `weighted4CompletedWeekQty` uses the last four completed calendar rows and normalizes `[0.1, 0.2, 0.3, 0.4]` over fewer available rows, but leading pre-launch zero rows remain in that window; current WTD is excluded.
- Selling-age diagnostic velocity starts at the first positive completed-sales week and applies the same normalized recency weights over up to four selling-age weeks. It does not include WTD and does not replace production fields.
- 26FW APP 439 SKU: PRE_SALE 254, WTD_ONLY 5, W1 31, W2-W8 149, W9+ 0. Selling-age velocity is calculable for 180/439; true missing velocity among completed-positive rows is 0.
- Existing vs selling-age velocity: both calculable 180, exact 47, relative MAE 42.54%, median relative difference +26.98%; existing velocity is materially depressed by the diagnostic >=25% rule for 90/180. Existing recent-4 windows contain pre-launch zeros for 133 rows / 254 zero-week occurrences.
- Diagnostic stock cover is calculable for 180/439, same as existing cover usability; 0 newly usable rows and 90/180 materially moved cover rows under the >=25% relative-cover rule. Existing `stockCoverWeeks` remains unchanged.
- 26FW APP operational archetypes (Analog Pace-independent): `NO_COMPLETED_SALES` 254, `W1_DISPLAY_ONLY` 31, `WTD_ONLY` 5, `EARLY_SELLING_WITH_AMPLE_STOCK` 144, and `LOW_ON_HAND_WITH_PENDING_SUPPLY` 5.
- Descriptive archetypes and examples are stored in the JSON; Analog Pace percentile is joined only as independent W2-W8 context and does not drive the audit result. Decision: `FIX_FIRST` before SKU Signal v1 DESIGN because velocity/cover semantics need an age-aware pipeline decision.
- Handoff verification: focused Python audit unittest 4/4, `npm.cmd run sku:test` 3/3, and `npm.cmd run forecast:test` 6/6 with forecast reference validation passing. No production behavior changed.

## Selling-age velocity contract calibration (completed 2026-09-10)

- Added diagnostic-only contract design: `docs/SKU_SELLING_AGE_VELOCITY_CONTRACT.md`.
- Added reproducible 25FW Clean Analog calibration script and artifact: `scripts/sku_selling_age_velocity_calibration.py` and `data/sku-selling-age-velocity-calibration.json`; report: `docs/SKU_SELLING_AGE_VELOCITY_CALIBRATION.md`.
- 25FW sample is 348 SKU / 166 STYLE. W1-W8 checkpoint coverage is 348/348 (100%) for both measures within the Clean Analog rows. Age-aware minus legacy median relative velocity difference is +150.00% W1, +42.86% W2, +11.11% W3, and 0% W4-W8.
- Pre-launch zeros distort the legacy recent-four window for 347/348 rows in W1-W3, with 1,022, 689, and 347 occurrences respectively; post-launch zero-sales rows are counted separately (0, 66, 77, 81, 83, 83, 84, 85 from W1-W8).
- Stability improves modestly with age-aware velocity: median absolute WoW relative change 0.2848 → 0.2768 and mean 0.8763 → 0.6317. Final order sell-through relationship is effectively tied/slightly lower for age-aware in W1-W2 and identical from W3 onward; this supports semantic cleanup, not a signal/threshold claim.
- Historical ERP stock snapshots do not exist in the retained Clean Analog universe, so true ERP stock-cover bins cannot be calibrated without hindsight. The artifact includes an explicitly non-ERP order-minus-observed-sales proxy only as sensitivity context.
- Decision: `ADD_AGE_AWARE_SEPARATE_FIELDS`; legacy fields remain protected, no SKU Signal v1, no production schema mutation, no Analog Pace calibration number changed.

## Selling-age separate SKU fields (completed 2026-09-10)

- Approved schema extension implemented in `scripts/sku-sync.ts`: `sellingAgeVelocityQtyPerWeek` and `sellingAgeStockCoverWeeks`.
- `weighted4CompletedWeekQty` and `stockCoverWeeks` remain unchanged protected legacy facts. Forecast, Analog Pace, STYLE Action Engine, priority, reorderTiming, STYLE Preview/Forecast/Stock Risk, reorder thresholds, preview score, and SKU Signal remain untouched.
- Regenerated `data/sku-latest.json` and `public/data/sku-latest.json` from the existing local ERP snapshot only: `품번별 판매추이분석(주간_월) 260909.xlsx`, sourceAsOf `2026-09-09`. No Sales Dashboard or network sync was run.
- 26FW APP remains 439 SKU. Candidate field coverage: selling-age velocity 180/439 and selling-age stock cover 180/439. Lifecycle counts: PRE_SALE 254, WTD_ONLY 5, W1 31, W2 59, W3 43, W4 30, W5 2, W6 4, W7 9, W8 2.
- Legacy vs selling-age evidence matches prior usability audit: both calculable 180, exact 47, relative MAE 42.54%, median relative difference +26.98%, materially depressed existing velocity 90/180, materially moved cover 90/180, pre-launch zeros in existing recent-4 for 133 rows / 254 zero-week occurrences.
- Updated read-only SKU Current Risk diagnostic JSON/view to display legacy and selling-age velocity/cover side by side only. No aggregate signal, rank, threshold, priority, reorder recommendation, or action was added.
- Tests: `npm.cmd run sku:test` passed 4/4; Python current-risk tests passed 6/6; `npm.cmd run forecast:test` passed 6/6 plus forecast reference validation; `npm.cmd run build` passed; Current Risk diagnostic E2E passed. `npm.cmd run sku:test:ui` reached the SKU drawer data assertions but failed on the existing `#drawerClose` click being outside the Playwright viewport.

## SKU Signal v1 design / diagnostic proposal (completed 2026-09-10)

- Added `docs/SKU_SIGNAL_V1_DESIGN.md`. This is design-only: no production SKU Signal, score, weight, threshold, rank, priority, reorder recommendation, reorder quantity, or automatic action was added.
- Added reproducible factual artifact `data/sku-signal-v1-design-diagnostic.json`, generator `scripts/sku_signal_v1_design_diagnostic.py`, and a focused unit test. Inputs are current local snapshots and existing diagnostics only; no Sales Dashboard, ERP, or network sync ran.
- Decision: current facts are sufficient for a read-only lifecycle/evidence state-machine simulation. No additional SKU fact fix is required first. This is not production readiness.
- Current 26FW APP remains 439 SKU: PRE_SALE 254, WTD_ONLY 5, W1 31, W2-W8 149, W9+ 0. On-hand/order/inbound/remaining supply are calculable for 439/439; selling-age velocity/cover for 180/439; Analog Pace for 149/149 applicable W2-W8; raw STYLE Forecast joins for 144/439 but applicable W9+ Forecast context for 0.
- Raw remaining committed supply is positive for 372/439, but the snapshot has no PO ETA/cancellation/allocation status. It is a separate supply fact, not proof of usable or timely supply.
- Existing descriptive intersections, not business rules: higher relative pace + ample cover 30, higher relative pace + low cover 5, low cover + pending raw supply 5, low cover + no pending raw supply 0, declining trend + ample cover 10. The reproduced cutoffs are explicitly inherited from prior diagnostic artifacts and are not promoted.
- Historical 25FW can evaluate lifecycle, velocity, trend, Analog Pace checkpoints, and demand-side outcome relationships. It cannot evaluate as-of on-hand, true ERP cover, inbound completion, remaining supply, or supply-sensitive queue errors because weekly ERP stock/supply snapshots are absent.
- Next safe task: a read-only SKU Signal v1 state-machine simulation that emits lifecycle, independent fact blocks, missingness, and conflict markers only. Preserve SKU-first analysis; keep STYLE Forecast W9+ context-only; do not add production logic or automated decisions.
- Tests: focused Python diagnostic/current-risk/applicability/calibration suite passed 13/13; `npm.cmd run sku:test` passed 4/4; `npm.cmd run forecast:test` passed 6/6 plus forecast reference validation. The openpyxl default-style warning is unchanged and non-failing.

## SKU Signal v1 read-only state-machine simulation (completed 2026-09-10)

- Added `scripts/sku_signal_v1_state_machine.py`, `data/sku-signal-v1-state-machine.json`, focused synthetic/current-snapshot tests, and `docs/SKU_SIGNAL_V1_STATE_MACHINE.md`.
- The simulation is SKU-first and read-only. It emits lifecycle, evidence availability, independent demand/inventory/supply/Analog Pace/trend/STYLE Forecast fact blocks, and factual conflict/data-quality markers only.
- Current 26FW APP remains 439 SKU: PRE_SALE 254, WTD_ONLY 5, W1 31, W2-W8 149, W9+ 0. Analog Pace joins reconcile 149/149 in W2-W8; selling-age velocity/cover reconcile 180/439; ERP stock/order/inbound/remaining order reconcile 439/439.
- STYLE Forecast context is null for every current row because there are no W9+ SKUs. The 144 raw STYLE joins outside W9+ are recorded only as factual join conflicts and never filter, promote, suppress, or remove a SKU.
- Current factual markers: legacy-versus-selling-age velocity difference 133, cover difference 133, numeric Analog Pace outside W2-W8 31, raw STYLE Forecast join outside W9+ 144, negative ERP stock 5, negative cover 5, and negative raw remaining order 63.
- Negative values are preserved. Missing/non-positive denominator branches and W9+ STYLE branches are covered with synthetic fixtures. No score, rank, weight, priority, timing, recommendation, quantity, action, candidate human-facing label, production schema mutation, or external sync was added.
- Verification: focused state-machine Python tests passed 13/13; `npm.cmd run sku:test` passed 4/4; `npm.cmd run forecast:test` passed 6/6 plus reference validation. Deterministic regeneration and protected STYLE/SKU fact hashes passed. Build was not required because no public prototype asset was added.
- Exact next task: planner evidence review of a fixed lifecycle/marker sample for wording and missingness clarity only; do not define production routing or business thresholds.
