"""Cutout'lardan burç-bazlı kontakt föyü üretir — poz seçimi için."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "public" / "products"
OUT = ROOT / "_work" / "cutout-contact-sheet.png"
OUT.parent.mkdir(exist_ok=True)

ZODIAC = ["aries","taurus","gemini","cancer","leo","virgo",
          "libra","scorpio","sagittarius","capricorn","aquarius","pisces"]

CELL_W, CELL_H = 150, 240
PAD = 8
LABEL_H = 16
COLS = 8  # en fazla 8 cutout/burç

rows = len(ZODIAC)
sheet_w = 90 + COLS * (CELL_W + PAD)
sheet_h = rows * (CELL_H + LABEL_H + PAD) + 20
sheet = Image.new("RGB", (sheet_w, sheet_h), (245, 245, 243))
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("arial.ttf", 12)
    bfont = ImageFont.truetype("arialbd.ttf", 14)
except Exception:
    font = ImageFont.load_default()
    bfont = font

y = 10
for z in ZODIAC:
    folder = PRODUCTS / z
    cutouts = sorted(folder.glob("*-cutout.png")) if folder.exists() else []
    draw.text((6, y + CELL_H // 2), z, fill=(20, 20, 20), font=bfont)
    x = 90
    for i, c in enumerate(cutouts[:COLS]):
        im = Image.open(c).convert("RGBA")
        im.thumbnail((CELL_W, CELL_H))
        cell = Image.new("RGBA", (CELL_W, CELL_H), (255, 255, 255, 0))
        cell.paste(im, ((CELL_W - im.width)//2, (CELL_H - im.height)//2), im)
        sheet.paste(cell, (x, y), cell)
        # etiket: dosya adının kısa hali
        name = c.stem.replace("-cutout", "")
        draw.text((x + 2, y + CELL_H + 1), f"{i}:{name}", fill=(60, 60, 60), font=font)
        x += CELL_W + PAD
    y += CELL_H + LABEL_H + PAD

sheet.save(OUT)
print(f"Kaydedildi: {OUT}  ({sheet_w}x{sheet_h})")
