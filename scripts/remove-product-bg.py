"""
Gerçek manken ürün fotoğraflarının arka planını kaldırır → şeffaf PNG.

Yalnızca public/products/<burç>/ klasörlerindeki gerçek model JPG'lerini işler.
Cutout (play/bikinis) ve anime look (play/shop) setlerine DOKUNMAZ.

Çıktı: aynı klasöre <orijinal-ad>-cutout.png (orijinal JPG korunur).
Zaten -cutout.png üretilmişse atlar (idempotent).

Kullanım:
  python scripts/remove-product-bg.py aries        # tek burç
  python scripts/remove-product-bg.py              # tüm burçlar
"""
import sys
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "public" / "products"
IMG_EXT = {".jpg", ".jpeg", ".png"}

# u2netp = insan/portre için iyi sonuç veren hafif model
session = new_session("u2net")


def process_folder(folder: Path) -> list[str]:
    done = []
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() not in IMG_EXT:
            continue
        if f.stem.endswith("-cutout"):        # zaten işlenmiş çıktı
            continue
        out = folder / f"{f.stem}-cutout.png"
        if out.exists():
            print(f"  atla (var): {out.name}")
            done.append(out.name)
            continue
        with open(f, "rb") as fh:
            data = fh.read()
        cut = remove(data, session=session)   # RGBA PNG bytes
        Image.open(io.BytesIO(cut)).save(out)
        print(f"  OK: {f.name} -> {out.name}")
        done.append(out.name)
    return done


def main():
    targets = sys.argv[1:]
    if targets:
        folders = [PRODUCTS / z for z in targets]
    else:
        folders = [d for d in sorted(PRODUCTS.iterdir())
                   if d.is_dir() and not d.name.startswith("_")]
    total = 0
    for folder in folders:
        if not folder.exists():
            print(f"YOK: {folder}")
            continue
        print(f"\n=== {folder.name} ===")
        total += len(process_folder(folder))
    print(f"\nTOPLAM {total} şeffaf PNG hazır.")


if __name__ == "__main__":
    main()
