import unittest

from scripts.sku_current_risk_diagnostic import build_diagnostic


class SkuCurrentRiskDiagnosticTest(unittest.TestCase):
    def test_keeps_components_independent_and_excludes_wtd_from_velocity(self):
        payload = {
            "meta": {"sourceAsOf": "2026-09-09"},
            "styles": {
                "WA2603ST51": {
                    "styleCode": "WA2603ST51",
                    "category": "ST",
                    "productGroup": "APP",
                    "skus": [{
                        "sku": "WA2603ST51BK", "colorCode": "BK",
                        "orderQty": 100, "inboundQty": 60, "erpStockQty": 20,
                        "weighted4CompletedWeekQty": 5, "lastCompleteWeekQty": 4,
                        "previousCompleteWeekQty": 6, "completedWeekWow": -33.3333,
                        "sellingAgeVelocityQtyPerWeek": 7,
                        "completedWeeklyHistory": [{"qty": 2}, {"qty": 3}],
                        "currentWtdQty": 99, "salesTrend": "DECLINING",
                        "stockCoverWeeks": 4,
                        "sellingAgeStockCoverWeeks": 2.8571,
                    }],
                }
            },
        }
        result = build_diagnostic(payload)
        row = result["rows"][0]
        self.assertTrue(result["diagnosticOnly"])
        self.assertEqual(row["facts"]["completedSalesQty"], 5)
        self.assertEqual(row["facts"]["completedVelocityQtyPerWeek"], 5)
        self.assertEqual(row["facts"]["legacyVelocityQtyPerWeek"], 5)
        self.assertEqual(row["facts"]["sellingAgeVelocityQtyPerWeek"], 7)
        self.assertEqual(row["facts"]["inboundCompletionPct"], 60)
        self.assertEqual(row["facts"]["remainingOrderQty"], 40)
        self.assertEqual(row["facts"]["legacyStockCoverWeeks"], 4)
        self.assertEqual(row["facts"]["sellingAgeStockCoverWeeks"], 2.8571)
        self.assertEqual(row["observations"]["stockCoverBand"], "2_TO_4_WEEKS")
        self.assertEqual(row["observations"]["inboundCompletionBand"], "PARTIAL")
        self.assertEqual(row["observations"]["trend"], "DECLINING")
        self.assertNotIn("currentWtdQty", row["facts"])
        self.assertNotIn("priority", row)
        self.assertNotIn("signal", row)

    def test_marks_missing_velocity_without_inventing_completed_week(self):
        payload = {"styles": {"X": {"styleCode": "X", "skus": [{
            "sku": "XBK", "orderQty": 10, "inboundQty": 0, "erpStockQty": 0,
            "completedWeeklyHistory": [], "currentWtdQty": 1,
            "stockCoverWeeks": None,
        }]}}}
        row = build_diagnostic(payload)["rows"][0]
        self.assertIn("NO_COMPLETED_VELOCITY", row["dataQuality"])
        self.assertEqual(row["facts"]["completedWeeks"], 0)
        self.assertEqual(row["observations"]["stockCoverBand"], "UNKNOWN")
        self.assertEqual(row["observations"]["inboundCompletionBand"], "NO_INBOUND")


if __name__ == "__main__":
    unittest.main()
