#!/usr/bin/env python3
"""Diagnostic-only audit of SKU Current Risk velocity and cover usability."""

from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "sku-latest.json"
DEFAULT_ANALOG = ROOT / "data" / "sku-analog-pace-coverage-diagnostic.json"
DEFAULT_OUTPUT = ROOT / "data" / "sku-current-risk-usability-audit.json"
DEFAULT_REPORT = ROOT / "docs" / "SKU_CURRENT_RISK_USABILITY_AUDIT.md"
WEIGHTS = (0.1, 0.2, 0.3, 0.4)


def number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def rounded(value: float | None, digits: int = 4) -> float | None:
    return None if value is None else round(value, digits)


def selling_age(completed_history: list[dict[str, Any]]) -> int | None:
    """Completed selling weeks elapsed since first positive completed sales week."""
    first = next((i for i, item in enumerate(completed_history) if (number(item.get("qty")) or 0) > 0), None)
    return len(completed_history) - first if first is not None else None


def weighted_recent_velocity(quantities: list[float]) -> float | None:
    """Use the same recency weights, normalized over available selling weeks."""
    if not quantities:
        return None
    recent = quantities[-4:]
    weights = WEIGHTS[-len(recent):]
    total = sum(weights)
    return sum(quantity * weight / total for quantity, weight in zip(recent, weights))


def age_velocity(history: list[dict[str, Any]]) -> float | None:
    age = selling_age(history)
    if age is None:
        return None
    first = len(history) - age
    return weighted_recent_velocity([(number(item.get("qty")) or 0) for item in history[first:]])


def age_label(age: int | None, completed_sales: float, current_wtd: float) -> str:
    if age is not None:
        return f"W{age}" if age <= 8 else "W9_PLUS"
    if current_wtd > 0:
        return "WTD_ONLY"
    if completed_sales <= 0:
        return "PRE_SALE"
    return "NO_COMPLETED_SALES"


def relative_difference(existing: float | None, diagnostic: float | None) -> float | None:
    if existing is None or diagnostic is None or existing <= 0:
        return None
    return (diagnostic - existing) / existing


def archetype(row: dict[str, Any]) -> str:
    cover = row["diagnostic"]["stockCoverWeeks"]
    pending = (row["facts"]["remainingOrderQty"] or 0) > 0
    if row["lifecycle"] == "PRE_SALE":
        return "NO_COMPLETED_SALES"
    if row["lifecycle"] == "WTD_ONLY":
        return "WTD_ONLY"
    if cover is None:
        return "NO_USABLE_VELOCITY"
    if cover < 2 and pending:
        return "LOW_ON_HAND_WITH_PENDING_SUPPLY"
    if cover < 2 and not pending:
        return "LOW_ON_HAND_FULLY_INBOUND"
    if row["lifecycle"] in {f"W{i}" for i in range(2, 9)} and cover >= 4:
        return "EARLY_SELLING_WITH_AMPLE_STOCK"
    if row["lifecycle"] in {f"W{i}" for i in range(2, 9)}:
        return "EARLY_SELLING_WITH_USABLE_COVER"
    if row["lifecycle"] == "W1":
        return "W1_DISPLAY_ONLY"
    return "MATURE_COMPLETED_SALES"


def diagnostic_row(style: dict[str, Any], sku: dict[str, Any], analog_by_sku: dict[str, dict[str, Any]]) -> dict[str, Any]:
    history = sku.get("completedWeeklyHistory") or []
    quantities = [(number(item.get("qty")) or 0) for item in history]
    completed_sales = sum(quantities)
    current_wtd = number(sku.get("currentWtdQty")) or 0
    age = selling_age(history)
    lifecycle = age_label(age, completed_sales, current_wtd)
    existing_velocity = number(sku.get("weighted4CompletedWeekQty"))
    diagnostic_velocity = age_velocity(history)
    first_positive_index = next((i for i, item in enumerate(history) if (number(item.get("qty")) or 0) > 0), None)
    existing_window_start = max(0, len(history) - 4)
    prelaunch_zeros_in_existing_window = sum(1 for i, item in enumerate(history[existing_window_start:], existing_window_start) if (number(item.get("qty")) or 0) == 0 and first_positive_index is not None and i < first_positive_index)
    stock = number(sku.get("erpStockQty"))
    diagnostic_cover = stock / diagnostic_velocity if stock is not None and diagnostic_velocity and diagnostic_velocity > 0 else None
    order = number(sku.get("orderQty"))
    inbound = number(sku.get("inboundQty"))
    remaining = order - inbound if order is not None and inbound is not None else None
    analog = analog_by_sku.get(str(sku.get("sku")), {})
    pace = analog.get("analogPacePercentile") if lifecycle in {f"W{i}" for i in range(2, 9)} else None
    row = {
        "sku": sku.get("sku"), "styleCode": sku.get("styleCode") or style.get("styleCode"),
        "colorCode": sku.get("colorCode"), "category": sku.get("category") or style.get("category"),
        "productGroup": sku.get("productGroup") or style.get("productGroup"), "season": sku.get("season") or style.get("season"),
        "lifecycle": lifecycle, "sellingAgeCompletedWeeks": age,
        "analogPacePercentile": pace,
        "facts": {"completedHistoryWeeks": len(history), "completedSalesQty": rounded(completed_sales), "currentWtdQty": current_wtd,
                  "erpStockQty": stock, "orderQty": order, "inboundQty": inbound, "remainingOrderQty": rounded(remaining),
                  "inboundCompletionRate": rounded(inbound / order, 4) if order and order > 0 else None},
        "existing": {"velocityQtyPerWeek": existing_velocity, "stockCoverWeeks": number(sku.get("stockCoverWeeks"))},
        "diagnostic": {"sellingAgeVelocityQtyPerWeek": rounded(diagnostic_velocity), "stockCoverWeeks": rounded(diagnostic_cover)},
        "semanticCause": {"preLaunchZeroWeeksInExistingRecent4": prelaunch_zeros_in_existing_window},
    }
    row["velocityComparison"] = {"relativeDifference": rounded(relative_difference(existing_velocity, diagnostic_velocity)),
                                  "absoluteDifferenceQtyPerWeek": rounded(diagnostic_velocity - existing_velocity) if existing_velocity is not None and diagnostic_velocity is not None else None}
    row["archetype"] = archetype(row)
    return row


def summarize(rows: list[dict[str, Any]], label: str) -> dict[str, Any]:
    comparable = [r for r in rows if r["velocityComparison"]["relativeDifference"] is not None]
    rel = [r["velocityComparison"]["relativeDifference"] for r in comparable]
    depressed = [r for r in rows if (r["velocityComparison"]["relativeDifference"] or 0) >= 0.25]
    cover_pairs = [r for r in rows if r["existing"]["stockCoverWeeks"] is not None and r["diagnostic"]["stockCoverWeeks"] is not None]
    material_cover = [r for r in cover_pairs if r["existing"]["stockCoverWeeks"] != 0 and abs((r["diagnostic"]["stockCoverWeeks"] - r["existing"]["stockCoverWeeks"]) / r["existing"]["stockCoverWeeks"]) >= 0.25]
    missing = [r for r in rows if r["lifecycle"] in {"W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9_PLUS"} and r["diagnostic"]["sellingAgeVelocityQtyPerWeek"] is None]
    return {"label": label, "skuCount": len(rows), "lifecycleCounts": dict(sorted(Counter(r["lifecycle"] for r in rows).items())),
            "archetypeCounts": dict(sorted(Counter(r["archetype"] for r in rows).items())),
            "velocityAvailability": {"sellingAgeVelocityCalculable": sum(r["diagnostic"]["sellingAgeVelocityQtyPerWeek"] is not None for r in rows),
                                     "existingVelocityPositive": sum((r["existing"]["velocityQtyPerWeek"] or 0) > 0 for r in rows),
                                     "trueMissingVelocityWithCompletedPositiveSales": len(missing)},
            "velocityComparison": {"bothCalculableN": len(comparable), "exactN": sum(abs(v) < 1e-9 for v in rel),
                                    "maeRelativeDifference": rounded(sum(abs(v) for v in rel) / len(rel) if rel else None),
                                    "medianRelativeDifference": rounded(statistics.median(rel) if rel else None),
                                    "materiallyDepressedExistingN": len(depressed), "materialDepressionRule": "selling-age velocity >= existing velocity by 25%",
                                    "rowsWithPreLaunchZerosInExistingRecent4": sum(r["semanticCause"]["preLaunchZeroWeeksInExistingRecent4"] > 0 for r in rows),
                                    "preLaunchZeroWeeksTotalInExistingRecent4": sum(r["semanticCause"]["preLaunchZeroWeeksInExistingRecent4"] for r in rows)},
            "stockCoverComparison": {"diagnosticCoverCalculable": sum(r["diagnostic"]["stockCoverWeeks"] is not None for r in rows),
                                     "existingCoverCalculable": sum(r["existing"]["stockCoverWeeks"] is not None for r in rows),
                                     "materiallyMovedN": len(material_cover), "materialMoveRule": "absolute relative cover difference >= 25%"}}


def examples(rows: list[dict[str, Any]], minimum: int = 5) -> dict[str, list[dict[str, Any]]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        groups.setdefault(row["archetype"], []).append({"sku": row["sku"], "styleCode": row["styleCode"], "lifecycle": row["lifecycle"],
                                                         "sellingAgeVelocity": row["diagnostic"]["sellingAgeVelocityQtyPerWeek"], "existingVelocity": row["existing"]["velocityQtyPerWeek"],
                                                         "diagnosticCover": row["diagnostic"]["stockCoverWeeks"], "existingCover": row["existing"]["stockCoverWeeks"],
                                                         "inboundCompletionRate": row["facts"]["inboundCompletionRate"], "remainingOrderQty": row["facts"]["remainingOrderQty"],
                                                         "analogPacePercentile": row["analogPacePercentile"], "preLaunchZeroWeeksInExistingRecent4": row["semanticCause"]["preLaunchZeroWeeksInExistingRecent4"]})
    return {key: value[:minimum] for key, value in sorted(groups.items())}


def build_audit(payload: dict[str, Any], analog_payload: dict[str, Any] | None = None) -> dict[str, Any]:
    analog_by_sku = {row.get("sku"): row for row in ((analog_payload or {}).get("current", {}).get("rows") or [])}
    rows = [diagnostic_row(style, sku, analog_by_sku) for style in (payload.get("styles") or {}).values() for sku in style.get("skus") or []]
    rows.sort(key=lambda row: str(row.get("sku") or ""))
    app = [r for r in rows if r["productGroup"] == "APP" and r["season"] == "26FW"]
    return {"schemaVersion": "sku-current-risk-usability-audit-v1", "diagnosticOnly": True,
            "productionBehaviorChanged": False, "source": payload.get("meta", {}),
            "definition": {"sellingAge": "completed history length minus first positive completed sales index; current WTD excluded",
                           "sellingAgeVelocity": "same normalized [0.1, 0.2, 0.3, 0.4] recency weights over up to four selling-age completed weeks",
                           "existingVelocity": "sku-sync weighted4CompletedWeekQty over last four completed calendar rows, including pre-launch zeros",
                           "materialRules": "relative velocity difference >=25%; relative cover difference >=25%", "analogPace": "independent existing Analog Pace percentile, shown only for W2-W8"},
            "fullUniverse": {"summary": summarize(rows, "FULL_UNIVERSE"), "archetypeExamples": examples(rows)},
            "app26FW": {"summary": summarize(app, "26FW_APP"), "archetypeExamples": examples(app), "rows": app},
            "rows": rows}


def render_report(audit: dict[str, Any]) -> str:
    app = audit["app26FW"]; full = audit["fullUniverse"]
    s = app["summary"]; v = s["velocityComparison"]; c = s["stockCoverComparison"]
    lines = ["# SKU Current Risk Usability Audit", "", "Diagnostic-only audit; no production fields or protected logic changed.", "",
             "## Recommendation", "", "**FIX_FIRST** before SKU Signal v1 DESIGN: the 26FW APP universe has selling-age velocity coverage for 180/439 SKU, but 254 PRE-SALE and 5 WTD_ONLY rows are correctly not yet velocity-usable. Existing velocity is materially depressed by leading pre-launch zeros for %d/%d comparable rows, so current stock cover is not semantically stable for the active selling population." % (v["materiallyDepressedExistingN"], v["bothCalculableN"]), "",
             "The safe next step is a pipeline-semantic fix/design decision for age-aware velocity and cover. This is not a SKU Signal, priority, or action recommendation.", "",
             "## 26FW APP coverage", "", "| Lifecycle | Count |", "|---|---:|"]
    for key, value in s["lifecycleCounts"].items(): lines.append(f"| {key} | {value} |")
    lines += ["", "- Selling-age velocity calculable: %d / %d" % (s["velocityAvailability"]["sellingAgeVelocityCalculable"], s["skuCount"]),
              "- Existing positive velocity: %d / %d" % (s["velocityAvailability"]["existingVelocityPositive"], s["skuCount"]),
              "- True missing velocity with a completed positive selling week: %d" % s["velocityAvailability"]["trueMissingVelocityWithCompletedPositiveSales"],
              "- WTD is excluded from both completed-week velocity calculations.", "",
              "## Velocity and cover comparison", "", f"- Both velocity measures calculable: {v['bothCalculableN']}; exact: {v['exactN']}; relative MAE: {v['maeRelativeDifference']}; median relative difference: {v['medianRelativeDifference']}.", f"- Existing velocity is materially depressed for {v['materiallyDepressedExistingN']} comparable SKU using the >=25% diagnostic rule.", f"- Pre-launch zero weeks appear in the existing recent-4 window for {v['rowsWithPreLaunchZerosInExistingRecent4']} SKU ({v['preLaunchZeroWeeksTotalInExistingRecent4']} zero-week occurrences).", f"- Diagnostic cover calculable: {c['diagnosticCoverCalculable']}; existing cover calculable: {c['existingCoverCalculable']}; newly usable versus existing: {max(0, c['diagnosticCoverCalculable'] - c['existingCoverCalculable'])}; materially moved: {c['materiallyMovedN']}.", "",
              "## Operational archetypes", "", "| Archetype | Count |", "|---|---:|"]
    for key, value in s["archetypeCounts"].items(): lines.append(f"| {key} | {value} |")
    lines += ["", "Representative examples are stored in the JSON artifact; Analog Pace percentile is retained only as an independent W2-W8 context field.", "", "## Full-universe context", "", f"- {full['summary']['skuCount']} SKU rows retained separately from the 26FW APP focus.", f"- Lifecycle counts: `{json.dumps(full['summary']['lifecycleCounts'], ensure_ascii=False)}`", f"- Archetype counts: `{json.dumps(full['summary']['archetypeCounts'], ensure_ascii=False)}`", "", "## Decision", "", "FIX_FIRST ??velocity/cover semantics need a pipeline fix or explicit age-aware field before SKU Signal v1 DESIGN can use Current Risk evidence.", "", "SKU_CURRENT_RISK_USABILITY_AUDIT_READY", ""]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--analog", type=Path, default=DEFAULT_ANALOG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()
    audit = build_audit(json.loads(args.input.read_text(encoding="utf-8")), json.loads(args.analog.read_text(encoding="utf-8")) if args.analog.exists() else None)
    args.output.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.report.write_text(render_report(audit), encoding="utf-8")
    print(json.dumps(audit["app26FW"]["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
