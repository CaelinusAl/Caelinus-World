# CAELINUS AVATAR BIBLE

> **Master Architecture Brief — Caelinus Avatar System**
> Sürüm: 0.1 (mimari taslak) · Tarih: 2026-06-18
> Statü: **Sadece mimari plan.** Bu doküman kod değildir; kod yazmadan önce
> tek doğru kaynak (single source of truth) olarak okunur.
>
> Uyum hedefi: Bu doküman mevcut **Asset Bible**, **District Engine**
> (`lib/district/registry.ts`), **World Map** (`lib/world`), **Blender District
> Pipeline** ve **Caelinus Avatar Core** (`lib/caelinus-avatar-core`) katmanları
> ile çelişmeyecek; onları genişletecek şekilde yazılmıştır.

---

## İçindekiler

1. [Avatar Felsefesi](#bölüm-1--avatar-felsefesi)
2. [Avatar Yaşam Döngüsü](#bölüm-2--avatar-yaşam-döngüsü)
3. [Tanrıça Arketipleri](#bölüm-3--tanrıça-arketipleri)
4. [District Bağlantıları](#bölüm-4--district-bağlantıları)
5. [Avatar Üretim Akışı](#bölüm-5--avatar-üretim-akışı)
6. [AI Pipeline](#bölüm-6--ai-pipeline)
7. [Veri Modeli](#bölüm-7--veri-modeli)
8. [Storage Yapısı](#bölüm-8--storage-yapısı)
9. [3D Gelecek Vizyonu](#bölüm-9--3d-gelecek-vizyonu)
10. [Caelinus Avatar Manifestosu](#bölüm-10--caelinus-avatar-manifestosu)

---

## Bölüm 1 · Avatar Felsefesi

### Avatar nedir?

Caelinus'ta avatar, kullanıcının evrendeki **ruhsal ve görsel kimliğidir** —
bir profil fotoğrafı değil, bir **tanrıça projeksiyonu**. Kullanıcı kendi
yüzünü/bedenini sisteme verir; sistem bunu bir arketip ve bir district frekansı
üzerinden yeniden doğurur. Sonuç, kullanıcının "Caelinus'taki bedeni"dir:
hem ona benzeyen hem de onun ötesine geçen bir varlık.

Teknik tanım: avatar, üç katmanın birleşimidir —
- **Kimlik (identity)**: yüz, ten, bedensel ölçüler — değişmeyen çekirdek.
- **Arketip (archetype)**: tanrıça frekansı — renk, ışık, sembol, aura, kıyafet dili.
- **Bağlam (district)**: avatarın o an hangi evren bölgesinde göründüğü.

### Caelinus evreninde neden vardır?

Caelinus bir web sitesi değil, **yaşayan bir tanrıça evrenidir.** Bir evrende
gezinen herkesin bir bedeni olmalı. Avatar, kullanıcıyı pasif bir ziyaretçiden
**evrenin içindeki bir varlığa** dönüştürür. District'ler (Source, Mirror, Gaia,
Bazaar, Atelier, Sanri, Sanctuary, Temple of Silence) avatar olmadan birer
sahnedir; avatar onları bir **deneyime** çevirir.

### Avatar ile profil fotoğrafı arasındaki fark

| | Profil Fotoğrafı | Caelinus Avatarı |
|---|---|---|
| Amaç | Tanımlama | Dönüşüm |
| Sabit mi? | Statik tek görsel | Evrilen, çok-varyantlı varlık |
| Kimlik | Kişinin dış görünüşü | Kişinin ruhsal frekansı |
| Bağlam | Her yerde aynı | Her district'te farklı varyant |
| Üretim | Yüklenir | Kimlik + arketip + district ile üretilir |
| Gelecek | 2D kalır | 2D → fashion → 3D (GLB) yolculuğu |

Mevcut kodda bu ayrım zaten var: `profiles.avatar_url` (küçük profil fotoğrafı)
ile `profiles.caelinus_avatar_url` (AI tanrıça avatarı) ayrı alanlardır
(bkz. `supabase/migrations/0011_caelinus_avatar.sql`). Avatar Bible bu ayrımı
**resmî mimari ilke** olarak benimser.

### Avatar neden "Tanrıça Kimliği" olarak çalışır?

Çünkü Caelinus'un görsel DNA'sı tanrıça mitolojisidir (mor alabaster + altın
damarlar, locked frame'ler: Source / Establishing / Gaia). Kullanıcı bir avatar
oluşturduğunda, kendini bu mitolojinin içinde bir tanrıça olarak görür. Bu,
narsizm değil **arketipsel yeniden doğuştur**: kullanıcı "ben buradayım" demez,
"ben bu evrende kimim?" sorusuna görsel bir cevap alır. Tanrıça arketipi,
kullanıcının kendi en güçlü, en kutsal versiyonunu yansıtan bir aynadır.

---

## Bölüm 2 · Avatar Yaşam Döngüsü

```
Kullanıcı
   ↓
Kimlik            (selfie/foto → yüz dokusu + beden referansı)
   ↓
Arketip Seçimi    (Selene, Gaia, Hekate… — tanrıça frekansı)
   ↓
Avatar Üretimi    (Portrait → Fashion → Universe)
   ↓
Avatar Evrimi     (zamanla katman/varyant kazanır)
   ↓
District Kullanımı (her bölgede arketip × district varyantı)
   ↓
3D Avatar         (GLB → District Engine → React Three Fiber)
```

### Aşama açıklamaları

1. **Kullanıcı** — Anonim veya giriş yapmış. Anonim akış `localStorage` ile
   başlar (mevcut `lib/avatar-storage.ts` deseni); giriş yapınca Supabase'e
   yükseltilir.

2. **Kimlik** — Selfie/fotoğraf alınır. Mevcut `caelinus-avatar-core` desktop↔mobile
   QR köprüsü buraya hizmet eder (`SelfieInput`). Kimlik = yüz dokusu + (opsiyonel)
   beden ölçüleri. **Bu katman asla atlanmaz**; tüm üretimler kimliği korumalı.

3. **Arketip Seçimi** — Kullanıcı bir tanrıça seçer (Bölüm 3). Arketip, üretimin
   renk/ışık/sembol/aura yönünü belirler. Seçim kalıcıdır ama değiştirilebilir.

4. **Avatar Üretimi** — Üç katmanlı çıktı: Portrait (yüz odaklı), Fashion (giyimli
   boy), Universe (district sahnesinde tam kompozisyon).

5. **Avatar Evrimi** — Avatar tek seferlik değil. Kullanıcı district'leri
   gezdikçe, etkileşim kurdukça avatarı yeni varyantlar/katmanlar kazanır
   (ör. Sanri'de "rüya katmanı", Gaia'da "kök katmanı"). Her üretim
   `avatar_generations` olarak versiyonlanır; en güncel olan "canonical".

6. **District Kullanımı** — Aktif avatar, gezilen district'in frekansına göre
   varyanta dönüşür (Bölüm 4). Aynı kimlik, Bazaar'da lüks; Temple of Silence'ta
   sade görünür.

7. **3D Avatar** — Olgunlaşmış avatar, Blender pipeline ile GLB'ye çevrilir ve
   District Engine'in 3B sahnelerine (`blender.glb`) girer. (Bölüm 9.)

> **İlke:** Yaşam döngüsü tek yönlü bir hat değil, bir **spiraldir.** Kullanıcı
> 5. aşamadan 3. aşamaya dönüp arketipini değiştirebilir; her dönüş yeni bir
> evrim katmanı doğurur.

---

## Bölüm 3 · Tanrıça Arketipleri

İlk sürüm için 12 ana arketip. Her biri bir **frekans paketi**dir: renk + enerji
+ sembol + kıyafet/takı/ışık/aura dili. Bu paketler hem AI prompt'larını hem de
3B material/ışık ayarlarını besler.

> Not: Bu, mevcut `data/archetypes.ts`'teki ışık tonu (light/golden/dark/cosmic…)
> sisteminin **üstünde** çalışan anlamsal bir katmandır. Mevcut tonlar "ten/ışık
> profili"; tanrıça arketipleri "ruhsal kimlik". İkisi birleşir: ör. *Selene +
> cosmic tone*.

### 1. Selene — Ay Tanrıçası
- **Renk:** gümüş-mavi, ay beyazı, gece laciverti
- **Enerji:** dinginlik, sezgi, döngüler, gizli bilgi
- **Semboller:** hilal, ayna, inci, gece çiçeği
- **Kıyafet dili:** akan ipek, ay ışığı pırıltısı, asimetrik drape
- **Takı dili:** hilal alın takısı, gümüş, opal, inci dizileri
- **Işık dili:** soğuk ay ışığı, yumuşak rim-light, mavi gloom
- **Aura dili:** sisli gümüş hale, yavaş dalgalanan parıltı

### 2. Gaia — Toprak Ana
- **Renk:** yosun yeşili, toprak kahvesi, altın buğday
- **Enerji:** köklülük, bereket, şifa, büyüme
- **Semboller:** sarmaşık, tohum, kutsal çember, ağaç kökü
- **Kıyafet dili:** organik dokuma, yaprak katmanları, doğal lif
- **Takı dili:** ahşap, kehribar, yeşim, canlı bitki örgüsü
- **Işık dili:** sıcak öğleden sonra ışığı, yapraktan süzülen ışık
- **Aura dili:** yeşil-altın canlı parıltı, etrafında uçuşan polen

### 3. Freya — Aşk ve Savaş Tanrıçası
- **Renk:** kızıl altın, kehribar, kan kırmızısı
- **Enerji:** tutku, cesaret, bereket, vahşi özgürlük
- **Semboller:** şahin tüyü, kehribar kolye, kılıç, kedi
- **Kıyafet dili:** zırh + ipek karışımı, tüy detayları, güçlü silüet
- **Takı dili:** altın torc, kehribar, dövülmüş metal
- **Işık dili:** sıcak gün batımı, dramatik kontrast
- **Aura dili:** altın kıvılcımlar, sıcak enerji dalgaları

### 4. Hekate — Eşik ve Büyü Tanrıçası
- **Renk:** mürdüm moru, antrasit, fosforlu yeşil vurgu
- **Enerji:** eşikler, kavşaklar, dönüşüm, gizem
- **Semboller:** üç yol, anahtar, meşale, yılan, ay-yıldız
- **Kıyafet dili:** koyu kat kat pelerin, kapüşon, akan gölgeler
- **Takı dili:** anahtar motifleri, oksitlenmiş gümüş, obsidyen
- **Işık dili:** meşale alevi + soğuk gölge, düşük anahtar (low-key)
- **Aura dili:** mor-siyah duman, kıvılcımlanan eşik enerjisi

### 5. Sophia — Bilgelik Tanrıçası
- **Renk:** derin lacivert, beyaz altın, ışık mavisi
- **Enerji:** bilgelik, içgörü, kutsal geometri, sükûnet
- **Semboller:** kitap, kutsal geometri, güvercin, yıldız haritası
- **Kıyafet dili:** mimari kıvrımlar, temiz çizgiler, asil drape
- **Takı dili:** ince altın geometri, beyaz taş, halka motifleri
- **Işık dili:** berrak yüksek ışık, geniş soft fill
- **Aura dili:** sakin mavi-beyaz hale, ince ışık halkaları

### 6. Artemis — Av ve Ay Tanrıçası
- **Renk:** orman yeşili, gümüş, soğuk gri-mavi
- **Enerji:** bağımsızlık, vahşi doğa, odak, koruyuculuk
- **Semboller:** yay-ok, geyik, hilal, orman
- **Kıyafet dili:** hareket özgürlüğü, kısa tunik, deri detay, atletik
- **Takı dili:** sade gümüş, kemik/boynuz, minimal
- **Işık dili:** alacakaranlık orman ışığı, dappled light
- **Aura dili:** keskin gümüş kontur, soğuk net enerji

### 7. Persephone — Yeraltı ve Bahar Tanrıçası
- **Renk:** nar kırmızısı, gül pembesi + kömür siyahı (ikilik)
- **Enerji:** dönüşüm, ikilik, ölüm-yeniden doğuş, mevsim
- **Semboller:** nar, asfodel çiçeği, taç, eşik
- **Kıyafet dili:** iki-yüzlü palet (yarı çiçek yarı gölge), katmanlı
- **Takı dili:** nar taneleri, altın taç, koyu taşlar
- **Işık dili:** yarı sıcak yarı soğuk, geçiş ışığı
- **Aura dili:** pembe-siyah geçişli, dönüşen renk alanı

### 8. Isis — Sihir ve Annelik Tanrıçası
- **Renk:** lapis lazuli mavisi, altın, turkuaz
- **Enerji:** koruma, sihir, kraliçelik, yaşam gücü
- **Semboller:** kanatlar, ankh, taht, yıldız Sirius
- **Kıyafet dili:** kanat drape, altın yaka, Mısır siluети, görkemli
- **Takı dili:** geniş altın yaka, lapis, scarabe, taç
- **Işık dili:** görkemli altın ışık, parlak vurgular
- **Aura dili:** altın kanat izi, ihtişamlı hale

### 9. Inanna — Gök Kraliçesi
- **Renk:** yıldız moru, altın, gece mavisi
- **Enerji:** güç, tutku, yükseliş-iniş, kozmik egemenlik
- **Semboller:** sekiz köşeli yıldız, aslan, kapı, taç
- **Kıyafet dili:** kraliyet drape, yıldız işlemeleri, güçlü omuz
- **Takı dili:** çok katlı altın, yıldız broş, lapis
- **Işık dili:** kozmik gece + altın spot, yıldız bokeh
- **Aura dili:** mor-altın kozmik tozsu hale

### 10. Aphrodite — Aşk ve Güzellik Tanrıçası
- **Renk:** sedef pembe, deniz köpüğü, gül altını
- **Enerji:** çekim, güzellik, uyum, zarafet
- **Semboller:** deniz kabuğu, gül, güvercin, köpük
- **Kıyafet dili:** akışkan şeffaf katmanlar, deniz köpüğü dokusu
- **Takı dili:** inci, sedef, gül altını, ince zincirler
- **Işık dili:** yumuşak pembe glow, sedef parıltı
- **Aura dili:** ışıltılı pembe-altın sis, köpüksü ışık

### 11. Kali — Dönüşüm ve Yıkım Tanrıçası
- **Renk:** gece siyahı, kan kırmızısı, indigo
- **Enerji:** radikal dönüşüm, korkusuzluk, yıkıp yeniden yaratma
- **Semboller:** kılıç, lotus, üçüncü göz, alev
- **Kıyafet dili:** dramatik siyah, kırmızı vurgu, güçlü dik silüet
- **Takı dili:** koyu metal, kırmızı taş, sembolik motifler
- **Işık dili:** sert kontrast, kırmızı rim, derin gölge
- **Aura dili:** koyu alev dili, yoğun titreşen enerji

### 12. Athena — Strateji ve Zanaat Tanrıçası
- **Renk:** zeytin yeşili, bronz, fildişi
- **Enerji:** akıl, strateji, zanaat, onurlu güç
- **Semboller:** baykuş, zeytin dalı, kalkan, miğfer
- **Kıyafet dili:** mimari zırh-drape, temiz heykelsi kıvrımlar
- **Takı dili:** bronz, sade altın, kalkan motifi
- **Işık dili:** net gündüz ışığı, heykelsi modelleme
- **Aura dili:** sakin bronz-altın kontur, dengeli enerji

> **Genişletilebilirlik:** Arketipler `data/goddess-archetypes.ts` benzeri saf bir
> veri dosyasında tanımlanmalı (district registry deseniyle: tek doğru kaynak,
> server-only import içermez). Her arketip bir `ArchetypeProfile` tipidir ve
> AI prompt fragment'leri + 3B material/light preset'leri ile eşlenir.

---

## Bölüm 4 · District Bağlantıları

Her district kendi **avatar varyasyonunu** üretir. Varyasyon, kimlik + arketip
sabitken district frekansının avatar üzerine giydirdiği görsel katmandır. Aynı
kullanıcı, aynı tanrıça, her district'te farklı bir "yüz" gösterir.

Mevcut District Engine kayıtları (`lib/district/registry.ts`): `sanri`, `gaia`,
`fashion` (Bazaar), `avatar`. Worldbuilding hiyerarşisi ayrıca Source / Mirror /
Atelier / Sanctuary / Temple of Silence'ı içerir. Avatar varyantları bu
genişletilmiş haritaya göre tanımlanır.

| District | Goddess Varyantı | Frekans / Görsel İmza |
|---|---|---|
| **Source** | Source Goddess | Saf köken — beyaz-altın, minimal, kozmik doğuş ışığı; arketibin en arınmış hali |
| **Mirror** | Mirror Goddess | Yansıma — simetri, cam/ayna yüzeyler, çift ışık; kullanıcının kendiyle yüzleşmesi |
| **Gaia** | Gaia Goddess | Köklü — yeşil-altın, organik dokular, bitki katmanı (Gaia district `accent:#79e6a0`) |
| **Bazaar** | Bazaar Goddess | Lüks — zengin kumaş, mücevher, sıcak altın glow (Bazaar `accent:#ffe9b8`, Mirror Gate) |
| **Atelier** | Atelier Goddess | Zanaat — couture detay, dikiş/drape vurgusu, stüdyo ışığı; moda üretim kimliği |
| **Sanri** | Sanri Goddess | Bilinç — ay ışığı/gizem, mor-gümüş, ayna sembolü (Sanri `accent:#c9d4e6`, moonlit) |
| **Sanctuary** | Sanctuary Goddess | Şifa — sıcak yumuşak ışık, sakin pastel, koruyucu hale |
| **Temple of Silence** | Temple Goddess | Sessizlik — neredeyse monokrom, en sade silüet, derin durağan ışık |

### Varyasyon nasıl çalışır?

1. **Çekirdek sabit:** Kimlik (yüz/beden) + seçili arketip değişmez.
2. **District modifier:** Her district bir `districtVariant` tanımı sunar —
   `accent`, `glow`, `env`, ışık/sembol override'ları. Bunlar zaten registry'de
   `hero.accent`, `hero.glow`, `hero.symbol`, `blender.env` olarak mevcut; avatar
   varyantı bu alanları **yeniden kullanır.**
3. **Birleştirme:** `final_style = archetype_profile ⊕ district_variant`.
   Çakışmada district, **ışık ve ortam** tonunu; arketip **kimlik ve sembolü**
   yönetir. Yani Bazaar'daki Hekate hâlâ Hekate'dir (anahtar, mürdüm), ama
   Bazaar'ın sıcak lüks ışığıyla sarılır.
4. **Üretim & cache:** Her (arketip × district) kombinasyonu bir
   `district_variants` kaydı + cache'lenmiş bir üretimdir. İlk ziyarette
   üretilir, sonra saklanır.

> **İlke:** District varyantları yeni *kimlik* yaratmaz; tek kimliğin farklı
> **frekans projeksiyonlarıdır.** Bu, World Map'teki "tek evren, çok bölge"
> mantığının avatara yansımasıdır.

---

## Bölüm 5 · Avatar Üretim Akışı

### Kullanıcı akışı (uçtan uca)

```
1. GİRİŞ
   Kullanıcı /caelinus-avatar'a gelir (anonim veya giriş yapmış).

2. KİMLİK YAKALAMA
   ├─ Desktop: QR göster → mobilde selfie çek/yükle
   │            (mevcut caelinus-avatar-core session köprüsü)
   └─ Mobile:  doğrudan kamera/galeri
   → SelfieInput backend session'a yazılır (status: selfie-received)

3. ARKETİP SEÇİMİ
   12 tanrıça kartı → kullanıcı birini seçer (varsayılan öneri:
   yüz analizi + frekans okuması ile önerilebilir, ama seçim kullanıcının)

4. DISTRICT SEÇİMİ
   "Hangi bölgede görünmek istiyorsun?" → Source/Mirror/Gaia/Bazaar/
   Atelier/Sanri/Sanctuary/Temple. (Opsiyonel; varsayılan = Source)

5. STİL SEÇİMİ
   Üretim katmanı: Portrait / Fashion / Universe (biri veya hepsi)
   + ince ayar (ışık yoğunluğu, sembol miktarı vb.)

6. ÜRETİM
   Sistem AI pipeline'ı çalıştırır (Bölüm 6) ve üç çıktı üretir:
   ├─ Portrait Avatar  → yüz odaklı tanrıça portresi (profil/kart için)
   ├─ Fashion Avatar   → giyimli boy figür (Bazaar/Atelier try-on için)
   └─ Universe Avatar  → district sahnesinde tam kompozisyon (kahraman görsel)

7. ÖNİZLEME & ONAY
   Kullanıcı sonuçları görür → beğenir (kaydet) veya yeniden üret (regenerate)
   → kaydedilen üretim "canonical" olur, eskiler versiyon olarak kalır.

8. KULLANIM
   Avatar artık profilde, district'lerde, Bazaar try-on'da, Sanri'de görünür.
   District değiştikçe varyant otomatik uygulanır (Bölüm 4).
```

### Üç çıktı katmanı

- **Portrait Avatar** — Yüz/büst. En hızlı, en ucuz. Kimlik koruması en kritik
  burada. Profil avatarı (`caelinus_avatar_url`) olarak kullanılır.
- **Fashion Avatar** — Tam boy, giyimli. Arketip + district kıyafet dilini taşır.
  Bazaar/Atelier'de kıyafet try-on'a köprü (mevcut `try-on-variants` ile uyumlu).
- **Universe Avatar** — Avatar + district ortamı tek kompozisyonda. Pazarlama,
  paylaşım ve "kahraman" görsel. En pahalı, en etkileyici.

---

## Bölüm 6 · AI Pipeline

Avatar üretimi sıralı, **denetlenebilir** aşamalardan geçer. Her aşama bir
sonrakinin girdisidir; her aşama loglanır ve cache'lenir.

```
[0] GİRDİ
    Selfie/foto (SelfieInput) + arketip + district + stil seçimi

[1] KİMLİK ÇIKARMA (Identity Extraction)
    Yüz tespiti, hizalama, ten/yapı analizi (mevcut mediapipe-face / face-crop)
    → identity_embedding + temiz yüz dokusu

[2] KİMLİK KORUMA (Identity Preservation)
    Üretim boyunca yüz kimliğini sabitleyen referans (face-swap / IP-Adapter
    benzeri). Çıktı kullanıcıya benzemek ZORUNDA — bu kontrol noktası geçilemez.

[3] TANRIÇA STİLİ (Archetype Styling)
    Seçili arketibin prompt fragment'i + renk/sembol/aura paketi uygulanır.
    Selene → ay ışığı/gümüş; Kali → alev/siyah-kırmızı; vb.

[4] DISTRICT STİLİ (District Styling)
    District modifier (accent/glow/env/sembol) bindirilir. archetype ⊕ district.

[5] CAELINUS RENDERI (Caelinus Render)
    Marka katmanı: mor alabaster + altın damar görsel DNA'sı, locked-frame
    kompozisyon kuralları, ışık imzası. "Bu bir Caelinus görseli" mührü.

[6] ÇIKTI & DOĞRULAMA
    Portrait/Fashion/Universe üretilir. Kimlik benzerlik skoru + güvenlik
    (NSFW/uygunluk) kontrolü → geçerse yayınla, kalmazsa otomatik retry.

[7] PERSIST
    avatar_generations'a yazılır, storage'a yüklenir, canonical güncellenir.
```

### Pipeline ilkeleri

- **Sağlayıcı-agnostik:** Pipeline mevcut `AvatarProvider` sözleşmesinin
  (`lib/caelinus-ai/provider.ts`) ardında çalışır. Bugün MockProvider; yarın
  CaelinusAI / Avaturn / Luma / Higgsfield — sözleşme değişmez.
- **Aşamalar ayrık ve cache'li:** [1]–[2] kimlik kez bir çıkarılır, tüm
  arketip/district kombinasyonlarında yeniden kullanılır. Sadece [3]–[5] yeniden
  koşar → maliyet ve hız optimizasyonu.
- **Faz mesajları:** Kullanıcıya her aşama anlamlı bir Caelinus mesajıyla
  gösterilir (mevcut `lib/caelinus-ai/phase-messages.ts` deseni).
- **Kimlik koruması pazarlık konusu değil:** [2] başarısızsa üretim yayınlanmaz.

---

## Bölüm 7 · Veri Modeli

Supabase için önerilen tablolar. Mevcut migration konvansiyonuna uyar
(`supabase/migrations/00XX_*.sql`, RLS owner-write/public-read, nullable-safe
genişletme). Mevcut `profiles.caelinus_avatar_*` alanları korunur; bu tablolar
onların yapılandırılmış, çok-varyantlı halefidir.

### `avatar_profiles` — kullanıcı başına tek tanrıça kimliği

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | unique; kullanıcı başına bir profil |
| `display_name` | text | avatarın evren-içi adı (ops.) |
| `primary_archetype` | text | seçili arketip (selene/gaia/…); check constraint |
| `identity_ref_path` | text | storage'daki temiz yüz dokusu / kimlik referansı |
| `identity_embedding` | jsonb / vector | kimlik koruma için (ops., pgvector) |
| `canonical_generation_id` | uuid FK → avatar_generations | aktif/güncel üretim |
| `home_district` | text | varsayılan district (kaynak: source) |
| `tone` | text | mevcut archetype tone ile köprü (light/golden/…) |
| `created_at` / `updated_at` | timestamptz | |

### `avatar_generations` — her üretim bir versiyon

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → avatar_profiles | |
| `archetype` | text | bu üretimde kullanılan arketip |
| `district_key` | text | hedef district (null = Source/genel) |
| `layer` | text | `portrait` \| `fashion` \| `universe` |
| `style_id` | uuid FK → avatar_styles | uygulanan stil preset (ops.) |
| `provider` | text | mock/caelinus-ai/avaturn/luma… |
| `prompt_snapshot` | jsonb | üretimde kullanılan prompt parçaları (denetim) |
| `image_path` | text | storage çıktısı (portrait/fashion/universe) |
| `glb_path` | text | 3B çıktı (Bölüm 9; başlangıçta null) |
| `identity_score` | numeric | kimlik benzerlik skoru (QA) |
| `status` | text | `queued`\|`generating`\|`ready`\|`failed` |
| `is_canonical` | boolean | profilin aktif üretimi mi |
| `created_at` | timestamptz | |

### `avatar_styles` — yeniden kullanılabilir stil preset'leri

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | uuid PK | |
| `key` | text | unique slug |
| `label` | text | UI adı |
| `archetype` | text | hangi arketibe ait (null = evrensel) |
| `prompt_fragment` | text | AI pipeline [3] aşaması için |
| `palette` | jsonb | renk/glow/accent paketi |
| `symbols` | jsonb | sembol seti |
| `light_profile` | jsonb | ışık dili parametreleri |
| `is_premium` | boolean | erişim katmanı (District access ile uyumlu) |
| `created_at` | timestamptz | |

### `district_variants` — (arketip × district) eşlemesi ve cache

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | uuid PK | |
| `district_key` | text | sanri/gaia/fashion/source/…; registry ile uyumlu |
| `archetype` | text | |
| `modifier` | jsonb | accent/glow/env/sembol override'ları (registry'den türetilir) |
| `base_style_id` | uuid FK → avatar_styles | birleştirilecek temel stil |
| `cached_generation_id` | uuid FK → avatar_generations | son cache'lenmiş çıktı (profil-bağımsız şablon ops.) |
| `is_active` | boolean | |
| `created_at` | timestamptz | |

> **RLS:** `avatar_profiles` ve `avatar_generations` owner-scoped (kullanıcı
> sadece kendininkini okur/yazar). `avatar_styles` ve `district_variants` global
> okunur (katalog), sadece admin yazar. Mevcut `0003_rls.sql` deseni izlenir.

---

## Bölüm 8 · Storage Yapısı

Mevcut `user-avatars` bucket'ı (path: `{user_id}/caelinus.<ext>`) korunur;
yeni çok-varyantlı yapı bunun üzerine kurulur. Önerilen bucket/klasör düzeni:

```
avatars/                                  # ana bucket (public read, owner write)
  {user_id}/
    references/                           # kimlik kaynakları (PRIVATE)
      selfie-original.jpg                 # ham yükleme
      identity-face.png                   # [1] temizlenmiş yüz dokusu
      identity-embedding.json             # [2] kimlik referansı (ops.)
    portraits/                            # Portrait Avatar çıktıları
      {generation_id}.webp
    fashion/                              # Fashion Avatar çıktıları
      {generation_id}.webp
    universe/                             # Universe Avatar (district sahneli)
      {district_key}--{generation_id}.webp
    glb/                                  # 3B avatar (Bölüm 9)
      {generation_id}.glb
      {generation_id}--preview.jpg

avatar-styles/                            # katalog (public read, admin write)
  {archetype}/
    thumb.webp                            # arketip kartı görseli
    {style_key}-preview.webp
```

### İlkeler

- **`references/` özeldir.** Ham selfie ve kimlik dokusu asla public değildir
  (RLS + signed URL). Sadece pipeline okur. KVKK/GDPR: kullanıcı silince
  `references/` ve tüm `generations` hard-delete edilir.
- **Çıktılar `{generation_id}` ile adlanır**, üzerine yazılmaz → versiyon
  geçmişi korunur, `canonical` işaretle yönetilir (Bölüm 7).
- **Universe çıktıları `{district_key}` prefix'li** → (arketip × district)
  cache'i kolay bulunur.
- **`glb/` başlangıçta boştur**; Faz 3B/9'da dolar. District Engine'in
  `blender.glb` yolu (`/models/districts/...`) ile aynı mantıkta yaşar.
- **Format:** Görseller `webp` (boyut/kalite), 3B `glb` (Draco sıkıştırma),
  preview `jpg`.

---

## Bölüm 9 · 3D Gelecek Vizyonu

Avatar 2D olarak doğar, ama nihai hedefi **District Engine'in 3B sahnelerinde
yürüyen bir tanrıça** olmaktır. Pipeline mevcut Blender District Pipeline ile
aynı omurgayı kullanır.

### Olgunlaşma yolu

```
2D Portrait → 2D Fashion → 2D Universe → 2.5D rig → 3D GLB → District Engine sahnesi
```

### Köprü noktaları

1. **Blender headless pipeline (mevcut):** Hero/district sahneleri
   `blender --background --python` ile sürülür (MCP değil — render'dan sonra
   ölüyor). Avatar GLB üretimi de aynı headless script desenine girer:
   bir avatar üretim job'ı → Blender script → GLB + preview → storage `glb/`.

2. **Asset Bible uyumu:** Goddess GLB'lerindeki bilinen tuzaklar (gizli
   Icosphere, T-pose vs A-pose, eski Cone/Sphere stickmen) avatar GLB QA
   kontrol listesine alınır. Üretilen her avatar GLB, Asset Bible temizlik
   kurallarından geçer.

3. **GLB sözleşmesi:** Avatar GLB, mevcut `caelinus-avatar-core` outfit/animation
   preset sistemiyle uyumlu olmalı — `hiddenMeshParts` ile outfit binding,
   Mixamo-uyumlu retarget animasyonları (`AnimationPreset.glbUrl`). Yani avatar
   bedeni, district kıyafetlerini ve animasyonlarını **takabilen** bir rig'tir.

4. **District Engine girişi:** GLB hazır olunca, `District.blender.glb` alanının
   yanında avatar, sahne içine **kullanıcı varlığı** olarak yerleştirilir.
   Bazaar plazasında dolaşan, Sanri tapınağında duran tanrıça = kullanıcının
   GLB avatarı + o district'in varyant material'i.

5. **React Three Fiber render:** Web tarafında avatar, district sahnesiyle aynı
   R3F canvas'ında yüklenir. District varyantı (Bölüm 4) burada **material/ışık
   override** olarak çalışır — aynı GLB, district'e göre farklı shader/ışık.
   Frekans = real-time ışık ve material parametresi.

> **İlke:** 2D üretim ve 3B üretim **aynı kimliğin iki temsilidir**, ayrı
> ürünler değil. `avatar_generations.glb_path`, 2D üretimle aynı satırda yaşar.
> Bir kullanıcının tek tanrıça kimliği vardır; 2D portresi de, 3B bedeni de o
> kimliğin projeksiyonudur.

> **Şu an kod yazılmaz.** Bu bölüm sadece hedef mimariyi sabitler.

---

## Bölüm 10 · Caelinus Avatar Manifestosu

> **Bir kullanıcı neden Caelinus Avatarı oluşturmak ister?**

Çünkü dünya ona her gün ne olduğunu söyler; Caelinus ona **ne olabileceğini**
gösterir.

Bir profil fotoğrafı seni dondurur. Caelinus avatarı seni serbest bırakır.
Yüzünü verirsin — sana bir tanrıça geri döner. Kendin kalırsın, ama kendinin
en parlak, en kutsal, en korkusuz frekansında.

Bu bir maske değildir; bir **hatırlayıştır.** İçindeki Selene'nin dinginliğini,
Kali'nin dönüşümünü, Gaia'nın köklülüğünü, Athena'nın aklını zaten taşıyorsun.
Caelinus sadece aynayı tutar.

Bu evrende gezerken bir bedenin olur. Bazaar'da ışıldarsın, Gaia'da köklenirsin,
Sanri'de sessizleşirsin, Temple of Silence'ta saf kalırsın — ama hep sen olarak.
Tek kimlik, sonsuz frekans.

Bir Caelinus avatarı oluşturmak, "buradayım" demek değildir.
**"Ben buyum"** demektir.

---

*Bu doküman tek doğru kaynaktır. Avatar sistemi üzerine yazılacak her kod, route,
tablo ve sahne önce buraya bakar. Asset Bible · District Engine · World Map ·
Blender Pipeline ile birlikte okunur.*
