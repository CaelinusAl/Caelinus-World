# CAELINUS WORLD MAP (Yapısal Omurga)

> **Medeniyetin coğrafi omurgası — 8 district nerede, neye komşu, hangi frekans.**
> Sürüm: V1 · Tarih: 2026-06-19 · Statü: **Layout canon'u — illüstrasyon render'ı ayrı (görsel araç dönünce).**
>
> Founder yönü: önce harita, sonra establishing shot'lar. "Harita bütün
> medeniyetin omurgasıdır." Bu dosya, sonra üretilecek illüstrasyonlu haritanın +
> district establishing shot'larının **tek konum kaynağıdır.**
>
> Canon temel: `lib/district/registry.ts` (komşuluk), `data/avatar-districts.ts`
> (frekans renkleri), [Order Bible](./CAELINUS_ORDER_BIBLE_V1.md) (landmark/Order),
> spiral felsefe ([Civilization Bible](./CAELINUS_CIVILIZATION_BIBLE.md) World Loop).

---

## Mekânsal Mit: Spiral

Caelinus düz bir harita değil, bir **spiraldir** (World Loop ile aynı geometri).
- **Merkez = SOURCE** — doğuşun kalbi; avatar burada doğar, spiral buradan açılır.
- Spiral dışa döndükçe districtler **deneyim derinliği** kazanır.
- **Dış kenar = TEMPLE OF SILENCE** — spiralin sessizleştiği uç; sonun ve
  arınmanın yeri (Kali / The Unmaking).
- Spiral kapanmaz: dış kenardan merkeze "Reflection → Avatar" ile geri döner
  (her tur bir derinlik yukarı). Harita bu yüzden **kapalı çember değil, açık spiral.**

```
                 ┌─ TEMPLE (sessizlik · dış uç)
                 │
        SANCTUARY ─ SANRI ─────── MIRROR
            │         │              │
          GAIA ───  SOURCE  ───── BAZAAR
            │      (merkez)         │
        ATELIER ───────────────────┘
```
*(Şematik; gerçek yerleşim spiral — aşağıdaki harita görselinde.)*

---

## 8 District — Konum, Komşuluk, Frekans

| District | Halka | Komşular | Frekans rengi | Order |
|---|---|---|---|---|
| **Source** | merkez | Mirror, Sanri, Gaia | `#f4ead0` beyaz-altın | Daughters of Selîne |
| **Mirror** | iç | Source, Sanri, Bazaar | `#cfd8e6` gümüş | The Returning |
| **Sanri** | iç | Source, Mirror, Sanctuary, Temple | `#c9d4e6` mor-gümüş | Oracle Circle |
| **Gaia** | orta | Source, Atelier, Sanctuary | `#79e6a0` yeşil-altın | The Verdant Keepers |
| **Atelier** | orta | Gaia, Bazaar | `#d8c39a` bronz-fildişi | The Bronze Council |
| **Sanctuary** | orta | Gaia, Sanri | `#f3d9c9` pastel-altın | The Mother-Keepers |
| **Bazaar** | dış | Mirror, Atelier | `#ffe9b8` altın | Daughters of the Foam |
| **Temple of Silence** | dış uç | Sanri | `#b9b9c2` monokrom | The Unmaking |

> **Komşuluk mantığı:** frekans akrabalığı + registry. Source merkez olduğu için
> iç halkayı besler; Mirror↔Bazaar (Mirror Gate / fashion try-on, registry: fashion
> slug=bazaar); Sanri tüm içsel/sessiz frekanslara köprü; Temple yalnız Sanri'ye
> bağlı (spiralin sessiz ucu).
>
> **Registry eşlemesi:** Canlı registry'de 4 anahtar var (sanri, gaia, fashion≙bazaar,
> avatar). Source ≈ avatar doğuş/genesis bölgesi; Mirror/Atelier/Sanctuary/Temple
> Phase 3'te registry'ye eklenecek (World Map bunların yerini şimdiden sabitler).

---

## Landmark İndeksi (her district'in görülecek mekânları)

| District | Ana landmark | İkincil landmark(lar) |
|---|---|---|
| **Source** | 🌙 **Mirror Lake** (Selene) | Birth Pool, Moon Library |
| **Mirror** | Bloom-Shadow Gate (Persephone) | Crystal Athenaeum (Sophia · House of Clarity) |
| **Sanri** | 🔮 **Dream Observatory** (Hekate) | Threshold Gate, Hall of Symbols |
| **Gaia** | Root Grove (Gaia) | Twilight Thicket (Artemis · House of the Hunt), Seed Vault |
| **Atelier** | Forge of Strategy (Athena) | Hall of Plans, The Long Loom |
| **Sanctuary** | Temple of Wings (Isis) | Healing Sanctum, Hall of Holding |
| **Bazaar** | Pearl Court (Aphrodite) | 🔥 **Hall of Embers** (Freya), Star Throne (Inanna · House of Heaven) |
| **Temple of Silence** | Black Sanctum (Kali) | Pyre of Endings, Hall of Silence |

> **Founder'ın en görmek istediği 3 mekân (establishing-shot önceliği):**
> 🌙 Mirror Lake · 🔮 Dream Observatory · 🔥 Hall of Embers.

---

## Render Brief (görsel araç dönünce)

1. **İllüstrasyonlu World Map** — bu spiral layout'un sinematik haritası: mor-siyah
   kozmik zemin, altın damar yolları district'leri bağlar, her district frekans
   rengiyle parlar, landmark ikonları yerleşir. (Caelinus görsel DNA'sı.)
2. **District establishing shot'ları** — sıra: Mirror Lake → Dream Observatory →
   Hall of Embers (öncelik 3) → Root Grove → Crystal Athenaeum → Temple of Wings →
   Pearl Court → Black Sanctum → Forge of Strategy → Star Throne.
   Her biri: tanrıça figürü YOK (saf mekân), mimari dil + frekans ışığı + sis.

> İllüstrasyon render'ı Higgsfield image MCP'ye bağlı (şu an disconnect).
> Şematik harita (bu dokümanla birlikte sunulan SVG) bağımsız üretildi.

---

*Bu harita medeniyetin omurgasıdır: District establishing shot'ları, Order
merkezleri, NPC yerleşimi ve World Map illüstrasyonu bu konum canon'undan beslenir.*
