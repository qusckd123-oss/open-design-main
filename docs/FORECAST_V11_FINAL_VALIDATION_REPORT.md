# Forecast v1.1 Final Pre-production Audit

## Classification

This document classifies the 25FW exercise as **CALIBRATION**, not VALIDATION. The 25FW targets and their analog outcomes come from the same completed season, so analog December outcomes are hindsight information at historical W1-W8. For live 26FW production, using completed 25FW as the prior-season reference is temporally valid and is not leakage.

## Benchmark 8 STYLE

Source: `.local-forecast-reference\26FW_sales_planning_reorder_benchmark_app.json`. Exact labels: 리오더 필요 7, 차주 재검토 1. Weight grid: 203 candidates; selected W1-W6 `0.0, 0.1, 0.2, 0.3, 0.4, 0.5`.

| STYLE | 상품명 | 판단 | SW | 현재 ST | 누계 | Analog Top5 (score) | Analog share | Prior ST | Actual FCST | Blend | Trend | alpha | v1.1 ST | Conf. | Signal | Stock | Cover | Risk |
|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---|
| WA2603CD51 | 우먼스 릴리와펜 라운드넥 가디건 | 리오더 필요 | 3 | 3.6% | 230 | WA2503CD51(4.50), WA2503CD61(4.05), WA2504CD62(3.89), WA2504CD63(3.71), WA2503CD01(3.17) | 9.3% | 60.3% | 2,470 | 3,210 | - | 0.00 | 57.0% | LOW | NORMAL | 4,976 | 106.1 | LOW |
| WA2603CD52 | 우먼스 에센셜 가디건 | 차주 재검토 | 2 | 4.7% | 93 | WA2503CD51(4.11), WA2503CD61(3.91), WA2504CD62(3.80), WA2504CD63(3.60), WA2503CD01(2.95) | 5.5% | 60.3% | 1,700 | 1,210 | - | 0.00 | 63.2% | LOW | WATCH | 1,751 | 83.4 | LOW |
| WA2603CD53 | 우먼스 케이블 가디건 | 리오더 필요 | 3 | 4.2% | 257 | WA2503CD51(4.41), WA2503CD61(4.12), WA2504CD62(3.94), WA2504CD63(3.77), WA2503CD02(3.08) | 8.0% | 60.3% | 3,208 | 3,232 | - | 0.00 | 60.2% | LOW | WATCH | 4,675 | 86.4 | LOW |
| WA2603CD54 | 우먼스 도트 가디건 | 리오더 필요 | 3 | 8.0% | 65 | WA2503CD51(4.41), WA2503CD61(4.12), WA2504CD62(3.94), WA2504CD63(3.77), WA2503CD02(3.08) | 8.0% | 60.3% | 811 | 560 | - | 0.00 | 67.9% | LOW | WATCH | 716 | 52.8 | LOW |
| WA2603CD55 | 우먼스 스트라이프 가디건 | 리오더 필요 | 3 | 4.1% | 101 | WA2503CD51(4.41), WA2503CD61(4.12), WA2504CD62(3.94), WA2504CD63(3.77), WA2503CD02(3.08) | 8.0% | 60.3% | 1,261 | 1,466 | - | 0.00 | 58.3% | LOW | NORMAL | 2,395 | 112.9 | LOW |
| WA2603CD63 | 우먼스 레이스 프릴 가디건 | 리오더 필요 | 3 | 3.8% | 119 | WA2503CD51(4.27), WA2503CD61(4.26), WA2504CD62(4.05), WA2504CD63(3.89), WA2503CD01(2.93) | 9.3% | 60.3% | 1,278 | 1,716 | - | 0.00 | 56.7% | LOW | NORMAL | 1,547 | 80.9 | LOW |
| WA2603KT62 | 우먼스 케이블 오픈카라 풀오버 | 리오더 필요 | 3 | 6.0% | 418 | WA2503KT63(5.82), WA2503KT64(4.33), WA2503KT68(4.24), WA2503KT66(4.08), WA2503KT67(4.00) | 6.9% | 45.1% | 6,042 | 3,086 | - | 0.00 | 59.4% | LOW | NORMAL | 4,449 | 52.3 | LOW |
| WA2603SR61 | 우먼스 레이어드 플리츠 미니 스커트 | 리오더 필요 | 2 | 4.3% | 78 | WA2503SR75(4.34), WA2503SR61(4.26), WA2503SR62(4.26), WA2503SR63(4.01), WA2503SR76(3.94) | 18.1% | 25.3% | 431 | 250 | - | 0.00 | 27.5% | LOW | NORMAL | 738 | 44.2 | LOW |

- v1 HIGH/WATCH capture: **3/8**.
- v1.1 HIGH/WATCH capture: **3/8**.

## Miss decomposition

- **WA2603CD51 우먼스 릴리와펜 라운드넥 가디건**: Analog prior가 60.3%로 60%에 근접할 뿐 여유가 없음; actual-driven도 production denominator 기준 43.9%; W3 actual weight 0.2, trend alpha 0; 영업기획 선택 컬러 발주 2,900 대비 STYLE 순입고 5,628로 denominator가 1.94배. 60%까지 3.0%p 부족.
- **WA2603CD55 우먼스 스트라이프 가디건**: Analog prior가 60.3%로 60%에 근접할 뿐 여유가 없음; actual-driven도 production denominator 기준 50.1%; W3 actual weight 0.2, trend alpha 0; 영업기획 선택 컬러 발주 1,400 대비 STYLE 순입고 2,516로 denominator가 1.80배. 60%까지 1.7%p 부족.
- **WA2603CD63 우먼스 레이스 프릴 가디건**: Analog prior가 60.3%로 60%에 근접할 뿐 여유가 없음; actual-driven도 production denominator 기준 42.2%; W3 actual weight 0.2, trend alpha 0; 최근 완료주 +55.6% 상승이 초기 trend 미적용으로 반영되지 않음; 영업기획 선택 컬러 발주 1,900 대비 STYLE 순입고 3,027로 denominator가 1.59배. 60%까지 3.3%p 부족.
- **WA2603KT62 우먼스 케이블 오픈카라 풀오버**: Analog prior 45.1%가 기준 미만; W3 actual weight 0.2, trend alpha 0; 최근 완료주 +131.7% 상승이 초기 trend 미적용으로 반영되지 않음; 영업기획 선택 컬러 발주 3,652 대비 STYLE 순입고 5,198로 denominator가 1.42배; Top1은 케이블 오픈카라로 적합하지만 나머지 4개가 일반 풀오버라 prior 대표 판매율이 낮아짐. 60%까지 0.6%p 부족.
- **WA2603SR61 우먼스 레이어드 플리츠 미니 스커트**: Analog prior 25.3%가 기준 미만; actual-driven도 production denominator 기준 47.4%; W2 actual weight 0.1, trend alpha 0; 최근 완료주 +800.0% 상승이 초기 trend 미적용으로 반영되지 않음; 영업기획 선택 컬러 발주 800 대비 STYLE 순입고 909로 denominator가 1.14배; SR reference가 5 STYLE뿐이고 롱/카고/코듀로이 analog가 미니 플리츠 구조를 충분히 대표하지 못함. 60%까지 32.5%p 부족.

## Sales-planning forecast comparison

The benchmark forecast is color-SKU selective and uses the listed colors' order quantity. Our monitor is STYLE-wide and uses net receipts, so the denominators and included color populations are not equivalent.

| STYLE | 영업기획 판단 | 영업기획 FCST qty/ST | 우리 v1 qty/ST | 우리 v1.1 qty/ST | 영업기획>=60 & v1.1<60 | Denominator 비교 |
|---|---|---:|---:|---:|---|---|
| WA2603CD51 | 리오더 필요 | 2,017 / 69.6% | 2,470 / 43.9% | 3,210 / 57.0% | YES | 선택 컬러 발주 2,900 vs STYLE 순입고 5,628 |
| WA2603CD52 | 차주 재검토 | 1,226 / 68.1% | 1,700 / 88.8% | 1,210 / 63.2% | NO | 선택 컬러 발주 1,800 vs STYLE 순입고 1,915 |
| WA2603CD53 | 리오더 필요 | 2,311 / 82.0% | 3,208 / 59.8% | 3,232 / 60.2% | NO | 선택 컬러 발주 2,820 vs STYLE 순입고 5,368 |
| WA2603CD54 | 리오더 필요 | 557 / 69.6% | 811 / 98.3% | 560 / 67.9% | NO | 선택 컬러 발주 800 vs STYLE 순입고 825 |
| WA2603CD55 | 리오더 필요 | 967 / 69.1% | 1,261 / 50.1% | 1,466 / 58.3% | YES | 선택 컬러 발주 1,400 vs STYLE 순입고 2,516 |
| WA2603CD63 | 리오더 필요 | 1,295 / 68.2% | 1,278 / 42.2% | 1,716 / 56.7% | YES | 선택 컬러 발주 1,900 vs STYLE 순입고 3,027 |
| WA2603KT62 | 리오더 필요 | 3,015 / 82.6% | 6,042 / 116.2% | 3,086 / 59.4% | YES | 선택 컬러 발주 3,652 vs STYLE 순입고 5,198 |
| WA2603SR61 | 리오더 필요 | 278 / 34.8% | 431 / 47.4% | 250 / 27.5% | NO | 선택 컬러 발주 800 vs STYLE 순입고 909 |

Planning forecast >=60% but v1.1 <60%: **WA2603CD51, WA2603CD55, WA2603CD63, WA2603KT62**.

## W8 published-number reconciliation

| Condition | Sample | Base MdAPE/WAPE | Trend MdAPE/WAPE |
|---|---:|---:|---:|
| Current reproducible: STYLE, target excluded, Top5, mean share, alpha .75 | 165 | 22.5% / 30.8% | 19.1% / 28.6% |
| Color SKU target, STYLE analog Top5, alpha .75 | 345 | 21.8% / 31.0% | 17.8% / 28.9% |
| STYLE Top7 mean | 165 | 20.0% / 30.2% | 20.0% / 28.0% |
| STYLE Top3 median | 165 | 19.1% / 31.4% | 16.7% / 29.2% |
| STYLE Top6 median | 165 | 19.6% / 30.0% | 18.1% / 27.9% |
| Invalid self-including leakage check | 166 | 16.9% / 26.5% | 14.2% / 24.6% |
| Previously published | undocumented | 20.2% / 30.3% | 16.6% / 27.9% |

Current exact reproduction uses 165 STYLE: the 166th Clean Analog STYLE is the only SH sample and has no different-STYLE same-category analog. It uses the documented 348 SKU / 166 STYLE clean filter, 2025-12-28 horizon, Top5, mean cumulative-share aggregation, alpha .75, price-change/reorder/pre-period/low-sales/supply-constraint exclusions, MdAPE=median absolute percentage error, and WAPE=sum absolute error/sum actual. Denominator does not affect quantity MdAPE/WAPE.

Rounding the STYLE forecast to integer quantity produces 19.1% MdAPE / 28.5% WAPE, so rounding does not explain the published 16.6% / 27.9% pair.

The old pair cannot be reproduced jointly from the retained code/data. Top7 mean approximates the published base (20.0%/30.2%), Top3 median approximates only trend MdAPE (16.7%), and Top6 median reproduces only trend WAPE (27.9%). No single coherent tested condition yields 16.6% and 27.9% together. Root cause is therefore an **unpreserved experimental calculation/config provenance gap**, not a value that should be forced into the current implementation.

## Recall simulations on benchmark only

| Simulation | Captured / 8 | Interpretation |
|---|---:|---|
| Current 60% | 3 | Current v1.1 |
| Threshold 58% | 5 | Sensitivity only; no production proposal |
| Threshold 55% | 7 | Sensitivity only; no production proposal |
| Threshold 50% | 7 | Same benchmark capture as 55%; SR61 remains below |
| Analog prior floor 60% | 4 | Adds high actual-driven KT62; floor is not calibrated |
| Analog prior floor 65% | 8 | 8/8 but mechanically inflates priors; reject without broader evidence |
| Current sell-through >=4% fallback | 6 | Broad early override |
| Current sell-through >=5% fallback | 4 | Adds little |
| Completed-week WoW >=50% fallback | 6 | Captures CD63/KT62/SR61 acceleration, but two-week noise risk |
| Sales-planning trend factor >1 | 4 | External operational signal; not available as model input |
| Category peer top quartile, peer n>=4 | 3 | No incremental capture; KT/SR peer n=1 is insufficient |
| Forecast 50-60% + WoW >=50% | 5 | Captures CD63 and KT62; still misses SR61 |
| Diagnostic EARLY WATCH: Forecast >=55% OR WoW >=50% | 8 | 8/8 on this benchmark, but overfit and precision cannot be measured |

## Recommendation

- Keep Forecast HIGH and the official 60% threshold unchanged.
- Production recommendation: **PARTIAL**. The analog-prior blend is useful for stabilizing quantities, but do not replace the signal yet.
- The only defensible next experiment is a separate, non-actionable `EARLY WATCH` candidate evaluated on a broader labeled set. The 8-STYLE rule `forecast >=55% OR completed-week WoW >=50%` is a hypothesis, not an approved threshold.
- Production files changed: **NONE**.
