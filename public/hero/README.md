# Hero arka plan videosu — CAELINUS giriş

Bu klasör landing (`/`) için "nefes alan gökyüzü" arka plan videosunu ve
fallback görsellerini tutar. Kod tarafı hazır
(`components/landing/HeroBackgroundVideo.tsx`); sadece asset'leri buraya bırakıp
flag'i aç.

## Beklenen dosyalar

| Dosya                  | Ne                                   | Hedef boyut        |
|------------------------|--------------------------------------|--------------------|
| `hero-sky.mp4`         | Loop'lu, optimize hero videosu (desktop) | < 3–4 MB (ideal)   |
| `hero-poster.webp`     | Video poster + hata/reduced-motion fallback | < 120 KB     |
| `hero-mobile.webp`     | Mobil statik görsel (video kapalı)   | < 90 KB            |

> Üçü de buraya konulup `app/page.tsx` içindeki `HERO_VIDEO_ENABLED = true`
> yapılınca devreye girer. Şu an `false` → mevcut sayfa byte-aynı, Lighthouse
> etkilenmez.

## Önemli — çift ay olmasın

Landing'in **merkezinde tıklanabilir, parlayan bir ay (portal) + aya-dalış
geçişi** zaten var ve bu katmanın **önünde** durur. Video da merkezde baskın bir
ay içerirse iki ay çakışır.

Bu yüzden videoyu **gökyüzü / bulut / yıldız / altın toz + hafif ay parıltısı**
ağırlıklı üret; merkezde keskin, dolu, büyük bir ay olmasın (ya ay üstte
yumuşak/küçük dursun ya da çerçeve dışına taşsın).

## Higgsfield prompt (kopyala–yapıştır)

Kaynak: https://higgsfield.ai/ai/video

```
CAELINUS hero background — loopable cinematic cosmic atmosphere.

Duration: 12–18s · seamless loop · 16:9 · ultra-realistic cinematic.
Style: luxury cosmic atmosphere, sacred digital temple.

Scene: a vast midnight sky above an ancient sacred landscape. Soft luminous
moonlight from the upper sky (NO dominant moon disk centered — keep the center
open). Very slow drifting clouds. Tiny softly twinkling stars. Subtle gold
cosmic dust floating. A gentle breathing aura of light.

Negative: no explosions, no sci-fi effects, no fantasy creatures, no fast
movement, no text, no logos, no large centered moon.

Camera: extremely slow forward drift, almost imperceptible.

Feeling: standing at the entrance of a sacred universe.

Color palette: deep cosmic black, midnight blue, moon silver, soft ivory,
subtle gold accents.

Mood: luxury · mystery · silence · wonder.
Reference pacing: Apple launch film, Dune atmosphere, luxury fragrance ad.

Output: loopable MP4, minimal motion, maximum atmosphere.
```

## İndirdikten sonra — ffmpeg ile web'e optimize et

ffmpeg (winget): `C:\Users\<sen>\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-*-full_build\bin\ffmpeg.exe`

1) Loop'lu, sessiz, faststart MP4 (1080p, ~16 sn):

```
ffmpeg -i raw.mp4 -an -t 16 \
  -vf "scale=1920:-2:flags=lanczos" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 24 -preset slow -movflags +faststart \
  hero-sky.mp4
```

2) Poster (ilk kare → WebP):

```
ffmpeg -i hero-sky.mp4 -frames:v 1 -vf "scale=1920:-2" hero-poster.webp
```

3) Mobil statik görsel (daha küçük WebP):

```
ffmpeg -i hero-sky.mp4 -frames:v 1 -vf "scale=900:-2" -q:v 80 hero-mobile.webp
```

> CRF'i (22–28) ve süreyi boyut hedefine göre ayarla. Loop kusursuz değilse
> Higgsfield'de "seamless loop" / "ping-pong" seçeneğini kullan ya da
> `-vf "...,reverse"` ile ileri+geri birleştir.

## Davranış (kod garantisi)

- `autoplay + muted + loop + playsInline` (mobil autoplay için muted şart).
- Üstte %42 siyah gradient overlay (`overlayOpacity` prop ile 0.35–0.50 ayarlanır).
- Masaüstü + ince pointer + hareket açık → video.
- Mobil / `prefers-reduced-motion` → `hero-mobile.webp` / `hero-poster.webp`.
- Video 404/hata → otomatik poster'a düşer.
- Aya-dalış geçişinde katman da yumuşakça soluklaşır.
