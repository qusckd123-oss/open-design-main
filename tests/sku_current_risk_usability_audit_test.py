import unittest

from scripts.sku_current_risk_usability_audit import age_velocity, build_audit, selling_age


class SkuCurrentRiskUsabilityAuditTest(unittest.TestCase):
    def test_selling_age_ignores_leading_prelaunch_zeros(self):
        history = [{"period": "w0", "qty": 0}, {"period": "w1", "qty": 0}, {"period": "w2", "qty": 10}, {"period": "w3", "qty": 20}]
        self.assertEqual(selling_age(history), 2)
        self.assertAlmostEqual(age_velocity(history), 15.7142857)

    def test_wtd_is_not_a_completed_selling_week(self):
        payload = {"meta": {"sourceAsOf": "2026-09-09"}, "styles": {"S": {"styleCode": "S", "productGroup": "APP", "season": "26FW", "skus": [{
            "sku": "SBK", "colorCode": "BK", "orderQty": 10, "inboundQty": 10, "erpStockQty": 9,
            "completedWeeklyHistory": [{"period": "w1", "qty": 0}], "currentWtdQty": 1,
            "weighted4CompletedWeekQty": 0, "stockCoverWeeks": None,
        }]}}}
        row = build_audit(payload)["app26FW"]["rows"][0]
        self.assertEqual(row["lifecycle"], "WTD_ONLY")
        self.assertIsNone(row["diagnostic"]["sellingAgeVelocityQtyPerWeek"])
        self.assertNotEqual(row["facts"]["currentWtdQty"], 0)

    def test_prelaunch_zero_does_not_create_true_missing_velocity(self):
        payload = {"styles": {"S": {"styleCode": "S", "productGroup": "APP", "season": "26FW", "skus": [{
            "sku": "SBK", "colorCode": "BK", "orderQty": 10, "inboundQty": 10, "erpStockQty": 5,
            "completedWeeklyHistory": [{"qty": 0}, {"qty": 5}], "currentWtdQty": 0,
            "weighted4CompletedWeekQty": 2.5, "stockCoverWeeks": 2,
        }]}}}
        summary = build_audit(payload)["app26FW"]["summary"]
        self.assertEqual(summary["velocityAvailability"]["trueMissingVelocityWithCompletedPositiveSales"], 0)
        self.assertEqual(summary["velocityComparison"]["materiallyDepressedExistingN"], 1)

    def test_analog_pace_is_context_only_for_archetype(self):
        payload = {"styles": {"S": {"styleCode": "S", "productGroup": "APP", "season": "26FW", "skus": [{
            "sku": "SBK", "colorCode": "BK", "erpStockQty": 100,
            "completedWeeklyHistory": [{"qty": 0}, {"qty": 10}, {"qty": 20}, {"qty": 30}],
            "currentWtdQty": 0, "weighted4CompletedWeekQty": 20, "stockCoverWeeks": 5,
        }]}}}
        low = build_audit(payload, {"current": {"rows": [{"sku": "SBK", "analogPacePercentile": 10}]}})["app26FW"]["rows"][0]
        high = build_audit(payload, {"current": {"rows": [{"sku": "SBK", "analogPacePercentile": 90}]}})["app26FW"]["rows"][0]
        self.assertEqual(low["archetype"], high["archetype"])
        self.assertEqual(low["analogPacePercentile"], 10)
        self.assertEqual(high["analogPacePercentile"], 90)


if __name__ == "__main__":
    unittest.main()
