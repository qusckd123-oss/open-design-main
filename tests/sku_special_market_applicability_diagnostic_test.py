import unittest

from scripts.sku_special_market_applicability_diagnostic import build_diagnostic


def sku(code, style, special, stock=-10, cover=-1):
    return {
        "sku": code,
        "styleCode": style,
        "colorCode": code[-2:],
        "season": "26FW",
        "productGroup": "APP",
        "productName": "[대만] test" if special else "test",
        "isSpecialMarket": special,
        "isSpecialMarketSource": "LATEST" if special is not None else "UNKNOWN",
        "orderQty": 10,
        "inboundQty": 2,
        "cumulativeSalesQty": 5,
        "erpStockQty": stock,
        "stockCoverWeeks": cover,
        "sellingAgeStockCoverWeeks": cover,
    }


class ContractTest(unittest.TestCase):
    def setUp(self):
        self.sku_payload = {
            "meta": {"sourceAsOf": "2026-09-09"},
            "styles": {
                "S1": {"skus": [sku("S1BK", "S1", True), sku("S1GR", "S1", True)]},
                "S2": {"skus": [sku("S2BK", "S2", None)]},
            },
        }
        self.state_payload = {
            "rows": [
                {"sku": "S1BK", "dataQuality": ["NEGATIVE_ERP_STOCK", "NEGATIVE_STOCK_COVER"]},
                {"sku": "S1GR", "dataQuality": ["NEGATIVE_ERP_STOCK", "NEGATIVE_STOCK_COVER"]},
                {"sku": "S2BK", "dataQuality": []},
            ]
        }
        self.evidence = {
            "entries": [{"sku": "S1BK", "directShipStatus": "CONFIRMED_DIRECT_SHIP", "evidenceType": "USER_CONFIRMED"}]
        }

    def test_exact_sku_evidence_does_not_propagate_to_style_sibling(self):
        result = build_diagnostic(self.sku_payload, self.state_payload, self.evidence)
        rows = {row["sku"]: row for row in result["rows"]}
        self.assertEqual(rows["S1BK"]["directShipStatus"], "CONFIRMED_DIRECT_SHIP")
        self.assertEqual(rows["S1BK"]["domesticCurrentRiskApplicability"], "NOT_APPLICABLE_CONFIRMED_DIRECT_SHIP")
        self.assertEqual(rows["S1GR"]["directShipStatus"], "UNKNOWN")
        self.assertEqual(rows["S1GR"]["domesticSupplyRiskMisclassificationPotential"], "POSSIBLE")

    def test_unknown_market_remains_unknown(self):
        result = build_diagnostic(self.sku_payload, self.state_payload, self.evidence)
        row = next(row for row in result["rows"] if row["sku"] == "S2BK")
        self.assertEqual(row["marketScope"], "UNKNOWN")
        self.assertEqual(row["directShipStatus"], "UNKNOWN")
        self.assertEqual(row["domesticSupplyRiskMisclassificationPotential"], "UNASSESSED")


class CurrentSnapshotAcceptanceTest(unittest.TestCase):
    def test_current_counts_and_user_confirmed_sku(self):
        import json
        from pathlib import Path

        root = Path(__file__).resolve().parents[1]
        result = build_diagnostic(
            json.loads((root / "data/sku-latest.json").read_text(encoding="utf-8")),
            json.loads((root / "data/sku-signal-v1-state-machine.json").read_text(encoding="utf-8")),
            json.loads((root / "config/special-market-direct-ship-evidence.json").read_text(encoding="utf-8")),
        )
        summary = result["summary"]
        self.assertEqual(summary["skuCount"], 439)
        self.assertEqual(summary["specialMarketSkuCount"], 5)
        self.assertEqual(summary["specialMarketStyleCount"], 3)
        self.assertEqual(summary["confirmedMisclassificationSkuCount"], 1)
        self.assertEqual(summary["possibleMisclassificationSkuCount"], 4)
        self.assertEqual(summary["unassessedUnknownMarketSkuCount"], 295)
        row = next(row for row in result["rows"] if row["sku"] == "WA2603CRT1BK")
        self.assertEqual(row["directShipStatus"], "CONFIRMED_DIRECT_SHIP")
        self.assertIn("NEGATIVE_ERP_STOCK", row["domesticSupplySensitiveFacts"]["dataQualityMarkers"])


if __name__ == "__main__":
    unittest.main()
