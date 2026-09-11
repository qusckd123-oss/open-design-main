import argparse
import json
import re
import statistics
import zlib
from collections import defaultdict
from datetime import date, datetime
from itertools import combinations
from pathlib import Path

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "forecast-v1.json"
SOURCE_DIR = ROOT / ".local-forecast-reference"
LATEST_PATH = ROOT / "data" / "latest.json"
BENCHMARK_PATH = SOURCE_DIR / "26FW_sales_planning_reorder_benchmark_app.json"
BENCHMARK_STYLES = [
    "WA2603CD51", "WA2603CD52", "WA2603CD53", "WA2603CD54",
    "WA2603CD55", "WA2603CD63", "WA2603KT62", "WA2603SR61",
]


def text(value):
    return str(value or "").strip()


def number(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def iso_date(value):
    if isinstance(value, (date, datetime)):
        return value.date().isoformat() if isinstance(value, datetime) else value.isoformat()
    return text(value)[:10]


def style_category(style_code):
    match = re.match(r"^WA\d{4}([A-Z]{2})", text(style_code))
    return match.group(1) if match else ""


def gender_group(name):
    normalized = text(name).upper()
    return "WOMENS" if "우먼스" in normalized or "WOMEN" in normalized else "UNISEX"


def load_rows(path):
    workbook = load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    dates = [iso_date(cell.value) if cell.value is not None else "" for cell in sheet[1]]
    headers = [text(cell.value) for cell in sheet[2]]
    rows = list(sheet.iter_rows(min_row=3, values_only=True))
    workbook.close()
    return dates, headers, rows


def load_clean_rows(config):
    weekly_path = SOURCE_DIR / config["sourceFiles"]["weeklySales"]
    inbound_path = SOURCE_DIR / config["sourceFiles"]["inbound"]
    dates, _, source_rows = load_rows(weekly_path)
    _, inbound_headers, inbound_rows = load_rows(inbound_path)
    week_columns = [(index, value) for index, value in enumerate(dates) if re.match(r"^\d{4}-\d{2}-\d{2}$", value)]
    december_date = config["cleanAnalog"]["decemberProxyDate"]
    december_column = next(index for index, value in week_columns if value == december_date)
    clean = config["cleanAnalog"]
    app_categories = set(config["appCategories"])
    app_rows = [row for row in source_rows if style_category(row[0]) in app_categories]
    domestic = [
        row for row in app_rows
        if not any(marker.upper() in text(row[1]).upper() for marker in clean["specialMarketMarkers"])
        and not any(marker.upper() in text(row[1]).upper() for marker in clean["nonAdultMarkers"])
    ]
    inbound_index = {name: index for index, name in enumerate(inbound_headers)}
    reorder_skus = {
        (text(row[inbound_index["품번"]]), text(row[inbound_index["색상"]]))
        for row in inbound_rows if number(row[inbound_index["차수"]]) >= 2
    }
    filtered = []
    for row in domestic:
        if number(row[4]) != number(row[5]):
            continue
        if (text(row[0]), text(row[2])) in reorder_skus:
            continue
        first_column = week_columns[0][0]
        if number(row[first_column + 1]) > number(row[first_column]):
            continue
        if number(row[december_column + 1]) < number(clean["minimumDecemberCumulativeSales"]):
            continue
        filtered.append(row)
    constrained = {
        text(row[0]) for row in filtered
        if number(row[8]) > 0 and number(row[9]) / number(row[8]) < number(clean["minimumReceiptToOrderRatio"])
    }
    clean_rows = [row for row in filtered if text(row[0]) not in constrained]
    return clean_rows, week_columns, december_column


def load_clean_styles(config):
    clean_rows, week_columns, december_column = load_clean_rows(config)
    december_date = config["cleanAnalog"]["decemberProxyDate"]
    by_style = defaultdict(list)
    for row in clean_rows:
        by_style[text(row[0])].append(row)

    styles = []
    for style_code, rows in sorted(by_style.items()):
        final_qty = sum(number(row[december_column + 1]) for row in rows)
        denominator = sum(number(row[9]) for row in rows)  # weekly RAW header: 입고 (net receipt)
        first_positive = None
        weekly = []
        corrected_cumulative = 0.0
        for sequence_index, (column, period_date) in enumerate(week_columns):
            if period_date > december_date:
                break
            period_qty = sum(number(row[column]) for row in rows)
            if first_positive is None and period_qty > 0:
                first_positive = sequence_index
            if first_positive is not None and sequence_index >= first_positive:
                cumulative = sum(number(row[column + 1]) for row in rows)
                corrected_cumulative = max(corrected_cumulative, cumulative)
                weekly.append({
                    "period": period_date,
                    "quantity": period_qty,
                    "cumulative": cumulative,
                    "curveCumulative": corrected_cumulative,
                })
        if first_positive is None or denominator <= 0 or final_qty <= 0:
            continue
        first_date = datetime.fromisoformat(week_columns[first_positive][1])
        styles.append({
            "styleCode": style_code,
            "name": text(rows[0][1]),
            "category": style_category(style_code),
            "genderGroup": gender_group(rows[0][1]),
            "price": number(rows[0][5]),
            "launchTimingIndex": first_date.month * 5 + ((first_date.day - 1) // 7 + 1),
            "denominator": denominator,
            "finalQty": final_qty,
            "finalSellThrough": final_qty / denominator,
            "weekly": weekly,
        })
    if len(clean_rows) != 348 or len(styles) != 166:
        raise ValueError(f"Clean Analog mismatch: {len(clean_rows)} SKU / {len(styles)} STYLE")
    return styles


def keywords_for(name, dictionary):
    normalized = re.sub(r"\s+", "", text(name)).upper()
    return [keyword for keyword in dictionary if re.sub(r"\s+", "", keyword).upper() in normalized]


def similarity(target, analog, config):
    similarity_config = config["similarity"]
    target_keywords = set(keywords_for(target["name"], config["keywords"]))
    common = sum(1 for keyword in keywords_for(analog["name"], config["keywords"]) if keyword in target_keywords)
    keyword_score = min(similarity_config["maxKeywordContribution"], common * similarity_config["nameStructuralKeywordWeight"])
    gender_score = similarity_config["sameGenderBonus"] if target["genderGroup"] == analog["genderGroup"] else 0
    timing_distance = abs(target["launchTimingIndex"] - analog["launchTimingIndex"])
    timing_score = max(0, 1 - timing_distance / similarity_config["launchTimingWindowWeeks"]) * similarity_config["launchTimingBonusMax"]
    high_price = max(target["price"], analog["price"])
    price_score = max(0, 1 - abs(target["price"] - analog["price"]) / high_price) * similarity_config["priceSimilarityBonusMax"] if high_price else 0
    return keyword_score + gender_score + timing_score + price_score


def analogs_for(target, styles, config):
    return sorted(
        (row for row in styles if row["category"] == target["category"] and row["styleCode"] != target["styleCode"]),
        key=lambda row: (-similarity(target, row, config), row["styleCode"]),
    )[:config["similarity"]["topN"]]


def share_at(style, week):
    index = min(week, len(style["weekly"])) - 1
    return style["weekly"][index]["curveCumulative"] / style["finalQty"] if index >= 0 else 0


def trend_alpha(week, config):
    alpha = config["forecast"]["trendAlpha"]
    if week <= 4:
        return alpha["W1_W4"]
    if week <= 6:
        return alpha["W5_W6"]
    if week == 7:
        return alpha["W7"]
    return alpha["W8_PLUS"]


def apply_trend(current, forecast, quantities, week, config):
    alpha = trend_alpha(week, config)
    if alpha == 0 or len(quantities) < 4:
        return max(current, forecast)
    last4 = quantities[-4:]
    average4 = sum(last4) / 4
    average2 = sum(last4[-2:]) / 2
    factor = min(config["forecast"]["maximumTrendFactor"], max(0, average2 / average4)) if average4 > 0 else 1
    return max(current, current + (forecast - current) * (factor ** alpha))


def build_cases(styles, config):
    cases = []
    for target in styles:
        analogs = analogs_for(target, styles, config)
        category_peers = [row for row in styles if row["category"] == target["category"] and row["styleCode"] != target["styleCode"]]
        if any(row["styleCode"] == target["styleCode"] for row in analogs + category_peers):
            raise AssertionError(f"target leakage: {target['styleCode']}")
        for week in range(1, 9):
            if len(target["weekly"]) < week:
                continue
            current = target["weekly"][week - 1]["cumulative"]
            analog_shares = [share_at(row, week) for row in analogs if share_at(row, week) > 0]
            category_shares = [share_at(row, week) for row in category_peers if share_at(row, week) > 0]
            if not analog_shares or not category_shares:
                continue
            analog_prior = target["denominator"] * statistics.median(row["finalSellThrough"] for row in analogs)
            actual_driven = current / statistics.mean(analog_shares)
            category_forecast = current / statistics.mean(category_shares)
            quantities = [row["quantity"] for row in target["weekly"][:week]]
            cases.append({
                "styleCode": target["styleCode"], "week": week, "actual": target["finalQty"],
                "denominator": target["denominator"], "current": current, "analogPrior": analog_prior,
                "category": max(current, category_forecast), "analog": max(current, actual_driven),
                "analogTrend": apply_trend(current, actual_driven, quantities, week, config),
                "quantities": quantities,
            })
    return cases


def metrics(rows, prediction):
    if not rows:
        return {"n": 0, "mdape": None, "wape": None, "precision": None, "recall": None, "f1": None}
    errors = [abs(row[prediction] - row["actual"]) for row in rows]
    apes = [error / row["actual"] for row, error in zip(rows, errors) if row["actual"] > 0]
    tp = fp = fn = 0
    for row in rows:
        predicted = row[prediction] / row["denominator"] >= 0.60
        actual = row["actual"] / row["denominator"] >= 0.60
        tp += predicted and actual
        fp += predicted and not actual
        fn += (not predicted) and actual
    precision = tp / (tp + fp) if tp + fp else 0
    recall = tp / (tp + fn) if tp + fn else 0
    return {
        "n": len(rows), "mdape": statistics.median(apes), "wape": sum(errors) / sum(row["actual"] for row in rows),
        "precision": precision, "recall": recall,
        "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0,
    }


def add_blend_predictions(cases, weights, config):
    for row in cases:
        weight = weights[row["week"] - 1] if row["week"] <= 6 else 1.0
        blend = row["analogPrior"] * (1 - weight) + row["analog"] * weight
        row["blend"] = max(row["current"], blend)
        row["blendTrend"] = apply_trend(row["current"], blend, row["quantities"], row["week"], config)


def select_weights(cases, config):
    calibration = [row for row in cases if zlib.crc32(row["styleCode"].encode()) % 5 != 0]
    levels = [index / 10 for index in range(10)]
    candidates = [weights for weights in combinations(levels, 6) if weights[0] <= 0.2]
    baseline = {week: metrics([row for row in calibration if row["week"] == week], "analog") for week in range(1, 7)}
    best = None
    for weights in candidates:
        add_blend_predictions(calibration, weights, config)
        by_week = {week: metrics([row for row in calibration if row["week"] == week], "blend") for week in range(1, 7)}
        early_loss = statistics.mean(by_week[week][metric] for week in range(1, 5) for metric in ("mdape", "wape"))
        damage = sum(max(0, by_week[week][metric] - baseline[week][metric] - 0.02) for week in range(4, 7) for metric in ("mdape", "wape"))
        score = early_loss + 10 * damage
        candidate = (score, early_loss, weights)
        if best is None or candidate < best:
            best = candidate
    return list(best[2]), len(candidates)


def pct(value):
    return "-" if value is None else f"{value * 100:.1f}%"


def model_table(cases, models, field):
    lines = ["| Model | " + " | ".join(f"W{week}" for week in range(1, 9)) + " |", "|---|" + "---:|" * 8]
    for name, key in models:
        values = [metrics([row for row in cases if row["week"] == week], key)[field] for week in range(1, 9)]
        lines.append(f"| {name} | " + " | ".join(pct(value) for value in values) + " |")
    return "\n".join(lines)


def sample_table(cases):
    counts = [len([row for row in cases if row["week"] == week]) for week in range(1, 9)]
    return "| Metric | " + " | ".join(f"W{week}" for week in range(1, 9)) + " |\n|---|" + "---:|" * 8 + "\n| Evaluated STYLE | " + " | ".join(map(str, counts)) + " |"


def early_stability(cases):
    baseline = [metrics([row for row in cases if row["week"] == week], "analogTrend") for week in range(1, 5)]
    candidate = [metrics([row for row in cases if row["week"] == week], "blendTrend") for week in range(1, 5)]
    baseline_mdape = statistics.mean(row["mdape"] for row in baseline)
    candidate_mdape = statistics.mean(row["mdape"] for row in candidate)
    baseline_wape = statistics.mean(row["wape"] for row in baseline)
    candidate_wape = statistics.mean(row["wape"] for row in candidate)
    return baseline_mdape, candidate_mdape, baseline_wape, candidate_wape


def benchmark_labels(payload):
    labels = {}
    if payload is None:
        return labels
    def visit(value, inherited=None):
        if isinstance(value, dict):
            label = next((text(value.get(key)) for key in ("decision", "status", "result", "판단", "리오더판단") if value.get(key)), inherited)
            code = next((text(value.get(key)) for key in ("styleCode", "style", "style_code", "품번") if value.get(key)), "")
            if code in BENCHMARK_STYLES:
                labels[code] = label or "BENCHMARK_CANDIDATE"
            for key, child in value.items():
                visit(child, label if key not in BENCHMARK_STYLES else text(child))
        elif isinstance(value, list):
            for child in value:
                visit(child, inherited)
        elif text(value) in BENCHMARK_STYLES:
            labels[text(value)] = inherited or "BENCHMARK_CANDIDATE"
    visit(payload)
    return labels


def confidence_at_least_mid(value):
    return value in ("MID", "MID_HIGH")


def current_benchmark_details(weights, reference_styles):
    latest = json.loads(LATEST_PATH.read_text(encoding="utf-8"))
    by_code = {row["sku"]: row for row in latest["styles"]}
    ref_by_code = {row["styleCode"]: row for row in reference_styles}
    payload = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8")) if BENCHMARK_PATH.exists() else None
    labels = benchmark_labels(payload)
    rows = []
    for code in BENCHMARK_STYLES:
        row = by_code.get(code)
        if not row:
            rows.append({"styleCode": code, "missing": True, "benchmark": labels.get(code, "MISSING")})
            continue
        forecast = row.get("forecastV1") or {}
        analog_codes = [item.get("styleCode") or item.get("sku") for item in forecast.get("analogStyles", [])]
        analogs = [ref_by_code[analog_code] for analog_code in analog_codes if analog_code in ref_by_code]
        prior_rates = [analog["finalSellThrough"] for analog in analogs]
        prior_qty = number(row.get("inQty")) * statistics.median(prior_rates) if prior_rates else None
        week = int(forecast.get("sellingWeekNumber") or 0)
        weight = weights[week - 1] if 1 <= week <= 6 else 1.0
        old_qty = number(forecast.get("adjustedForecastQty"))
        base_qty = number(forecast.get("baseForecastQty"))
        current = number(forecast.get("currentCumulativeSales"))
        blend = max(current, prior_qty * (1 - weight) + base_qty * weight) if prior_qty is not None else None
        alpha = number(forecast.get("trendAlpha"))
        factor = forecast.get("trendFactor")
        adjusted = max(current, current + (blend - current) * (number(factor) ** alpha)) if blend is not None and (alpha == 0 or factor is not None) else blend
        sell_through = adjusted / number(row.get("inQty")) if adjusted is not None and number(row.get("inQty")) > 0 else None
        confidence = forecast.get("forecastConfidence", "INSUFFICIENT")
        signal = "INSUFFICIENT" if sell_through is None else ("HIGH" if sell_through >= 0.6 and confidence_at_least_mid(confidence) else "WATCH" if sell_through >= 0.6 else "NORMAL")
        rows.append({
            "styleCode": code, "benchmark": labels.get(code, "MISSING"), "week": week or None,
            "sellThrough": number(row.get("sellThrough")) / 100, "analogs": analog_codes,
            "analogPrior": prior_qty, "v1": old_qty, "v11": adjusted, "forecastSellThrough": sell_through,
            "confidence": confidence, "signal": signal, "v1Signal": forecast.get("forecastSignal"),
            "stockCover": row.get("stockCoverWeeks"), "stockRisk": row.get("stockRisk"),
        })
    return rows, payload is not None, labels


def render_report(styles, cases, weights, grid_count, benchmark_rows, benchmark_exists, labels):
    models = [
        ("A Category Curve", "category"), ("B Analog v1 (no trend)", "analog"),
        ("B Analog v1 + Trend", "analogTrend"), ("C Blend v1.1 (no trend)", "blend"),
        ("D Blend v1.1 + Trend", "blendTrend"),
    ]
    validation = [row for row in cases if zlib.crc32(row["styleCode"].encode()) % 5 == 0]
    benchmark_lines = [
        "| STYLE | Benchmark | SW | 현재 판매율 | Analog Top5 | Analog Prior | 기존 v1 | v1.1 | v1.1 판매율 | Confidence | Signal | Stock Cover | Stock Risk |",
        "|---|---|---:|---:|---|---:|---:|---:|---:|---|---|---:|---|",
    ]
    for row in benchmark_rows:
        if row.get("missing"):
            benchmark_lines.append(f"| {row['styleCode']} | {row['benchmark']} | - | - | - | - | - | - | - | - | - | - | - |")
            continue
        benchmark_lines.append(
            f"| {row['styleCode']} | {row['benchmark']} | {row['week'] or '-'} | {pct(row['sellThrough'])} | "
            f"{', '.join(row['analogs']) or '-'} | {row['analogPrior']:.0f} | {row['v1']:.0f} | {row['v11']:.0f} | "
            f"{pct(row['forecastSellThrough'])} | {row['confidence']} | {row['signal']} | {row['stockCover']} | {row['stockRisk']} |"
        )
    old_capture = sum(row.get("v1Signal") in ("HIGH", "WATCH") for row in benchmark_rows)
    new_capture = sum(row.get("signal") in ("HIGH", "WATCH") for row in benchmark_rows)
    old_mdape, new_mdape, old_wape, new_wape = early_stability(cases)
    return f"""# Early Forecast v1.1 Back-test

## Scope and validity

- Population: 25FW Clean Analog 348 color SKU / {len(styles)} STYLE.
- Target STYLE is excluded from every category curve and Top5 analog set.
- Analog cumulative shares use the same cumulative-max monotonic correction as the v1 reference builder.
- Denominator: STYLE-level sum of the weekly RAW `입고` field, matching the production net-receipt denominator definition.
- Evaluation target: each STYLE's cumulative sales at the 2025-12-28 proxy.
- Weight search: {grid_count} strictly increasing W1-W6 candidates; W1 actual weight capped at 0.2.
- Split: deterministic 80% calibration / 20% validation by STYLE code hash.
- Important limitation: 24FW reference is unavailable. Top analog 25FW December outcomes are therefore known only after the evaluated 25FW weeks. This is leave-one-STYLE-out cross-sectional diagnosis, not a strict point-in-time leakage-free production validation. Production promotion must remain blocked pending a prior-season or later-season out-of-time test.

## Selected weight

`W1..W6 = {', '.join(f'{value:.1f}' for value in weights)}`; `W7+ = 1.0` (existing actual-driven structure).

## Evaluation samples

{sample_table(cases)}

The Clean Analog population contains 166 STYLE, but category SH has only one STYLE. It has no same-category, different-STYLE analog and is excluded from model metrics, leaving 165 evaluated STYLE per week.

## W1-W8 MdAPE - all 166 STYLE

{model_table(cases, models, 'mdape')}

## W1-W8 WAPE - all 166 STYLE

{model_table(cases, models, 'wape')}

## 60% Precision - all 166 STYLE

{model_table(cases, models, 'precision')}

## 60% Recall - all 166 STYLE

{model_table(cases, models, 'recall')}

## 60% F1 - all 166 STYLE

{model_table(cases, models, 'f1')}

## Holdout validation MdAPE

{model_table(validation, models, 'mdape')}

## Holdout validation WAPE

{model_table(validation, models, 'wape')}

## 26FW sales-planning benchmark

Benchmark JSON: **{'FOUND' if benchmark_exists else 'MISSING'}** (`{BENCHMARK_PATH.relative_to(ROOT)}`).

{chr(10).join(benchmark_lines)}

- Existing v1 HIGH+WATCH capture among listed 8 STYLE: **{old_capture}/8**.
- Diagnostic v1.1 HIGH+WATCH capture among listed 8 STYLE: **{new_capture}/8**.
- Benchmark decision labels parsed: **{len(labels)}/8**. Missing labels are not inferred from the stated 7/1 aggregate.

## Decision

- W1-W4 mean MdAPE: existing v1 + Trend **{pct(old_mdape)}** -> v1.1 + Trend **{pct(new_mdape)}**.
- W1-W4 mean WAPE: existing v1 + Trend **{pct(old_wape)}** -> v1.1 + Trend **{pct(new_wape)}**.
- Initial forecast stability: **{'개선' if new_mdape < old_mdape and new_wape < old_wape else '미개선'}** in this cross-sectional diagnosis. Early 60% recall falls as forecasts become more conservative, so error reduction alone is not an approval criterion.
- Threshold, confidence, production formula, `latest.json`, Stock Risk, Preview, and Action Engine were not changed.
- Production v1.1 recommendation: **추가검증**. The benchmark JSON and an out-of-time reference are required before promotion.
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="docs/EARLY_FORECAST_V11_BACKTEST.md")
    args = parser.parse_args()
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    styles = load_clean_styles(config)
    cases = build_cases(styles, config)
    weights, grid_count = select_weights(cases, config)
    if not all(weights[index] < weights[index + 1] for index in range(len(weights) - 1)) or weights[0] > 0.2:
        raise AssertionError(f"invalid early weights: {weights}")
    add_blend_predictions(cases, weights, config)
    benchmark_rows, benchmark_exists, labels = current_benchmark_details(weights, styles)
    report = render_report(styles, cases, weights, grid_count, benchmark_rows, benchmark_exists, labels)
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(report, encoding="utf-8")
    print(json.dumps({
        "ok": True, "cleanStyles": len(styles), "cases": len(cases), "gridCandidates": grid_count,
        "weights": weights, "benchmarkFound": benchmark_exists, "output": str(output),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
