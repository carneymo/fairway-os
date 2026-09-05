"""Prepare an approved course photo: python scripts/prepare_course_photo.py INPUT SLUG.

Requires Pillow. Outputs responsive WebP files without enlarging the original.
Record source, author, license, and capture date in the course metadata separately.
"""
import argparse
from pathlib import Path
import re

from PIL import Image, ImageOps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("slug")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug):
        parser.error("Use a lowercase course slug, such as fossil-trace")
    output = Path(__file__).resolve().parents[1] / "public" / "photos" / args.slug
    with Image.open(args.input) as source:
        photo = ImageOps.exif_transpose(source).convert("RGB")
        if photo.width < 960:
            parser.error("Use an original at least 960 pixels wide")
        output.mkdir(parents=True, exist_ok=True)
        widths = sorted({min(width, photo.width) for width in (480, 960, 1600, 2400)})
        for width in widths:
            height = round(photo.height * width / photo.width)
            path = output / f"{width}.webp"
            photo.resize((width, height), Image.Resampling.LANCZOS).save(
                path, "WEBP", quality=84, method=6
            )
            print(f"{path.name}: {width}x{height}, {path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
