# CAELINUS · "Goddess Temple" Ana Sinematik — Video Brief

> **Amaç:** Caelinus ana sinematik videosu ("Goddess Temple") için Higgsfield
> üretim brief'i. Higgsfield tek seferde 5–10 sn klip ürettiği için sekans
> **6 klibe** bölünmüştür; her klibe aynı **stil çıpası** eklenir (tutarlılık).
>
> **Sürüm:** v1 · Tarih: 2026-06-17 · Üretim aracı: Higgsfield (web · app.higgsfield.ai)
> **Çıktı hedefi:** landing videolu hero (`HeroBackgroundVideo`) + `/universe` arka plan.

---

## Stil çıpası (HER klibin sonuna ekle)

```
Ancient goddess civilization, Basilica Cistern underground temple, sacred dark
water, giant purple moon. Palette: deep black, moon silver, amethyst purple, soft
lavender, warm gold. Volumetric lighting, fog, water reflections, slow breathing
camera, 8K cinematic realism. NOT sci-fi, NOT cyberpunk, NOT generic fantasy.
```

## Negatif / kaçınılacaklar

```
cyberpunk, sci-fi, neon city, modern technology, realistic human faces, text
artifacts, watermark, distorted anatomy, oversaturated
```

---

## Çekim kartları

### Klip 1 — Giriş (su koridoru)
```
Camera slowly glides through dark underground water corridors of an ancient
temple. Ancient columns rise from sacred water and disappear into mist. Purple
moonlight enters from a ceiling opening and reflects on the surface. Soft golden
particles float. A distant violet portal glows at the far end. Entering a
forgotten civilization. [+ STİL ÇIPASI]
```

### Klip 2 — Medusa uyanışı
```
The camera slowly approaches a colossal upside-down Medusa head emerging from the
sacred water. Water drips from ancient stone, her eyes closed. Golden sacred
symbols awaken around her, violet energy flows through cracks in the stone.
Ancient feminine wisdom awakening. [+ STİL ÇIPASI]
```

### Klip 3 — Portal açılışı
```
Above the Medusa head, golden sacred-geometry rings rotate slowly. Violet energy
gathers at the center and a massive portal opens. Golden particles spiral upward,
water ripples across the entire temple, the portal grows brighter. A divine
gateway opening between worlds. [+ STİL ÇIPASI]
```

### Klip 4 — Tanrıçaların doğuşu
```
From the glowing portal emerge luminous goddess holograms made of golden and
violet light (not technology — living divine energy). Each leaves trails of
sacred symbols as she rises over the sacred water. Epic cinematic realism.
[+ STİL ÇIPASI]
```

### Klip 5 — Birleşme
```
Five radiant goddess holograms gather around the portal above the sacred water,
their light reflected on the surface, golden symbols connecting them. The camera
slowly rises. Mystical, elegant, feminine, divine. [+ STİL ÇIPASI]
```

### Klip 6 — Final + başlık
```
The camera rises above the temple as a giant purple moon appears overhead and the
entire underground civilization glows. Slow, breathing motion. End on title text
appearing softly. [+ STİL ÇIPASI]
```
> Final yazıyı ("CAELINUS — Wear Your Frequency / A living universe of goddesses,
> memory and creation") Higgsfield'a yazdırma; **kurguda altyazı/title** olarak ekle
> (font tutarlılığı + okunabilirlik için).

---

## Higgsfield ayarları

- **Motion / camera:** en düşük seviye ("slow / subtle") — "breathing temple" hissi.
- **Aspect ratio:** site hero için **16:9**; mobil için ayrıca **9:16** üret.
- **Tanrıça isimleri** (Sophia/Artemis/Isis/Selene/Gaia): prompt'a yazma — model
  ayırt edemez; "five distinct goddess holograms" de, isimleri kurguda altyazıla.

---

## Üretim sonrası (AURA otomatik yapacak)

1. `ffmpeg` ile optimize (sessiz, faststart, web boyutu) + `*-poster.webp` ve
   `*-mobile.webp` türevleri (referans: `hero.mp4` 9.25MB → 891KB).
2. `public/hero/` (veya `public/universe/`) altına yerleştir; ham dosya `_raw/`
   (gitignore).
3. Landing'in **videolu hero** koluna bağla (`components/landing/HeroBackgroundVideo.tsx`
   — şu an orphan; bu video onu canlandırır) ve CHANGELOG + SemVer ile sürüm atla.
