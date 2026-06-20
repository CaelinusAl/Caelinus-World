# CAELINUS — Avatar Kalite Handoff (Saç fazı)

> **Tek doğruluk kaynağı** — avatar kalite çalışması (saç → göz → kıyafet) için.
> Genel mimari için önce `docs/caelinus-ai-memory.md` oku. Bu dosya onun
> üstüne, **aktif kalite işinin** durumunu tutar.
>
> ⚠️ Bu dosya bir önceki oturumda yazıldığı *sanıldı* ama diske hiç
> commit edilmemişti — kayboldu. Bu sürüm, Blender sahnesinden **gözle
> ve kodla doğrulanmış** gerçek verilerle yeniden yazıldı (2026-06-20).

---

## 0. Ana bağlam (değişmez vizyon)

VR için **hatasız, oyun-gibi 3D manken**; üstünde **gerçek bikiniler**.
Temel sistem + yüz analizi **bitti**. Şu an sıra: **saç** → sonra göz → kıyafet.

Yüz analizi artık tamamen **tarayıcıda** (MediaPipe), selfie cihazdan çıkmıyor
(tam gizlilik). RunPod kaldırıldı.

---

## 1. Kararlar + İLERLEME

| Konu | Karar | Durum |
|---|---|---|
| Saç yolu | **Higgsfield image→3D** (Sketchfab/prosedürel/hair-card denendi, bırakıldı) | ✅ **BİTTİ + onaylandı + kaydedildi** (bkz §S) |
| Göz | **Ertelendi** | Gözler "boş/bakan" — saçtan sonraki faz. |
| Kıyafet | Bikini (`gemini_bikini`) | ✅ **cloth sim ile oturtuldu + kaydedildi** — kalan açıklık tasarım sınırı (bkz §B) |
| Mağaza | **Birleştir** | "İki ayrı mağaza" vizyon ihlali — sonraki faz. |
| Selfie→avatar | **Yarım-bağlı** | Köprü tamamlanmadı, ayrı madde. |

**Öncelik sırası:** ~~saç~~ → kıyafet (aktif) → göz → KVKK → mağaza → bakım.

---

## S. SAÇ — BİTTİ (2026-06-20)

**Yöntem:** Higgsfield ile üretildi (Sketchfab/hesap/key derdi YOK, prosedürel hair-card
ve hair-card-from-scratch denendi ama kötüydü/dağınıktı, bırakıldı).
1. `generate_image` (nano_banana_pro): kumral uzun kabarık dalgalı saç, **manken
   kafasında peruk ürün fotosu**, düz arka plan. 2 varyant, A seçildi.
2. `generate_3d` (image_to_3d, should_texture=false): GLB peruk üretildi.
3. Blender'a import → birleştir → avatar kafasına oturt (scale ~0.314, taç Z=1.70'e).
4. Manken ön-yüz bölgesi silindi (avatarın yüzü görünsün): y<-0.025, 1.40<z<1.675, |x|<0.135.
5. Kumral materyal (Base Color 0.30,0.17,0.085).
6. **`mixamorig:Head` bone'una BONE-parent** edildi → baş ile hareket eder.

**Kaydedilen dosyalar (public/models/):**
- `caelinus_avatar_hair.blend` (23MB) — tam düzenlenebilir sahne, TEK DOĞRULUK
- `caelinus_avatar_hair.glb` (16.5MB) — avatar+saç(bağlı)+bikini snapshot

**Kalan saç işi (düşük öncelik):**
- GLB ağır (16.5MB) — saç mesh'i 30k vert, decimate edilebilir (web performansı)
- Saç rengini StyleCustomizer swatch'ına bağla (§5 — şu an materyal sabit kumral)
- Web entegrasyonu: bu Blender "Human" selin.glb'den FARKLI olabilir; hangi avatara/
  hangi varyantlara saç bağlanacağı netleşmeli.

---

## B. BİKİNİ — cloth sim ile oturtuldu (2026-06-20)

- `gemini_bikini`: 7492 vert, Meshy genel ölçü kabuk.
- **Çözüm:** cloth simülasyon. Bikini göğse doğru içeri alındı (loc 0,-0.065,1.05),
  kupa bölgesi (y<-0.02, 1.14<z<1.34, |x|<0.12) pin-DIŞI bırakıldı, gerisi pinlendi,
  gövde Collision (thickness 0.004), 30 frame sim → kupalar göğüs yüzeyine oturdu.
  Evaluated mesh bake edildi (modifier apply yerine new_from_object), modifierlar temiz.
- **Kalan:** kupalar bu göğüs için küçük/açık kesim → uç kapatma eksik. Bu *fit* değil
  **tasarım** sınırı. Tam kapatma istenirse: kupayı büyüt (mesh edit) ya da farklı bikini.
- ❌ **Shrinkwrap NEAREST_SURFACEPOINT DENENMESİN** — garment topolojisini parçalıyor.
- ❌ Global Y kaydırma fit'i çözmez (ileri=boşluk, geri=göğüs taşar) — kanıtlandı.
- Kaydedildi: `caelinus_avatar_hair.blend` + `.glb` (avatar+saç+oturmuş bikini).

---

## 2. Blender sahnesi — DOĞRULANMIŞ durum (2026-06-20)

Aktif `Scene` (8 obje):

| Obje | Tip | Durum |
|---|---|---|
| `Human.rig` | ARMATURE | Avatar iskeleti — **Mixamo** (`mixamorig:` önekli bone'lar) |
| `Human` | MESH | Avatar gövdesi, boy **1.687 m** |
| `gemini_bikini` | MESH | Bikini, Z≈1.05 (göğüs) |
| `Hair.rig` | ARMATURE | Saç fizik zinciri: `Hair_Root, Hair_01, Hair_02, Hair_03` |
| `Hair` | MESH | **Mevcut saç — değiştirilecek** (aşağı bak) |
| `Icosphere` | MESH | **JUNK** — 42 vert, materyalsiz, gizli. **SİL.** |
| `Light`, `Camera` | — | Sahne |

### Head bone ölçüleri (saç hizalama için)
- `mixamorig:Head`: kök Z=**1.5209**, uç Z=**1.6635** (kafa tepesi ~1.69)
- `mixamorig:Neck`: Z=1.4686
- `mixamorig:LeftEye`: Z=1.61, Y=−0.13 → **yüz −Y yönüne bakıyor**, X=0 merkez

---

## 3. Mevcut saç — neden değişmeli (gözle + kodla doğrulandı)

**Görsel:** Kafadan sarkan düz, koyu, yarı-saydam **flat şeritler** (kurdele/yosun
hissi). Tepe hacmi yok, kafa derisi açıkta, tutam akışı yok.

**Veri:**
- Mesh: **816 vertex / 984 poly** — blob seviyesi, doğal saç için yetersiz
- Materyal: `Caelinus.hair`
- Döküm aralığı: Z **1.09 → 1.71** (omuz hizası saç) — yeni saç için **referans hacim**

**Binding kusuru (kritik):**
- `Hair` → `Hair.rig`'e **OBJECT** parent (parent_bone boş)
- `Hair.rig`, `Human.rig`'in `Head` bone'una bağlı **DEĞİL**
- Sonuç: catwalk'ta baş dönünce **saç takip etmez** → havada kalır
- Düzeltme: yeni saçı ya doğrudan `mixamorig:Head` bone'una parent et,
  ya da `Hair.rig`'i `Head` bone'a `CHILD_OF` constraint ile bağla.

---

## 4. Saç fazı — uygulama planı (Sketchfab key gelince)

1. **Sketchfab key aktif mi** doğrula (`get_sketchfab_status`).
2. Estetiğe uygun ara: lüks fütüristik, doğal akışlı, **düşük-poly gerçekçi**
   saç (örn. "low poly realistic female hair", "stylized long hair groom").
   `search_sketchfab_models` → önizlemeleri Şeyma'ya göster, **o seçsin**.
3. Seçileni indir (`download_sketchfab_model`).
4. **Eski `Hair` + `Hair.rig`'i sil**, `Icosphere`'i sil.
5. Yeni saçı hizala: kafa tepesini Z≈1.66'ya, merkezi X=0 / yüz −Y'ye oturt;
   ölçeği §2/§3 referansına göre uydur.
6. **`mixamorig:Head` bone'una parent et** (artık baş ile birlikte hareket eder).
7. Materyali Caelinus paletine ayarla (saç rengi StyleCustomizer swatch'larına
   bağlanacak — bkz. §5).
8. GLB export → `public/models/` (gerekiyorsa avatar GLB'ye gömülü).
9. `Icosphere` ve junk sahnede kalmasın diye export öncesi temiz sahne doğrula.

---

## 5. Kod tarafı — saç verisi var ama 3D'ye bağlı DEĞİL

`components/caelinus-ai/StyleCustomizer.tsx` kullanıcıdan topluyor:
- `hair.length`: short / bob / medium / long / veil
- `hair.texture`: straight / wavy / curly / coily
- `hair.color`: 12 swatch (ColorHex)

Ama bu seçim **hiçbir 3D mesh'e bağlı değil** — şu an dekoratif. Saç fazının
ikinci yarısı: seçilen renk/uzunluğu gerçek saç mesh'ine/materyaline bağlamak
(en azından renk override + birkaç uzunluk varyantı).

---

## 6. 🚀 Bir sonraki oturum — buradan başla

1. Bu dosyayı + `docs/caelinus-ai-memory.md`'yi oku.
2. Şeyma'dan onay: **"Sketchfab key'i girdim"** mi?
   - Evet → §4 adım 1'den başla (status doğrula → ara → göster → indir → bağla).
   - Hayır → key kurulum adımları (Sketchfab → settings → API Token →
     Blender N paneli → "Use assets from Sketchfab" + key → reconnect).
3. Saç bitince §5 (kod binding) → sonra göz fazı.

**Kayıp önleme:** her önemli karar/bulguyu bu dosyaya yaz VE git'e commit et.
"Yazdım sandım" yeterli değil — `git status` temiz olana kadar iş bitmedi.
