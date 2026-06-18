# Faz B — Durum ve Kalan İşler

> **Güncelleme:** 2026-06-18 (akşam) · **Branch:** `main` · **Sahip:** Şeyma Karaş + Claude
> **Önceki faz:** Faz A (VR-grade base) tamamlandı — bkz. `faz-a-devam-plani.md`
> **Bu dosya:** Faz B'nin (Saç & Yüz) güncel durumu + sıradaki işler tek yerde.

---

## 0) Şu ana kadar TAMAMLANAN (kanıtlı)

| İş | PR | Kanıt |
|---|---|---|
| **C4 gövde baseline** — yeniden yoğruldu, yüz onarımı (0.000m), tam simetri (0.000mm), bacak kemiği ortalama (0.0003mm), boy 1.690m | [#4](https://github.com/CaelinusAl/Caelinus-World/pull/4) | `validate-avatar.js` KAPI AÇIK · 28.2k tris · ARKit-52 |
| **Saç runtime-bind** — ayrı GLB, `mixamorigHead` kemiğine rigid attach, kafa/animasyon hareketini takip eder; binary-alpha → alpha-cutout material | [#5](https://github.com/CaelinusAl/Caelinus-World/pull/5) | Canlı: `✓ saç bind edildi → mixamorigHead`, görünür uzun saç |
| **`-vr` light türevi** — `caelinus-body-base-fem-vr.glb` (4.57 MB, 23.1k tris, ARKit-52 + göz/parmak bone korundu) | 6fd0739 | Khronos validator 0 hata · three.js yükleme ✓ · bkz. `avatar-vr-derivative-teslim-notu.md` |
| **Ten rengi (skin tone) artık çalışıyor** — Ivory→Caramel→Espresso gerçek zamanlı gövdeye uygulanıyor; saç/göz korunuyor | bu oturum | Canlı: `[ModelAvatar] skin tone applied (#…) to 1 mesh(es)` + görsel QA |
| **Kıyafet giydirme çalışıyor** — ürün kartına tıkla → bedene bind; avatar açılışta giyinik (varsayılan ilk 3D kıyafet) | bu oturum | Canlı: `[OutfitBinding] ✅ loaded …glb` + "OUTFIT ACTIVE" |

### Bu oturumda (2026-06-18 akşam) yapılan kod değişiklikleri
- **`components/shop/ModelAvatar.tsx`** — Ten rengi (Codex başlattı) + benim temizliğim:
  Kırılgan `skinnedMeshes >= 3` "external avatar" tahmini KALDIRILDI (saç 3. skinned
  mesh olunca ten-tonu yolu yanlışlıkla atlanıyordu). Yerine kayıt-tabanlı kesin karar.
- **`lib/avatar-bodies.ts`** — `BodyEntry.pipeline: "caelinus"|"external"` alanı +
  `isCaelinusBodyUrl()` helper. Selin = `pipeline: "caelinus"`, `supportsSkinToneOverride: true`.
  → Mesh sayma yerine açık işaret; saç/kıyafet/takı eklendikçe sınıflandırma BOZULMAZ.
- **`app/universe/shop/avatar/page.tsx`** — açılışta avatar giyinik gelsin diye, seçili
  ürün görünür kategoride 3D kıyafeti olan ilk ürüne düşer (hardcode yok).
- **`data/products.ts`** — `aries.glb` BOZUK (zstd-blend, geçerli GLB değil) → b1 bağlaması
  yorumlandı (önizleme-only). Düzgün GLB export edilince satır geri açılır.

**Mimari kazanım:** Saç artık **değiştirilebilir aksesuar** — body GLB'ye gömülü değil.
`lib/avatar-bodies.ts` içindeki `hairUrl` alanı + `getHairUrlForModelUrl` helper ile
tek kaynaktan çözülüyor; yeni saç eklemek = yeni `hair-*.glb` + registry satırı.

---

## 1) KALAN İŞLER (öncelik sırasıyla)

### B1 — Saç sanat kalitesi (düşük efor, görünür kazanç)
- **Sorun:** Mevcut `hair-long-wave.glb` ön tarafında birkaç dağınık tel var (kaynak mesh UV'si).
- **Yapılacak:** Blender'da saç kartlarının ön-saç UV/dağılımını temizle, yeniden export.
- **Kapı:** Yakın kamera (VR mesafesi) — saç teli yüze taşmıyor, hacim doğal.

### B2 — Saç seti genişletme (modülerlik)
- **Yapılacak:** 2–3 yeni stil (`hair-short-bob.glb`, `hair-updo.glb`, …) — hepsi `Head`-bind + tek atlas + spring zinciri.
- **UI:** Configurator'a saç seçici ekle (registry'de `hairOptions[]` deseni).
- **Kapı:** Her stil runtime-bind ile kafaya oturuyor, ≤1 draw call, sıkıştırma yok.

### B3 — Spring-bone fiziği (canlılık) [runtime]
- **Durum:** GLB'ler spring zincirini (`Hair_Root→01→02→03`) zaten taşıyor; **runtime fiziği yok** (şu an rijit).
- **Yapılacak:** `ModelAvatar`'da hafif spring çözücü (yürürken/dönerken saç salınımı). VRM-style secondary motion.
- **Kapı:** Catwalk'ta saç doğal sallanıyor, jitter/patlamıyor.

### B4 — Yüz ayrı material slot
- **Durum:** Göz ayrı slot (`Caelinus.eye`) ✓; kafa/yüz hâlâ gövde materyalinde.
- **Yapılacak:** Yüz bölgesini ayrı material slot'a ayır (Blender) — ileride yüz dokusu / selfie projeksiyonu altyapısı.
- **Kapı:** `validate-avatar.js` KAPI AÇIK kalır, ten-tonu slider'ı yüzü bozmaz.

### B5 — Yüz/büst/kalça morph hedefleri (ARKit dışı)
- **Yapılacak:** Base'e gövde/yüz şekil morph'ları ekle (slider'lar bone-scale yerine gerçek morph hedeflerini sürsün — daha temiz deformasyon).
- **Kapı:** Configurator slider'ları morph üzerinden, anatomik bozulma yok.

### B6 — `-vr` light türevi (≤25k tris) ✅ TAMAMLANDI
- `caelinus-body-base-fem-vr.glb` üretildi (4.57 MB, 23.1k tris, 1024² doku, ARKit-52 +
  göz/parmak bone korundu). Khronos validator 0 hata, three.js yükleme ✓.
- Üretim scriptli/deterministik: `_work/vr-build/build-vr.mjs`. Detay: `avatar-vr-derivative-teslim-notu.md`.
- **Not:** Henüz UI'a bağlanmadı (ayrı varlık dosyası). Cihaz-bazlı LOD seçimi Faz E'de.

---

## 1.5) YARIN (2026-06-19) — ÖNCELİK: Kıyafet oturması (Faz C ön-iş)

> **Bağlam:** Giydirme çalışıyor (7 burç kıyafeti bind oluyor) AMA **kıyafet tam oturmuyor.**

- **Kök neden:** Meshy kıyafet GLB'leri **rijit (static) mesh** — bedenin iskeletine
  skin'lenmemiş. `OutfitBindingLayer` onları tek kemiğe (Hips) yapıştırıp tek oranla
  (~boyun %42'si) ölçekliyor, bbox merkezini kalçaya hizalıyor. Sonuç: pozu (catwalk)
  takip edemiyor, üst/alt parça tek noktadan asılı → sarong bacakta uçuşuyor.
- **Seçenekler (Şeyma karar verecek):**
  - **A. Yeniden rig'le (doğru/kalıcı):** Her kıyafeti Blender'da aynı Mixamo iskeletine
    skin'le → bedenle deforme olur, tam oturur. 3D iş, kıyafet başına emek.
  - **B. Elle ince ayar (hızlı):** Her kıyafet için `OutfitTransformTuner` ile
    position/rotation/scale/`targetFraction` offset'i tek tek ayarla. Daha iyi durur ama
    rijit kalır, pozu takip etmez.
  - **C. Pozu sabitle (en küçük):** Try-on sırasında catwalk yerine düz A-poz → rijit
    kıyafet daha düzgün hizalanır.
- **Ayrıca:** `public/models/Meshy_Al/aries.glb` BOZUK (zstd-sıkıştırılmış .blend, geçerli
  GLB değil; kurtarılabilir kopya yok). Aries'in orijinal 3D kaynağından düzgün GLB
  export edilmeli; sonra `data/products.ts`'te b1 satırı geri açılır.

---

## 2) SONRAKİ FAZLAR (Faz B sonrası — referans)

| Faz | Hedef | Not |
|---|---|---|
| **Faz A (erkek)** | `caelinus-body-base-masc.glb` | Kadın baseline'ın erkek karşılığı |
| **Faz C — Kıyafet** | 12 burç kıyafeti, ortak bind iskeleti | `outfits/<zodiac>.glb` |
| **Faz D — Animasyon** | Özel In-Place catwalk + 4–6 jest | `anim/*.glb` |
| **Faz E — Fotorealizm** | PBR yükseltme + LOD (mobil/masaüstü) | `-hires`/`-light` |

---

## 3) DEĞİŞMEZ KURALLAR (her teslimde hatırla)

1. **Sıkıştırma YASAK** (`-hires`): Draco/KTX2/Meshopt verme — motorda decoder yok.
2. **Tek armature** (body), saç kendi rig'iyle ayrı GLB — runtime'da `Head`'e bind edilir.
3. **In-place anim** — Hips dünya konumu 0.
4. **Embedded doku** — harici `.png` referansı 404.
5. **Stabil id** — `selin-v1` localStorage'a yazılıyor, DEĞİŞTİRME.
6. **Her export sonrası** `node _tools/validate-avatar.js <file.glb>` — KAPI AÇIK olmadan teslim yok.
7. **Görsel değişiklik** → Şeyma QA onayı olmadan main'e merge etme.

---

## 4) BİLİNEN YAN NOTLAR

- **Yerel dependency senkronu:** `@react-three/xr` (VR sayfası) bir noktada yerel `node_modules`'den düşmüştü; `npm install` ile çözüldü (CI zaten `package.json`'dan kuruyor). VR çalışması `faz-a-vr-kontrat` branch'inin kapsamında.
