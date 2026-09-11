#!/usr/bin/env python3
"""Diagnostic CALIBRATION for age-aware SKU velocity semantics.

This script reads the existing 25FW Clean Analog universe and never writes
production data.  Checkpoint metrics use only weekly history available at the
checkpoint, so final December outcomes are labels, not inputs.
"""
from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import Counter
from pathlib import Path
from typing import Any

try:
    from backtest_early_forecast_v11 import load_clean_rows
except ModuleNotFoundError:  # importable as scripts.sku_* from the test runner
    from scripts.backtest_early_forecast_v11 import load_clean_rows

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config" / "forecast-v1.json"
OUT = ROOT / "data" / "sku-selling-age-velocity-calibration.json"
REPORT = ROOT / "docs" / "SKU_SELLING_AGE_VELOCITY_CALIBRATION.md"
WEIGHTS = (0.1, 0.2, 0.3, 0.4)
WEEKS = tuple(range(1, 9))


def num(value: Any) -> float:
    try:
        value = float(value or 0)
    except (TypeError, ValueError):
        return 0.0
    return value if math.isfinite(value) else 0.0


def rounded(value: float | None, digits: int = 4) -> float | None:
    return None if value is None else round(value, digits)


def weighted(values: list[float]) -> float | None:
    if not values:
        return None
    recent = values[-4:]
    weights = WEIGHTS[-len(recent):]
    total = sum(weights)
    return sum(v * w for v, w in zip(recent, weights)) / total


def selling_age_velocity(weekly: list[float]) -> float | None:
    """Candidate field formula over completed quantities only."""
    first = next((i for i, qty in enumerate(weekly) if qty > 0), None)
    return weighted(weekly[first:]) if first is not None else None


def selling_age_stock_cover(erp_stock: float | None, velocity: float | None) -> float | None:
    """Raw candidate cover; zero/negative stock is deliberately preserved."""
    if erp_stock is None or velocity is None or velocity <= 0:
        return None
    return erp_stock / velocity


def velocity_pair(weekly: list[float], first: int, age_week: int) -> tuple[float | None, float | None, int]:
    cutoff = first + age_week - 1
    if cutoff >= len(weekly):
        return None, None, cutoff
    observed = weekly[: cutoff + 1]
    return weighted(observed), weighted(observed[first:]), cutoff


def rank(values: list[float]) -> list[float]:
    order = sorted(range(len(values)), key=lambda i: values[i])
    result = [0.0] * len(values)
    for position, index in enumerate(order):
        result[index] = position + 1
    return result


def spearman(pairs: list[tuple[float, float]]) -> float | None:
    if len(pairs) < 3:
        return None
    xs, ys = zip(*pairs)
    rx, ry = rank(list(xs)), rank(list(ys))
    mx, my = statistics.mean(rx), statistics.mean(ry)
    den = math.sqrt(sum((x - mx) ** 2 for x in rx) * sum((y - my) ** 2 for y in ry))
    return rounded(sum((x - mx) * (y - my) for x, y in zip(rx, ry)) / den, 4) if den else 0.0


def auc(pairs: list[tuple[float, bool]]) -> float | None:
    positives = [x for x, y in pairs if y]
    negatives = [x for x, y in pairs if not y]
    if not positives or not negatives:
        return None
    wins = sum(1 if p > n else 0.5 if p == n else 0 for p in positives for n in negatives)
    return rounded(wins / (len(positives) * len(negatives)), 4)


def stock_bins(values: list[dict[str, Any]]) -> dict[str, Any]:
    bins = {"<=2": [], "2-4": [], "4-6": [], "6-10": [], ">10": []}
    for row in values:
        proxy = row.get("sellingAgeProxyStockCoverWeeks")
        if proxy is None or proxy < 0:
            continue
        key = "<=2" if proxy <= 2 else "2-4" if proxy <= 4 else "4-6" if proxy <= 6 else "6-10" if proxy <= 10 else ">10"
        bins[key].append(row)
    out = {}
    for key, rows in bins.items():
        outcomes = [r["finalOrderSellThrough"] for r in rows]
        out[key] = {"n": len(rows), "finalSellThroughMedian": rounded(statistics.median(outcomes)) if outcomes else None,
                    "finalGe60Rate": rounded(sum(x >= 0.6 for x in outcomes) / len(outcomes) * 100, 2) if outcomes else None}
    return out


def build() -> dict[str, Any]:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    clean, week_columns, december_column = load_clean_rows(config)
    rows = []
    for source in clean:
        weekly = [num(source[column]) for column, _ in week_columns]
        first = next((i for i, qty in enumerate(weekly) if qty > 0), None)
        if first is None:
            continue
        final_sales = num(source[december_column + 1])
        order = num(source[8])
        final_st = final_sales / order if order > 0 else None
        for age_week in WEEKS:
            legacy, age, cutoff = velocity_pair(weekly, first, age_week)
            if legacy is None:
                continue
            observed = weekly[:cutoff + 1]
            age_observed = observed[first:]
            age_velocity_now = age
            # An in-scope, as-of checkpoint stock proxy only; not ERP stock.
            cumulative_to_date = sum(observed)
            proxy_stock = order - cumulative_to_date if order > 0 else None
            proxy_cover = proxy_stock / age_velocity_now if proxy_stock is not None and age_velocity_now and age_velocity_now > 0 else None
            legacy_cover = proxy_stock / legacy if proxy_stock is not None and legacy and legacy > 0 else None
            window_start = max(0, cutoff - 3)
            prelaunch_zeros = sum(weekly[i] == 0 for i in range(window_start, cutoff + 1) if i < first)
            postlaunch_zeros = sum(qty == 0 for qty in age_observed)
            rows.append({"sku": f"{source[0]}{source[2]}", "styleCode": str(source[0]), "colorCode": str(source[2]),
                         "week": age_week, "firstPositiveCalendarIndex": first, "calendarRowsObserved": cutoff + 1,
                         "preLaunchZeroWeeksInLegacyWindow": prelaunch_zeros, "postLaunchZeroWeeksObserved": postlaunch_zeros,
                         "legacyCalendarVelocityQtyPerWeek": rounded(legacy), "sellingAgeVelocityQtyPerWeek": rounded(age),
                         "orderQty": rounded(order), "finalOrderSellThrough": rounded(final_st),
                         "finalGe60": bool(final_st is not None and final_st >= 0.6),
                         "orderLessSalesStockProxyQty": rounded(proxy_stock), "legacyProxyStockCoverWeeks": rounded(legacy_cover),
                         "sellingAgeProxyStockCoverWeeks": rounded(proxy_cover)})
    by_week = {}
    for week in WEEKS:
        values = [r for r in rows if r["week"] == week]
        legacy_pairs = [(r["legacyCalendarVelocityQtyPerWeek"], r["finalOrderSellThrough"]) for r in values if r["legacyCalendarVelocityQtyPerWeek"] is not None and r["finalOrderSellThrough"] is not None]
        age_pairs = [(r["sellingAgeVelocityQtyPerWeek"], r["finalOrderSellThrough"]) for r in values if r["sellingAgeVelocityQtyPerWeek"] is not None and r["finalOrderSellThrough"] is not None]
        by_week[str(week)] = {"n": len(values), "legacyCoveragePct": rounded(len(values) / len(clean) * 100, 2), "sellingAgeCoveragePct": rounded(len(values) / len(clean) * 100, 2),
                              "legacyVsAgeRelativeDifferenceMedian": rounded(statistics.median([(r["sellingAgeVelocityQtyPerWeek"] - r["legacyCalendarVelocityQtyPerWeek"]) / r["legacyCalendarVelocityQtyPerWeek"] for r in values if r["legacyCalendarVelocityQtyPerWeek"] > 0 and r["sellingAgeVelocityQtyPerWeek"] is not None])),
                              "legacySpearmanFinalOrderSellThrough": spearman(legacy_pairs), "sellingAgeSpearmanFinalOrderSellThrough": spearman(age_pairs),
                              "legacyAucFinalGe60": auc([(r["legacyCalendarVelocityQtyPerWeek"], r["finalGe60"]) for r in values if r["finalOrderSellThrough"] is not None]),
                              "sellingAgeAucFinalGe60": auc([(r["sellingAgeVelocityQtyPerWeek"], r["finalGe60"]) for r in values if r["finalOrderSellThrough"] is not None]),
                              "preLaunchZeroRows": sum(r["preLaunchZeroWeeksInLegacyWindow"] > 0 for r in values), "preLaunchZeroOccurrences": sum(r["preLaunchZeroWeeksInLegacyWindow"] for r in values),
                              "postLaunchZeroRows": sum(r["postLaunchZeroWeeksObserved"] > 0 for r in values), "proxyCoverBins": stock_bins(values)}
    stability = {}
    for method in ("legacyCalendarVelocityQtyPerWeek", "sellingAgeVelocityQtyPerWeek"):
        changes = []
        for sku in {r["sku"] for r in rows}:
            seq = [r[method] for r in rows if r["sku"] == sku]
            for prior, current in zip(seq, seq[1:]):
                if prior is not None and current is not None and abs(prior) > 1e-9:
                    changes.append(abs((current - prior) / prior))
        stability[method] = {"adjacentPairCount": len(changes), "medianAbsoluteRelativeWoWChange": rounded(statistics.median(changes)) if changes else None,
                             "meanAbsoluteRelativeWoWChange": rounded(statistics.mean(changes)) if changes else None}
    examples = sorted([r for r in rows if r["week"] <= 4 and r["preLaunchZeroWeeksInLegacyWindow"] > 0], key=lambda r: (-r["preLaunchZeroWeeksInLegacyWindow"], r["sku"], r["week"]))[:12]
    return {"schemaVersion": "sku-selling-age-velocity-calibration-v1", "diagnosticOnly": True, "calibrationType": "CALIBRATION",
            "productionBehaviorChanged": False, "meta": {"cleanSkuCount": len(clean), "cleanStyleCount": len({str(r[0]) for r in clean}), "weeks": list(WEEKS), "weights": list(WEIGHTS), "outcome": "final Dec-end orderSellThrough; >=60% descriptive binary outcome", "reorderEventLabel": "not available in retained Clean Analog rows; no target use"},
            "definition": {"legacy": "last up to four calendar rows available at checkpoint, normalized [0.1,0.2,0.3,0.4]", "sellingAge": "completed rows from first positive sales week through checkpoint, last up to four age weeks, same normalized weights", "wtd": "not present/used in historical weekly source", "negativeQty": "included after launch as observed return/reversal", "erpStock": "not available as weekly historical snapshots; no ERP stock cover claim", "proxy": "orderQty minus observed cumulative sales, diagnostic only"},
            "byWeek": by_week, "stability": stability, "preLaunchZeroExamples": examples, "rows": rows}


def render(result: dict[str, Any]) -> str:
    m, weeks = result["meta"], result["byWeek"]
    lines = ["# SKU Selling-Age Velocity Calibration", "", "25FW Clean Analog historical hold-out CALIBRATION; this is not production validation.", "", f"- Sample: {m['cleanSkuCount']} SKU / {m['cleanStyleCount']} STYLE", "- Outcome: final December order sell-through; final >=60% is descriptive only.", "- Production behavior changed: NO", "", "## W1-W8 evidence", "", "| Week | N | Legacy coverage | Age-aware coverage | Median age-vs-legacy Δ | Legacy Spearman | Age-aware Spearman | Legacy AUC >=60 | Age-aware AUC >=60 | Pre-launch zero rows/occurrences | Post-launch zero rows |", "|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|"]
    for w in result["meta"]["weeks"]:
        x = weeks[str(w)]
        lines.append(f"| W{w} | {x['n']} | {x['legacyCoveragePct']}% | {x['sellingAgeCoveragePct']}% | {x['legacyVsAgeRelativeDifferenceMedian']} | {x['legacySpearmanFinalOrderSellThrough']} | {x['sellingAgeSpearmanFinalOrderSellThrough']} | {x['legacyAucFinalGe60']} | {x['sellingAgeAucFinalGe60']} | {x['preLaunchZeroRows']}/{x['preLaunchZeroOccurrences']} | {x['postLaunchZeroRows']} |")
    lines += ["", "## Stability", "", f"- Legacy: `{json.dumps(result['stability']['legacyCalendarVelocityQtyPerWeek'], ensure_ascii=False)}`", f"- Selling-age: `{json.dumps(result['stability']['sellingAgeVelocityQtyPerWeek'], ensure_ascii=False)}`", "", "## Stock-cover usefulness", "", "Historical ERP stock snapshots are not present, so ERP stock-cover bins cannot be calibrated without hindsight or an invented stock series. The JSON includes explicitly labeled `orderQty - observed cumulative sales` proxy-cover bins for sensitivity only; they must not be treated as ERP stock-cover evidence.", "", "## Zero-week distortion and examples", "", f"- Pre-launch zeros are counted only inside the legacy recent-four window; post-launch zeros are counted separately after the first positive week.", f"- Representative rows are in `data/sku-selling-age-velocity-calibration.json` under `preLaunchZeroExamples`.", "", "## Interpretation", "", "Age-aware velocity is semantically cleaner for early decisions because it removes launch delay from the recency window without using future weeks. Coverage is the same in this Clean Analog checkpoint design because both measures are defined only once a first positive week exists; usefulness should be judged by stability and outcome relationship, not by coverage alone.", "", "SKU_SELLING_AGE_VELOCITY_CALIBRATION_READY", ""]
    insert_at = lines.index("## Zero-week distortion and examples")
    proxy_lines = ["## Supplemental non-ERP proxy-cover bins", "", "| Week | <=2 | 2-4 | 4-6 | 6-10 | >10 |", "|---:|---:|---:|---:|---:|---:|"]
    for week in result["meta"]["weeks"]:
        bins = result["byWeek"][str(week)]["proxyCoverBins"]
        proxy_lines.append("| W%d | %s | %s | %s | %s | %s |" % (week, *[f"{bins[key]['n']} / {bins[key]['finalGe60Rate']}%" for key in ("<=2", "2-4", "4-6", "6-10", ">10")]))
    proxy_lines += ["", "The proxy is not ERP stock and is excluded from the semantic decision.", "", "## 26FW impact context", "", "The existing 26FW APP usability audit remains the operational impact reference: 439 SKU, age-aware velocity calculable for 180, 90/180 materially depressed legacy velocity comparisons, and 133 rows containing 254 pre-launch-zero occurrences in the legacy recent-four window. These remain diagnostic facts only.", ""]
    lines[insert_at:insert_at] = proxy_lines
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    result = build()
    if args.write:
        OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        REPORT.write_text(render(result), encoding="utf-8")
    print(json.dumps({"cleanSku": result["meta"]["cleanSkuCount"], "cleanStyle": result["meta"]["cleanStyleCount"], "output": str(OUT) if args.write else None}, ensure_ascii=False))


if __name__ == "__main__":
    main()
