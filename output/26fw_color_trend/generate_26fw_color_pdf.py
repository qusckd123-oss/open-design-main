# -*- coding: utf-8 -*-
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT_DIR = Path("output/26fw_color_trend")
OUT_DIR.mkdir(parents=True, exist_ok=True)
PDF_PATH = OUT_DIR / "26FW_color_trend_reliability_check.pdf"
PREVIEW_PATH = OUT_DIR / "26FW_color_trend_preview_page1.png"

W, H = 1654, 2339
M = 100
FONT_REG = "C:/Windows/Fonts/malgun.ttf"
FONT_BOLD = "C:/Windows/Fonts/malgunbd.ttf"
F = {
    "title": ImageFont.truetype(FONT_BOLD, 52),
    "h1": ImageFont.truetype(FONT_BOLD, 34),
    "body": ImageFont.truetype(FONT_REG, 24),
    "small": ImageFont.truetype(FONT_REG, 19),
    "tiny": ImageFont.truetype(FONT_REG, 16),
    "bold": ImageFont.truetype(FONT_BOLD, 24),
}

BLACK = "#151515"
TEXT = "#252525"
MUTED = "#666666"
LINE = "#D8D8D8"
BAND = "#222222"
NOTE = "#F5F3EE"

WGSN = [
    ("Transformative Teal", "Coloro 092-37-14", "#315F5D", "공식 확인. 2026 올해의 컬러. 다크 네이비와 아쿠아 그린 사이의 대체 다크."),
    ("Wax Paper", "Coloro 035-88-12", "#F0E4B8", "공식 확인. 따뜻한 크림 오프화이트. 26FW의 새로운 뉴트럴."),
    ("Fresh Purple", "Coloro 136-32-33", "#6E3BAA", "공식 확인. AI/피지컬 경험, 왕실성, 신비감이 결합된 선명한 퍼플."),
    ("Cocoa Powder", "Coloro 008-35-06", "#5A3A33", "공식 확인. 레드 기운의 초콜릿 브라운. 공예, 수공예, 슬로우 무드."),
    ("Green Glow", "Coloro 057-82-32", "#C9D84A", "공식 확인. 옐로우와 그린 사이의 고시인성 브라이트. 포인트 컬러 적합."),
]

PANTONE = [
    ("Muted Clay", "PANTONE 16-1330 TCX", "#B9846A", "공식 확인. 러스틱한 테라코타, 안정적인 웜 베이스."),
    ("Neptune Green", "PANTONE 14-6017 TCX", "#8EB9A8", "공식 확인. 레트로 감도의 아쿠아틱 그린."),
    ("Green Envy", "PANTONE 16-0541 TCX", "#9AA542", "공식 확인. 자연성과 모던 럭스를 잇는 그린."),
    ("Arabian Spice", "PANTONE 19-1245 TCX", "#844226", "공식 확인. 스파이스감 있는 어시 브라운."),
    ("Foxglove", "PANTONE 16-1710 TCX", "#B9839A", "공식 확인. 말바 기운의 부드러운 뮤트 핑크."),
    ("Festival Fuchsia", "PANTONE 19-2434 TCX", "#A82E74", "공식 확인. 선명하고 즐거운 카니발 핑크."),
    ("Red Mahogany", "PANTONE 19-1521 TCX", "#6A2F32", "공식 확인. 깊이감 있는 레드 브라운."),
    ("Acacia", "PANTONE 13-0640 TCX", "#D6D35D", "공식 확인. 그린 기운의 강한 옐로우."),
    ("All Aboard", "PANTONE 17-4140 TCX", "#2F83B7", "공식 확인. 하늘과 바다를 연상시키는 마리타임 블루."),
    ("Burnt Olive", "PANTONE 18-0521 TCX", "#6D6C3B", "공식 확인. 정제된 올리브 그린."),
]

CORE = [
    ("Egret", "PANTONE 11-0103 TCX", "#F2E9D8", "공식 확인. 따뜻한 크리미 화이트."),
    ("Candied Ginger", "PANTONE 15-1213 TCX", "#CBA17B", "공식 확인. 부드럽고 안정적인 웜 뉴트럴."),
    ("Toffee", "PANTONE 18-1031 TCX", "#8B623E", "공식 확인. 타임리스 브라운."),
    ("Underworld", "PANTONE 17-4005 TCX", "#77797D", "공식 확인. 단단한 미드 그레이."),
    ("Poseidon", "PANTONE 19-4033 TCX", "#1E4E73", "공식 확인. 신뢰감을 주는 오션 블루."),
]

SOURCES = [
    "WGSN official: https://www.wgsn.com/en/blogs/key-colours-aw-2627",
    "Coloro official: https://coloro.com/key-colors",
    "Pantone official distributor: https://www.pantone.com.br/artigos/fashion-color-trend-report/semana-de-moda-nova-york-outono-inverno-2026-2027/",
    "FashionUnited: https://fashionunited.uk/news/fashion/spotted-on-the-catwalk-wgsn-and-coloros-colour-trends-for-aw26-27/2024091377535",
    "Wallpaper*: https://www.wallpaper.com/fashion-beauty/trends-takeaways-aw-2026-season-fashion-week",
    "Who What Wear / Net-a-Porter: https://www.whowhatwear.com/fashion/runway/net-a-porter-fall-2026-trends",
    "Vogue Japan: https://www.vogue.co.jp/article/2026-27-aw-trend-color",
]


def wrap(draw, text, font, max_width):
    lines = []
    for para in text.split("\n"):
        line = ""
        for word in para.split(" "):
            test = word if not line else line + " " + word
            if draw.textlength(test, font=font) <= max_width:
                line = test
                continue
            if line:
                lines.append(line)
            if draw.textlength(word, font=font) <= max_width:
                line = word
            else:
                chunk = ""
                for ch in word:
                    if draw.textlength(chunk + ch, font=font) <= max_width:
                        chunk += ch
                    else:
                        lines.append(chunk)
                        chunk = ch
                line = chunk
        lines.append(line)
    return lines


def draw_text(draw, x, y, content, font, fill=TEXT, max_width=None, line_gap=8):
    if max_width is None:
        draw.text((x, y), content, font=font, fill=fill)
        return y + font.size + line_gap
    for line in wrap(draw, content, font, max_width):
        draw.text((x, y), line, font=font, fill=fill)
        y += font.size + line_gap
    return y


def note(draw, x, y, width, body):
    lines = wrap(draw, body, F["body"], width - 40)
    height = 34 + len(lines) * 34
    draw.rounded_rectangle([x, y, x + width, y + height], radius=12, fill=NOTE, outline="#E2DED3")
    yy = y + 22
    for line in lines:
        draw.text((x + 20, yy), line, font=F["body"], fill=TEXT)
        yy += 34
    return y + height + 28


def footer(draw, page_no):
    draw.text((M, H - 55), "26FW Color Trend Reliability Check | Open Design", font=F["tiny"], fill="#777777")
    draw.text((W - M - 20, H - 55), str(page_no), font=F["tiny"], fill="#777777")


def table_palette(draw, x, y, items, row_h):
    widths = [330, 310, 180, 650]
    headers = ["컬러", "코드/근거", "근사 스와치", "판단"]
    draw.rectangle([x, y, x + sum(widths), y + 48], fill=BAND)
    cx = x
    for i, header in enumerate(headers):
        draw.text((cx + 14, y + 13), header, font=F["small"], fill="white")
        cx += widths[i]
    y += 48
    for name, code, hex_value, desc in items:
        cx = x
        draw.rectangle([x, y, x + sum(widths), y + row_h], outline=LINE, width=1)
        draw.text((cx + 14, y + 22), name, font=F["bold"], fill=TEXT)
        cx += widths[0]
        draw.text((cx + 14, y + 22), code, font=F["small"], fill=MUTED)
        cx += widths[1]
        draw.rectangle([cx + 35, y + 22, cx + 145, y + 82], fill=hex_value, outline="#BDBDBD")
        cx += widths[2]
        yy = y + 17
        for line in wrap(draw, desc, F["small"], widths[3] - 28):
            draw.text((cx + 14, yy), line, font=F["small"], fill=TEXT)
            yy += 28
        y += row_h
    return y + 26


def table_info(draw, x, y):
    rows = [
        ("WGSN/Coloro 5 Key Colours", "높음", "WGSN 공식 블로그와 Coloro 스와치 페이지에서 동일한 5색 및 Coloro 코드 확인", "시즌 대표 컬러로 사용 가능"),
        ("Pantone NYFW AW26/27 Top 10 + Core 5", "높음", "Pantone 공식 배포 페이지에서 컬러명, TCX 코드, 설명 확인", "NYFW 기반 컬렉션 팔레트로 사용 가능"),
        ("런웨이/리테일 리뷰", "중간", "Wallpaper*, Who What Wear/Net-a-Porter, Vogue Japan에서 블랙, 퍼플, 차트리스, 무채색 흐름 확인", "상업 적용 우선순위 검토용"),
    ]
    widths = [380, 160, 650, 280]
    headers = ["구분", "신뢰도", "근거", "활용 판단"]
    draw.rectangle([x, y, x + sum(widths), y + 48], fill=BAND)
    cx = x
    for i, header in enumerate(headers):
        draw.text((cx + 14, y + 13), header, font=F["small"], fill="white")
        cx += widths[i]
    y += 48
    for row in rows:
        row_h = 132
        draw.rectangle([x, y, x + sum(widths), y + row_h], outline=LINE, width=1)
        cx = x
        for i, value in enumerate(row):
            yy = y + 18
            font = F["body"] if i == 1 else F["small"]
            for line in wrap(draw, value, font, widths[i] - 26):
                draw.text((cx + 13, yy), line, font=font, fill=TEXT)
                yy += 28
            cx += widths[i]
        y += row_h
    return y + 25


def new_page():
    image = Image.new("RGB", (W, H), "white")
    return image, ImageDraw.Draw(image)


pages = []

image, d = new_page()
y = M
for line in ["26FW 트렌드 컬러", "신뢰도 재점검"]:
    y = draw_text(d, M, y, line, F["title"], BLACK, W - 2 * M, 10)
y = draw_text(d, M, y + 5, "확인일: 2026-06-08 | 범위: AW26/27 패션 컬러 예측, NYFW AW26/27, 런웨이/리테일 리뷰", F["small"], MUTED, W - 2 * M)
y = note(d, M, y + 15, W - 2 * M, "결론: 26FW 컬러는 안정적인 뉴트럴·브라운·블랙을 베이스로 두고, 틸·퍼플·차트리스·푸시아를 포인트로 쓰는 방향이 가장 신뢰도 높습니다.")
y = draw_text(d, M, y, "신뢰도 요약", F["h1"], BLACK)
y = table_info(d, M, y + 8)
y = note(d, M, y, W - 2 * M, "주의: 이 문서의 색상칩은 보고서 가독성을 위한 근사 시각화입니다. 실제 원단/프린트 발주는 공식 Pantone TCX 또는 Coloro 실물 스와치 기준으로 확인해야 합니다.")
y = draw_text(d, M, y, "추천 적용", F["h1"], BLACK)
y = draw_text(d, M, y + 6, "베이스: Warm White, Black, Mid Gray, Cocoa/Toffee Brown, Burnt Olive\n메인 트렌드: Transformative Teal, Muted Clay, Neptune Green\n포인트: Fresh Purple, Green Glow/Acacia, Festival Fuchsia\n와키윌리식 적용: 티셔츠와 스웨트는 블랙·웜아이보리·브라운·올리브 중심, 그래픽/라벨/스티치/배색에 차트리스·퍼플·푸시아를 제한적으로 사용", F["body"], TEXT, W - 2 * M, 10)
footer(d, 1)
pages.append(image)

image, d = new_page()
y = M
y = draw_text(d, M, y, "WGSN / Coloro 공식 5 Key Colours", F["title"], BLACK, W - 2 * M)
y = draw_text(d, M, y, "공식 확인: WGSN “Key Colours A/W 26/27”, Coloro “Key Colors A/W 26/27”. 두 출처에서 동일한 컬러명과 Coloro 코드가 확인됩니다.", F["small"], MUTED, W - 2 * M)
y = table_palette(d, M, y + 20, WGSN, 142)
y = note(d, M, y, W - 2 * M, "신뢰도 판단: WGSN은 글로벌 트렌드 예측사, Coloro는 색상 시스템 및 스와치 제공처입니다. 시즌 약 2년 전 공개된 예측 컬러라 26FW 방향성 근거로 강합니다. 단, 실제 대중 시장 반영은 브랜드/카테고리별로 편차가 있습니다.")
footer(d, 2)
pages.append(image)

image, d = new_page()
y = M
y = draw_text(d, M, y, "Pantone NYFW AW26/27 컬러", F["title"], BLACK, W - 2 * M)
y = draw_text(d, M, y, "공식 확인: Pantone Fashion Color Trend Report - New York Fashion Week Autumn/Winter 2026/2027. Pantone 공식 배포 페이지에서 컬러명과 TCX 코드가 확인됩니다.", F["small"], MUTED, W - 2 * M)
y = draw_text(d, M, y + 15, "Top 10 Standout Colours", F["h1"], BLACK)
y = table_palette(d, M, y + 5, PANTONE, 104)
footer(d, 3)
pages.append(image)

image, d = new_page()
y = M
y = draw_text(d, M, y, "Pantone Core / Seasonless Shades", F["title"], BLACK, W - 2 * M)
y = table_palette(d, M, y + 15, CORE, 140)
y = draw_text(d, M, y + 15, "출처 재점검 및 컬러 채택 기준", F["h1"], BLACK)
y = draw_text(d, M, y + 5, "1. 1차 출처 또는 공식 배포처에서 컬러명과 코드가 확인되는가\n2. 복수 매체에서 같은 시즌 맥락으로 반복 언급되는가\n3. 런웨이/리테일 리뷰에서 실제 착장 또는 바잉 방향으로 연결되는가\n4. 국내 캐주얼 상품에 전개 가능한가", F["body"], TEXT, W - 2 * M, 10)
footer(d, 4)
pages.append(image)

image, d = new_page()
y = M
y = draw_text(d, M, y, "최종 판단", F["title"], BLACK, W - 2 * M)
y = draw_text(d, M, y + 20, "신뢰성 있는 컬러", F["h1"], BLACK)
y = draw_text(d, M, y + 5, "Transformative Teal, Wax Paper, Fresh Purple, Cocoa Powder, Green Glow, Pantone NYFW AW26/27 Top 10 및 Core 5는 공식/준공식 수준으로 확인되어 신뢰도 높음. 특히 틸, 웜 화이트, 브라운, 올리브, 퍼플·차트리스는 시즌 방향성이 서로 교차 확인됩니다.", F["body"], TEXT, W - 2 * M, 10)
y = draw_text(d, M, y + 20, "주의해서 볼 컬러", F["h1"], BLACK)
y = draw_text(d, M, y + 5, "Festival Fuchsia, Green Glow, Acacia 같은 고채도 컬러는 트렌드성은 강하지만 전판 컬러로 쓰면 판매 리스크가 큽니다. 그래픽, 라벨, 포인트 배색, 액세서리 중심 적용이 안전합니다. 블랙/그레이는 런웨이 흐름은 강하지만 새로운 컬러라기보다 26FW 미니멀/테일러링 흐름의 강화로 해석해야 합니다.", F["body"], TEXT, W - 2 * M, 10)
y = draw_text(d, M, y + 25, "출처 목록", F["h1"], BLACK)
for source in SOURCES:
    y = draw_text(d, M, y + 4, source, F["tiny"], MUTED, W - 2 * M, 7)
footer(d, 5)
pages.append(image)

png_paths = []
for i, page in enumerate(pages, 1):
    path = OUT_DIR / f"26FW_color_trend_page{i}.png"
    page.save(path)
    png_paths.append(path)
pages[0].save(PREVIEW_PATH)

pdf = canvas.Canvas(str(PDF_PATH), pagesize=A4)
page_width, page_height = A4
for path in png_paths:
    pdf.drawImage(str(path), 0, 0, width=page_width, height=page_height)
    pdf.showPage()
pdf.save()

reader = PdfReader(str(PDF_PATH))
print(PDF_PATH.resolve())
print(PREVIEW_PATH.resolve())
print(f"pages={len(reader.pages)} size={PDF_PATH.stat().st_size}")
