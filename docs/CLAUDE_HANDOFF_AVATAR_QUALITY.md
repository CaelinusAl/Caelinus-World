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

> ✅ **COMMIT + PUSH EDİLDİ** (2026-06-20 oturum-2): `16ace08` (cilt+göz) + `b25e2de`
> (gitignore hijyeni) → `origin/feat/avatar-shop-game-experience`'e push'landı. GitHub'da yedekli.
> Ayrıca temizlendi: `combined.txt` (MPFB log), `_work/_eye-texture-dump.png`, `package-lock.json`
> gürültüsü geri alındı, `next-env.d.ts` temizlendi; `.gitignore`'a `.claude/settings.local.json`
> + `.claude/launch.json` + `combined.txt` eklendi.

---

## 5) Pilot bulgusu (gemini bikini) — neden conform zor
Blender'da gemini.glb (286k→**15k decimate** + deniz-yeşili materyal verildi):
- Retopo şekli korudu ✅; ama **shrinkwrap** (bedene sardırma) monokini formunu **ezdi** ❌.
- Statik mesh bone'a parent edilince animasyonda deforme olmaz → **havada asılı üst +
  sarkan alt** (web'de görüldü). Bu, statik kıyafetin kök sınırı.

---

## 6) KARARLAR — durum (oturum-2'de güncellendi)
| Konu | Karar | Durum |
|---|---|---|
| **Avatar sırası** | Önce göz, sonra saç | Göz **ertelendi** (kullanıcı), **saça geçildi** |
| **Saç yöntemi** | **Sketchfab'den kaliteli hazır model** (kalite sıçraması) | ⏸ Sketchfab entegrasyonu kapalı — kullanıcının API key girmesi bekleniyor |
| **Selfie ↔ avatar derinliği** | Şimdilik **beklesin** (yüzeysel decal kalsın) | ⏸ Beklemede |
| **İki mağaza** | **Tek mağazada birleştir** (`/universe/shop` kanonik) | ⏸ Karar verildi, uygulama sonraya |
| **Kıyafet/bikini** | Yöntem seçimi (B AI-üret / C native / D Sketchfab / A Meshy) | ⏸ Beklemede (avatar bitince) |
| **Manken yönü** | Mevcut MakeHuman avatarı geliştir (foto-gerçek Avaturn/RPM **YAZILMAMIŞ** — §10) | ✅ Sabit |

> Kıyafet için eski senior öneri (B AI-üret pilotu) hâlâ geçerli; ama önce avatar (saç+göz) bitecek.

---

## 7) Kalan iş (öncelik sırası — oturum-2 güncel)
1. **SAÇ** (kalite sıçraması): Kullanıcı Sketchfab API key girince → MCP `search_sketchfab_models`
   ile CC-BY/CC0 (ticari!) kadın uzun saç ara → `get_sketchfab_model_preview` → beğenileni
   `download_sketchfab_model(target_size~0.6)` → kafaya oturt (tepe z≈1.69) → gövde iskeletine
   bind / head-bone attach → export → web QA. **(§11 detay)**
2. **GÖZ geometrisi** (ertelendi): fırlaklık DEĞİL — gerçek sorun **kapak aralığı fazla geniş**
   (çok sclera → şaşkın bakış). Güvenli teknik §11'de.
3. **KVKK** (🔴 launch blocker): selfie rıza onayı + silme endpoint'i + retention (§10-A). Satış öncesi şart.
4. **Kıyafet/bikini** yöntemi (§6) → pilot → web catwalk testi.
5. **Mağaza birleştirme**: `/caelinus-ai/shop` → `/universe/shop` (tek evren, §10-C).
6. **Bakım/temizlik:** `/api/upload-face` 404 bug; `aries.glb` re-export (zstd bozuk);
   saç GLB'sindeki 2m junk `Icosphere` export'ta sil; outfit 8/12 burç (taurus/leo/aquarius/sagittarius eksik);
   `public/models/catwalk.glb` ölü duplike (kullanıcı "şimdilik dursun" dedi — SİLME).
7. Runtime deform ince ayarı gerekiyorsa (`ModelAvatar.tsx` bacak çarpanları 0.8/0.85/0.9).

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
- VR: `app/vr/page.tsx` (gerçek WebXR iskelesi — `createXRStore` + Enter VR; bilinçli "sessiz kapı")

---

## 10) FORENSİK — Selfie ↔ 3D Avatar ilişkisi + sayfa/vizyon (2026-06-20, 3 subagent)

### A) Selfie kayıt/persist + arka plan
- **3 AYRI selfie yükleme yolu** var (parçalanma):
  1. `/universe/shop/avatar` → `components/shop/FaceUpload.tsx` (3D'ye bağlanan TEK yol).
  2. `/play` → `app/play/_components/SelfieUploader.tsx` → Replicate `cdingram/face-swap` / FASHN (2D faceswap, 3D yok). Store: *"No persistence on purpose"* (`stores/play-store.ts:8`) → RAM, kalıcı değil.
  3. `/caelinus-ai/*` → `components/caelinus-ai/SelfieCapture.tsx` → `/api/caelinus/jobs` → **fire-and-forget worker** (`startJobInBackground`) → **RunPod GPU** (`lib/caelinus-ai/jobs/runner.ts:146`). + IndexedDB (`storage.ts:110`).
- **PERSIST? → env'e bağlı.** Default in-memory = geçici. `CAELINUS_AI_STUDIO_STORE=supabase` ise selfie base64 **Postgres `caelinus_ai_jobs.input`'a kalıcı** yazılır (`supabase-store.ts:149`). Avatar session aynı şekilde (`session-store.supabase.ts:76`).
- **Arka plan? → EVET** (yol 3, RunPod worker + SSE stream). Yol 2 senkron, arka plan yok.
- **`public/uploads/faces`** → hiçbir kod yazmıyor (ölü gitignore girdisi).
- ⚠️ **KVKK RİSKİ:** `app/gizlilik/page.tsx` selfie'yi biyometrik özel-nitelikli veri sayıp *"açık rıza"* + *"işlem bitince silinir"* vaat ediyor AMA kodda **consent gate YOK, silme endpoint'i YOK, retention cron YOK**. Selfie Replicate/FASHN/RunPod'a (muhtemelen AB dışı) gidiyor. UI "selfie depolanmaz" diyor — yol 2 için doğru, yol 3 (Supabase açıksa DB'ye yazıyor) için **yanıltıcı**. Launch öncesi çözülmeli.
- ⚠️ **BUG:** `FaceUpload.tsx:41` → `POST /api/upload-face` ama bu route **YOK** (404). Doğrulanmalı: ölü kod mu, kırık yol mu (shop avatar sayfası client-side MediaPipe `cropFaceFromUrl` kullanıyor olabilir — `applyFace`).

### B) Selfie ↔ 3D Avatar buluşması → **YARIM-BAĞLI**
- **Tek gerçek köprü:** `/universe/shop/avatar` → selfie → MediaPipe yüz kırpım → (1) GLB kafasına **2D decal** (`AvatarFaceTexture.tsx:115 DecalGeometry`) + (2) landmark → **mesh deform** (`mapMetricsToAvatarDeform`). localStorage `caelinus_face_texture` ile `/universe/shop` TryOnSection'a da taşınıyor.
- **Gate:** sadece `supportsSkinToneOverride===true` (selin-v1=true) ise aktif.
- **Foto-gerçek (Avaturn/RPM) = DORMANT:** çalışan kod YOK. Sadece `globals.css` boş `.avaturn-*` stilleri + `ModelAvatar.tsx:711` defansif heuristik + yorumlar. Handoff §6'daki *"Avaturn/RPM kod destekliyor"* ifadesi **yanıltıcı** — selfie→foto-gerçek-avatar zinciri yok. Bugün foto-gerçeklik = sadece 2D decal/faceswap.
- `/play` ve `/caelinus-ai job` → 3D'ye veri geçirmiyor (ayrı). `Caelinus3DScene.tsx:222` ModelAvatar'ı `faceTextureUrl` olmadan çağırıyor.

### C) Sayfa düzeni vs vizyon (kaynak: `docs/caelinus-bible.md`)
- Vizyon: *"frekans evreni, izole sayfa yok, districts"*, *"Bazaar = sıradan e-ticaret değil"*, *"Wear your frequency"*, web→VR fazlama.
- ✅ Güçlü: entry→universe→districts metaforu kodda gerçek; Bazaar ürün kartları hikâye/frekans taşıyor; avatar gerçekten 3D (placeholder değil); VR bilinçli "sessiz kapı" (gerçek WebXR iskelesi).
- 🔴 **En kritik boşluk — İKİ AYRI MAĞAZA:** `/universe/shop` (Bible'a göre kanonik) vs `/caelinus-ai/shop` (ayrı sahne `Caelinus3DScene`, ayrı sepet `caelinus_ai_cart`, ayrı avatar). Sepet bile devredilmiyor → "tek evren" ilkesine aykırı. Birleştirme birincil aday.
- ⚠️ 3+ paralel avatar üretim akışı; `/caelinus-ai/*` nav'dan kopuk (orphan); `/experience` `/` ile rakip prototip; outfit 8/12 burç (taurus, leo, aquarius, sagittarius eksik).

---

## 11) OTURUM-2 TEKNİK DETAY — göz denemesi + saç tanısı (2026-06-20)

### GÖZ geometrisi — denendi, ERTELENDİ (kullanıcı isteğiyle geri alındı)
- **Ölçüm (Blender, `Human` mesh, metre):** Göz materyali `Caelinus.eye` = 846 vert, 2 küre.
  Göz küresi yarıçap ~1.1 cm (çap 2.2 cm) = **anatomik normal**. Ön nokta Y=−0.140, merkez −0.128.
  Çevre cilt medyanı −0.128, kaş/burun −0.150 → **göz küresi DEPTH olarak fırlak DEĞİL**.
- **Gerçek sorun:** **palpebral aperture (kapak aralığı) fazla geniş** → iris üstü/altı çok sclera
  (beyaz) → "şaşkın/dik bakan" ifade. Texture değil, kapak geometrisi.
- **Güvenli düzeltme tekniği (KANITLANDI, ama uygulanmadı):** Mesh'te **53 shape key** var
  (52 ARKit + Basis). Bir vert'i TÜM shape key'lere AYNI delta ile kaydırmak, key'ler arası
  **relative delta'yı korur** → blink/expression bozulmaz. Yani: (a) göz küresini +Y geri oturt,
  (b) üst kapak kenarını aşağı / alt kapağı yukarı (falloff'lu) — hepsi tüm key'lere uniform.
- **Güvenlik ağı:** İşlemden önce `Human` mesh'in gizli kopyası (`Human_EYEBACKUP`) alınır;
  beğenilmezse birebir restore. Bu oturumda yapıldı, sonra kullanıcı "geri al" dedi → **tam revert
  edildi, yedek silindi, custom prop temizlendi. Diske/GLB/git'e HİÇ dokunulmadı** (sadece canlı Blender).
- ⚠️ Uyarı: `me.vertices[i].co` shape key'li mesh'te güvenilmez; **`me.shape_keys.key_blocks[*].data[i].co`**
  üzerinden oku/yaz.

### SAÇ — tanı kondu, Sketchfab yoluna girildi
- **Üretim saçı** `public/models/hair/hair-long-wave.glb` (1.59 MB): Mesh `Hair` = **984 tri**,
  816 vert, materyal `Caelinus.hair` (1024² renk texture `caelinus-hair.png`), **normal-map YOK**.
  **Ayrı `Hair.rig` = 4 bone** (Hair_Root, Hair_01-03) — gövde iskeletini paylaşmıyor.
- 🔴 **GLB içinde junk:** 2 metrelik başıboş `Icosphere` (80 tri, materyalsiz) gömülü — yanlışlıkla
  export'a karışmış; web sahnesine de gidiyor olabilir. **Sonraki export'ta SİL.**
- **Kalite sorunu:** Düz kartlar + BLEND alpha → "hayalet/şeffaf"; sert saç çizgisi; hacim yok.
  Kök sebep materyal `blend_method = BLEND`. Bu oturumda **BLEND → HASHED** yapıldı (GLB export'ta
  `alphaMode: MASK`/cutout = three.js'te opak; **sadece canlı Blender, export edilmedi**).
- **Karar:** materyal tweak yetmez → **Sketchfab'den kaliteli hazır model** (kullanıcı seçti).
- `_work/` varyantları: `hair-cards-NEW.glb` (61 KB, yarım kart-saç), `-C4`, `-NEW`.

### Sketchfab durumu (RESUME engeli)
- Entegrasyon **KAPALI**. Açmak için kullanıcı (Şeyma): Blender N-paneli → "Use assets from Sketchfab"
  işaretle → **Sketchfab API key** gir (sketchfab.com → Settings → Password & API → API Token) →
  "Disconnect" sonra reconnect. (Reconnect sırasında MCP bağlantısı bir an düşebilir.)
- Açılınca: `mcp__blender__search_sketchfab_models` → `get_sketchfab_model_preview` →
  `download_sketchfab_model(uid, target_size≈0.6)`. **Lisans: sadece CC-BY veya CC0 (ticari ürün!).**

### Canlı Blender sahnesi (oturum-2 sonu — geçici)
- `Human` (cilt+göz düzeltildi, **göz reverted=orijinal**), `Human.rig`, `gemini_bikini` (gizli).
- **Geçici importlar:** `Hair` + `Hair.rig` + junk `Icosphere` (hair GLB'den geldi). `Caelinus.hair`
  materyali HASHED'e çevrildi. Viewport MATERIAL preview, üst gövdeye çerçeveli. **Bunlar diske
  yazılmadı** — yeni oturumda sahne bu importları içeriyor olabilir (yoksa hair GLB'yi tekrar import et).

---

## 12) 🚀 BİR SONRAKİ OTURUM — BURADAN BAŞLA
**Ana bağlam (ASLA kaçırma):** VR gözlük için hatasız, oyun gibi 3D avatar = dijital manken;
üstünde gerçek satılan bikiniler sergilenir. Beden/cilt/göz-texture BİTTİ + commit'li (`b25e2de`,
GitHub'da). MakeHuman'a dönülmez, ürün değişmez, deploy/main-merge yok. Branch: `feat/avatar-shop-game-experience`.

**Sıradaki iş = SAÇ (§7/1, §11).** İlk soru kullanıcıya: *"Sketchfab API key'ini girdin mi?"*
- **Evet** → `get_sketchfab_status` doğrula → CC-BY/CC0 kadın uzun saç ara → önizle → indir
  (target_size≈0.6) → kafaya oturt → bind → export `public/models/hair/hair-long-wave.glb`
  (junk Icosphere'siz!) → web QA (`/universe/shop/avatar`).
- **Hayır/vazgeç** → güvenli yol: mevcut saça normal-map + daha iyi texture + cutout (HASHED) +
  junk temizle + export.

**Sonra:** göz geometrisi (§11 güvenli teknik) → KVKK (launch blocker) → kıyafet → mağaza birleştirme.
Ortam/araç notları: §8 (Blender port 9876 `mcp__blender__*` küçük b; web `localhost:3000` route
`/universe/shop/avatar`). Bu doküman = tek doğruluk kaynağı; her oturum sonunda güncelle.
