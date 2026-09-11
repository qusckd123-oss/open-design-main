#!/usr/bin/env python3
"""Build a read-only SKU Signal v1 lifecycle/evidence state-machine snapshot.

The output is SKU-first and descriptive. It joins existing local evidence and
does not emit a score, rank, priority, recommendation, quantity, or action.
"""

from __future__ import annotations

import argparse
import json
import math
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SKU = ROOT / "data" / "sku-latest.json"
DEFAULT_ANALOG = ROOT / "data" / "sku-analog-pace-coverage-diagnostic.json"
DEFAULT_STYLE = ROOT / "data" / "latest.json"
DEFAULT_USABILITY = ROOT / "data" / "sku-current-risk-usability-audit.json"
DEFAULT_DESIGN = ROOT / "data" / "sku-signal-v1-design-diagnostic.json"
DEFAULT_OUTPUT = ROOT / "data" / "sku-signal-v1-state-machine.json"

LIFECYCLES = ("PRE_SALE", "WTD_ONLY", "W1", "W2-W8", "W9+")
LIFECYCLE_STAGES = {
    "PRE_SALE": "NO_POSITIVE_SALES",
    "WTD_ONLY": "POSITIVE_SALES_ONLY_IN_CURRENT_WTD",
    "W1": "FIRST_POSITIVE_COMPLETED_SELLING_WEEK",
    "W2-W8": "EARLY_PACE_APPLICABILITY_WINDOW",
    "W9+": "MATURE_SKU_CONTEXT",
}


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


def positive(value: Any) -> bool:
    parsed = number(value)
    return parsed is not None and parsed > 0


def completed_selling_age(history: list[dict[str, Any]]) -> int | None:
    first_positive = next(
        (index for index, item in enumerate(history) if positive(item.get("qty"))),
        None,
    )
    return len(history) - first_positive if first_positive is not None else None


def lifecycle_for(sku: dict[str, Any]) -> tuple[str, int | None]:
    history = sku.get("completedWeeklyHistory") or []
    selling_age = completed_selling_age(history)
    if selling_age is not None:
        if selling_age == 1:
            return "W1", selling_age
        if selling_age <= 8:
            return "W2-W8", selling_age
        return "W9+", selling_age
    if positive(sku.get("currentWtdQty")):
        return "WTD_ONLY", None
    return "PRE_SALE", None


def availability_for(lifecycle: str, has_cover: bool, has_pace: bool, has_forecast: bool) -> dict[str, str]:
    display_only = lifecycle in {"PRE_SALE", "WTD_ONLY", "W1"}
    completed_demand = (
        "UNAVAILABLE"
        if lifecycle in {"PRE_SALE", "WTD_ONLY"}
        else "DISPLAY_ONLY"
        if lifecycle == "W1"
        else "AVAILABLE"
    )
    trend = (
        "UNAVAILABLE"
        if lifecycle == "WTD_ONLY"
        else "DISPLAY_ONLY"
        if lifecycle in {"PRE_SALE", "W1"}
        else "AVAILABLE"
    )
    return {
        "lifecycle": "AVAILABLE",
        "completedDemand": completed_demand,
        "currentWtd": "DISPLAY_ONLY",
        "onHandInventory": "DISPLAY_ONLY" if display_only else "AVAILABLE",
        "stockCover": "UNAVAILABLE" if not has_cover else "DISPLAY_ONLY" if display_only else "AVAILABLE",
        "supply": "DISPLAY_ONLY" if display_only else "AVAILABLE",
        "analogPace": (
            "AVAILABLE" if lifecycle == "W2-W8" and has_pace else "MISSING" if lifecycle == "W2-W8" else "NOT_APPLICABLE"
        ),
        "trend": trend,
        "styleForecast": (
            "DISPLAY_ONLY" if lifecycle == "W9+" and has_forecast else "MISSING" if lifecycle == "W9+" else "NOT_APPLICABLE"
        ),
    }


def cover_fact(value: Any, velocity: Any) -> dict[str, Any]:
    raw_cover = number(value)
    denominator = number(velocity)
    available = raw_cover is not None and denominator is not None and denominator > 0
    reason = None
    if denominator is None:
        reason = "MISSING_VELOCITY"
    elif denominator <= 0:
        reason = "NON_POSITIVE_VELOCITY"
    elif raw_cover is None:
        reason = "MISSING_COVER"
    return {
        "value": raw_cover,
        "velocityDenominatorQtyPerWeek": denominator,
        "available": available,
        "unavailableReason": reason,
    }


def forecast_facts(raw: dict[str, Any]) -> dict[str, Any]:
    """Select non-routing STYLE Forecast facts; omit its categorical label."""
    return {
        key: raw.get(key)
        for key in (
            "eligible",
            "sellingWeekNumber",
            "firstPositiveSalesPeriod",
            "analogStyleCount",
            "analogCumulativeShare",
            "analogPaceRatio",
            "currentCumulativeSales",
            "baseForecastQty",
            "trendFactor",
            "trendAlpha",
            "adjustedForecastQty",
            "forecastSellThrough",
            "forecastConfidence",
            "referenceVersion",
        )
        if key in raw
    }


def build_row(
    style: dict[str, Any],
    sku: dict[str, Any],
    analog: dict[str, Any] | None,
    style_forecast: dict[str, Any] | None,
) -> dict[str, Any]:
    lifecycle, selling_age = lifecycle_for(sku)
    history = sku.get("completedWeeklyHistory") or []
    completed_qty = sum(number(item.get("qty")) or 0 for item in history)
    legacy_velocity = number(sku.get("weighted4CompletedWeekQty"))
    selling_age_velocity = number(sku.get("sellingAgeVelocityQtyPerWeek"))
    legacy_cover = cover_fact(sku.get("stockCoverWeeks"), legacy_velocity)
    selling_age_cover = cover_fact(sku.get("sellingAgeStockCoverWeeks"), selling_age_velocity)

    order_qty = number(sku.get("orderQty"))
    inbound_qty = number(sku.get("inboundQty"))
    inbound_completion = (
        inbound_qty / order_qty
        if order_qty is not None and order_qty > 0 and inbound_qty is not None
        else None
    )
    remaining_order = (
        order_qty - inbound_qty
        if order_qty is not None and inbound_qty is not None
        else None
    )

    raw_pace_exists = analog is not None and number(analog.get("analogPacePercentile")) is not None
    pace_available = lifecycle == "W2-W8" and raw_pace_exists
    raw_forecast_exists = bool(style_forecast)
    forecast_available = lifecycle == "W9+" and raw_forecast_exists

    conflicts: list[str] = []
    data_quality: list[str] = []
    if legacy_velocity is not None and selling_age_velocity is not None and legacy_velocity != selling_age_velocity:
        conflicts.append("LEGACY_VS_SELLING_AGE_VELOCITY_DIFFERENT")
    if legacy_cover["value"] is not None and selling_age_cover["value"] is not None and legacy_cover["value"] != selling_age_cover["value"]:
        conflicts.append("LEGACY_VS_SELLING_AGE_COVER_DIFFERENT")
    if lifecycle == "W2-W8" and not raw_pace_exists:
        data_quality.append("ANALOG_PACE_MISSING_IN_W2_W8")
    if lifecycle != "W2-W8" and raw_pace_exists:
        conflicts.append("ANALOG_PACE_PRESENT_OUTSIDE_W2_W8")
    if lifecycle != "W9+" and raw_forecast_exists:
        conflicts.append("STYLE_FORECAST_RAW_JOIN_OUTSIDE_W9_PLUS")
    if order_qty is None:
        data_quality.append("MISSING_ORDER_QTY")
    elif order_qty <= 0:
        data_quality.append("NON_POSITIVE_ORDER_QTY")
    if inbound_qty is None:
        data_quality.append("MISSING_INBOUND_QTY")
    if remaining_order is not None and remaining_order < 0:
        data_quality.append("NEGATIVE_REMAINING_ORDER")
    stock = number(sku.get("erpStockQty"))
    if stock is not None and stock < 0:
        data_quality.append("NEGATIVE_ERP_STOCK")
    if any(
        cover["value"] is not None and cover["value"] < 0
        for cover in (legacy_cover, selling_age_cover)
    ):
        data_quality.append("NEGATIVE_STOCK_COVER")

    pace_context = None
    if pace_available and analog is not None:
        pace_context = {
            "sellingWeek": analog.get("sellingWeek"),
            "percentile": number(analog.get("analogPacePercentile")),
            "paceIndex": number(analog.get("analogPaceIndex")),
            "method": analog.get("analogMethod"),
            "analogStyleCount": analog.get("analogStyleCount"),
            "missingnessReason": None,
        }

    return {
        "sku": sku.get("sku"),
        "styleCode": sku.get("styleCode") or style.get("styleCode"),
        "colorCode": sku.get("colorCode"),
        "lifecycle": lifecycle,
        "lifecycleStage": LIFECYCLE_STAGES[lifecycle],
        "evidenceAvailability": availability_for(
            lifecycle,
            legacy_cover["available"] or selling_age_cover["available"],
            pace_available,
            forecast_available,
        ),
        "demandFacts": {
            "cumulativeSalesQty": number(sku.get("cumulativeSalesQty")),
            "completedSalesQty": rounded(completed_qty),
            "currentWtdQty": number(sku.get("currentWtdQty")),
            "completedHistoryWeeks": len(history),
            "sellingAgeCompletedWeeks": selling_age,
            "firstPositiveCompletedSalesPeriod": next(
                (item.get("period") for item in history if positive(item.get("qty"))),
                None,
            ),
            "currentWtdPeriod": sku.get("currentWtdPeriod"),
            "lastCompletedWeekQty": number(sku.get("lastCompleteWeekQty")),
            "previousCompletedWeekQty": number(sku.get("previousCompleteWeekQty")),
            "legacyVelocityQtyPerWeek": legacy_velocity,
            "legacyVelocityAvailable": lifecycle not in {"PRE_SALE", "WTD_ONLY"} and positive(legacy_velocity),
            "sellingAgeVelocityQtyPerWeek": selling_age_velocity,
            "sellingAgeVelocityAvailable": positive(selling_age_velocity),
            "wtdExcludedFromVelocity": True,
        },
        "inventoryFacts": {
            "erpStockQty": stock,
            "legacyStockCoverWeeks": legacy_cover,
            "sellingAgeStockCoverWeeks": selling_age_cover,
        },
        "supplyFacts": {
            "orderQty": order_qty,
            "inboundQty": inbound_qty,
            "inboundCompletionRate": rounded(inbound_completion),
            "inboundCompletionAvailable": inbound_completion is not None,
            "inboundCompletionUnavailableReason": (
                "MISSING_ORDER_QTY"
                if order_qty is None
                else "NON_POSITIVE_ORDER_QTY"
                if order_qty <= 0
                else "MISSING_INBOUND_QTY"
                if inbound_qty is None
                else None
            ),
            "remainingOrderQty": rounded(remaining_order),
            "remainingOrderAvailable": remaining_order is not None,
            "remainingOrderUnavailableReason": (
                "MISSING_ORDER_QTY"
                if order_qty is None
                else "MISSING_INBOUND_QTY"
                if inbound_qty is None
                else None
            ),
        },
        "analogPaceContext": {
            "applicable": lifecycle == "W2-W8",
            "availability": "AVAILABLE" if pace_available else "MISSING" if lifecycle == "W2-W8" else "NOT_APPLICABLE",
            "rawJoinExists": analog is not None,
            "context": pace_context,
            "missingnessReason": (
                None
                if pace_available
                else (analog or {}).get("primaryFailureReason") or "ANALOG_PACE_ROW_MISSING"
                if lifecycle == "W2-W8"
                else None
            ),
        },
        "trendContext": {
            "value": sku.get("salesTrend"),
            "availability": availability_for(lifecycle, True, pace_available, forecast_available)["trend"],
        },
        "styleForecastContext": {
            "applicable": lifecycle == "W9+",
            "availability": "DISPLAY_ONLY" if forecast_available else "MISSING" if lifecycle == "W9+" else "NOT_APPLICABLE",
            "rawJoinExists": raw_forecast_exists,
            "displayOnly": lifecycle == "W9+" and raw_forecast_exists,
            "context": forecast_facts(style_forecast or {}) if forecast_available else None,
            "missingnessReason": "STYLE_FORECAST_RAW_JOIN_MISSING" if lifecycle == "W9+" and not raw_forecast_exists else None,
        },
        "conflicts": conflicts,
        "dataQuality": data_quality,
    }


def flatten_current_skus(payload: dict[str, Any]) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    return [
        (style, sku)
        for style in (payload.get("styles") or {}).values()
        if style.get("season") == "26FW" and style.get("productGroup") == "APP"
        for sku in style.get("skus") or []
    ]


def style_forecasts(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        str(row.get("sku")): row.get("forecastV1")
        for row in payload.get("styles") or []
        if row.get("season") == "26FW"
        and row.get("productGroup") == "APP"
        and isinstance(row.get("forecastV1"), dict)
    }


def count_markers(rows: list[dict[str, Any]], field: str) -> dict[str, int]:
    return dict(sorted(Counter(marker for row in rows for marker in row[field]).items()))


def build_state_machine(
    sku_payload: dict[str, Any],
    analog_payload: dict[str, Any],
    style_payload: dict[str, Any],
    usability_payload: dict[str, Any] | None = None,
    design_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    analog_by_sku = {
        str(row.get("sku")): row
        for row in analog_payload.get("current", {}).get("rows") or []
    }
    forecast_by_style = style_forecasts(style_payload)
    rows = [
        build_row(
            style,
            sku,
            analog_by_sku.get(str(sku.get("sku"))),
            forecast_by_style.get(str(sku.get("styleCode") or style.get("styleCode"))),
        )
        for style, sku in flatten_current_skus(sku_payload)
    ]
    rows.sort(key=lambda row: str(row.get("sku") or ""))

    lifecycle_counts = Counter(row["lifecycle"] for row in rows)
    evidence_counts = {
        "sellingAgeVelocityAvailable": sum(row["demandFacts"]["sellingAgeVelocityAvailable"] for row in rows),
        "sellingAgeStockCoverAvailable": sum(row["inventoryFacts"]["sellingAgeStockCoverWeeks"]["available"] for row in rows),
        "erpStockQtyAvailable": sum(row["inventoryFacts"]["erpStockQty"] is not None for row in rows),
        "orderQtyAvailable": sum(row["supplyFacts"]["orderQty"] is not None for row in rows),
        "inboundQtyAvailable": sum(row["supplyFacts"]["inboundQty"] is not None for row in rows),
        "remainingOrderAvailable": sum(row["supplyFacts"]["remainingOrderAvailable"] for row in rows),
        "analogPaceAvailableInW2W8": sum(
            row["lifecycle"] == "W2-W8" and row["analogPaceContext"]["availability"] == "AVAILABLE"
            for row in rows
        ),
        "styleForecastApplicableAvailable": sum(
            row["styleForecastContext"]["availability"] == "DISPLAY_ONLY" for row in rows
        ),
        "styleForecastContextNonNullOutsideW9Plus": sum(
            row["lifecycle"] != "W9+" and row["styleForecastContext"]["context"] is not None
            for row in rows
        ),
    }
    current_reference = (design_payload or {}).get("scope", {})
    usability_reference = (usability_payload or {}).get("app26FW", {}).get("summary", {})
    return {
        "schemaVersion": "sku-signal-v1-state-machine-v1",
        "readOnly": True,
        "productionBehaviorChanged": False,
        "analysisUnit": "COLOR_SKU",
        "source": {
            "skuSnapshot": sku_payload.get("meta", {}),
            "analogArtifact": {
                "name": "sku-analog-pace-coverage-diagnostic.json",
                "rowCount": len(analog_by_sku),
                "productionStatus": "HOLD",
            },
            "styleSnapshot": {
                key: style_payload.get("meta", {}).get(key)
                for key in ("source", "sourceUpdatedAt", "syncedAt", "weekLabel")
                if key in style_payload.get("meta", {})
            },
            "usabilityAuditSchema": (usability_payload or {}).get("schemaVersion"),
            "designDiagnosticSchema": (design_payload or {}).get("schemaVersion"),
        },
        "contract": {
            "preSale": "operational no-positive-sales state; launch status unknown",
            "wtdOnly": "positive sales only in current WTD; no completed W1 manufactured",
            "sellingAge": "completed history length minus first positive completed-sales index; post-launch zero weeks included",
            "wtd": "excluded from completed-week velocity and pacing",
            "analogPace": "joined existing context only in W2-W8; not recomputed",
            "styleForecast": "display-only context only in W9+ after SKU facts; never a SKU gate",
            "evidence": "independent fact families; never blended",
        },
        "summary": {
            "season": "26FW",
            "productGroup": "APP",
            "skuCount": len(rows),
            "lifecycleCounts": {key: lifecycle_counts.get(key, 0) for key in LIFECYCLES},
            "evidenceCounts": evidence_counts,
            "conflictCounts": count_markers(rows, "conflicts"),
            "dataQualityCounts": count_markers(rows, "dataQuality"),
            "sourceReconciliation": {
                "designDiagnosticSkuCount": current_reference.get("skuCount"),
                "designDiagnosticLifecycleCounts": current_reference.get("lifecycleCounts"),
                "usabilityVelocityAvailable": usability_reference.get("velocityAvailability", {}).get("sellingAgeVelocityCalculable"),
                "usabilityCoverAvailable": usability_reference.get("stockCoverComparison", {}).get("diagnosticCoverCalculable"),
            },
        },
        "rows": rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sku", type=Path, default=DEFAULT_SKU)
    parser.add_argument("--analog", type=Path, default=DEFAULT_ANALOG)
    parser.add_argument("--style", type=Path, default=DEFAULT_STYLE)
    parser.add_argument("--usability", type=Path, default=DEFAULT_USABILITY)
    parser.add_argument("--design", type=Path, default=DEFAULT_DESIGN)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    result = build_state_machine(
        json.loads(args.sku.read_text(encoding="utf-8")),
        json.loads(args.analog.read_text(encoding="utf-8")),
        json.loads(args.style.read_text(encoding="utf-8")),
        json.loads(args.usability.read_text(encoding="utf-8")),
        json.loads(args.design.read_text(encoding="utf-8")),
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
