# Lansman Kontrol Listesi · Caelinus

Yumuşak lansman (soft launch) modeli: **ön sipariş** akışı, gerçek tahsilat
yok; çekirdek kapsam (Universe, Shop, Atelier, Manifesto); TL + USD fiyat.
Avatar sistemi bu lansmanın **dışında** (Şeyma ekibi teslim edince açılır).

Durum anahtarı: ✅ tamam · ⏳ bekliyor · 👤 kullanıcı aksiyonu · 🔜 lansman sonrası · ⛔ bloklayıcı

Son güncelleme: 17 Haziran 2026

---

## 0. Bloklayıcılar (canlıya geçmeden ÖNCE)

| Durum | Madde | Not |
|------|-------|-----|
| 👤⛔ | **E-posta gönderimi canlı** | Titan `SMTP_*` env'leri **doğru** Vercel projesine (`caelinus-world`) eklenmeli; ya da Resend domain doğrulaması + `RESEND_API_KEY`. Yoksa ön sipariş onay maili gitmez (akış kırılmaz ama müşteri/ekip bilgilendirilmez). |
| 👤⛔ | **Supabase migration `0017_preorders`** | Uygulandı mı teyit et; uygulanmazsa ön siparişler kalıcı olmaz (sadece bellekte). |
| ✅ | **PII endpoint'leri kapalı** | `GET /api/orders` artık admin-only; `/api/upload-face` kaldırıldı. |
| 👤 | **`CAELINUS_ADMIN_EMAILS`** | Prod'da dolu olmalı — yoksa admin-only endpoint'ler kimseye açılmaz (doğru) ama sipariş listesine de erişemezsin. |

---

## 1. Güvenlik & gizlilik

| Durum | Madde |
|------|-------|
| ✅ | `GET /api/orders` `requireAdmin()` ile korunuyor (PII sızıntısı kapatıldı) |
| ✅ | `/api/upload-face` (korumasız biyometrik yükleme) kaldırıldı |
| ✅ | `/gizlilik` biyometrik/yüz verisi + açık rıza bölümü içeriyor |
| ✅ | Secret'lar `.env.local`'da; `lib/env.ts` prod build'de zorunlu doğrulama yapıyor |
| 🔜 | **Yüz akışında in-flow onay (KVKK checkbox):** Selfie ekranına rıza kutusu — avatar canlıya çıkmadan ÖNCE şart (şu an avatar kapalı, bloklayıcı değil) |
| 🔜 | **Avatar session rotaları auth/imza:** `session GET/result` capability-URL tasarımı; avatar canlıya geçerken rate-limit + imza eklenmeli |

## 2. Yasal & uyumluluk

| Durum | Madde |
|------|-------|
| ✅ | `/gizlilik` (Gizlilik + KVKK), `/cerez-politikasi`, `/iletisim` sayfaları |
| ✅ | Resmî şirket bilgileri tek kaynakta (`lib/company.ts`) + footer linkleri |
| ⏳ | **Mesafeli satış / iade-teslimat metni:** Ön sipariş için "tahsilat yok, ekip iletişime geçecek" notu var; gerçek satışa geçişte mesafeli satış sözleşmesi + iade koşulları sayfası gerekecek |

## 3. Ödeme & sipariş (ön sipariş modeli)

| Durum | Madde |
|------|-------|
| ✅ | Checkout ödeme almıyor; e-posta zorunlu, telefon opsiyonel |
| ✅ | Ön sipariş `preorders` tablosuna yazılıyor (canlıda `persisted:true` doğrulandı) |
| ✅ | Müşteriye onay + ekibe bildirim maili (best-effort) |
| ✅ | Beden modeli iki bedene indi (XS-S / M-L) + sepet/öneri motoru uyumlu |
| 🔜 | **Gerçek tahsilat (Stripe):** Altyapı kısmen hazır (`docs/stripe-setup.md`); soft launch sonrası |

## 4. Fiyat & i18n

| Durum | Madde |
|------|-------|
| ✅ | Tüm vitrin/PDP/checkout USD + TL ("$120 · ₺X") |
| ✅ | Canlı USD→TRY kuru (`/api/fx`, saatlik cache, kur çekilemezse yedek) |
| ✅ | TR / EN dil desteği |

## 5. Performans & medya

| Durum | Madde |
|------|-------|
| ✅ | `gaia-garden.mp4` 52.1 MB → 1.5 MB |
| ✅ | Shop/ürün video + foto'ları optimize edildi (`shop:*` scriptleri) |
| ✅ | `BackgroundVideo` adaptif: reduced-motion / Save-Data / yavaş ağda poster'a düşer |
| ✅ | Mobil portal ekranı (`/universe`) düzeltildi — kapılar kesilmiyor, hepsi erişilebilir |
| ⏳ | **Diğer ağır asset taraması:** `public/` altında kalan büyük dosyaları gözden geçir (lansman öncesi son kontrol) |
| 🔜 | **`globals.css` parçalama:** 28k+ satır tek dosya; lansman sonrası modülerleştirme planlı |

## 5b. Kod hijyeni — v0.3.0 denetimi (17.06)

Kıdemli mühendis denetiminde tespit edilen açık maddeler. Build/tsc/lint **temiz**;
aşağıdakiler bloklayıcı değil ama profesyonel düzen için kapatılmalı.

| Durum | Madde | Not |
|------|-------|-----|
| ⏳ | **Orphan bileşenler** | `components/landing/PortalMoon.tsx` ve `HeroBackgroundVideo.tsx` hiçbir yerden import edilmiyor (ölü kod). Aktif landing `CaelinusEntryScene` ay için düz `<img src="/assets/moon.webp">` kullanıyor. Karar: **bağla** (hero'yu PortalMoon/video ile zenginleştir) **veya sil**. |
| ⏳ | **CHANGELOG ↔ kod sapması** | `[0.3.0]` "Eklendi" hero'yu **videolu** (`hero.mp4`, `HeroHorizon`, çift-ay, `HERO_VIDEO_ENABLED`) anlatıyor; aktif kod ise CSS/img ay + `LivingLogo`. Asset'ler (`public/hero/hero.mp4`) repoda ama render yoluna bağlı değil. CHANGELOG'u gerçeğe göre düzelt ya da videolu hero'yu bağla. |
| ⏳ | **`globals.css` dev (≈3k+ satır, +1380)** | Tek dosya büyüdü; lansman sonrası modülerleştirme (zaten §5'te planlı). |
| ⏳ | **`next-env.d.ts` izleniyor** | `.gitignore`'da olmasına rağmen geçmişten tracked; `git rm --cached next-env.d.ts` ile temizlenebilir. |
| ✅ | **ESLint config yavaş** | `npm run lint` (flat config) tüm projede çok yavaş/asılı kalıyor; `tsc --noEmit` + `next build` doğrulaması temiz. İleride lint kapsamını daralt. |

## 6. Analitik & izleme

| Durum | Madde |
|------|-------|
| ✅ | Vercel Analytics + Speed Insights |
| ⏳ | **Hata izleme:** Prod hataları için bir takip (Vercel logs yeterli mi, yoksa Sentry?) kararı |

## 7. Domain & altyapı

| Durum | Madde |
|------|-------|
| ✅ | `caelinus.ai` primary (no-redirect), `www` → `caelinus.ai` (308) |
| ✅ | Supabase redirect URL'leri (`/**` wildcard) |
| 👤 | **Vercel env'leri doğru projede** — `caelinus-world` (duplicate projeler temizlendi); SMTP env'leri buraya |
| ⏳ | **Yedek/rollback planı:** Son iyi deploy'a hızlı dönüş prosedürü |

## 8. İçerik & son göz

| Durum | Madde |
|------|-------|
| ⏳ | 12 burç ürününün foto/video/fiyat/beden bilgisi tam mı |
| ⏳ | Manifesto / Atelier / Gaia metinleri lansmana hazır mı |
| ⏳ | 404 / boş durum / hata ekranları marka tonunda mı |
| ⏳ | Mobil cihazda uçtan uca tıklama testi (portal → shop → PDP → ön sipariş) |

## 9. Avatar (lansman dışı — Şeyma teslimi)

| Durum | Madde |
|------|-------|
| 🔜 | `CAELINUS_BODY_LIBRARY` boş → `AVATARS_IN_PRODUCTION` flag'iyle UI kapalı (kasıtlı) |
| 🔜 | Gerçek 3D body'ler eklenince: in-flow KVKK onayı + session auth (bkz. §1) ile birlikte açılır |

---

### Hızlı "go/no-go" özeti

**Go için minimum:** §0'daki dört bloklayıcı (e-posta canlı, migration teyidi,
admin e-postaları) + §8 mobil uçtan uca test. Geri kalan ✅'ler tamam; 🔜'ler
bilinçli olarak lansman sonrasına bırakıldı.
