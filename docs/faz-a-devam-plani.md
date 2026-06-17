# Faz A — Devam Planı (compact-sonrası resume dosyası)

> ✅ **TAMAMLANDI (2026-06-17).** 5 adımın hepsi yeşil: [1] base+göz bone+gözbebeği →
> validate KAPI AÇIK · [2] `hair-long-wave.glb` (tek atlas + spring zinciri) · [3]
> `caelinus-catwalk.glb` in-place · [4] canlı regresyon (clone bound=true, orphan yok)
> + commit/push/PR · [5] MD'ler (URETIM-BASLANGIC, manifest v0.7.0, brief 4.10).
> Kalan iş Faz B'ye devredildi (yüz ayrı material slot, saç runtime-bind, -vr türev).

> **Amaç:** Bu dosya bir context-compact'ten sonra Claude'un sıfır kafa karışıklığıyla
> kaldığı yerden devam etmesi için yazıldı. Tüm durumlar **canlı doğrulandı** (2026-06-17).
> Sıra: **[1] base cilala → [2] saç → [3] catwalk → [4] commit + canlı → [5] md güncelle.**
> Her adımda doğrulama kapısı; bir adım yeşil olmadan diğerine geçme.

---

## 0) DOĞRULANMIŞ GÜNCEL DURUM (2026-06-17)

| Eksen | Durum | Kanıt |
|---|---|---|
| Base GLB | ✅ teslim + çalışıyor | `caelinus-body-base-fem.glb` validator KAPI AÇIK (26.7k tris, skin'li, ARKit-5, 2K, sıkıştırmasız) |
| Kayıt | ✅ senkron | `lib/avatar-bodies.ts` selin-v1 + `manifest.json` + `DEFAULT_BODY_ID="selin-v1"` + `AVATARS_IN_PRODUCTION=false` |
| Canlı render | ✅ yeşil | preview console: `bound=true`, `body deform bones-skinned 14 bone`, `playing clip Armature\|mixamo.com\|Layer0` |
| Orphan hatası | ✅ çözüldü | Yanlış alarmdı; ModelAvatar iki-geçişli kontrolle düzeltildi. Reload sonrası yeni orphan YOK |
| Commit | ⚠️ YAPILMADI | 4 dosya working-tree'de: ModelAvatar.tsx + Caelinus3DScene.tsx + AvatarConfigurator.tsx + AvatarScene.tsx (URL swap) + GLB arşivleme |
| Branch | `faz-a-vr-kontrat` | main'in önünde, henüz PR yok |
| Blender MCP | ❌ BAĞLI DEĞİL | port 9876 dinlenmiyor — Adım 1 öncesi bağlan |

**Dev server:** `caelinus-dev` port 3000 çalışıyor (serverId preview_list ile alınır).
Test sayfası: `http://localhost:3000/universe/shop/avatar`.

---

## ADIM 1 — Base'i cilala (Blender) [karar: option 2]

**Önkoşul:** Blender'da N paneli → BlenderMCP → "Connect to Claude". DOĞRULA: `get_objects_summary` çalışmalı. Çalışmadan kod yazma.

**Kaynak .blend:** Şeyma'nın base'i ürettiği dosya (Blender'da açık olmalı). Önce `get_objects_summary` + `get_object_detail_summary` ile armature/mesh/bone yapısını İNCELE, varsayma.

### 1a) Göz bone'u ekle (BÖLÜM 4.4 — yüksek değer)
- `LeftEye` + `RightEye` bone'ları, `Head` (veya `mixamorigHead`) altına parent.
- Göz mesh vertex'lerini ilgili göz bone'una weight'le (gözler kafayla değil bağımsız dönebilsin).
- Simetrik, temiz joint orientation.

### 1b) mixamorig: prefix temizliği (OPSİYONEL — dikkat)
- ⚠️ **Risk notu:** Motor prefix'i ZATEN otomatik soyuyor (BÖLÜM 1.3), retarget şu an 103/129 çalışıyor. Prefix sözleşmece İZİNLİ. Bu yüzden bu adım "nice-to-have", zorunlu değil.
- Yaparsan: tüm 52 bone isminden `mixamorig:` / `mixamorig` ön ekini kaldır → `Hips, Spine, ...`.
- Vertex group isimleri bone isimleriyle eşleşmeli (yoksa skin kopar).
- Base'teki embedded clip track isimleri de prefix taşır — ama motor `animationUrl` verilince embedded clip'i yok sayıyor, bu yüzden zararsız.
- **Komplikasyon çıkarsa BU ADIMI ATLA** — base prefix'li haliyle çalışıyor. Riski emek değmez.

### 1c) Export
- glTF 2.0 Binary (.glb), **+Y up**, **Apply Modifiers**, **Include: Selected**, **embed textures**.
- Üzerine yaz: `public/models/caelinus-body-base-fem.glb`.
- Transform: scale [1,1,1], rotation 0 (Ctrl+A apply).

### KAPI 1 (geçmeden Adım 2'ye geçme)
```
node _tools/validate-avatar.js public/models/caelinus-body-base-fem.glb
```
- [ ] KAPI AÇIK (FAIL=0)
- [ ] "Göz bone'u var" → PASS (artık WARN değil)
- [ ] Tris hâlâ ≤60k, sıkıştırma YOK
- [ ] (prefix temizlendiyse) "mixamorig prefix" WARN'ı gitti

---

## ADIM 2 — Saç (hair-*.glb) [option 3]

- Tek mesh + **tek atlas** doku (yüzlerce ufak mesh OLMASIN — BÖLÜM 4.2).
- `Head` kemiğine inverse-bind ile bağlı VEYA base armature'a skin'li.
- **Spring-bone zinciri** bırak: `Hair_01 → Hair_02 → Hair_03` (fizik runtime'da; GLB sadece kemik zinciri taşır — BÖLÜM 4.6).
- `alphaMode` uygun (saç kartları için BLEND/MASK).
- Konum: `public/models/hair/hair-<isim>.glb` (örn. `hair-long-wave.glb`).

### KAPI 2
- [ ] Ayrı .glb, dokular gömülü
- [ ] donmccurdy viewer'da Head'e bağlı (kafa dönünce saç da döner)
- [ ] ≤1 draw call (tek mesh + tek atlas)
- [ ] Havada uçmuyor, ölçek/konum kafayla uyumlu

---

## ADIM 3 — Catwalk (caelinus-catwalk.glb) [option 3]

- Rig-uyumlu, **In-Place** (Hips position track YOK — root motion yok, BÖLÜM 4.x).
- Mixamo'dan "In Place" işaretli indir veya Blender'da Hips konum kanalını sil.
- Konum: `public/models/anim/caelinus-catwalk.glb` (veya brief'teki `caelinus-catwalk.glb`).
- Not: şu an genel `catwalk.glb` çalışıyor (103/129 bone eşleşiyor); bu adım rig'e tam uyumlu özel klip.

### KAPI 3
- [ ] In-place (viewer'da yerinde sayıyor, sahne dışına kaymıyor)
- [ ] Track isimleri base rig bone'larıyla eşleşiyor (uç bone farkları kozmetik)

---

## ADIM 4 — Commit + Canlıya geçir

1. **Önce canlı regresyon testi** (özellikle prefix temizlediysek):
   - preview reload → console: `bound=true`, `playing clip ...`, **orphan YOK**, slider deformasyonu çalışıyor.
2. `git add -A`
3. Commit (anlamlı mesaj, örn: `feat(avatar): göz bone + saç + özel catwalk — Faz A VR-grade tamam`).
   - Commit mesajı sonuna: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
4. `git push` → `gh pr create` (müşteriye otomatik bildirim) VEYA mevcut PR #1'e ekle.

### KAPI 4
- [ ] Canlıda hata yok, deformasyon + anim çalışıyor
- [ ] Commit + push başarılı, CI yeşil

---

## ADIM 5 — MD kurallarını güncelle

- `URETIM-BASLANGIC.md` §0 durum tablosu: base teslim + göz/saç/catwalk eklendi → güncelle.
- `manifest.json` `inProductionNote`: göz bone + saç + özel catwalk eklendiğini yansıt.
- `docs/avatar-system-and-sema-brief.md` BÖLÜM 4.10 kabul kriterleri: hangi maddeler artık ✅ → işaretle.
- Bu plan dosyasını (`faz-a-devam-plani.md`) "tamamlandı" olarak kapat veya Faz B'ye devret.

---

## BİLİNEN TUZAKLAR (her adımda hatırla)
1. **Sıkıştırma YASAK** (-hires): KTX2/Draco verme — motorda decoder yok, ekran boş gelir.
2. **Tek armature** — çoklu/iç içe iskelet retarget'ı bozar.
3. **In-place anim** — Hips dünya konumu 0.
4. **Embedded doku** — harici .png referansı 404.
5. **Stabil id** — `selin-v1` id'si localStorage'a yazılıyor, DEĞİŞTİRME.
6. **Her export sonrası** `validate-avatar.js` — kapı yeşil olmadan teslim yok.
