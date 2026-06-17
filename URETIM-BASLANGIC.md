# Caelinus — Faz A Avatar Üretim Devir Dosyası (Şeyma)

> Bu dosya **yeni bir session açtığında** ilk okutacağın hafıza. Amaç: VR-grade
> avatar GLB paketini sıfır kafa karışıklığıyla üretmek. Tüm teknik gerçekler
> repodan **doğrulandı** (varsayım yok).

---

## 0) Tek Bakışta Durum

| Eksen | Durum |
|---|---|
| Sözleşme / spec | ✅ PR #1 ile `docs/avatar-system-and-sema-brief.md` BÖLÜM 4 (VR/XR) + palet Bible §2 senkronu gönderildi |
| Motor gerçeği | ⚠️ `ModelAvatar.tsx` düz `GLTFLoader` — **KTX2/DRACO/Meshopt loader YOK** → sıkıştırılmış GLB render OLMAZ |
| Beden kütüphanesi | `CAELINUS_BODY_LIBRARY = []` → `AVATARS_IN_PRODUCTION = true` (UI "yapımda" gösteriyor) |
| Senin görevin | Faz A paketini **temiz `-hires` GLB** olarak üret; `-vr`/sıkıştırma türevini geliştirici alır |
| Koordinasyon | Biz→müşteri: PR/Issue (GitHub bildirir). Müşteri→biz: `commits/main.atom` feed + her session başı `git fetch` |

---

## 0.5) CANLI İLERLEME (Blender içinde yapıldı — 2026-06-17)

Çalışma dosyası: **`_work/caelinus-body-base-fem.blend`** (Blender 4.5.9 + MPFB 2.0.16).

| Pipeline adımı | Durum | Not |
|---|---|---|
| MPFB kurulu + ARKit `faceunits01` pack kurulu | ✅ | pack: `files2.makehumancommunity.org/functional/faceunits01.zip` |
| [1] Base mesh (feminen, ~1.695 m) | ✅ | `Human` mesh, 19.158 vert / 18.486 poly (~37k tris) |
| [3] Rig — Mixamo isimleri | ✅ | `Human.rig`, 52 bone, `mixamorig:` ön ekli, çekirdek 12 tam, skinli (19158/19158 weight) |
| [4] ARKit blendshape (52 adet, **düz** isim) | ✅ | min-5 dahil hepsi birebir: `eyeBlinkLeft/Right`, `jawOpen`, `mouthSmileLeft/Right` |
| [2] Skin material / texture | ⏳ | şu an gri default — PBR skin gerek |
| BAKE uyarısı | ⚠️ | 10 adet `$md-` modelleme key'i değeri ≠0 (feminen şekli taşıyor) → export'tan ÖNCE basis'e bake et, yoksa beden nötre döner |
| [5] Apply transforms / [6] Export / [7] Validate / [8] Repo | ⏳ | sırada |

**Motor doğrulaması (kanıt):** `mixamorig:` ön eki sorun değil — `components/shop/ModelAvatar.tsx` deform regex'i (`/hip/`, `/spine/`…) küçük-harf substring; catwalk retarget'ı `stripMixamo = s.replace(/^mixamorig[:_]?/i,"")` ile üç convention'ı da normalize ediyor. Yani prefix korunabilir, `catwalk.glb` ile birebir uyumlu.

## 1) GLB Sözleşmesi (repodan doğrulandı — `lib/avatar-bodies.ts`)

Her teslim edilen mesh ŞU kurallara uymalı, yoksa try-on/catwalk kırılır:

- **Rig:** Mixamo standart bone isimleri — `Hips, Spine, Spine1, Spine2, Neck, Head, LeftArm, RightArm, LeftForeArm, ...`. Outfit binding + catwalk retarget bunlara dayalı.
- **Skeleton:** Tek skeleton, multi-mesh OK (Body + Head + Hair ayrı mesh, aynı armature).
- **Eksen / ölçek:** Y-up, **metre** ölçek, root scale `[1,1,1]` (transform apply edilmiş), boy ~1.70 m.
- **Materyal:** Gömülü PBR (metallic-roughness). Skin tone slider dış mesh'te no-op → rengi mesh'in kendi materyali taşır.
- **Animasyon:** In-place (kök yer değiştirmesi yok), Mixamo uyumlu.

## 2) Faz A Teslim Paketi

| Dosya | İçerik | Bütçe | Kim üretir |
|---|---|---|---|
| `caelinus-body-base-fem.glb` | Feminen base body + head, riglenmiş, ARKit blendshape (min 5) | `-hires` ≤60k tris, ≤2K texture | **Şeyma** |
| `caelinus-body-base-fem-vr.glb` | Aynı meshin VR türevi | `-vr` ≤25k tris, ≤1024² texture, ≤5MB, ~1 draw call | **Geliştirici** (decimate + KTX2/Draco) |
| `caelinus-catwalk.glb` | In-place catwalk animasyonu (sadece anim, opsiyonel aynı rig) | — | **Şeyma** |
| `hair-*.glb` | Saç kartları/mesh, tek atlas | ≤1 draw call | **Şeyma** |

**ARKit blendshape — min 5 (isimler TAM bu string olmalı):**
`eyeBlinkLeft`, `eyeBlinkRight`, `jawOpen`, `mouthSmileLeft`, `mouthSmileRight`.

## 3) Üretim Pipeline (Blender → GLB)

```
[1] Base mesh        → feminen vücut + kafa, temiz quad topology, kapalı manifold
[2] UV + Texture     → tek UV atlas; PBR (baseColor/normal/roughness); kafa ayrı material slot (first-person)
[3] Rig              → Mixamo bone isimleri; göz + parmak bone'ları dahil; weight paint
[4] Blendshape       → ARKit min 5 shape key, isimler birebir
[5] Apply transforms → scale [1,1,1], rotation 0, Y-up, metre
[6] Export glTF 2.0  → +Y up, "Apply Modifiers", "Include: Selected", embed textures
[7] Validate         → gltf-transform inspect + Khronos validator (0 error)
[8] Repo entegrasyon → /public/models/ + BodyEntry + manifest.json + PR
```

## 4) Doğrulama Kapısı (teslim ÖNCESİ — hepsi yeşil olmalı)

- [ ] `gltf-transform inspect` → tris ≤ bütçe, texture ≤ bütçe, tek skeleton
- [ ] Bone isimleri Mixamo standardı (Hips/Spine/Neck/Head…)
- [ ] Blendshape isimleri: eyeBlinkLeft/Right, jawOpen, mouthSmileLeft/Right
- [ ] Scale [1,1,1], Y-up, boy ~1.70 m
- [ ] Khronos glTF Validator → **0 error** (warning kabul)
- [ ] `-hires` SIKIŞTIRMASIZ (KTX2/Draco YOK — motor okuyamaz)
- [ ] Three.js test sahnesinde render + catwalk oynuyor

## 5) Repo Entegrasyon Adımları (GLB hazır olunca)

1. `git checkout main && git pull --ff-only`  (taze başla)
2. `git checkout -b faz-a-avatar-glb`
3. GLB'leri `/public/models/` altına koy
4. `lib/avatar-bodies.ts` → `CAELINUS_BODY_LIBRARY`'ye `BodyEntry` ekle (id stabil, asla değişmez)
5. `public/avatars/manifest.json`'a yansıt
6. `git add -A && git commit && git push && gh pr create` → müşteriye otomatik bildirim

## 6) Koordinasyon / Haberdarlık

- **Açık PR:** https://github.com/CaelinusAl/Caelinus-World/pull/1
- **Müşterinin commit'lerini yakala:** RSS okuyucuna ekle →
  `https://github.com/CaelinusAl/Caelinus-World/commits/main.atom`
- **Her session başı:** Claude'a "git fetch yap, müşteri ne push'lamış özetle" de.
- **Biz→müşteri:** her iş PR/Issue olarak gider (Watch → All Activity ile görür).

---

## EK — Kıdemli Mühendislik Notları (tuzaklar)

1. **Sıkıştırma tuzağı:** `-hires`'ı asla KTX2/Draco ile verme — motorda decoder yok, ekran boş gelir. Sıkıştırmayı geliştirici `-vr` türevinde yapar.
2. **Topology:** Eklem bölgelerinde (dirsek/diz/omuz) yeterli edge loop → deform temiz. N-gon yok, üçgenleştirmeyi export'a bırak.
3. **first-person:** Kafa ayrı material slot → VR'da baş gizleme (head-hiding) mümkün olsun.
4. **In-place anim:** Catwalk'ta Hips'in dünya yer değiştirmesi 0; ilerlemeyi motor sürer, yoksa avatar sahneden kayar.
5. **Stabil id:** `BodyEntry.id` localStorage'a yazılır — bir kez koyunca DEĞİŞTİRME.
6. **Naming = sözleşme:** Tek bir yanlış bone ismi (`mixamorig:Hips` vs `Hips`) retarget'ı bozar; export ayarında prefix'i temizle.
