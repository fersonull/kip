"""Draws Kip's icons (brand direction 1b, "Pebble") into assets/images.

Run: python scripts/make-icons.py
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "images"
APRICOT = "#D9774A"
SAND = "#F1E4D8"
BARK = "#2A2420"
SS = 4  # supersampling for smooth edges

# CSS border-radius: 58% 42% 52% 48% / 56% 50% 50% 44%, as (rx, ry, start angle) per corner.
CORNERS = [(0.58, 0.56, 180), (0.42, 0.50, 270), (0.52, 0.50, 0), (0.48, 0.44, 90)]


def pebble_points(x, y, w, h, steps=64):
    pts = []
    for i, (fx, fy, start) in enumerate(CORNERS):
        rx, ry = fx * w, fy * h
        cx = x + rx if i in (0, 3) else x + w - rx
        cy = y + ry if i in (0, 1) else y + h - ry
        for s in range(steps + 1):
            t = math.radians(start + 90 * s / steps)
            pts.append((cx + rx * math.cos(t), cy + ry * math.sin(t)))
    return pts


def draw(size, bg, pebble_w, body, eye, eye_cutout=False):
    """A pebble of width pebble_w (fraction of size) centred on a size x size canvas."""
    n = size * SS
    img = Image.new("RGBA", (n, n), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    w = pebble_w * n
    h = w * 80 / 96  # same proportions as the in-app logo (96 x 80)
    x, y = (n - w) / 2, (n - h) / 2
    d.polygon(pebble_points(x, y, w, h), fill=body)
    r = w * 0.19 / 2
    ex, ey = x + w * 0.58 + r, y + h * 0.33 + r
    d.ellipse((ex - r, ey - r, ex + r, ey + r), fill=(0, 0, 0, 0) if eye_cutout else eye)
    return img.resize((size, size), Image.LANCZOS)


def main():
    # Adaptive icon: 108dp canvas, about 72dp visible after the launcher mask. Pebble = 59% of the visible part.
    visible = 72 / 108
    draw(1024, None, 0.59 * visible, APRICOT, BARK).save(OUT / "android-icon-foreground.png")
    draw(1024, None, 0.59 * visible, "#FFFFFF", None, eye_cutout=True).save(OUT / "android-icon-monochrome.png")
    Image.new("RGBA", (1024, 1024), SAND).save(OUT / "android-icon-background.png")
    # Full-bleed square (store listing, anything that doesn't use the adaptive layers).
    draw(1024, SAND, 0.59, APRICOT, BARK).save(OUT / "icon.png")
    # Splash and favicon: just the pebble.
    draw(1024, None, 0.96, APRICOT, BARK).save(OUT / "splash-icon.png")
    draw(48, None, 0.96, APRICOT, BARK).save(OUT / "favicon.png")
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
