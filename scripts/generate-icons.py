#!/usr/bin/env python3
"""Generate OpenResume's light and dark icon sets from the supplied masters.

The PNG masters in assets/branding/source-assets are authoritative. The script
crops each master to its artwork bounds, centers the artwork on a square canvas
with a consistent safe margin, and downsamples with Lanczos resampling.

Usage:
  python3 scripts/generate-icons.py
  python3 scripts/generate-icons.py --brand-out "/path/to/openresume-brand-assets"

The second form also writes the review-ready brand folder used outside the
repository. Masters are copied byte-for-byte; the source files are never edited.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops
except ImportError:  # pragma: no cover - environment check
    print("Pillow is required: python3 -m pip install Pillow", file=sys.stderr)
    raise SystemExit(1)

MASTER_LIGHT = "openresume_lightmode.png"
MASTER_DARK = "openresume_darkmode.png"

# Fraction of the square icon reserved as padding on each side.
ICON_PADDING = 0.12
# Pixels differing from the corner colour by more than this belong to the mark.
ARTWORK_THRESHOLD = 12

WEB_ICONS = {
    "favicon-16.png": 16,
    "favicon-32.png": 32,
    "apple-touch-icon.png": 180,
    "apple-touch-icon-152x152.png": 152,
    "mstile-150x150.png": 150,
    "icon-192.png": 192,
    "icon-512.png": 512,
}
DARK_WEB_ICONS = {
    "favicon-16.png": 16,
    "favicon-32.png": 32,
    "icon-192.png": 192,
    "icon-512.png": 512,
}


def artwork_bounds(image: Image.Image) -> tuple[tuple[int, int, int, int], tuple[int, int, int]]:
    background = image.getpixel((0, 0))
    flattened = image.convert("RGB")
    difference = ImageChops.difference(
        flattened,
        Image.new("RGB", flattened.size, background),
    )
    mask = difference.convert("L").point(lambda value: 255 if value > ARTWORK_THRESHOLD else 0)
    box = mask.getbbox()
    if box is None:
        raise ValueError("The source image contains no artwork outside its background.")
    return box, background


def render_icon(
    image: Image.Image,
    size: int,
    *,
    bounds: tuple[tuple[int, int, int, int], tuple[int, int, int]] | None = None,
) -> Image.Image:
    box, background = bounds or artwork_bounds(image)
    artwork = image.convert("RGB").crop(box)
    inner = max(1, round(size * (1 - 2 * ICON_PADDING)))
    scale = min(inner / artwork.width, inner / artwork.height)
    width = max(1, round(artwork.width * scale))
    height = max(1, round(artwork.height * scale))
    artwork = artwork.resize((width, height), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (size, size), background)
    canvas.paste(artwork, ((size - width) // 2, (size - height) // 2))
    return canvas


def write_ico(image: Image.Image, target: Path) -> None:
    render_icon(image, 256, bounds=artwork_bounds(image)).save(
        target,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )


def render_social(image: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (1200, 630), image.getpixel((0, 0)))
    icon = render_icon(image, 320, bounds=artwork_bounds(image))
    canvas.paste(icon, ((1200 - 320) // 2, (630 - 320) // 2))
    return canvas


def write_icon_set(image: Image.Image, target: Path, sizes: dict[str, int]) -> None:
    target.mkdir(parents=True, exist_ok=True)
    bounds = artwork_bounds(image)
    for filename, size in sizes.items():
        render_icon(image, size, bounds=bounds).save(target / filename, format="PNG")


def write_public(light: Image.Image, dark: Image.Image, public_dir: Path) -> None:
    public_dir.mkdir(parents=True, exist_ok=True)
    light_bounds = artwork_bounds(light)
    dark_bounds = artwork_bounds(dark)

    for filename, size in WEB_ICONS.items():
        render_icon(light, size, bounds=light_bounds).save(public_dir / filename, format="PNG")

    for filename, size in DARK_WEB_ICONS.items():
        dark_name = filename.removesuffix(".png") + "-dark.png"
        render_icon(dark, size, bounds=dark_bounds).save(public_dir / dark_name, format="PNG")

    write_ico(light, public_dir / "favicon.ico")
    render_social(light).save(public_dir / "openresume-social.png", format="PNG")


def copy_brand_folder(
    light: Image.Image,
    dark: Image.Image,
    brand_out: Path,
    repo_root: Path,
) -> None:
    masters = brand_out / "masters"
    light_dir = brand_out / "icons" / "light"
    dark_dir = brand_out / "icons" / "dark"
    social_dir = brand_out / "social"
    for directory in (masters, light_dir, dark_dir, social_dir):
        directory.mkdir(parents=True, exist_ok=True)

    shutil.copyfile(repo_root / "assets" / "branding" / "source-assets" / MASTER_LIGHT, masters / MASTER_LIGHT)
    shutil.copyfile(repo_root / "assets" / "branding" / "source-assets" / MASTER_DARK, masters / MASTER_DARK)

    write_icon_set(light, light_dir, WEB_ICONS)
    write_ico(light, light_dir / "favicon.ico")
    write_icon_set(dark, dark_dir, DARK_WEB_ICONS)
    render_social(light).save(social_dir / "openresume-social-light.png", format="PNG")
    render_social(dark).save(social_dir / "openresume-social-dark.png", format="PNG")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate OpenResume's icon and social assets.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Repository root (default: the script's parent).",
    )
    parser.add_argument(
        "--brand-out",
        type=Path,
        help="Optional brand asset folder for the OneDrive review copy.",
    )
    args = parser.parse_args()
    root: Path = args.root
    sources = root / "assets" / "branding" / "source-assets"
    light_path = sources / MASTER_LIGHT
    dark_path = sources / MASTER_DARK

    if not light_path.exists() or not dark_path.exists():
        print(f"Missing icon masters in {sources}", file=sys.stderr)
        return 1

    try:
        with Image.open(light_path) as light_file:
            light = light_file.convert("RGB")
        with Image.open(dark_path) as dark_file:
            dark = dark_file.convert("RGB")

        if light.size != (1024, 1024) or dark.size != (1024, 1024):
            print("Icon masters must both be 1024x1024.", file=sys.stderr)
            return 1

        app_icon = root / "assets" / "app-icon"
        write_icon_set(light, app_icon / "light", WEB_ICONS)
        write_ico(light, app_icon / "light" / "favicon.ico")
        write_icon_set(dark, app_icon / "dark", DARK_WEB_ICONS)
        shutil.copyfile(light_path, app_icon / "icon-source.png")
        write_public(light, dark, root / "public")

        if args.brand_out:
            copy_brand_folder(light, dark, args.brand_out, root)

        print("Generated light and dark icon sets.")
        print(f"Masters: {light_path.name}, {dark_path.name}")
        print(f"Repository icons: {app_icon}")
        print(f"Runtime assets: {root / 'public'}")
        if args.brand_out:
            print(f"Brand review folder: {args.brand_out}")
        return 0
    except (OSError, ValueError) as error:
        print(f"Icon generation failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
