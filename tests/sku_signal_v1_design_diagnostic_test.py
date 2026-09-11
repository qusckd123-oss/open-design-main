import unittest

from scripts.sku_signal_v1_design_diagnostic import build_diagnostic


class SkuSignalV1DesignDiagnosticTest(unittest.TestCase):
    def test_reports_separate_demand_and_supply_intersections_without_action(self):
        rows = [
            {
                "sku": "S1BK", "styleCode": "S1", "colorCode": "BK", "lifecycle": "W3",
                "analogPacePercentile": 90,
                "facts": {"erpStockQty": 1, "orderQty": 100, "inboundQty": 60,
                          "remainingOrderQty": 40, "inboundCompletionRate": 0.6},
                "existing": {"velocityQtyPerWeek": 10, "stockCoverWeeks": 0.1},
                "diagnostic": {"sellingAgeVelocityQtyPerWeek": 10, "stockCoverWeeks": 0.1},
            },
            {
                "sku": "S2BK", "styleCode": "S2", "colorCode": "BK", "lifecycle": "W3",
                "analogPacePercentile": 90,
                "facts": {"erpStockQty": 1, "orderQty": 100, "inboundQty": 100,
                          "remainingOrderQty": 0, "inboundCompletionRate": 1},
                "existing": {"velocityQtyPerWeek": 10, "stockCoverWeeks": 0.1},
                "diagnostic": {"sellingAgeVelocityQtyPerWeek": 10, "stockCoverWeeks": 0.1},
            },
            {
                "sku": "S3BK", "styleCode": "S3", "colorCode": "BK", "lifecycle": "W9_PLUS",
                "analogPacePercentile": None,
                "facts": {"erpStockQty": 50, "orderQty": 100, "inboundQty": 100,
                          "remainingOrderQty": 0, "inboundCompletionRate": 1},
                "existing": {"velocityQtyPerWeek": 10, "stockCoverWeeks": 5},
                "diagnostic": {"sellingAgeVelocityQtyPerWeek": 10, "stockCoverWeeks": 5},
            },
        ]
        usability = {
            "schemaVersion": "test",
            "app26FW": {
                "rows": rows,
                "summary": {"archetypeCounts": {}},
                "archetypeExamples": {},
            },
        }
        sku_payload = {
            "styles": {
                "S1": {"skus": [{"sku": "S1BK", "salesTrend": "RISING"}]},
                "S2": {"skus": [{"sku": "S2BK", "salesTrend": "DECLINING"}]},
                "S3": {"skus": [{"sku": "S3BK", "salesTrend": "STABLE"}]},
            }
        }
        style_payload = {
            "styles": [
                {"sku": "S1", "season": "26FW", "productGroup": "APP",
                 "forecastV1": {"forecastSignal": "WATCH"}},
                {"sku": "S3", "season": "26FW", "productGroup": "APP",
                 "forecastV1": {"forecastSignal": "HIGH"}},
            ]
        }

        result = build_diagnostic(usability, sku_payload, style_payload)

        self.assertTrue(result["diagnosticOnly"])
        self.assertFalse(result["productionBehaviorChanged"])
        self.assertEqual(result["scope"]["lifecycleCounts"]["W2-W8"], 2)
        self.assertEqual(result["scope"]["lifecycleCounts"]["W9+"], 1)
        self.assertEqual(
            result["factualConflictIntersections"]["lowCoverAndPendingSupply"]["count"], 1
        )
        self.assertEqual(
            result["factualConflictIntersections"]["lowCoverAndNoPendingSupply"]["count"], 1
        )
        self.assertEqual(
            result["evidenceAvailabilityByLifecycle"]["W2-W8"]["analogPaceAvailable"], 2
        )
        self.assertEqual(
            result["evidenceAvailabilityByLifecycle"]["W9+"]["styleForecastW9ContextApplicable"], 1
        )
        early_example = result["factualConflictIntersections"]["lowCoverAndPendingSupply"]["examples"][0]
        self.assertTrue(early_example["styleForecastRawJoinExists"])
        self.assertIsNone(early_example["styleForecastContext"])
        self.assertNotIn("recommendedAction", result)
        self.assertNotIn("priority", result)


if __name__ == "__main__":
    unittest.main()
