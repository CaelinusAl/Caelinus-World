"""
Her burç için en 'tam boy ayakta' cutout'u seçer (alfa bbox boy/en oranı en yüksek),
mapping'i TS olarak yazar ve referans gibi yan yana önizleme üretir.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "public" / "products"
PREVIEW = ROOT / "_work" / "lineup-preview.png"
MAPOUT = ROOT / "_work" / "lineup-map.json"

ZODIAC = ["aries","taurus","gemini","cancer","leo","virgo",
          "libra","scorpio","sagittarius","capricorn","aquarius","pisces"]


def score(path: Path):
    """boy/en oranı + doluluk — tam boy ayakta pozu favori yapar."""
    im = Image.open(path).convert("RGBA")
    bbox = im.getbbox()
    if not bbox:
        return (0, 0, im)
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    if w == 0:
        return (0, 0, im)
    ratio = h / w
    area = w * h
    cropped = im.crop(bbox)
    return (ratio, area, cropped)


picks = {}
crops = {}
for z in ZODIAC:
    folder = PRODUCTS / z
    cands = sorted(folder.glob("*-cutout.png")) if folder.exists() else []
    best = None
    for c in cands:
        ratio, area, cropped = score(c)
        # tam-boy adayı: oran 1.6+; en yüksek oranı seç, eşitse büyük alan
        key = (round(ratio, 2), area)
        if best is None or key > best[0]:
            best = (key, c, cropped)
    if best:
        picks[z] = best[1].name
        crops[z] = best[2]
        print(f"{z:12s} -> {best[1].name}  (oran {best[0][0]})")

MAPOUT.write_text(json.dumps(picks, ensure_ascii=False, indent=2), encoding="utf-8")

# ── referans gibi yan yana önizleme ──
FIG_H = 360
GAP = 40
PADX = 60
PADY = 80
norm = []
for z in ZODIAC:
    im = crops[z]
    scale = FIG_H / im.height
    norm.append(im.resize((max(1, int(im.width * scale)), FIG_H)))
total_w = PADX * 2 + sum(i.width for i in norm) + GAP * (len(norm) - 1)
total_h = FIG_H + PADY * 2
canvas = Image.new("RGB", (total_w, total_h), (244, 244, 242))
x = PADX
baseline = PADY + FIG_H
for im in norm:
    canvas.paste(im, (x, baseline - im.height), im)
    x += im.width + GAP
canvas.save(PREVIEW)
print(f"\nÖnizleme: {PREVIEW} ({total_w}x{total_h})")
print(f"Mapping:  {MAPOUT}")
