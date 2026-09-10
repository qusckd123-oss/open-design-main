from __future__ import annotations

import datetime as dt
import re
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.backends.backend_pdf import PdfPages


OUT_DIR = Path("output/reorder_analysis_SO04BK_SO04GR_260615")
OUT_PDF = OUT_DIR / "reorder_analysis_SO04BK_SO04GR_260615.pdf"
PREVIEW_PREFIX = "_preview_SO04BK_SO04GR_260615"
TARGETS = ["SO04 BK", "SO04 GR"]


@dataclass
class StyleData:
    sheet: str
    sku: str
    workbook_review_date: dt.date
    review_date: dt.date
    review_note: str
    inbound: int
    sales: int
    reorder_request: int
    first_reorder: int
    first_reorder_date: dt.date | None
    second_reorder: int
    second_reorder_date: dt.date | None
    weeks: list[dt.date]
    week_labels: list[str]
    weekly_sales: list[float]
    cum_sales: list[float]
    rates: list[float]


def set_font() -> None:
    available = {font.name for font in font_manager.fontManager.ttflist}
    for name in ["Malgun Gothic", "Noto Sans CJK KR", "Noto Sans KR", "Apple SD Gothic Neo"]:
        if name in available:
            plt.rcParams["font.family"] = name
            break
    plt.rcParams["axes.unicode_minus"] = False


def find_md() -> Path:
    matches = [p for p in Path(".").rglob("*.generated.md") if "(1" in p.name]
    if not matches:
        raise SystemExit("Converted Markdown for (1부) was not found.")
    return matches[0]


def parse_md(path: Path) -> dict[str, dict[str, str]]:
    sections: dict[str, dict[str, str]] = {}
    current = ""
    row_re = re.compile(r"^\|\s*([A-Z]+\d+)\s*\|\s*(.*?)\s*\|$")
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# Sheet:"):
            current = line.split(":", 1)[1].strip()
            sections[current] = {}
            continue
        match = row_re.match(line)
        if match and current:
            sections[current][match.group(1)] = match.group(2).strip()
    return sections


def col_to_num(col: str) -> int:
    n = 0
    for ch in col:
        n = n * 26 + ord(ch) - 64
    return n


def num_to_col(n: int) -> str:
    out = ""
    while n:
        n, r = divmod(n - 1, 26)
        out = chr(65 + r) + out
    return out


def parse_date(text: str) -> dt.date | None:
    if not text:
        return None
    iso = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", text)
    if iso:
        return dt.date(int(iso.group(1)), int(iso.group(2)), int(iso.group(3)))
    short = re.search(r"(?<!\d)(\d{1,2})[/-](\d{1,2})(?!\d)", text)
    if short:
        return dt.date(2026, int(short.group(1)), int(short.group(2)))
    return None


def number(text: str) -> int:
    match = re.search(r"-?\d[\d,]*(?:\.\d+)?", text or "")
    if not match:
        return 0
    return int(round(float(match.group(0).replace(",", ""))))


def scalar(text: str) -> float:
    if not text:
        return 0.0
    try:
        return float(text.replace(",", "").replace("%", "").strip())
    except ValueError:
        return float(number(text))


def review_index_for_date(weeks: list[dt.date], review_date: dt.date) -> int:
    prior = [idx for idx, week in enumerate(weeks) if week <= review_date]
    return prior[-1] if prior else 0


def infer_review_date(
    workbook_review_date: dt.date,
    workbook_sales: int,
    weeks: list[dt.date],
    cum_sales: list[float],
) -> tuple[dt.date, str]:
    if not weeks:
        return workbook_review_date, "B16 기준"
    idx = review_index_for_date(weeks, workbook_review_date)
    flow_sales = cum_sales[idx]
    if abs(flow_sales - workbook_sales) <= max(3, workbook_sales * 0.02):
        return workbook_review_date, "B16 기준"

    best_idx = min(range(len(cum_sales)), key=lambda i: abs(cum_sales[i] - workbook_sales))
    inferred = weeks[best_idx] + dt.timedelta(days=2)
    return inferred, f"B16 불일치: I4가 {weeks[best_idx].month}/{weeks[best_idx].day} 누적과 근접"


def load_style(cells: dict[str, str], sheet: str) -> StyleData:
    inbound = number(cells.get("I3", ""))
    workbook_sales = number(cells.get("I4", ""))
    workbook_review = parse_date(cells.get("B16", "")) or dt.date(2026, 6, 9)

    weeks: list[dt.date] = []
    labels: list[str] = []
    weekly: list[float] = []
    cumulative: list[float] = []
    rates: list[float] = []
    for idx in range(col_to_num("M"), col_to_num("AW") + 1):
        col = num_to_col(idx)
        week = parse_date(cells.get(f"{col}26", ""))
        if week is None:
            continue
        weeks.append(week)
        labels.append(f"{week.month}/{week.day}")
        weekly.append(scalar(cells.get(f"{col}27", "")))
        cumulative.append(scalar(cells.get(f"{col}29", "")))
        raw_rate = scalar(cells.get(f"{col}28", ""))
        rates.append(raw_rate * 100 if 0 <= raw_rate <= 3 else raw_rate)

    review_date, review_note = infer_review_date(workbook_review, workbook_sales, weeks, cumulative)
    row24_memo = " ".join(value for cell, value in cells.items() if re.fullmatch(r"[A-Z]+24", cell))
    first_reorder = 0
    first_reorder_date = None
    first_match = re.search(r"1차\s*리오더\s*([\d,]+)\s*PCS", row24_memo)
    if first_match:
        first_reorder = int(first_match.group(1).replace(",", ""))
    date_match = re.search(r"(?<!\d)(\d{1,2}/\d{1,2})(?!\d)", row24_memo)
    if date_match:
        first_reorder_date = parse_date(date_match.group(1))

    return StyleData(
        sheet=sheet,
        sku=cells.get("A5", sheet.replace(" ", "")),
        workbook_review_date=workbook_review,
        review_date=review_date,
        review_note=review_note,
        inbound=inbound,
        sales=workbook_sales,
        reorder_request=number(cells.get("I13", "")),
        first_reorder=first_reorder,
        first_reorder_date=first_reorder_date,
        second_reorder=number(cells.get("I13", "")),
        second_reorder_date=None,
        weeks=weeks,
        week_labels=labels,
        weekly_sales=weekly,
        cum_sales=cumulative,
        rates=rates,
    )


def enrich_reorder_list(data: StyleData, sections: dict[str, dict[str, str]]) -> StyleData:
    cells = sections.get("리오더 리스트", {})
    for cell, value in cells.items():
        if value != data.sku:
            continue
        row = re.search(r"\d+", cell)
        if not row:
            continue
        row_no = row.group(0)
        inbound_date = parse_date(cells.get(f"N{row_no}", ""))
        data.second_reorder_date = inbound_date
        return data
    data.second_reorder_date = None
    return data


def fmt_qty(value: float | int) -> str:
    return f"{int(round(value)):,}장"


def stockout(data: StyleData) -> tuple[str, int | None, str | None, str]:
    prev_label = "초기"
    for idx, rate in enumerate(data.rates):
        if rate >= 100:
            interval = f"{prev_label}~{data.week_labels[idx]}"
            status = "소진 완료" if data.weeks[idx] < data.review_date else "소진 예상"
            title = f"{interval} 사이 초도 재고 {status}"
            return title, idx, interval, status
        prev_label = data.week_labels[idx]
    return "표시 구간 내 초도 재고 완전 소진 예상 없음", None, None, "소진 예상"


def draw_card(ax, index: int, label: str, value: str, note: str, total: int) -> None:
    gap = 0.018
    width = (1 - gap * (total + 1)) / total
    x = gap + index * (width + gap)
    ax.add_patch(plt.Rectangle((x, 0.18), width, 0.68, fc="#fffdf8", ec="#d8cec0", lw=1.3))
    ax.text(x + 0.022, 0.64, label, fontsize=11, color="#6e665c", weight="bold", va="center")
    ax.text(x + 0.022, 0.40, value, fontsize=18, color="#111111", weight="bold", va="center")
    ax.text(x + 0.022, 0.22, note, fontsize=9.5, color="#7f776e", va="center")


def draw_legend(fig) -> None:
    legend_ax = fig.add_axes([0.08, 0.062, 0.84, 0.088], facecolor="#fffdf8")
    legend_ax.set_xlim(0, 1)
    legend_ax.set_ylim(0, 1)
    legend_ax.axis("off")
    legend_ax.add_patch(plt.Rectangle((0, 0.05), 1, 0.88, fc="#fffdf8", ec="#d8cec0", lw=1.1))
    items = [
        ("#d83a35", "-", "o", "초도 잔여 재고"),
        ("#222222", "-", None, "누적 판매량"),
        ("#1c6b8f", (0, (5, 4)), None, "누적 공급량"),
        ("#94c7c0", "-", None, "주차별 판매"),
        ("#9255de", "-.", None, "누적 소진율"),
    ]
    for idx, (color, linestyle, marker, label) in enumerate(items):
        col = idx % 3
        row = idx // 3
        x0 = 0.045 + col * 0.32
        y = 0.68 - row * 0.36
        legend_ax.plot(
            [x0, x0 + 0.065],
            [y, y],
            color=color,
            lw=2.8,
            ls=linestyle,
            marker=marker,
            ms=4 if marker else 0,
            markevery=[1] if marker else None,
            clip_on=False,
        )
        legend_ax.text(x0 + 0.08, y, label, fontsize=11, color="#3d3833", va="center")


def draw_page(pdf: PdfPages, data: StyleData, page_no: int) -> None:
    fig = plt.figure(figsize=(16, 11.3), facecolor="#f4efe8")
    fig.text(0.05, 0.93, f"{data.sku} 리오더 진행 근거", fontsize=28, weight="bold", color="#111111")
    fig.text(0.05, 0.885, "L25:AW29 예상 판매 흐름 기준", fontsize=16, color="#5d5750")
    fig.text(
        0.80,
        0.925,
        "2차 리오더",
        fontsize=14,
        weight="bold",
        color="white",
        ha="center",
        va="center",
        bbox={"boxstyle": "round,pad=0.55,rounding_size=0.2", "fc": "#125d73", "ec": "#125d73"},
    )

    cards_ax = fig.add_axes([0.05, 0.70, 0.90, 0.12])
    cards_ax.axis("off")
    cards = [
        ("1차 입고량", fmt_qty(data.inbound), "I3 기준"),
        ("현재 누적 판매", fmt_qty(data.sales), f"검토일 {data.review_date.isoformat()}"),
        ("현재 재고", fmt_qty(data.inbound - data.sales), "I3 - I4"),
        (
            "1차 리오더",
            fmt_qty(data.first_reorder),
            f"{data.first_reorder_date.month}/{data.first_reorder_date.day} 입고"
            if data.first_reorder_date
            else "시트 메모 기준",
        ),
        (
            "2차 리오더",
            fmt_qty(data.second_reorder),
            f"{data.second_reorder_date.month}/{data.second_reorder_date.day} 입고"
            if data.second_reorder_date
            else "리오더 리스트 기준",
        ),
    ]
    for idx, (label, value, note) in enumerate(cards):
        draw_card(cards_ax, idx, label, value, note, len(cards))

    stock_text, cross_idx, stock_interval, stock_status = stockout(data)
    chart_ax = fig.add_axes([0.08, 0.205, 0.82, 0.445], facecolor="#f4efe8")
    x = list(range(len(data.weeks)))
    supply = [data.inbound for _ in data.weeks]
    first_idx = None
    if data.first_reorder_date:
        first_idx = next((idx for idx, week in enumerate(data.weeks) if week >= data.first_reorder_date), None)
        if first_idx is not None:
            for idx in range(first_idx, len(supply)):
                supply[idx] += data.first_reorder
    second_idx = None
    if data.second_reorder_date:
        second_idx = next((idx for idx, week in enumerate(data.weeks) if week >= data.second_reorder_date), None)
        if second_idx is not None:
            for idx in range(second_idx, len(supply)):
                supply[idx] += data.second_reorder
    runway = [max(data.inbound - qty, 0) for qty in data.cum_sales]

    chart_ax.plot(x, runway, color="#d83a35", lw=2.4, marker="o", ms=3)
    chart_ax.plot(x, data.cum_sales, color="#222222", lw=2.6)
    chart_ax.plot(x, supply, color="#1c6b8f", lw=2.3, ls=(0, (5, 4)))
    chart_ax.plot(x, data.weekly_sales, color="#94c7c0", lw=2.1, alpha=0.9)

    rate_ax = chart_ax.twinx()
    rate_ax.plot(x, data.rates, color="#9255de", lw=2.6, ls="-.")
    rate_ax.set_ylabel("누적 소진율", fontsize=12, rotation=270, labelpad=18)
    rate_ax.set_ylim(0, max(110, max(data.rates) * 1.12 if data.rates else 110))

    y_top = max(max(data.cum_sales), data.inbound, max(data.weekly_sales)) * 1.08
    chart_ax.set_ylim(-max(y_top * 0.045, 40), y_top)
    review_idx = review_index_for_date(data.weeks, data.review_date)
    chart_ax.axvline(review_idx, color="#6d6254", lw=1.5, ls=(0, (2, 3)), alpha=0.75)
    current_rate = data.sales / data.inbound * 100 if data.inbound else 0
    chart_ax.text(
        min(review_idx + 0.4, len(x) - 3),
        y_top * 0.56,
        f"검토일 {data.review_date.month}/{data.review_date.day}\n판매율 {current_rate:.1f}%",
        fontsize=9.5,
        color="#5c4f43",
        bbox={"fc": "#fffdf8", "ec": "#b8a997", "pad": 4},
    )

    if cross_idx is not None and stock_interval:
        left = max(cross_idx - 1, 0)
        chart_ax.axvspan(left, cross_idx, color="#d83a35", alpha=0.10)
        chart_ax.text(
            max(cross_idx - 3.2, 0),
            y_top * 0.70,
            f"{stock_status}\n{stock_interval}",
            fontsize=10,
            color="#8b423d",
            bbox={"fc": "#fff4ee", "ec": "#d9a092", "pad": 4},
        )

    if first_idx is not None and data.first_reorder_date:
        chart_ax.axvline(first_idx, color="#c98135", lw=1.6, ls=":")
        label_x = min(first_idx + 0.15, len(x) - 4)
        chart_ax.text(
            label_x,
            y_top * 0.84,
            f"{data.first_reorder_date.month}/{data.first_reorder_date.day} 1차 리오더\n+{data.first_reorder:,}장",
            fontsize=9.5,
            color="#744817",
            bbox={"fc": "#fff7ec", "ec": "#dfb276", "pad": 4},
        )

    if second_idx is not None and data.second_reorder_date:
        chart_ax.axvline(second_idx, color="#c98135", lw=1.6, ls=":")
        label_y = y_top * 0.72
        label_x = min(second_idx + 0.15, len(x) - 3)
        chart_ax.text(
            label_x,
            label_y,
            f"{data.second_reorder_date.month}/{data.second_reorder_date.day} 2차 리오더\n+{data.second_reorder:,}장",
            fontsize=9.5,
            color="#744817",
            bbox={"fc": "#fff7ec", "ec": "#dfb276", "pad": 4},
        )

    final_label = data.week_labels[-1]
    final_sales = data.cum_sales[-1]
    final_rate = final_sales / data.inbound * 100 if data.inbound else 0
    chart_ax.annotate(
        f"{final_label} 예상\n판매 {final_sales:,.0f}장\n소진율 {final_rate:.1f}%",
        xy=(len(data.weeks) - 1, data.cum_sales[-1]),
        xytext=(0.78, 0.70),
        xycoords="data",
        textcoords=chart_ax.transAxes,
        fontsize=9.5,
        color="#5f503d",
        ha="left",
        va="top",
        arrowprops={"arrowstyle": "->", "color": "#8a7a61", "lw": 0.8},
        bbox={"fc": "#fff8eb", "ec": "#d8c9ad", "pad": 4},
    )

    chart_ax.set_title("초도 재고 소진 및 리오더 공급 흐름", loc="left", fontsize=18, weight="bold", pad=28)
    chart_ax.text(0, 1.04, stock_text, transform=chart_ax.transAxes, fontsize=12.5, color="#473f38")
    chart_ax.set_ylabel("수량", fontsize=12)
    chart_ax.set_xticks(x[::2])
    chart_ax.set_xticklabels(data.week_labels[::2], fontsize=9)
    chart_ax.grid(axis="y", color="#d9cfc1", lw=0.8)
    chart_ax.set_xlim(-0.5, len(x) - 0.5)

    draw_legend(fig)
    fig.text(
        0.05,
        0.035,
        "데이터 기준: Markdown 변환본. 누적 소진율은 I3(1차 입고량)만 100% 기준으로 계산하며, 소진 시점은 L25:AW29 판매 흐름 기준.",
        fontsize=10,
        color="#8a8177",
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT_DIR / f"{PREVIEW_PREFIX}_page{page_no}.png", dpi=150, facecolor=fig.get_facecolor())
    pdf.savefig(fig, facecolor=fig.get_facecolor())
    plt.close(fig)


def main() -> None:
    set_font()
    md = find_md()
    sections = parse_md(md)
    rows = ["sku\tsheet\tinbound\tcurrent_sales\tcurrent_inventory\treorder_qty\tworkbook_b16\tactive_review_date\treview_note\tstockout"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with PdfPages(OUT_PDF) as pdf:
        for page_no, target in enumerate(TARGETS, 1):
            data = enrich_reorder_list(load_style(sections[target], target), sections)
            draw_page(pdf, data, page_no)
            stock_text, _, _, _ = stockout(data)
            rows.append(
                "\t".join(
                    [
                        data.sku,
                        data.sheet,
                        str(data.inbound),
                        str(data.sales),
                        str(data.inbound - data.sales),
                        f"1차 {data.first_reorder} ({data.first_reorder_date}) / 2차 {data.second_reorder} ({data.second_reorder_date})",
                        data.workbook_review_date.isoformat(),
                        data.review_date.isoformat(),
                        data.review_note,
                        stock_text,
                    ]
                )
            )
            print(f"{data.sku}: {stock_text}; I3={data.inbound}, I4={data.sales}, I13={data.reorder_request}")
    (OUT_DIR / "summary.tsv").write_text("\n".join(rows) + "\n", encoding="utf-8")
    print(OUT_PDF)


if __name__ == "__main__":
    main()
