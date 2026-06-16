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

_(Sıradaki sürüme girecek değişiklikler buraya.)_

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
