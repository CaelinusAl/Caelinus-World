# Caelinus Avatar — Asset Üretim Brief'i (A1 · A2 · Faz 4)

> Kıdemli mühendis notu: Kod tarafı bu üç iş için **hazır ve doğru kuruldu**.
> Geriye yalnızca **binary 3D asset üretimi** kaldı (Blender/Meshy/Mixamo).
> Bu dosya, üretilecek dosyaların kesin sözleşmesidir — bir asset bu
> spesifikasyona uyduğunda kod onu otomatik tanır.

Doğrulama kapısı her teslimde çalıştırılır:
```bash
node _tools/validate-avatar.js <dosya>.glb   # 0 hata bekleriz
```

---

## A1 — Eksik burç bikinileri (5 GLB)

Konum: `public/models/Meshy_Al/<burç>.glb` · Bağlama: `data/products.ts` → `OUTFIT_GLB_MAP`

| Ürün | Burç | Durum | Referans görsel |
|------|------|-------|-----------------|
| b1  | aries       | ⛔ **bozuk** — dosya zstd-sıkıştırılmış, GLB değil (`28 b5 2f fd`). Yeniden export şart. | `public/play/shop/aries-look.jpg` |
| b2  | taurus      | ❌ yok | `public/play/shop/taurus-look.jpg` |
| b5  | leo         | ❌ yok | `public/play/shop/leo-look.jpg` |
| b9  | sagittarius | ❌ yok | `public/play/shop/sagittarius-look.jpg` |
| b11 | aquarius    | ❌ yok | `public/play/shop/aquarius-look.jpg` |

**Kontrat (mevcut çalışan GLB'lerle aynı):**
- Geçerli GLB 2.0 (`glTF` magic), **sıkıştırma YOK** (düz GLTFLoader okur).
- Gömülü PBR texture, ≤2048px. Boyut: hires ≤25 MB.
- Mevcut bağlı GLB'lerle (gemini/cancer/virgo…) tutarlı ölçek ve yön.

**Teslim sonrası kod adımı** (her dosya için bir satır):
```ts
// data/products.ts içindeki OUTFIT_GLB_MAP'e ekle:
b1:  mergeOutfitBinding("bikini", "/models/Meshy_Al/aries.glb"),
b2:  mergeOutfitBinding("bikini", "/models/Meshy_Al/taurus.glb"),
b5:  mergeOutfitBinding("bikini", "/models/Meshy_Al/leo.glb"),
b9:  mergeOutfitBinding("bikini", "/models/Meshy_Al/sagittarius.glb"),
b11: mergeOutfitBinding("bikini", "/models/Meshy_Al/aquarius.glb"),
```
Kabul: validate 0 hata + selin-v1 ve muse bedenlerinde clipping/uçuşma yok.

---

## A2 — Yüz kimlik shape-key'leri (base body)

Konum: `public/models/caelinus-body-base-fem.glb` (mesh adı: `base`)

**Mevcut durum:** Gövdede 52 ARKit **ifade** blendshape'i var (blink, jawOpen,
smile, browUp…) — bunlar konuşma/ifade için doğru. Ama **kimlik (şekil) morph'u
SIFIR**. Kod artık ARKit ifadelerini kimlik için kullanmıyor; aşağıdaki 8
shape-key eklenene kadar yüz kişiselleştirme head-bone fallback (kaba) ile çalışır.

**Eklenecek 8 kimlik shape-key'i** (Blender'da `base` mesh'ine, isimler birebir):

| Shape-key adı | Etkisi (1.0 = nötr; key %100'de aşağıdaki uç) |
|---------------|-----------------------------------------------|
| `idJawWidth`   | Çene **genişler** |
| `idChinLength` | Çene **uzar** (Y ekseni aşağı) |
| `idEyeSpacing` | Gözler **birbirinden uzaklaşır** |
| `idEyeSize`    | Gözler **büyür** |
| `idNoseWidth`  | Burun **genişler** |
| `idMouthWidth` | Ağız **genişler** (gülümseme DEĞİL — sadece genişlik) |
| `idForehead`   | Alın **yükselir/genişler** |
| `idHeadWidth`  | Kafa **genişler** |

**Sözleşme notları:**
- İsimlendirme birebir bu kamelCase (`id` + PascalCase). Kod `^id[A-Z]` ile
  ayırt eder; ARKit isimleri küçük harfle başladığı için çakışmaz.
- Her shape-key **tek eksende mantıklı, simetrik** bir deformasyon olmalı;
  uç değer doğal sınırda kalmalı (uncanny olmasın).
- Shape-key eklenince export'ta `extras.targetNames` listesine yazılmalı
  (Blender glTF exporter bunu otomatik yapar).

**Ek temizlik (validate WARN):** Export'ta `mixamorig:` bone prefix'ini temizle
— 54 bone hâlâ prefix taşıyor, retarget'ı bozma riski var.

Kabul: GLB yüklendiğinde `[ModelInspector] strategy=morph-targets`; 8 slider
doğal ve doğru eksende deforme ediyor; ifade morph'ları tetiklenmiyor.

---

## Faz 4 — Jest animasyonları (Mixamo klipleri)

Konum: `public/models/gestures/<jest>.glb` · Registry: `lib/avatar-gestures.ts`

| Jest | Dosya | Durum | Mixamo kaynağı (öneri) |
|------|-------|-------|------------------------|
| idle    | (gömülü + useFrame) | ✅ hazır | — |
| catwalk | `caelinus-catwalk.glb` | ✅ hazır | — |
| turn    | `gestures/turn.glb` | ❌ yok | "Turn" / "Standing Turn" |
| pose    | `gestures/pose.glb` | ❌ yok | "Idle" / fashion pose |
| wave    | `gestures/wave.glb` | ❌ yok | "Waving" |

**Kontrat:**
- Mixamo'dan **"In Place"** seçeneğiyle indir (kök locomotion baked olmasın).
- Mixamo standart bone isimleri; export'ta `mixamorig:` prefix temizle.
- ~1–3 sn, ≤150 KB. Tek armature, Y-up, metre.

**Teslim sonrası kod adımı:** `lib/avatar-gestures.ts` içinde ilgili entry'de
`status: "available"` yap ve `url`'i ver (örn. `/models/gestures/wave.glb`).
ModelAvatar `animationUrl` üzerinden retarget edip oynatır.

Kabul: jest seçildiğinde kök drift yok, retarget bone uyumu tam, döngü pürüzsüz.

---

## İptal — Faz 3 (erkek beden)

Şimdilik **kapsam dışı**. `BodyGender` union'ından `masculine` kaldırıldı.
Yeniden ele alınırsa: union'a geri ekle + erkek base body GLB'sini
`CAELINUS_BODY_LIBRARY`'ye kaydet (feminine ile aynı kontrat).
