# Teslim Notu — `caelinus-body-base-fem-vr.glb` (Faz A · VR-grade türev)

> Kaynak `caelinus-body-base-fem.glb` baz alınarak üretilen VR/XR-hedefli light türev.
> BÖLÜM 4 (VR/XR) kabul kriterlerine göre hazırlandı. Üretim **deterministik / scriptli** —
> aynı kaynaktan tekrar üretilebilir (`_work/vr-build/build-vr.mjs`).

## Dosya
- **Yol:** `public/models/caelinus-body-base-fem-vr.glb`
- **Boyut:** 4.57 MB (≤ 5 MB ✓)

## Poligon
- **Üçgen:** 23.118 tris (≤ 25k ✓) — kaynak 28.196'dan düşürüldü
- **Vertex:** 12.673
- **Draw call:** 2 (gövde + göz; gövde tek atlas, göz ayrı materyal — "ideal 1"e göre 2)

## Korunan (kaynakla birebir, doğrulandı)
- **Mixamo rig** — 54 kemik, `mixamorig:` isimleri
- **Göz kemikleri** — `mixamorig:LeftEye`, `mixamorig:RightEye` ✓
- **Parmak kemikleri** — 30 (VR el-takibi için silinmedi) ✓
- **Head bone** ✓ (kafa ayrı materyal/gizlenebilir mantığına uygun)
- **Skinning** — `JOINTS_0` + `WEIGHTS_0` korundu, 1 skin
- **ARKit 52 blendshape** — 2 primitive'de de 52 morph target korundu ✓
- **Y-up + metre ölçek** — ayaklar Y=0, boy ≈ 1.69 m (first-person ayak hizası ✓)
- **Embedded PBR** + `KHR_materials_clearcoat` korundu

## Doku
- Gövde (`Young_Female_Hairless`): 2048² → **1024²**, PNG (materyal `BLEND` olduğu için alpha-güvenli PNG bırakıldı)
- Göz (`caelinus-eye`): 256² (değişmedi), JPEG q85
- Hepsi ≤ 1024² ✓

## ARKit 52 blendshape listesi
browDownLeft, browDownRight, browInnerUp, browOuterUpLeft, browOuterUpRight,
cheekPuff, cheekSquintLeft, cheekSquintRight, eyeBlinkLeft, eyeBlinkRight,
eyeLookDownLeft, eyeLookDownRight, eyeLookInLeft, eyeLookInRight, eyeLookOutLeft,
eyeLookOutRight, eyeLookUpLeft, eyeLookUpRight, eyeSquintLeft, eyeSquintRight,
eyeWideLeft, eyeWideRight, jawForward, jawLeft, jawOpen, jawRight, mouthClose,
mouthDimpleLeft, mouthDimpleRight, mouthFrownLeft, mouthFrownRight, mouthFunnel,
mouthLeft, mouthLowerDownLeft, mouthLowerDownRight, mouthPressLeft, mouthPressRight,
mouthPucker, mouthRight, mouthRollLower, mouthRollUpper, mouthShrugLower,
mouthShrugUpper, mouthSmileLeft, mouthSmileRight, mouthStretchLeft, mouthStretchRight,
mouthUpperUpLeft, mouthUpperUpRight, noseSneerLeft, noseSneerRight, tongueOut

## Araçlar
- **glTF-Transform v4** (`dedup` → `weld` → `simplify` → `prune`)
- **meshoptimizer** — simplify (skinning + morph target korumalı, `lockBorder: true`, error 0.008)
- **jimp** — doku yeniden boyutlandırma + JPEG/PNG kodlama (saf-JS; Windows'ta `sharp` native binary yüklenmediği için tercih edildi)
- Parametreler: `ratio 0.82`, `error 0.008`, `maxTex 1024`

## Sıkıştırma notu (bilerek uygulanmadı)
- **Draco / meshopt / KTX2 YOK.** Mevcut motor düz `GLTFLoader` kullanıyor; decoder
  (DRACOLoader/MeshoptDecoder/KTX2Loader) henüz bağlı değil. Bu yüzden türev
  **decoder'sız her yerde hatasız** yüklenir. Motora decoder eklenince geometri Draco/meshopt
  + doku KTX2/Basis ile ~1–2 MB'a daha indirilebilir.

## Doğrulama
- **Khronos glTF-Validator 2.0:** **0 hata**, 1 uyarı (`NODE_SKINNED_MESH_NON_ROOT`)
  — bu uyarı **kaynak dosyada da aynen var**, türevle gelen yeni bir sorun değil; skinned
  mesh'lerde standart ve render'a etkisi yok.
- **Gerçek motor (three.js GLTFLoader) yükleme testi:** başarılı — 2 skinned mesh,
  54 kemik, göz+parmak kemikleri, 52 erişilebilir morph (tetiklenip render edildi).
- **Görsel:** yakın kamera (VR mesafesi) ile gövde/oran/ten dokusu temiz.

## Ayrı not (VR görevinin kapsamı dışında)
Hem kaynak `*-fem.glb` hem türev, ağız/dudak bölgesinde aynı doku/geometri artefaktını
(koyu leke) gösteriyor. Bu **kaynak modelin authoring sorunu** — simplify'ın yarattığı
bir hata değil (yan yana kıyaslandı). Düzeltme kaynakta yapılmalı; düzeltilen kaynaktan
bu script ile türev birebir yeniden üretilebilir.
