# Geliştirme Rehberi · Caelinus

Bu döküman Caelinus'u yerelde çalıştırmak, env'leri kurmak ve günlük
geliştirme işlerini (build, lint, asset optimizasyonu, migration) yürütmek
içindir. Mimari ve ürün vizyonu için `README.md`'ye bak.

## Gereksinimler

- **Node.js 20+** (LTS önerilir)
- **npm** (repo `package-lock.json` ile gelir)
- **ffmpeg** — yalnızca asset optimizasyon scriptleri için (`shop:*`).
  Windows: `winget install Gyan.FFmpeg`. PATH'te değilse scriptleri
  çalıştırmadan önce ekle.

## Kurulum

```bash
npm install
cp .env.example .env.local   # sonra secret'ları doldur
npm run dev
```

- Yerel: <http://localhost:3000>
- Ağ (telefondan test — aynı Wi-Fi): terminalde yazan `Network` URL'i
  (ör. `http://192.168.1.197:3000`).

`lib/env.ts` env'leri Zod ile doğrular: **production build** zorunlu bir
değer eksikse durur; **yerel dev** placeholder + uyarı ile çalışır. Yani
hiç env doldurmadan da UI'yi geliştirebilirsin (AI/ödeme/e-posta stub'a düşer).

## Ortam değişkenleri (özet)

Tam açıklama + kurulum adımları `.env.example` içinde. Üç kova var:

| Kova | Örnek | Not |
|------|-------|-----|
| **Public** | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_*` | Tarayıcıya gömülür |
| **Server secret** | `SUPABASE_SERVICE_ROLE_KEY`, `PLAY_AI_API_KEY`, `FAL_KEY`, `RESEND_API_KEY` / `SMTP_*` | Asla client'a sızmaz |
| **Build-time** | `ELEVEN_API_KEY` | Sadece `scripts/` kullanır |

Önemli olanlar:

- **Supabase** (auth + db + storage): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Admin** (`/atelier/admin` ve PII'li endpoint'ler): `CAELINUS_ADMIN_EMAILS`
  (virgülle ayrılmış e-posta listesi).
- **E-posta**: ya `RESEND_API_KEY` + `EMAIL_FROM` ya da Titan `SMTP_*`. İkisi
  de yoksa sender konsola düşer (akış kırılmaz). `SMTP_*` tanımlıysa Resend'in
  önüne geçer.
- **Play AI** (görünüm üretimi): `PLAY_AI_PROVIDER` (`stub` varsayılan) +
  `PLAY_AI_API_KEY`.

> ⚠️ Bir secret sızarsa (chat, ekran görüntüsü, public log) **önce sağlayıcı
> panelinden rotate et**, sonra değiştir. `.env.local` asla commit'lenmez.

## Sık kullanılan komutlar

```bash
npm run dev      # geliştirme sunucusu (Turbopack)
npm run build    # production build (env doğrulaması burada zorunlu)
npm run start    # build sonrası prod sunucu
npm run lint     # eslint
npx tsc --noEmit # tip kontrolü (CI öncesi önerilir)
```

### Asset optimizasyonu (ffmpeg gerekli)

Repo'yu şişirmemek için ağır medya commit'ten önce sıkıştırılır. Orijinaller
`_raw/` klasörlerine taşınır ve gitignore'dadır.

```bash
npm run shop:optimize        # public/play/shop/*.mp4 sıkıştır
npm run shop:photos          # public/products/<burç>/*.jpg|png sıkıştır
npm run shop:vids            # public/products/<burç>/*.mp4 sıkıştır
# her birinin :dry varyantı önce ne yapacağını gösterir, dosyaya dokunmaz
npm run shop:optimize:dry
```

### Play / Atelier yardımcı scriptleri

```bash
npm run play:warm            # play render cache'ini ısıt (stub/replicate/openai)
npm run play:warm:dry
npm run play:purge:stubs     # stub render'ları temizle (--apply ile uygula)
npm run atelier:seed:naz     # örnek atölye vitrini ekle (--dry-run var)
npm run plants:audio         # bitki seslerini üret (ElevenLabs, build-time)
```

Tam liste `package.json` → `scripts` içinde.

## Supabase migration'ları

Migration dosyaları `supabase/migrations/` altında numaralıdır. Supabase CLI
yoksa Dashboard üzerinden uygulanır:

1. Supabase Dashboard → **SQL Editor** → New query
2. İlgili `NNNN_*.sql` dosyasının içeriğini yapıştır
3. **Run**

Lansman için kritik olanlar:

- `0011_caelinus_avatar.sql` — `profiles` avatar kolonları (avatar persist).
- `0017_preorders.sql` — ön sipariş tablosu (`/api/orders` buraya yazar).

`supabase/README.md` ek notları içerir.

## Mimari hızlı harita

| Alan | Konum |
|------|-------|
| Portal / hub | `app/universe/page.tsx` |
| Shop + checkout + PDP | `app/universe/shop/*` |
| Gaia | `app/universe/gaia/*`, `data/gaia.ts` |
| Atelier | `app/atelier/*` |
| Play (AI render) | `app/play/*`, `app/api/play/*` |
| Stiller | `app/globals.css` (tek dosya — bkz. `CONTRIBUTING.md`) |
| Env şeması | `lib/env.ts` |
| Şirket / yasal veri | `lib/company.ts` |
| Fiyatlandırma (USD/TRY) | `lib/pricing.ts`, `app/api/fx/route.ts` |

## Sorun giderme

- **Port 3000 dolu / eski dev server takılı:** Birden fazla `next dev` aynı
  anda çalışamaz. Eski süreci kapat (`taskkill /PID <pid> /F`), tekrar başlat.
- **`tsc` `.next/types` hatası veriyor:** Bayat tip önbelleği. `.next`'i silip
  yeniden build et.
- **AI/e-posta/ödeme çalışmıyor:** İlgili env yoksa kasıtlı olarak stub'a
  düşer; gerçek davranış için `.env.local`'ı doldur.
