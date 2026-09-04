from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent


def contour_to_path(contour: np.ndarray) -> str:
    pts = contour.reshape(-1, 2)
    if len(pts) < 3:
        return ""
    parts = [f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"]
    for x, y in pts[1:]:
        parts.append(f"L{x:.1f},{y:.1f}")
    parts.append("Z")
    return " ".join(parts)


def rgba_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def trace(src: Path, dst: Path, colors: int = 96, min_area: float = 2.0) -> None:
    image = Image.open(src).convert("RGB")
    width, height = image.size
    arr = np.array(image)
    # Remove generated paper/camera grain before quantization. The target is a
    # clean production vector, not thousands of tiny texture fragments.
    smooth = cv2.pyrMeanShiftFiltering(arr, sp=10, sr=24)
    smooth = cv2.medianBlur(smooth, 3)
    image = Image.fromarray(smooth)
    quantized = image.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    labels = np.array(quantized)
    palette_raw = quantized.getpalette()[: colors * 3]
    palette = [
        tuple(palette_raw[i : i + 3])
        for i in range(0, len(palette_raw), 3)
    ]

    counts = np.bincount(labels.reshape(-1), minlength=len(palette))
    # Draw big flat areas first, then small details. This keeps fine outlines visible.
    order = sorted(range(len(palette)), key=lambda idx: int(counts[idx]), reverse=True)

    paths: list[str] = []
    for idx in order:
        if counts[idx] == 0:
            continue
        mask = np.where(labels == idx, 255, 0).astype(np.uint8)
        contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
        color = rgba_to_hex(palette[idx])
        subpaths: list[str] = []
        for contour in contours:
            area = abs(cv2.contourArea(contour))
            if area < min_area:
                continue
            epsilon = 0.55 if area < 1000 else 0.95
            approx = cv2.approxPolyDP(contour, epsilon, True)
            path = contour_to_path(approx)
            if path:
                subpaths.append(path)
        if not subpaths:
            continue
        d = " ".join(subpaths)
        paths.append(f'<path d="{d}" fill="{color}" fill-rule="evenodd"/>')

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" shape-rendering="geometricPrecision">
  <title>{src.name} faithful vector trace</title>
  <g id="png-faithful-trace">
    {'\n    '.join(paths)}
  </g>
</svg>
'''
    dst.write_text(svg, encoding="utf-8")


def main() -> None:
    trace(ROOT / "source_front.png", ROOT / "sorona-tag-front-png-faithful-trace.svg", colors=72, min_area=18.0)
    trace(ROOT / "source_back.png", ROOT / "sorona-tag-back-png-faithful-trace.svg", colors=64, min_area=18.0)


if __name__ == "__main__":
    main()
