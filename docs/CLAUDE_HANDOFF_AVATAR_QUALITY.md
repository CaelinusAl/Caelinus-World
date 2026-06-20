# Caelinus — Avatar/Manken Kalite Çalışması — HANDOFF & PLAN

> **Amaç:** Context temizlendikten sonra (veya yeni oturumda) bu workstream'i
> **sıfır bilgi kaybıyla** sürdürmek. Bu doküman kendi kendine yeter.
> Son güncelleme: 2026-06-20 oturumu sonu.

---

## 0) Ürün hedefi (değişmez)
"Hatasız, oyun gibi güçlü **VR gözlük 3D** deneyimi." Avatar = dijital manken;
üstünde gerçek satılan **bikini/mayo ürünleri** sergilenir. Pipeline:
**MakeHuman → Mixamo → Blender → export → web 3D / VR (Next.js + R3F + WebXR).**

---

## 1) Kilitli STRATEJİK kararlar (kullanıcı = Şeyma onayladı)
1. **Beden = tek kanonik standart.** Bikiniler bedene uyarlanır; beden bikiniye göre
   yeniden yoğrulmaz. (Sebep: 1 beden, çok kıyafet; rig+animasyon+yüz bedene bağlı.)
2. **Ürün (bikini tasarımı) DEĞİŞMEZ.** Sadece display-prep (ölçek/konum/dikiş) yapılır.
3. **"Az ama kaliteli":** 8 orta-kalite yerine 2-3 kusursuz parça hedefi.
4. **Sıfırdan MakeHuman'a DÖNÜLMEZ** — mevcut beden zaten MPFB çıktısı; rig + 52 ARKit
   shape silinmesin. Düzeltmeler Blender'da mevcut beden üzerinde yapılır.
5. **Deploy YOK, main'e merge YOK** (QA onayı olmadan). Çalışma branch: `feat/avatar-shop-game-experience`.

## 2) Değişmez TEKNİK kurallar
- **SIKIŞTIRMA YASAK** (Draco/KTX2/Meshopt) — motorda decoder yok, ekran boşalır.
- Tek armature; in-place animasyon (Hips=0); **embedded texture** (harici .png 404).
- `selin-v1` body id'si DEĞİŞMEZ. Her export sonrası mümkünse `validate-avatar.js`.
- **PowerShell deny kuralı var** — powershell.exe'yi Bash üzerinden çağırma (bypass sayılır).
  Silme/temizlik için kullanıcıya Explorer'da manuel yaptır ya da Bash `rmdir` (boş klasör).

---

## 3) FAZ 1 — Kök teşhis (3 agent + Blender + web ile KANITLANDI)
| Varlık | Durum | Kanıt |
|---|---|---|
| **Beden** `caelinus-body-base-fem.glb` | ✅ SAĞLIKLI | 28.196 tri, **54 mixamo bone**, **52 ARKit shape**, 54 vgroup, skin texture (`Young_Female_Hairless`) |
| Beden oranı | ✅ Normal | Kalça→yer **%53.3** (model/manken aralığı, kısa değil) |
| **Saç** `hair/hair-long-wave.glb` | ⚠️ Düşük kalite | 984 tri, normal-map yok, ayrı 4-bone (body skeleton paylaşmıyor). `_work/hair-cards-NEW.glb` doğru yön ama texture'sız yarım |
| **Bikiniler** `Meshy_Al/*.glb` | 🔴 BOZUK HAT | **STATİK** (skin yok, body skeleton paylaşmıyor), **286k–730k tri** (10-26× ağır), çoğu **texture'sız**, bedenin derinlik profiline uymuyor |
| `Meshy_Al/aries.glb` | 🔴 DOSYA BOZUK | zstd-sıkıştırılmış, GLB değil — yüklenmiyor, yeniden export şart |
| `model/catwalk.glb` | 🗑️ Ölü duplike | Kod referansı YOK (`caelinus-catwalk.glb` kullanılıyor). Silme adayı (raporlu) |

**Tek cümle:** Beden pipeline'ı doğru. Saç + kıyafetler "Mixamo skinleme + retopo +
texture bake" adımlarını atladığı için statik/ağır/texture'sız → clipping & düşük kalite.

---

## 4) Bu oturumda YAPILAN + web'de DOĞRULANAN ✅
1. **Boş `Avatar-Calisma/Caelinus-World/` silindi** (Bash rmdir, risksiz).
2. **Cilt materyali düzeltildi (Blender, GLB'ye export):**
   - `Human.body`: `blend_method` BLEND→**OPAQUE**, `Alpha` link kesildi (1.0),
     `Emission` beyaz→**siyah**. (Web'de cilt artık opak, saydam değil.)
   - `Caelinus.eye`: Emission→siyah.
3. **Cilt texture kod düzeltmesi** `components/shop/ModelAvatar.tsx` ~satır 172:
   `mat.map = null` KALDIRILDI → deri albedo texture korunuyor, ten rengi üstüne
   `color × map` çarpımıyla biniyor. (Web: düz-beyaz plastik → gerçekçi dokulu cilt.)
4. **Göz texture'ı sıfırdan boyandı** (`caelinus-eye`, 256→**512px**): pupil + radyal
   iris lifleri + limbal halka + sıcak sclera. Göz UV'si lat/long küre (iris v≈0.90–1.0,
   u=0–1 etrafı sarar). Texture packed + GLB'ye embed. (Web: koyu kare gözler → gerçek gözler.)

### Dokunulan dosyalar (ŞEFFAFLIK)
- `public/models/caelinus-body-base-fem.glb` — **re-export edildi** (cilt mat + göz texture).
  **YEDEK:** `_work/caelinus-body-base-fem-BEFORE-matfix.glb` (orijinal, geri dönülebilir).
- `components/shop/ModelAvatar.tsx` — cilt texture koruması (satır ~172-184).
- `_work/_eye-texture-dump.png` — geçici dump (gitignored, silinebilir).
- `.claude/launch.json` (proje) — eski silinmiş `caelinus-src-local` path'i düzeltildi → `npm run dev`.
- `C:\.claude\launch.json` — Claude Preview için oluşturuldu (next.cmd → OneDrive proje path'i).

> ⚠️ **Bu değişiklikler henüz COMMIT EDİLMEDİ** (diskte duruyorlar, context temizlense de
> kaybolmazlar). Devam edince ilk iş: feat branch'e commit + push önerilir (GitHub yedeği).

---

## 5) Pilot bulgusu (gemini bikini) — neden conform zor
Blender'da gemini.glb (286k→**15k decimate** + deniz-yeşili materyal verildi):
- Retopo şekli korudu ✅; ama **shrinkwrap** (bedene sardırma) monokini formunu **ezdi** ❌.
- Statik mesh bone'a parent edilince animasyonda deforme olmaz → **havada asılı üst +
  sarkan alt** (web'de görüldü). Bu, statik kıyafetin kök sınırı.

---

## 6) AÇIK KARAR (devam edince İLK netleştirilecek) ⏳
### A) Kıyafet (bikini) yöntemi — pilotlanacak:
- **B — AI ile temiz 3D üret** (Rodin `generate_hyper3d_*` / Hunyuan `generate_hunyuan3d_*` /
  Higgsfield `generate_3d` — hepsi bağlı) → Blender'da otomatik rig. **ÖNERİLEN pilot.**
- **C — Blender'da sıfırdan modelle** (2-3 hero parça). En kaliteli, en emek. B yetersizse fallback.
- **D — Sketchfab'den hazır riglenmiş** model (`download_sketchfab_model`). Lisans + uyum riski.
- **A — Mevcut Meshy'leri kurtar** (conform+skin+retopo). Orta kalite tavanı, kırılgan.
### B) Manken yönü:
- Mevcut MakeHuman avatarı geliştirmeye devam (önerilen) / Foto-gerçek (Avaturn,RPM — kod destekliyor) / dokunma.

**Senior öneri:** Önce **B pilotu** (tek temiz bikini AI-üret + rig) → işe yararsa hızlı,
yaramazsa **C**. Manken: mevcut avatarı geliştirmeye devam.

---

## 7) Kalan iş (öncelik sırası)
1. (Karar) Kıyafet yöntemi seç (§6) → tek bikinide pilot → web catwalk testi.
2. Göz kapağı/iri göz geometrisi (ikincil, mesh işi).
3. Saç kalitesi (`hair-cards-NEW` bitir: texture + normal-map).
4. `aries.glb` yeniden export (bozuk). `model/catwalk.glb` ölü duplike sil (raporlu).
5. Runtime deform ince ayarı gerekiyorsa (`ModelAvatar.tsx` bacak çarpanları 0.8/0.85/0.9; DEFAULT_AVATAR height170/weight58).
6. Tüm bikinileri seçilen yöntemle çoğalt + normalize. Export + web QA.

---

## 8) ORTAM DURUMU (devam edince)
- **Blender:** bağlı, port 9876. **`mcp__blender__*`** (küçük b) ÇALIŞIYOR; `mcp__Blender__*`
  (büyük B) timeout veriyor — küçük b kullan. Sahnede: `Human` (mesh, cilt+göz düzeltildi),
  `Human.rig` (54 bone), `gemini_bikini` (15k retopo, deniz-yeşili mat, torso'ya kabaca konumlu).
- **Web dev:** Next.js 16 Turbopack, `localhost:3000`. Claude Preview ile başlat:
  `preview_start("caelinus-dev")` → launch.json `C:\.claude\launch.json`.
  Avatar route: **`/universe/shop/avatar`**. Ürün kartları "3D…" önekli = GLB'li
  (gemini, cancer, virgo…), "V…" = 2D. Kartı seçince outfit otomatik giydiriliyor.
  Cache-bust için URL'e `?v=Date.now()` ekle, reload sonrası ~12sn bekle, canvas'ı scrollla.
- **Git:** branch `feat/avatar-shop-game-experience`; GitHub'da yedekli (origin/feat...).
  Bu oturum değişiklikleri henüz commit'lenmedi.

## 9) Anahtar dosyalar (referans)
- Avatar render: `components/shop/ModelAvatar.tsx` (useGLTF, deform, skin-tone, saç bind)
- Sahneler: `components/.../AvatarScene.tsx`, `Caelinus3DScene.tsx`
- Kıyafet binding: `components/.../OutfitBindingLayer.tsx` (runtime bone-attach + auto-scale)
- Body library: `lib/avatar-bodies.ts` (`selin-v1`, hairUrl)
- Ürün→GLB: `data/products.ts` (`OUTFIT_GLB_MAP`), `lib/config/outfit-binding-config.ts`
- Default config: `types/avatar.ts` (`DEFAULT_AVATAR`)
- VR: `app/vr/page.tsx` (XR kurulu ama içi placeholder; avatar entegre değil)
