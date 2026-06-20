# CAELINUS BIBLE

> Bu bir web sitesi şartnamesi değildir.
> Bu, **yaşayan bir dijital uygarlığın** kurucu metnidir.
>
> Amaç: web'de başlayan, ileride **mobil ve VR**'a taşınabilen tek bir frekans
> evreni. Bu yüzden her tanım platformdan bağımsızdır — token, sembol ve duygu
> olarak ifade edilir; piksel olarak değil.

Bu doküman **kaynak doğruluğudur (source of truth)**. Kod (tokens.css,
WorldShell, ikon seti) buradan türetilir, tersi değil. Bir çelişki olursa
Bible kazanır; kod güncellenir.

---

## 0. Çekirdek İlke

Caelinus bir platform değildir. Caelinus **frekans temelli bir evrendir**.

Her ekran, ikon, etkileşim, animasyon ve geçiş aynı dünyaya ait hissettirmeli.
Kullanıcı şunu hissetmeli:

> "Bir web sitesinde gezinmiyorum — yaşayan bir diyara giriyorum."

İzole sayfa yok. **Bir uygarlığın bölgeleri (districts)** var.

Kuzey yıldızı (evrenin kurucu cümlesi): **"Ait olmak için değil, birlikte
yaratmak için."**
Bazaar ana sloganı & marka frekansı: **"Frekansını giy · Wear your frequency."**
Marka imzası: **CAELINUS — Frekansın Sanatı.**

---

## 1. Tasarım DNA'sı

Altı sıfat, her kararda test edilir:

**lüks · kutsal · fütüristik · zarif · mistik · minimal**

Asla: jenerik SaaS, jenerik Shopify, jenerik dashboard, rastgele ikon paketi,
gereksiz parlama. **Lüks > fantezi.** Işık az kullanılır; az olduğu için değerli.

Her sayfa şöyle hissettirmeli: bir **lüks kitap**, bir **müze**, bir **kutsal arşiv**.

---

## 2. Renk Sistemi

Evrensel palet (token isimleri kod için bağlayıcıdır):

| Rol | Token | Hex | Kullanım |
|-----|-------|-----|----------|
| Birincil — derin kozmik siyah | `--cae-black` | `#03060f` | Zemin, boşluk, sessizlik |
| İkincil — gece yarısı | `--cae-midnight` | `#07111f` | Katman, derinlik |
| Aksan — metalik altın | `--cae-gold` | `#c9a45c` | Marka, eşik, vurgu |
| Yumuşak altın | `--cae-soft-gold` | `#e8d7a3` | Glow, hover, ışıma, metin |
| Fildişi | `--cae-ivory` | `#f5efe1` | Metin, sıcak nötr |
| Ay gümüşü | `--cae-moon-silver` | `#cfd6df` | Soğuk metin, ay ışığı |
| Portal moru (aura) | `--cae-violet-glow` | `rgba(160,110,255,.24)` | Eşik / portal enerjisi |

> Eski isimler `--cae-gold-soft` ve `--cae-silver` geriye uyum için alias
> olarak korunur (yeni isimlere işaret eder). Değerler `app/styles/tokens.css`
> içinde **canlıdır**.

Her dünyanın bir **imza aksanı** vardır (§5). Bu aksanlar mevcut
`PORTAL_COLOR` haritasıyla hizalıdır — Bible onu resmîleştirir.

Işık kuralı: glow yalnızca **eşik, hover ve kutsal an**larda. Sürekli parlama yok.

---

## 3. Tipografi

Hiyerarşi (**uygulandı** — `next/font` ile self-host, `app/layout.tsx`):

| Katman | Aile | Token | His |
|--------|------|-------|-----|
| Başlık | **Cormorant Garamond** (zarif serif) | `--cae-font-serif` | Kitap, müze, kutsal |
| Gövde | **Inter** (temiz modern sans) | `--cae-font-sans` | Berrak, çağdaş |
| Teknik/etiket | sistem mono | `--cae-font-mono` | Veri, frekans, kod |

Skala token'ları (`--cae-text-xs … --cae-text-display`) tokens.css'te tanımlanır;
piksel değil **ölçek** taşınır (mobil/VR'da yeniden ölçeklenir).

---

## 4. İkon Ailesi

Altı çekirdek sembol — hepsi tek elden, `currentColor`, tutarlı stroke. Rastgele
ikon paketi yok. Her sembol bir dünyaya bağlıdır (§5):

| Sembol | Anlam |
|--------|-------|
| **wing** (kanat) | Yükseliş, marka çekirdeği, yaratıcı |
| **star** (yıldız) | Dilek, arzu, ulaşılan |
| **flame** (alev) | Dönüşüm, oluş |
| **portal** (geçit) | Eşik, oyun, keşif |
| **mirror** (ayna) | İç görü, yansıma |
| **sacred-circle** (kutsal çember) | Döngü, tohum, kök |

İkincil glyph'ler (ay, Solfeggio halkası, burç) bu aileden türetilir.

---

## 5. Altı Dünya

Her dünya bir **bölge**dir; aynı evrenin farklı frekansı. Tanımlar
platformdan bağımsızdır (web/mobil/VR'da aynı kalır).

> Geçiş dili = o dünyaya **girerken** JourneyProvider veil'inin rengi + ritmi
> ("eşikten geçtim" hissi).

---

### ✦ SANRI — Keşif Dünyası
*Canonical: `/universe/sanctum`*

- **Duygu:** Ay ışığı · gizem · sessizlik. İçe bakış.
- **Sembol:** mirror (ayna) · ay
- **Renk:** Ay gümüşü `--cae-silver` + gece yarısı mavisi
- **Hikâye:** Kişinin rüyalarına, sembollerine ve bilincine indiği sığınak.
  Burada hız yoktur; fısıltı vardır. Defter, ritüeller, hafıza.
- **Geçiş dili:** Yavaş, gümüş-mavi sisli veil; ses kısılır gibi. Açılış nefes alır.
- **Ses tonu:** **Bilinç aynası** — mistik bir rehber değil. Cevap veren değil,
  *yansıtan*. Öğreten değil, *alan açan*. Kullanıcıya ne hissetmesi gerektiğini
  söylemez; gördüğünü ona geri verir, kararı ona bırakır. Sakin, şiirsel, az
  kelime. *"Bugün gördüklerini buraya bırak; ayna saklar."*

---

### ✦ AVATAR STUDIO — Oluş Dünyası
*Canonical: avatar akışları (şimdilik dağınık; tek kanona toplanacak)*

- **Duygu:** Dönüşüm.
- **Sembol:** flame (alev)
- **Renk:** Menekşe `#b69cff` → altın ışıması (dönüşüm geçişi)
- **Hikâye:** Kişinin dijital benliğini doğurduğu yer. Frekans profili + AI
  avatar. "Ait olmak için değil, olmak için."
- **Geçiş dili:** Menekşeden altına dönen veil; bir kıvılcım büyür ve form alır.
- **Ses tonu:** Cesaret verici, mahremiyete saygılı.
  *"Yüzünü değil, frekansını taşıyacaksın."*

---

### ✦ ATELIER — Yaratıcılar Dünyası
*Canonical: `/atelier`*

- **Duygu:** Yaratım.
- **Sembol:** wing (kanat — marka logosuyla aynı kök)
- **Renk:** Sıcak metalik altın `--cae-gold`
- **Hikâye:** Sanatçı, tasarımcı, yazar, üretici buluşur. Vitrin değil, ocak.
  Eserler köken ve hikâyeyle gelir.
- **Geçiş dili:** Altın toz, sıcak ışık dalgası; bir atölye kapısı aralanır.
- **Ses tonu:** Saygılı, ustalığa hürmet eden, davetkâr.
  *"Burada üretilen her şeyin bir kökü vardır."*

---

### ✦ BAZAAR — Fiziksel Tezahür Dünyası
*Canonical: `/universe/shop`*

- **Duygu:** Lüks · güzellik · arzu.
- **Sembol:** star (yıldız — kanatların üstündeki dilek yıldızı)
- **Renk:** Derin altın + fildişi `--cae-gold` / `--cae-ivory`
- **Hikâye:** Frekansın giyilebilir hâli. **Sıradan bir e-ticaret DEĞİL.**
  Ürünler portallardan, aynalardan, atölyelerden ve hikâye alanlarından
  *keşfedilir*. Her ürün kartı taşır: hikâye · enerji · koleksiyon · yaratıcı ·
  *avatarda dene* · *frekansını giy* — sadece fiyat + sepete ekle değil.
- **Geçiş dili:** Altın-fildişi ışıltı; bir ayna/vitrin parlar ve ürün belirir.
- **Ana slogan:** **"Frekansını giy · Wear your frequency."** (Bazaar'ın imza cümlesi.)
- **Ses tonu:** Arzu uyandıran ama soğukkanlı lüks; abartısız.
  *"Bu sana ait değil — bu senin frekansın."*

---

### ✦ GAIA — Doğa Dünyası
*Canonical: `/universe/gaia`*

- **Duygu:** Köklülük.
- **Sembol:** sacred-circle (kutsal çember — tohum/döngü)
- **Renk:** Yaşayan yeşil `#79e6a0` (lüks çerçeve içinde ölçülü botanik aksan)
- **Hikâye:** Toprak, bahçeler, tapınak deneyimleri, inziva, yenilenme.
  Konuşan bitkiler, üretici haritası, mevsimler.
- **Geçiş dili:** Yumuşak yeşil-altın, organik dağılım; nefes gibi açılır.
- **Ses tonu:** Topraklı, şefkatli, yavaş.
  *"Toprak, dijital de olsa, hatırlar."*

---

### ✦ PLAY — Deney Dünyası
*Canonical: `/play`*

- **Duygu:** Merak.
- **Sembol:** portal (geçit)
- **Renk:** Kozmik mavi/cyan `#7aa2ff` / `#7fe3ff`
- **Hikâye:** İnteraktif deneyimler, oyunlar, simülasyonlar, keşif. Hata
  yapmanın güvenli olduğu, oynamanın özendirildiği alan.
- **Geçiş dili:** Mavi-cyan parlama, hızlı ve oyuncu; bir geçit açılır.
- **Ses tonu:** Hafif, davetkâr, oyunbaz ama lüksü bozmadan.
  *"Buraya keşfetmeye geldin; acele yok."*

---

## 6. Geçiş Dili (genel)

Kullanıcı **dünyalar arası yolculuk eder**, sayfa değiştirmez. Anında geçiş yok.
Mevcut `JourneyProvider` veil'i bunun omurgasıdır:

1. Tıklanan eşik o dünyanın **rengiyle** ekranı yutar (dive-in, ~460ms).
2. Rota client-side değişir; arka plan WebGL sahnesi (`WorldBackdrop`) değişir.
3. Veil söner (reveal-out, ~560ms); yeni dünya nefes alarak belirir.

His: **"Bir eşikten geçtim."** Araçlar: yumuşak portal geçişi · altın parçacıklar ·
ince blur · ambient hareket. `prefers-reduced-motion` açıksa geçiş atlanır.

---

## 7. Ses Tonu (genel)

Lüks · sade · mistik **ama anlaşılır**. Aşırı ezoterik değil. Premium, global,
Awwwards seviyesi. İki dil: TR birincil hisli, EN eşdeğer. Emoji yok (UI'da
ikon ailesi kullanılır). Kısa cümle, çok boşluk, az ama isabetli kelime.

---

## 8. Platformdan Bağımsızlık (web → mobil → VR)

Bible piksel değil **token + duygu** taşır; köprü budur:

- **Renk/tipografi/boşluk** → token (ölçek olarak; cihazda yeniden ölçeklenir).
- **Dünya kimliği** → duygu + sembol + imza renk (her platformda aynı).
- **Geçiş** → "eşik" metaforu (web'de veil, VR'da gerçek portal geçişi olabilir).
- **Sahne** → `WorldBackdrop` soyutlaması (web WebGL; mobilde hafif; VR'da uzamsal).

Yeni bir platform eklenince UI yeniden çizilir ama **bu doküman değişmez**.

---

## 9. Koda Eşleme (governance)

| Bible kavramı | Kod karşılığı (P1) |
|---------------|--------------------|
| Renk/tipografi/boşluk token'ları | `app/styles/tokens.css` + `next/font` |
| İkon ailesi | `components/icons/*` (SVG, currentColor) |
| Dünya iskeleti | `WorldShell` page-wrapper |
| Geçiş dili | mevcut `JourneyProvider` / `JourneyLink` |
| Atmosfer / sahne | mevcut `GlobalAtmosphere` / `WorldBackdrop` |
| Dünya imza rengi | `PORTAL_COLOR` → token'lara taşınır |

**Kural:** Bir dünyaya dokunan PR, çelişki varsa önce Bible'ı günceller, sonra kodu.

---

*CAELINUS — Frekansın Sanatı. Toprak, dijital de olsa, hatırlar.*
