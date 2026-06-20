# Katkı Rehberi · Caelinus

Caelinus ortak bir evren — kod AURA (Cursor/AI asistanı) ve Şeyma ekibi
tarafından birlikte yazılıyor. Bu döküman ikimizin de aynı kurallarla
çalışması içindir ki canlı sistem bozulmasın ve değişiklikler izlenebilir
kalsın.

Kurulum ve komutlar: `DEVELOPMENT.md`. Sürüm geçmişi: `CHANGELOG.md`.

## Temel ilkeler

1. **Canlı çalışan şeye dokunma.** Bir akış (checkout, ön sipariş, auth,
   ödeme, e-posta) çalışıyorsa, ilgili olmayan refactor'la onu riske atma.
2. **Güvenlik > özellik.** PII (ad, e-posta, telefon, adres) ve biyometrik
   (yüz/selfie) veri içeren her endpoint auth ister. Yeni endpoint eklerken
   varsayılan tavrın "kapalı"dır.
3. **Stub'ı koru.** AI/ödeme/e-posta env'leri yoksa sistem stub'a düşmeli;
   bir env eksik diye build/dev kırılmamalı.
4. **Küçük, anlamlı commit.** Bir commit tek bir mantıklı değişiklik olsun.

## Branch & commit akışı

- Remote: `github.com/CaelinusAl/Caelinus-World` · ana dal: `main`.
- Yeni iş için dal aç: `feat/...`, `fix/...`, `security/...`, `docs/...`.
- `main`'e doğrudan push yalnızca küçük/acil düzeltmeler için; daha büyük iş
  PR ile gelsin.
- **`main`'e force push yok.** Geçmişi yeniden yazma.

### Commit mesajı

Konvansiyon (Türkçe gövde sorun değil):

```
<tip>: <kısa özet>

<neden — ne değişti değil, niçin>
```

Tipler: `feat` · `fix` · `security` · `docs` · `refactor` · `perf` · `chore`.

Örnek:

```
security: GET /api/orders'ı admin'e kilitle

Tüm siparişleri auth'suz dönüyordu (PII sızıntısı). requireAdmin() eklendi.
```

## Göndermeden önce (checklist)

```bash
npx tsc --noEmit   # tip hatası yok
npm run lint       # lint temiz
npm run build      # (büyük değişikliklerde) prod build geçiyor
```

- Düzenlediğin dosyalarda linter uyarısı bırakma.
- Yeni bir env eklediysen `.env.example`'a açıklamasıyla ekle.
- Anlamlı değişikliği `CHANGELOG.md` → `[Yayınlanmamış]` altına yaz.

## Stil & kod kuralları

- **TypeScript + Next.js App Router.** Server/Client ayrımına dikkat:
  `"use client"` yalnızca gerçekten gerekliyse. Sunucu-only modüller
  `import "server-only"` ile korunur — bunları client component'e import etme.
- **CSS tek dosyada:** `app/globals.css`. Yeni stil eklerken ilgili bileşenin
  sınıf-ön ekini (`cu-`, `bazaar-`, `pdp-`, vb.) kullan; mobil için mevcut
  `@media (max-width: ...)` kalıplarına uy. (Bu dosya büyük; lansman sonrası
  parçalanması planlı.)
- **Para birimi:** Fiyatlar üründe USD (`numericPrice`). Gösterimde her zaman
  `PriceDual` / `lib/pricing.ts` kullan — elle "₺" yazma.
- **Yorum:** Sadece "niçin"i açıkla; bariz olanı tekrar etme.
- **Gizli veri:** Secret'ı koda gömme. `.env.local` + `lib/env.ts`.

## Avatar body kaydı — iki dosya birlikte

Bir avatar body'si eklerken/çıkarırken **iki kaynak senkron kalmalı**, yoksa
seçici (`BodyPicker`, `AvatarCarousel`) ile gerçek varlık uyuşmaz:

1. `lib/avatar-bodies.ts → CAELINUS_BODY_LIBRARY` — kod tarafı kayıt
   (`BodyEntry`: id, etiket, GLB yolu, arketip vb.).
2. `public/avatars/manifest.json` — varlık manifesti (GLB dosyaları, önizleme).

Kural: birini değiştiren PR **diğerini de** aynı PR'da günceller. `id`'ler
birebir eşleşmeli. (Şu an ikisi de boş/placeholder — `AVATARS_IN_PRODUCTION`
flag'i aktif; gerçek body'ler eklenince bu kural devreye girer.)

## Ağır asset kuralı

- Medya commit'lemeden önce sıkıştır (`npm run shop:*`). Hedef: arka plan
  videoları birkaç MB, ürün foto/video makul.
- Orijinaller `_raw/` altına gider ve gitignore'dadır — repoya girmez.

## İş bölümü (kabaca)

- **Şeyma ekibi:** Avatar sistemi (3D body library, MediaPipe, selfie akışı),
  immersive WebGL/animasyon deneyimleri.
- **AURA:** Shop/checkout/ön sipariş, yasal & uyumluluk, fiyatlandırma,
  e-posta, altyapı, performans, döküman.

Sınırlar kesin değil; bir alana dokunacaksan ilgili tarafı haberdar et,
özellikle paylaşılan dosyalarda (`globals.css`, `lib/env.ts`, route'lar).

## Sürümleme

SemVer (`MAJOR.MINOR.PATCH`). Bir sürüm kesilince `package.json` güncellenir,
`CHANGELOG.md`'de tarih atılır ve `git tag vX.Y.Z` ile etiketlenir. Detay:
`CHANGELOG.md` başındaki kurallar.
