from __future__ import annotations

import math
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).resolve().parent
SEED = 30817


PALETTE = {
    "ivory": "#F3E8D2",
    "charcoal": "#252521",
    "dusty_sage": "#9BAA88",
    "bottle_green": "#234236",
    "rust_red": "#A9472D",
    "mustard": "#C49A32",
    "washed_blue": "#6F8497",
}


FONT_SERIF = "C:/Windows/Fonts/BOOKOSB.TTF"
FONT_SERIF_REG = "C:/Windows/Fonts/BOOKOS.TTF"
FONT_SANS_BOLD = "C:/Windows/Fonts/arialbd.ttf"


def hex_to_rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def jitter_points(
    points: Iterable[tuple[float, float]], amount: float, salt: int
) -> list[tuple[float, float]]:
    rng = random.Random(SEED + salt)
    return [
        (x + rng.uniform(-amount, amount), y + rng.uniform(-amount, amount))
        for x, y in points
    ]


def transform(
    points: Iterable[tuple[float, float]],
    x: float,
    y: float,
    w: float,
    h: float,
    rotate: float = 0,
) -> list[tuple[float, float]]:
    cx, cy = 50, 50
    angle = math.radians(rotate)
    ca, sa = math.cos(angle), math.sin(angle)
    out = []
    for px, py in points:
        rx = (px - cx) * ca - (py - cy) * sa + cx
        ry = (px - cx) * sa + (py - cy) * ca + cy
        out.append((x + rx / 100 * w, y + ry / 100 * h))
    return out


def poly_path(points: list[tuple[float, float]], close: bool = True) -> str:
    if not points:
        return ""
    parts = [f"M {points[0][0]:.2f} {points[0][1]:.2f}"]
    parts.extend(f"L {x:.2f} {y:.2f}" for x, y in points[1:])
    if close:
        parts.append("Z")
    return " ".join(parts)


def rough_circle(cx: float, cy: float, r: float, count: int, salt: int) -> list[tuple[float, float]]:
    rng = random.Random(SEED + salt)
    pts = []
    for i in range(count):
        a = math.tau * i / count
        rr = r * rng.uniform(0.86, 1.09)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return pts


def symbol_points(name: str) -> list[list[tuple[float, float]]]:
    if name == "bird":
        return [
            [(8, 52), (34, 35), (56, 47), (89, 29), (72, 54), (92, 68), (57, 62), (40, 76), (31, 59)],
            [(42, 42), (50, 27), (56, 45)],
        ]
    if name == "horse":
        return [
            [(12, 57), (20, 42), (38, 36), (63, 38), (77, 27), (89, 36), (79, 51), (70, 56), (68, 83), (57, 83), (54, 60), (38, 61), (34, 84), (24, 83), (26, 60)],
            [(73, 31), (82, 18), (86, 36)],
        ]
    if name == "fish":
        return [
            [(10, 50), (28, 32), (62, 31), (86, 50), (61, 69), (29, 67)],
            [(73, 50), (94, 31), (92, 70)],
            [(42, 32), (49, 51), (39, 68)],
        ]
    if name == "small_animal":
        return [
            [(17, 56), (29, 37), (53, 33), (76, 42), (88, 61), (77, 73), (50, 76), (27, 70)],
            [(28, 38), (22, 24), (36, 34)],
            [(72, 44), (86, 31), (82, 52)],
        ]
    if name == "lizard":
        return [
            [(11, 54), (30, 42), (55, 43), (79, 36), (90, 45), (71, 56), (45, 58), (25, 67)],
            [(29, 44), (17, 27), (39, 44)],
            [(50, 44), (61, 26), (60, 45)],
            [(52, 57), (63, 76), (42, 59)],
            [(27, 63), (14, 79), (35, 62)],
        ]
    if name == "snake":
        return [
            [(14, 56), (26, 42), (41, 55), (53, 70), (68, 54), (78, 42), (90, 51), (79, 68), (64, 81), (48, 66), (36, 52), (25, 65)],
        ]
    if name == "star":
        pts = []
        for i in range(10):
            a = -math.pi / 2 + math.tau * i / 10
            r = 42 if i % 2 == 0 else 18
            pts.append((50 + math.cos(a) * r, 50 + math.sin(a) * r))
        return [pts]
    if name == "flower_mark":
        return [
            rough_circle(50, 50, 22, 9, 80),
            [(50, 8), (60, 37), (92, 42), (63, 56), (70, 88), (49, 64), (25, 84), (36, 56), (9, 40), (39, 36)],
        ]
    if name == "hand":
        return [
            [(26, 89), (31, 45), (23, 22), (33, 17), (43, 43), (43, 11), (55, 10), (57, 43), (66, 16), (76, 21), (67, 51), (82, 35), (90, 43), (70, 70), (62, 89)],
        ]
    if name == "mountain":
        return [
            [(8, 82), (28, 36), (43, 58), (59, 22), (92, 82)],
            [(28, 82), (45, 55), (62, 82)],
        ]
    if name == "seed":
        return [
            [(49, 10), (68, 26), (75, 51), (63, 77), (43, 92), (26, 73), (23, 47), (33, 23)],
            [(49, 15), (47, 89)],
        ]
    return [[(50, 7), (79, 18), (93, 49), (79, 82), (50, 93), (19, 82), (7, 49), (19, 18)]]


@dataclass
class TextSpec:
    text: str
    x: float
    y: float
    size: int
    color: str
    anchor: str = "mm"
    family: str = "serif"
    weight: str = "bold"
    rotate: float = 0


class Canvas:
    def __init__(self, width: int, height: int, background: str | None = "ivory") -> None:
        self.width = width
        self.height = height
        bg = (0, 0, 0, 0) if background is None else hex_to_rgba(PALETTE[background])
        self.image = Image.new("RGBA", (width, height), bg)
        self.draw = ImageDraw.Draw(self.image)
        self.svg: list[str] = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        ]
        if background is not None:
            self.svg.append(f'<rect width="{width}" height="{height}" fill="{PALETTE[background]}"/>')

    def grain(self, density: int, color: str = "charcoal", alpha: int = 24) -> None:
        rng = random.Random(SEED + self.width + self.height + density)
        rgba = hex_to_rgba(PALETTE[color], alpha)
        for _ in range(density):
            x = rng.randrange(self.width)
            y = rng.randrange(self.height)
            r = rng.choice([1, 1, 2, 2, 3])
            self.draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba)
        self.svg.append(
            f'<g opacity="{alpha / 255:.2f}" fill="{PALETTE[color]}">'
            + "".join(
                f'<circle cx="{rng.randrange(self.width)}" cy="{rng.randrange(self.height)}" r="{rng.choice([1, 1.5, 2])}"/>'
                for _ in range(max(80, density // 8))
            )
            + "</g>"
        )

    def polygon(self, pts: list[tuple[float, float]], fill: str, stroke: str | None = None, sw: int = 0, opacity: float = 1) -> None:
        fill_rgba = hex_to_rgba(PALETTE[fill], int(255 * opacity))
        outline = None if stroke is None else hex_to_rgba(PALETTE[stroke], int(255 * opacity))
        self.draw.polygon(pts, fill=fill_rgba, outline=outline)
        attrs = f'fill="{PALETTE[fill]}" opacity="{opacity:.3f}"'
        if stroke:
            attrs += f' stroke="{PALETTE[stroke]}" stroke-width="{sw}" stroke-linejoin="round"'
        self.svg.append(f'<path d="{poly_path(pts)}" {attrs}/>')

    def line(self, pts: list[tuple[float, float]], color: str, sw: int = 4, opacity: float = 1) -> None:
        self.draw.line(pts, fill=hex_to_rgba(PALETTE[color], int(255 * opacity)), width=sw, joint="curve")
        d = poly_path(pts, close=False)
        self.svg.append(
            f'<path d="{d}" fill="none" stroke="{PALETTE[color]}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" opacity="{opacity:.3f}"/>'
        )

    def ellipse(self, box: tuple[float, float, float, float], outline: str, sw: int = 4, fill: str | None = None, opacity: float = 1) -> None:
        fill_rgba = None if fill is None else hex_to_rgba(PALETTE[fill], int(255 * opacity))
        self.draw.ellipse(box, outline=hex_to_rgba(PALETTE[outline], int(255 * opacity)), width=sw, fill=fill_rgba)
        x1, y1, x2, y2 = box
        attrs = f'cx="{(x1 + x2) / 2:.2f}" cy="{(y1 + y2) / 2:.2f}" rx="{(x2 - x1) / 2:.2f}" ry="{(y2 - y1) / 2:.2f}" stroke="{PALETTE[outline]}" stroke-width="{sw}" opacity="{opacity:.3f}"'
        attrs += f' fill="{PALETTE[fill]}"' if fill else ' fill="none"'
        self.svg.append(f"<ellipse {attrs}/>")

    def text(self, spec: TextSpec) -> None:
        path = FONT_SERIF if spec.family == "serif" else FONT_SANS_BOLD
        if spec.family == "serif" and spec.weight != "bold":
            path = FONT_SERIF_REG
        fnt = font(path, spec.size)
        tmp = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        d = ImageDraw.Draw(tmp)
        bbox = d.textbbox((0, 0), spec.text, font=fnt)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = spec.x
        y = spec.y
        if spec.anchor == "mm":
            pos = (x - tw / 2, y - th / 2 - bbox[1] / 2)
        elif spec.anchor == "mt":
            pos = (x - tw / 2, y)
        else:
            pos = (x, y)
        d.text(pos, spec.text, font=fnt, fill=hex_to_rgba(PALETTE[spec.color]))
        if spec.rotate:
            tmp = tmp.rotate(spec.rotate, resample=Image.Resampling.BICUBIC, center=(spec.x, spec.y))
        self.image.alpha_composite(tmp)
        family = "Bookman Old Style" if spec.family == "serif" else "Arial"
        weight = "700" if spec.weight == "bold" else "400"
        anchor = "middle" if spec.anchor.startswith("m") else "start"
        rotate = f' transform="rotate({spec.rotate:.2f} {spec.x:.2f} {spec.y:.2f})"' if spec.rotate else ""
        self.svg.append(
            f'<text x="{spec.x:.2f}" y="{spec.y:.2f}" fill="{PALETTE[spec.color]}" '
            f'font-family="{family}, Georgia, serif" font-size="{spec.size}" font-weight="{weight}" '
            f'text-anchor="{anchor}" dominant-baseline="middle" letter-spacing="1.5"{rotate}>{escape(spec.text)}</text>'
        )

    def symbol(
        self,
        name: str,
        x: float,
        y: float,
        w: float,
        h: float,
        fill: str,
        salt: int,
        rotate: float = 0,
        stroke: str | None = None,
        sw: int = 0,
    ) -> None:
        if name == "sun":
            center = (x + w / 2, y + h / 2)
            rays = []
            for i in range(16):
                a = math.tau * i / 16
                r1 = min(w, h) * 0.28
                r2 = min(w, h) * (0.42 if i % 2 == 0 else 0.36)
                rays.append((center[0] + math.cos(a) * r2, center[1] + math.sin(a) * r2))
                rays.append((center[0] + math.cos(a + math.tau / 32) * r1, center[1] + math.sin(a + math.tau / 32) * r1))
            self.polygon(jitter_points(rays, min(w, h) * 0.018, salt), fill, stroke, sw)
            self.polygon(rough_circle(center[0], center[1], min(w, h) * 0.22, 18, salt + 1), "ivory")
            self.polygon(rough_circle(center[0], center[1], min(w, h) * 0.11, 13, salt + 2), fill)
            return
        for idx, pts in enumerate(symbol_points(name)):
            p = jitter_points(transform(pts, x, y, w, h, rotate), min(w, h) * 0.018, salt + idx * 11)
            self.polygon(p, fill, stroke, sw)

    def save(self, name: str) -> None:
        self.svg.append("</svg>")
        (OUT / f"{name}.svg").write_text("\n".join(self.svg), encoding="utf-8")
        self.image.save(OUT / f"{name}.png")


def profile_icon() -> None:
    c = Canvas(1080, 1080, "ivory")
    c.grain(1400, "charcoal", 16)
    c.polygon(rough_circle(540, 540, 432, 32, 10), "bottle_green")
    c.polygon(rough_circle(540, 540, 372, 30, 11), "ivory")
    c.symbol("sun", 330, 184, 420, 420, "rust_red", 12)
    c.symbol("bird", 312, 360, 470, 292, "charcoal", 18, rotate=-4)
    c.text(TextSpec("THIRD", 540, 720, 88, "charcoal", family="serif"))
    c.text(TextSpec("BUTTON", 540, 808, 88, "charcoal", family="serif"))
    c.save("profile-icon")


def instagram_artwork() -> None:
    c = Canvas(1080, 1350, "ivory")
    c.grain(1900, "charcoal", 16)
    c.line([(110, 104), (970, 96), (994, 1248), (84, 1262), (110, 104)], "charcoal", 6)
    c.symbol("sun", 358, 100, 360, 360, "mustard", 21)
    c.symbol("horse", 105, 420, 470, 330, "bottle_green", 22, rotate=-2)
    c.symbol("fish", 530, 506, 360, 230, "washed_blue", 23, rotate=6)
    c.symbol("snake", 190, 810, 700, 240, "rust_red", 24)
    c.symbol("star", 784, 204, 158, 158, "charcoal", 25, rotate=7)
    c.text(TextSpec("THIRD BUTTON", 540, 1054, 86, "charcoal", family="serif"))
    c.text(TextSpec("not new just familiar", 540, 1136, 40, "bottle_green", family="sans"))
    c.text(TextSpec("things we keep coming back to", 540, 1188, 30, "charcoal", family="sans"))
    c.save("instagram-4x5-artwork")


def sweatshirt_chest_print() -> None:
    c = Canvas(2400, 1600, None)
    c.symbol("horse", 630, 210, 1120, 700, "charcoal", 30)
    c.symbol("sun", 1060, 64, 360, 360, "rust_red", 31)
    c.symbol("bird", 815, 515, 770, 360, "bottle_green", 32)
    c.line([(460, 1050), (1940, 1034)], "charcoal", 16)
    c.text(TextSpec("THIRD BUTTON", 1200, 1185, 190, "charcoal", family="serif"))
    c.text(TextSpec("ordinary things", 1200, 1370, 78, "rust_red", family="sans"))
    c.save("sweatshirt-chest-print")


def oval_stamp() -> None:
    c = Canvas(1400, 900, "ivory")
    c.grain(1150, "charcoal", 16)
    c.ellipse((110, 110, 1290, 790), "bottle_green", 18)
    c.ellipse((178, 176, 1222, 724), "bottle_green", 8)
    c.symbol("fish", 278, 326, 330, 210, "washed_blue", 40)
    c.symbol("sun", 536, 225, 250, 250, "mustard", 41)
    c.symbol("small_animal", 762, 330, 360, 210, "rust_red", 42)
    c.text(TextSpec("THIRD BUTTON", 700, 592, 88, "charcoal", family="serif"))
    c.text(TextSpec("not new just familiar", 700, 680, 38, "bottle_green", family="sans"))
    c.text(TextSpec("ORDINARY THINGS", 700, 178, 40, "charcoal", family="sans"))
    c.save("oval-stamp")


def exploration_sheet() -> None:
    c = Canvas(1800, 2400, "ivory")
    c.grain(3200, "charcoal", 14)
    c.text(TextSpec("THIRD BUTTON", 900, 160, 118, "charcoal", family="serif"))
    c.text(TextSpec("12 primitive marks for ordinary things", 900, 250, 48, "bottle_green", family="sans"))
    names = [
        ("sun", "sun"),
        ("bird", "bird"),
        ("horse", "horse"),
        ("fish", "fish"),
        ("snake", "snake"),
        ("lizard", "lizard"),
        ("small_animal", "animal"),
        ("star", "star"),
        ("flower_mark", "folk mark"),
        ("hand", "hand"),
        ("mountain", "hill"),
        ("seed", "seed"),
    ]
    colors = ["mustard", "charcoal", "bottle_green", "washed_blue", "rust_red", "dusty_sage"]
    for i, (name, label) in enumerate(names):
        col = i % 4
        row = i // 4
        x = 170 + col * 400
        y = 390 + row * 590
        c.line([(x - 16, y - 16), (x + 300, y - 22), (x + 316, y + 356), (x - 26, y + 348), (x - 16, y - 16)], "charcoal", 4, 0.55)
        c.symbol(name, x + 22, y + 28, 250, 240, colors[i % len(colors)], 100 + i, rotate=(-4 + i % 3 * 4))
        c.text(TextSpec(label.upper(), x + 150, y + 308, 36, "charcoal", family="sans"))
        c.text(TextSpec(f"TB-{i + 1:02d}", x + 150, y + 354, 30, "bottle_green", family="sans"))
    c.text(TextSpec("things we keep coming back to", 900, 2242, 54, "rust_red", family="serif", weight="regular"))
    c.save("12-symbol-exploration-sheet")


def write_philosophy() -> None:
    text = """# Ancient Everyday

This system treats brand marks as old signs that have survived use, washing, travel, and memory. The symbols are not illustrations of animals or objects; they are compact evidence of ordinary things that people keep returning to. The forms should feel stamped, rubbed, and slightly misregistered, as if they were found on a faded sweatshirt, a souvenir shop bag, or a wall where the original maker cared more about recognition than polish.

Space is simple and frontal. Each mark sits like a small artifact with enough room to feel discovered, not decorated. The best compositions use a few heavy silhouettes, worn borders, and spare typography so the viewer reads age, tactility, and confidence before reading text.

Color comes from fabric and print memory: warm ivory cotton, charcoal ink, dusty sage, bottle green, rust red, mustard, and washed blue. The palette should never become glossy. It should feel sun-faded, screenprinted, and softened by repeated wear.

Typography is part of the artifact. THIRD BUTTON can be large and chunky, but it should never become a polished modern logo. Supporting lines such as ordinary things, not new just familiar, and things we keep coming back to work best as small souvenir-like inscriptions, placed around marks like old labels or maker stamps.

The craft target is primitive but not careless: rough edges, uneven geometry, and naive proportions must be deliberately balanced. Every asset should look manually considered, edited down, and useful across garment print, profile icon, tag, sticker, and feed artwork.
"""
    (OUT / "visual-philosophy.md").write_text(text, encoding="utf-8")


def main() -> None:
    write_philosophy()
    profile_icon()
    instagram_artwork()
    sweatshirt_chest_print()
    oval_stamp()
    exploration_sheet()


if __name__ == "__main__":
    main()
