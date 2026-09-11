"""Read-only Special Market/direct-ship applicability diagnostic.

This module does not change production risk, reorder, Forecast, Analog Pace, or
Action Engine behavior. Direct-ship evidence is exact-SKU only and is never
inferred from Special Market metadata, product names, style siblings, or data
anomalies.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SKU = ROOT / "data" / "sku-latest.json"
DEFAULT_STATE = ROOT / "data" / "sku-signal-v1-state-machine.json"
DEFAULT_EVIDENCE = ROOT / "config" / "special-market-direct-ship-evidence.json"
DEFAULT_OUTPUT = ROOT / "data" / "sku-special-market-applicability-diagnostic.json"


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def flatten_skus(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for style in payload.get("styles", {}).values():
        for sku in style.get("skus", []):
            rows.append(sku)
    return rows


def market_scope(value: Any) -> str:
    if value is True:
        return "SPECIAL_MARKET"
    if value is False:
        return "NOT_SPECIAL_MARKET_BY_CURRENT_METADATA"
    return "UNKNOWN"


def build_diagnostic(
    sku_payload: dict[str, Any],
    state_payload: dict[str, Any],
    evidence_payload: dict[str, Any],
) -> dict[str, Any]:
    all_skus = flatten_skus(sku_payload)
    rows = [row for row in all_skus if row.get("season") == "26FW" and row.get("productGroup") == "APP"]
    state_by_sku = {row["sku"]: row for row in state_payload.get("rows", [])}
    evidence_by_sku = {entry["sku"]: entry for entry in evidence_payload.get("entries", [])}

    result_rows: list[dict[str, Any]] = []
    for row in rows:
        sku = row["sku"]
        scope = market_scope(row.get("isSpecialMarket"))
        direct = evidence_by_sku.get(sku)
        direct_status = direct.get("directShipStatus") if direct else "UNKNOWN"
        state = state_by_sku.get(sku, {})
        quality = list(state.get("dataQuality", []))
        domestic_sensitive = sorted(
            marker
            for marker in quality
            if marker in {"NEGATIVE_ERP_STOCK", "NEGATIVE_STOCK_COVER"}
        )

        if direct_status == "CONFIRMED_DIRECT_SHIP":
            applicability = "NOT_APPLICABLE_CONFIRMED_DIRECT_SHIP"
            misclassification = "CONFIRMED"
            reason = "Exact-SKU direct-ship evidence makes domestic inbound/on-hand/cover interpretation not applicable."
        elif scope == "SPECIAL_MARKET":
            applicability = "REVIEW_REQUIRED_DIRECT_SHIP_UNKNOWN"
            misclassification = "POSSIBLE" if domestic_sensitive else "UNDETERMINED"
            reason = "Special Market metadata does not establish direct shipment; domestic supply interpretation requires shipment evidence."
        elif scope == "UNKNOWN":
            applicability = "UNKNOWN_MARKET_SCOPE"
            misclassification = "UNASSESSED"
            reason = "Current STYLE metadata did not resolve Special Market status and no direct-ship evidence exists."
        else:
            applicability = "NO_SPECIAL_MARKET_EXCEPTION_EVIDENCE"
            misclassification = "NOT_IDENTIFIED"
            reason = "Current metadata does not mark this SKU Special Market; direct-ship status remains unasserted."

        result_rows.append(
            {
                "sku": sku,
                "styleCode": row.get("styleCode"),
                "colorCode": row.get("colorCode"),
                "productName": row.get("productName"),
                "marketScope": scope,
                "marketScopeSource": row.get("isSpecialMarketSource"),
                "directShipStatus": direct_status,
                "directShipEvidence": direct,
                "domesticCurrentRiskApplicability": applicability,
                "domesticSupplyRiskMisclassificationPotential": misclassification,
                "applicabilityReason": reason,
                "demandEvidenceApplicability": "OBSERVED_DEMAND_REMAINS_SEPARATE",
                "domesticSupplySensitiveFacts": {
                    "orderQty": row.get("orderQty"),
                    "inboundQty": row.get("inboundQty"),
                    "cumulativeSalesQty": row.get("cumulativeSalesQty"),
                    "erpStockQty": row.get("erpStockQty"),
                    "stockCoverWeeks": row.get("stockCoverWeeks"),
                    "sellingAgeStockCoverWeeks": row.get("sellingAgeStockCoverWeeks"),
                    "dataQualityMarkers": domestic_sensitive,
                },
            }
        )

    special_rows = [row for row in result_rows if row["marketScope"] == "SPECIAL_MARKET"]
    candidates = [
        row for row in result_rows
        if row["domesticSupplyRiskMisclassificationPotential"] in {"CONFIRMED", "POSSIBLE"}
    ]
    direct_counts = Counter(row["directShipStatus"] for row in special_rows)
    applicability_counts = Counter(row["domesticCurrentRiskApplicability"] for row in result_rows)
    market_counts = Counter(row["marketScope"] for row in result_rows)

    return {
        "schemaVersion": 1,
        "diagnosticOnly": True,
        "productionBehaviorChanged": False,
        "analysisUnit": "SKU",
        "source": {
            "skuSnapshotAsOf": sku_payload.get("meta", {}).get("sourceAsOf"),
            "skuSnapshot": "data/sku-latest.json",
            "stateMachine": "data/sku-signal-v1-state-machine.json",
            "directShipEvidence": "config/special-market-direct-ship-evidence.json",
        },
        "contract": {
            "specialMarketMeaning": "Current metadata marker only; it does not prove direct shipment.",
            "directShipMeaning": "Exact-SKU evidence only. UNKNOWN is preserved when evidence is absent.",
            "noStylePropagation": True,
            "confirmedDirectShipEffect": "Domestic inbound, ERP on-hand, stock cover, and supply-risk interpretation are not applicable; observed demand remains separate.",
            "prohibitedInference": [
                "Do not infer direct shipment from isSpecialMarket=true.",
                "Do not infer direct shipment from a [대만] product-name marker.",
                "Do not propagate SKU evidence to another color or STYLE sibling.",
                "Do not infer direct shipment from negative stock, negative cover, sales greater than inbound, or missing domestic receipts.",
            ],
        },
        "summary": {
            "scope": "26FW APP",
            "skuCount": len(result_rows),
            "marketScopeCounts": dict(sorted(market_counts.items())),
            "specialMarketSkuCount": len(special_rows),
            "specialMarketStyleCount": len({row["styleCode"] for row in special_rows}),
            "specialMarketDirectShipStatusCounts": dict(sorted(direct_counts.items())),
            "domesticCurrentRiskApplicabilityCounts": dict(sorted(applicability_counts.items())),
            "confirmedMisclassificationSkuCount": sum(row["domesticSupplyRiskMisclassificationPotential"] == "CONFIRMED" for row in result_rows),
            "possibleMisclassificationSkuCount": sum(row["domesticSupplyRiskMisclassificationPotential"] == "POSSIBLE" for row in result_rows),
            "unassessedUnknownMarketSkuCount": sum(row["marketScope"] == "UNKNOWN" for row in result_rows),
            "identifiedCandidateSkuCount": len(candidates),
            "identifiedCandidateSkus": [row["sku"] for row in candidates],
        },
        "identifiedCandidates": candidates,
        "rows": result_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sku", type=Path, default=DEFAULT_SKU)
    parser.add_argument("--state", type=Path, default=DEFAULT_STATE)
    parser.add_argument("--evidence", type=Path, default=DEFAULT_EVIDENCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    result = build_diagnostic(load(args.sku), load(args.state), load(args.evidence))
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
