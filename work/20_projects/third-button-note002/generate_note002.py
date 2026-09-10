from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps


OUT_DIR = Path(__file__).resolve().parent
FINAL_PATH = OUT_DIR / "note002_bookpage.png"
PREVIEW_PATH = OUT_DIR / "note002_preview.png"

W, H = 1080, 1350
SCALE = 3
random.seed(2714)
np.random.seed(2714)

FONT_SERIF = Path(r"C:\Windows\Fonts\batang.ttc")
FONT_FALLBACK = Path(r"C:\Windows\Fonts\NotoSerifKR-VF.ttf")


def font(size: int) -> ImageFont.FreeTypeFont:
    source = FONT_SERIF if FONT_SERIF.exists() else FONT_FALLBACK
    return ImageFont.truetype(str(source), size=size)


def noise_layer(size: tuple[int, int], amount: float = 18, blur: float = 0) -> Image.Image:
    arr = np.random.normal(128, amount, (size[1], size[0])).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(arr, "L")
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    return img


def paper_texture(size: tuple[int, int]) -> Image.Image:
    base = Image.new("RGB", size, (219, 211, 193))
    w, h = size

    fine = noise_layer(size, 16, 0.08)
    broad = noise_layer(size, 30, 8.5)
    fibers = Image.new("L", size, 128)
    fd = ImageDraw.Draw(fibers)
    for _ in range(2200):
        y = random.randint(0, h - 1)
        x = random.randint(-120, w - 20)
        length = random.randint(24, 270)
        shade = random.randint(92, 176)
        fd.line((x, y, x + length, y + random.randint(-1, 1)), fill=shade, width=1)
    fibers = fibers.filter(ImageFilter.GaussianBlur(0.34))

    for layer, opacity in ((fine, 0.19), (broad, 0.12), (fibers, 0.13)):
        tint = ImageOps.colorize(layer, (179, 168, 145), (244, 238, 216)).convert("RGB")
        base = Image.blend(base, tint, opacity)

    # Uneven pulp clouds, stains, and handling tone keep the page from reading as a flat poster background.
    cloud = noise_layer(size, 34, 28.0)
    cloud_tint = ImageOps.colorize(cloud, (184, 172, 142), (238, 232, 210)).convert("RGB")
    base = Image.blend(base, cloud_tint, 0.17)

    stain = Image.new("L", size, 0)
    sd = ImageDraw.Draw(stain)
    for _ in range(26):
        cx = random.randint(-80, w + 80)
        cy = random.randint(-80, h + 80)
        rx = random.randint(80, 390)
        ry = random.randint(60, 310)
        sd.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=random.randint(9, 23))
    stain = stain.filter(ImageFilter.GaussianBlur(38))
    base = Image.composite(Image.new("RGB", size, (197, 183, 145)), base, stain)

    # Slight yellowing toward the paper edges.
    edge = Image.new("L", size, 0)
    ed = ImageDraw.Draw(edge)
    for i in range(0, 140):
        alpha = int(115 * (1 - i / 140) ** 1.7)
        ed.rectangle((i, i, w - 1 - i, h - 1 - i), outline=alpha, width=2)
    yellow = Image.new("RGB", size, (194, 174, 127))
    base = Image.composite(yellow, base, edge.filter(ImageFilter.GaussianBlur(24)))

    # A few tiny oxidation marks, kept quiet.
    d = ImageDraw.Draw(base, "RGBA")
    for _ in range(360):
        x, y = random.randrange(w), random.randrange(h)
        r = random.choice([1, 1, 1, 2, 2, 3])
        c = random.choice([(116, 87, 51, 18), (89, 73, 58, 13), (154, 120, 62, 15)])
        d.ellipse((x - r, y - r, x + r, y + r), fill=c)

    return base


def add_soft_scan_shadow(canvas: Image.Image, page_mask: Image.Image, offset: tuple[int, int]) -> None:
    for blur, alpha, dx, dy in ((34, 42, 5, 10), (9, 20, -3, 2), (70, 16, 0, 22)):
        sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        a = page_mask.filter(ImageFilter.GaussianBlur(blur))
        shadow = Image.new("RGBA", canvas.size, (44, 36, 25, alpha))
        sh = Image.composite(shadow, sh, a)
        canvas.alpha_composite(sh, (dx, dy))


def draw_faded_text(
    page: Image.Image,
    xy: tuple[int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    tracking_jitter: bool = False,
) -> None:
    layer = Image.new("RGBA", page.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = xy
    if tracking_jitter:
        cx = x
        for ch in text:
            d.text((cx + random.uniform(-0.25, 0.25), y + random.uniform(-0.18, 0.18)), ch, font=fnt, fill=fill)
            bbox = d.textbbox((0, 0), ch, font=fnt)
            cx += bbox[2] - bbox[0] + random.choice([0, 0, 1])
    else:
        d.text((x, y), text, font=fnt, fill=fill)

    # Old paperback ink is a little soft and uneven, but still legible.
    dropout = noise_layer(page.size, 18, 0.2)
    dropout = Image.eval(dropout, lambda px: int(218 + px * 37 / 255))
    text_alpha = layer.getchannel("A")
    text_alpha = ImageChops.multiply(text_alpha, dropout)
    layer.putalpha(text_alpha)
    bleed = layer.filter(ImageFilter.GaussianBlur(0.24))
    page.alpha_composite(bleed)
    page.alpha_composite(layer)


def make_page() -> Image.Image:
    pw, ph = 940 * SCALE, 1204 * SCALE
    page = paper_texture((pw, ph)).convert("RGBA")
    d = ImageDraw.Draw(page, "RGBA")

    small = font(14 * SCALE)
    body = font(23 * SCALE)
    footer = font(13 * SCALE)
    tiny = font(11 * SCALE)

    left = 166 * SCALE
    top = 192 * SCALE
    line_h = 42 * SCALE
    para_gap = 28 * SCALE
    ink = (45, 41, 36, 182)
    light_ink = (72, 65, 56, 88)

    # Natural book furniture: page number, quiet enough not to read as a brand mark.
    draw_faded_text(page, (pw - 205 * SCALE, 92 * SCALE), "002", small, (64, 58, 49, 62), False)

    paragraphs = [
        ["처음 놓인 단추가 아니어도 좋았다.", "가장 먼저 보이는 것은 언제나 쉽게 닳았다."],
        ["우리가 오래 기억하는 것들은 대개 조금 아래에 있었다.", "손이 자주 닿는 자리, 익숙한 주름, 매일 같은 온도.", "새롭지 않아서 더 오래 남는 것들."],
        ["써드 버튼은 그런 평범한 물건들의 위치를 생각한다.", "크게 말하지 않아도, 결국 다시 찾게 되는 것들에 대하여."],
    ]

    y = top
    highlight_text = "새롭지 않아서 더 오래 남는 것들."
    highlight_box = None
    for para in paragraphs:
        for line in para:
            if line == highlight_text:
                bbox = d.textbbox((left, y), line, font=body)
                highlight_box = (left - 5 * SCALE, y + 8 * SCALE, bbox[2] + 6 * SCALE, y + 33 * SCALE)
                marker = Image.new("RGBA", page.size, (0, 0, 0, 0))
                md = ImageDraw.Draw(marker, "RGBA")
                pts = [
                    (highlight_box[0], highlight_box[1] + random.randint(-2, 2) * SCALE),
                    (highlight_box[2], highlight_box[1] + random.randint(-1, 2) * SCALE),
                    (highlight_box[2] - 4 * SCALE, highlight_box[3] + random.randint(-1, 2) * SCALE),
                    (highlight_box[0] + 3 * SCALE, highlight_box[3] + random.randint(-2, 1) * SCALE),
                ]
                md.polygon(pts, fill=(181, 154, 102, 34))
                marker = marker.filter(ImageFilter.GaussianBlur(1.5 * SCALE))
                page.alpha_composite(marker)

            draw_faded_text(page, (left + random.randint(-1, 1) * SCALE, y), line, body, ink, False)
            y += line_h
        y += para_gap

    # Faint pencil-like underline under the highlighted sentence, not a poster accent.
    if highlight_box:
        ux1, uy1, ux2, uy2 = highlight_box
        d.line(
            (ux1 + 11 * SCALE, uy2 + 8 * SCALE, ux2 - 17 * SCALE, uy2 + 5 * SCALE),
            fill=(112, 88, 52, 27),
            width=1 * SCALE,
        )

    # A faint gutter-like tone gives the page a photographed paperback feel.
    gutter = Image.new("RGBA", page.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(gutter, "RGBA")
    gd.rectangle((0, 0, 42 * SCALE, ph), fill=(71, 54, 31, 16))
    gutter = gutter.filter(ImageFilter.GaussianBlur(18 * SCALE))
    page.alpha_composite(gutter)

    footer_y = ph - 172 * SCALE
    draw_faded_text(page, (left, footer_y), "THIRD BUTTON, NOTE 002.", footer, light_ink, False)
    draw_faded_text(page, (left, footer_y + 28 * SCALE), "things we keep coming back to", tiny, (88, 80, 69, 62), False)

    # Uneven page-edge darkness and scanning softness.
    edge = Image.new("L", page.size, 0)
    ed = ImageDraw.Draw(edge)
    ed.rectangle((0, 0, pw - 1, ph - 1), outline=160, width=5 * SCALE)
    ed.line((pw - 8 * SCALE, 30 * SCALE, pw - 2 * SCALE, ph - 32 * SCALE), fill=120, width=4 * SCALE)
    edge = edge.filter(ImageFilter.GaussianBlur(5 * SCALE))
    page.alpha_composite(Image.composite(Image.new("RGBA", page.size, (83, 65, 38, 42)), Image.new("RGBA", page.size), edge))

    return page


def final_image() -> Image.Image:
    page = make_page()
    page = page.resize((3216, 4120), Image.Resampling.LANCZOS)
    angle = -0.18
    rotated = page.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True, fillcolor=(0, 0, 0, 0))

    bg = Image.new("RGB", (W * SCALE, H * SCALE), (205, 197, 178))
    bg_noise = noise_layer(bg.size, 13, 0.8)
    bg = Image.blend(bg, ImageOps.colorize(bg_noise, (166, 154, 130), (230, 223, 202)).convert("RGB"), 0.2)
    bg = bg.convert("RGBA")

    x = -30 * SCALE
    y = -25 * SCALE
    bg.alpha_composite(rotated, (x, y))

    # Scanner lid / camera falloff near the crop edges, without a staged drop shadow.
    edge = Image.new("L", bg.size, 0)
    ed = ImageDraw.Draw(edge)
    for i in range(0, 120 * SCALE, 3 * SCALE):
        alpha = int(54 * (1 - i / (120 * SCALE)) ** 1.7)
        ed.rectangle((i, i, bg.width - i - 1, bg.height - i - 1), outline=alpha, width=3 * SCALE)
    bg = Image.composite(Image.new("RGBA", bg.size, (73, 58, 38, 28)), bg, edge.filter(ImageFilter.GaussianBlur(14 * SCALE)))

    # Very gentle lens/scanner falloff.
    falloff = Image.new("L", bg.size, 0)
    fd = ImageDraw.Draw(falloff)
    max_r = int(math.hypot(bg.width, bg.height) / 2)
    cx, cy = bg.width // 2, bg.height // 2
    for r in range(max_r, 0, -18):
        alpha = int(50 * (1 - r / max_r) ** 2.1)
        fd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=alpha)
    bg = Image.composite(Image.new("RGBA", bg.size, (78, 64, 44, 26)), bg, falloff.filter(ImageFilter.GaussianBlur(22 * SCALE)))

    # A few scan specks over the full image.
    dust = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    dd = ImageDraw.Draw(dust)
    for _ in range(470):
        x = random.randrange(bg.width)
        y = random.randrange(bg.height)
        a = random.randint(8, 24)
        dd.point((x, y), fill=(64, 52, 36, a))
    bg.alpha_composite(dust.filter(ImageFilter.GaussianBlur(0.18)))

    img = bg.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    # Keep contrast low, like faded ink on old stock.
    return img.filter(ImageFilter.UnsharpMask(radius=0.55, percent=42, threshold=6))


def make_preview(final: Image.Image) -> Image.Image:
    preview = Image.new("RGB", (1600, 1200), (210, 203, 190))
    d = ImageDraw.Draw(preview)
    small_final = final.resize((480, 600), Image.Resampling.LANCZOS)
    preview.paste(small_final, (70, 80))

    crops = [
        final.crop((115, 160, 965, 720)).resize((760, 500), Image.Resampling.LANCZOS),
        final.crop((130, 950, 760, 1245)).resize((700, 328), Image.Resampling.LANCZOS),
    ]
    preview.paste(crops[0], (660, 85))
    preview.paste(crops[1], (710, 700))
    label_font = font(22)
    d.text((72, 718), "note002_bookpage.png / 1080 x 1350", font=label_font, fill=(67, 60, 51))
    d.text((660, 602), "readability crop", font=label_font, fill=(67, 60, 51))
    d.text((710, 1050), "footer crop", font=label_font, fill=(67, 60, 51))
    return preview


if __name__ == "__main__":
    final = final_image()
    final.save(FINAL_PATH)
    make_preview(final).save(PREVIEW_PATH)
    print(FINAL_PATH)
    print(PREVIEW_PATH)
