# Current State

## Reorder Monitor full sales-trend history + FCST formula breakdown (completed 2026-09-14)

- Owner feedback after seeing the "판매 기준" toggle work: (1) the drawer's history chart only showed 4 completed weeks — owner wanted the full trend since the SKU's first positive sales week; (2) the drawer's chart title was a hardcoded "완료주 4주 판매수량" string that never changed regardless of view, and its Chart.js legend was hidden (`plugins.legend.display: false`), so there was genuinely no visible indicator of whether the chart/numbers were 전체 or 국내만 — a real bug, not just missing polish; (3) the FCST card showed the resulting numbers (Base FCST, Trend Factor, Adjusted FCST, FCST 판매율) but never explained the formula behind them.
- `scripts/sales-dashboard.mjs`: added `fullWeeklyHistory` (all-channel) and `domesticFullWeeklyHistory` per SKU — both are the complete completed-week history from the SKU's first positive-sales week through the last completed week (reusing the existing `forecastCompletedHistory`/`weeklyDeltaForSkuFromSequence` full-period computation, just trimmed to start at first positive quantity instead of stripped after forecast calc). These are **display-only** fields: `weighted4CompletedWeekQty` / `stockCoverWeeks` / `previewScore` / `stockRisk` / `salesTrend` still use the original 4-week `completedWeeklyHistory` window — no Action Engine input changed.
- `public/js/reorder-monitor.js`: `DOMESTIC_FIELD_MAP` gained `fullWeeklyHistory: "domesticFullWeeklyHistory"`. `openDrawer()`'s history chart now sources from `viewField(row, "fullWeeklyHistory")`, falling back to the old 4-week `completedWeeklyHistory` for rows synced before this change (label says "최근 4주만 · 재동기화 필요" in that fallback case so it's not silently mistaken for full history). The chart's Chart.js legend is now shown (`display: true`) and the section's `<h3>` (`id="drawerHistoryTitle"`, was a static string in `public/reorder-monitor.html`) is rewritten on every drawer open to state the basis and period range explicitly, e.g. `판매추이 · 국내만(해외 제외) · 26-03W1~26-09W2 (24주, 판매 시작부터)`. The `이력 주차 수` drawer-signal line was replaced with the same start~end/count text.
- `renderForecastDetails()` gained a collapsible "계산식 보기" block spelling out, with the row's actual numbers substituted in: Base FCST = 현재 누적판매 ÷ Analog 평균 누적비중; Trend Factor = 최근 2주 평균 ÷ 최근 4주 평균; Adjusted FCST = 현재 누적판매 + (Base FCST − 현재 누적판매) × Trend Factor^α; FCST 판매율 = Adjusted FCST ÷ 입고수량. Also explicitly discloses that FCST is always computed on ERP cumulative/inbound quantities (all channels, 해외 사입 포함) and is **not** affected by the "판매 기준" toggle — a real distinction the UI didn't previously surface anywhere. No change to `scripts/forecast-v1.ts`'s actual calculation.
- Verified: `node --check scripts/sales-dashboard.mjs` and a `new Function()` parse check on `public/js/reorder-monitor.js` both pass. Not yet verified in a live browser against a fresh sync.
- Not yet done: `npm run sales:sync` (fullWeeklyHistory/domesticFullWeeklyHistory are computed at scrape time) then `npm run build`, then confirm in-browser that the drawer chart shows the full multi-week trend with a correct, updating title, and that the FCST formula block matches the numeric fields shown above it.

## Reorder Monitor overseas-sales filter (completed 2026-09-11)

- Root cause confirmed for the reorder monitor showing overseas-only/Special Market SKUs (e.g. `WA2603CRT1`, `WA2603STT2`) as `URGENT`/`CRITICAL`: the Sales Dashboard sync (`scripts/sales-dashboard.mjs`) sums cumulative/weekly sales across **all** `PDET[sku].ch` / `PDPER[period].cur[sku]` channels, and the confirmed overseas channel (`해외 사입`) was included in that sum, inflating apparent domestic sales velocity for SKUs actually sold overseas.
- Owner-confirmed via live console read (`WA2603CR12`, 2026-09-11): `PDET[sku].ch` is keyed by real channel name (백화점/대리점/면세점/직영점/아울렛/쇼핑몰/무신사/해외 사입/외부몰/자사몰). `해외 사입` quantity (240) reconciled exactly against the Sales Dashboard's own "해외 TTL" figure and the remaining 9 channels reconciled exactly against 온라인/샵인샵/리테일/기타 TTL, so `해외 사입` is the confirmed overseas channel.
- Owner decision: do not recompute `sales`/`stock`/`stockRisk`/`previewScore`/`salesTrend` (no Action Engine change). Instead add diagnostic-grade, filterable fields and a UI filter so overseas-influenced rows can be excluded from review without touching production risk logic.
- `scripts/sales-dashboard.mjs`: added `overseasCumQty`, `domesticCumQty`, `overseasCumQtyAvailable`, `overseasCumSalesSharePct`, `overseasCurrentWtdQty`, `hasOverseasSales` per SKU, derived from `PDET[sku].ch["해외 사입"]` (cumulative) and `PDPER[period].cur[sku]["해외 사입"]` (current WTD). All existing fields (`sales`, `stock`, `stockRisk`, `previewScore`, `salesTrend`, etc.) are unchanged.
- `public/reorder-monitor.html` / `public/js/reorder-monitor.js`: added a "해외 판매" filter (전체/국내만/해외 판매 있음), a "해외 판매 제외" quick-filter button, a `해외판매 N%` badge next to the product name when `hasOverseasSales` is true, and a drawer signal line showing overseas cumulative qty/share with an explicit note that the row's판매율/재고커버/Preview Score figures still include overseas sales.
- `scripts/update_latest_from_sales.py` (the offline/manual fallback sync path) was NOT touched — it has no access to Sales Dashboard channel data (reads local xlsx only), so `overseasCumQty`/`hasOverseasSales` are only populated when `scripts/sales-dashboard.mjs` (the live `npm run sales:sync` path) is the source. This is a known gap, not silently handled.
- Not yet done: `npm run sales:sync` has not been re-run against the live Sales Dashboard from this change (requires the logged-in local browser profile on the owner's machine), so `public/data/latest.json` does not yet carry the new fields. The filter renders correctly with the new fields simply absent/falsy until the next real sync. `npm run build` was not run from this session either.

## Reorder Monitor domestic sales-view toggle (completed 2026-09-14)

- Owner feedback after verifying the overseas-sales filter above: the boolean `hasOverseasSales` filter was too aggressive — all 10 URGENT rows had some overseas share (0.1%-6.9%), not just the 3 Taiwan-exclusive SKUs (100%), so excluding "any overseas sales" emptied the URGENT list entirely.
- Owner request: instead of a percentage threshold, add a "판매 기준: 전체 / 국내만(해외 제외)" toggle so every row's sales-trend numbers can be viewed either with or without `해외 사입` sales included, without dropping any row and without changing which fields are the production Action Engine inputs.
- `scripts/sales-dashboard.mjs`: refactored `weeklyDeltaForSku`/`weeklyDeltaForSkuFromSequence` to accept a `domesticOnly` flag (via new `periodSalesAndQty()` helper), and added a full parallel set of per-SKU domestic-only fields: `domesticWeeklyHistory`, `domesticCompletedWeeklyHistory`, `domesticCurrentWtdQty`, `domesticLastCompleteWeekQty`, `domesticPreviousCompleteWeekQty`, `domesticCompletedWeekWow`, `domesticAvg4CompletedWeekQty`, `domesticWeighted4CompletedWeekQty`, `domesticStockCoverWeeks`, `domesticSalesTrend`, `domesticSellThrough`, `domesticStockRisk`, `domesticPreviewScore` (the last two via their own separate per-category percentile ranking pass, mirroring the existing `previewScore` logic but scoped to domestic-only weighted velocity/sell-through/trend). The original `sales`/`stock`/`stockRisk`/`previewScore`/`salesTrend` fields are completely unchanged — this is an additive parallel field set, not a recompute.
- `domesticSellThrough` is an acknowledged approximation (`domesticCumQty / inQty * 100`) because inbound quantity (`inQty`) is not channel-split at the ERP source; this is commented in code as a known limitation, not treated as exact.
- `public/reorder-monitor.html`: added a `.sales-view-toggle` segmented button pair ("판매 기준: 전체" / "판매 기준: 국내만(해외 제외)") next to the existing 해외 판매 filter controls.
- `public/js/reorder-monitor.js`: added `state.salesView` ("all" | "domestic"), a `DOMESTIC_FIELD_MAP` lookup, and a `viewField(row, field)` helper that resolves to the `domesticXxx` field when `state.salesView === "domestic"` and that field exists, else falls back to the original field. Rewired `classifyPreview`, `getComparableValue` (sorting), `filterRows` (trend/risk/quick-filter predicates), `renderKpis` (STOCK RISK / accelerating / new-style counts), the table row template (판매율/최근완료주/직전완료주/완료주WoW/4주가중속도/현재WTD/재고커버/판매추이/STOCK RISK/Preview Score cells), and `openDrawer` (KPIs, signal list, and the Chart.js history dataset/label) to all route through `viewField()`. `가용재고` (row.stock) is intentionally left unchanged since inbound stock is not channel-split. Added `syncSalesViewToggle()` (called from `renderAll()`) to keep the toggle's visual active-state in sync with `state.salesView`, and reset `state.salesView` to `"all"` (with matching toggle visual reset) in the `resetFilters`/"초기화" handler, mirroring the existing `.group-toggle` reset pattern.
- Verified: `node --check scripts/sales-dashboard.mjs` and a `new Function()` parse check on `public/js/reorder-monitor.js` both pass. Not yet verified in a live browser against a fresh sync.
- Not yet done: `npm run sales:sync` must be re-run (the new `domesticXxx` fields are computed at scrape time, so a rebuild of `public/data/latest.json` without a fresh sync will not populate them), then `npm run build`. Until re-synced, the toggle will render with `domesticXxx` fields absent and effectively fall back to the "전체" values.

## 26FW overseas PO row applicability (completed diagnostic 2026-09-11)

- Read-only source audit completed for `발주조회(250613_커버낫소싱) 26FW 260911.xlsx`; the raw workbook remains outside Git. Structure: one sheet, 1,443 x 93, row-3 headers, `G 품번`, `J 발주번호`, `L 색상`, `BP 발주수량`, no PO-row inbound quantity, no blank/repeated-header data rows.
- PO-row keyword rule identifies 717 overseas rows / 304 SKU / 146 STYLE / 24,880 units. Exclusive counts: Taiwan 169 / 15,530, Japan 288 / 4,331, Global 260 / 5,019, ORDER_ONLY 0. `수주` overlaps 399 destination rows and is not double-counted.
- Mixed domestic+overseas: 298 SKU. Overseas-only: `WA2603CRT1BK`, `WA2603CRT1GR`, `WA2603HD11LG`, `WA2603STT1BK`, `WA2603STT1WH`, `WA2603STT2CH`.
- Current 26FW APP remains 439 SKU. The workbook contains 438; `WA2603CR16TC` is absent. All 304 affected APP SKU exactly reconcile current `orderQty` to Excel total order, proving current `orderQty` includes overseas PO.
- Domestic order exclusion is confirmed. Numeric inbound/ERP stock exclusion needs a PO-keyed receipt/stock source; domestic sales exclusion is not proven. No sales, inbound, stock, velocity, lifecycle, or cover quantity was changed.
- Production order replacement stopped: it would change 304 `orderQty` values and affect 123 current PACE_READY Analog Pace rows (118 changed indices; five overseas-only Special Market rows lose the domestic order denominator). Analog Pace methodology was not changed or recalculated.
- All five Special Market SKUs now carry separate exact-SKU `OVERSEAS_PO_CONFIRMED` evidence. Existing direct-ship statuses are retained and not inferred from the new order file.
- Added `scripts/overseas_po_applicability.py`, `data/sku-overseas-po-applicability.json`, `tests/overseas_po_applicability_test.py`, and `docs/SKU_OVERSEAS_PO_APPLICABILITY.md`; extended the Special Market evidence registry/diagnostic without changing production behavior.
- Verification: Python diagnostic suite 35/35, `npm.cmd run sku:test` 4/4, `npm.cmd run forecast:test` 6/6 plus reference validation, and build PASS.

## Git checkpoint (completed 2026-09-11)

- Created checkpoint commit `9f4948f` (`Checkpoint validated forecast and SKU diagnostics`) from 70 explicitly reviewed files covering the verified Forecast/SKU pipeline, reproducible artifacts, read-only views, tests, and documentation through 2026-09-10.
- Raw ERP Excel, `.local-*`, credentials, browser profiles, `dist`, temporary files, and Python caches were not added. The previously tracked Python cache file was removed and `__pycache__/` / `*.pyc` are now ignored.
- Three pre-existing, unrelated UI modifications remain intentionally outside the checkpoint: `index.html`, `public/js/dashboard.js`, and `public/js/data/normalize.js`. `index.html` contains widespread Korean text corruption and must be handled as a separate recovery scope.
- Corrected two documentation encoding defects without changing meaning: `oldest-to-newest` and `±1`.

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
- Planner evidence review completed in `docs/SKU_SIGNAL_V1_PLANNER_EVIDENCE_REVIEW.md`; fixed samples cover every populated lifecycle and every current conflict/data-quality marker. Verdict: PASS for an isolated read-only viewer with copy guardrails.

## Special Market / direct-ship applicability diagnostic (completed 2026-09-11)

- Added a diagnostic-only contract and reproducible artifact: `docs/SKU_SPECIAL_MARKET_APPLICABILITY_DIAGNOSTIC.md`, `scripts/sku_special_market_applicability_diagnostic.py`, `config/special-market-direct-ship-evidence.json`, and `data/sku-special-market-applicability-diagnostic.json`.
- Current metadata contains `isSpecialMarket` only. It is derived from the STYLE product-name marker `[대만]`; no direct-shipment, destination-country, logistics-route, or domestic-receipt-applicability field exists in the retained STYLE or ERP SKU snapshot.
- `isSpecialMarket=true` and direct shipment are explicitly separate. Direct-ship evidence is exact-SKU only and is not inferred from names, STYLE siblings, negative stock/cover, sales exceeding inbound, or missing domestic receipts.
- User-confirmed `WA2603CRT1BK` remains Taiwan-branch exclusive and entirely direct-shipped. The four previously unresolved SKUs are now confirmed by the exact-SKU Taiwan assignments in `26FW 해외오더 PO_유니.xlsx` plus the retained company logistics record that explicitly identifies `WA2603CRT1`, `WA2603STT1`, and `WA2603STT2` as Taiwan-exclusive direct-shipment styles.
- Exact-SKU PO cells: `WA2603CRT1GR` (`상품기획안_종합!E455,M455`; `ERP!A1102,K1102`), `WA2603STT1WH` (`E518,M518`; `A1106,K1106`), `WA2603STT1BK` (`E519,M519`; `A1105,K1105`), and `WA2603STT2CH` (`E526,M526`; `A1107,K1107`). Direct-shipment context: `teams-data-memorial-2026-09-04.md`, lines 73351-73359.
- 26FW APP remains 439 SKU: Special Market 5 SKU / 3 STYLE; confirmed direct ship 5; Special Market direct-ship `UNKNOWN` 0; market scope `UNKNOWN` 295 due missing STYLE metadata joins.
- Confirmed domestic Current Risk misclassification: all five Special Market SKUs. Their observed demand remains separate, while domestic inbound, ERP on-hand, Stock Cover, and domestic supply-risk interpretation are `NOT_APPLICABLE_CONFIRMED_DIRECT_SHIP`. The negative stock/cover pattern was not used as route evidence.
- No production risk/reorder logic, SKU Signal, threshold, priority, recommendation, Action Engine, Forecast, Analog Pace, STYLE behavior, or source snapshot was changed.
- Verification refreshed after registry/artifact regeneration: combined Python diagnostic suite 29/29, `npm.cmd run sku:test` 4/4, and `npm.cmd run forecast:test` 6/6 plus forecast reference validation; the existing openpyxl default-style warning remains non-failing.
- Next safe candidate: an isolated read-only SKU evidence viewer using the reviewed planner copy and adjacent Special Market applicability context only. No score, rank, threshold, priority, recommendation, routing, production label, or external sync.

## SKU Signal v1 planner evidence review (completed 2026-09-11)

- Reviewed a fixed 5-SKU sample covering PRE_SALE, WTD_ONLY, W1, W2-W8 and all 7 current conflict/data-quality markers. W9+ has no current row and remains synthetic-test-only.
- Evidence separation and missingness are structurally sound, but raw enums are not planner-facing copy. `PRE_SALE` must not be presented as confirmed pre-launch; use “판매 미관측 · 출시 여부 미판정”.
- Availability should render as 사용 가능 / 참고값 / 계산 불가 / 현재 단계 미적용, with concrete reasons where applicable. Raw `conflicts` enums should be translated as factual differences or out-of-window context, not errors.
- Negative ERP stock, stock cover, and remaining order remain literal source conditions, not urgency or reorder conclusions. Confirmed Taiwan direct-ship scope must appear adjacent to domestic supply facts for the five Special Market SKUs if a viewer is built.
- Verdict: PASS for a separately scoped isolated read-only viewer with copy guardrails. No state-machine schema or production behavior change was required.

## SKU Signal v1 evidence viewer (completed 2026-09-11)

- Added the isolated read-only viewer `public/sku-signal-v1-evidence.html` and `public/js/sku-signal-v1-evidence.js`, reading `public/data/sku-signal-v1-state-machine.json` and `public/data/sku-special-market-applicability-diagnostic.json` (static copies of the existing `data/` artifacts, matching the `sku-current-risk-diagnostic` pattern; no regeneration, no external sync).
- Implements the planner evidence review's copy guardrails exactly: lifecycle (`PRE_SALE` → "판매 미관측 · 출시 여부 미판정", `WTD_ONLY` → "당주 판매만 관측 · 첫 완료주 대기", `W1` → "첫 완료 판매주 · 관찰 전용", `W2-W8` → "판매 2~8주 · Early Pace 참고 가능"), availability (`AVAILABLE`→사용 가능, `DISPLAY_ONLY`→참고값, `UNAVAILABLE`/`MISSING`→계산 불가, `NOT_APPLICABLE`→현재 단계 미적용), the four conflict markers, and the three negative-value data-quality markers are all translated to the approved wording. Raw internal enum names are never rendered.
- SKU row is the primary unit. Demand, inventory (legacy and selling-age Stock Cover shown with their own velocity denominators), supply, Analog Pace (W2-W8 only), trend, and STYLE Forecast (W9+ only) facts render in separate blocks and are never blended into one score. The Special Market/direct-ship diagnostic is joined by SKU as adjacent display-only context; the five confirmed Taiwan direct-ship SKUs show their preserved negative ERP stock/cover next to "해외 직배송 확정 · 국내 재고/입고 리스크 해석 미적용" so the anomaly is not misread as a domestic supply-risk conclusion.
- Added `tests/sku-signal-v1-evidence.e2e.ts` (same Playwright pattern as `sku-current-risk-diagnostic.e2e.ts`): asserts 439 total rows, 254/254 `PRE_SALE` and 5/5 Special Market filter counts, the `WA2603CRT1BK` join (ERP stock -48, direct-ship note, negative-stock marker), and that no raw internal enum or production concept (score, priority, `reorderTiming`, P1/P2, reorder quantity) is ever rendered.
- No score, rank, priority, threshold, recommendation, reorder quantity, production label, routing, or external sync was added. No production schema, protected STYLE logic (Action Engine, P1/P2, priority, `reorderTiming`, STYLE Preview/Forecast/Stock Risk), or source data file was changed.
- Verification: user-run against the real `vinext dev` server on 2026-09-11 confirmed all four checks. `npm.cmd run build` PASS. `npm.cmd run sku:test` 4/4. `npm.cmd run forecast:test` 6/6 plus `build_forecast_reference.py --validate-only` (app 487 SKU / 222 STYLE, domesticAdultApp 462/207, cleanAnalog 348/166, 12 warnings, non-failing openpyxl default-style warning unchanged). `node tests/sku-signal-v1-evidence.e2e.ts` against `http://127.0.0.1:3000` returned `{"ok":true,"rows":439}` with zero assertion or console errors, confirming the 439-row render, the 254/5 lifecycle/Special-Market filter counts, the `WA2603CRT1BK` join, and no raw-enum/forbidden-term leakage. Cloud-side verification (a throwaway static server plus Playwright against the exact `data/` snapshot, done because `device_bash` was unreachable earlier in the session) agreed with this result before the real run confirmed it.

## domesticOrderQty field (completed 2026-09-11)

- Added diagnostic-grade `domesticOrderQty`, `overseasOrderQty`, `domesticOrderQtyAvailable`, and `domesticOrderQtySource` SKU fields in `scripts/sku-sync.ts`, joined from the existing read-only `data/sku-overseas-po-applicability.json` diagnostic. The join is explicitly scoped to 26FW APP and degrades to unavailable fields if the evidence file is absent.
- Raw `orderQty` is unchanged and remains a protected fact. Analog Pace was intentionally left untouched/HOLD by owner decision; its ORDER denominator was not recomputed, recalibrated, or changed. Forecast, Action Engine, priority, `reorderTiming`, SKU Signal v1, Current Risk, and Special Market logic/artifacts were also not changed or refreshed.
- Regenerated `data/sku-latest.json` and `public/data/sku-latest.json` from the existing local ERP snapshot `품번별 판매추이분석(주간_월) 260909.xlsx`, source-as-of `2026-09-09`, with overseas-PO evidence as-of `2026-09-11`. No external sync ran.
- Actual 586-SKU source counts: `OVERSEAS_PO_WORKBOOK_EXCLUDED` 304, `NO_OVERSEAS_PO_ROWS_IN_WORKBOOK` 134, `OVERSEAS_PO_SOURCE_MISSING_FOR_SKU` 1, `OUT_OF_EVIDENCE_SCOPE_26FW_APP_ONLY` 147. The 304 excluded rows sum to 24,880 `overseasOrderQty` units.
- Spot-check `WA2603CRT1BK`: `orderQty` 150, `overseasOrderQty` 150, `domesticOrderQty` 0, `domesticOrderQtyAvailable` true, source `OVERSEAS_PO_WORKBOOK_EXCLUDED`.
- Verification: `npm.cmd run build` PASS; `npm.cmd run sku:test` PASS 5/5 (fail 0, cancelled 0, skipped 0, todo 0); `npm.cmd run forecast:test` PASS 6/6 (fail 0, cancelled 0, skipped 0, todo 0) plus forecast reference validation `ok: true` with APP 487 SKU / 222 STYLE, domesticAdultApp 462 / 207, cleanAnalog 348 / 166, and 12 warnings. The existing non-failing openpyxl default-style warning remains unchanged.
