import argparse
import copy
import json
import statistics
import sys
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import backtest_early_forecast_v11 as bt  # noqa: E402


def pct(value):
    return "-" if value is None else f"{value * 100:.1f}%"


def qty(value):
    return "-" if value is None else f"{value:,.0f}"


def load_inputs():
    config = json.loads(bt.CONFIG_PATH.read_text(encoding="utf-8"))
    benchmark = json.loads(bt.BENCHMARK_PATH.read_text(encoding="utf-8"))
    latest = json.loads(bt.LATEST_PATH.read_text(encoding="utf-8"))
    styles = bt.load_clean_styles(config)
    cases = bt.build_cases(styles, config)
    weights, grid_count = bt.select_weights(cases, config)
    bt.add_blend_predictions(cases, weights, config)
    return config, benchmark, latest, styles, cases, weights, grid_count


def benchmark_aggregates(benchmark):
    summary = {row["style"]: row for row in benchmark["styleSummary"]}
    sku_rows = defaultdict(list)
    for row in benchmark["skuDecisions"]:
        sku_rows[row["style"]].append(row)
    result = {}
    for style_code in bt.BENCHMARK_STYLES:
        rows = sku_rows[style_code]
        order_qty = sum(bt.number(row.get("orderQty")) for row in rows)
        forecast_qty = sum(bt.number(row.get("salesFcstTo1231")) for row in rows)
        sales_qty = sum(bt.number(row.get("salesQty")) for row in rows)
        result[style_code] = {
            "name": summary[style_code]["name"],
            "decision": summary[style_code]["status"],
            "orderQty": order_qty,
            "salesQty": sales_qty,
            "forecastQty": forecast_qty,
            "forecastSellThrough": forecast_qty / order_qty if order_qty else None,
            "planningTrendFactor": max(bt.number(row.get("trendFactor")) for row in rows),
            "colors": [row["sku"] for row in rows],
        }
    decisions = [row["decision"] for row in result.values()]
    if decisions.count("리오더 필요") != 7 or decisions.count("차주 재검토") != 1:
        raise ValueError(f"Unexpected benchmark decision distribution: {decisions}")
    return result


def benchmark_details(config, benchmark, latest, reference_styles, weights):
    planning = benchmark_aggregates(benchmark)
    by_code = {row["sku"]: row for row in latest["styles"]}
    ref_by_code = {row["styleCode"]: row for row in reference_styles}
    details = []
    for style_code in bt.BENCHMARK_STYLES:
        row = by_code[style_code]
        forecast = row["forecastV1"]
        analog_entries = forecast["analogStyles"]
        analogs = [ref_by_code[item.get("styleCode") or item.get("sku")] for item in analog_entries]
        prior_rate = statistics.median(analog["finalSellThrough"] for analog in analogs)
        prior_qty = bt.number(row["inQty"]) * prior_rate
        week = int(forecast["sellingWeekNumber"])
        weight = weights[week - 1] if week <= 6 else 1.0
        current = bt.number(forecast["currentCumulativeSales"])
        actual_driven = bt.number(forecast["baseForecastQty"])
        blend = max(current, prior_qty * (1 - weight) + actual_driven * weight)
        alpha = bt.number(forecast["trendAlpha"])
        factor = forecast.get("trendFactor")
        adjusted = blend if alpha == 0 or factor is None else max(current, current + (blend - current) * bt.number(factor) ** alpha)
        forecast_st = adjusted / bt.number(row["inQty"])
        confidence = forecast["forecastConfidence"]
        signal = "HIGH" if forecast_st >= 0.6 and bt.confidence_at_least_mid(confidence) else "WATCH" if forecast_st >= 0.6 else "NORMAL"
        group = [
            candidate for candidate in latest["styles"]
            if candidate.get("season") == "26FW"
            and candidate.get("productGroup") == "APP"
            and not candidate.get("isSpecialMarket")
            and candidate.get("category") == row["category"]
            and (candidate.get("forecastV1") or {}).get("sellingWeekNumber") == week
            and bt.number(candidate.get("inQty")) > 0
        ]
        pace = bt.number(row["cumQty"]) / bt.number(row["inQty"])
        percentile = sum(bt.number(candidate["cumQty"]) / bt.number(candidate["inQty"]) <= pace for candidate in group) / len(group)
        details.append({
            "styleCode": style_code, "name": row["name"], "decision": planning[style_code]["decision"],
            "week": week, "currentSellThrough": bt.number(row.get("sellThrough")) / 100, "currentCumulative": current,
            "analogs": [{"styleCode": item.get("styleCode") or item.get("sku"), "name": item["name"], "score": item["similarityScore"]} for item in analog_entries],
            "analogShare": forecast["analogCumulativeShare"], "analogPriorRate": prior_rate,
            "analogPriorQty": prior_qty, "actualDriven": actual_driven, "weight": weight,
            "blend": blend, "trendFactor": factor, "trendAlpha": alpha, "v11": adjusted,
            "forecastSellThrough": forecast_st, "confidence": confidence, "signal": signal,
            "v1Qty": forecast["adjustedForecastQty"], "v1SellThrough": forecast["forecastSellThrough"], "v1Signal": forecast["forecastSignal"],
            "stock": row["stock"], "stockCover": row["stockCoverWeeks"], "stockRisk": row["stockRisk"],
            "completedWeekWow": row.get("completedWeekWow"), "peerPercentile": percentile, "peerCount": len(group),
            **{f"planning{key[0].upper()}{key[1:]}": value for key, value in planning[style_code].items()},
        })
    return details


def miss_reason(row):
    gap = 0.6 - row["forecastSellThrough"]
    parts = []
    if row["analogPriorRate"] < 0.6:
        parts.append(f"Analog prior {pct(row['analogPriorRate'])}가 기준 미만")
    elif row["analogPriorRate"] < 0.62:
        parts.append(f"Analog prior가 {pct(row['analogPriorRate'])}로 60%에 근접할 뿐 여유가 없음")
    production_actual_rate = row["actualDriven"] / (row["analogPriorQty"] / row["analogPriorRate"])
    if production_actual_rate < 0.6:
        parts.append(f"actual-driven도 production denominator 기준 {pct(production_actual_rate)}")
    if row["week"] <= 3:
        parts.append(f"W{row['week']} actual weight {row['weight']:.1f}, trend alpha 0")
    if row["completedWeekWow"] is not None and row["completedWeekWow"] >= 50:
        parts.append(f"최근 완료주 +{row['completedWeekWow']:.1f}% 상승이 초기 trend 미적용으로 반영되지 않음")
    if row["planningOrderQty"] < row["analogPriorQty"] / row["analogPriorRate"]:
        production_denominator = row["analogPriorQty"] / row["analogPriorRate"]
        parts.append(f"영업기획 선택 컬러 발주 {qty(row['planningOrderQty'])} 대비 STYLE 순입고 {qty(production_denominator)}로 denominator가 {production_denominator / row['planningOrderQty']:.2f}배")
    if row["styleCode"] == "WA2603KT62":
        parts.append("Top1은 케이블 오픈카라로 적합하지만 나머지 4개가 일반 풀오버라 prior 대표 판매율이 낮아짐")
    if row["styleCode"] == "WA2603SR61":
        parts.append("SR reference가 5 STYLE뿐이고 롱/카고/코듀로이 analog가 미니 플리츠 구조를 충분히 대표하지 못함")
    return "; ".join(parts) + f". 60%까지 {gap * 100:.1f}%p 부족."


def simulate(details):
    def count(rule):
        return sum(row["forecastSellThrough"] >= 0.6 or rule(row) for row in details)
    threshold = {level: sum(row["forecastSellThrough"] >= level for row in details) for level in (0.60, 0.58, 0.55, 0.50)}
    floors = {}
    for floor in (0.60, 0.65, 0.70):
        caught = 0
        for row in details:
            denominator = row["analogPriorQty"] / row["analogPriorRate"]
            prior = denominator * max(row["analogPriorRate"], floor)
            forecast = prior * (1 - row["weight"]) + row["actualDriven"] * row["weight"]
            caught += forecast / denominator >= 0.6
        floors[floor] = caught
    return {
        "threshold": threshold,
        "priorFloor": floors,
        "currentSt4": count(lambda row: row["currentSellThrough"] >= 0.04),
        "currentSt5": count(lambda row: row["currentSellThrough"] >= 0.05),
        "velocity50": count(lambda row: bt.number(row["completedWeekWow"]) >= 50),
        "planningTrend": count(lambda row: row["planningPlanningTrendFactor"] > 1),
        "peerTopQuartile": count(lambda row: row["peerCount"] >= 4 and row["peerPercentile"] >= 0.75),
        "forecast50Velocity": count(lambda row: row["forecastSellThrough"] >= 0.50 and bt.number(row["completedWeekWow"]) >= 50),
        "earlyWatchComposite": count(lambda row: row["forecastSellThrough"] >= 0.55 or bt.number(row["completedWeekWow"]) >= 50),
    }


def style_w8_variant(styles, config, top_n=5, aggregation="mean", alpha=0.75, include_target=False):
    local = copy.deepcopy(config)
    local["similarity"]["topN"] = top_n
    rows = []
    for target in styles:
        candidates = sorted(
            (row for row in styles if row["category"] == target["category"] and (include_target or row["styleCode"] != target["styleCode"])),
            key=lambda row: (-bt.similarity(target, row, local), row["styleCode"]),
        )[:top_n]
        if not candidates or len(target["weekly"]) < 8:
            continue
        shares = [bt.share_at(row, 8) for row in candidates if bt.share_at(row, 8) > 0]
        aggregate = statistics.mean(shares) if aggregation == "mean" else statistics.median(shares)
        current = target["weekly"][7]["cumulative"]
        base = current / aggregate
        quantities = [row["quantity"] for row in target["weekly"][:8]][-4:]
        average4 = sum(quantities) / 4
        factor = min(1.5, max(0, (sum(quantities[-2:]) / 2) / average4)) if average4 else 1
        trend = current + (base - current) * factor ** alpha
        rows.append({"actual": target["finalQty"], "denominator": target["denominator"], "base": base, "trend": trend})
    return bt.metrics(rows, "base"), bt.metrics(rows, "trend")


def sku_w8_variant(config, styles):
    clean_rows, week_columns, december_column = bt.load_clean_rows(config)
    by_style = {row["styleCode"]: row for row in styles}
    rows = []
    for raw in clean_rows:
        target = by_style[bt.text(raw[0])]
        analogs = bt.analogs_for(target, styles, config)
        shares = [bt.share_at(row, 8) for row in analogs if bt.share_at(row, 8) > 0]
        selling = []
        started = False
        for column, period_date in week_columns:
            if period_date > config["cleanAnalog"]["decemberProxyDate"]:
                break
            period_qty = bt.number(raw[column])
            started = started or period_qty > 0
            if started:
                selling.append((period_qty, bt.number(raw[column + 1])))
        if not shares or len(selling) < 8:
            continue
        current = selling[7][1]
        base = current / statistics.mean(shares)
        last4 = [row[0] for row in selling[:8]][-4:]
        average4 = sum(last4) / 4
        factor = min(1.5, max(0, (sum(last4[-2:]) / 2) / average4)) if average4 else 1
        rows.append({
            "actual": bt.number(raw[december_column + 1]), "denominator": bt.number(raw[9]),
            "base": base, "trend": current + (base - current) * factor ** 0.75,
        })
    return bt.metrics(rows, "base"), bt.metrics(rows, "trend")


def render(details, simulations, config, styles, weights, grid_count):
    detail_lines = [
        "| STYLE | 상품명 | 판단 | SW | 현재 ST | 누계 | Analog Top5 (score) | Analog share | Prior ST | Actual FCST | Blend | Trend | alpha | v1.1 ST | Conf. | Signal | Stock | Cover | Risk |",
        "|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---|",
    ]
    planning_lines = [
        "| STYLE | 영업기획 판단 | 영업기획 FCST qty/ST | 우리 v1 qty/ST | 우리 v1.1 qty/ST | 영업기획>=60 & v1.1<60 | Denominator 비교 |",
        "|---|---|---:|---:|---:|---|---|",
    ]
    for row in details:
        analog_text = ", ".join(f"{item['styleCode']}({item['score']:.2f})" for item in row["analogs"])
        detail_lines.append(
            f"| {row['styleCode']} | {row['name']} | {row['decision']} | {row['week']} | {pct(row['currentSellThrough'])} | {qty(row['currentCumulative'])} | {analog_text} | "
            f"{pct(row['analogShare'])} | {pct(row['analogPriorRate'])} | {qty(row['actualDriven'])} | {qty(row['blend'])} | {row['trendFactor'] if row['trendFactor'] is not None else '-'} | "
            f"{row['trendAlpha']:.2f} | {pct(row['forecastSellThrough'])} | {row['confidence']} | {row['signal']} | {qty(row['stock'])} | {row['stockCover']:.1f} | {row['stockRisk']} |"
        )
        production_denominator = row["analogPriorQty"] / row["analogPriorRate"]
        planning_lines.append(
            f"| {row['styleCode']} | {row['decision']} | {qty(row['planningForecastQty'])} / {pct(row['planningForecastSellThrough'])} | "
            f"{qty(row['v1Qty'])} / {pct(row['v1SellThrough'])} | {qty(row['v11'])} / {pct(row['forecastSellThrough'])} | "
            f"{'YES' if row['planningForecastSellThrough'] >= 0.6 and row['forecastSellThrough'] < 0.6 else 'NO'} | 선택 컬러 발주 {qty(row['planningOrderQty'])} vs STYLE 순입고 {qty(production_denominator)} |"
        )
    misses = [row for row in details if row["signal"] == "NORMAL"]
    current_base, current_trend = style_w8_variant(styles, config)
    top7_base, top7_trend = style_w8_variant(styles, config, top_n=7)
    top3_median_base, top3_median_trend = style_w8_variant(styles, config, top_n=3, aggregation="median")
    top6_median_base, top6_median_trend = style_w8_variant(styles, config, top_n=6, aggregation="median")
    leaked_base, leaked_trend = style_w8_variant(styles, config, include_target=True)
    sku_base, sku_trend = sku_w8_variant(config, styles)
    v1_capture = sum(row["v1Signal"] in ("HIGH", "WATCH") for row in details)
    v11_capture = sum(row["signal"] in ("HIGH", "WATCH") for row in details)
    return f"""# Forecast v1.1 Final Pre-production Audit

## Classification

This document classifies the 25FW exercise as **CALIBRATION**, not VALIDATION. The 25FW targets and their analog outcomes come from the same completed season, so analog December outcomes are hindsight information at historical W1-W8. For live 26FW production, using completed 25FW as the prior-season reference is temporally valid and is not leakage.

## Benchmark 8 STYLE

Source: `{bt.BENCHMARK_PATH.relative_to(ROOT)}`. Exact labels: 리오더 필요 7, 차주 재검토 1. Weight grid: {grid_count} candidates; selected W1-W6 `{', '.join(f'{value:.1f}' for value in weights)}`.

{chr(10).join(detail_lines)}

- v1 HIGH/WATCH capture: **{v1_capture}/8**.
- v1.1 HIGH/WATCH capture: **{v11_capture}/8**.

## Miss decomposition

{chr(10).join(f"- **{row['styleCode']} {row['name']}**: {miss_reason(row)}" for row in misses)}

## Sales-planning forecast comparison

The benchmark forecast is color-SKU selective and uses the listed colors' order quantity. Our monitor is STYLE-wide and uses net receipts, so the denominators and included color populations are not equivalent.

{chr(10).join(planning_lines)}

Planning forecast >=60% but v1.1 <60%: **{', '.join(row['styleCode'] for row in details if row['planningForecastSellThrough'] >= 0.6 and row['forecastSellThrough'] < 0.6)}**.

## W8 published-number reconciliation

| Condition | Sample | Base MdAPE/WAPE | Trend MdAPE/WAPE |
|---|---:|---:|---:|
| Current reproducible: STYLE, target excluded, Top5, mean share, alpha .75 | {current_trend['n']} | {pct(current_base['mdape'])} / {pct(current_base['wape'])} | {pct(current_trend['mdape'])} / {pct(current_trend['wape'])} |
| Color SKU target, STYLE analog Top5, alpha .75 | {sku_trend['n']} | {pct(sku_base['mdape'])} / {pct(sku_base['wape'])} | {pct(sku_trend['mdape'])} / {pct(sku_trend['wape'])} |
| STYLE Top7 mean | {top7_trend['n']} | {pct(top7_base['mdape'])} / {pct(top7_base['wape'])} | {pct(top7_trend['mdape'])} / {pct(top7_trend['wape'])} |
| STYLE Top3 median | {top3_median_trend['n']} | {pct(top3_median_base['mdape'])} / {pct(top3_median_base['wape'])} | {pct(top3_median_trend['mdape'])} / {pct(top3_median_trend['wape'])} |
| STYLE Top6 median | {top6_median_trend['n']} | {pct(top6_median_base['mdape'])} / {pct(top6_median_base['wape'])} | {pct(top6_median_trend['mdape'])} / {pct(top6_median_trend['wape'])} |
| Invalid self-including leakage check | {leaked_trend['n']} | {pct(leaked_base['mdape'])} / {pct(leaked_base['wape'])} | {pct(leaked_trend['mdape'])} / {pct(leaked_trend['wape'])} |
| Previously published | undocumented | 20.2% / 30.3% | 16.6% / 27.9% |

Current exact reproduction uses 165 STYLE: the 166th Clean Analog STYLE is the only SH sample and has no different-STYLE same-category analog. It uses the documented 348 SKU / 166 STYLE clean filter, 2025-12-28 horizon, Top5, mean cumulative-share aggregation, alpha .75, price-change/reorder/pre-period/low-sales/supply-constraint exclusions, MdAPE=median absolute percentage error, and WAPE=sum absolute error/sum actual. Denominator does not affect quantity MdAPE/WAPE.

Rounding the STYLE forecast to integer quantity produces 19.1% MdAPE / 28.5% WAPE, so rounding does not explain the published 16.6% / 27.9% pair.

The old pair cannot be reproduced jointly from the retained code/data. Top7 mean approximates the published base (20.0%/30.2%), Top3 median approximates only trend MdAPE (16.7%), and Top6 median reproduces only trend WAPE (27.9%). No single coherent tested condition yields 16.6% and 27.9% together. Root cause is therefore an **unpreserved experimental calculation/config provenance gap**, not a value that should be forced into the current implementation.

## Recall simulations on benchmark only

| Simulation | Captured / 8 | Interpretation |
|---|---:|---|
| Current 60% | {simulations['threshold'][0.60]} | Current v1.1 |
| Threshold 58% | {simulations['threshold'][0.58]} | Sensitivity only; no production proposal |
| Threshold 55% | {simulations['threshold'][0.55]} | Sensitivity only; no production proposal |
| Threshold 50% | {simulations['threshold'][0.50]} | Same benchmark capture as 55%; SR61 remains below |
| Analog prior floor 60% | {simulations['priorFloor'][0.60]} | Adds high actual-driven KT62; floor is not calibrated |
| Analog prior floor 65% | {simulations['priorFloor'][0.65]} | 8/8 but mechanically inflates priors; reject without broader evidence |
| Current sell-through >=4% fallback | {simulations['currentSt4']} | Broad early override |
| Current sell-through >=5% fallback | {simulations['currentSt5']} | Adds little |
| Completed-week WoW >=50% fallback | {simulations['velocity50']} | Captures CD63/KT62/SR61 acceleration, but two-week noise risk |
| Sales-planning trend factor >1 | {simulations['planningTrend']} | External operational signal; not available as model input |
| Category peer top quartile, peer n>=4 | {simulations['peerTopQuartile']} | No incremental capture; KT/SR peer n=1 is insufficient |
| Forecast 50-60% + WoW >=50% | {simulations['forecast50Velocity']} | Captures CD63 and KT62; still misses SR61 |
| Diagnostic EARLY WATCH: Forecast >=55% OR WoW >=50% | {simulations['earlyWatchComposite']} | 8/8 on this benchmark, but overfit and precision cannot be measured |

## Recommendation

- Keep Forecast HIGH and the official 60% threshold unchanged.
- Production recommendation: **PARTIAL**. The analog-prior blend is useful for stabilizing quantities, but do not replace the signal yet.
- The only defensible next experiment is a separate, non-actionable `EARLY WATCH` candidate evaluated on a broader labeled set. The 8-STYLE rule `forecast >=55% OR completed-week WoW >=50%` is a hypothesis, not an approved threshold.
- Production files changed: **NONE**.
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="docs/FORECAST_V11_FINAL_VALIDATION_REPORT.md")
    args = parser.parse_args()
    config, benchmark, latest, styles, cases, weights, grid_count = load_inputs()
    details = benchmark_details(config, benchmark, latest, styles, weights)
    simulations = simulate(details)
    report = render(details, simulations, config, styles, weights, grid_count)
    output = ROOT / args.output
    output.write_text(report, encoding="utf-8")
    print(json.dumps({
        "ok": True, "benchmarkStyles": len(details), "v1Capture": sum(row["v1Signal"] in ("HIGH", "WATCH") for row in details),
        "v11Capture": sum(row["signal"] in ("HIGH", "WATCH") for row in details), "output": str(output),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
