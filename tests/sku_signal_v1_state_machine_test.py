import json
import unittest
from pathlib import Path

from scripts.sku_signal_v1_state_machine import build_state_machine


def sku_row(
    code="S1BK",
    style="S1",
    history=None,
    wtd=0,
    order=100,
    inbound=60,
    stock=40,
    legacy_velocity=10,
    age_velocity=10,
    legacy_cover=4,
    age_cover=4,
):
    return {
        "sku": code,
        "styleCode": style,
        "colorCode": "BK",
        "season": "26FW",
        "productGroup": "APP",
        "orderQty": order,
        "inboundQty": inbound,
        "cumulativeSalesQty": sum(x["qty"] for x in (history or [])) + wtd,
        "erpStockQty": stock,
        "completedWeeklyHistory": history or [],
        "currentWtdPeriod": "WTD",
        "currentWtdQty": wtd,
        "lastCompleteWeekQty": (history or [{}])[-1].get("qty"),
        "previousCompleteWeekQty": (history or [{}, {}])[-2].get("qty") if len(history or []) >= 2 else None,
        "weighted4CompletedWeekQty": legacy_velocity,
        "stockCoverWeeks": legacy_cover,
        "sellingAgeVelocityQtyPerWeek": age_velocity,
        "sellingAgeStockCoverWeeks": age_cover,
        "salesTrend": "RISING",
    }


def build(rows, analog_rows=None, forecasts=None):
    styles = {}
    for row in rows:
        styles.setdefault(
            row["styleCode"],
            {"styleCode": row["styleCode"], "season": "26FW", "productGroup": "APP", "skus": []},
        )["skus"].append(row)
    style_rows = [
        {"sku": style, "season": "26FW", "productGroup": "APP", "forecastV1": value}
        for style, value in (forecasts or {}).items()
    ]
    return build_state_machine(
        {"meta": {}, "styles": styles},
        {"current": {"rows": analog_rows or []}},
        {"meta": {}, "styles": style_rows},
    )


class SkuSignalV1StateMachineTest(unittest.TestCase):
    def test_post_launch_zero_week_counts_in_selling_age_and_wtd_does_not_manufacture_w1(self):
        selling = sku_row(history=[{"period": "W1", "qty": 2}, {"period": "W2", "qty": 0}], wtd=7)
        wtd_only = sku_row(code="S2BK", style="S2", history=[{"period": "W0", "qty": 0}], wtd=1)
        actual = {row["sku"]: row for row in build([selling, wtd_only])["rows"]}
        self.assertEqual(actual["S1BK"]["lifecycle"], "W2-W8")
        self.assertEqual(actual["S1BK"]["demandFacts"]["sellingAgeCompletedWeeks"], 2)
        self.assertEqual(actual["S2BK"]["lifecycle"], "WTD_ONLY")
        self.assertIsNone(actual["S2BK"]["demandFacts"]["sellingAgeCompletedWeeks"])

    def test_w9_with_style_forecast_is_display_only(self):
        row = sku_row(history=[{"period": f"W{i}", "qty": 1} for i in range(1, 10)])
        result = build([row], forecasts={"S1": {"adjustedForecastQty": 123, "forecastSignal": "HIGH"}})
        actual = result["rows"][0]
        self.assertEqual(actual["lifecycle"], "W9+")
        self.assertEqual(actual["styleForecastContext"]["availability"], "DISPLAY_ONLY")
        self.assertEqual(actual["styleForecastContext"]["context"]["adjustedForecastQty"], 123)
        self.assertNotIn("forecastSignal", actual["styleForecastContext"]["context"])

    def test_w9_without_style_forecast_keeps_row_with_missing_context(self):
        row = sku_row(history=[{"period": f"W{i}", "qty": 1} for i in range(1, 10)])
        result = build([row])
        self.assertEqual(len(result["rows"]), 1)
        self.assertEqual(result["rows"][0]["styleForecastContext"]["availability"], "MISSING")

    def test_w2_w8_joins_existing_analog_pace(self):
        row = sku_row(history=[{"period": "W1", "qty": 2}, {"period": "W2", "qty": 1}])
        pace = [{"sku": "S1BK", "sellingWeek": 2, "analogPacePercentile": 80, "analogPaceIndex": 1.2, "analogMethod": "STYLE_TOP5", "analogStyleCount": 5, "primaryFailureReason": "PACE_READY"}]
        actual = build([row], pace)["rows"][0]
        self.assertEqual(actual["analogPaceContext"]["context"]["percentile"], 80)
        self.assertNotIn("ANALOG_PACE_MISSING_IN_W2_W8", actual["dataQuality"])

    def test_w2_w8_missing_analog_is_factual_missingness_only(self):
        row = sku_row(history=[{"period": "W1", "qty": 2}, {"period": "W2", "qty": 1}])
        actual = build([row])["rows"][0]
        self.assertEqual(actual["analogPaceContext"]["availability"], "MISSING")
        self.assertIn("ANALOG_PACE_MISSING_IN_W2_W8", actual["dataQuality"])

    def test_non_positive_order_makes_completion_unavailable(self):
        for order in (0, -1):
            with self.subTest(order=order):
                actual = build([sku_row(order=order)])["rows"][0]
                self.assertIsNone(actual["supplyFacts"]["inboundCompletionRate"])
                self.assertIn("NON_POSITIVE_ORDER_QTY", actual["dataQuality"])

    def test_missing_inbound_makes_remaining_unavailable(self):
        actual = build([sku_row(inbound=None)])["rows"][0]
        self.assertFalse(actual["supplyFacts"]["remainingOrderAvailable"])
        self.assertIn("MISSING_INBOUND_QTY", actual["dataQuality"])

    def test_negative_remaining_is_preserved_without_clamp(self):
        actual = build([sku_row(order=10, inbound=12)])["rows"][0]
        self.assertEqual(actual["supplyFacts"]["remainingOrderQty"], -2)
        self.assertIn("NEGATIVE_REMAINING_ORDER", actual["dataQuality"])

    def test_zero_velocity_makes_cover_unavailable(self):
        actual = build([sku_row(legacy_velocity=0, age_velocity=0, legacy_cover=99, age_cover=99)])["rows"][0]
        self.assertFalse(actual["inventoryFacts"]["legacyStockCoverWeeks"]["available"])
        self.assertEqual(actual["inventoryFacts"]["legacyStockCoverWeeks"]["value"], 99)

    def test_negative_stock_and_cover_are_preserved_and_marked(self):
        actual = build([sku_row(stock=-5, legacy_cover=-0.5, age_cover=-0.5)])["rows"][0]
        self.assertEqual(actual["inventoryFacts"]["erpStockQty"], -5)
        self.assertEqual(actual["inventoryFacts"]["sellingAgeStockCoverWeeks"]["value"], -0.5)
        self.assertIn("NEGATIVE_ERP_STOCK", actual["dataQuality"])
        self.assertIn("NEGATIVE_STOCK_COVER", actual["dataQuality"])

    def test_style_context_never_changes_sku_membership_or_lifecycle(self):
        rows = [
            sku_row(code="S1BK", style="S1", history=[{"period": f"W{i}", "qty": 1} for i in range(1, 10)]),
            sku_row(code="S2BK", style="S2", history=[{"period": "W1", "qty": 1}, {"period": "W2", "qty": 1}]),
        ]
        without = build(rows)
        with_context = build(rows, forecasts={"S1": {"adjustedForecastQty": 500}, "S2": {"adjustedForecastQty": 500}})
        self.assertEqual([r["sku"] for r in without["rows"]], [r["sku"] for r in with_context["rows"]])
        self.assertEqual([r["lifecycle"] for r in without["rows"]], [r["lifecycle"] for r in with_context["rows"]])
        self.assertIsNone(with_context["rows"][1]["styleForecastContext"]["context"])


class CurrentSnapshotAcceptanceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        cls.artifact = json.loads((root / "data" / "sku-signal-v1-state-machine.json").read_text(encoding="utf-8"))

    def test_current_scope_and_evidence_reconcile(self):
        summary = self.artifact["summary"]
        self.assertEqual(summary["skuCount"], 439)
        self.assertEqual(
            summary["lifecycleCounts"],
            {"PRE_SALE": 254, "WTD_ONLY": 5, "W1": 31, "W2-W8": 149, "W9+": 0},
        )
        evidence = summary["evidenceCounts"]
        self.assertEqual(evidence["analogPaceAvailableInW2W8"], 149)
        self.assertEqual(evidence["sellingAgeVelocityAvailable"], 180)
        self.assertEqual(evidence["sellingAgeStockCoverAvailable"], 180)
        for key in ("erpStockQtyAvailable", "orderQtyAvailable", "inboundQtyAvailable", "remainingOrderAvailable"):
            self.assertEqual(evidence[key], 439)
        self.assertEqual(evidence["styleForecastContextNonNullOutsideW9Plus"], 0)

    def test_no_decision_output_or_candidate_human_label_is_assigned(self):
        forbidden_keys = {"signal", "score", "rank", "weight", "priority", "reorderTiming", "recommendedAction", "reorderQty", "action"}
        candidate_labels = {"OBSERVE", "DATA WAIT", "EARLY WATCH", "SUPPLY PENDING", "REORDER REVIEW", "HEALTHY", "NO URGENCY"}

        def inspect(value):
            if isinstance(value, dict):
                self.assertFalse(forbidden_keys.intersection(value))
                for nested in value.values():
                    inspect(nested)
            elif isinstance(value, list):
                for nested in value:
                    inspect(nested)
            elif isinstance(value, str):
                self.assertNotIn(value, candidate_labels)

        for row in self.artifact["rows"]:
            inspect(row)


if __name__ == "__main__":
    unittest.main()
