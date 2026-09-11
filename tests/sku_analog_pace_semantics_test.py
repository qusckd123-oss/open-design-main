import sys
import unittest

sys.path.insert(0, "scripts")
import sku_analog_pace_calibration as pace


class SellingWeekSemanticsTest(unittest.TestCase):
    def test_current_week_is_elapsed_from_first_positive(self):
        history = [{"qty": 0}] * 6 + [{"qty": 1}] + [{"qty": 0}] * 3
        self.assertEqual(pace.selling_week_from_history(history), 4)

    def test_current_progress_uses_latest_completed_period(self):
        target = {
            "firstPositiveIndex": 6,
            "orderQty": 10,
            "weekly": [{"cumulative": value} for value in [0, 0, 0, 0, 0, 0, 1, 2, 3, 4]],
        }
        self.assertEqual(pace.progress_at(target, 4, "orderQty"), 0.4)


if __name__ == "__main__":
    unittest.main()
