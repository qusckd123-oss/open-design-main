import unittest

from scripts.overseas_po_applicability import build_report, classify_rows


def row(style, color, po, qty):
    return {"styleCode": style, "colorCode": color, "poNumber": po, "orderQty": qty}


def sku(code, special=None):
    return {
        "sku": code,
        "styleCode": code[:-2],
        "colorCode": code[-2:],
        "season": "26FW",
        "productGroup": "APP",
        "isSpecialMarket": special,
        "orderQty": 0,
    }


class OverseasPoContractTest(unittest.TestCase):
    def setUp(self):
        self.rows = [
            row("WA2603DM01", "BK", "국내", 100),
            row("WA2603TW01", "BK", "대만", 10),
            row("WA2603JP01", "BK", "일본", 11),
            row("WA2603GL01", "BK", "글로벌", 12),
            row("WA2603OR01", "BK", "수주", 13),
            row("WA2603MX01", "BK", "국내", 500),
            row("WA2603MX01", "BK", "대만", 100),
            row("WA2603MX02", "BK", "국내", 300),
            row("WA2603MX02", "BK", "일본", 20),
            row("WA2603MX02", "BK", "글로벌", 30),
            row("WA2603DU01", "BK", "대만 수주", 14),
            row("WA2603CL01", "BK", "대만", 15),
            row("WA2603CL01", "WH", "국내", 200),
            row("WA2603SM01", "BK", "국내", 210),
            row("WA2603NM01", "BK", "일본", 16),
        ]
        codes = sorted({r["styleCode"] + r["colorCode"] for r in self.rows})
        sku_rows = [sku(code, True if code == "WA2603SM01BK" else None) for code in codes]
        for item in sku_rows:
            item["orderQty"] = sum(
                r["orderQty"]
                for r in self.rows
                if r["styleCode"] + r["colorCode"] == item["sku"]
            )
        self.sku_payload = {"styles": {"ALL": {"skus": sku_rows}}}
        self.analog_payload = {"current": {"rows": []}}

    def test_all_required_po_shapes_and_deduplicated_multi_keyword_row(self):
        rows = classify_rows(self.rows)
        by_sku = {r["sku"]: r for r in rows if r["sku"] not in {"WA2603MX01BK", "WA2603MX02BK"}}
        self.assertFalse(by_sku["WA2603DM01BK"]["isOverseasPo"])
        self.assertEqual(by_sku["WA2603TW01BK"]["classification"], "TAIWAN")
        self.assertEqual(by_sku["WA2603JP01BK"]["classification"], "JAPAN")
        self.assertEqual(by_sku["WA2603GL01BK"]["classification"], "GLOBAL")
        self.assertEqual(by_sku["WA2603OR01BK"]["classification"], "ORDER_ONLY")
        duplicate = by_sku["WA2603DU01BK"]
        self.assertEqual(duplicate["classification"], "TAIWAN")
        self.assertEqual(duplicate["matchedKeywords"], ["대만", "수주"])
        report = build_report(rows, self.sku_payload, self.analog_payload)
        self.assertEqual(report["summary"]["multiKeywordRowCount"], 1)
        self.assertEqual(report["summary"]["overseasPoRowCount"], 10)
        self.assertEqual(len(report["overseasPoRows"]), 10)

    def test_mixed_sku_excludes_only_overseas_rows(self):
        report = build_report(classify_rows(self.rows), self.sku_payload, self.analog_payload)
        by_sku = {r["sku"]: r for r in report["currentOrderReconciliation"]}
        self.assertEqual(by_sku["WA2603MX01BK"]["excelTotalOrderQty"], 600)
        self.assertEqual(by_sku["WA2603MX01BK"]["domesticOrderQty"], 500)
        self.assertEqual(by_sku["WA2603MX01BK"]["overseasOrderQty"], 100)
        self.assertEqual(by_sku["WA2603MX02BK"]["domesticOrderQty"], 300)
        self.assertEqual(by_sku["WA2603MX02BK"]["overseasOrderQty"], 50)

    def test_same_style_different_color_does_not_propagate(self):
        report = build_report(classify_rows(self.rows), self.sku_payload, self.analog_payload)
        self.assertIn("WA2603CL01BK", report["overseasOnlySkus"])
        self.assertNotIn("WA2603CL01WH", report["app26FwAffectedSkus"])

    def test_special_market_without_po_evidence_stays_unaffected(self):
        report = build_report(classify_rows(self.rows), self.sku_payload, self.analog_payload)
        self.assertNotIn("WA2603SM01BK", report["app26FwAffectedSkus"])

    def test_overseas_po_does_not_require_special_market_metadata(self):
        report = build_report(classify_rows(self.rows), self.sku_payload, self.analog_payload)
        self.assertIn("WA2603NM01BK", report["app26FwAffectedSkus"])

    def test_inbound_sales_and_stock_remain_unproven(self):
        report = build_report(classify_rows(self.rows), self.sku_payload, self.analog_payload)
        self.assertEqual(report["applicability"]["order"], "CONFIRMED_EXCLUDABLE_FROM_DOMESTIC_ORDER")
        self.assertEqual(report["applicability"]["inboundRule"], "CONFIRMED_EXCLUDABLE_FROM_DOMESTIC_INBOUND")
        self.assertEqual(report["applicability"]["inbound"], "NEEDS_ADDITIONAL_SOURCE")
        self.assertEqual(report["applicability"]["sales"], "DOMESTIC_SALES_EXCLUSION_NOT_PROVEN")
        self.assertEqual(report["applicability"]["erpStock"], "NEEDS_ADDITIONAL_SOURCE")


if __name__ == "__main__":
    unittest.main()
