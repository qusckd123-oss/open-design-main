import argparse
import json
import math
import re
import statistics
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook

from backtest_early_forecast_v11 import load_clean_rows


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "forecast-v1.json"
SOURCE_DIR = ROOT / ".local-forecast-reference"
LATEST_PATH = ROOT / "data" / "sku-latest.json"
OUTPUT_PATH = ROOT / "data" / "sku-analog-pace-calibration.json"
REPORT_PATH = ROOT / "docs" / "SKU_ANALOG_PACE_CALIBRATION.md"
BUCKET_WEEKS = (2, 3, 4, 5, 6, 8)
APP_CATEGORIES = {"CD", "CR", "DP", "HD", "HZ", "JK", "KT", "LT", "OP", "PT", "SH", "SO", "SR", "SS", "ST"}


def text(value):
    return str(value or "").strip()


def number(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def iso(value):
    if isinstance(value, (date, datetime)):
        return value.date().isoformat() if isinstance(value, datetime) else value.isoformat()
    return text(value)[:10]


def category(style):
    match = re.match(r"^WA\d{4}([A-Z]{2})", text(style))
    return match.group(1) if match else ""


def percentile(values, value):
    if not values or value is None:
        return None
    return round(100 * sum(1 for item in values if item <= value) / len(values), 2)


def pct(value):
    return round(value * 100, 4) if value is not None else None


def median_or_none(values):
    values = [value for value in values if value is not None and math.isfinite(value)]
    return statistics.median(values) if values else None


def selling_week_from_history(history):
    """Return elapsed completed selling weeks since first positive, inclusive.

    completedWeeklyHistory is ordered oldest to newest. Therefore a first
    positive row at index i in a history of length n is currently at W(n - i),
    not W(i + 1). This is intentionally separate from historical hold-out
    calibration, whose W1-W8 input semantics remain unchanged.
    """
    first = next((index for index, item in enumerate(history) if number(item.get("qty")) > 0), None)
    return (len(history) - first) if first is not None else None


def load_raw():
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    rows, week_columns, _ = load_clean_rows(config)
    result = []
    for row in rows:
        style = text(row[0])
        if not style or category(style) not in APP_CATEGORIES:
            continue
        weekly = [{"period": period, "qty": number(row[column]), "cumulative": number(row[column + 1])} for column, period in week_columns]
        first = next((index for index, item in enumerate(weekly) if item["qty"] > 0), None)
        if first is None or number(row[8]) <= 0:
            continue
        result.append({
            "sku": f"{style}{text(row[2])}", "styleCode": style, "colorCode": text(row[2]),
            "name": text(row[1]), "genderGroup": "WOMENS" if "WOMEN" in text(row[1]).upper() or "\uC6B0\uBA3C" in text(row[1]) else "UNISEX",
            "category": category(style), "price": number(row[4]), "orderQty": number(row[8]), "inboundQty": number(row[9]),
            "finalSalesQty": number(row[11]), "weekly": weekly, "firstPositiveIndex": first,
        })
    return config, result


def clean_rows(rows, config):
    return rows


def style_record(rows):
    by_style = defaultdict(list)
    for row in rows:
        by_style[row["styleCode"]].append(row)
    styles = {}
    for code, items in by_style.items():
        first = min(item["firstPositiveIndex"] for item in items)
        styles[code] = {
            "styleCode": code, "category": items[0]["category"], "name": items[0]["name"],
            "genderGroup": items[0]["genderGroup"], "price": statistics.median(item["price"] for item in items),
            "firstPositiveIndex": first, "skus": items,
        }
    return styles


def progress_at(row, week, denominator):
    index = row["firstPositiveIndex"] + week - 1
    if index < 0 or index >= len(row["weekly"]):
        return None
    base = row[denominator]
    return row["weekly"][index]["cumulative"] / base if base > 0 else None


def similarity(target, analog):
    score = 1.0 if target["genderGroup"] == analog["genderGroup"] else 0.0
    if target["price"] and analog["price"]:
        score += max(0, 1 - abs(target["price"] - analog["price"]) / max(target["price"], analog["price"]))
    score += max(0, 1 - abs(target["firstPositiveIndex"] - analog["firstPositiveIndex"]) / 12)
    return score


def analogs_for(target, styles):
    candidates = [style for style in styles.values() if style["category"] == target["category"] and style["styleCode"] != target["styleCode"]]
    return sorted(candidates, key=lambda item: (-similarity(target, item), item["styleCode"]))[:5]


def pace_for(target, styles, week, denominator):
    analogs = analogs_for(target, styles)
    style_values = []
    for analog in analogs:
        color_values = [progress_at(row, week, denominator) for row in analog["skus"]]
        value = median_or_none(color_values)
        if value is not None:
            style_values.append(value)
    current = median_or_none([progress_at(row, week, denominator) for row in target["skus"]])
    expected = median_or_none(style_values)
    distribution = [value for value in style_values if value is not None]
    return {
        "analogStyleCount": len(style_values), "analogExpectedProgress": expected,
        "currentProgress": current,
        "paceIndex": current / expected if current is not None and expected and expected > 0 else None,
        "pacePercentile": percentile(distribution, current), "analogMethod": "STYLE_TOP5" if style_values else "INSUFFICIENT",
        "analogStyleCodes": [style["styleCode"] for style in analogs],
    }


def outcome_bucket(rows, field, low, high=None):
    values = [row for row in rows if row[field] is not None and row[field] >= low and (high is None or row[field] < high)]
    outcomes = [row["finalSellThrough"] for row in values]
    return {"skuCount": len(values), "finalSellThroughMedian": pct(statistics.median(outcomes)) if outcomes else None, "finalSellThroughMean": pct(statistics.mean(outcomes)) if outcomes else None, "ge50Rate": round(sum(value >= 0.5 for value in outcomes) / len(outcomes) * 100, 2) if outcomes else None, "ge60Rate": round(sum(value >= 0.6 for value in outcomes) / len(outcomes) * 100, 2) if outcomes else None, "ge70Rate": round(sum(value >= 0.7 for value in outcomes) / len(outcomes) * 100, 2) if outcomes else None}


def rank_correlation(rows, denominator):
    pairs = [(row[denominator]["pacePercentile"], row["finalOrderSellThrough"] if denominator == "order" else row["finalInboundSellThrough"]) for row in rows if row[denominator]["pacePercentile"] is not None]
    if len(pairs) < 3:
        return None
    x = [item[0] for item in pairs]
    y = [item[1] for item in pairs]
    mx, my = statistics.mean(x), statistics.mean(y)
    numerator = sum((a - mx) * (b - my) for a, b in pairs)
    denominator_value = math.sqrt(sum((a - mx) ** 2 for a in x) * sum((b - my) ** 2 for b in y))
    return round(numerator / denominator_value, 4) if denominator_value else None


def calibrate(rows, styles):
    records = []
    for target in styles.values():
        for week in range(1, 9):
            order = pace_for(target, styles, week, "orderQty")
            inbound = pace_for(target, styles, week, "inboundQty")
            final_order = sum(row["finalSalesQty"] for row in target["skus"]) / sum(row["orderQty"] for row in target["skus"])
            final_inbound = sum(row["finalSalesQty"] for row in target["skus"]) / sum(row["inboundQty"] for row in target["skus"])
            records.append({"styleCode": target["styleCode"], "category": target["category"], "week": week, "finalOrderSellThrough": final_order, "finalInboundSellThrough": final_inbound, "order": order, "inbound": inbound})
    return records


def build_current_diagnostics(latest, historical_styles):
    rows = []
    style_paces = defaultdict(list)
    for style in latest["styles"].values():
        if style.get("productGroup") != "APP" or style.get("season") != "26FW":
            continue
        for sku in style["skus"]:
            history = sku.get("completedWeeklyHistory") or []
            positive = next((index for index, item in enumerate(history) if number(item.get("qty")) > 0), None)
            selling_week = selling_week_from_history(history)
            velocity = sku.get("weighted4CompletedWeekQty")
            cover = sku.get("stockCoverWeeks")
            order_qty, inbound_qty = number(sku.get("orderQty")), number(sku.get("inboundQty"))
            current = {"styleCode": style["styleCode"], "skus": [{"styleCode": style["styleCode"], "category": style.get("category"), "genderGroup": style.get("genderGroup", "UNMAPPED"), "price": 0, "firstPositiveIndex": positive or 0, "orderQty": order_qty, "inboundQty": inbound_qty, "weekly": [{"qty": item.get("qty", 0), "cumulative": item.get("cumulativeQty", 0)} for item in history]}], "category": style.get("category"), "name": style.get("productName", ""), "genderGroup": style.get("genderGroup", "UNMAPPED"), "price": 0, "firstPositiveIndex": positive or 0}
            pace = pace_for(current, historical_styles, selling_week, "orderQty") if selling_week else {"analogMethod": "INSUFFICIENT", "analogStyleCount": 0, "analogExpectedProgress": None, "paceIndex": None, "pacePercentile": None, "analogStyleCodes": []}
            rows.append({"styleCode": style["styleCode"], "colorCode": sku["colorCode"], "sku": sku["sku"], "category": style.get("category"), "genderGroup": style.get("genderGroup", "UNMAPPED"), "orderQty": order_qty, "inboundQty": inbound_qty, "inboundCompletionRate": inbound_qty / order_qty if order_qty else None, "cumulativeSalesQty": sku.get("cumulativeSalesQty"), "orderSellThrough": sku.get("orderSellThrough"), "inboundSellThrough": sku.get("inboundSellThrough"), "sellingWeek": selling_week, "lastCompleteWeekQty": sku.get("lastCompleteWeekQty"), "completedWeekWow": sku.get("completedWeekWow"), "recentVelocity": velocity, "velocityConfidence": "HIGH" if len(history) - (positive or len(history)) >= 4 else "MID" if len(history) - (positive or len(history)) >= 2 else "LOW" if positive is not None else "NONE", "erpStockQty": sku.get("erpStockQty"), "diagnosticStockCover": cover, **pace, "styleAggregateInboundSellThrough": style.get("styleAggregateInboundSellThrough")})
            style_paces[style["styleCode"]].append(rows[-1])
    for style_code, style_rows in style_paces.items():
        valid = [row["inboundSellThrough"] for row in style_rows if row.get("inboundSellThrough") is not None]
        aggregate = sum(number(row.get("cumulativeSalesQty")) for row in style_rows) / sum(number(row.get("inboundQty")) for row in style_rows) * 100 if sum(number(row.get("inboundQty")) for row in style_rows) else None
        for row in style_rows:
            row["styleAggregateInboundSellThrough"] = round(aggregate, 4) if aggregate is not None else None
        if valid:
            values = [row.get("pacePercentile") for row in style_rows if row.get("pacePercentile") is not None]
            if values:
                for row in style_rows:
                    row["stylePaceSpread"] = round(max(values) - min(values), 2)
    return rows, style_paces


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    config, raw = load_raw()
    clean = clean_rows(raw, config)
    styles = style_record(clean)
    records = calibrate(clean, styles)
    latest = json.loads(LATEST_PATH.read_text(encoding="utf-8"))
    current, style_paces = build_current_diagnostics(latest, styles)
    calibration = {}
    for denominator in ("order", "inbound"):
        calibration[denominator] = {}
        for week in BUCKET_WEEKS:
            subset = [row for row in records if row["week"] == week and row[denominator]["pacePercentile"] is not None]
            calibration[denominator][str(week)] = {"skuCount": len(subset), "pacePercentileOutcomeCorrelation": rank_correlation(subset, denominator), "percentileBuckets": {}}
            for label, low, high in (("0-25", 0, 25), ("25-50", 25, 50), ("50-75", 50, 75), ("75-90", 75, 90), ("90-100", 90, 101)):
                values = [{"finalSellThrough": row["finalOrderSellThrough"] if denominator == "order" else row["finalInboundSellThrough"], "percentile": row[denominator]["pacePercentile"]} for row in subset if low <= row[denominator]["pacePercentile"] < high]
                calibration[denominator][str(week)]["percentileBuckets"][label] = outcome_bucket([{**value, "__unused": 0} for value in values], "percentile", low, high)
            calibration[denominator][str(week)]["indexBuckets"] = {}
            for label, low, high in (("<0.75", -math.inf, .75), ("0.75-1.0", .75, 1), ("1.0-1.25", 1, 1.25), ("1.25-1.5", 1.25, 1.5), ("1.5-2.0", 1.5, 2), ("2.0+", 2, math.inf)):
                values = [{"finalSellThrough": row["finalOrderSellThrough"] if denominator == "order" else row["finalInboundSellThrough"], "index": row[denominator]["paceIndex"]} for row in subset if row[denominator]["paceIndex"] is not None and low <= row[denominator]["paceIndex"] < high]
                calibration[denominator][str(week)]["indexBuckets"][label] = outcome_bucket([{**value, "__unused": 0} for value in values], "index", low, high)
    top = sorted([row for row in current if row.get("pacePercentile") is not None], key=lambda row: (-row["pacePercentile"], -(row.get("paceIndex") or 0), row["sku"]))[:30]
    divergence = []
    for style_code, style_rows in style_paces.items():
        values = [row for row in style_rows if row.get("pacePercentile") is not None]
        if len(values) >= 2 and max(row["pacePercentile"] for row in values) > min(row["pacePercentile"] for row in values):
            divergence.append({"styleCode": style_code, "productName": latest["styles"].get(style_code, {}).get("productName"), "category": latest["styles"].get(style_code, {}).get("category"), "genderGroup": latest["styles"].get(style_code, {}).get("genderGroup", "UNMAPPED"), "paceSpread": max(row["pacePercentile"] for row in values) - min(row["pacePercentile"] for row in values), "skus": values})
    divergence.sort(key=lambda row: (-row["paceSpread"], row["styleCode"]))
    fast = [row for row in current if (row.get("pacePercentile") or 0) >= 75]
    current_summary = {"skuCount": len(current), "paceCalculable": sum(row.get("paceIndex") is not None for row in current), "fastPaceThresholdSimulation": "pacePercentile >= 75", "fastPaceCount": len(fast), "stockCoverNullFastPaceCount": sum(row.get("diagnosticStockCover") is None for row in fast), "lowCoverFastPaceCount": sum(row.get("diagnosticStockCover") is not None and row.get("diagnosticStockCover") <= 4 for row in fast), "supplyPendingFastPaceCount": sum((row.get("inboundCompletionRate") or 1) < .9 for row in fast), "top30": top, "colorPaceDivergenceTop20": divergence[:20], "rows": current}
    result = {"meta": {"calibrationType": "CALIBRATION", "cleanSkuCount": len(clean), "cleanStyleCount": len(styles), "weeks": list(BUCKET_WEEKS), "denominators": ["order", "inbound"], "representation": "STYLE_WEIGHTED_HIERARCHICAL_MEDIAN"}, "calibration": calibration, "current26FWApp": current_summary}
    if args.write:
        OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        REPORT_PATH.write_text(render_report(result), encoding="utf-8")
    print(json.dumps({"cleanSku": len(clean), "cleanStyle": len(styles), "currentSku": len(current), "paceCalculable": result["current26FWApp"]["paceCalculable"], "output": str(OUTPUT_PATH) if args.write else None}, ensure_ascii=False))


def render_report(result):
    current = result["current26FWApp"]
    lines = ["# SKU Analog Pace Calibration", "", "이 문서는 25FW 동일 시즌 historical hold-out을 이용한 CALIBRATION이며 production VALIDATION이 아니다.", "", f"- Clean sample: {result['meta']['cleanSkuCount']} SKU / {result['meta']['cleanStyleCount']} STYLE", "- Representation: Analog STYLE 내부 COLOR median 후 Top5 STYLE median", "- Denominators: orderSellThrough, inboundSellThrough 비교", "- Production 변경: 없음", "", "## Current 26FW APP", f"- SKU: {current['skuCount']}", f"- Pace calculable: {current['paceCalculable']}", f"- Simulated fast pace (percentile >=75): {current['fastPaceCount']}", f"- Stock Cover NULL + fast pace: {current['stockCoverNullFastPaceCount']}", f"- LOW Cover + fast pace (<=4 weeks): {current['lowCoverFastPaceCount']}", f"- Supply pending + fast pace (<90% inbound completion): {current['supplyPendingFastPaceCount']}", "- Pace index/percentile는 진단용이며 SKU Signal이 아니다.", "", "## Calibration Summary", "", "| Week | ORDER P75 final >=60% | ORDER P90 final >=60% | INBOUND P75 final >=60% | INBOUND P90 final >=60% |", "|---:|---:|---:|---:|---:|"]
    for week in result["meta"]["weeks"]:
        order = result["calibration"]["order"][str(week)]["percentileBuckets"]
        inbound = result["calibration"]["inbound"][str(week)]["percentileBuckets"]
        lines.append(f"| W{week} | {order['75-90']['ge60Rate']}% | {order['90-100']['ge60Rate']}% | {inbound['75-90']['ge60Rate']}% | {inbound['90-100']['ge60Rate']}% |")
    lines += ["", "## Interpretation", "- ORDER denominator은 분할입고 영향을 줄여 비교 기준으로 우선 검토한다.", "- INBOUND denominator은 초기 분할입고 시 pace가 과대평가될 수 있어 병행 진단한다.", "- 초기 주차의 작은 expected progress는 ratio 폭주 가능성이 있어 percentile과 함께 본다.", "- remaining order quantity는 실제 가용재고가 아니며 supply pending 보조진단에만 사용한다.", "", "## Top 30", "", "| SKU | STYLE | W | Pace index | Pace percentile | Expected progress | Method |", "|---|---|---:|---:|---:|---:|---|"]
    for row in current["top30"]:
        lines.append(f"| {row['sku']} | {row['styleCode']} | {row.get('sellingWeek') or '-'} | {row.get('paceIndex') or 0:.2f} | {row.get('pacePercentile') or 0:.1f} | {row.get('analogExpectedProgress') or 0:.4f} | {row.get('analogMethod')} |")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    main()
