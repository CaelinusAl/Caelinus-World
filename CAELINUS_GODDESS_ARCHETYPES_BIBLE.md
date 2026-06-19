# CAELINUS GODDESS ARCHETYPES BIBLE

> **Caelinus Avatarlarının ruhsal ve görsel DNA'sı.**
> Sürüm: 0.1 (sistem tasarımı) · Tarih: 2026-06-18
> Statü: **Sadece sistem tasarımı.** Kod değildir.
>
> Üst doküman: [`CAELINUS_AVATAR_BIBLE.md`](./CAELINUS_AVATAR_BIBLE.md)
> Bu doküman, Avatar Bible Bölüm 3'teki 12 arketibi **tam DNA seviyesinde**
> açar ve her tanrıçanın district'e göre nasıl evrildiğini tanımlar.
>
> Uyum: Asset Bible · District Engine (`lib/district/registry.ts`) · World Map ·
> Blender Pipeline. Görsel DNA omurgası: **mor alabaster + altın damar**, locked
> frame kompozisyonu.

---

## İçindekiler

- [Okuma Anahtarı](#okuma-anahtarı)
- [14 DNA Alanı](#14-dna-alanı)
- [District Frekans Tablosu](#district-frekans-tablosu)
- **12 Tanrıça**
  1. [Selene](#1--selene) · 2. [Gaia](#2--gaia) · 3. [Freya](#3--freya) ·
  4. [Sophia](#4--sophia) · 5. [Artemis](#5--artemis) · 6. [Isis](#6--isis) ·
  7. [Inanna](#7--inanna) · 8. [Persephone](#8--persephone) · 9. [Hekate](#9--hekate) ·
  10. [Athena](#10--athena) · 11. [Aphrodite](#11--aphrodite) · 12. [Kali](#12--kali)
- [District Varyasyon Sistemi](#district-varyasyon-sistemi)
- [Selene — Tam District Evrimi (Referans)](#selene--tam-district-evrimi-referans)
- [Veri Modeli (JSON benzeri)](#veri-modeli-json-benzeri)

---

## Okuma Anahtarı

Her tanrıça **bir frekans paketidir.** Bu paket iki şeyi besler:
1. **AI pipeline** — prompt fragment'leri (Avatar Bible, Bölüm 6, aşama [3]).
2. **3B render** — material/ışık preset'leri (Avatar Bible, Bölüm 9).

Tanrıça = sabit kimlik DNA'sı. District = o DNA'nın üzerine giydirilen frekans
projeksiyonu. Formül:

```
final_style = goddess_dna  ⊕  district_modifier
            ( kimlik+sembol )   ( ışık+ortam+ton )
```

Çakışmada: **tanrıça** kimlik ve sembolü yönetir; **district** ışık ve ortamı.
Yani Bazaar'daki Hekate hâlâ Hekate'dir — sadece lüks ışıkla sarılır.

---

## 14 DNA Alanı

Her tanrıça aşağıdaki 14 alanla tanımlanır:

| # | Alan | Ne işe yarar |
|---|---|---|
| 1 | **İsim** | Arketip kimliği (slug + görünen ad) |
| 2 | **Köken** | Mitolojik kaynak + Caelinus anlamı |
| 3 | **Renk Paleti** | Birincil / ikincil / vurgu renkleri |
| 4 | **Aura** | Çevresindeki enerji alanının görsel dili |
| 5 | **Saç Dili** | Saç dokusu, biçim, hareket |
| 6 | **Kıyafet Dili** | Silüet, kumaş, drape |
| 7 | **Takı Dili** | Metal, taş, motif |
| 8 | **Semboller** | İkonografi seti |
| 9 | **Işık Dili** | Render ışık imzası |
| 10 | **District İlişkileri** | Doğal yuva + güçlü/zayıf district'ler |
| 11 | **Avatar Prompt Dili** | Pipeline için çekirdek prompt cümlesi |
| 12 | **Portrait Dili** | Yüz/büst odaklı çıktı yönergesi |
| 13 | **Fashion Dili** | Tam boy giyimli çıktı yönergesi |
| 14 | **3D Avatar Dili** | GLB/material/rig yönergesi |

---

## District Frekans Tablosu

District modifier'ları (Avatar Bible Bölüm 4 ile aynı). Registry'deki gerçek
`accent`/`glow`/`env` değerleri referans alınmıştır.

| District | Frekans | Accent | Ortam (env) | Işık tonu |
|---|---|---|---|---|
| **Source** | Saf köken | beyaz-altın | cosmic-birth | arınmış, yumuşak yüksek ışık |
| **Mirror** | Yansıma | gümüş-cam | mirror-gate | çift/simetrik, soğuk parıltı |
| **Gaia** | Köklülük | `#79e6a0` yeşil-altın | living-garden | sıcak yaprak ışığı |
| **Bazaar** | Lüks | `#ffe9b8` altın | mirror-gate | zengin sıcak glow |
| **Atelier** | Zanaat | bronz-fildişi | studio | net stüdyo ışığı |
| **Sanri** | Bilinç | `#c9d4e6` mor-gümüş | moonlit-temple | ay ışığı, düşük anahtar |
| **Sanctuary** | Şifa | pastel-altın | sanctuary | yumuşak koruyucu ışık |
| **Temple of Silence** | Sessizlik | monokrom | temple-void | derin durağan, minimal |

---

# 12 Tanrıça

## 1 · Selene
- **İsim:** `selene` — Selene, Ay Tanrıçası
- **Köken:** Yunan ay tanrıçası. Caelinus'ta: sezgi, gece bilgeliği, döngüler.
- **Renk Paleti:** birincil gümüş-mavi · ikincil gece laciverti · vurgu ay beyazı
- **Aura:** sisli gümüş hale, yavaş dalgalanan parıltı, soğuk ay sisi
- **Saç Dili:** uzun, akan, hafif ışıldayan; ay ışığı vurguları; yumuşak dalga
- **Kıyafet Dili:** akan ipek, asimetrik drape, ay ışığı pırıltılı kumaş
- **Takı Dili:** hilal alın takısı, gümüş, opal, inci dizileri
- **Semboller:** hilal, ayna, inci, gece çiçeği
- **Işık Dili:** soğuk ay ışığı, yumuşak mavi rim-light, sisli gloom
- **District İlişkileri:** doğal yuva → **Sanri**; güçlü → Mirror, Source;
  zayıf → Bazaar (lüksü onun dinginliğini bozar)
- **Avatar Prompt Dili:** *"ethereal moon goddess, silver-blue luminescence,
  crescent diadem, flowing silk, serene gaze, soft moonlit rim light"*
- **Portrait Dili:** yüz dingin ve dalgın; gümüş rim; arka plan gece sisi;
  hilal alın takısı net
- **Fashion Dili:** tam boy akan ipek elbise, asimetrik drape, ay ışığı pırıltısı,
  yavaş hareket hissi
- **3D Avatar Dili:** sedefli/ışıldayan cilt shader, gümüş-mavi emisyon kenar,
  saç hafif anisotropik parıltı

## 2 · Gaia
- **İsim:** `gaia` — Gaia, Toprak Ana
- **Köken:** İlksel toprak tanrıçası. Caelinus'ta: köklülük, bereket, şifa.
- **Renk Paleti:** birincil yosun yeşili · ikincil toprak kahvesi · vurgu altın buğday
- **Aura:** yeşil-altın canlı parıltı, etrafında uçuşan polen/ışık zerreleri
- **Saç Dili:** kalın, doğal, içine örülmüş yaprak/dal; toprak tonları
- **Kıyafet Dili:** organik dokuma, yaprak katmanları, doğal lif, akışkan
- **Takı Dili:** ahşap, kehribar, yeşim, canlı bitki örgüsü
- **Semboller:** sarmaşık, tohum, kutsal çember, ağaç kökü
- **Işık Dili:** sıcak öğleden sonra ışığı, yapraktan süzülen dappled light
- **District İlişkileri:** doğal yuva → **Gaia**; güçlü → Sanctuary, Source;
  zayıf → Mirror (yapaylık onun organikliğine ters)
- **Avatar Prompt Dili:** *"earth mother goddess, moss-green and gold, woven
  organic robes, vines in hair, warm dappled forest light, abundant living aura"*
- **Portrait Dili:** sıcak yüz, saçta yapraklar, altın-yeşil ışık, toprak arka plan
- **Fashion Dili:** katmanlı organik elbise, yaprak detayları, doğal akış,
  bereket hissi
- **3D Avatar Dili:** alt-surface scatter sıcak cilt, gerçek geometri yapraklar,
  yumuşak yeşil ortam ışığı

## 3 · Freya
- **İsim:** `freya` — Freya, Aşk ve Savaş Tanrıçası
- **Köken:** İskandinav tanrıçası. Caelinus'ta: tutku, cesaret, vahşi özgürlük.
- **Renk Paleti:** birincil kızıl altın · ikincil kan kırmızısı · vurgu kehribar
- **Aura:** altın kıvılcımlar, sıcak enerji dalgaları, hareketli ışık
- **Saç Dili:** gür, dalgalı, kızıl-altın; rüzgârda savrulan; örgü detayları
- **Kıyafet Dili:** zırh + ipek karışımı, tüy detayları, güçlü silüet
- **Takı Dili:** altın torc, kehribar, dövülmüş metal
- **Semboller:** şahin tüyü, kehribar kolye, kılıç, kedi
- **Işık Dili:** sıcak gün batımı, dramatik kontrast, altın spot
- **District İlişkileri:** doğal yuva → **Bazaar**; güçlü → Atelier, Source;
  zayıf → Temple of Silence (vahşiliği sessizliğe ters)
- **Avatar Prompt Dili:** *"warrior love goddess, red-gold and amber, armor-silk
  fusion, falcon feathers, fierce confident gaze, dramatic sunset light"*
- **Portrait Dili:** güçlü/kararlı bakış, kehribar takı, altın gün batımı kontrast
- **Fashion Dili:** zırh-elbise füzyon, tüy aksanı, güçlü omuz, hareket ve güç
- **3D Avatar Dili:** metalik zırh PBR + ipek kumaş simülasyonu, sıcak rim, kıvılcım partikül

## 4 · Sophia
- **İsim:** `sophia` — Sophia, Bilgelik Tanrıçası
- **Köken:** Gnostik bilgelik figürü. Caelinus'ta: içgörü, kutsal geometri, sükûnet.
- **Renk Paleti:** birincil derin lacivert · ikincil beyaz altın · vurgu ışık mavisi
- **Aura:** sakin mavi-beyaz hale, ince ışık halkaları, geometrik parıltı
- **Saç Dili:** düzgün, asil, toplanmış veya yumuşak; temiz çizgi
- **Kıyafet Dili:** mimari kıvrımlar, temiz çizgiler, asil heykelsi drape
- **Takı Dili:** ince altın geometri, beyaz taş, halka motifleri
- **Semboller:** kitap, kutsal geometri, güvercin, yıldız haritası
- **Işık Dili:** berrak yüksek ışık, geniş soft fill, gölgesiz dinginlik
- **District İlişkileri:** doğal yuva → **Source**; güçlü → Sanri, Mirror;
  zayıf → Bazaar (gösteriş onun sadeliğine ters)
- **Avatar Prompt Dili:** *"wisdom goddess, deep navy and white-gold, architectural
  drapery, sacred geometry halo, serene knowing gaze, clear luminous light"*
- **Portrait Dili:** dingin bilge yüz, ince altın geometri takı, berrak ışık
- **Fashion Dili:** heykelsi temiz elbise, mimari kıvrım, asil duruş
- **3D Avatar Dili:** mat zarif kumaş, ince emisyonlu geometri halka, berrak nötr ışık

## 5 · Artemis
- **İsim:** `artemis` — Artemis, Av ve Vahşi Doğa Tanrıçası
- **Köken:** Yunan av tanrıçası. Caelinus'ta: bağımsızlık, odak, koruyuculuk.
- **Renk Paleti:** birincil orman yeşili · ikincil gümüş · vurgu soğuk gri-mavi
- **Aura:** keskin gümüş kontur, soğuk net enerji, az ama belirgin
- **Saç Dili:** pratik, toplanmış, atletik; örgü/at kuyruğu; sade
- **Kıyafet Dili:** hareket özgürlüğü, kısa tunik, deri detay, atletik silüet
- **Takı Dili:** sade gümüş, kemik/boynuz, minimal
- **Semboller:** yay-ok, geyik, hilal, orman
- **Işık Dili:** alacakaranlık orman ışığı, dappled, soğuk net kontur
- **District İlişkileri:** doğal yuva → **Gaia**; güçlü → Source, Sanctuary;
  zayıf → Bazaar (lükse uzak)
- **Avatar Prompt Dili:** *"huntress goddess, forest-green and silver, short athletic
  tunic, bow, focused fierce eyes, cold dappled twilight forest light"*
- **Portrait Dili:** odaklı keskin bakış, sade gümüş takı, alacakaranlık orman
- **Fashion Dili:** atletik kısa tunik, deri aksesuar, hareket hazır duruş
- **3D Avatar Dili:** atletik rig, mat deri/kumaş, soğuk gümüş rim, doğal gölge

## 6 · Isis
- **İsim:** `isis` — Isis, Sihir ve Annelik Tanrıçası
- **Köken:** Mısır tanrıçası. Caelinus'ta: koruma, sihir, kraliçelik, yaşam gücü.
- **Renk Paleti:** birincil lapis lazuli mavisi · ikincil altın · vurgu turkuaz
- **Aura:** altın kanat izi, ihtişamlı hale, görkemli parıltı
- **Saç Dili:** Mısır siluети, düz/kuşatılmış, altın bantlı; görkemli
- **Kıyafet Dili:** kanat drape, altın yaka, Mısır silüeti, görkemli
- **Takı Dili:** geniş altın yaka, lapis, scarabe, taç
- **Semboller:** kanatlar, ankh, taht, Sirius yıldızı
- **Işık Dili:** görkemli altın ışık, parlak vurgular, tapınak parıltısı
- **District İlişkileri:** doğal yuva → **Sanctuary**; güçlü → Bazaar, Temple;
  zayıf → Artemis-vari sadelik district'leri yok (her yerde güçlü)
- **Avatar Prompt Dili:** *"egyptian magic goddess, lapis blue and gold, winged
  drape, broad gold collar, ankh, regal protective gaze, majestic golden light"*
- **Portrait Dili:** görkemli yüz, geniş altın yaka, lapis taç, tapınak ışığı
- **Fashion Dili:** kanat drape elbise, altın yaka, kraliçe duruşu
- **3D Avatar Dili:** altın metalik PBR yaka, kanat geometri/şeffaf doku, sıcak görkem ışık

## 7 · Inanna
- **İsim:** `inanna` — Inanna, Gök Kraliçesi
- **Köken:** Sümer tanrıçası. Caelinus'ta: güç, tutku, yükseliş-iniş, kozmik egemenlik.
- **Renk Paleti:** birincil yıldız moru · ikincil altın · vurgu gece mavisi
- **Aura:** mor-altın kozmik tozsu hale, yıldız bokeh
- **Saç Dili:** hacimli, kraliyet; yıldız tokalı; yukarı doğru görkemli
- **Kıyafet Dili:** kraliyet drape, yıldız işlemeleri, güçlü omuz hattı
- **Takı Dili:** çok katlı altın, yıldız broş, lapis
- **Semboller:** sekiz köşeli yıldız, aslan, kapı, taç
- **Işık Dili:** kozmik gece + altın spot, yıldız parıltısı
- **District İlişkileri:** doğal yuva → **Bazaar**; güçlü → Source, Mirror;
  zayıf → Gaia (kozmik enerji toprağa uzak)
- **Avatar Prompt Dili:** *"queen of heaven goddess, star-purple and gold, royal
  embroidered drape, eight-point star crown, commanding gaze, cosmic night light"*
- **Portrait Dili:** egemen bakış, yıldız taç, mor-altın kozmik arka plan
- **Fashion Dili:** kraliyet drape, yıldız işleme, güçlü omuz, görkemli yükseliş
- **3D Avatar Dili:** mor-altın emisyon işlemeler, yıldız partikül halesi, kozmik HDR

## 8 · Persephone
- **İsim:** `persephone` — Persephone, Yeraltı ve Bahar Tanrıçası
- **Köken:** Yunan ikilik tanrıçası. Caelinus'ta: dönüşüm, mevsim, ölüm-yeniden doğuş.
- **Renk Paleti:** birincil nar kırmızısı · ikincil gül pembesi · vurgu kömür siyahı
- **Aura:** pembe-siyah geçişli, dönüşen renk alanı (ikilik)
- **Saç Dili:** çiçekli ama gölgeli; yarı örgü yarı serbest; iki-tonlu
- **Kıyafet Dili:** iki-yüzlü palet (yarı çiçek yarı gölge), katmanlı geçiş
- **Takı Dili:** nar taneleri, altın taç, koyu taşlar
- **Semboller:** nar, asfodel çiçeği, taç, eşik
- **Işık Dili:** yarı sıcak yarı soğuk, dramatik geçiş ışığı
- **District İlişkileri:** doğal yuva → **Mirror**; güçlü → Gaia, Sanri;
  zayıf → tek-tonlu Temple (ikiliği sessizliğe direnir)
- **Avatar Prompt Dili:** *"goddess of duality, pomegranate red and rose with charcoal,
  half-bloom half-shadow gown, crown, transformative gaze, split warm-cold light"*
- **Portrait Dili:** yüzün yarısı sıcak yarısı soğuk, nar motifi, geçiş ışığı
- **Fashion Dili:** iki-yüzlü elbise (çiçek/gölge), katmanlı dönüşüm silüeti
- **3D Avatar Dili:** çift-bölge shader (bloom/charcoal), gradyan ışık, geçiş emisyonu

## 9 · Hekate
- **İsim:** `hekate` — Hekate, Eşik ve Büyü Tanrıçası
- **Köken:** Yunan kavşak/büyü tanrıçası. Caelinus'ta: eşikler, dönüşüm, gizem.
- **Renk Paleti:** birincil mürdüm moru · ikincil antrasit · vurgu fosforlu yeşil
- **Aura:** mor-siyah duman, kıvılcımlanan eşik enerjisi
- **Saç Dili:** uzun, gölgeli, hareketli; kapüşon altında; karanlık parıltı
- **Kıyafet Dili:** koyu kat kat pelerin, kapüşon, akan gölgeler
- **Takı Dili:** anahtar motifleri, oksitlenmiş gümüş, obsidyen
- **Semboller:** üç yol, anahtar, meşale, yılan, ay-yıldız
- **Işık Dili:** meşale alevi + soğuk gölge, düşük anahtar (low-key)
- **District İlişkileri:** doğal yuva → **Sanri**; güçlü → Mirror, Temple;
  zayıf → Bazaar (gizemi lükse karışmaz, ama dramatik kontrast verir)
- **Avatar Prompt Dili:** *"goddess of thresholds, plum-purple and charcoal with
  phosphor green, layered hooded cloak, keys, mysterious gaze, torch + cold shadow"*
- **Portrait Dili:** kapüşon gölgesinde gizemli yüz, anahtar takı, meşale ışığı
- **Fashion Dili:** kat kat pelerin, kapüşon, akan gölge, eşik duruşu
- **3D Avatar Dili:** koyu kumaş simülasyonu, mor-yeşil emisyon vurgu, meşale ışık + duman partikül

## 10 · Athena
- **İsim:** `athena` — Athena, Strateji ve Zanaat Tanrıçası
- **Köken:** Yunan akıl tanrıçası. Caelinus'ta: strateji, zanaat, onurlu güç.
- **Renk Paleti:** birincil zeytin yeşili · ikincil bronz · vurgu fildişi
- **Aura:** sakin bronz-altın kontur, dengeli net enerji
- **Saç Dili:** düzgün, toplanmış, asil; miğfer/bant ile; kontrollü
- **Kıyafet Dili:** mimari zırh-drape, heykelsi temiz kıvrımlar
- **Takı Dili:** bronz, sade altın, kalkan motifi
- **Semboller:** baykuş, zeytin dalı, kalkan, miğfer
- **Işık Dili:** net gündüz ışığı, heykelsi modelleme, dengeli
- **District İlişkileri:** doğal yuva → **Atelier**; güçlü → Source, Mirror;
  zayıf → Sanri (akılcılığı rüya-mantığına mesafeli)
- **Avatar Prompt Dili:** *"strategy goddess, olive-green and bronze, architectural
  armor-drape, owl, composed dignified gaze, clear sculptural daylight"*
- **Portrait Dili:** onurlu sakin yüz, bronz takı, kalkan/baykuş aksanı, net ışık
- **Fashion Dili:** heykelsi zırh-drape, temiz kıvrım, dengeli güçlü duruş
- **3D Avatar Dili:** bronz metalik + mat kumaş, heykelsi key light, kontrollü gölge

## 11 · Aphrodite
- **İsim:** `aphrodite` — Aphrodite, Aşk ve Güzellik Tanrıçası
- **Köken:** Yunan aşk tanrıçası. Caelinus'ta: çekim, uyum, zarafet.
- **Renk Paleti:** birincil sedef pembe · ikincil deniz köpüğü · vurgu gül altını
- **Aura:** ışıltılı pembe-altın sis, köpüksü yumuşak ışık
- **Saç Dili:** uzun, dalgalı, ışıltılı; deniz esintisi hissi; yumuşak
- **Kıyafet Dili:** akışkan şeffaf katmanlar, deniz köpüğü dokusu
- **Takı Dili:** inci, sedef, gül altını, ince zincirler
- **Semboller:** deniz kabuğu, gül, güvercin, köpük
- **Işık Dili:** yumuşak pembe glow, sedef parıltı, soft bloom
- **District İlişkileri:** doğal yuva → **Bazaar**; güçlü → Atelier, Mirror;
  zayıf → Temple of Silence (zarafeti sessizliğe değil görünürlüğe doğru)
- **Avatar Prompt Dili:** *"goddess of beauty, pearl-pink and seafoam with rose-gold,
  flowing sheer layers, pearls, alluring soft gaze, dreamy pink bloom light"*
- **Portrait Dili:** zarif çekici yüz, inci takı, sedef parıltı, yumuşak pembe glow
- **Fashion Dili:** akışkan şeffaf katmanlı elbise, gül altını detay, zarif akış
- **3D Avatar Dili:** sedefli cilt shader, şeffaf kumaş katman, pembe soft bloom post

## 12 · Kali
- **İsim:** `kali` — Kali, Dönüşüm ve Yıkım Tanrıçası
- **Köken:** Hindu dönüşüm tanrıçası. Caelinus'ta: korkusuzluk, yıkıp yeniden yaratma.
- **Renk Paleti:** birincil gece siyahı · ikincil kan kırmızısı · vurgu indigo
- **Aura:** koyu alev dili, yoğun titreşen enerji
- **Saç Dili:** uzun, vahşi, serbest; siyah; hareketli ve dramatik
- **Kıyafet Dili:** dramatik siyah, kırmızı vurgu, güçlü dik silüet
- **Takı Dili:** koyu metal, kırmızı taş, sembolik motifler
- **Semboller:** kılıç, lotus, üçüncü göz, alev
- **Işık Dili:** sert kontrast, kırmızı rim, derin gölge
- **District İlişkileri:** doğal yuva → **Mirror** (yüzleşme); güçlü → Temple,
  Sanri; zayıf → Gaia, Sanctuary (yıkıcılığı şifaya/toprağa ters)
- **Avatar Prompt Dili:** *"goddess of transformation, night-black and blood-red with
  indigo, dramatic dark robes, sword, fearless intense gaze, hard red-rim contrast light"*
- **Portrait Dili:** korkusuz yoğun yüz, üçüncü göz, koyu metal takı, kırmızı rim
- **Fashion Dili:** dramatik siyah elbise, kırmızı vurgu, dik güçlü silüet
- **3D Avatar Dili:** koyu cilt + kırmızı emisyon rim, dramatik tek key, alev partikül

---

## District Varyasyon Sistemi

Her tanrıça 8 district'te farklı **evrilir.** Tüm 12×8 = 96 kombinasyon aynı
mantığı izler:

- **Sabit kalan:** İsim, kimlik DNA'sı (yüz/beden), sembol seti, temel renk kimliği.
- **District'e göre kayan (shift):** ışık tonu, ortam (env), kumaş zenginliği,
  aura yoğunluğu, sade↔görkemli ekseni.

Aşağıda **Selene tam referans** olarak 5+ district'te açılır (kullanıcının
örneğindeki gibi); diğer 11 tanrıça için aynı kayma kuralları uygulanır.

### Genel district kayma kuralları (her tanrıça için)

| District | Tanrıçaya ne yapar |
|---|---|
| **Source** | En arınmış hal — sembolleri sadeleştir, beyaz-altın ışık, minimal kıyafet, "doğuş" anı |
| **Mirror** | Simetri + cam yüzeyler, çift ışık; tanrıça kendiyle yüzleşir; yansıma motifi eklenir |
| **Gaia** | Organik katman — kıyafete doğal lif/yaprak, yeşil-altın ışık, köklenme |
| **Bazaar** | Maksimum lüks — kumaş zenginleşir, mücevher artar, sıcak altın glow, görkem |
| **Atelier** | Couture detay — dikiş/drape vurgusu, stüdyo ışığı, "yapım aşaması" estetiği |
| **Sanri** | Bilinç/rüya — ay ışığı, mor-gümüş kayma, sembol bulanıklaşır, gizem artar |
| **Sanctuary** | Şifa — yumuşar, pastel-altın, koruyucu hale, sakinleşir |
| **Temple of Silence** | Sessizlik — neredeyse monokrom, en sade silüet, derin durağan ışık |

---

## Selene — Tam District Evrimi (Referans)

> Aynı tanrıçanın district'e göre nasıl evrildiğinin tam örneği. Kimlik
> (yüz/beden) ve çekirdek (hilal, gümüş, ay) hep sabit; çevre ve yoğunluk değişir.

### Selene → Source
*Saf ay doğuşu.* Hilal en sade haliyle, neredeyse çıplak ışık. Beyaz-altın
kozmik doğuş ışığı gümüş-maviyi yumuşatır. Tek bir akan beyaz ipek, minimal takı.
Aura çok ince. Bu, Selene'nin "ilk an"ı — henüz tam form almamış ay.

### Selene → Mirror
*Kendiyle yüzleşen ay.* Simetrik kompozisyon; arkasında/yanında cam-ayna yüzey,
ikinci bir Selene yansıması. Soğuk çift rim-light. Ayna sembolü (zaten DNA'sında)
burada baskın motif olur. Gümüş daha keskin, daha net.

### Selene → Bazaar
*Lüks ay.* En zengin varyant. İpek ağırlaşır, inci dizileri çoğalır, hilal takı
mücevherle bezenir. Sıcak altın Bazaar glow'u soğuk gümüşle çarpışır → ay ışığı +
mum ışığı füzyonu. Selene burada görkemlidir ama hâlâ dingin. (Not: doğal yuvası
değil; kontrast yüzünden çarpıcı ama "yabancı" hisseder — kasıtlı.)

### Selene → Atelier
*Yapım aşamasındaki ay.* Drape ve dikiş görünür; ipeğin nasıl aktığı vurgulanır.
Net stüdyo ışığı altında gümüş-mavi kumaşın dokusu öne çıkar. Couture detay:
asimetrik drape'in mimarisi sergilenir. Takı bronz-gümüş karışımı.

### Selene → Sanri
*Doğal yuva — bilinç ayı.* En güçlü, en otantik Selene. Tam ay ışığı, mor-gümüş
moonlit-temple ortamı (Sanri `accent #c9d4e6`). Sembolleri (ayna, hilal, gece
çiçeği) hafif bulanık, rüya-gibi. Aura en yoğun. Düşük anahtar gizem. Selene
burada "evindedir".

### Selene → Sanctuary
*Şifa ayı.* Yumuşar; gümüş-mavi pastelleşir, sıcak bir koruyucu hale eklenir.
Sert gölge yok, her şey sakin. Selene burada bir teselli figürü — gece bekçisi
değil, gece şifacısı.

### Selene → Temple of Silence
*Sessiz ay.* Neredeyse monokrom gümüş-gri. En sade silüet, tek akan kumaş,
takı minimal/yok. Derin durağan ışık, hareket yok. Aura neredeyse görünmez.
Selene burada saf varlıktır — söze ve gösterişe gerek duymayan ay.

> **Diğer 11 tanrıça** aynı 8 kaymadan geçer. Örn: *Kali → Sanctuary* yumuşar
> ama tehlikeli kalır (şifa için yıkım); *Gaia → Bazaar* organik lüks olur
> (yapay değil zengin doğa); *Athena → Sanri* akıl rüyayla buluşur (en zorlu
> kombinasyon, kasıtlı gerilim).

---

## Veri Modeli (JSON benzeri)

> Sadece şema önerisi — kod değil. Üretimde `data/goddess-archetypes.ts` benzeri
> **saf veri** dosyasında (district registry deseni: server-only import yok)
> yaşamalı. Avatar Bible Bölüm 7'deki `avatar_styles` / `district_variants`
> tabloları bu şemadan beslenir.

### GoddessArchetype (tek tanrıça)

```jsonc
{
  "id": "selene",                       // slug — avatar_generations.archetype ile eşleşir
  "name": { "tr": "Selene", "en": "Selene" },
  "title": { "tr": "Ay Tanrıçası", "en": "Moon Goddess" },
  "origin": {
    "myth": "Yunan ay tanrıçası",
    "caelinus": "Sezgi, gece bilgeliği, döngüler"
  },
  "palette": {
    "primary": "#9fb8d8",               // gümüş-mavi
    "secondary": "#1b2540",             // gece laciverti
    "accent": "#eef3ff",                // ay beyazı
    "tone": "cosmic"                    // mevcut data/archetypes.ts tonu ile köprü
  },
  "aura": "Sisli gümüş hale, yavaş dalgalanan parıltı",
  "hair": "Uzun, akan, ay ışığı vurgulu, yumuşak dalga",
  "clothing": "Akan ipek, asimetrik drape, ay ışığı pırıltısı",
  "jewelry": "Hilal alın takısı, gümüş, opal, inci",
  "symbols": ["crescent", "mirror", "pearl", "night-flower"],
  "light": "Soğuk ay ışığı, yumuşak mavi rim-light, sisli gloom",
  "districts": {
    "home": "sanri",                    // doğal yuva
    "strong": ["mirror", "source"],
    "weak": ["bazaar"]
  },
  "promptLanguage": {
    "avatar":   "ethereal moon goddess, silver-blue luminescence, crescent diadem...",
    "portrait": "serene distant face, silver rim, crescent diadem sharp, night mist bg",
    "fashion":  "full-body flowing silk gown, asymmetric drape, moonlit shimmer",
    "model3d":  "pearlescent skin shader, silver-blue emissive rim, anisotropic hair"
  }
}
```

### DistrictVariant (tanrıça × district kaydı)

```jsonc
{
  "id": "selene--sanri",
  "archetype": "selene",
  "districtKey": "sanri",               // lib/district/registry.ts anahtarıyla aynı
  "role": "home",                       // home | strong | neutral | weak
  "shift": {
    "light": "moonlit-temple, full moon, low-key",
    "env": "moonlit-temple",            // registry blender.env ile uyumlu
    "accent": "#c9d4e6",                // registry'den türetilir
    "richness": "low",                  // sade↔görkemli ekseni: low|medium|high
    "auraIntensity": "high",
    "symbolFocus": "mirror, crescent (dreamlike, blurred)"
  },
  "promptOverlay": "dreamlike moonlit temple, soft blurred symbols, intense aura",
  "cachedGenerationId": null            // Avatar Bible §7 ile köprü
}
```

### Üst kümeler

```jsonc
{
  "goddesses": [ /* 12 × GoddessArchetype */ ],
  "districtVariants": [ /* 12 × 8 = 96 × DistrictVariant */ ],
  "districtRules": {
    "source":   { "richness": "low",    "lightBias": "white-gold purified" },
    "mirror":   { "richness": "medium", "lightBias": "symmetric cold reflection" },
    "gaia":     { "richness": "medium", "lightBias": "warm leaf-dappled" },
    "bazaar":   { "richness": "high",   "lightBias": "rich warm gold glow" },
    "atelier":  { "richness": "medium", "lightBias": "clean studio" },
    "sanri":    { "richness": "low",    "lightBias": "moonlit low-key" },
    "sanctuary":{ "richness": "medium", "lightBias": "soft pastel protective" },
    "temple":   { "richness": "low",    "lightBias": "deep still monochrome" }
  }
}
```

> **İlke:** `goddess_dna` sabit veri; `districtVariant.shift` ⊕ uygulanır.
> AI pipeline `promptLanguage[layer]` + `promptOverlay`'i birleştirir;
> 3B render `palette` + `shift.light/env`'i material/ışık preset'ine çevirir.

---

*Bu doküman [`CAELINUS_AVATAR_BIBLE.md`](./CAELINUS_AVATAR_BIBLE.md)'nin DNA
ekidir. İkisi birlikte okunur. Kod yazılmadan önce tek doğru kaynaktır.*
