# Early Forecast v1.1 Back-test

## Scope and validity

- Population: 25FW Clean Analog 348 color SKU / 166 STYLE.
- Target STYLE is excluded from every category curve and Top5 analog set.
- Analog cumulative shares use the same cumulative-max monotonic correction as the v1 reference builder.
- Denominator: STYLE-level sum of the weekly RAW `입고` field, matching the production net-receipt denominator definition.
- Evaluation target: each STYLE's cumulative sales at the 2025-12-28 proxy.
- Weight search: 203 strictly increasing W1-W6 candidates; W1 actual weight capped at 0.2.
- Split: deterministic 80% calibration / 20% validation by STYLE code hash.
- Important limitation: 24FW reference is unavailable. Top analog 25FW December outcomes are therefore known only after the evaluated 25FW weeks. This is leave-one-STYLE-out cross-sectional diagnosis, not a strict point-in-time leakage-free production validation. Production promotion must remain blocked pending a prior-season or later-season out-of-time test.

## Selected weight

`W1..W6 = 0.0, 0.1, 0.2, 0.3, 0.4, 0.5`; `W7+ = 1.0` (existing actual-driven structure).

## Evaluation samples

| Metric | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Evaluated STYLE | 165 | 165 | 165 | 165 | 165 | 165 | 165 | 165 |

The Clean Analog population contains 166 STYLE, but category SH has only one STYLE. It has no same-category, different-STYLE analog and is excluded from model metrics, leaving 165 evaluated STYLE per week.

## W1-W8 MdAPE - all 166 STYLE

| Model | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A Category Curve | 82.6% | 60.2% | 48.8% | 40.9% | 39.0% | 33.9% | 29.1% | 25.1% |
| B Analog v1 (no trend) | 70.5% | 49.9% | 44.2% | 38.5% | 31.9% | 29.0% | 27.4% | 22.5% |
| B Analog v1 + Trend | 70.5% | 49.9% | 44.2% | 38.5% | 33.2% | 28.3% | 24.3% | 19.1% |
| C Blend v1.1 (no trend) | 29.7% | 30.2% | 26.9% | 27.8% | 25.6% | 23.3% | 27.4% | 22.5% |
| D Blend v1.1 + Trend | 29.7% | 30.2% | 26.9% | 27.8% | 24.6% | 23.1% | 24.3% | 19.1% |

## W1-W8 WAPE - all 166 STYLE

| Model | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A Category Curve | 91.3% | 64.5% | 52.9% | 46.6% | 43.0% | 39.8% | 35.5% | 31.9% |
| B Analog v1 (no trend) | 87.1% | 61.0% | 50.9% | 44.6% | 42.0% | 38.8% | 33.9% | 30.8% |
| B Analog v1 + Trend | 87.1% | 61.0% | 50.9% | 44.6% | 42.5% | 38.9% | 33.3% | 28.6% |
| C Blend v1.1 (no trend) | 32.5% | 32.0% | 30.4% | 28.2% | 27.2% | 26.7% | 33.9% | 30.8% |
| D Blend v1.1 + Trend | 32.5% | 32.0% | 30.4% | 28.2% | 29.6% | 26.6% | 33.3% | 28.6% |

## 60% Precision - all 166 STYLE

| Model | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A Category Curve | 33.3% | 38.2% | 59.4% | 66.7% | 63.6% | 71.0% | 77.4% | 80.0% |
| B Analog v1 (no trend) | 36.4% | 56.1% | 65.8% | 58.1% | 64.9% | 67.6% | 70.0% | 68.3% |
| B Analog v1 + Trend | 36.4% | 56.1% | 65.8% | 58.1% | 59.5% | 65.8% | 63.6% | 70.0% |
| C Blend v1.1 (no trend) | 58.8% | 70.6% | 66.7% | 86.4% | 82.6% | 83.3% | 70.0% | 68.3% |
| D Blend v1.1 + Trend | 58.8% | 70.6% | 66.7% | 86.4% | 75.0% | 80.0% | 63.6% | 70.0% |

## 60% Recall - all 166 STYLE

| Model | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A Category Curve | 35.1% | 35.1% | 51.4% | 54.1% | 56.8% | 59.5% | 64.9% | 75.7% |
| B Analog v1 (no trend) | 54.1% | 62.2% | 67.6% | 67.6% | 64.9% | 67.6% | 75.7% | 75.7% |
| B Analog v1 + Trend | 54.1% | 62.2% | 67.6% | 67.6% | 67.6% | 67.6% | 75.7% | 75.7% |
| C Blend v1.1 (no trend) | 27.0% | 32.4% | 43.2% | 51.4% | 51.4% | 54.1% | 75.7% | 75.7% |
| D Blend v1.1 + Trend | 27.0% | 32.4% | 43.2% | 51.4% | 56.8% | 54.1% | 75.7% | 75.7% |

## 60% F1 - all 166 STYLE

| Model | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A Category Curve | 34.2% | 36.6% | 55.1% | 59.7% | 60.0% | 64.7% | 70.6% | 77.8% |
| B Analog v1 (no trend) | 43.5% | 59.0% | 66.7% | 62.5% | 64.9% | 67.6% | 72.7% | 71.8% |
| B Analog v1 + Trend | 43.5% | 59.0% | 66.7% | 62.5% | 63.3% | 66.7% | 69.1% | 72.7% |
| C Blend v1.1 (no trend) | 37.0% | 44.4% | 52.5% | 64.4% | 63.3% | 65.6% | 72.7% | 71.8% |
| D Blend v1.1 + Trend | 37.0% | 44.4% | 52.5% | 64.4% | 64.6% | 64.5% | 69.1% | 72.7% |

## Holdout validation MdAPE

| Model | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A Category Curve | 83.7% | 51.2% | 34.4% | 30.8% | 28.0% | 31.8% | 32.7% | 26.4% |
| B Analog v1 (no trend) | 77.0% | 36.4% | 27.4% | 24.5% | 29.4% | 16.3% | 16.4% | 20.1% |
| B Analog v1 + Trend | 77.0% | 36.4% | 27.4% | 24.5% | 25.5% | 19.7% | 22.0% | 22.0% |
| C Blend v1.1 (no trend) | 37.7% | 37.7% | 34.5% | 28.6% | 24.1% | 22.8% | 16.4% | 20.1% |
| D Blend v1.1 + Trend | 37.7% | 37.7% | 34.5% | 28.6% | 22.4% | 21.8% | 22.0% | 22.0% |

## Holdout validation WAPE

| Model | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A Category Curve | 80.4% | 46.9% | 36.0% | 31.3% | 33.6% | 33.2% | 31.0% | 30.4% |
| B Analog v1 (no trend) | 78.6% | 60.4% | 38.4% | 34.6% | 33.5% | 31.0% | 28.4% | 29.6% |
| B Analog v1 + Trend | 78.6% | 60.4% | 38.4% | 34.6% | 34.1% | 32.8% | 30.6% | 32.2% |
| C Blend v1.1 (no trend) | 33.5% | 31.0% | 26.1% | 22.8% | 20.3% | 20.6% | 28.4% | 29.6% |
| D Blend v1.1 + Trend | 33.5% | 31.0% | 26.1% | 22.8% | 20.3% | 20.5% | 30.6% | 32.2% |

## 26FW sales-planning benchmark

Benchmark JSON: **FOUND** (`.local-forecast-reference\26FW_sales_planning_reorder_benchmark_app.json`).

| STYLE | Benchmark | SW | 현재 판매율 | Analog Top5 | Analog Prior | 기존 v1 | v1.1 | v1.1 판매율 | Confidence | Signal | Stock Cover | Stock Risk |
|---|---|---:|---:|---|---:|---:|---:|---:|---|---|---:|---|
| WA2603CD51 | 리오더 필요 | 3 | 3.6% | WA2503CD51, WA2503CD61, WA2504CD62, WA2504CD63, WA2503CD01 | 3395 | 2470 | 3210 | 57.0% | LOW | NORMAL | 106.1 | LOW |
| WA2603CD52 | 차주 재검토 | 2 | 4.7% | WA2503CD51, WA2503CD61, WA2504CD62, WA2504CD63, WA2503CD01 | 1155 | 1700 | 1210 | 63.2% | LOW | WATCH | 83.4 | LOW |
| WA2603CD53 | 리오더 필요 | 3 | 4.2% | WA2503CD51, WA2503CD61, WA2504CD62, WA2504CD63, WA2503CD02 | 3238 | 3208 | 3232 | 60.2% | LOW | WATCH | 86.4 | LOW |
| WA2603CD54 | 리오더 필요 | 3 | 8.0% | WA2503CD51, WA2503CD61, WA2504CD62, WA2504CD63, WA2503CD02 | 498 | 811 | 560 | 67.9% | LOW | WATCH | 52.8 | LOW |
| WA2603CD55 | 리오더 필요 | 3 | 4.1% | WA2503CD51, WA2503CD61, WA2504CD62, WA2504CD63, WA2503CD02 | 1518 | 1261 | 1466 | 58.3% | LOW | NORMAL | 112.9 | LOW |
| WA2603CD63 | 리오더 필요 | 3 | 3.8% | WA2503CD51, WA2503CD61, WA2504CD62, WA2504CD63, WA2503CD01 | 1826 | 1278 | 1716 | 56.7% | LOW | NORMAL | 80.9 | LOW |
| WA2603KT62 | 리오더 필요 | 3 | 6.0% | WA2503KT63, WA2503KT64, WA2503KT68, WA2503KT66, WA2503KT67 | 2346 | 6042 | 3086 | 59.4% | LOW | NORMAL | 52.3 | LOW |
| WA2603SR61 | 리오더 필요 | 2 | 4.3% | WA2503SR75, WA2503SR61, WA2503SR62, WA2503SR63, WA2503SR76 | 230 | 431 | 250 | 27.5% | LOW | NORMAL | 44.2 | LOW |

- Existing v1 HIGH+WATCH capture among listed 8 STYLE: **3/8**.
- Diagnostic v1.1 HIGH+WATCH capture among listed 8 STYLE: **3/8**.
- Benchmark decision labels parsed: **8/8**. Missing labels are not inferred from the stated 7/1 aggregate.

## Decision

- W1-W4 mean MdAPE: existing v1 + Trend **50.7%** -> v1.1 + Trend **28.7%**.
- W1-W4 mean WAPE: existing v1 + Trend **60.9%** -> v1.1 + Trend **30.8%**.
- Initial forecast stability: **개선** in this cross-sectional diagnosis. Early 60% recall falls as forecasts become more conservative, so error reduction alone is not an approval criterion.
- Threshold, confidence, production formula, `latest.json`, Stock Risk, Preview, and Action Engine were not changed.
- Production v1.1 recommendation: **추가검증**. The benchmark JSON and an out-of-time reference are required before promotion.
