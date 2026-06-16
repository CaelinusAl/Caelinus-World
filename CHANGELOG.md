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

### Değişti
- **Marka logosu (Frekansın Sanatı):** Altın kanatlı vektörel logo
  (`public/logo/frekansin-sanati.jpeg`) landing'de metin "CAELINUS" yerine ve
  TopBar markasında kullanılıyor. Siyah zemin `mix-blend-mode: screen` ile
  düşürülüp yalnızca altın + parıltı gösteriliyor (koyu sayfalara uygun).
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
