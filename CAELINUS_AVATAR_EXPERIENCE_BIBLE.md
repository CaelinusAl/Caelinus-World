# CAELINUS AVATAR EXPERIENCE BIBLE

> **Kullanıcının ilk girişinden kendi Tanrıça Avatarını doğurmasına, kaydetmesine
> ve district'lerde kullanmasına kadar tüm deneyim akışı.**
> Sürüm: 0.1 (deneyim tasarımı) · Tarih: 2026-06-18
> Statü: **Sadece sistem ve deneyim tasarımı.** Kod değildir.
>
> Üst dokümanlar:
> - [`CAELINUS_AVATAR_BIBLE.md`](./CAELINUS_AVATAR_BIBLE.md) — mimari
> - [`CAELINUS_GODDESS_ARCHETYPES_BIBLE.md`](./CAELINUS_GODDESS_ARCHETYPES_BIBLE.md) — DNA
>
> Uyum: District Engine (`lib/district/registry.ts`), Caelinus Avatar Core
> (QR desktop↔mobile köprüsü), World Map, Blender Pipeline.
>
> **Ton ilkesi:** Kullanıcı kendini bir uygulamada değil, bir **törende**
> hisseder. Her ekran bir eşik, her seçim bir niyet, her üretim bir doğuştur.

---

## İçindekiler

1. [İlk Giriş Ritüeli](#1--i̇lk-giriş-ritüeli)
2. [Avatar Doğum Akışı](#2--avatar-doğum-akışı)
3. [Seçim Ekranları](#3--seçim-ekranları)
4. [Avatar Çıktıları](#4--avatar-çıktıları)
5. [Avatar Galerisi](#5--avatar-galerisi)
6. [Avatar Evrimi](#6--avatar-evrimi)
7. [SANRI Bağlantısı](#7--sanri-bağlantısı)
8. [Bazaar Bağlantısı](#8--bazaar-bağlantısı)
9. [Atelier Bağlantısı](#9--atelier-bağlantısı)
10. [Temple of Silence Bağlantısı](#10--temple-of-silence-bağlantısı)
11. [UI / UX Prensipleri](#11--ui--ux-prensipleri)
12. [Cursor'a Aktarılacak Üretim Fazları](#12--cursora-aktarılacak-üretim-fazları)

---

## 1 · İlk Giriş Ritüeli

### Kullanıcı Caelinus'a nasıl karşılanır?

İlk giriş bir açılış sayfası değil, bir **eşik geçişidir.** Kullanıcı bir
"Kayıt Ol" formuyla değil, bir **çağrıyla** karşılanır:

> *"Bu evrende bir bedenin olacak. Hazır mısın?"*

Ekran karanlıktan açılır (mor alabaster + altın damar görsel DNA'sı). Tek bir
hareket: ışık yavaşça toplanır, bir silüet belirir — henüz boş, henüz form almamış
bir tanrıça hayaleti. Bu, kullanıcının "doğmamış avatarı"dır. Tek bir buton:

> **`Aynaya Yaklaş`** (Bazaar/Mirror dilinde) veya **`Doğuşa Başla`**

Hızlı atlama isteyen kullanıcı için sessiz bir `Şimdilik gez` linki altta durur —
zorlamadan, ama davet ederek.

### Avatar sistemi nasıl anlatılır?

Uzun açıklama yok. Üç nefeslik bir mikro-anlatı (3 ekran, kaydırarak geçilir):

1. *"Caelinus bir web sitesi değil. Yaşayan bir tanrıça evreni."*
2. *"Burada gezmek için bir bedene ihtiyacın var. Yüzünü ver — sana bir tanrıça geri dönsün."*
3. *"Kendin kalacaksın. Ama en parlak, en kutsal frekansında."*

Bu üç ekran isteğe bağlı atlanabilir; ama varsayılan olarak gösterilir.

### "Bu profil fotoğrafı değil, tanrıça kimliğin" hissi nasıl verilir?

- **Dil farkı:** Hiçbir yerde "fotoğraf yükle / avatar oluştur" denmez. Bunun
  yerine *"yüzünü ver", "kimliğini doğur", "frekansını seç"* kullanılır.
- **Görsel farkı:** Sonuç asla bir "yuvarlak profil resmi" çerçevesinde
  gösterilmez. Tam ekran, sinematik, mum/ay ışığında belirir.
- **Ritüel farkı:** Üretim anında bir bekleme animasyonu değil, bir **doğuş
  sekansı** oynar (ışık toplanır, sembol belirir, tanrıça "uyanır").
- **Tekillik:** *"Caelinus'taki tek kimliğin bu."* Profil fotoğrafı çoktur,
  değiştirilir; tanrıça kimliği birdir, evrilir.

---

## 2 · Avatar Doğum Akışı

Akış 7 eşikten oluşur. Her eşik tek bir niyet ister; ekranda aynı anda tek karar.

```
[1] YÜZ VERME        → selfie/foto (desktop: QR ile mobile; mobile: doğrudan)
[2] GİZLİLİK ONAYI   → kutsal söz: "yüzün korunacak"
[3] TANRIÇA SEÇİMİ   → 12 arketip
[4] DISTRICT SEÇİMİ  → hangi bölgede doğsun (varsayılan: Source)
[5] STİL YOĞUNLUĞU   → ne kadar dönüşüm (Hafif ↔ Tam Tanrıça)
[6] DOĞUŞ            → üretim sekansı (faz mesajlarıyla)
[7] SONUÇ EKRANI     → karşılaşma + kaydet/yeniden doğur
```

### [1] Yüz verme (Selfie yükleme)
- **Desktop:** QR kodu belirir → *"Telefonunla bu aynaya bak."* Mobil kamera
  açılır, kullanıcı selfie çeker/yükler, masaüstüne köprülenir. (Mevcut
  `caelinus-avatar-core` session sistemi.)
- **Mobile:** Doğrudan kamera/galeri.
- Mikro-metin: *"Net bir yüz, yumuşak ışık. Tanrıçan senin çizgilerinden doğacak."*

### [2] Gizlilik onayı
Bir uyarı kutusu değil, bir **söz.** Tören dilinde ama yasal olarak net:

> *"Yüzün kutsaldır. Sadece tanrıçanı doğurmak için kullanılır, kimseyle
> paylaşılmaz, istediğin an silinir."*
> `Kabul ediyorum` · ince link: *Bu nasıl korunur?*

Arka planda gerçek anlamı (Avatar Bible §8): ham selfie `references/` altında
**özeldir**, public değildir, kullanıcı silince hard-delete edilir.

### [3] Tanrıça arketipi seçimi
12 tanrıça kartı (Bölüm 3'te detay). İsteğe bağlı: yüz/frekans okumasına dayalı
bir **öneri** ("Sana en yakın frekans: Selene") — ama seçim her zaman kullanıcının.

### [4] District varyasyonu seçimi
*"Tanrıçan nerede doğsun?"* — 8 district. Varsayılan **Source** (saf doğuş).
Kullanıcı atlarsa Source'ta doğar, sonra başka district'lerde evrilir.

### [5] Stil yoğunluğu seçimi
Tek bir kaydırıcı: **Hafif ↔ Dengeli ↔ Tam Tanrıça.**
- *Hafif:* sana çok benzer, ince bir tanrıça dokunuşu.
- *Dengeli:* kimlik korunur, frekans güçlüdür (varsayılan).
- *Tam Tanrıça:* en sinematik, en dönüştürülmüş.

(Teknik karşılığı: pipeline aşama [3]–[5] yoğunluk parametresi; kimlik koruması
[2] her durumda sabit.)

### [6] Doğuş (Avatar üretimi)
Bir "loading spinner" değil. **Doğuş sekansı:**
- Ekran kararır, ışık toplanır.
- Faz mesajları sırayla belirir (mevcut `phase-messages.ts` deseni), tören dilinde:
  *"Kimliğin okunuyor…" → "Frekansın çağrılıyor…" → "Tanrıçan uyanıyor…"*
- Seçili arketibin sembolü (hilal, sarmaşık, anahtar…) yavaşça parlar.

### [7] Sonuç ekranı
Bir "indir" düğmesi değil, bir **karşılaşma.** Tanrıça tam ekran belirir
(Universe katmanı, seçili district sahnesinde). Altında:
- *"İşte sen. {Arketip} olarak, {District}'te doğdun."*
- **`Bu benim`** (kaydet → canonical olur) · **`Yeniden doğur`** (regenerate)
- İkincil: *Portrait'i gör · Fashion'ı gör* (3 katmanı incele)

---

## 3 · Seçim Ekranları

### 12 tanrıça nasıl gösterilir?
- **Mobil öncelikli:** dikey kaydırılan kartlar / yatay carousel. Her kart tam
  görsel — arketibin temsili tanrıça görseli (mor alabaster + altın DNA).
- Kart üstünde: **isim** + **tek kelime frekans** (Selene → *Sezgi*, Kali →
  *Dönüşüm*, Gaia → *Köklülük*).
- Karta dokununca açılır panel: 1 cümlelik öz + renk paleti şeridi + sembol.
- **Aşırı bilgi yok.** Kullanıcı 12 tanrıçayı bir mezuniyet kataloğu gibi değil,
  bir tarot destesi gibi görür — sezgiyle seçer.

### Kullanıcının gördüğü kısa metinler (örnek)
| Tanrıça | Frekans | Açılış cümlesi |
|---|---|---|
| Selene | Sezgi | *"Gecenin ve döngülerin sessiz bilgeliği."* |
| Gaia | Köklülük | *"Toprağın bereketi, şifanın kaynağı."* |
| Freya | Tutku | *"Aşk ve cesaretin vahşi özgürlüğü."* |
| Hekate | Eşik | *"Kavşaklarda duran, dönüşümün anahtarı."* |
| Kali | Dönüşüm | *"Yıkıp yeniden yaratan korkusuz güç."* |
| Athena | Akıl | *"Strateji, zanaat ve onurlu güç."* |
| … | … | (12'sinin tamamı Goddess Bible'dan beslenir) |

### District varyasyonları nasıl gösterilir?
- Tanrıça seçildikten sonra, aynı tanrıçanın **mini önizlemeleri** district'lere
  göre dizilir: *"Selene nerede doğsun?"* altında 8 küçük varyant.
- Her varyant kartında: district adı + tek kelime (Sanri → *Bilinç*, Bazaar →
  *Lüks*, Temple → *Sessizlik*) + o varyantın ışık/aura imzası önizlemesi.
- **Yuva vurgusu:** Tanrıçanın doğal yuvası (Goddess Bible `districts.home`)
  ince bir işaretle öne çıkar: *"Selene burada en güçlü."* (Sanri için.)

---

## 4 · Avatar Çıktıları

Her doğuş 3 katman üretir; 4. katman (3D) zamanla olgunlaşır.

| Çıktı | Ne | Nerede kullanılır |
|---|---|---|
| **Portrait Avatar** | Yüz/büst, tanrıça portresi | Profil kimliği (`caelinus_avatar_url`), yorum/katkı avatarı, Sanri okuma kartları, üye ağı (members network) |
| **Fashion Avatar** | Tam boy, giyimli figür | Bazaar try-on, Atelier stil deneme, koleksiyon üzerinde gösterim, "frekansını giy" akışı |
| **Universe Avatar** | Avatar + district sahnesi, tam kompozisyon | Kahraman/paylaşım görseli, sonuç ekranı, galeri kapağı, sosyal paylaşım kartı |
| **3D GLB Avatar** | Riglenmiş 3B beden | District Engine 3B sahneleri (R3F), Bazaar 3B plaza, gelecekte gerçek-zamanlı gezinme |

İlkeler:
- Portrait en hızlı/ucuz, kimlik koruması en kritik burada.
- Fashion, mevcut `try-on-variants` sistemine köprü.
- Universe en pahalı, en etkileyici — paylaşılabilir "kartvizit".
- 3D başlangıçta boş (`glb_path: null`), Faz 6'da dolar.

---

## 5 · Avatar Galerisi

Galeri bir "dosya yöneticisi" değil, bir **tapınak nişidir** — kullanıcının
doğurduğu tüm tanrıça formları.

### Kaç avatar saklanır?
- **Aktif avatar:** her zaman 1 tane (canonical). Profilde, district'lerde
  görünen kimlik.
- **Galeri:** kullanıcı çok sayıda form doğurabilir (her üretim
  `avatar_generations` olarak versiyonlanır). Pratik bir yumuşak sınır önerisi:
  ücretsiz üye için **son ~12 form** galeride; premium üye için sınırsız arşiv.

### Favori avatar nedir?
Kullanıcının "yıldızladığı" formlar. Favoriler galeride üstte, kolay erişimde.
Bir favori, aktif yapılmaya hazır bekleyen formdur. (Birden çok favori olabilir.)

### Aktif avatar nedir?
Tek olan, `is_canonical: true` form. Evrenin her yerinde kullanıcıyı temsil eder.
Galeriden bir forma dokunup **`Aktif Yap`** ile değiştirilir — anında tüm
district'lerde güncellenir.

### Eski avatarlar nasıl arşivlenir?
- Silinmez, **arşivlenir.** Hiçbir doğuş kaybolmaz (kullanıcı bilinçli silmedikçe).
- Arşiv kronolojik: *"Doğuş geçmişin."* Her form etiketli: arketip + district + tarih.
- Bir arşiv formu istendiğinde tekrar aktif yapılabilir veya favoriye alınabilir.
- **Tam silme** kullanıcının hakkı: silince hem görsel hem kimlik referansı
  (`references/`) hard-delete (KVKK/GDPR, Avatar Bible §8).

---

## 6 · Avatar Evrimi

Aynı tanrıça, farklı district'lerde **evrilir** — yeni kimlik değil, aynı kimliğin
farklı frekans projeksiyonu (Goddess Bible district varyasyon sistemi).

### Kullanıcı nasıl dönüştürür?
Bir district'e girdiğinde sistem sorar (ilk kez): *"Selene'ni buraya çağıralım mı?"*
Onaylarsa, mevcut kimlik o district'in frekansında yeniden doğar — saniyeler
içinde, kimlik korunarak. Bu yeni varyant galeriye eklenir.

### Örnek: Selene'nin evrimi
- **Selene → Sanri** (doğal yuva): tam ay ışığı, mor-gümüş, rüya-gibi bulanık
  semboller, en yoğun aura. *"Selene evinde."*
- **Selene → Bazaar:** lüks ay — ipek ağırlaşır, inci çoğalır, sıcak altın glow
  soğuk gümüşle çarpışır. Görkemli ama kasıtlı "yabancı".
- **Selene → Mirror:** kendiyle yüzleşen ay — simetri, cam yüzey, ikinci yansıma,
  ayna sembolü baskın.

Kullanıcı galeride bu varyantları yan yana görür: *"Aynı sen, farklı evrenler."*

> Deneyim mesajı: evrim bir "yeni avatar satın al" değil, bir **yolculuktur.**
> Kullanıcı district'leri gezdikçe tanrıçası zenginleşir.

---

## 7 · SANRI Bağlantısı

SANRI (Bilinç Tapınağı) kullanıcının **aktif avatarını okur** ve okumalarına
kişisel bir kimlik katar.

### SANRI aktif avatarı nasıl okur?
- Kullanıcının canonical avatarı = arketip + district + frekans verisi.
- SANRI bu kimliği bağlam olarak alır: *"Sen Selene'sin, Sanri'de doğmuşsun."*
- Avatar görseli okuma ekranlarında eşlik eder (Portrait katmanı).

### Modüllerde anlam
- **Rüya:** rüya yorumu, kullanıcının arketibinin sembol diliyle harmanlanır
  (Selene için ay/ayna sembolleri öne çıkar).
- **Sembol:** haftalık sembol, arketibin sembol setiyle ilişkilendirilir.
- **Fal:** matrix rol + numeroloji okuması, tanrıça frekansıyla renklendirilir.
- **Kod-okuma:** üst-bilinç katmanı, kullanıcının seçtiği arketibi bir "ruhsal
  lens" olarak kullanır.

> Deneyim: SANRI'da kullanıcı anonim bir soru soran değil, **kimliği olan bir
> tanrıça**dır. Okumalar ona "Selene olarak" hitap eder.

---

## 8 · Bazaar Bağlantısı

Bazaar (Mirror Gate / Frekans Bazaarı) avatarı **alışverişin merkezine** koyar.

### Avatar alışverişte nasıl kullanılır?
- Kullanıcı koleksiyonu gezerken, ürünler kendi **Fashion Avatarı** üzerinde
  görünür — manken değil, kendi tanrıça bedeni.
- *"Bu parça senin frekansında nasıl durur?"* — try-on doğrudan kimliğe bağlı.

### Fashion try-on akışı
```
Fashion Avatar (aktif)  →  ürün seç  →  avatar üzerinde dene (try-on-variants)
   →  arketip + district frekansıyla harmanlanmış görsel
   →  beğen → sepete / kaydet
```
- Mevcut `lib/caelinus-ai/try-on-variants` ve fashion district portallarına köprü
  (`/universe/shop/avatar` "Aynaya Gir").
- Try-on çıktısı galeriye Fashion varyantı olarak eklenebilir.

> Deneyim mesajı: *"Giysi bir örtü değil; frekansının yüzeyidir."* (Registry'deki
> Bazaar mythos'u.)

---

## 9 · Atelier Bağlantısı

### Avatar Studio neden Atelier içinde yaşar?
Atelier = zanaat district'i. Avatar **üretmek, kıyafet değiştirmek, stil
evrimleştirmek** birer zanaat eylemidir. Bu yüzden Avatar Studio'nun doğal evi
Atelier'dir: doğuş Source'ta olur, ama **ustalık** Atelier'de yaşar.

(Mevcut District Engine'de `avatar` district'i "soon"; Atelier ile birleşik
düşünülmeli — Avatar Studio, Atelier'in "couture forge"u.)

### Kullanıcı Atelier'de ne yapar?
- **Yeni avatar üret:** doğum akışını (Bölüm 2) yeniden başlat.
- **Kıyafet değiştir:** mevcut kimliğe yeni outfit preset uygula (Avatar Core
  `OutfitPreset`, `hiddenMeshParts` binding).
- **Stil evrimleştir:** yoğunluğu/district'i değiştirip aynı kimliği yeniden doğur.
- **Animasyon dene** (3D olgunlaştığında): `AnimationPreset` ile poz/hareket.

> Deneyim: Atelier bir **stüdyo**dur — net ışık, ayna, askılar. Kullanıcı burada
> "oynamaz", **işler.** Tanrıçasını bir zanaatkâr gibi biçimlendirir.

---

## 10 · Temple of Silence Bağlantısı

Temple of Silence, evrenin en sade, en sessiz bölgesi. Avatar burada **soyunur** —
süslerinden değil, gürültüsünden.

### Sessiz forma dönüşme ritüeli
- Kullanıcı Temple'a girer → *"Burada tanrıçan sadeleşir. Hazır mısın?"*
- Ritüel sekansı: takılar tek tek çözülür, renkler monokroma kayar, aura silinir,
  kıyafet en sade silüete iner. Hareket durur.
- Sonuç: **Sessiz Form** — neredeyse monokrom, tek akan kumaş, derin durağan ışık.
  Selene örneği: *"Sessiz Ay — söze ve gösterişe gerek duymayan saf varlık."*
- Bu form galeride özel bir kategoride saklanır: *Sessiz Formlar.*

> Deneyim: Temple bir "tema" değil, bir **arınma**dır. Kullanıcı burada kimliğinin
> özüyle baş başa kalır. Hiçbir satın alma, hiçbir paylaşım çağrısı yok — sadece
> varlık.

---

## 11 · UI / UX Prensipleri

1. **Dil mistik ama anlaşılır.** "Doğuş", "frekans", "eşik" gibi kelimeler;
   ama her ekranda ne yapılacağı net. Şiir + netlik, gizem değil kafa karışıklığı.
2. **Teknik kelime yok.** "Generate / render / upload / model" görünmez. Yerine
   "doğur / uyandır / yüzünü ver / form". (Teknik terimler sadece bu Bible'larda.)
3. **Tören hissi, oyun değil.** Skor, rozet, "level up" yok. Her etkileşim
   anlamlı ve yavaş. Bekleme bir "loading" değil, bir doğuş anı.
4. **Mobil öncelikli.** Dikey akış, tek elle erişim, büyük dokunma alanları,
   carousel/swipe seçimler. Desktop QR köprüsü mobil kamerayı zaten merkeze alır.
5. **Tek karar / ekran.** Her eşik tek bir niyet ister. Form yığını yok.
6. **Görsel her zaman kahraman.** Metin minimal, tanrıça görseli baskın.
   Sinematik, tam ekran, asla "yuvarlak profil çerçevesi".
7. **Geri dönülebilir, zorlamasız.** Her ritüel atlanabilir/ertelenebilir;
   kullanıcı "Şimdilik gez" diyebilir. Davet var, baskı yok.
8. **Tutarlı görsel DNA.** Mor alabaster + altın damar, locked-frame kompozisyon,
   district accent renkleri (registry) her ekranda tutarlı.

---

## 12 · Cursor'a Aktarılacak Üretim Fazları

> Uygulama sırası. Her faz bağımsız teslim edilebilir bir dilim; sonraki faz
> öncekinin üzerine kurulur. (Kod bu Bible onaylanınca yazılır.)

### Phase 1 — Portrait Avatar Studio
- Doğum akışı [1]–[7] (Bölüm 2), Portrait katmanı çıktısı.
- Selfie köprüsü (mevcut `caelinus-avatar-core` QR), gizlilik onayı, 12 arketip
  seçimi, stil yoğunluğu, doğuş sekansı, sonuç ekranı.
- Persist: `avatar_profiles` + `avatar_generations` (Avatar Bible §7),
  `caelinus_avatar_url` ile köprü.
- **Teslim:** kullanıcı bir Portrait tanrıça avatarı doğurup kaydedebilir.

### Phase 2 — Avatar Gallery
- Galeri (Bölüm 5): aktif/favori/arşiv, `is_canonical` yönetimi.
- Aktif yapma, favoriye alma, arşivleme, tam silme (hard-delete + `references/`).
- **Teslim:** kullanıcı birden çok form saklayıp aralarında geçiş yapabilir.

### Phase 3 — District Variants
- District varyasyon seçimi (Bölüm 3) + evrim (Bölüm 6).
- `district_variants` kayıtları, `goddess_dna ⊕ district_modifier` birleştirme.
- "Tanrıçanı buraya çağır" akışı district girişlerinde.
- **Teslim:** aynı kimlik 8 district'te evrilebilir.

### Phase 4 — Fashion Try-On
- Fashion Avatar katmanı + Bazaar try-on (Bölüm 8).
- `try-on-variants` köprüsü, `/universe/shop/avatar` entegrasyonu.
- **Teslim:** kullanıcı ürünleri kendi tanrıça bedeninde deneyebilir.

### Phase 5 — Universe Avatar
- Universe katmanı: avatar + district sahnesi tam kompozisyon.
- Paylaşım kartı, kahraman görsel, sonuç ekranı zenginleştirme.
- **Teslim:** paylaşılabilir sinematik "kartvizit" görseli.

### Phase 6 — 3D GLB Avatar
- 3B çıktı (Avatar Bible §9): Blender headless → GLB → `glb_path`.
- Asset Bible QA, outfit/animation rig uyumu, District Engine R3F entegrasyonu.
- **Teslim:** avatar 3B district sahnelerinde gerçek-zamanlı varlık olur.

---

*Bu doküman [`CAELINUS_AVATAR_BIBLE.md`](./CAELINUS_AVATAR_BIBLE.md) ve
[`CAELINUS_GODDESS_ARCHETYPES_BIBLE.md`](./CAELINUS_GODDESS_ARCHETYPES_BIBLE.md)
ile birlikte okunur. Üçü Caelinus Avatar sisteminin tek doğru kaynağıdır.
Kod yazılmadan önce buraya bakılır.*
