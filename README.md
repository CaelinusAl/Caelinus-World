# Caelinus Universe

**Frekansını giy · Wear your frequency**

Caelinus, modayı, toprağı ve bilinci tek bir **frekans evreninde** birleştiren kozmik bir portaldır. Ürün ve içerik katmanları — Gaia’nın bahçesi, bilinçli atölyeler, kişisel görünüm deneyimi ve ritüel odaklı alanlar — aynı dilde konuşur: **Solfeggio frekansları**, element ve burç haritası, Anadolu üretim bölgelerinin enerjisi ve sürdürülebilir / sınırlı seri üretim etiği.

## Vizyon (kuzey yıldızı)

1. **Tek evren, çok boyut** — Ziyaretçi ana portaldan (`/universe`) Gaia, Shop, Play, Atelier ve Sanctum gibi boyutlar arasında geçer; her biri aynı marka tonunda (nebula, sahne metaforu, sinematik CTA’lar) tutulur.
2. **Kişiselleştirme = ritüel değil taklit** — Doğum tarihi ve niyet (`lib/frequency.ts`) deterministik bir profil üretir; bitki önerileri, ürün/kombin önerileri ve “frekans” sözcüğü teknik olarak aynı Hz sözlüğüne bağlıdır (`data/gaia.ts` ile uyumlu).
3. **Toprak ve insan** — Gaia katmanında üretici kimlikleri KVKK/GDPR’a uygun kolektif veya kurgusal isimlerle tutulur; bölgesel imza ve bağlantılar veri katmanından türetilir, UI’da çoğaltılmaz.
4. **Atölye ekonomisi** — Tasarımcılar Atelier üzerinden vitrin ve (altyapı hazır olduğunda) Stripe ile checkout yaşar; lansman döneminde seçilmiş vitrinler `data/atelier-launch.ts` ile statik olarak güçlendirilir.
5. **Play = üretken yapay zeka + sınır** — `/play` görünüm üretimi, moderasyon ve rate limit ile dengelenir; kurulum için `docs/play-ai-setup.md`.

## Ürün vizyonu — satış, avatar ve topluluk

**Konumlandırma:** Caelinus; **bilinç ve frekans** ekseninde moda ile sanatın, **üretici ile tasarımcının** aynı e-ticaret çatısında güvenilir şekilde buluştuğu bir evren olarak konumlanır — küresel yüzlü marka vaadiyle birlikte. Pazarlama iddiası “ilk ve tek” yerine **ayırt edici derinlik**: hikâye + köken + frekans profili + şeffaf üretici hattı.

| Vaat | Ne anlama geliyor |
|------|-------------------|
| **Yalnız hikâyeli ürün** | Satışa çıkan her SKU’nun editoryal bir **köken/hikâye** yüzü vardır (Gaia / atölye / frekans bağlamı); düz listeleyici ürün yerine “anlatı ticareti”. |
| **Satış vitrinleri** | Ürün sayfası; 3D avatar üzerinde deneme + kullanıcı yüz fotoğrafı ile **AI destekli avatar** oluşturma (mevcut Play / Shop bileşenleri bu yönde genişletilir). |
| **Dijital AI moda danışmanı** | Depodaki gerçek SKU’larla **“bugün ne giysem?”**: gün kombini, gece kombini; öneriler yalnızca mağaza envanterinden üretilir (hallüsinasyon yerine katalog bağlı). |
| **Sesli asistan** | Aynı danışmanlık akışının ses girişi/çıkışı ile erişimi (mobil ve hands-free senaryolar). |
| **Üretici–tasarımcı–zanaatkar ağı** | Üyelik rolleri: sanatçı, zanaatkar, tasarımcı, üretici; birbirini takip etme, keşif ve işbirliği için **platform içi sosyal grafik** (harici sosyal ağ kopyası değil; ticaret ve hikâye ile bağlı). |

Bu tablo repo ile **uyumlama hedefidir**: `/universe/shop`, `/play`, `/atelier` ve Supabase şeması zamanla bu vaatlere göre genişletilir.

## Repo yapısı (özet)

| Alan | Rota / konum | Not |
|------|----------------|-----|
| Portal girişi | `/` → `/universe` | Warp animasyonlu ana sahne |
| Evren hub | `app/universe/page.tsx` | Portal grid |
| Gaia | `app/universe/gaia/*`, `data/gaia.ts` | Bitkiler, atlas, üreticiler |
| Shop | `app/universe/shop/*` | Frekans rafı, kombin, deneme |
| Play | `app/play/*`, `app/api/play/*` | AI render, galeri, bakım scriptleri |
| Atelier | `app/atelier/*` | Kesfet, dashboard, Stripe webhook |
| Sanctum | `app/universe/sanctum/*` | Hafıza, ritüeller, defter |
| i18n | `lib/i18n/*`, `stores/lang-store.ts` | TR / EN, SEO alternates |

## Teknoloji

- **Next.js** (App Router), **React 19**, **TypeScript**
- **Supabase** (auth / veri), **Stripe** (ödeme)
- **Three.js** + **React Three Fiber** (3D / vitrin), **Mediapipe** (görüntü)
- **Tailwind CSS 4**, **Zustand**, **Zod**

## Avatar Studio — iki yol, tek hedef

`/avatar` rotası iki sekmeli — kullanıcı "kendi tanrıçasını" yaratabilir
**ya da** kendi yüzüyle Caelinus modeline bürünebilir. Her iki yolun
çıktısı aynı `localStorage.caelinus_user_avatar_url` altına yazılır;
Shop / PDP / Stylist akışları farketmez.

### Sekme 1 — "Kendi Yarat" (varsayılan, BuilderFlow)

Selfie zorunluluğunu kaldırır. Anlık, sıfır AI maliyeti, mahremiyet
sıfır risk — manifestonun "içindeki gökyüzünü hatırlayan" vaadinin
parametric karşılığı.

1. **Trait seçimi** — saç (uzunluk × doku × renk, 11 renk + 5 kozmik:
   starlight, nebula-violet, aurora-teal, cosmic-rose, moonlit-silver),
   göz (11 renk + 4 kozmik), ten (7 ton), dudak (7 renk), beden
   silueti (söğüt / kum saati / ay), burç + alın glifi (yok / burç
   sembolü / Solfeggio frekans halkası)
2. **Canlı SVG preview** — `components/avatar/ParametricAvatar.tsx`,
   600×800 SVG portrait, painterly + cosmic stil
3. **"Bu Tanrıçayı Kaydet"** — SVG canvas'a rasterize edilir
   (`lib/avatar/export.ts`), PNG data URL alınır
4. **localStorage'a yaz** — meta'da `kind: "parametric" + traits`
   tam serialize edilir; re-edit'te builder kaldığın yerden açılır

| Modül | Konum |
|-------|-------|
| Trait şema + palette | `lib/avatar/builder.ts` |
| SVG renderer | `components/avatar/ParametricAvatar.tsx` |
| UI builder | `components/avatar/AvatarBuilder.tsx` |
| SVG → PNG export | `lib/avatar/export.ts` |
| Sayfa flow | `app/avatar/BuilderFlow.tsx` |
| Tab shell | `app/avatar/AvatarStudioBody.tsx` (default `AvatarStudio`) |

### Sekme 2 — "Selfie ile" (SelfieFlow)

Mevcut akış, davranışı değişmedi. fal-ai/nano-banana face-swap.

1. **Selfie** (1024px JPEG, sha256-prefix hash, sunucuda saklanmaz)
2. **Tuval** (silk / bodysuit / veil — `lib/avatar/canvases.ts`)
3. **Burç** (12 burç → signature bikini)
4. **POST `/api/play/render`** → `fal-ai/nano-banana/edit` face-swap;
   yüz değişir, kıyafet/vücut/sahne sabit kalır
5. **Supabase Storage `play-renders`** — cache_key'de `selfieHash`,
   aynı selfie + burç ikinci kez ücret yazmaz

PDP akışı (her iki sekme için):
- Avatar var → doğrudan `/universe/shop?try=<id>`
- Avatar yok → `/avatar?next=/universe/shop?try=<id>` → yarat / kaydet
  → otomatik dönüş
- Direkt selfie sekmesine gitmek için `/avatar?tab=selfie&next=...`

Gerekli env: `FAL_KEY` (face-swap için), `PLAY_AI_*` ve
`SUPABASE_SERVICE_ROLE_KEY` (Storage upload). Yoksa stub çalışır.

| Faz | Durum | Not |
| --- | --- | --- |
| 3.1 — Avatar Studio + PDP entegrasyonu | ✅ Canlı | `/avatar`, `TryOnCTA`, `/universe` portal |
| 3.2 — Shop sahnesinde avatar (sticky badge) | ✅ Canlı | `lib/user-avatar.ts` + `AvatarBadge` (cross-tab sync) |
| 3.2b — StylistPanel "AI ile avatarımda gör" | ✅ Canlı | `StylistAvatarPreview` modal (3 durum: yok / match / mismatch) + `/avatar?zodiac=X` köprüsü |
| 3.3 — Auth-bound persist (profiles) | ⚠️ Kod hazır, migration bekliyor | `/api/avatar/save` + `/api/avatar/me`; `supabase/migrations/0011_caelinus_avatar.sql` Dashboard'dan uygulanmalı |
| 3.4 — Avatar-first Shop sahnesi | ✅ Canlı | `AIAvatarStage` (avatar varsa); 3D mesh + büyük "AI Avatar Studio'ya git" hero CTA (avatar yoksa) — boş yüzlü mesh sorununu çözer |

### Migration 0011 nasıl uygulanır?

Supabase CLI yoksa:
1. Supabase Dashboard → **SQL Editor** → New query
2. `supabase/migrations/0011_caelinus_avatar.sql` içeriğini yapıştır
3. **Run** — `profiles` tablosuna `caelinus_avatar_url`, `caelinus_avatar_zodiac`, `caelinus_avatar_updated_at` kolonları ve constraint eklenir

Migration uygulanmadan `/api/avatar/save` ve `/api/avatar/me`
"migration_pending" / "kolon yok" hatası dönecek; client tarafı
gracefully localStorage akışına düşer (hata sessizce yutulmaz,
kullanıcıya küçük bir uyarı gösterilir).

## Geliştirme

```bash
npm install
npm run dev
```

- `docs/stripe-setup.md` — Stripe
- `docs/email-setup.md` — e-posta
- `docs/play-ai-setup.md` — Play AI

Yardımcı scriptler: `npm run play:warm*`, `atelier:seed:naz`, vb. (`package.json` içinde tam liste).

---

*Caelinus — modayı, toprağı ve bilinci bir frekans evreninde buluşturan kozmik portal.*
