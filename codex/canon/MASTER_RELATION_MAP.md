<!-- CAELINUS CODEX — MASTER RELATION MAP · engine/relmap.mjs · READ-ONLY -->

# CAELINUS — MASTER RELATION MAP v1.0

> "Bütün Caelinus'u tek grafik olarak gör." Yatay = üretim zincirleri. Dikey = her düğümün sahip olması gereken katmanlar (Gameplay → Quest → NPC → Animation → Sound → Concept Art → Image Vault → Production Page → Unreal Asset).

Bu harita **eksikleri değil bütünü** gösterir: neyin bağlı, neyin boş olduğunu. Bağlantı çıkarımları **UNVERIFIED** (gerçek bağ Phase 3 görsel + C1 parse sonrası kesinleşir).

## 1. Dikey katman bütünlüğü (global)

| Katman | Durum |
|---|---|
| Content (entity) | HAVE (text) |
| Meslekler | 904 mention (bağlantı UNVERIFIED) |
| NPC | 313 mention (bağlantı UNVERIFIED) |
| Craft | 38 mention (bağlantı UNVERIFIED) |
| Quest | 26 mention (bağlantı UNVERIFIED) |
| Ekonomi | 97 mention (bağlantı UNVERIFIED) |
| Şehir | 236 mention (bağlantı UNVERIFIED) |
| Festival | 58 mention (bağlantı UNVERIFIED) |
| Animation | 4 mention (bağlantı UNVERIFIED) |
| Sound / VO | 6 mention (bağlantı UNVERIFIED) |
| Concept Art | 4 mention (bağlantı UNVERIFIED) |
| Image Vault | 132 görsel, 0 bağlı → UNLINKED |
| Gameplay | 718 mention (bağlantı UNVERIFIED) |
| Blueprint | 2 mention (bağlantı UNVERIFIED) |
| Unreal Asset | 120 mention (bağlantı UNVERIFIED) |

## 2. Yatay üretim zincirleri

### Pamuk → Anadolu

Pamuk ⚠️  →  Çiftçi ✅  →  Dokumacı ✅  →  Boyacı ❌  →  Terzi ❌  →  Pazar ✅  →  Festival ✅  →  Ekonomi ✅  →  Anadolu ✅

Eksik/zayıf: Pamuk, Boyacı, Terzi

### Buğday → Ekonomi

Tohum ✅  →  Buğday ✅  →  Çiftçi ✅  →  Değirmenci ✅  →  Fırıncı ✅  →  Ekmek ✅  →  Pazar ✅  →  Han ⚠️  →  Festival ✅  →  Ekonomi ✅

Eksik/zayıf: Han

### Maden → Savunma

Maden ❌  →  Madenci ❌  →  Demirci ✅  →  Silah Ustası ❌  →  İnşaat ❌  →  Savunma ❌

Eksik/zayıf: Maden, Madenci, Silah Ustası, İnşaat, Savunma

## 3. Örnek düğümlerde tam dikey (Selin'in istediği görünüm)

### Çiftçi

```
Çiftçi
   ↓ Content (entity)       [HAVE]
   ↓ Meslekler              [PARTIAL]
   ↓ NPC                    [PARTIAL]
   ↓ Craft                  [PARTIAL]
   ↓ Quest                  [PARTIAL]
   ↓ Ekonomi                [PARTIAL]
   ↓ Şehir                  [PARTIAL]
   ↓ Festival               [PARTIAL]
   ↓ Animation              [PARTIAL]
   ↓ Sound / VO             [PARTIAL]
   ↓ Concept Art            [PARTIAL]
   ↓ Image Vault            [UNLINKED]
   ↓ Gameplay               [PARTIAL]
   ↓ Blueprint              [PARTIAL]
   ↓ Unreal Asset           [PARTIAL]
```

### Fırıncı

```
Fırıncı
   ↓ Content (entity)       [HAVE]
   ↓ Meslekler              [PARTIAL]
   ↓ NPC                    [PARTIAL]
   ↓ Craft                  [PARTIAL]
   ↓ Quest                  [PARTIAL]
   ↓ Ekonomi                [PARTIAL]
   ↓ Şehir                  [PARTIAL]
   ↓ Festival               [PARTIAL]
   ↓ Animation              [PARTIAL]
   ↓ Sound / VO             [PARTIAL]
   ↓ Concept Art            [PARTIAL]
   ↓ Image Vault            [UNLINKED]
   ↓ Gameplay               [PARTIAL]
   ↓ Blueprint              [PARTIAL]
   ↓ Unreal Asset           [PARTIAL]
```

### Pamuk

```
Pamuk
   ↓ Content (entity)       [HAVE]
   ↓ Meslekler              [PARTIAL]
   ↓ NPC                    [PARTIAL]
   ↓ Craft                  [PARTIAL]
   ↓ Quest                  [PARTIAL]
   ↓ Ekonomi                [PARTIAL]
   ↓ Şehir                  [PARTIAL]
   ↓ Festival               [PARTIAL]
   ↓ Animation              [PARTIAL]
   ↓ Sound / VO             [PARTIAL]
   ↓ Concept Art            [PARTIAL]
   ↓ Image Vault            [UNLINKED]
   ↓ Gameplay               [PARTIAL]
   ↓ Blueprint              [PARTIAL]
   ↓ Unreal Asset           [PARTIAL]
```

## 4. Okuma
- **HAVE** = veri var (metin/varlık). **PARTIAL** = korpusta ilgili terim var ama bağ doğrulanmadı. **UNLINKED** = 132 görsel henüz hiçbir düğüme bağlı değil. **MISSING** = hiç yok. **ORPHANED** = 1-2 kez geçiyor.
- Şu an her dikey zincirin en zayıf halkaları: **Quest, Animation, Sound, Unreal Asset** (neredeyse tümü MISSING) ve **Image Vault** (132 görsel UNLINKED).
- Bu boşluklar Phase 3 (görsel) ve sonraki içerik turlarında doldurulacak. Harita her `build`+`relmap` çalıştırmasında güncellenir.

_Makine kopyası: `codex/canon/relation_map.json` (okuyucu Atlas'ı için)._
