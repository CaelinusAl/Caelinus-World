# CAELINUS — EXECUTION PHASE BRIEF

> **Mevcut Bible'ları çalışan ürüne dönüştürme yol haritası.**
> Sürüm: 0.1 (teknik plan) · Tarih: 2026-06-18
> Statü: **Teknik yol haritası — KOD YAZILMADI.**
>
> Canon referanslar (değiştirilmez):
> [Avatar](./CAELINUS_AVATAR_BIBLE.md) · [Goddess](./CAELINUS_GODDESS_ARCHETYPES_BIBLE.md) ·
> [Experience](./CAELINUS_AVATAR_EXPERIENCE_BIBLE.md) · [Soul](./CAELINUS_AVATAR_SOUL_BIBLE.md)
>
> Kapsam: **Phase 1–4** (Portrait Studio · Gallery · District Variants · SANRI).
> Phase 5–6 (Universe, 3D GLB) bu brief'in dışında.

---

## 0 · Önce Bilmen Gereken: Kodda Zaten Ne Var?

Caelinus'un avatar altyapısı **büyük ölçüde kurulu.** Bu bir sıfırdan inşa
değil; mevcut motoru Bible canon'una **bağlama** işi. Tarama bulguları:

### Hazır altyapı (gerçek dosyalar)
| Katman | Mevcut | Konum |
|---|---|---|
| **2D portre üretimi** | gpt-image-1 + içerik-adresli cache | [app/api/avatar/portrait/route.ts](app/api/avatar/portrait/route.ts) |
| **Selfie face-swap** | fal-ai/nano-banana yüz transferi | [app/avatar/AvatarStudioBody.tsx](app/avatar/AvatarStudioBody.tsx) |
| **Kalıcı avatar** | `profiles.caelinus_avatar_url/_zodiac/_base` | migrations 0011, 0013 |
| **Job pipeline (DB)** | selfies/jobs/job_events/avatars + RLS + GC + Realtime | migration 0012 |
| **QR köprü (DB)** | `caelinus_avatar_session`, 10dk TTL | migration 0014 + [session-store](lib/caelinus-avatar-core/session-store.ts) |
| **Provider soyutlaması** | `AvatarProvider` + mock/studio + runner | [lib/caelinus-ai/provider.ts](lib/caelinus-ai/provider.ts) |
| **SANRI köprüsü** | external FastAPI proxy + X-User-Id kimlik | [app/api/sanri/[...path]/route.ts](app/api/sanri/[...path]/route.ts) |
| **Avatar API'leri** | `/me`, `/save`, `/portrait`, `/session/*` | app/api/avatar/ |
| **District registry** | 8 sütun, blender/ai/access alanları | [lib/district/registry.ts](lib/district/registry.ts) |

### En kritik gerçek: İki ayrı "arketip" sistemi var
- **Kodda:** [lib/caelinus-ai/archetypes.ts](lib/caelinus-ai/archetypes.ts) → **6 stil kimliği**
  (Goddess Minimal, Lunar Auteur, Solar Couture, Earth Veil, Futurist Oracle,
  Ritual Flame). Dosya notu: *"Caelinus brand'in kalbi, founder onayı olmadan
  değiştirme."* Bunlar **GLB/body-library** odaklı, deterministik skorlu.
- **Bible'larda:** 12 tanrıça (Selene, Gaia, Freya…) + ruh + district varyantı.

**Bunlar çelişmez — farklı katmanlardır.** 6 stil kimliği "görsel ton" (minimal/
noir/couture); 12 tanrıça "ruhsal kimlik". Ama **12 tanrıça kodda hiç yok.**
Yapılacak işin çekirdeği bu yeni canon katmanı mevcut motora bağlamaktır.

> **Karar K1 (founder onayı gerek):** 6 stil kimliği KORUNUR (dokunulmaz), 12
> tanrıça ÜSTÜNE eklenir. Tanrıça = ana eksen; stil kimliği opsiyonel alt-ton.
> Bu brief bu varsayımla yazıldı.

---

## Çapraz Kararlar (KİLİTLENDİ — founder onayı 2026-06-18)

Dört karar da founder tarafından onaylandı (hepsi önerilen seçenek):

- **K1 ✅ — Arketip katmanı:** 12 tanrıça **ana eksen**, 6 stil kimliği
  (Goddess Minimal, Lunar Auteur…) **alt-ton** olarak korunur. Tanrıça = ruhsal
  kimlik; stil kimliği = opsiyonel görsel ton. Mevcut 6'lık koda dokunulmaz.
- **K2 ✅ — Üretim motoru (Phase 1):** **Selfie face-swap (nano-banana) +
  goddess styling overlay.** Kimlik koruyan yol (Bible §6 [2] kontrol noktası).
  Trait-tabanlı yol (gpt-image-1, selfie YOK) "Hafif" yoğunluk için **ikincil**
  seçenek kalır.
- **K3 ✅ — Tablo stratejisi:** **Mevcut tabloları genişlet, paralel şema kurma.**
  `caelinus_ai_avatars`'a `archetype`/`district_key`/`layer`/`is_canonical`/
  `is_favorite` kolonları eklenir. Yeni tablo (`avatar_styles` katalog,
  `district_variants` cache) sadece gerçekten gerekince.
- **Phase 4 yolu ✅ — Caelinus-side composer.** Okuma cümlesi Caelinus'ta
  `soul` + district modülasyonundan derlenir; etik filtre Caelinus'ta. External
  SANRI backend'e bağımlılık yok. (SANRI çıktısı opsiyonel zenginleştirme.)

---

## PHASE 1 — Portrait Avatar Studio

**Amaç:** Kullanıcı ilk tanrıça avatarını doğurabilsin (Experience Bible §2: 7 eşik).

### 1. Hazır olan sistemler
- **Doğum akışının iskeleti:** [app/caelinus-avatar/create](app/caelinus-avatar/create/page.tsx)
  + QR mobil sayfa [m/[sessionId]](app/caelinus-avatar/m/[sessionId]/page.tsx).
- **Selfie köprüsü:** `/api/avatar/session/*` + `caelinus_avatar_session` tablosu
  (0014) — desktop QR → mobil selfie → desktop'a publish. Tam çalışır.
- **Üretim motoru:** `/api/avatar/portrait` (gpt-image-1, içerik-adresli cache,
  rate-limit) + selfie face-swap (`AvatarStudioBody`).
- **Kalıcılık:** `caelinus_ai_jobs` durum makinesi + `caelinus_ai_avatars` +
  `profiles.caelinus_avatar_url`. Faz mesajları [phase-messages.ts](lib/caelinus-ai/phase-messages.ts).
- **Gizlilik altyapısı:** `caelinus_ai_selfies` 30 gün TTL + GC fonksiyonu +
  owner-RLS (Bible §8 "references/ özeldir" gereksinimini zaten karşılıyor).

### 2. Eksik parçalar
- **`data/goddess-archetypes.ts`** — 12 tanrıçanın saf-veri dosyası (Goddess +
  Soul Bible birleşik; `soul` bloğu dahil). **Bu, tüm sistemin temel taşı.** Yok.
- **Goddess-aware prompt üretimi** — portre prompt'u şu an trait-tabanlı
  (`traitsToPrompt`). Gereken: `goddessPrompt(archetype, district, intensity)` →
  `goddess_dna ⊕ district_modifier` (Bible §6 [3]–[5]).
- **Tanrıça seçim ekranı** — 12 kart (Experience §3). Yok.
- **District + yoğunluk seçimi** — doğum akışı eşik [4]–[5]. UI yok.
- **`archetype` + `district_key` + `intensity` alanları** — `caelinus_ai_jobs.input`
  (jsonb, esnek) içine girer ama tip/şema yok; `caelinus_ai_avatars`'a
  `archetype`/`district_key` kolonu gerek (sorgu/galeri için).
- **Kimlik benzerlik skoru (`identity_score`)** — Bible §6 [6] kontrol noktası;
  bugün yok.

### 3. Riskler
- **Motor seçimi (K2) netleşmezse** Phase 1 iki yöne bölünür → kaybedilen iş.
- **gpt-image-1 kimlik koruması zayıf:** saf text-to-image yüzü koruyamaz.
  Face-swap (nano-banana) gerekebilir → maliyet + latency artar. **Test gerek.**
- **Maliyet:** içerik-adresli cache trait kombinasyonları için çalışıyordu;
  tanrıça × district × yoğunluk × yüz → cache çok daha seyrek hit eder
  (yüz benzersiz). Cache anahtarı yeniden düşünülmeli.
- **6→12 arketip karışıklığı:** UI'da hangi setin gösterildiği netleşmezse
  kullanıcı + kod kafası karışır.

### 4. Uygulama sırası
1. `data/goddess-archetypes.ts` (12 tanrıça + soul). *Diğer her şey buna bağlı.*
2. `goddessPrompt()` derleyici (district modifier ⊕ ile birlikte; Phase 3'e de hizmet eder).
3. `caelinus_ai_avatars` + `caelinus_ai_jobs.input` şemasına `archetype/district_key/layer/intensity` ekle (migration 0018).
4. K2 motorunu tek uçta sabitle: `/api/avatar/portrait`'i goddess-aware yap (veya yeni `/api/avatar/birth`).
5. Doğum akışı UI: tanrıça seçimi → district → yoğunluk → doğuş sekansı → sonuç (mevcut create sayfasını genişlet).
6. Kimlik skoru + güvenlik kontrolü (basit eşik; reddet → retry).

### 5. Tahmini iş yükü
**~2–3 hafta (1 dev).** Veri dosyası + prompt derleyici (~3g), migration (~0.5g),
motor entegrasyonu (~3–4g, K2 testi dahil), UI akışı (~4–5g), kimlik/güvenlik (~2g).
Risk: face-swap maliyet/kalite testi sürerse +1 hafta.

---

## PHASE 2 — Avatar Gallery

**Amaç:** Kullanıcı doğurduğu avatarları saklasın (Experience Bible §5).

### 1. Hazır olan sistemler
- **`caelinus_ai_avatars`** — kullanıcı başına çoklu kayıt, `deleted_at` soft-delete,
  `created_at` index, owner-RLS. Galeri listesi için **hazır omurga.**
- **Canonical pointer:** `profiles.caelinus_avatar_url` = "aktif avatar" zaten var.
- **Okuma API:** `/api/avatar/me` (aktif avatarı çeker).

### 2. Eksik parçalar
- **`is_canonical` + `is_favorite` kolonları** `caelinus_ai_avatars`'da yok.
- **Liste API:** `GET /api/avatar/gallery` (kullanıcının tüm formları) yok.
- **Aktif yapma API:** `POST /api/avatar/activate` (canonical değiştir → `profiles` güncelle) yok.
- **Galeri UI** — aktif/favori/arşiv görünümü (Experience §5). Yok.
- **Yumuşak limit politikası:** ücretsiz ~12 / premium sınırsız (Bible §5) — kural yok.
- **Tam silme:** görsel + `caelinus_ai_selfies` referansı hard-delete (KVKK) — `deleted_at` var ama hard-purge zinciri eksik.

### 3. Riskler
- **"Aktif avatar" iki yerde:** `profiles.caelinus_avatar_url` (URL) vs
  `caelinus_ai_avatars.is_canonical` (kayıt). Senkronizasyon kaçağı riski →
  tek doğru kaynak seç (öneri: `is_canonical` ana, `profiles` türetilmiş cache).
- **Eski avatarlar:** mevcut kullanıcıların `caelinus_ai_avatars` kayıtlarında
  `archetype` null olacak → galeri "etiketsiz" göstermeli (geriye uyumluluk).

### 4. Uygulama sırası
1. Migration: `is_canonical` + `is_favorite` + `archetype/district_key` (Phase 1 ile birleşik 0018).
2. `GET /api/avatar/gallery` + `POST /api/avatar/activate` + `DELETE /api/avatar/:id`.
3. Canonical senkron kuralı: activate → `is_canonical` flip + `profiles` cache update (tek transaction).
4. Galeri UI (aktif/favori/arşiv sekmeleri).
5. Limit politikası + hard-delete zinciri (selfie referansı dahil).

### 5. Tahmini iş yükü
**~1–1.5 hafta.** Migration (~0.5g), 3 API (~2g), canonical senkron + test (~1.5g),
UI (~2–3g). Düşük risk — omurga hazır.

---

## PHASE 3 — District Variants

**Amaç:** Aynı tanrıçanın 8 district varyasyonu. Formül: `goddess_dna ⊕ district_modifier`.

### 1. Hazır olan sistemler
- **District registry** (`lib/district/registry.ts`) — `accent`, `glow`, `env`,
  `blender` alanları zaten var; bunlar district modifier'ın kaynağı.
- **`goddessPrompt()` derleyici** (Phase 1'de yapılır) — `⊕` birleştirmeyi zaten içerir.
- **İçerik-adresli storage cache** deseni (`/api/avatar/portrait`) — varyant cache için şablon.
- **8 district canon'u** (Experience + Goddess Bible): Source/Mirror/Gaia/Bazaar/
  Atelier/Sanri/Sanctuary/Temple. Registry'de şu an 4 anahtar canlı (sanri/gaia/
  fashion/avatar) — kalan district'ler eklenmeli (registry genişletmesi, yeniden tasarım değil).

### 2. Eksik parçalar
- **Goddess Bible'daki `DistrictVariant` modeli** kodda yok (modifier/role/shift).
- **`district_variants` tablosu (veya cache)** — (arketip × district) çıktısı.
  Bible §7 öneriyordu; **K3'e göre: önce storage cache yeterli, tablo opsiyonel.**
- **Registry × goddess köprüsü** — registry'nin 8 district'i ile 12 tanrıçanın
  `districts.home/strong/weak` ilişkisi (Goddess Bible) eşlenmemiş.
- **"Tanrıçanı buraya çağır" akışı** — district girişinde varyant üretim tetiği
  (Experience §6). Yok.
- **Eksik district kayıtları** — Source/Mirror/Atelier/Sanctuary/Temple registry'de yok.

### 3. Riskler
- **Üretim maliyeti patlaması:** 12 tanrıça × 8 district = 96 varyant/kullanıcı
  potansiyeli. **Tembel üretim şart** — sadece kullanıcı o district'e girince üret.
- **Cache anahtarı:** `{userFaceHash}--{archetype}--{district}--{intensity}`.
  Yüz benzersiz olduğu için kullanıcılar arası paylaşım yok → kullanıcı-başı cache.
- **Tutarlılık:** aynı kimlik 8 district'te "aynı kişi" görünmeli (yüz kayması riski).

### 4. Uygulama sırası
1. Registry'ye eksik district kayıtlarını ekle (Source/Mirror/Atelier/Sanctuary/Temple — mevcut District tipiyle).
2. `data/goddess-archetypes.ts`'e `districts` ilişkilerini (home/strong/weak) doldur (Goddess Bible'dan).
3. `districtModifier(districtKey)` → registry'den accent/glow/env türet; `goddessPrompt`'a besle.
4. Tembel üretim: district girişinde "çağır" → varyant job → kullanıcı-başı storage cache (`avatars/{user}/universe/{district}--{gen}.webp`, Bible §8).
5. Galeride varyantları yan yana göster (Experience §6 "aynı sen, farklı evrenler").

### 5. Tahmini iş yükü
**~2 hafta.** Registry genişletme (~1–2g), modifier + prompt köprü (~2g, Phase 1
derleyicisi varsa hızlı), tembel üretim + cache (~3–4g), galeri varyant görünümü
(~2g). Risk: yüz tutarlılığı testi.

---

## PHASE 4 — SANRI Entegrasyonu

**Amaç:** SANRI aktif avatarı okusun (Soul Bible). Kaynaklar: Goddess DNA + Soul
Bible + District Modulation.

### 1. Hazır olan sistemler
- **SANRI proxy** (`/api/sanri/[...path]`) — gelen body'yi **olduğu gibi** iletir,
  `X-User-Id` ekler. Yani ask/dream/symbol/fal çağrılarına **ek alan eklenebilir.**
- **Sanri client** ([lib/sanri/client.ts](lib/sanri/client.ts)) — `askSanri` zaten
  `mode`/`domain` parametreleri taşıyor; genişletilebilir.
- **Kimlik köprüsü** — Supabase UUID = SANRI external_id (server-side).
- **Soul Bible canon'u** — 12 tanrıça × 8 ruh boyutu + okuma şablonları + district
  modülasyon kuralları + etik sınır. Tam tanımlı.

### 2. Eksik parçalar
- **`data/goddess-archetypes.ts` `soul` bloğu** (Phase 1'de eklenir) — okuma kaynağı.
- **Aktif avatar → SANRI context köprüsü** — SANRI okumasının kullanıcının
  arketibini/district'ini/ruh boyutlarını bilmesi gerek. Şu an SANRI bunu bilmiyor.
- **Okuma derleyici (Caelinus-side)** — Soul Bible §"SANRI Okuma Şablonları":
  `okuma = ruh_boyutları(arketip) × ton(district) × odak(modül)`. Yok.
- **Etik sınır filtresi** — teşhis değil/şefkat tonu/kriz yönlendirmesi (Soul Bible §Etik). Yok.

### 3. Riskler
- **SANRI EXTERNAL** (ayrı FastAPI). İki entegrasyon yolu var, **bu Phase 4'ün ana kararı:**
  - **Yol A — Caelinus-side composer (önerilen MVP):** Caelinus, aktif avatarın
    `soul` boyutlarını + district modülasyonunu kendi tarafında okuma cümlesine
    derler; SANRI'ye sadece zenginleştirme için (opsiyonel) gönderir. External
    backend'e bağımlılık yok, etik filtre Caelinus'ta kalır. **Hızlı, kontrollü.**
  - **Yol B — SANRI prompt injection:** ask body'sine `archetype/district/soul`
    context eklenir, external prompt bunu işler. **External backend değişikliği
    gerektirir** (bizim repoda değil) → bağımlılık + gecikme riski.
- **Etik:** Soul Bible §Etik canon — gölge/yara/korku boyutları yanlış tonla
  felakete döner. Composer'da **şefkat tonu + kriz yönlendirmesi zorunlu.**

### 4. Uygulama sırası (Yol A önerisi)
1. `soul` bloğu `data/goddess-archetypes.ts`'te hazır olsun (Phase 1).
2. `composeSanriReading({ archetype, district, module })` — Soul Bible şablonu:
   `[Tanıma][Onaylama][Ayna][Görev]`, district modülasyon `focus`/`tone` ile.
3. Aktif avatar context'i çek (`/api/avatar/me` + galeri canonical).
4. SANRI modüllerine bağla: ask/dream/symbol/fal/kod-okuma çıktısına okuma cümlesini
   ekle (district'e göre `focus` boyutları — Soul Bible tablosu).
5. Etik filtre katmanı: yargılayıcı dil yok, kriz belirtisinde yardım tonu.

### Somut örnek — Selene + Sanri + Kod-Okuma
```
Girdi:   aktif avatar = { archetype: "selene", district: "sanri" }, module = "kod-okuma"
Katman1: soul(selene) → strength:"sezgi", shadow:"kaçış", soulTask:"ışığını saklamadan parlamak", wound:"görülmemek"
Katman2: districtModulation("sanri") → tone:"intuitive", focus:["shadow","strength","soulTask"]
Katman3: module "kod-okuma" → ekstra focus: ["wound","soulTask"] (en derin/şefkatli katman)
Derleme: composeSanriReading → şablon doldur
Çıktı:   "Sen ayın bilgeliğiyle yürüyorsun. Gücün sezginde. Ama gölgen kaçış.
          Burada öğrenmeye geldiğin: ışığını saklamadan parlamak."
Filtre:  etik kontrol (şefkat tonu ✓, teşhis yok ✓) → yayınla
```

### 5. Tahmini iş yükü
**~1.5–2 hafta (Yol A).** Composer + şablon (~3g), context köprü (~1g), modül
bağlama (~3–4g), etik filtre + test (~2–3g). Yol B seçilirse + external backend
koordinasyonu (belirsiz, repo dışı).

---

## Özet — Toplam Yol Haritası

| Faz | Süre | Ana risk | Kilit bağımlılık |
|---|---|---|---|
| **1 · Portrait Studio** | 2–3 hf | Kimlik koruma + motor seçimi (K2) | `data/goddess-archetypes.ts` |
| **2 · Gallery** | 1–1.5 hf | Canonical senkron (2 kaynak) | Phase 1 kayıtları |
| **3 · District Variants** | 2 hf | Üretim maliyeti (tembel üretim şart) | Phase 1 prompt derleyici |
| **4 · SANRI** | 1.5–2 hf | SANRI external (Yol A/B) + etik | `soul` bloğu |

**Toplam: ~7–9 hafta (tek dev), seri.** Phase 1 ve 2 paralel hızlandırılabilir.

### İlk hamle (her şeyin önündeki tek dosya)
**`data/goddess-archetypes.ts`** — 12 tanrıça, görsel DNA + `soul` bloğu + `districts`
ilişkileri. Phase 1, 3, 4'ün tamamı buna bağlı. District registry deseniyle
(saf veri, server-only import yok) yazılır.

### Açık kalan founder kararları
- **K1** — 6 stil kimliği + 12 tanrıça birlikteliği (önerilen: evet, farklı eksenler).
- **K2** — Phase 1 motoru: selfie face-swap (önerilen) vs trait-tabanlı.
- **K3** — Tablo: mevcut `caelinus_ai_avatars` genişlet (önerilen) vs yeni Bible şeması.
- **Phase 4 yolu** — Caelinus-side composer (önerilen) vs SANRI prompt injection.

---

*Bu brief yeni mimari önermez; mevcut Bible canon'unu mevcut koda bağlar.
Kod, bu brief'in kararları (K1–K3 + Phase 4 yolu) onaylanınca yazılır.
İlk dosya: `data/goddess-archetypes.ts`.*
