# CAELINUS — CIVILIZATION ROADMAP (Tam Mimari Harita)

> **Avatar'dan yaşayan medeniyete kadar tüm yol haritası.**
> Sürüm: 0.1 (mimari harita) · Tarih: 2026-06-18
> Statü: **Sadece mimari harita — KOD YAZILMADI.**
>
> Bu doküman üç analiz içerir:
> 1. Mevcut sistem ↔ Bible canon fark tablosu (eksikler)
> 2. 8 fazlık tam yol haritası (mevcut/eksik kod · maliyet · risk)
> 3. Civilization ilişki analizi: Avatar → Order → Rank → Calling → First Circle
>
> Canon referanslar: Avatar / Goddess / Experience / Soul Bible + [Execution Brief](./CAELINUS_EXECUTION_PHASE_BRIEF.md).

---

## ⚠ Önce Bir Dürüstlük Notu: Canon Nerede Bitiyor

Senin "Bible" sütununda saydığın kavramların **bir kısmı henüz hiçbir Bible'da
tanımlı değil.** Net olalım:

| Kavram | Canon durumu |
|---|---|
| `archetype` | ✅ Canon — Goddess Bible + `data/goddess-archetypes.ts` |
| `soul` | ✅ Canon — Soul Bible + `data/goddess-archetypes.ts` (`soul` bloğu) |
| `order` (kart sırası) | ✅ Canon — `GODDESS_ORDER` (gösterim sırası) |
| `order` (lonca/yol) | ⚠ **Tanımsız** — Civilization Bible gerek |
| `rank` | ⚠ **Tanımsız** — Civilization Bible gerek |
| `civilization` | ⚠ **Tanımsız** — Civilization Bible gerek |
| `world loop` | ⚠ **Tanımsız** — Civilization Bible gerek |
| `citizenship` | 🟡 **Yarı** — kodda "Frekans Ağı" temeli var, isimlendirme/yapı yok |
| `calling` | 🟡 **Yarı** — `roles[]` + `contributions` tohum, formal değil |
| `first circle` | ⚠ **Tanımsız** — Civilization Bible gerek |

**Sonuç:** Phase 5–8 (Citizenship → Living Civilization) bu harita ile **inşa
edilemez** — önce bir **CAELINUS_CIVILIZATION_BIBLE.md** yazılmalı (Order/Rank/
Calling/First Circle/World Loop semantiği). Bu harita o Bible'ın iskeletini ve
mevcut koddaki tutamacı gösterir; ama kavramları **icat etmez** (senin kuralın:
yeni konsept üretme). Aşağıda 🟡/⚠ ile işaretli her şey **öneri/tohum**, canon değil.

---

## ⭐ Beklenmedik Bulgu: Civilization Temeli Zaten Kısmen Kurulu

Kod taraması "Frekans Ağı" (Frequency Network) adında, civilization katmanının
**erken tohumunu** ortaya çıkardı:

| Mevcut yapı | Konum | Hangi civilization kavramına denk |
|---|---|---|
| `profiles.roles[]` (writer/artist/designer/producer/seeker) | migration 0015 | **Order/Calling** tohumu |
| `profiles.handle` (/u/<handle>) + `network_joined_at` | 0015 + [app/u/[handle]](app/u/[handle]/page.tsx) | **Citizenship** tohumu |
| `profiles.element` (fire/earth/air/water) + `intent` + `frequency_hz` | 0015 | Kimlik frekansı (Soul ile köprü) |
| `profiles.home_code` (SANRI 1–81 şehir = "yuva") | 0015 | **First Circle** (coğrafi) tohumu |
| `contributions` (community→canon, 81-kod bağı) | migration 0016 + [app/network/katki](app/network/katki/yeni/page.tsx) | **World Loop** tohumu |
| `/network` (akış/katıl/katkı) + `public_members` VIEW | app/network | Medeniyet yüzeyi |
| `lib/world` (6 dünya kaydı) + `lib/members` | lib/ | Dünya/üye katmanı |

**Yani Phase 5–7 sıfırdan değil.** "Frekans Ağı" → "Citizenship" → "Civilization"
yeniden adlandırma + yapılandırma yoluyla evrilebilir. Mevcut hiçbir sistem
kırılmadan (0015'in felsefesi: "ayrı members tablosu kurmayız, profiles'ı genişletiriz").

---

# 1 · Fark Tablosu — Mevcut Sistem ↔ Bible Canon

### Mevcut sistemin sağladıkları
| Eksen | Mevcut kod | Durum |
|---|---|---|
| **avatar** | `caelinus_ai_avatars`, `profiles.caelinus_avatar_url`, compose-portrait | ✅ Çalışır |
| **portrait** | `lib/avatar/compose-portrait.ts` (canvas), `/api/avatar/portrait` (gpt-image-1) | ✅ Çalışır (canvas MVP) |
| **session** | `caelinus_avatar_session` (0014), QR desktop↔mobile | ✅ Çalışır |
| **district** | `lib/district/registry.ts` (4 canlı) + `data/avatar-districts.ts` (8 frekans) | ✅ Çalışır |
| **archetype** | `data/goddess-archetypes.ts` (12 tanrıça) + 6 stil kimliği | ✅ Çalışır |

### Bible canon'unun istedikleri ve eksikler
| Bible ekseni | Beklenen | Mevcut | EKSİK |
|---|---|---|---|
| **archetype** | 12 tanrıça DNA | ✅ var | — |
| **soul** | 8 ruh boyutu × 12 | ✅ var (`soul` bloğu) | SANRI composer'a **bağlanması** (Phase 4) |
| **order** | Tanrıça/üye loncası, ait olma yapısı | `roles[]` tohumu | **Formal Order modeli** (tablo/tip/üyelik) |
| **rank** | Order içi ilerleme/mertebe | ❌ yok | **Rank sistemi tamamen** (tablo, ilerleme kuralı, eşikler) |
| **civilization** | Üyelerin birlikte kurduğu yaşayan evren | Frekans Ağı tohumu | **Vatandaşlık + yönetişim + ekonomi bütünü** |
| **world loop** | Katkı → canon → dünya beslenmesi döngüsü | `contributions` (community→canon) tohumu | **Döngü mekaniği** (canon promotion, geri besleme, sezon/ritim) |

### Özet — net eksik listesi
1. **Order modeli** — formal lonca/yol (roles'ün ötesi).
2. **Rank sistemi** — mertebe + ilerleme + eşikler.
3. **Calling sistemi** — üyenin çağrısı/görevi (roles + contributions birleşimi, formal).
4. **First Circle** — kurucu/iç çember vatandaş statüsü.
5. **World Loop mekaniği** — community→canon döngüsünün otomatik/ritmik hali.
6. **SANRI Soul köprüsü** — soul bloğu hazır ama okuma composer'ı yok (Phase 4).
7. **CAELINUS_CIVILIZATION_BIBLE.md** — yukarıdaki 1–5'in canon tanımı (her şeyin önünde).

---

# 2 · Tam Yol Haritası — 8 Faz

> Maliyet birimi: yaklaşık dev-haftası (1 dev). Phase 1–4 gerçek koda dayalı;
> 5–8 ileri mimari (Civilization Bible'a bağımlı, tahminler kaba).

### Phase 1 — Portrait (Doğuş)
- **Mevcut kod:** `data/goddess-archetypes.ts` (+soul), `data/avatar-districts.ts`,
  `lib/avatar/compose-portrait.ts` (canvas), `app/universe/avatar/_components/*`
  (7-eşik akış), `caelinus_avatar_session` (QR), `/api/avatar/portrait` (gpt-image-1).
- **Eksik kod:** Gerçek AI motoruna bağlama (K2: selfie face-swap + goddess overlay);
  doğuş çıktısını kaydetme (canonical); kimlik benzerlik/güvenlik kontrolü.
- **Maliyet:** ~1–1.5 hf (iskelet hazır; motor + kayıt kaldı).
- **Risk:** gpt-image-1/face-swap kimlik koruma kalitesi; canvas→AI geçiş sözleşmesi.

### Phase 2 — Gallery
- **Mevcut kod:** `caelinus_ai_avatars` (çoklu kayıt, soft-delete, RLS), `/api/avatar/me`.
- **Eksik kod:** `is_canonical`/`is_favorite`/`archetype`/`district_key` kolonları
  (migration 0018); `GET /gallery`, `POST /activate`, `DELETE /:id`; galeri UI;
  canonical senkron (profiles cache); hard-delete zinciri.
- **Maliyet:** ~1–1.5 hf.
- **Risk:** "Aktif avatar" iki kaynak (profiles vs is_canonical) senkron kaçağı.

### Phase 3 — District Variants
- **Mevcut kod:** `data/avatar-districts.ts` (8 district modifier: accent/tint/env/
  vignette/richness), compose-portrait district katmanını zaten uyguluyor.
- **Eksik kod:** Registry'ye eksik district kayıtları (source/mirror/atelier/
  sanctuary/temple); tembel varyant üretimi + kullanıcı-başı cache; galeri yan-yana görünüm.
- **Maliyet:** ~1.5–2 hf.
- **Risk:** Üretim maliyeti (12×8 potansiyel → tembel üretim şart); yüz tutarlılığı.

### Phase 4 — SANRI Soul
- **Mevcut kod:** `soul` bloğu (12×8), SANRI proxy (`/api/sanri/[...path]`, X-User-Id),
  `lib/sanri/client.ts`, aktif avatar okuma (`/api/avatar/me`).
- **Eksik kod:** `composeSanriReading({archetype,district,module})` (Caelinus-side,
  Soul Bible şablonu + district modülasyon `focus`/`tone`); etik filtre (şefkat/
  kriz); SANRI modüllerine (ask/dream/symbol/fal/kod-okuma) bağlama.
- **Maliyet:** ~1.5–2 hf.
- **Risk:** Etik (gölge/yara/korku tonu); SANRI external — composer Caelinus'ta tutulmalı.

> **Phase 1–4 = "Yaşayan Avatar".** Buraya kadar Avatar System tamamlanır.
> Phase 5'ten itibaren **Civilization** başlar ve önce Civilization Bible gerekir.

---

### Phase 5 — Citizenship Layer  🟡 (Civilization Bible gerek)
- **Mevcut kod:** Frekans Ağı — `profiles.handle/roles/element/home_code/intent/
  network_joined_at`, `public_members` VIEW, `/network/katil`, `/u/[handle]`.
- **Eksik kod:** Formal **vatandaşlık statüsü** (guest → citizen geçişi, avatara
  bağlı); vatandaşlık kartı (avatar + handle + element + home); vatandaşlık kapıları
  (hangi district/eylem vatandaş gerektirir — `DistrictAccess` ile köprü).
- **Maliyet:** ~2–3 hf (temel var, yapı + UI kaldı).
- **Risk:** "Üye" (mevcut) vs "vatandaş" (yeni) kavram çakışması; geriye uyumluluk.
- **Önkoşul:** Civilization Bible — vatandaşlık tanımı.

### Phase 6 — Orders & Callings  ⚠ (Civilization Bible gerek)
- **Mevcut kod:** `roles[]` (writer/artist/designer/producer/seeker) — Order/Calling
  tohumu; `contributions` (üyenin dünyaya kattığı) — Calling kanıtı.
- **Eksik kod:** **Order modeli** (lonca/yol tablosu + üyelik + tanrıça arketibiyle
  ilişki); **Calling** (üyenin çağrısı, roles'ten formal göreve); **Rank** (Order içi
  mertebe + ilerleme eşikleri + katkı→rank besleme).
- **Maliyet:** ~3–4 hf.
- **Risk:** Aşırı oyunlaştırma riski (Experience Bible: "oyun değil tören"); rank
  ilerlemesinin anlamlı/etik kalması.
- **Önkoşul:** Civilization Bible — Order/Rank/Calling semantiği.

### Phase 7 — World Loop  ⚠ (Civilization Bible gerek)
- **Mevcut kod:** `contributions` community→canon akışı + SANRI 81-kod bağı + admin
  canon promotion; `lib/world` (6 dünya), `lib/world/resonance.ts`.
- **Eksik kod:** **Döngü mekaniği** — katkı→canon otomasyonu/ritmi; "bir kodun
  uyanışı" akışının tamamı; sezon/dalga ritmi; geri besleme (canon → district görseli/
  lore → yeni katkı çağrısı); avatar/rank'in döngüye etkisi.
- **Maliyet:** ~4–6 hf.
- **Risk:** En karmaşık faz; moderasyon yükü (canon kalitesi); ölçeklenme.
- **Önkoşul:** Civilization Bible — World Loop tanımı + Phase 6.

### Phase 8 — Living Civilization  ⚠ (emergent)
- **Mevcut kod:** Yok (1–7'nin bileşiminden doğar).
- **Eksik kod:** Yönetişim (First Circle'ın rolü), ekonomi entegrasyonu (Atelier/
  Bazaar + rank/order), kendini besleyen içerik döngüsü, ölçek/topluluk araçları.
- **Maliyet:** Sürekli (ürün değil, evre).
- **Risk:** Erken kurulursa boş; geç kurulursa topluluk dağılır. Zamanlama kritik.
- **Önkoşul:** Phase 5–7 + olgunlaşmış topluluk + Civilization Bible.

### Yol haritası özeti
| Faz | Ad | Maliyet | Civilization Bible gerek? |
|---|---|---|---|
| 1 | Portrait | 1–1.5 hf | hayır |
| 2 | Gallery | 1–1.5 hf | hayır |
| 3 | District Variants | 1.5–2 hf | hayır |
| 4 | SANRI Soul | 1.5–2 hf | hayır |
| 5 | Citizenship | 2–3 hf | **evet** |
| 6 | Orders & Callings | 3–4 hf | **evet** |
| 7 | World Loop | 4–6 hf | **evet** |
| 8 | Living Civilization | sürekli | **evet** |

**Avatar System (1–4): ~5–7 hf. Civilization (5–8): ~10–15 hf + Bible.**

---

# 3 · Civilization İlişki Analizi

> **Avatar → Order → Rank → Calling → First Circle**

Bu zincir, kullanıcının bir "ziyaretçi"den bir "vatandaş"a, oradan "kurucu"ya
giden yolculuğudur. Her halka bir öncekine bağlıdır ve mevcut kodda bir tutamacı vardır.

```
   AVATAR              ORDER               RANK              CALLING           FIRST CIRCLE
 (kimlik)          (ait olma)         (mertebe)          (görev)            (kurucu çember)
     │                  │                   │                  │                    │
 12 tanrıça        tanrıça →          order içi          roles[] →          erken + kanıtlı
 + soul + face     lonca/yol          ilerleme           formal çağrı       vatandaşlar
     │                  │                   │                  │                    │
 caelinus_ai_      roles[] (tohum)    ❌ yok            contributions       network_joined_at
 avatars +         + arketip          (Bible gerek)     (tohum) + intent    + home_code (tohum)
 goddess DNA
```

### Halka halka — nasıl kurulur

**1. Avatar → Order**
Avatar bir tanrıça arketibi taşır (Selene, Kali…). **Order**, aynı arketibin/
frekansın etrafında toplanan üyelerin loncasıdır. Doğal eşleme:
- Tanrıça arketibi → Order çağrısı (ör. Hekate avatarları → "Eşik Loncası").
- Mevcut tutamaç: `roles[]` (writer/artist/…) — ama bu **meslek**, Order ise
  **ruhsal aidiyet.** İkisi dik eksen; Order arketipten, role meslekten gelir.
- **Gerekli:** Order tablosu + (avatar.archetype → önerilen Order) eşlemesi.
  Kullanıcı Order'a "katılır" (avatarını doğurduktan sonra).

**2. Order → Rank**
Bir Order içinde üyenin **mertebesi.** İlerleme katkı + zaman + ritüelle kazanılır.
- Mevcut tutamaç: **yok.** Rank tamamen yeni.
- **Gerekli:** Rank merdiveni (ör. Seeker → Initiate → Adept → Keeper), ilerleme
  eşikleri (`contributions` sayısı/canon oranı + `network_joined_at` yaşı), her
  rank'in açtığı kapı (DistrictAccess permissions ile köprü).
- **Etik (Experience Bible):** "oyun değil tören" — rank bir skor değil, bir
  **olgunlaşma**. Rozet/XP dili yasak; ritüel/eşik dili.

**3. Rank → Calling**
**Calling**, üyenin dünyaya kattığı şeyin formalleşmiş hali — çağrısı.
- Mevcut tutamaç: `roles[]` (ne tür yaratıcı) + `contributions` (ne kattı) +
  `intent` (calm/power/love/clarity). Bunlar **kanıt**, Calling ise **taahhüt.**
- **Gerekli:** Calling = (role + rank + Order) bileşiminden doğan görev (ör.
  "Gaia Order'ında Adept yazar → 'Toprak Anlatıcısı' çağrısı"). World Loop'a
  (Phase 7) `contributions` üzerinden bağlanır.

**4. Calling → First Circle**
**First Circle**, medeniyeti kuran iç çember — erken gelen ve çağrısını kanıtlamış
vatandaşlar.
- Mevcut tutamaç: `network_joined_at` (erkenlik) + `home_code` (coğrafi çember) +
  `contributions` canon oranı (kanıt).
- **Gerekli:** First Circle statüsü = erkenlik + yüksek rank + canon katkı eşiği.
  Yönetişimde (Phase 8) söz hakkı, canon promotion'da rol. **Kapalı/davetli**
  olmalı (aksi halde anlamını yitirir).

### İlişkinin DB izdüşümü (öneri — canon değil)
```
profiles (mevcut)          → kimlik + handle + roles + element + home_code + network_joined_at
avatar (caelinus_ai_avatars) → archetype + canonical (Phase 1-2)
orders (YENİ)              → id, key, archetype_affinity, name, lore
order_memberships (YENİ)   → user_id, order_id, rank, joined_at
ranks (YENİ veya enum)     → order_id, key, threshold (contributions/age)
callings (YENİ)            → user_id, order_id, role, rank → vocation
contributions (mevcut)     → World Loop besleme (community→canon)
first_circle (YENİ/flag)   → erkenlik + rank + canon eşiği (davetli)
```
> Bu izdüşüm **K3 ilkesiyle uyumlu**: mümkün olduğunca `profiles` + mevcut
> tabloları genişlet; sadece gerçek yeni varlıklar (orders/memberships/callings)
> için tablo. Hiçbiri Civilization Bible onaylanmadan kurulmaz.

---

## Sonuç — Sıradaki Tek Doğru Adım

Tam horizon görünür hale geldi:

- **Avatar System (Phase 1–4)** kodla inşa edilebilir; canon hazır, temel kurulu.
  Sıradaki somut iş: **Phase 1 motor bağlama** (K2) + **migration 0018** (Phase 2 kolonları).
- **Civilization (Phase 5–8)** inşa edilemez çünkü **Order/Rank/Calling/First
  Circle/World Loop hiçbir Bible'da tanımlı değil.** Mevcut "Frekans Ağı" güçlü bir
  temel ama yapı yok.

**Civilization'a geçmeden önce gereken tek şey:**
→ **CAELINUS_CIVILIZATION_BIBLE.md** (Order · Rank · Calling · First Circle ·
World Loop · Citizenship semantiği — bu haritanın §3 izdüşümünü canon'a çeviren).

Bu Bible olmadan Phase 5+ kod = konsept icadı = senin kuralının ihlali.

---

*Bu doküman bir harita; canon değil. Phase 1–4 [Execution Brief](./CAELINUS_EXECUTION_PHASE_BRIEF.md)
kararlarıyla (K1–K3 + Caelinus-side composer) inşa edilir. Phase 5–8 için önce
Civilization Bible yazılır. Kod, ilgili Bible + faz onaylanınca gelir.*
