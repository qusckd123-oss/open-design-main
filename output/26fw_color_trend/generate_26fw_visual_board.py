# -*- coding: utf-8 -*-
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT_DIR = Path("output/26fw_color_trend")
OUT_DIR.mkdir(parents=True, exist_ok=True)

PNG_PATH = OUT_DIR / "26FW_color_trend_visual_board.png"
PDF_PATH = OUT_DIR / "26FW_color_trend_visual_board.pdf"

W, H = 1654, 2339
M = 96
FONT_REG = "C:/Windows/Fonts/malgun.ttf"
FONT_BOLD = "C:/Windows/Fonts/malgunbd.ttf"
F = {
    "title": ImageFont.truetype(FONT_BOLD, 58),
    "sub": ImageFont.truetype(FONT_REG, 24),
    "h": ImageFont.truetype(FONT_BOLD, 31),
    "name": ImageFont.truetype(FONT_BOLD, 23),
    "code": ImageFont.truetype(FONT_REG, 18),
    "body": ImageFont.truetype(FONT_REG, 22),
    "small": ImageFont.truetype(FONT_REG, 17),
}

TEXT = "#171717"
MUTED = "#666666"
LINE = "#D8D8D8"
PAPER = "#F7F5F0"

WGSN = [
    ("Transformative Teal", "Coloro 092-37-14", "#315F5D", "대표/메인"),
    ("Wax Paper", "Coloro 035-88-12", "#F0E4B8", "뉴트럴"),
    ("Fresh Purple", "Coloro 136-32-33", "#6E3BAA", "포인트"),
    ("Cocoa Powder", "Coloro 008-35-06", "#5A3A33", "브라운"),
    ("Green Glow", "Coloro 057-82-32", "#C9D84A", "액센트"),
]

PANTONE_TOP = [
    ("Muted Clay", "16-1330 TCX", "#B9846A"),
    ("Neptune Green", "14-6017 TCX", "#8EB9A8"),
    ("Green Envy", "16-0541 TCX", "#9AA542"),
    ("Arabian Spice", "19-1245 TCX", "#844226"),
    ("Foxglove", "16-1710 TCX", "#B9839A"),
    ("Festival Fuchsia", "19-2434 TCX", "#A82E74"),
    ("Red Mahogany", "19-1521 TCX", "#6A2F32"),
    ("Acacia", "13-0640 TCX", "#D6D35D"),
    ("All Aboard", "17-4140 TCX", "#2F83B7"),
    ("Burnt Olive", "18-0521 TCX", "#6D6C3B"),
]

CORE = [
    ("Egret", "11-0103 TCX", "#F2E9D8"),
    ("Candied Ginger", "15-1213 TCX", "#CBA17B"),
    ("Toffee", "18-1031 TCX", "#8B623E"),
    ("Underworld", "17-4005 TCX", "#77797D"),
    ("Poseidon", "19-4033 TCX", "#1E4E73"),
]


def wrap(draw, text, font, max_width):
    out = []
    line = ""
    for word in text.split(" "):
        test = word if not line else f"{line} {word}"
        if draw.textlength(test, font=font) <= max_width:
            line = test
        else:
            if line:
                out.append(line)
            line = word
    if line:
        out.append(line)
    return out


def swatch_card(draw, x, y, w, h, color, name, code, note=None):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=16, fill="white", outline=LINE, width=2)
    draw.rounded_rectangle([x + 14, y + 14, x + w - 14, y + 14 + 150], radius=10, fill=color)
    yy = y + 184
    for line in wrap(draw, name, F["name"], w - 28):
        draw.text((x + 14, yy), line, font=F["name"], fill=TEXT)
        yy += 29
    draw.text((x + 14, yy + 4), code, font=F["code"], fill=MUTED)
    if note:
        draw.text((x + 14, y + h - 34), note, font=F["code"], fill=MUTED)


img = Image.new("RGB", (W, H), "#FFFFFF")
d = ImageDraw.Draw(img)

y = M
d.text((M, y), "26FW Trend Color Visual Board", font=F["title"], fill=TEXT)
y += 74
d.text((M, y), "출처 검증 완료: WGSN/Coloro 공식 5색 + Pantone NYFW AW26/27 공식 컬러", font=F["sub"], fill=MUTED)
y += 55
d.rounded_rectangle([M, y, W - M, y + 78], radius=16, fill=PAPER, outline="#E5E0D6")
d.text((M + 24, y + 23), "핵심 방향: 웜 뉴트럴·브라운·블랙 기반에 틸, 퍼플, 차트리스, 푸시아를 포인트로 사용", font=F["body"], fill=TEXT)
y += 126

d.text((M, y), "WGSN / Coloro A/W 26/27 Key Colours", font=F["h"], fill=TEXT)
y += 50
card_w, card_h, gap = 276, 292, 22
x = M
for name, code, color, note in WGSN:
    swatch_card(d, x, y, card_w, card_h, color, name, code, note)
    x += card_w + gap
y += card_h + 74

d.text((M, y), "Pantone NYFW AW26/27 Top 10", font=F["h"], fill=TEXT)
y += 50
card_w, card_h, gap_x, gap_y = 276, 246, 22, 26
for i, (name, code, color) in enumerate(PANTONE_TOP):
    row = i // 5
    col = i % 5
    swatch_card(d, M + col * (card_w + gap_x), y + row * (card_h + gap_y), card_w, card_h, color, name, code)
y += 2 * card_h + gap_y + 76

d.text((M, y), "Pantone Core / Seasonless Shades", font=F["h"], fill=TEXT)
y += 50
for i, (name, code, color) in enumerate(CORE):
    swatch_card(d, M + i * (card_w + gap_x), y, card_w, 236, color, name, code)
y += 286

d.rounded_rectangle([M, y, W - M, y + 132], radius=16, fill="#F2F7F6", outline="#D7E5E1")
d.text((M + 24, y + 22), "신뢰도 판단", font=F["h"], fill=TEXT)
d.text((M + 24, y + 70), "높음: WGSN/Coloro 공식 페이지와 Pantone 공식 배포 페이지에서 컬러명·코드 확인. 런웨이/리테일 리뷰는 보조 근거로 활용.", font=F["small"], fill=TEXT)

d.text((M, H - 58), "색상칩은 보고서용 근사 시각화입니다. 실제 원단/프린트 발주는 공식 Pantone TCX 또는 Coloro 실물 스와치 기준 확인 필요.", font=F["small"], fill=MUTED)

img.save(PNG_PATH)

pdf = canvas.Canvas(str(PDF_PATH), pagesize=A4)
page_w, page_h = A4
pdf.drawImage(str(PNG_PATH), 0, 0, width=page_w, height=page_h)
pdf.showPage()
pdf.save()

reader = PdfReader(str(PDF_PATH))
print(PNG_PATH.resolve())
print(PDF_PATH.resolve())
print(f"pages={len(reader.pages)} size={PDF_PATH.stat().st_size}")
