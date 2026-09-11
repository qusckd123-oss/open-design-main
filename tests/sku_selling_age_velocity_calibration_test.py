import unittest

from scripts.sku_current_risk_usability_audit import age_velocity
from scripts.sku_selling_age_velocity_calibration import selling_age_stock_cover, selling_age_velocity


class SellingAgeVelocityContractTest(unittest.TestCase):
    def test_w1_to_w4_normalized_recency_and_prelaunch_exclusion(self):
        h = [{"qty": 0}, {"qty": 0}, {"qty": 10}, {"qty": 20}, {"qty": 30}, {"qty": 40}]
        self.assertAlmostEqual(age_velocity(h[:3]), 10)
        self.assertAlmostEqual(age_velocity(h[:4]), 15.7142857)
        self.assertAlmostEqual(age_velocity(h[:5]), 22.2222222)
        self.assertAlmostEqual(age_velocity(h), 30)

    def test_zero_after_launch_and_returns_are_observed(self):
        self.assertAlmostEqual(age_velocity([{"qty": 0}, {"qty": 10}, {"qty": 0}, {"qty": -2}]), 1.3333333)

    def test_no_positive_sales_has_no_velocity(self):
        self.assertIsNone(age_velocity([{"qty": 0}, {"qty": -1}, {"qty": 0}]))

    def test_zero_and_negative_stock_are_not_clamped(self):
        velocity = selling_age_velocity([5])
        self.assertEqual(selling_age_stock_cover(0, velocity), 0)
        self.assertLess(selling_age_stock_cover(-10, velocity), 0)
        self.assertIsNone(selling_age_stock_cover(10, 0))


if __name__ == "__main__":
    unittest.main()
