from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[1]
SALES_ROOT = WORKSPACE / "추가 데이터" / "판매 데이터"
CURRENT_DIR = SALES_ROOT / "260810~260816"
PRIOR_DIR = SALES_ROOT / "260803~260809"


def style_category(style: str) -> str:
    match = re.match(r"^WA\d{4}([A-Z]{2})", style)
    return match.group(1) if match else "ETC"


def read_week_sales(path: Path) -> tuple[Counter[str], dict[str, str], Counter[str]]:
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    style_amount: Counter[str] = Counter()
    style_names: dict[str, str] = {}
    style_qty: Counter[str] = Counter()

    for row in sheet.iter_rows(min_row=3, values_only=True):
        style = row[4]
        if not isinstance(style, str) or not style.startswith("WA26"):
            continue

        amount = row[11] or 0
        qty = row[10] or 0
        style_amount[style] += float(amount)
        style_qty[style] += int(qty)
        style_names[style] = str(row[5] or style)

    return style_amount, style_names, style_qty


def read_inventory_for(styles: set[str]) -> dict[str, dict[str, Any]]:
    trend_file = CURRENT_DIR / "와키윌리_26SS 전상품 판매추이_260816.xlsx"
    workbook = openpyxl.load_workbook(trend_file, read_only=True, data_only=True)
    skip_sheets = {
        "TTL",
        "ERP RAW_260816",
        "26SS 기획현황",
        "상품기획안_종합",
        "회의양식(주간별 판매비교)",
        "회의양식(베스트10비교)",
    }
    found: dict[str, dict[str, Any]] = {}

    for sheet in workbook.worksheets:
        if sheet.title in skip_sheets or "품번별판매추이" in sheet.title:
            continue
        for row in sheet.iter_rows(min_row=1, max_col=32, values_only=True):
            style = row[7] if len(row) > 7 else None
            if style not in styles:
                continue

            in_qty = float(row[19] or 0)
            cum_qty = float(row[20] or 0)
            sell_rate = float(row[23] or 0)
            found[style] = {
                "category": row[5] or style_category(style),
                "name": row[8] or style,
                "inQty": in_qty,
                "cumQty": cum_qty,
                "stock": max(0, int(round(in_qty - cum_qty))),
                "sellThrough": round(sell_rate * 100, 1),
            }
            if styles <= found.keys():
                return found

    return found


def make_action(style: str, sales_m: float, wow: float | None, sell_through: float, stock: int) -> tuple[str, str, str]:
    if sell_through >= 65 and sales_m >= 8:
        return "리오더", "P1", "누계 판매율과 금주 매출이 모두 높아 추가 생산 검토 우선"
    if sell_through >= 55 and stock <= 350:
        return "리오더", "P1", "잔여 재고가 낮아 사이즈/컬러별 추가 물량 확인 필요"
    if wow is not None and wow <= -35 and stock >= 500:
        return "프로모션", "P3", "전주 대비 둔화와 재고 부담이 동시에 발생"
    if stock >= 800 and sell_through < 45:
        return "배분", "P2", "누계 판매율 대비 잔여 재고가 많아 채널 재배분 검토"
    return "배분", "P2", "금주 판매 흐름과 잔여 재고 기준으로 배분 유지"


def pct_change(current: float, prior: float) -> float:
    if prior == 0:
        return 0.0
    return (current - prior) / prior * 100


def main() -> None:
    current_sales, names, current_qty = read_week_sales(CURRENT_DIR / "판매집계현황 260810~260816.xlsx")
    prior_sales, _, _ = read_week_sales(PRIOR_DIR / "판매집계현황 260803~260809.xlsx")

    inventory = read_inventory_for(set(current_sales.keys()))

    current_by_category: Counter[str] = Counter()
    prior_by_category: Counter[str] = Counter()
    qty_by_category: Counter[str] = Counter()
    stock_by_category: Counter[str] = Counter()
    sold_by_category: Counter[str] = Counter()

    for style, amount in current_sales.items():
        category = style_category(style)
        current_by_category[category] += amount
        qty_by_category[category] += current_qty[style]

    for style, amount in prior_sales.items():
        prior_by_category[style_category(style)] += amount

    for style, row in inventory.items():
        category = style_category(style)
        stock_by_category[category] += row["stock"]
        sold_by_category[category] += row["cumQty"]

    top_categories = [category for category, _ in current_by_category.most_common(8)]
    categories = []
    for category in top_categories:
        current_m = round(current_by_category[category] / 1_000_000, 1)
        prior_m = round(prior_by_category[category] / 1_000_000, 1)
        stock = int(stock_by_category[category])
        sold = float(sold_by_category[category])
        sell_through = round(sold / (sold + stock) * 100, 1) if sold + stock > 0 else 0
        categories.append(
            {
                "category": category,
                "season": "26SS/26FW",
                "sales": current_m,
                "target": prior_m,
                "sellThrough": sell_through,
                "stock": stock,
                "yoy": round(pct_change(current_by_category[category], prior_by_category[category]), 1),
            }
        )

    styles = []
    for style, amount in current_sales.most_common(18):
        inv = inventory.get(style, {})
        sales_m = round(amount / 1_000_000, 1)
        prior = prior_sales.get(style, 0)
        wow = pct_change(amount, prior) if prior else None
        sell_through = float(inv.get("sellThrough", 0))
        stock = int(inv.get("stock", 0))
        action, priority, note = make_action(style, sales_m, wow, sell_through, stock)
        if wow is not None:
            note = f"{note} (전주 대비 {wow:+.1f}%)"

        styles.append(
            {
                "sku": style,
                "name": str(inv.get("name") or names.get(style) or style),
                "category": style_category(style),
                "season": "26SS/26FW",
                "sales": sales_m,
                "stock": stock,
                "sellThrough": sell_through,
                "action": action,
                "priority": priority,
                "note": note,
            }
        )

    current_total = sum(current_sales.values())
    prior_total = sum(prior_sales.values())
    total_wow = pct_change(current_total, prior_total)
    best_category = max(categories, key=lambda row: row["sales"]) if categories else None
    best_reorder = next((row for row in styles if row["action"] == "리오더"), styles[0] if styles else None)

    payload = {
        "meta": {
            "brand": "Wacky Willy",
            "season": "26SS/26FW",
            "weekLabel": "8월 2주차",
            "period": "260810~260816",
            "comparePeriod": "260803~260809",
            "amountUnit": "VAT- / 백만원",
            "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "source": "판매집계현황 260810~260816.xlsx, 판매집계현황 260803~260809.xlsx, 와키윌리_26SS 전상품 판매추이_260816.xlsx",
            "targetLabel": "전주 매출",
        },
        "categories": categories,
        "styles": styles,
        "launch": [
            {"label": "전주", "value": round(prior_total / 1_000_000, 1)},
            {"label": "금주", "value": round(current_total / 1_000_000, 1)},
        ],
        "summary": {
            "headline": f"8월 2주차 WA26 주간 매출은 {current_total / 100_000_000:.2f}억으로 전주 대비 {total_wow:+.1f}%입니다.",
            "message": (
                f"{best_category['category'] if best_category else 'ST'}가 금주 매출을 가장 크게 견인했습니다. "
                f"상위 스타일 중 {best_reorder['sku'] if best_reorder else '리오더 후보'}는 판매율/재고 기준으로 우선 점검하고, "
                "전주 대비 하락한 고재고 스타일은 채널 배분과 노출 조정을 병행해 확인하는 구조로 보겠습니다."
            ),
        },
    }

    output_paths = [
        ROOT / "data" / "latest.json",
        ROOT / "public" / "data" / "latest.json",
    ]
    for output_path in output_paths:
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    archive_name = "260810-260816.json"
    for archive_dir in [ROOT / "data" / "archive", ROOT / "public" / "data" / "archive"]:
        archive_dir.mkdir(parents=True, exist_ok=True)
        (archive_dir / archive_name).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"currentTotal": current_total, "priorTotal": prior_total, "styles": len(styles), "categories": len(categories)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
