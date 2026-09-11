#!/usr/bin/env python3
"""Build a read-only, component-level SKU Current Risk diagnostic.

This deliberately does not produce a signal, priority, forecast, reorder action,
or production threshold. It only reshapes existing SKU facts into auditable
observations for design review.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if result == result else None


def rounded(value: float | None, digits: int = 4) -> float | None:
    return None if value is None else round(value, digits)


def cover_band(cover: float | None) -> str:
    if cover is None:
        return "UNKNOWN"
    if cover <= 0:
        return "ZERO"
    if cover < 2:
        return "UNDER_2_WEEKS"
    if cover <= 4:
        return "2_TO_4_WEEKS"
    return "OVER_4_WEEKS"


def inbound_completion_band(completion: float | None) -> str:
    if completion is None:
        return "UNKNOWN"
    if completion <= 0:
        return "NO_INBOUND"
    if completion < 1:
        return "PARTIAL"
    return "COMPLETE_OR_OVER"


def diagnostic_row(style: dict[str, Any], sku: dict[str, Any]) -> dict[str, Any]:
    order = number(sku.get("orderQty"))
    inbound = number(sku.get("inboundQty"))
    stock = number(sku.get("erpStockQty"))
    velocity = number(sku.get("weighted4CompletedWeekQty"))
    selling_age_velocity = number(sku.get("sellingAgeVelocityQtyPerWeek"))
    completed_history = sku.get("completedWeeklyHistory") or []
    completed_weeks = len(completed_history)
    completed_sales = sum(number(item.get("qty")) or 0 for item in completed_history)
    inbound_completion = inbound / order if order and order > 0 else None
    remaining_order = order - inbound if order is not None and inbound is not None else None
    stock_cover = number(sku.get("stockCoverWeeks"))
    selling_age_stock_cover = number(sku.get("sellingAgeStockCoverWeeks"))

    data_quality = []
    if completed_weeks == 0 or velocity is None or velocity <= 0:
        data_quality.append("NO_COMPLETED_VELOCITY")
    if order is None:
        data_quality.append("ORDER_MISSING")
    if inbound is None:
        data_quality.append("INBOUND_MISSING")
    if stock is None:
        data_quality.append("ERP_STOCK_MISSING")
    if stock_cover is None:
        data_quality.append("STOCK_COVER_MISSING")

    return {
        "sku": sku.get("sku"),
        "styleCode": sku.get("styleCode") or style.get("styleCode"),
        "colorCode": sku.get("colorCode"),
        "category": sku.get("category") or style.get("category"),
        "productGroup": sku.get("productGroup") or style.get("productGroup"),
        "season": sku.get("season") or style.get("season"),
        "facts": {
            "completedWeeks": completed_weeks,
            "completedSalesQty": rounded(completed_sales, 4),
            "completedVelocityQtyPerWeek": rounded(velocity, 4),
            "legacyVelocityQtyPerWeek": rounded(velocity, 4),
            "sellingAgeVelocityQtyPerWeek": rounded(selling_age_velocity, 4),
            "lastCompleteWeekQty": number(sku.get("lastCompleteWeekQty")),
            "previousCompleteWeekQty": number(sku.get("previousCompleteWeekQty")),
            "completedWeekWowPct": number(sku.get("completedWeekWow")),
            "erpStockQty": stock,
            "orderQty": order,
            "inboundQty": inbound,
            "inboundCompletionPct": rounded(inbound_completion * 100 if inbound_completion is not None else None),
            "remainingOrderQty": rounded(remaining_order),
            "salesTrend": sku.get("salesTrend"),
            "stockCoverWeeks": stock_cover,
            "legacyStockCoverWeeks": stock_cover,
            "sellingAgeStockCoverWeeks": selling_age_stock_cover,
        },
        "observations": {
            "stockCoverBand": cover_band(stock_cover),
            "inboundCompletionBand": inbound_completion_band(inbound_completion),
            "hasRemainingOrder": remaining_order is not None and remaining_order > 0,
            "hasErpStock": stock is not None and stock > 0,
            "trend": sku.get("salesTrend") or "UNKNOWN",
        },
        "dataQuality": data_quality,
    }


def build_diagnostic(payload: dict[str, Any]) -> dict[str, Any]:
    rows = []
    for style in (payload.get("styles") or {}).values():
        for sku in style.get("skus") or []:
            rows.append(diagnostic_row(style, sku))
    rows.sort(key=lambda row: str(row.get("sku") or ""))
    return {
        "schemaVersion": "sku-current-risk-diagnostic-v1",
        "diagnosticOnly": True,
        "source": payload.get("meta", {}),
        "definition": {
            "velocity": "existing weighted4CompletedWeekQty; completed weeks only",
            "sellingAgeVelocity": "separate sellingAgeVelocityQtyPerWeek field; completed weeks only; leading pre-launch zero weeks excluded; WTD excluded",
            "inboundCompletion": "inboundQty / orderQty * 100 when orderQty > 0",
            "remainingOrder": "max is not applied; raw orderQty - inboundQty",
            "trend": "existing salesTrend classification",
            "stockCover": "existing stockCoverWeeks",
            "sellingAgeStockCover": "separate sellingAgeStockCoverWeeks field; display-only comparison",
            "bands": "descriptive observation bands only; not business thresholds",
        },
        "summary": {
            "skuCount": len(rows),
            "noCompletedVelocityCount": sum("NO_COMPLETED_VELOCITY" in row["dataQuality"] for row in rows),
            "sellingAgeVelocityCount": sum(row["facts"]["sellingAgeVelocityQtyPerWeek"] is not None for row in rows),
            "sellingAgeStockCoverCount": sum(row["facts"]["sellingAgeStockCoverWeeks"] is not None for row in rows),
            "stockCoverBandCounts": counts(rows, "stockCoverBand"),
            "inboundCompletionBandCounts": counts(rows, "inboundCompletionBand"),
            "trendCounts": counts(rows, "trend"),
        },
        "rows": rows,
    }


def counts(rows: list[dict[str, Any]], key: str) -> dict[str, int]:
    result: dict[str, int] = {}
    for row in rows:
        value = row["observations"].get(key, "UNKNOWN")
        result[value] = result.get(value, 0) + 1
    return dict(sorted(result.items()))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("data/sku-latest.json"))
    parser.add_argument("--output", type=Path, default=Path("data/sku-current-risk-diagnostic.json"))
    args = parser.parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    result = build_diagnostic(payload)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
