from __future__ import annotations

import math
import random
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).resolve().parent
SEED = 91241

COLORS = {
    "cream": "#EFE4CF",
    "paper": "#E2D0B1",
    "ink": "#20201C",
    "sage": "#A3A787",
    "sage_deep": "#303F33",
    "washed_blue": "#4C91BE",
    "navy": "#263443",
    "mustard": "#BF9631",
    "red": "#9F4231",
    "tan": "#B39E83",
}

FONT_BLOCK = "C:/Windows/Fonts/BOOKOSB.TTF"
FONT_SANS = "C:/Windows/Fonts/arialbd.ttf"


def color(name: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = COLORS[name].lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def jitter(points: list[tuple[float, float]], amount: float, salt: int) -> list[tuple[float, float]]:
    rng = random.Random(SEED + salt)
    return [(x + rng.uniform(-amount, amount), y + rng.uniform(-amount, amount)) for x, y in points]


def path(points: list[tuple[float, float]], close: bool = True) -> str:
    d = [f"M {points[0][0]:.1f} {points[0][1]:.1f}"]
    d.extend(f"L {x:.1f} {y:.1f}" for x, y in points[1:])
    if close:
        d.append("Z")
    return " ".join(d)


def transform(points: list[tuple[float, float]], x: float, y: float, w: float, h: float) -> list[tuple[float, float]]:
    return [(x + px / 100 * w, y + py / 100 * h) for px, py in points]


def rough_circle(cx: float, cy: float, r: float, n: int, salt: int) -> list[tuple[float, float]]:
    rng = random.Random(SEED + salt)
    pts = []
    for i in range(n):
        a = math.tau * i / n
        rr = r * rng.uniform(0.9, 1.08)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return pts


class Art:
    def __init__(self, w: int, h: int, bg: str):
        self.w = w
        self.h = h
        self.image = Image.new("RGBA", (w, h), color(bg))
        self.draw = ImageDraw.Draw(self.image)
        self.svg = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
            f'<rect width="{w}" height="{h}" fill="{COLORS[bg]}"/>',
        ]

    def grain(self, density: int, ink: str = "ink", alpha: int = 14) -> None:
        rng = random.Random(SEED + self.w + self.h + density)
        for _ in range(density):
            x = rng.randrange(self.w)
            y = rng.randrange(self.h)
            r = rng.choice([1, 1, 1, 2])
            self.draw.ellipse((x - r, y - r, x + r, y + r), fill=color(ink, alpha))
        self.svg.append(
            f'<g fill="{COLORS[ink]}" opacity="{alpha / 255:.3f}">'
            + "".join(
                f'<circle cx="{rng.randrange(self.w)}" cy="{rng.randrange(self.h)}" r="{rng.choice([0.8, 1.2, 1.8])}"/>'
                for _ in range(max(40, density // 20))
            )
            + "</g>"
        )

    def poly(self, pts: list[tuple[float, float]], fill: str, opacity: float = 1) -> None:
        self.draw.polygon(pts, fill=color(fill, int(opacity * 255)))
        self.svg.append(f'<path d="{path(pts)}" fill="{COLORS[fill]}" opacity="{opacity:.2f}"/>')

    def line(self, pts: list[tuple[float, float]], ink: str = "ink", width: int = 8, close: bool = False) -> None:
        if close:
            pts = pts + [pts[0]]
        self.draw.line(pts, fill=color(ink), width=width, joint="curve")
        self.svg.append(
            f'<path d="{path(pts, False)}" fill="none" stroke="{COLORS[ink]}" stroke-width="{width}" '
            f'stroke-linecap="round" stroke-linejoin="round"/>'
        )

    def ellipse(self, box: tuple[int, int, int, int], ink: str = "ink", width: int = 8) -> None:
        self.draw.ellipse(box, outline=color(ink), width=width)
        x1, y1, x2, y2 = box
        self.svg.append(
            f'<ellipse cx="{(x1+x2)/2}" cy="{(y1+y2)/2}" rx="{(x2-x1)/2}" ry="{(y2-y1)/2}" '
            f'fill="none" stroke="{COLORS[ink]}" stroke-width="{width}"/>'
        )

    def text(self, value: str, x: float, y: float, size: int, ink: str = "ink", block: bool = True, rotate: float = 0) -> None:
        ft = font(FONT_BLOCK if block else FONT_SANS, size)
        tmp = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        d = ImageDraw.Draw(tmp)
        bbox = d.textbbox((0, 0), value, font=ft)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        rng = random.Random(SEED + int(x * 3 + y + size))
        cursor = x - tw / 2
        top = y - th / 2 - bbox[1] / 2
        if len(value) <= 14:
            for ch in value:
                d.text((cursor, top + rng.uniform(-2, 2)), ch, font=ft, fill=color(ink))
                cursor += d.textlength(ch, font=ft) + rng.uniform(-1.3, 1.0)
        else:
            d.text((cursor, top), value, font=ft, fill=color(ink))
        if rotate:
            tmp = tmp.rotate(rotate, center=(x, y), resample=Image.Resampling.BICUBIC)
        self.image.alpha_composite(tmp)
        fam = "Bookman Old Style" if block else "Arial"
        rot = f' transform="rotate({rotate:.1f} {x:.1f} {y:.1f})"' if rotate else ""
        self.svg.append(
            f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" dominant-baseline="middle" '
            f'font-family="{fam}, serif" font-size="{size}" font-weight="700" fill="{COLORS[ink]}"{rot}>{escape(value)}</text>'
        )

    def beast_outline(self, x: float, y: float, w: float, h: float, ink: str = "ink", salt: int = 0) -> None:
        body = [(6, 58), (18, 40), (38, 32), (62, 35), (79, 26), (94, 40), (82, 56), (74, 70), (45, 76), (20, 70)]
        legs = [[(27, 68), (23, 91), (32, 91), (36, 69)], [(61, 71), (66, 92), (75, 90), (70, 69)]]
        tail = [(12, 49), (0, 37), (10, 60)]
        horn = [(76, 28), (80, 12), (87, 34)]
        for pts in [body, *legs, tail, horn]:
            self.line(jitter(transform(pts, x, y, w, h), min(w, h) * 0.012, salt), ink, max(5, int(w / 85)), close=False)

    def bird_line(self, x: float, y: float, w: float, h: float, ink: str = "ink", salt: int = 0) -> None:
        pts = [(4, 56), (22, 43), (40, 49), (61, 31), (91, 26), (74, 49), (92, 63), (59, 61), (38, 75), (26, 60)]
        self.line(jitter(transform(pts, x, y, w, h), min(w, h) * 0.015, salt), ink, max(5, int(w / 75)), close=True)
        self.line(jitter(transform([(42, 49), (50, 27), (56, 49)], x, y, w, h), min(w, h) * 0.012, salt + 3), ink, max(5, int(w / 95)))

    def fish_line(self, x: float, y: float, w: float, h: float, ink: str = "ink", salt: int = 0) -> None:
        pts = [(8, 52), (27, 37), (58, 34), (82, 49), (59, 67), (27, 65)]
        tail = [(77, 49), (96, 32), (93, 68)]
        self.line(jitter(transform(pts, x, y, w, h), min(w, h) * 0.014, salt), ink, max(5, int(w / 80)), close=True)
        self.line(jitter(transform(tail, x, y, w, h), min(w, h) * 0.014, salt + 1), ink, max(5, int(w / 80)), close=True)

    def sun(self, cx: float, cy: float, r: float, ink: str = "mustard", fill_center: str = "cream", salt: int = 0) -> None:
        pts = []
        for i in range(24):
            a = math.tau * i / 24
            rr = r if i % 2 == 0 else r * 0.64
            pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
        self.poly(jitter(pts, r * 0.035, salt), ink)
        self.poly(rough_circle(cx, cy, r * 0.34, 13, salt + 1), fill_center)

    def flower_letters(self, cx: float, cy: float, r: float, ink: str = "ink") -> None:
        letters = ["T", "H", "I", "R", "D"]
        for i in range(5):
            a = -math.pi / 2 + math.tau * i / 5
            px, py = cx + math.cos(a) * r, cy + math.sin(a) * r
            self.ellipse((int(px - 54), int(py - 46), int(px + 54), int(py + 46)), ink, 7)
            self.text(letters[i], px, py + 2, 42, ink, False)
        self.poly(rough_circle(cx, cy, 45, 12, 31), ink)

    def save(self, name: str) -> None:
        self.svg.append("</svg>")
        (OUT / f"{name}.svg").write_text("\n".join(self.svg), encoding="utf-8")
        self.image.save(OUT / f"{name}.png")


def make_symbol_sheet() -> None:
    a = Art(1600, 1100, "cream")
    a.grain(850, "ink", 10)
    a.flower_letters(285, 305, 125)
    a.text("LETTER FLOWER", 285, 565, 42, "ink", False)
    a.beast_outline(520, 170, 360, 260, "ink", 2)
    a.text("THIRD", 705, 305, 36, "ink", False)
    a.text("BODY TEXT", 700, 565, 42, "ink", False)
    a.sun(1070, 300, 125, "mustard", "cream", 3)
    a.text("ORDINARY", 1070, 300, 32, "ink", False, 90)
    a.text("SUN OVAL", 1070, 565, 42, "ink", False)
    a.bird_line(210, 720, 320, 190, "ink", 4)
    a.fish_line(650, 720, 280, 170, "navy", 5)
    a.ellipse((1120, 708, 1420, 900), "ink", 7)
    a.text("THIRD BUTTON", 1270, 785, 38, "ink")
    a.text("ordinary signs", 1270, 835, 24, "ink", False)
    a.save("pin_ref_symbol_studies")


def card_a() -> None:
    a = Art(1080, 1350, "cream")
    a.grain(1100, "ink", 12)
    a.flower_letters(300, 300, 126)
    a.bird_line(590, 205, 260, 170, "ink", 11)
    a.sun(770, 528, 105, "mustard", "cream", 12)
    a.fish_line(225, 690, 270, 170, "ink", 13)
    a.beast_outline(570, 640, 330, 235, "ink", 14)
    a.text("THIRD BUTTON", 540, 1025, 88, "ink")
    a.text("ordinary signs", 540, 1120, 42, "ink", False)
    a.text("for ordinary things", 540, 1174, 34, "ink", False)
    a.save("pin_ref_card_A_cream_logo_board")


def card_b() -> None:
    a = Art(1080, 1350, "sage")
    a.grain(980, "cream", 14)
    a.beast_outline(210, 310, 650, 430, "ink", 21)
    a.text("THIRD", 535, 520, 68, "ink", False)
    a.text("BUTTON", 536, 598, 54, "ink", False)
    a.ellipse((330, 835, 750, 990), "ink", 7)
    a.text("not the first", 540, 888, 50, "cream")
    a.text("just familiar", 540, 948, 42, "ink")
    a.text("old shop air", 540, 1118, 34, "cream", False)
    a.save("pin_ref_card_B_sage_body_text_animal")


def card_c() -> None:
    a = Art(1080, 1350, "washed_blue")
    a.grain(820, "ink", 12)
    a.sun(540, 330, 185, "mustard", "cream", 31)
    a.text("THIRD", 540, 305, 44, "ink", False, 90)
    a.bird_line(335, 560, 410, 250, "ink", 32)
    a.text("things we keep", 540, 920, 70, "cream")
    a.text("coming back to", 540, 1004, 70, "cream")
    a.text("THIRD BUTTON", 540, 1160, 42, "ink", False)
    a.save("pin_ref_card_C_blue_sun_bird")


def profiles() -> None:
    a = Art(1080, 1080, "cream")
    a.grain(700, "ink", 11)
    a.flower_letters(540, 340, 135)
    a.text("THIRD", 540, 720, 76, "ink")
    a.text("BUTTON", 540, 800, 76, "ink")
    a.save("pin_ref_profile_01_letter_flower")

    b = Art(1080, 1080, "sage")
    b.grain(650, "cream", 13)
    b.beast_outline(190, 260, 700, 440, "ink", 41)
    b.text("TB", 540, 785, 96, "cream")
    b.save("pin_ref_profile_02_animal_body")

    c = Art(1080, 1080, "washed_blue")
    c.grain(650, "ink", 11)
    c.sun(540, 380, 190, "mustard", "cream", 51)
    c.text("OLD", 540, 355, 42, "ink", False, 90)
    c.bird_line(350, 560, 370, 210, "ink", 52)
    c.text("TB", 540, 815, 88, "cream")
    c.save("pin_ref_profile_03_sun_bird")


def contact() -> None:
    names = [
        "pin_ref_symbol_studies.png",
        "pin_ref_card_A_cream_logo_board.png",
        "pin_ref_card_B_sage_body_text_animal.png",
        "pin_ref_card_C_blue_sun_bird.png",
        "pin_ref_profile_01_letter_flower.png",
        "pin_ref_profile_02_animal_body.png",
        "pin_ref_profile_03_sun_bird.png",
    ]
    sheet = Image.new("RGB", (1800, 2200), color("paper")[:3])
    d = ImageDraw.Draw(sheet)
    ft = font(FONT_SANS, 24)
    for i, name in enumerate(names):
        img = Image.open(OUT / name).convert("RGBA")
        img.thumbnail((500, 560))
        x = 70 + (i % 3) * 575
        y = 70 + (i // 3) * 700
        bg = Image.new("RGBA", (520, 620), color("paper"))
        bg.alpha_composite(img, ((520 - img.width) // 2, 25))
        sheet.paste(bg.convert("RGB"), (x, y))
        d.text((x, y + 580), name, fill=color("ink")[:3], font=ft)
    sheet.save(OUT / "pin_ref_contact_sheet.png")


def main() -> None:
    make_symbol_sheet()
    card_a()
    card_b()
    card_c()
    profiles()
    contact()


if __name__ == "__main__":
    main()
