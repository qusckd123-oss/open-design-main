from __future__ import annotations

import math
import random
from dataclasses import dataclass
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).resolve().parent
SEED = 7319

COLORS = {
    "cream": "#EFE4CF",
    "old_paper": "#E6D4B7",
    "washed_black": "#20211D",
    "ink": "#24231F",
    "dusty_sage": "#879275",
    "sage_dark": "#283A31",
    "faded_navy": "#253344",
    "mustard": "#BE9633",
    "faded_red": "#A04733",
    "cotton": "#F6EDD9",
}

FONT_BLOCK = "C:/Windows/Fonts/BOOKOSB.TTF"
FONT_SANS = "C:/Windows/Fonts/arialbd.ttf"


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def fnt(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def rough(points: list[tuple[float, float]], amount: float, salt: int) -> list[tuple[float, float]]:
    rng = random.Random(SEED + salt)
    return [(x + rng.uniform(-amount, amount), y + rng.uniform(-amount, amount)) for x, y in points]


def path_d(points: list[tuple[float, float]], close: bool = True) -> str:
    d = [f"M {points[0][0]:.2f} {points[0][1]:.2f}"]
    d += [f"L {x:.2f} {y:.2f}" for x, y in points[1:]]
    if close:
        d.append("Z")
    return " ".join(d)


def circle_points(cx: float, cy: float, r: float, n: int, salt: int) -> list[tuple[float, float]]:
    rng = random.Random(SEED + salt)
    pts = []
    for i in range(n):
        a = math.tau * i / n
        rr = r * rng.uniform(0.9, 1.08)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return pts


def tx(points: list[tuple[float, float]], x: float, y: float, w: float, h: float, rot: float = 0) -> list[tuple[float, float]]:
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    out = []
    for px, py in points:
        rx = (px - 50) * ca - (py - 50) * sa + 50
        ry = (px - 50) * sa + (py - 50) * ca + 50
        out.append((x + rx / 100 * w, y + ry / 100 * h))
    return out


def shape(name: str) -> list[list[tuple[float, float]]]:
    if name == "bird":
        return [
            [(9, 54), (30, 41), (45, 48), (67, 31), (90, 28), (75, 49), (92, 64), (62, 62), (40, 74), (29, 60)],
            [(42, 46), (49, 27), (55, 49)],
        ]
    if name == "fish":
        return [
            [(10, 50), (28, 36), (58, 32), (82, 48), (59, 66), (28, 65)],
            [(76, 49), (94, 34), (92, 68)],
            [(40, 34), (47, 50), (39, 66)],
        ]
    if name == "animal":
        return [
            [(12, 58), (25, 42), (50, 36), (74, 40), (89, 55), (81, 70), (52, 75), (27, 70)],
            [(30, 42), (25, 25), (38, 36)],
            [(70, 42), (82, 27), (82, 51)],
            [(31, 69), (28, 88), (39, 88), (43, 71)],
            [(64, 72), (67, 90), (78, 88), (74, 70)],
        ]
    if name == "horse":
        return [
            [(9, 59), (20, 43), (38, 37), (60, 38), (75, 26), (89, 36), (77, 51), (69, 57), (67, 85), (56, 84), (53, 61), (39, 62), (35, 84), (24, 84), (26, 61)],
            [(75, 30), (83, 17), (87, 36)],
        ]
    if name == "star":
        pts = []
        for i in range(10):
            a = -math.pi / 2 + math.tau * i / 10
            r = 42 if i % 2 == 0 else 17
            pts.append((50 + math.cos(a) * r, 50 + math.sin(a) * r))
        return [pts]
    if name == "eye":
        return [
            [(7, 50), (26, 28), (52, 22), (79, 31), (94, 50), (76, 68), (48, 75), (23, 67)],
            circle_points(50, 50, 15, 13, 20),
        ]
    if name == "sun":
        pts = []
        for i in range(24):
            a = math.tau * i / 24
            r = 42 if i % 2 == 0 else 27
            pts.append((50 + math.cos(a) * r, 50 + math.sin(a) * r))
        return [pts, circle_points(50, 50, 15, 13, 21)]
    if name == "abstract":
        return [
            [(12, 72), (27, 26), (47, 57), (61, 18), (88, 72)],
            [(20, 82), (50, 64), (80, 82), (50, 91)],
        ]
    return [[(50, 8), (92, 50), (50, 92), (8, 50)]]


@dataclass
class Text:
    value: str
    x: float
    y: float
    size: int
    color: str
    font: str = "block"
    anchor: str = "mm"
    rot: float = 0


class Art:
    def __init__(self, w: int, h: int, bg: str | None = "cream"):
        self.w = w
        self.h = h
        self.img = Image.new("RGBA", (w, h), (0, 0, 0, 0) if bg is None else rgba(COLORS[bg]))
        self.draw = ImageDraw.Draw(self.img)
        self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
        if bg is not None:
            self.svg.append(f'<rect width="{w}" height="{h}" fill="{COLORS[bg]}"/>')

    def grain(self, density: int, color: str = "ink", alpha: int = 20) -> None:
        rng = random.Random(SEED + self.w + self.h + density)
        for _ in range(density):
            x = rng.randrange(self.w)
            y = rng.randrange(self.h)
            r = rng.choice([1, 1, 1, 2, 2, 3])
            self.draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba(COLORS[color], alpha))
        dots = []
        for _ in range(max(40, density // 14)):
            dots.append(f'<circle cx="{rng.randrange(self.w)}" cy="{rng.randrange(self.h)}" r="{rng.choice([1, 1.5, 2])}"/>')
        self.svg.append(f'<g fill="{COLORS[color]}" opacity="{alpha / 255:.3f}">{"".join(dots)}</g>')

    def poly(self, pts: list[tuple[float, float]], fill: str, opacity: float = 1) -> None:
        self.draw.polygon(pts, fill=rgba(COLORS[fill], int(255 * opacity)))
        self.svg.append(f'<path d="{path_d(pts)}" fill="{COLORS[fill]}" opacity="{opacity:.3f}"/>')

    def line(self, pts: list[tuple[float, float]], color: str, width: int = 5, opacity: float = 1) -> None:
        self.draw.line(pts, fill=rgba(COLORS[color], int(255 * opacity)), width=width, joint="curve")
        self.svg.append(
            f'<path d="{path_d(pts, False)}" fill="none" stroke="{COLORS[color]}" stroke-width="{width}" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity="{opacity:.3f}"/>'
        )

    def oval(self, box: tuple[int, int, int, int], color: str, width: int = 8) -> None:
        self.draw.ellipse(box, outline=rgba(COLORS[color]), width=width)
        x1, y1, x2, y2 = box
        self.svg.append(
            f'<ellipse cx="{(x1+x2)/2}" cy="{(y1+y2)/2}" rx="{(x2-x1)/2}" ry="{(y2-y1)/2}" '
            f'fill="none" stroke="{COLORS[color]}" stroke-width="{width}"/>'
        )

    def mark(self, name: str, x: float, y: float, w: float, h: float, color: str, salt: int, rot: float = 0) -> None:
        for i, pts in enumerate(shape(name)):
            self.poly(rough(tx(pts, x, y, w, h, rot), min(w, h) * 0.018, salt + i * 17), color)

    def text(self, t: Text) -> None:
        font_path = FONT_BLOCK if t.font == "block" else FONT_SANS
        ft = fnt(font_path, t.size)
        tmp = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        d = ImageDraw.Draw(tmp)
        value = t.value
        bbox = d.textbbox((0, 0), value, font=ft)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = t.x - tw / 2 if t.anchor == "mm" else t.x
        y = t.y - th / 2 - bbox[1] / 2 if t.anchor == "mm" else t.y
        rng = random.Random(SEED + int(t.x + t.y + t.size))
        if len(value) <= 18 and " " not in value:
            cursor = x
            for ch in value:
                off_y = rng.uniform(-2.5, 2.5)
                d.text((cursor, y + off_y), ch, font=ft, fill=rgba(COLORS[t.color]))
                cursor += d.textlength(ch, font=ft) + rng.uniform(-1.5, 1.2)
        else:
            d.text((x, y), value, font=ft, fill=rgba(COLORS[t.color]))
        if t.rot:
            tmp = tmp.rotate(t.rot, center=(t.x, t.y), resample=Image.Resampling.BICUBIC)
        self.img.alpha_composite(tmp)
        fam = "Bookman Old Style" if t.font == "block" else "Arial"
        rotate = f' transform="rotate({t.rot:.2f} {t.x:.2f} {t.y:.2f})"' if t.rot else ""
        self.svg.append(
            f'<text x="{t.x:.2f}" y="{t.y:.2f}" fill="{COLORS[t.color]}" font-family="{fam}, serif" '
            f'font-size="{t.size}" font-weight="700" text-anchor="middle" dominant-baseline="middle" '
            f'letter-spacing="1.2"{rotate}>{escape(t.value)}</text>'
        )

    def save(self, name: str) -> None:
        self.svg.append("</svg>")
        (OUT / f"{name}.svg").write_text("\n".join(self.svg), encoding="utf-8")
        self.img.save(OUT / f"{name}.png")


def symbol_studies() -> None:
    studies = [
        ("01_sun_mark", "sun", "mustard", "SUN MARK"),
        ("02_bird_mark", "bird", "ink", "BIRD MARK"),
        ("03_fish_mark", "fish", "faded_navy", "FISH MARK"),
        ("04_small_animal_mark", "animal", "sage_dark", "SMALL BEAST"),
        ("05_eye_star_mark", "eye", "faded_red", "EYE STAR"),
    ]
    for i, (name, mark, color, label) in enumerate(studies):
        a = Art(900, 900, "cream")
        a.grain(850, "ink", 14)
        a.mark(mark, 210, 170, 480, 430, color, i + 1, rot=(-4 + i * 2))
        if mark == "eye":
            a.mark("star", 560, 230, 150, 150, "ink", 71)
        a.text(Text(label, 450, 690, 54, "ink", "sans"))
        a.text(Text("THIRD BUTTON", 450, 760, 48, "ink"))
        a.save(name)

    a = Art(900, 900, "cream")
    a.grain(900, "ink", 14)
    a.oval((125, 155, 775, 665), "sage_dark", 10)
    a.mark("bird", 215, 245, 280, 210, "ink", 81, -5)
    a.mark("sun", 486, 214, 210, 210, "mustard", 82)
    a.text(Text("THIRD BUTTON", 450, 585, 62, "ink"))
    a.text(Text("ordinary signs", 450, 675, 34, "sage_dark", "sans"))
    a.save("06_combined_text_emblem")


def card_a() -> None:
    a = Art(1080, 1350, "cream")
    a.grain(1550, "ink", 15)
    a.line([(126, 116), (955, 106), (970, 1230), (110, 1242), (126, 116)], "ink", 5, 0.9)
    a.mark("sun", 190, 185, 190, 190, "ink", 101)
    a.mark("bird", 518, 172, 230, 180, "ink", 102, -5)
    a.mark("fish", 290, 492, 250, 190, "ink", 103, 4)
    a.mark("animal", 610, 485, 280, 210, "ink", 104)
    a.mark("eye", 390, 800, 300, 190, "ink", 105)
    a.mark("star", 765, 810, 120, 120, "ink", 106)
    a.text(Text("THIRD BUTTON", 540, 1038, 84, "ink"))
    a.text(Text("ordinary signs", 540, 1132, 40, "ink", "sans"))
    a.text(Text("for ordinary things", 540, 1184, 34, "ink", "sans"))
    a.save("card_A_cream_black_symbols")


def card_b() -> None:
    a = Art(1080, 1350, "dusty_sage")
    a.grain(1300, "ink", 16)
    a.mark("horse", 206, 318, 670, 500, "ink", 201, -2)
    a.mark("star", 685, 168, 150, 150, "cotton", 202, 6)
    a.text(Text("not the first", 540, 930, 82, "cotton"))
    a.text(Text("just familiar", 540, 1028, 76, "ink"))
    a.text(Text("THIRD BUTTON", 540, 1160, 42, "ink", "sans"))
    a.text(Text("old shop air", 540, 1215, 34, "cotton", "sans"))
    a.save("card_B_dusty_sage_animal")


def card_c() -> None:
    a = Art(1080, 1350, "faded_navy")
    a.grain(1250, "cream", 17)
    a.oval((186, 182, 894, 782), "cream", 8)
    a.mark("sun", 400, 242, 280, 280, "mustard", 301)
    a.mark("bird", 304, 466, 470, 260, "cream", 302, -3)
    a.mark("abstract", 455, 812, 170, 120, "faded_red", 303)
    a.text(Text("things we keep", 540, 994, 70, "cream"))
    a.text(Text("coming back to", 540, 1075, 70, "cream"))
    a.text(Text("THIRD BUTTON", 540, 1200, 44, "cream", "sans"))
    a.save("card_C_navy_bird_sun")


def profiles() -> None:
    p1 = Art(1080, 1080, "cream")
    p1.grain(900, "ink", 14)
    p1.mark("sun", 330, 170, 420, 420, "mustard", 401)
    p1.mark("bird", 310, 392, 470, 260, "ink", 402, -4)
    p1.text(Text("THIRD", 540, 780, 74, "ink"))
    p1.text(Text("BUTTON", 540, 855, 74, "ink"))
    p1.save("profile_01_bird_sun")

    p2 = Art(1080, 1080, "dusty_sage")
    p2.grain(900, "ink", 14)
    p2.oval((190, 170, 890, 750), "ink", 9)
    p2.mark("animal", 265, 265, 560, 380, "ink", 501)
    p2.text(Text("ordinary signs", 540, 815, 42, "cotton", "sans"))
    p2.text(Text("THIRD BUTTON", 540, 880, 58, "ink"))
    p2.save("profile_02_animal_emblem")

    p3 = Art(1080, 1080, "washed_black")
    p3.grain(850, "cream", 15)
    p3.mark("eye", 250, 215, 580, 360, "cream", 601)
    p3.mark("star", 455, 374, 170, 170, "faded_red", 602)
    p3.mark("abstract", 370, 650, 340, 180, "mustard", 603)
    p3.text(Text("TB", 540, 872, 98, "cream"))
    p3.save("profile_03_abstract_sign")


def contact_sheet() -> None:
    files = [
        "01_sun_mark.png",
        "02_bird_mark.png",
        "03_fish_mark.png",
        "04_small_animal_mark.png",
        "05_eye_star_mark.png",
        "06_combined_text_emblem.png",
        "card_A_cream_black_symbols.png",
        "card_B_dusty_sage_animal.png",
        "card_C_navy_bird_sun.png",
        "profile_01_bird_sun.png",
        "profile_02_animal_emblem.png",
        "profile_03_abstract_sign.png",
    ]
    sheet = Image.new("RGB", (2200, 2850), rgba(COLORS["old_paper"])[:3])
    d = ImageDraw.Draw(sheet)
    label_font = fnt(FONT_SANS, 24)
    for i, name in enumerate(files):
        im = Image.open(OUT / name).convert("RGBA")
        im.thumbnail((460, 520))
        col = i % 4
        row = i // 4
        x = 70 + col * 525
        y = 80 + row * 875
        bg = Image.new("RGBA", (480, 650), rgba(COLORS["old_paper"]))
        bg.alpha_composite(im, ((480 - im.width) // 2, 40))
        sheet.paste(bg.convert("RGB"), (x, y))
        d.text((x, y + 592), name, font=label_font, fill=rgba(COLORS["ink"])[:3])
    sheet.save(OUT / "contact_sheet.png")


def main() -> None:
    symbol_studies()
    card_a()
    card_b()
    card_c()
    profiles()
    contact_sheet()


if __name__ == "__main__":
    main()
