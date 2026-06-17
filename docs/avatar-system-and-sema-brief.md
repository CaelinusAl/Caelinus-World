# CAELINUS — Avatar Sistemi Dökümü + Şeyma Karaş Üretim Brief'i

> **Amaç:** Caelinus avatar sisteminin bugünkü tüm mimarisini tek yerde toplamak, ileri vizyonu çizmek ve avatar üretimini devralan **Şeyma Karaş**'a teslim edeceğimiz net talimat + kabul kriterlerini tanımlamak.
>
> **Sürüm:** v1 · Hazırlayan: AURA (Caelinus AI) · Tarih: 2026-06-15

---

## BÖLÜM 0 — Tek Cümlede Sistem

Caelinus avatarları, **Mixamo standart iskeletine sahip, tek armature'a skin'li (deri-bağlı), Y-up / metre ölçekli, PBR materyalli, dokuları gömülü GLB** dosyalarıdır. Uygulama bu GLB'leri `ModelAvatar` motoruyla yükler, klonlar, beden ölçülerine göre kemikleri ölçekler, Mixamo animasyonlarını (catwalk vb.) üzerine giydirir ve sahnede döndürür.

Şeyma'nın işi: **bu kontrata harfiyen uyan, sanatsal kalitesi yüksek GLB avatarları üretip teslim etmek.** Geri kalan her şey (yükleme, deformasyon, animasyon, materyal) yazılım tarafında otomatik çalışıyor — ama yalnızca kontrat tutarsa.

---

## BÖLÜM 1 — MEVCUT SİSTEM (Bugün ne var?)

### 1.1 Mimari katmanlar

| Katman | Teknoloji | Dosya |
|---|---|---|
| Çatı | Next.js 16 (App Router) + React 19 + TS | `caelinus/` |
| 3D motor | Three.js `^0.183` + R3F `^9.5` + drei `^10.7` | `components/shop/ModelAvatar.tsx` |
| Beden kayıt defteri | TS sabiti + JSON manifest | `lib/avatar-bodies.ts`, `public/avatars/manifest.json` |
| Kimlik köprüsü | localStorage + Supabase | `lib/identity/caelinus-identity.ts` |
| Üretim hattı (AI) | Provider arayüzü (mock/gerçek) | `lib/caelinus-ai/` |
| Veritabanı | Supabase (profiles + storage) | `supabase/migrations/0011, 0013, 0014` |
| Asset araçları | gltf-transform + fbx2glTF | `_tools/*.js` |

### 1.2 Asset kayıt defteri (kaynak gerçeği)

Tüm GLB'ler `public/models/` altında durur. Her yeni avatar **iki yere** kaydedilmek zorunda:

1. `lib/avatar-bodies.ts → CAELINUS_BODY_LIBRARY` (kod tarafı — `BodyEntry`)
2. `public/avatars/manifest.json → avatars[]` (manifest — aynı alanlar)

**`BodyEntry` alanları:**
```
id, label, tagline, url, preview?, isDefault?, isPersonal?,
gender ("feminine"|"masculine"|"neutral"),
vibe?, baseHeightM?, supportsSkinToneOverride?,
animationCompat ("mixamo" | "custom" | "static")
```

Bugünkü kütüphane: **15 beden** — `caelinus-goddess` (kurucu/tanrıça gövdesi), 9 adet `selin-*` varyantı, 5 adet `caelinus-*` varyantı. Çalışma zamanı varsayılanı `DEFAULT_BODY_ID = "selin-v1"`.

Zodyak kıyafetleri (bikiniler) ayrı: `public/models/Meshy_Al/*.glb` (aries, gemini, cancer, virgo, libra, scorpione, capricorn, pices) — `OUTFIT_GLB_MAP` üzerinden ürünlere bağlanır.

Animasyon: `public/models/catwalk.glb` (Mixamo catwalk). `ANIMATION_PRESETS` = `idle` + `catwalk`.

### 1.3 GLB KONTRATI (en kritik bölüm — Şeyma bunu ezberlemeli)

`ModelAvatar` ve `_tools/merge.js`'in davranışından çıkan **zorunlu** spec:

| Kural | Değer | Neden |
|---|---|---|
| Yukarı eksen | **Y-up** | Three.js standart; X-up/Z-up yan yatar |
| Ölçek birimi | **Metre** (boy ≈ 1.6–1.8) | Sahne 1 birim = 1 metre kabul eder |
| Kök transform | **Translation [0,0,0], Rotation 0, Scale [1,1,1]** | FBX2glTF "scale-100" hatası modeli devleştirir/yok eder |
| İskelet | **Tek armature, Mixamo isimli kemikler** | Animasyon retarget Mixamo isimlerine göre eşleşir |
| Skin | **Mesh armature'a vertex-weight ile bağlı (SkinnedMesh)** | Bağlı değilse "skeleton orphan" → animasyon mesh'i kıpırdatmaz |
| Materyal | **PBR (MeshStandard/Physical), baseColorFactor dolu** | Eksikse gri/siyah render |
| Doku | **GLB içine gömülü (embedded)** | Harici .png referansı 404 verir |
| Saç | **Head kemiğine bağlı veya skin'li**, alphaMode uygun | Bağsız saç havada uçar |
| Animasyon | **In-place** (kök/Hips pozisyon track'i yok) | Root-motion modeli sahne dışına kaydırır |

**Mixamo zorunlu kemik isimleri:**
```
Hips, Spine, Spine1, Spine2, Neck, Head,
LeftShoulder, LeftArm, LeftForeArm, LeftHand,
RightShoulder, RightArm, RightForeArm, RightHand,
LeftUpLeg, LeftLeg, LeftFoot,  RightUpLeg, RightLeg, RightFoot
```
(Opsiyonel: `LeftBreast/RightBreast` — büst deformasyonu daha doğru olur. El parmak kemikleri serbest.)
Prefix `mixamorig:` veya `mixamorig_` olabilir — motor otomatik soyar.

### 1.4 Render motoru (`ModelAvatar.tsx`) ne yapıyor?

1. `useGLTF(url)` ile yükler, **`SkeletonUtils.clone`** ile klonlar (skin-aware).
2. **Beden deformasyonu** (`applyBodyDeformation`): `AvatarConfig` (height 150–200, weight 40–110, bustSize S/M/L/XL, hipRatio 0.8–1.25) → ilgili kemikleri (Hips/Spine/büst/uyluk) ölçekler. SkinnedMesh yoksa vertex deform'a düşer.
3. **Sahne boy ölçeği:** doğal boy ölçülüp `height`'a göre yeniden ölçeklenir, Box3 ile zemine oturtulur.
4. **Animasyon:** `animationUrl` verilirse harici GLB yüklenir, track isimleri avatar kemiklerine retarget edilir, **tüm `.scale` track'leri** ve **Hips `.position`** atılır (scale-100 + root-motion koruması), skor en yüksek klip oynatılır.
5. **Materyal:** Harici avatar (Wolf3D/avaturn/ReadyPlayerMe imzaları veya ≥3 skinned mesh) ise PBR korunur; yerli Caelinus avatarı ise `MeshPhysicalMaterial` ten tonu + aura emissive uygulanır (saç/kaş/göz hariç).
6. **Frustum culling kapatılır** (`frustumCulled = false`) — animasyonda bind-pose bounding sphere bayatlayıp mesh kaybolmasın diye.

### 1.5 Kimlik & üretim akışları (bugün)

| Akış | Rota | Çıktı |
|---|---|---|
| 2D Stüdyo (parametrik + selfie face-swap) | `/avatar` | PNG portre → `user-avatars/{uid}/caelinus.png` |
| Caelinus AI 3D eşleştirme | `/caelinus-ai/avatar` | `GeneratedAvatar { glbUrl }` (şu an mock + hazır GLB) |
| QR mobil selfie | `/caelinus-avatar/create` + `/m/[sessionId]` | Telefon → masaüstü oturum |
| 3D beden konfigüratör | `/universe/shop/avatar` | `AvatarConfig` (sliders + body picker) |
| Parametrik SVG | `ParametricAvatar` | Sıfır-AI vektör portre |

**Önemli mimari ilke:** UI gerçek AI mi mock mu bilmez. `AvatarProvider` arayüzü (`lib/caelinus-ai/provider.ts`) sayesinde gerçek model geldiğinde `registerProvider()` ile takılır, UI değişmez.

### 1.6 Supabase şeması (avatar)

`profiles` tablosunda:
- `caelinus_avatar_url` — public URL, path `{user_id}/caelinus.<ext>` (`user-avatars` bucket)
- `caelinus_avatar_zodiac` — 12 burçtan biri (check constraint)
- `caelinus_avatar_updated_at`
- `caelinus_avatar_base` — `silk | bodysuit | veil`

`user-avatars` bucket: public-read, owner-only insert/update/delete (klasör = `auth.uid()`). `/api/avatar/save` admin client ile yükler.

### 1.7 Bilinen tuzaklar (geçmişte 1 günümüzü yakanlar)

| Tuzak | Belirti | Çözüm |
|---|---|---|
| **FBX2glTF scale-100** | Model dev gibi / görünmez | Kök node scale `[1,1,1]`'e normalize et (`_tools/merge.js:55-59`) |
| **Rig kaybı** | Saç eklerken iskelet uçuyor | Blender export yerine `gltf-transform` ile programatik birleştir |
| **Skeleton orphan** | Konsol `❌ orphan'd`, animasyon mesh'i kıpırdatmıyor | `SkeletonUtils.clone` + mesh'in gerçekten skin'li olması |
| **Havada uçan saç** | Saç bedenden kopuk | Saç mesh'ini Head kemiğine inverse-bind ile bağla |
| **Gri/blok saç** | `baseColorFactor` boş | Materyale renk + doğru `alphaMode` ver |
| **Root motion** | Model sahne dışına yürüyor | Hips position track'lerini at (motor zaten atıyor, ama animasyon in-place olmalı) |
| **DEFAULT_BODY_ID uyuşmazlığı** | Kod `selin-v1`, manifest `caelinus-default` | İkisi senkron tutulmalı |

---

## BÖLÜM 2 — İLERİ VİZYON (Nereye gidiyoruz?)

### 2.1 Hedef: "Caelinus kendi avatar mimarisinin sahibi"

Bugün avatarlar elle/Mixamo ile üretilen hazır GLB'ler. Hedef mimari üç katmanlı:

```
Frekans Kimliği (burç + element + Hz + niyet)
        │
        ▼
 Kanonik Beden Tabanı  ──►  Parametrik Deformasyon  ──►  Yüz/Selfie Katmanı
 (Şeyma'nın ürettiği)       (mevcut sliders motoru)       (face-swap / morph)
        │
        ▼
   Kıyafet Bağlama (outfit GLB bone-binding)  ──►  Animasyon (catwalk + jest seti)
        │
        ▼
   Render + Hesap kalıcılığı (Supabase)
```

**Stratejik hedef:** Tek bir **canonical base body** (`caelinus-body-base.glb`) üzerinden, frekansa göre parametrik türetilen sınırsız varyant. Roadmap'te zaten işaretli: `docs/caelinus-ai-roadmap.md → [ ] Drop in /public/models/base/caelinus-body-base.glb`.

### 2.2 Faz planı (avatar üretimi)

| Faz | Hedef | Çıktı |
|---|---|---|
| **Faz A — Temel** | Kanonik kadın + erkek base body | `caelinus-body-base-fem.glb`, `-masc.glb` (Mixamo rig, temiz topoloji, blendshape-ready) |
| **Faz B — Saç & Yüz** | Modüler saç seti + yüz morph hedefleri | `hair/*.glb` (Head-bind), base'te `morphTargets` (büst/kalça/yüz) |
| **Faz C — Kıyafet** | 12 burç kıyafeti + ortak bağlama iskeleti | `outfits/<zodiac>.glb` aynı rig'e bind |
| **Faz D — Animasyon** | Catwalk + 4–6 jest (idle, dönüş, poz, selam) | `anim/*.glb` in-place Mixamo klipleri |
| **Faz E — Fotorealizm** | PBR doku kalitesi yükseltme + LOD (mobil/masaüstü) | Her base için `-hires/-light` türevleri |

---

## BÖLÜM 3 — ŞEYMA KARAŞ ÜRETİM BRIEF'İ

> Bu bölümü olduğu gibi Şeyma'ya ilet. Net, ölçülebilir, kabul kriterli.

### 3.1 Rolün

Caelinus'un **3D avatar asset'lerini** üretmek: kanonik bedenler, saç, kıyafet ve animasyonlar. Çıktın **kontrata uyan GLB dosyaları** + kısa bir teslim notu. Kod tarafına dokunmana gerek yok; biz manifest'e kaydını yapacağız.

### 3.2 Araç zinciri (önerilen)

- **Blender 4.x** — modelleme, retopo, UV, doku, blendshape.
- **Mixamo** (ücretsiz) — otomatik rig + animasyon. Mesh'i yükle → "auto-rig" → catwalk/jest animasyonlarını indir.
- **gltf-transform CLI** (`npm i -g @gltf-transform/cli`) — son temizlik: `prune`, doku gömme, scale normalize.
- Export her zaman **glTF Binary (.glb)**, dokular **embedded**.

### 3.3 Üretim adımları (her base body için)

1. **Modelle** (Blender): metre ölçekli, ayaklar zeminde (Y=0), T-poz veya A-poz, ortalanmış (X=0, Z=0). Temiz quad topoloji, ~15–40k tris hedef.
2. **UV + PBR doku:** baseColor + roughness + normal. Caelinus paleti — **Bible §2 ile senkron** (siyah `#03060f` / gece yarısı `#0b1530` / altın `#d4b78a` / yumuşak altın `#ffe9b8` / fildişi `#f4ecd8` / ay gümüşü `#c9d4e6`) ile uyumlu ten/atmosfer.
3. **Rig:** Mixamo'ya yükle → otomatik rig. İndirdiğinde Mixamo bone isimleri gelir (zorunlu).
4. **Animasyon:** Mixamo'dan **in-place** (root motion KAPALI / "In Place" işaretli) catwalk + jestleri ayrı GLB olarak indir.
5. **Blendshape (opsiyonel ama tercih edilir):** büst/kalça/yüz için morph target'lar ekle.
6. **Son temizlik (gltf-transform):**
   ```bash
   gltf-transform prune in.glb out.glb        # kullanılmayan veriyi at
   ```
   Kök node scale'i **[1,1,1]** olduğundan emin ol (FBX kaynaklıysa scale-100 tuzağına dikkat).
7. **Doğrula:** https://gltf-viewer.donmccurdy.com — model dik mi, ölçek doğru mu, animasyon in-place mi?

### 3.4 Dosya & isimlendirme

| Tür | Konum | İsim |
|---|---|---|
| Base body | `public/models/` | `caelinus-body-base-fem.glb` |
| Saç | `public/models/hair/` | `hair-long-wave.glb` |
| Kıyafet | `public/models/Meshy_Al/` | `<zodiac>.glb` (örn. `taurus.glb`) |
| Animasyon | `public/models/anim/` | `catwalk.glb`, `pose-turn.glb` |
| Önizleme | `public/models/previews/` | `<id>.png` (kare, ~512px) |

Dosya adında **boşluk kullanma** (eski `selin (1).glb` gibi sorun çıkarır). Küçük harf + tire.

### 3.5 KABUL KRİTERLERİ (teslim kontrol listesi)

Her GLB için ✅ olmalı:

- [ ] **.glb** formatı, dokular **gömülü** (yanında ayrı .png/.bin yok)
- [ ] **Y-up**, **metre** ölçek (boy 1.6–1.8), ayaklar **Y=0**, gövde X=0/Z=0 ortalı
- [ ] Kök node transform: translation [0,0,0], rotation 0, **scale [1,1,1]**
- [ ] **Tek armature**, **Mixamo** kemik isimleri (Hips…Head…Left/RightArm…)
- [ ] Mesh armature'a **skin'li** (test: viewer'da animasyon mesh'i kıpırdatıyor)
- [ ] Materyaller **PBR**, `baseColorFactor` dolu (gri/siyah değil)
- [ ] Saç (varsa) **Head kemiğine bağlı** ve animasyonda kafayla hareket ediyor
- [ ] Animasyon (varsa) **in-place** (yürürken yerinde sayıyor, sahne dışına kaymıyor)
- [ ] Dosya boyutu makul: base ≤ ~15MB, hires ≤ ~30MB, mobil/light ≤ ~5MB
- [ ] donmccurdy gltf-viewer'da hatasız açılıyor

### 3.6 YAPMA (geçmişte bizi yakanlar)

- ❌ Blender'dan saç+rig'i tek seferde "merge edip" export etme — rig kaybolabilir. Saçı ayrı GLB ver, biz Head'e bağlarız (veya doğrudan base'e skin'le).
- ❌ FBX2glTF default çıktısını ham bırakma — scale-100 tuzağı (modeli devleştirir).
- ❌ Çoklu armature / iç içe iskelet — tek armature zorunlu.
- ❌ Harici doku referansı bırakma — her şey gömülü.
- ❌ Root-motion'lu animasyon — daima "In Place".

### 3.7 İlk teslim paketi (Faz A — bu hafta)

1. `caelinus-body-base-fem.glb` — kadın kanonik base (Mixamo rig, PBR, blendshape-ready).
2. `caelinus-catwalk.glb` — base'in rig'iyle uyumlu in-place catwalk.
3. 1 adet `hair-*.glb` — Head-bind örnek saç.
4. Kısa teslim notu: poly sayısı, kullanılan araçlar, varsa morph target listesi.

Bunları aldığımızda biz `lib/avatar-bodies.ts` + `manifest.json` kaydını yapıp uygulamada canlı test ederiz. İlk başarılı tur, geri kalan tüm fazların şablonu olur.

---

## BÖLÜM 4 — VR/XR HEDEFLİ ÜRETİM (yeni)

> Caelinus web'de başlıyor ama mobil + VR'a taşınacak (Bible §8). Bu yüzden
> avatarlar **baştan VR-grade** üretilir. BÖLÜM 3 kontratı (Mixamo rig · Y-up ·
> metre · embedded PBR) **aynen geçerli**; bu bölüm üstüne VR/XR şartlarını ekler.
> Çelişki olursa daha katı olan (VR) kazanır.

### 4.1 İlke: Performans kraldır

VR = mobil GPU + **90 Hz** + yakın mesafe. Masaüstü web'de affedilen şey VR'da
kare düşürür / mide bulandırır. Her karar performans bütçesine tabidir.

### 4.2 İki türev (her base için)

| Türev | Tris | Doku | Boyut | Draw call | Hedef |
|---|---|---|---|---|---|
| `-vr` | ≤ **25k** | ≤ **1024²** | ≤ **5 MB** | ideal **1** | mobil / VR |
| `-hires` | ≤ **60k** | — | ≤ ~30 MB | — | masaüstü |

Saç/kaş **yüzlerce ufak mesh olmasın** → tek mesh + **tek atlas** dokuda topla.

### 4.3 Format & sıkıştırma — ve scope sınırı

- Hedef: doku **KTX2/Basis**, geometri **Draco / meshopt**.
- **ÖNEMLİ scope notu:** Render motoru (`components/shop/ModelAvatar.tsx`) bugün
  düz `GLTFLoader` kullanıyor — **`KTX2Loader` / `DRACOLoader` / `MeshoptDecoder`
  yok**. Yani sıkıştırılmış GLB **render olmaz** (boş/siyah ekran). Bu yüzden:
  - **Şeyma:** `-hires` **clean** kaynağı verir (gömülü PNG doku, sıkıştırmasız).
  - **Dev ekip:** `-vr` türevini + KTX2/Draco sıkıştırmayı çıkarır (deterministik
    tooling, kodda tekrarlanabilir).
  - KTX2Loader + DRACOLoader motora eklenene kadar bu sınır geçerli.

### 4.4 Sosyal varlık iskeleti

- **Göz kemikleri** ekle: `LeftEye` / `RightEye`, Head altına parent. *Mixamo
  bunları eklemez → Blender'da elle eklenir.*
- **Parmak kemiklerini SİLME** (VR el-takibi). → BÖLÜM 1.3'teki "parmak serbest"
  notu **VR için geçersiz**; burada parmak kemikleri zorunlu.
- Simetrik, temiz **joint orientation** (IK / full-body için).
- **Humanoid-mappable** kal (VRM / Unity humanoid eşlemesi bozulmasın).

### 4.5 Yüz ifadeleri (ARKit blendshape)

- Morph hedeflerini **ARKit 52 blendshape isimleriyle** ver.
- **Faz A minimum 5:** `eyeBlinkLeft`, `eyeBlinkRight`, `jawOpen`,
  `mouthSmileLeft`, `mouthSmileRight`.
- İsimler **harfiyen** ARKit olmalı — lip-sync + cross-platform eşleşme buna bağlı.
- *Not: bugünkü web motoru morph'ları yüz **sculpt slider**'ı için okuyor
  (`lib/face/morph-targets.ts`); ARKit **ifade animasyonu** VR/lip-sync fazında
  açılacak. Blendshape'leri yine de şimdi ver — geleceğe hazır.*

### 4.6 Canlılık (spring-bone)

- Saç/etek için **spring-bone zinciri** bırak (`Hair_01 → Hair_02 → Hair_03`).
  VR'da statik saç ölü görünür.
- GLB **yalnızca kemik zincirini** taşır; spring **fiziği** runtime/VRM'de
  uygulanır — fiziği GLB'ye gömmeye çalışma.

### 4.7 First-person

- Ayaklar kesin **Y=0**, gerçek **metre** boy.
- **Kafa ayrı material slot** — first-person'da gizlenebilsin.

### 4.8 VRM 1.0 köprüsü

Yukarıdakiler (göz/parmak kemiği, ARKit blendshape, humanoid joint, spring-bone)
yapılırsa **VRM 1.0** (metaverse standardı) neredeyse bedava gelir. Şimdilik
**GLB birincil**, VRM "yarına hazır" tutulur.

### 4.9 Faz A teslim paketi (VR-grade — güncel)

BÖLÜM 3.7'nin VR-grade güncel hâli (çelişki olursa bu kazanır):

1. `caelinus-body-base-fem.glb` — kadın kanonik base: Mixamo rig + **göz +
   parmak kemiği**, PBR, **ARKit blendshape-ready**, `-hires` ≤ 60k.
2. `-vr` light türevi (≤ 25k) — **veya** clean kaynağı ver, dev çıkarır (bkz. 4.3).
3. `caelinus-catwalk.glb` — rig uyumlu **In-Place** catwalk.
4. 1 örnek `hair-*.glb` — Head-bind + **spring-bone zinciri**.
5. Teslim notu: poly sayısı · araçlar · ARKit blendshape listesi · göz/parmak
   kemiği durumu · bilinen sınırlar.

**Doğrulama:** donmccurdy gltf-viewer, **yakın kamera** (VR mesafesi) — yüz/saç
yakında dağılmıyor mu, tris/draw-call bütçede mi.

### 4.10 VR kabul kriterleri (BÖLÜM 3.5'e ek)

- [x] `-hires` ≤ 60k tris (`-vr` ≤ 25k — dev türetir) — **28.2k tris** ✓
- [x] Göz kemikleri (`LeftEye` / `RightEye`) mevcut — `mixamorig:LeftEye/RightEye`, gerçek gözbebeği geometrisiyle ✓
- [x] Parmak kemikleri korunmuş (silinmemiş) — el/parmak bone'ları tam ✓
- [x] ARKit blendshape min 5, isimler harfiyen doğru — 52 blendshape, min-5 birebir ✓
- [x] Saç tek mesh + tek atlas + spring-bone zinciri — `hair-long-wave.glb` (1 mesh, 1024² atlas, `Hair_01→02→03`) ✓
- [~] Kafa ayrı material slot — **göz** ayrı slot (`Caelinus.eye`); kafa/yüz hâlâ gövde materyalinde (Faz B: yüz ayrı slot)
- [x] Doku ≤ 1024²'ye ölçeklenebilir kaynak — 2048² kaynak, 1024'e indirgenebilir ✓
- [x] Humanoid-mappable joint orientation — Mixamo standart rig ✓

---

## EK — Hızlı referanslar (Şeyma için)

- **Doğrulama viewer:** https://gltf-viewer.donmccurdy.com
- **Mixamo:** https://www.mixamo.com (mesh yükle → auto-rig → animasyon indir, "In Place" işaretle)
- **gltf-transform:** `npm i -g @gltf-transform/cli` → `gltf-transform inspect file.glb`
- **Renk paleti (Bible §2 ile senkron):** siyah `#03060f` · gece yarısı `#0b1530` · altın `#d4b78a` · yumuşak altın `#ffe9b8` · fildişi `#f4ecd8` · ay gümüşü `#c9d4e6`
- **Estetik dili:** lüks-fütüristik, kutsal dişil + podyum + AI hologram havası
