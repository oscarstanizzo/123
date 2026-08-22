#!/usr/bin/env python3
"""Decodes iPhone .heic photos in images/ to high-quality JPEG.

sharp cannot read them: libheif rejects iPhone HEICs whose iref box holds more
references than its security limit allows (HDR gain maps push it past 16), so
the pipeline converts them here first. Originals are moved to
images/_originals/ rather than deleted.
"""
import shutil
import sys
from pathlib import Path

try:
    import pillow_heif
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("missing deps — run: pip install pillow-heif pillow")

pillow_heif.register_heif_opener()

SRC = Path("images")
KEEP = SRC / "_originals"
QUALITY = 95

heics = sorted(p for p in SRC.glob("*") if p.suffix.lower() in {".heic", ".heif"})

if not heics:
    print("no .heic files in images/ — nothing to decode")
    sys.exit(0)

KEEP.mkdir(exist_ok=True)
converted = 0

for src in heics:
    dest = src.with_suffix(".jpg")
    if dest.exists():
        print(f"  skip {src.name} — {dest.name} already exists")
        continue

    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)  # bake in EXIF orientation
        if im.mode != "RGB":
            im = im.convert("RGB")
        im.save(dest, "JPEG", quality=QUALITY, subsampling=0, optimize=True)
        print(f"  {src.name}  ->  {dest.name}   {im.width}x{im.height}")

    shutil.move(str(src), str(KEEP / src.name))
    converted += 1

print(f"\ndecoded {converted} file(s); originals moved to {KEEP}/")
