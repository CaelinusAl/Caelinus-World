# Caelinus · Değişiklik Günlüğü

Bu dosya Caelinus'un teknik sürüm geçmişidir. Amaç: ekip (AURA + Şeyma)
yapılan her anlamlı değişikliği tek yerden, sürüm sürüm takip edebilsin.

**Kurallar (kısa):**
- **SemVer** kullanırız: `MAJOR.MINOR.PATCH`
  - `MAJOR` — geriye dönük kıran büyük değişiklik
  - `MINOR` — yeni özellik (geriye uyumlu)
  - `PATCH` — hata düzeltme / küçük iyileştirme
- Her anlamlı değişiklik buraya bir madde olarak eklenir; başlıklar:
  **Eklendi · Değişti · Düzeltildi · Kaldırıldı · Güvenlik · Altyapı**.
- Bir sürüm yayınlanınca `package.json` versiyonu güncellenir ve git etiketi
  atılır: `git tag vX.Y.Z`.
- En üstte her zaman `## [Yayınlanmamış]` bölümü durur; biriken değişiklikler
  oraya yazılır, sürüm kesilince tarihiyle aşağı taşınır.

Biçim: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/).

---

## [Yayınlanmamış]

_Henüz yayınlanmamış değişiklik yok. Yeni geliştirmeler buraya eklenir; sürüm
kesilince tarihiyle aşağı taşınır._

---

## [0.5.0] — 2026-06-17 · 3D Evren Meydanı (/universe)

### Eklendi
- **`CaelinusUniverseScene` — tam Three.js evren sahnesi (`/universe`):**
  `@react-three/fiber` + `drei` ile interaktif 3B meydan.
  - **Yaşam Motoru (merkez):** 3 orbital halka (altın/mor/gümüş) + nabız atan
    ikozahedron çekirdek + plazma sütunu; altın partiküller (`Sparkles`).
  - **4 ışık yolu:** merkezden SANRI / GAIA / BAZAAR / ATELİER'e uzanan, nefes
    alır gibi parlayan yollar + hover'da parlayıp tıklanınca o dünyaya giden bölge kapıları.
  - **Ayna su zemini** (`MeshReflectorMaterial`) + 6 kutsal geometri halkası.
  - **Kamera giriş yürüyüşü** (z:-34 → z:-9, ease-in-out) → ardından `OrbitControls`
    ile kullanıcı serbest döner/zoom yapar.
  - SSR kapalı (`next/dynamic` `ssr:false`) — Three.js yalnız tarayıcıda.

### Değişti
- **`/universe` artık 3B sahne:** eski 2D portal grid'i (v0.3.0 "Find Your
  Frequency" yönlendirilmiş giriş dâhil) devre dışı bırakıldı; sayfa Three.js
  sahnesine geçti. *Not: 3B sahnenin SEO/yönlendirilmiş-giriş etkisi 2D grid'den
  farklı — lansman öncesi UX/erişilebilirlik gözden geçirilmeli.*

### Düzeltildi
- **Build hatası (`ssr:false` Server Component'te):** `app/universe/page.tsx`
  Server Component iken `next/dynamic({ssr:false})` kullanıyordu → Turbopack build
  hatası. Sayfaya `"use client"` eklenerek çözüldü (TS temiz olsa da build kırılıyordu).

### Altyapı
- **`.gitignore`:** `*.blend` eklendi — Blender çalışma dosyaları (örn.
  `caelinus_universe_v*.blend`) repoya girmez; yalnız optimize render çıktıları commit'lenir.

---

## [0.4.0] — 2026-06-17 · Tapınak Hero (videolu eşik)

### Eklendi
- **Landing'e "Goddess Temple" arka plan katmanı (`HeroBackgroundVideo`):**
  Eşik sahnesi artık canlı bir arka plan üzerinde nefes alıyor.
  - **Masaüstü** → `/hero/hero.mp4` (autoplay/muted/loop, `preload=metadata`).
  - **Mobil / coarse pointer** → `temple-mobile.webp` (640px optimize still).
  - **Video hatası / reduced-motion** → `temple-scene.webp` (1280×720 tapınak).
  - **Poster** → `temple-poster.webp`; SSR'da hafif still (LCP adayı) render edilir.
  - `overlayOpacity={0.55}` — %55 koyu overlay; üstündeki yıldız/altın toz görünür kalır.
- **Yeni asset'ler:** `public/hero/temple-scene.webp`, `temple-mobile.webp`,
  `temple-poster.webp` (+ `temple-act3.webp` ileride 3. perde sahnesi için, henüz bağlı değil).

### Değişti
- **Katman z-index düzeni (`caelinus-entry.css`):** tapınak görseli/video `z:0`,
  sürüklenen yıldızlar `z:1`, altın/mor kozmik toz `z:2`; içerik katmanları `z:3+`.
- **`HeroBackgroundVideo` artık bağlı:** v0.3.0 denetiminde "orphan" işaretlenen
  bileşen aktif render yoluna girdi; CHANGELOG ↔ kod sapması (videolu hero) kapandı.

---

## [0.3.0] — 2026-06-17 · Yaşayan Evren Kapısı + Design System P1

### Eklendi
- **Hero "bir dünyaya yaklaşma" deneyimi (`/`):** Landing artık gökyüzü değil,
  Caelinus medeniyetinin kapısı.
  - **Arka plan videosu canlı:** `public/hero/hero.mp4` (higgsfield üretimi)
    ffmpeg ile 9.25MB → **891KB** optimize edildi (sessiz, faststart);
    `hero-poster.webp` (44KB) + `hero-mobile.webp` (16KB) türetildi. Ham dosya
    `_raw/` (gitignore).
  - **`HeroHorizon` — çok katmanlı parallax medeniyet ufku:** uzak/yakın tapınak
    silüetleri, yaşayan altın pencere ışıkları (yavaş flicker) ve merkezde
    nabız atan **portal kemeri** ("Orada ne var?" merakı). Parallax `.scene`'in
    `--par-x/y`'sinden, katman başına farklı hız + yavaş organik bob.
  - **Çift ay çözümü:** video kendi ayını taşıdığı için CSS ay görseli video
    modunda gizlendi; merkez tıklanabilir kaldı.
  - **Geçiş evrildi:** "aya dalış" yerine **dünyaya yaklaşma → portal açılır**
    (ufuk öne uçar + gökyüzü yakınlaşır + beyaz bloom). Yönlendirme aynı.
  - Tümü `prefers-reduced-motion` ve mobilde sakinleşir; `HERO_VIDEO_ENABLED`
    ile tek satırda klasik CSS-ay hero'ya dönülebilir.

### Değişti · Atmosfer & Tipografi
- **Landing (`/`) premium pas — tipografi + atmosfer:** "AI sayfası" hissinden
  "lüks evren kapısı"na. Yönlendirme/dalış geçişi korundu.
  - **Tipografi token'lardan:** ana slogan iki bloğa ayrıldı — serif başlık
    *"Wear Your Frequency"* (Cormorant 500) + Inter light alt satır
    *"A living universe of fashion, ritual and earth."* Net hiyerarşi:
    logo → slogan → ay → "Enter the Caelinus Universe" → CTA.
  - **CTA:** glassmorphism (ince gold border, koyu translucent, hover'da gold
    glow), pill, Inter medium, uppercase; metin → *"Enter the Universe"*.
  - **Ay/portal:** ~%44 boyuta indirildi; gold + violet aura + ay-arkası nebula
    glow; offset'ler yeniden hesaplandı.
  - **Palet:** `tokens.css` premium değerlere güncellendi (midnight `#07111f`,
    gold `#c9a45c`, soft-gold `#e8d7a3`, ivory `#f5efe1`, moon-silver `#cfd6df`,
    violet-glow); eski isimler alias'landı (WorldShell/SANRI kırılmadan).
  - **Pointer-parallax:** çok hafif (≤4px), yalnızca masaüstü + ince pointer,
    `prefers-reduced-motion` kapalı, transform tabanlı, hareketsizken rAF uyur.
  - **Arka plan:** deep-black→midnight radial, rafine/sakin yıldızlar, ince
    gold-dust; tüm hareket yavaş ve organik.

### Eklendi · Design System
- **Design System — P1 temeli (Caelinus Bible §2–§5, §9):** Yaşayan dijital
  uygarlığın kod omurgası kuruldu. Canlı ticaret akışlarına (shop/checkout/cart)
  dokunulmadı.
  - `app/styles/tokens.css` — tek kaynak token'lar: renk paleti, dünya imza
    aksanları, tipografi ölçeği (clamp/akışkan), boşluk, radius, glow, z-index,
    geçiş süreleri. globals.css en üstünde import; mevcut stiller etkilenmiyor.
  - **Tipografi (`next/font`):** Cormorant Garamond (başlık) + Inter (gövde)
    self-host edildi; CSS değişkenleriyle (`--font-cormorant`, `--font-inter`)
    token'lara bağlandı. `<html>`'e variable sınıfları eklendi.
  - **İkon ailesi (`components/icons`):** Tek elden altı çekirdek sembol —
    `wing · star · flame · portal · mirror · sacred-circle`, `currentColor`,
    tutarlı stroke. `<Icon name=.. />` çözücüsü.
  - **Dünya kaydı (`lib/world/worlds.ts`):** Bible §5'in kod aynası — altı
    dünyanın isim/duygu/imza renk/sembol/rota kimliği (kimlik katmanı; WebGL
    sahne eşlemesinden ayrı).
  - **`WorldShell` page-wrapper (`components/world/WorldShell.tsx` + .css):**
    her dünyaya ortak çerçeve (atmosfer + ribbon + eşik + hero). Eşik dönüşü
    JourneyProvider veil'iyle dünya renginde geçiş yapar.
  - **SANRI referans uygulaması:** `/universe/sanctum` WorldShell ile sarıldı
    (ay-gümüşü imza, ayna sembolü); iç içerik (defter/ritüel/hafıza) korundu.
- **Bible düzeltmeleri:** Kuzey yıldızı → *"Ait olmak için değil, birlikte
  yaratmak için."*; "Frekansını giy" Bazaar ana sloganı olarak ayrıldı;
  SANRI ses tonu *"bilinç aynası"* (yansıtan, alan açan) olarak netleştirildi.

### Değişti · Marka & Yönlendirme
- **Marka mührü (Frekansın Sanatı):** Altın kanatlı logo landing'de metin
  "CAELINUS" yerine ve TopBar markasında kullanılıyor.
  - **Transparan asset (asıl çözüm):** Siyah zeminli JPEG'den parlaklık-tabanlı
    alfa (ffmpeg `geq`) ile temiz transparan PNG üretildi
    (`public/logo/caelinus-mark.png`); logonun sınırına kırpıldı. Eski
    `mix-blend-mode: screen` hack'i landing + TopBar'dan kaldırıldı — logo artık
    siyah kutu/poster gibi değil, sayfa atmosferine gömülü marka mührü gibi.
  - **Boyut:** marka mührü ölçeği — desktop 260px, mobil 180px (`clamp`).
- **Landing'e bilgi kokusu:** `/` artık "Caelinus nedir"i söyleyen tek satır
  içeriyor ("Wear your frequency — a living universe of fashion, ritual &
  earth."); marka önerisi yalnızca görünmez `<head>` metadata'sında değil.
- **Yönlendirilmiş başlangıç (`/universe`):** "Find Your Frequency" featured
  portal oldu — altın aura + "Start here" rozeti + başlık altı yönlendirme.
  10 eşit portalın yarattığı karar felci kırıldı; duygusal giriş, Shop
  (satış) önünde görsel ağırlık kazandı.

### Güvenlik
- **PII sızıntısı kapatıldı (`GET /api/orders`):** Endpoint artık
  `requireAdmin()` ile korunuyor; auth yoksa/yetkisizse `403`. Daha önce tüm
  siparişleri (ad, e-posta, telefon, adres) kimlik doğrulaması olmadan
  dönüyordu.
- **Korumasız biyometrik yükleme kaldırıldı (`/api/upload-face`):** Rota
  tamamen silindi — hiçbir yerden çağrılmıyordu (ölü kod), auth'suzdu,
  `public/`'e yazıyordu (Vercel read-only FS → 500 riski) ve uzantı
  sanitizasyonu yoktu. Gerçek selfie akışı `avatar/session/[id]/selfie`
  üzerinden ilerliyor.
- **`/gizlilik` biyometrik/yüz verisi bölümü:** Açık rıza temelli KVKK
  metni eklendi (özel nitelikli veri tanımı, amaçla sınırlı saklama, rıza
  geri çekme ve silme hakkı).

### Düzeltildi
- **Mobil portal ekranı (`/universe`):** Telefonda kapı kartları ekran
  kenarlarından kesiliyordu (yatay taşma) ve alttaki kapılar
  `100vh + overflow:hidden` yüzünden hiç görünmüyordu. ≤600px için kapı/halka/
  disk küçültüldü, grid daraltıldı; sahne büyüyebilir yapılıp arka plan
  sabitlendi — 10 kapının tamamı kaydırılarak erişilebiliyor.

### Altyapı
- **`public/universe/gaia-garden.mp4` 52.1 MB → 1.5 MB** (ffmpeg; 1280px,
  ses yok, faststart). Orijinal `_raw/` yedeğine alındı (gitignore).

---

## [0.2.0] — 2026-06-16 · Yumuşak Lansman Hazırlığı

### Eklendi
- **Ön sipariş akışı:** Checkout artık ödeme almıyor; e-posta zorunlu,
  telefon opsiyonel, "ekibimiz iletişime geçecek" bildirimi. CTA'lar
  "Ön Sipariş Ver" / "Ön Siparişi Tamamla".
- **Ön sipariş kalıcılığı:** `preorders` tablosu (Supabase migration
  `0017_preorders.sql`); `/api/orders` service-role ile best-effort yazar.
  Canlıda doğrulandı (`persisted:true`).
- **Ön sipariş onay maili:** Müşteriye onay + ekibe (`hello@caelinus.ai`)
  bildirim. Best-effort; akışı kırmaz.
- **Titan SMTP desteği:** `nodemailer` ile; `SMTP_*` env'leri tanımlıysa
  sender Resend yerine Titan posta kutusunu kullanır (yanıtlar kutuya düşer).
- **TL + USD ikili fiyat:** Tüm vitrin/PDP/checkout "$120 · ₺X" gösterir;
  canlı USD→TRY kuru (`/api/fx`, saatlik cache, yedek kur).
- **Yasal sayfalar:** `/gizlilik` (Gizlilik + KVKK), `/cerez-politikasi`,
  `/iletisim` — resmî şirket bilgileriyle (`lib/company.ts`) + footer linkleri.
- **Vercel Analytics + Speed Insights.**

### Değişti
- **Beden modeli iki bedene indi:** `XS-S` ve `M-L` (önceki XS/S/M/L/XL).
  Avatar beden öneri motoru iki bedene göre güncellendi.
- **Navigasyon** çekirdek kapsama indirildi (Universe, Shop, Atelier,
  Manifesto).

### Güvenlik / Altyapı
- **Next.js 16.1.6 → 16.2.9** (güvenlik advisory + Turbopack düzeltmeleri).
  `tsc` + tam `next build` temiz.

---

## [0.1.0] — Başlangıç

- Caelinus evreni, shop, avatar, atelier, play, gaia, manifesto ve frekans
  ağı temel sistemleri (bu günlük başlamadan önceki taban sürüm).
