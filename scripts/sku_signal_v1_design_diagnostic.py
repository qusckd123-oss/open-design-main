#!/usr/bin/env python3
"""Build factual inputs for the SKU Signal v1 design proposal.

This is a read-only design diagnostic. It reports field availability and
cross-lens examples from existing local artifacts. It deliberately emits no
signal, score, rank, priority, recommendation, quantity, or automatic action.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any, Callable


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_USABILITY = ROOT / "data" / "sku-current-risk-usability-audit.json"
DEFAULT_SKU = ROOT / "data" / "sku-latest.json"
DEFAULT_STYLE = ROOT / "data" / "latest.json"
DEFAULT_AGE_CALIBRATION = ROOT / "data" / "sku-selling-age-velocity-calibration.json"
DEFAULT_PACE_CALIBRATION = ROOT / "data" / "sku-analog-pace-calibration.json"
DEFAULT_OUTPUT = ROOT / "data" / "sku-signal-v1-design-diagnostic.json"

# These cutoffs are copied only to reproduce already-published descriptive
# artifacts. They are not proposed business thresholds or future state rules.
REPORTED_PACE_SIMULATION_PERCENTILE = 75.0
REPORTED_LOW_COVER_WEEKS = 2.0
REPORTED_AMPLE_COVER_WEEKS = 4.0


def stage(lifecycle: str) -> str:
    if lifecycle in {f"W{week}" for week in range(2, 9)}:
        return "W2-W8"
    if lifecycle == "W9_PLUS":
        return "W9+"
    return lifecycle


def flatten_skus(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for style in (payload.get("styles") or {}).values():
        for sku in style.get("skus") or []:
            result[str(sku.get("sku"))] = sku
    return result


def style_context(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        str(row.get("sku")): row
        for row in payload.get("styles") or []
        if row.get("season") == "26FW" and row.get("productGroup") == "APP"
    }


def neutral_style_meta(payload: dict[str, Any]) -> dict[str, Any]:
    meta = payload.get("meta") or {}
    return {
        key: meta.get(key)
        for key in ["source", "sourceUpdatedAt", "syncedAt", "weekLabel", "currentWtdPeriod"]
        if key in meta
    }


def present(value: Any) -> bool:
    return value is not None and value != ""


def evidence_availability(
    rows: list[dict[str, Any]],
    sku_by_code: dict[str, dict[str, Any]],
    style_by_code: dict[str, dict[str, Any]],
) -> dict[str, dict[str, int]]:
    result: dict[str, dict[str, int]] = {}
    for stage_name in ["PRE_SALE", "WTD_ONLY", "W1", "W2-W8", "W9+"]:
        selected = [row for row in rows if stage(str(row.get("lifecycle"))) == stage_name]
        result[stage_name] = {
            "skuCount": len(selected),
            "onHandQtyAvailable": sum(present(row["facts"].get("erpStockQty")) for row in selected),
            "orderQtyAvailable": sum(present(row["facts"].get("orderQty")) for row in selected),
            "inboundQtyAvailable": sum(present(row["facts"].get("inboundQty")) for row in selected),
            "remainingCommittedSupplyCalculable": sum(
                present(row["facts"].get("remainingOrderQty")) for row in selected
            ),
            "remainingCommittedSupplyPositive": sum(
                (row["facts"].get("remainingOrderQty") or 0) > 0 for row in selected
            ),
            "legacyVelocityFieldPresent": sum(
                present(row["existing"].get("velocityQtyPerWeek")) for row in selected
            ),
            "legacyVelocitySemanticallyUsable": sum(
                stage_name not in {"PRE_SALE", "WTD_ONLY"}
                and (row["existing"].get("velocityQtyPerWeek") or 0) > 0
                for row in selected
            ),
            "sellingAgeVelocityAvailable": sum(
                present(row["diagnostic"].get("sellingAgeVelocityQtyPerWeek")) for row in selected
            ),
            "legacyStockCoverAvailable": sum(
                present(row["existing"].get("stockCoverWeeks")) for row in selected
            ),
            "sellingAgeStockCoverAvailable": sum(
                present(row["diagnostic"].get("stockCoverWeeks")) for row in selected
            ),
            "analogPaceAvailable": sum(present(row.get("analogPacePercentile")) for row in selected),
            "trendFieldPresent": sum(
                present(sku_by_code.get(str(row.get("sku")), {}).get("salesTrend"))
                for row in selected
            ),
            "styleForecastRawJoinAvailable": sum(
                present(style_by_code.get(str(row.get("styleCode")), {}).get("forecastV1"))
                for row in selected
            ),
            "styleForecastW9ContextApplicable": sum(
                stage_name == "W9+"
                and present(style_by_code.get(str(row.get("styleCode")), {}).get("forecastV1"))
                for row in selected
            ),
        }
    return result


def example(
    row: dict[str, Any],
    sku_by_code: dict[str, dict[str, Any]],
    style_by_code: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    sku = sku_by_code.get(str(row.get("sku")), {})
    style = style_by_code.get(str(row.get("styleCode")), {})
    forecast = style.get("forecastV1") or {}
    forecast_is_applicable = stage(str(row.get("lifecycle"))) == "W9+"
    return {
        "sku": row.get("sku"),
        "styleCode": row.get("styleCode"),
        "colorCode": row.get("colorCode"),
        "lifecycle": row.get("lifecycle"),
        "analogPacePercentile": row.get("analogPacePercentile"),
        "legacyVelocityQtyPerWeek": row["existing"].get("velocityQtyPerWeek"),
        "sellingAgeVelocityQtyPerWeek": row["diagnostic"].get("sellingAgeVelocityQtyPerWeek"),
        "legacyStockCoverWeeks": row["existing"].get("stockCoverWeeks"),
        "sellingAgeStockCoverWeeks": row["diagnostic"].get("stockCoverWeeks"),
        "erpStockQty": row["facts"].get("erpStockQty"),
        "remainingOrderQty": row["facts"].get("remainingOrderQty"),
        "inboundCompletionRate": row["facts"].get("inboundCompletionRate"),
        "salesTrend": sku.get("salesTrend"),
        "styleForecastRawJoinExists": bool(forecast),
        "styleForecastContext": forecast.get("forecastSignal") if forecast_is_applicable else None,
    }


def describe_group(
    rows: list[dict[str, Any]],
    predicate: Callable[[dict[str, Any]], bool],
    sku_by_code: dict[str, dict[str, Any]],
    style_by_code: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    selected = sorted((row for row in rows if predicate(row)), key=lambda row: str(row.get("sku")))
    return {
        "count": len(selected),
        "examples": [example(row, sku_by_code, style_by_code) for row in selected[:5]],
    }


def build_diagnostic(
    usability: dict[str, Any],
    sku_payload: dict[str, Any],
    style_payload: dict[str, Any],
    age_calibration: dict[str, Any] | None = None,
    pace_calibration: dict[str, Any] | None = None,
) -> dict[str, Any]:
    rows = usability["app26FW"]["rows"]
    sku_by_code = flatten_skus(sku_payload)
    style_by_code = style_context(style_payload)

    def age_cover(row: dict[str, Any]) -> float | None:
        return row["diagnostic"].get("stockCoverWeeks")

    def reported_higher_pace(row: dict[str, Any]) -> bool:
        pace = row.get("analogPacePercentile")
        return pace is not None and pace >= REPORTED_PACE_SIMULATION_PERCENTILE

    def reported_low_cover(row: dict[str, Any]) -> bool:
        cover = age_cover(row)
        return cover is not None and cover < REPORTED_LOW_COVER_WEEKS

    def reported_ample_cover(row: dict[str, Any]) -> bool:
        cover = age_cover(row)
        return cover is not None and cover >= REPORTED_AMPLE_COVER_WEEKS

    def has_pending_supply(row: dict[str, Any]) -> bool:
        return (row["facts"].get("remainingOrderQty") or 0) > 0

    def declining(row: dict[str, Any]) -> bool:
        return sku_by_code.get(str(row.get("sku")), {}).get("salesTrend") == "DECLINING"

    availability = evidence_availability(rows, sku_by_code, style_by_code)
    overall = Counter()
    for values in availability.values():
        for key, value in values.items():
            if key != "skuCount":
                overall[key] += value

    return {
        "schemaVersion": "sku-signal-v1-design-diagnostic-v1",
        "diagnosticOnly": True,
        "productionBehaviorChanged": False,
        "prohibitedOutputs": [
            "signal",
            "score",
            "rank",
            "priority",
            "reorder recommendation",
            "reorder quantity",
            "automatic action",
        ],
        "source": {
            "skuSnapshot": sku_payload.get("meta", {}),
            "usabilityAuditSchema": usability.get("schemaVersion"),
            "styleSnapshot": neutral_style_meta(style_payload),
        },
        "scope": {
            "season": "26FW",
            "productGroup": "APP",
            "skuCount": len(rows),
            "lifecycleCounts": {
                key: sum(stage(str(row.get("lifecycle"))) == key for row in rows)
                for key in ["PRE_SALE", "WTD_ONLY", "W1", "W2-W8", "W9+"]
            },
        },
        "evidenceAvailabilityByLifecycle": availability,
        "overallEvidenceAvailability": dict(sorted(overall.items())),
        "existingDescriptiveCriteria": {
            "status": "reported artifact only; not a business rule",
            "higherRelativePace": "Analog Pace percentile >=75, copied from the existing calibration simulation",
            "lowCover": "selling-age stock cover <2 weeks, copied from the existing usability archetype",
            "ampleCover": "selling-age stock cover >=4 weeks, copied from the existing usability archetype",
            "pendingSupply": "raw orderQty - inboundQty >0; quantity/ETA validity still requires human inspection",
        },
        "existingOperationalArchetypes": {
            "counts": usability["app26FW"]["summary"]["archetypeCounts"],
            "examples": usability["app26FW"]["archetypeExamples"],
        },
        "factualConflictIntersections": {
            "higherRelativePaceAndAmpleCover": describe_group(
                rows,
                lambda row: reported_higher_pace(row) and reported_ample_cover(row),
                sku_by_code,
                style_by_code,
            ),
            "higherRelativePaceAndLowCover": describe_group(
                rows,
                lambda row: reported_higher_pace(row) and reported_low_cover(row),
                sku_by_code,
                style_by_code,
            ),
            "lowCoverAndPendingSupply": describe_group(
                rows,
                lambda row: reported_low_cover(row) and has_pending_supply(row),
                sku_by_code,
                style_by_code,
            ),
            "lowCoverAndNoPendingSupply": describe_group(
                rows,
                lambda row: reported_low_cover(row) and not has_pending_supply(row),
                sku_by_code,
                style_by_code,
            ),
            "decliningTrendAndAmpleCover": describe_group(
                rows,
                lambda row: declining(row) and reported_ample_cover(row),
                sku_by_code,
                style_by_code,
            ),
            "styleForecastConflictAtApplicableW9Plus": {
                "count": 0,
                "examples": [],
                "reason": "Current 26FW APP snapshot has no W9+ SKU; raw STYLE joins are not stage-applicable evidence.",
            },
        },
        "historicalEvaluation": {
            "clean25FWSkuCount": (age_calibration or {}).get("meta", {}).get("cleanSkuCount"),
            "clean25FWStyleCount": (age_calibration or {}).get("meta", {}).get("cleanStyleCount"),
            "sellingAgeCheckpoints": (age_calibration or {}).get("meta", {}).get("weeks", []),
            "analogPaceCalibratedCheckpoints": (pace_calibration or {}).get("meta", {}).get("weeks", []),
            "canEvaluate": [
                "lifecycle/applicability from completed weekly demand",
                "legacy and selling-age velocity at W1-W8 checkpoints",
                "Analog Pace percentile at W2-W8 checkpoints",
                "trend derived from completed weekly demand",
                "relationship to final order sell-through as calibration outcome",
            ],
            "cannotEvaluateWithoutWeeklyErpSnapshots": [
                "as-of on-hand inventory",
                "true as-of ERP stock cover",
                "as-of inbound completion",
                "as-of remaining committed supply",
                "demand-versus-supply conflict states and their queue error rates",
            ],
            "nonErpProxyExcluded": "orderQty - observed cumulative sales is sensitivity context only, not ERP stock evidence",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--usability", type=Path, default=DEFAULT_USABILITY)
    parser.add_argument("--sku", type=Path, default=DEFAULT_SKU)
    parser.add_argument("--style", type=Path, default=DEFAULT_STYLE)
    parser.add_argument("--age-calibration", type=Path, default=DEFAULT_AGE_CALIBRATION)
    parser.add_argument("--pace-calibration", type=Path, default=DEFAULT_PACE_CALIBRATION)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    diagnostic = build_diagnostic(
        json.loads(args.usability.read_text(encoding="utf-8")),
        json.loads(args.sku.read_text(encoding="utf-8")),
        json.loads(args.style.read_text(encoding="utf-8")),
        json.loads(args.age_calibration.read_text(encoding="utf-8")),
        json.loads(args.pace_calibration.read_text(encoding="utf-8")),
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(diagnostic, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "scope": diagnostic["scope"],
                "overallEvidenceAvailability": diagnostic["overallEvidenceAvailability"],
                "factualConflictCounts": {
                    key: value["count"]
                    for key, value in diagnostic["factualConflictIntersections"].items()
                },
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
