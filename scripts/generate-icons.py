#!/usr/bin/env python3
"""Generate OpenResume's placeholder icon set.

Draws a simple résumé-document mark on the Kovina deep-green field and writes
the canonical 1024px source plus the web favicon sizes used by the app.

Usage:
  python3 scripts/generate-icons.py [--out PATH]

Exit codes:
  0  icons written
  1  PIL is unavailable or the output directory cannot be created
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover - environment check
    print("Pillow is required: python3 -m pip install Pillow", file=sys.stderr)
    raise SystemExit(1)

GREEN = (20, 83, 45, 255)
WHITE = (255, 255, 255, 255)
FOLD = (226, 238, 229, 255)
CLEAR = (0, 0, 0, 0)


def draw_icon(size: int) -> Image.Image:
    scale = size / 1024
    image = Image.new("RGBA", (size, size), CLEAR)
    draw = ImageDraw.Draw(image)

    draw.rectangle([0, 0, size, size], fill=GREEN)

    document = [round(value * scale) for value in (264, 188, 760, 836)]
    draw.rounded_rectangle(document, radius=max(2, round(40 * scale)), fill=WHITE)

    fold = round(112 * scale)
    right, top = document[2], document[1]
    draw.polygon([(right - fold, top), (right, top), (right, top + fold)], fill=FOLD)

    line_x = round(340 * scale)
    for width, y in ((344, 372), (344, 472), (250, 572), (250, 672)):
        box = [
            line_x,
            round(y * scale),
            line_x + round(width * scale),
            round((y + 34) * scale),
        ]
        draw.rounded_rectangle(box, radius=max(1, round(17 * scale)), fill=GREEN)

    return image


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate the OpenResume placeholder icon set.",
        epilog="The 1024px source is written to assets/app-icon/icon-source.png.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Repository root to write into (default: the script's parent).",
    )
    args = parser.parse_args()

    root: Path = args.out
    icon_dir = root / "assets" / "app-icon"
    public_dir = root / "public"
    try:
        icon_dir.mkdir(parents=True, exist_ok=True)
        public_dir.mkdir(parents=True, exist_ok=True)
    except OSError as error:
        print(f"Could not create output directories: {error}", file=sys.stderr)
        return 1

    source = draw_icon(1024)
    source.save(icon_dir / "icon-source.png", format="PNG")

    outputs = {
        public_dir / "icon-512.png": 512,
        public_dir / "icon-192.png": 192,
        public_dir / "apple-touch-icon.png": 180,
        public_dir / "favicon-32.png": 32,
        public_dir / "favicon-16.png": 16,
    }
    for path, size in outputs.items():
        draw_icon(size).save(path, format="PNG")

    favicon = draw_icon(256)
    favicon.save(public_dir / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

    print(f"Wrote icon source to {icon_dir / 'icon-source.png'}")
    print(f"Wrote {len(outputs) + 1} web icons to {public_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
