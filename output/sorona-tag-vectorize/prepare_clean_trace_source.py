from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent


def kmeans_quantize(arr: np.ndarray, k: int) -> np.ndarray:
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    data = lab.reshape((-1, 3)).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 24, 1.0)
    _, labels, centers = cv2.kmeans(data, k, None, criteria, 2, cv2.KMEANS_PP_CENTERS)
    quant_lab = centers[labels.flatten()].reshape(lab.shape).astype(np.uint8)
    return cv2.cvtColor(quant_lab, cv2.COLOR_LAB2RGB)


def flatten_common_colors(arr: np.ndarray, original: np.ndarray, is_back: bool) -> np.ndarray:
    out = arr.copy()
    r, g, b = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    or_, og, ob = original[:, :, 0], original[:, :, 1], original[:, :, 2]
    brightness = out.mean(axis=2)
    orig_brightness = original.mean(axis=2)

    if is_back:
        gray_bg = (brightness > 60) & (brightness < 125) & (np.abs(r.astype(int) - g.astype(int)) < 18) & (np.abs(g.astype(int) - b.astype(int)) < 18)
        out[gray_bg] = np.array([82, 82, 82], dtype=np.uint8)
    else:
        white_bg = brightness > 238
        out[white_bg] = np.array([255, 255, 255], dtype=np.uint8)

    cream = (r > 215) & (g > 204) & (b > 178) & (brightness > 200) & (orig_brightness < 245)
    out[cream] = np.array([255, 247, 232], dtype=np.uint8)

    dark = orig_brightness < 78
    out[dark] = np.array([17, 17, 17], dtype=np.uint8)

    yellow = (or_ > 165) & (og > 120) & (ob < 95)
    out[yellow] = np.array([255, 207, 26], dtype=np.uint8)

    blue = (ob > or_ + 20) & (ob > og + 5) & (orig_brightness < 205)
    out[blue] = np.array([13, 116, 166], dtype=np.uint8)

    green = (og > or_ + 5) & (og > ob + 8) & (orig_brightness < 190) & ~yellow
    out[green] = np.array([99, 137, 49], dtype=np.uint8)

    return out


def prepare(src_name: str, dst_name: str, k: int, is_back: bool) -> None:
    src = ROOT / src_name
    img = Image.open(src).convert("RGB")
    arr = np.array(img)
    arr = cv2.pyrMeanShiftFiltering(arr, sp=14, sr=28)
    arr = cv2.bilateralFilter(arr, d=7, sigmaColor=42, sigmaSpace=42)
    original = arr.copy()
    arr = kmeans_quantize(arr, k)
    arr = flatten_common_colors(arr, original, is_back)
    arr = cv2.medianBlur(arr, 3)
    Image.fromarray(arr).save(ROOT / dst_name)


def main() -> None:
    prepare("source_front.png", "source_front_clean_for_vectorizer_style.png", 34, False)
    prepare("source_back.png", "source_back_clean_for_vectorizer_style.png", 20, True)


if __name__ == "__main__":
    main()
