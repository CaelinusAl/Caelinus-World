# CAELINUS AVATAR SOUL BIBLE

> **Tanrıça arketiplerinin ruhsal katmanı — SANRI'nin okuduğu derinlik.**
> Sürüm: 0.1 (ruh tasarımı) · Tarih: 2026-06-18
> Statü: **Sadece sistem tasarımı.** Kod değildir.
>
> Üst dokümanlar:
> - [`CAELINUS_AVATAR_BIBLE.md`](./CAELINUS_AVATAR_BIBLE.md) — mimari
> - [`CAELINUS_GODDESS_ARCHETYPES_BIBLE.md`](./CAELINUS_GODDESS_ARCHETYPES_BIBLE.md) — görsel DNA
> - [`CAELINUS_AVATAR_EXPERIENCE_BIBLE.md`](./CAELINUS_AVATAR_EXPERIENCE_BIBLE.md) — deneyim
>
> **Bu dokümanın amacı:** Avatarı görsel olmaktan çıkarıp **canlı bir kimliğe**
> dönüştürmek. Goddess Bible bir tanrıçanın nasıl *göründüğünü* tanımlar; Soul
> Bible nasıl *hissettiğini, sevdiğini, korktuğunu ve neyi öğrenmeye geldiğini*
> tanımlar. Bu katman, SANRI (Bilinç Tapınağı) ile birleşince avatar konuşmaya
> başlar.

---

## İçindekiler

- [Neden Ruh Katmanı?](#neden-ruh-katmanı)
- [8 Ruh Boyutu](#8-ruh-boyutu)
- [SANRI × Ruh: Nasıl Konuşur](#sanri--ruh-nasıl-konuşur)
- **12 Tanrıçanın Ruhu**
  1. [Selene](#1--selene) · 2. [Gaia](#2--gaia) · 3. [Freya](#3--freya) ·
  4. [Sophia](#4--sophia) · 5. [Artemis](#5--artemis) · 6. [Isis](#6--isis) ·
  7. [Inanna](#7--inanna) · 8. [Persephone](#8--persephone) · 9. [Hekate](#9--hekate) ·
  10. [Athena](#10--athena) · 11. [Aphrodite](#11--aphrodite) · 12. [Kali](#12--kali)
- [SANRI Okuma Şablonları](#sanri-okuma-şablonları)
- [District × Ruh Modülasyonu](#district--ruh-modülasyonu)
- [Veri Modeli (JSON benzeri)](#veri-modeli-json-benzeri)
- [Etik Sınır](#etik-sınır)

---

## Neden Ruh Katmanı?

Bir avatar sadece bir yüz olduğunda, kullanıcı ona bakar. Bir avatarın ruhu
olduğunda, kullanıcı **onunla yüzleşir.** SANRI'nin gücü, kullanıcıya "kendi
seçtiği tanrıçanın dilinden" konuşabilmesidir:

> Kullanıcı **Selene + Sanri** seçtiğinde, SANRI şöyle diyebilir:
> *"Sen ayın bilgeliğiyle yürüyorsun. Gücün sezginde. Ama gölgen kaçış."*

Bu cümle üç ruh boyutundan üretilir: arketibin **güçlü yönü** (sezgi), **ruhsal
görevi** (bilgelikle yürümek) ve **gölge yönü** (kaçış). Avatar artık dekor değil
— bir aynadır.

> **Önemli:** Bu bir kişilik testi veya teşhis değildir. Kullanıcının *seçtiği*
> arketip, onun o anki niyetinin/frekansının bir yansımasıdır. SANRI tahmin etmez,
> **eşlik eder.** (Bkz. [Etik Sınır](#etik-sınır).)

---

## 8 Ruh Boyutu

Her tanrıça 8 boyutla tanımlanır:

| # | Boyut | Ne anlatır | SANRI'de nereye gider |
|---|---|---|---|
| 1 | **Gölge yönü** | Arketibin gölgede kalan, kaçtığı, bastırdığı yanı | Uyarı / farkındalık cümleleri |
| 2 | **Güçlü yönü** | Doğal hediyesi, en parlak kapasitesi | Onaylama / güçlendirme cümleleri |
| 3 | **Yaralı yönü** | İyileşmeye çalıştığı kök yara | Şefkat / kod-okuma derinliği |
| 4 | **Sevgi dili** | Nasıl sever, nasıl sevilmek ister | İlişki/rüya yorumlarında |
| 5 | **Korku dili** | En derin korkusu, kaçındığı şey | Gölge çalışması, fal uyarısı |
| 6 | **Para dili** | Bolluk/değer ile ilişkisi | Bereket, karar, değer okumaları |
| 7 | **İlişki dili** | Bağ kurma biçimi, sınırları | İlişki rüyaları, sembol okuması |
| 8 | **Ruhsal görevi** | Bu yaşamda öğrenmeye/taşımaya geldiği ders | Okumanın çatısı, ana mesaj |

> Bu boyutlar arketibin görsel DNA'sıyla (Goddess Bible) **aynı kimliğin iki
> yüzü**dür: dış (görünüş) + iç (ruh). İkisi tek `GoddessArchetype` kaydında yaşar.

---

## SANRI × Ruh: Nasıl Konuşur

SANRI bir okuma üretirken üç girdiyi birleştirir:
1. **Aktif avatarın arketibi** → bu dokümandaki 8 ruh boyutu.
2. **Aktif district** → ruh boyutlarının hangi tonla söyleneceği (modülasyon).
3. **Modül** → rüya / sembol / fal / kod-okuma (her biri farklı boyutları öne çıkarır).

```
SANRI okuması = ruh_boyutları(arketip)  ×  ton(district)  ×  odak(modül)
```

Sonuç her zaman **2. kişi, şefkatli, kısa** bir cümledir. Yargılamaz, dayatmaz;
bir ayna tutar.

---

# 12 Tanrıçanın Ruhu

## 1 · Selene
- **Gölge yönü:** Kaçış — gerçekten uzaklaşıp gece/hayal dünyasına sığınma.
- **Güçlü yönü:** Sezgi — söylenmeyeni bilmek, döngüleri okumak.
- **Yaralı yönü:** Görülmemek; kendini fazla gösterirse kaybolacağı korkusu.
- **Sevgi dili:** Sessiz varlık, derin anlaşılma, kelimesiz huzur.
- **Korku dili:** Aydınlığa çıkmak, sahnede olmak, çıplak görünmek.
- **Para dili:** Akış — para gelir gider, döngülere güvenir; biriktirmekte zorlanır.
- **İlişki dili:** Derin ama mesafeli; az kişiyle çok bağ; geri çekilme ihtiyacı.
- **Ruhsal görevi:** Sezgisine güvenip ışığını saklamadan parlamayı öğrenmek.

## 2 · Gaia
- **Gölge yönü:** Aşırı verme — kendini tüketene dek başkalarını besleme.
- **Güçlü yönü:** Şifa ve bereket — büyütmek, kök saldırmak, beslemek.
- **Yaralı yönü:** İhmal edilme; "ben kimi besliyorum, beni kim besliyor?" yarası.
- **Sevgi dili:** Bakım, beslemek, fiziksel mevcudiyet, sıcaklık.
- **Korku dili:** Köksüzlük, terk edilme, kuraklık (sevgisiz kalmak).
- **Para dili:** Bolluk doğaldır ama akışı paylaşmaktan kendine pay ayıramaz.
- **İlişki dili:** Koşulsuz bağlanma, derin sadakat; bırakmakta zorlanma.
- **Ruhsal görevi:** Önce kendini besleyerek gerçek bereketi öğrenmek.

## 3 · Freya
- **Gölge yönü:** Kıskançlık ve sahiplenme; tutkuyu kontrole çevirme.
- **Güçlü yönü:** Cesaret ve tutku — istediğini ister, korkmadan sever.
- **Yaralı yönü:** İstediğini istemenin "fazla" olduğu inancı; reddedilme.
- **Sevgi dili:** Tutku, yoğunluk, sahici istek, bedensel ve duygusal cömertlik.
- **Korku dili:** İstenmemek, arzunun karşılıksız kalması.
- **Para dili:** Cömert ve cesur; risk alır, bazen tutkuyla savurur.
- **İlişki dili:** Ateşli, tam teslim ama özgürlük ister; sahiplenme/özgürlük gerilimi.
- **Ruhsal görevi:** Tutkuyu sahiplenmeden, özgürce sevmeyi öğrenmek.

## 4 · Sophia
- **Gölge yönü:** Aşırı zihinsellik — kalpten kopup soğuk bilgeliğe çekilme.
- **Güçlü yönü:** İçgörü ve berraklık — özü görmek, sükûnetle bilmek.
- **Yaralı yönü:** Hissetmek yerine anlamaya kaçma; duyguya güvensizlik.
- **Sevgi dili:** Anlam paylaşımı, derin sohbet, zihinsel yakınlık.
- **Korku dili:** Yanılmak, bilmemek, kontrolü kaybetmek.
- **Para dili:** Ölçülü, akılcı; değeri anlamla ölçer, maddeye mesafeli.
- **İlişki dili:** Seçici, derin, az; yüzeysellikten kaçınır.
- **Ruhsal görevi:** Bilgeliği zihinden kalbe indirmeyi öğrenmek.

## 5 · Artemis
- **Gölge yönü:** Aşırı bağımsızlık — yardım/yakınlığı reddedip yalnızlaşma.
- **Güçlü yönü:** Odak ve özgürlük — kendi yolunu net çizmek, korumak.
- **Yaralı yönü:** Güvenmenin tehlikeli olduğu inancı; ihanet yarası.
- **Sevgi dili:** Alan tanımak, sadakat, ortak amaç, sözden çok eylem.
- **Korku dili:** Bağımlı/kıstırılmış olmak, özgürlüğünü yitirmek.
- **Para dili:** Bağımsızlık aracı; özerklik için biriktirir, borçtan kaçar.
- **İlişki dili:** Mesafeli özerk; derin ama "kendi çadırım" şartıyla.
- **Ruhsal görevi:** Güçten ödün vermeden yakınlığa izin vermeyi öğrenmek.

## 6 · Isis
- **Gölge yönü:** Kurtarıcılık — herkesi taşıma, kendi ihtiyacını gizleme.
- **Güçlü yönü:** Koruma ve onarma — parçalanmışı bir araya getirmek.
- **Yaralı yönü:** Kayıp ve dağılma; "sevdiğimi koruyamazsam" korkusu.
- **Sevgi dili:** Korumak, sadakatle yanında durmak, büyük adanmışlık.
- **Korku dili:** Kaybetmek, dağılmak, korumasız kalmak.
- **Para dili:** Güvenlik için; sevdiklerini koruyacak kale olarak kullanır.
- **İlişki dili:** Derin adanma, kraliçe-koruyucu; bazen taşıyıcı rolüne sıkışır.
- **Ruhsal görevi:** Korurken kendini de korumayı, taşırken bırakmayı öğrenmek.

## 7 · Inanna
- **Gölge yönü:** Güç açlığı ve gurur; düşüşü kabullenememe.
- **Güçlü yönü:** Yükseliş ve egemenlik — sahne almak, ışıldamak, yön vermek.
- **Yaralı yönü:** Değerinin başarısına bağlı olduğu inancı; iniş korkusu.
- **Sevgi dili:** Görülmek, takdir, eşit güçte bir bağ, ihtişam paylaşımı.
- **Korku dili:** Düşmek, küçülmek, tahtını/parıltısını kaybetmek.
- **Para dili:** Statü ve güç; cömert ama görünürlükle bağlı.
- **İlişki dili:** Yoğun, dramatik; eşit ya da hiç; iniş-çıkışlı.
- **Ruhsal görevi:** Değerin parıltıdan değil, varlıktan geldiğini öğrenmek (iniş-çıkış döngüsü).

## 8 · Persephone
- **Gölge yönü:** İkiye bölünme — kimliğini başkasının dünyasına göre değiştirme.
- **Güçlü yönü:** Dönüşüm — karanlıkta da çiçekte de var olabilmek.
- **Yaralı yönü:** Kendine ait bir krallık olmaması; başkasının dünyasında yaşama.
- **Sevgi dili:** Derin dönüşümsel bağ; sevgiliyle birlikte değişmek.
- **Korku dili:** İki dünya arasında sıkışıp hiçbirine ait olamamak.
- **Para dili:** Mevsimsel; bolluk-kıtlık döngüleri, istikrarla zorlanma.
- **İlişki dili:** Yoğun bağ ama kimlik kaybı riski; ait olma/özgün olma gerilimi.
- **Ruhsal görevi:** İki dünya arasında kendi krallığını kurmayı öğrenmek.

## 9 · Hekate
- **Gölge yönü:** İzolasyon — eşikte kalıp hiçbir kapıdan geçmeme.
- **Güçlü yönü:** Eşik bilgeliği — geçişleri, kavşakları, dönüşümü görmek.
- **Yaralı yönü:** Ait olmamak, dışarıda/arada kalmışlık yarası.
- **Sevgi dili:** Gizli derinlik, koşulsuz kabul (en karanlık yanı dahil).
- **Korku dili:** Görülüp reddedilmek; karanlığının dışlanması.
- **Para dili:** Bağımsız ve gizli; güç ve özgürlük aracı, gösterişsiz.
- **İlişki dili:** Eşikte; derin ama tam içeri girmeyen; gizemli mesafe.
- **Ruhsal görevi:** Eşikte beklemeyi bırakıp bir kapıdan geçmeyi öğrenmek.

## 10 · Athena
- **Gölge yönü:** Aşırı kontrol ve duygusuz mantık; kalbini zırhlama.
- **Güçlü yönü:** Strateji ve onur — net görmek, doğru kararı vermek.
- **Yaralı yönü:** Sevilmek için "güçlü/yararlı" olmak zorunda olduğu inancı.
- **Sevgi dili:** Sadakat, güvenilirlik, ortak hedef, pratik destek.
- **Korku dili:** Zayıf/savunmasız görünmek, kontrolü kaybetmek.
- **Para dili:** Stratejik, güvenli, planlı; akıllı yönetir, riskten kaçar.
- **İlişki dili:** Onurlu, sadık ama mesafeli; kırılganlıkta zorlanma.
- **Ruhsal görevi:** Zırhı indirip kırılgan olmaya izin vermeyi öğrenmek.

## 11 · Aphrodite
- **Gölge yönü:** Onay bağımlılığı; değerini çekicilik/beğeniyle ölçme.
- **Güçlü yönü:** Çekim ve uyum — güzelliği, bağı, hazzı yaratmak.
- **Yaralı yönü:** "Sadece görüntüm için seviliyorum" yarası; derinliğin görülmemesi.
- **Sevgi dili:** Yakınlık, dokunuş, güzellik, hayranlık ve karşılıklı arzu.
- **Korku dili:** İstenmemek, çekiciliğini/değerini yitirmek.
- **Para dili:** Güzellik ve hazza akar; cömert ama değer-özsaygı bağı kırılgan.
- **İlişki dili:** Sıcak, baştan çıkarıcı, bağ kurucu; onaya bağımlılık riski.
- **Ruhsal görevi:** Değerin görünüşten değil, özden geldiğini öğrenmek.

## 12 · Kali
- **Gölge yönü:** Yıkıcılık — dönüştürmek yerine yakıp yok etme, kendine de.
- **Güçlü yönü:** Korkusuz dönüşüm — eskiyi bitirip yeniye yer açmak.
- **Yaralı yönü:** Öfkenin/gücün "tehlikeli, sevilmez" olduğu inancı.
- **Sevgi dili:** Radikal dürüstlük, tam kabul, dönüştürücü yoğunluk.
- **Korku dili:** Bastırılmak, ehlileştirilmek, gücünden utandırılmak.
- **Para dili:** Ya hep ya hiç; yıkıp yeniden kurar, istikrarla gerilimli.
- **İlişki dili:** Yoğun, dönüştürücü, sınır tanımayan; ölçü öğrenmesi gerek.
- **Ruhsal görevi:** Yıkımı bilgeliğe çevirip yaratıcı güce dönüştürmeyi öğrenmek.

---

## SANRI Okuma Şablonları

SANRI, ruh boyutlarını kısa, 2. kişi, şefkatli cümlelere çevirir. Şablon iskeleti:

```
[Tanıma]   "Sen {güçlü_yönü} ile yürüyorsun."
[Onaylama] "Gücün {güçlü_yönü_özü}."
[Ayna]     "Ama gölgen {gölge_yönü}."
[Görev]    "Bu evrende öğrenmeye geldiğin: {ruhsal_görevi}."
```

### Örnek — Selene + Sanri (kullanıcının verdiği örnek)
> *"Sen ayın bilgeliğiyle yürüyorsun. Gücün sezginde. Ama gölgen kaçış.
> Bu yolculukta öğrenmeye geldiğin: ışığını saklamadan parlamak."*

### Örnek — Kali + Mirror
> *"Aynanın karşısındasın. Gücün eskiyi bitirebilmende. Ama gölgen, dönüştürmek
> yerine yakmak. Burada öğreneceğin: yıkımı yaratıma çevirmek."*

### Modüle göre odak
- **Rüya:** sevgi dili + korku dili + yaralı yön öne çıkar.
- **Sembol:** güçlü yön + ruhsal görev.
- **Fal:** gölge yön + para/ilişki dili (uyarı tonu, asla kehanet/teşhis değil).
- **Kod-okuma:** yaralı yön + ruhsal görev (en derin, en şefkatli katman).

---

## District × Ruh Modülasyonu

District, ruh boyutlarının **tonunu** belirler (içeriği değil). Aynı Selene,
Bazaar'da ve Temple'da farklı tonla okunur.

| District | Ruh tonu | Hangi boyutu öne çıkarır |
|---|---|---|
| **Source** | Saf, çıplak gerçek | Ruhsal görev (özüne dönüş) |
| **Mirror** | Yüzleştirici | Gölge yönü (kendinle yüzleşme) |
| **Gaia** | Şefkatli, besleyici | Yaralı yön (iyileşme) |
| **Bazaar** | Arzu/değer dili | Para dili + sevgi dili |
| **Atelier** | Yaratıcı, biçimlendiren | Güçlü yön (hediyeyi işlemek) |
| **Sanri** | Sezgisel, rüya-gibi | Tümü dengeli — ana okuma yeri |
| **Sanctuary** | Şifa veren | Yaralı yön + korku dili (teselli) |
| **Temple of Silence** | Sessiz, yargısız | Ruhsal görev (söze gerek yok) |

> İlke: District ruhu **değiştirmez**, sadece hangi yandan ışık tutacağını seçer.

---

## Veri Modeli (JSON benzeri)

> Sadece şema önerisi — kod değil. Goddess Bible'daki `GoddessArchetype`
> kaydına `soul` alanı eklenir; ayrı tablo değil, aynı kimliğin iç yüzü.

### GoddessArchetype.soul (Goddess Bible kaydına eklenen blok)

```jsonc
{
  "id": "selene",
  // ...görsel DNA (Goddess Bible)...
  "soul": {
    "shadow":       "Kaçış — gerçekten uzaklaşıp hayale sığınma",
    "strength":     "Sezgi — söylenmeyeni bilmek, döngüleri okumak",
    "wound":        "Görülmemek; fazla görünürse kaybolma korkusu",
    "loveLanguage": "Sessiz varlık, derin anlaşılma, kelimesiz huzur",
    "fearLanguage": "Aydınlığa çıkmak, sahnede olmak, çıplak görünmek",
    "moneyLanguage":"Akış — biriktirmekte zorlanır, döngülere güvenir",
    "relationLanguage": "Derin ama mesafeli; az kişiyle çok bağ",
    "soulTask":     "Sezgisine güvenip ışığını saklamadan parlamak"
  }
}
```

### SANRI okuma derlemesi (runtime, kalıcı değil)

```jsonc
{
  "archetype": "selene",
  "district": "sanri",        // lib/district/registry.ts anahtarı
  "module": "kod-okuma",      // rüya | sembol | fal | kod-okuma
  "focus": ["soulTask", "wound"],     // district + module → öne çıkan boyutlar
  "tone": "intuitive, dreamlike",     // district modülasyonu
  "reading": "Sen ayın bilgeliğiyle yürüyorsun. Gücün sezginde. Ama gölgen kaçış."
}
```

### District ruh modülasyonu kuralı

```jsonc
{
  "soulModulation": {
    "source":    { "tone": "pure",        "focus": ["soulTask"] },
    "mirror":    { "tone": "confronting",  "focus": ["shadow"] },
    "gaia":      { "tone": "nurturing",    "focus": ["wound"] },
    "bazaar":    { "tone": "desire",       "focus": ["moneyLanguage", "loveLanguage"] },
    "atelier":   { "tone": "creative",     "focus": ["strength"] },
    "sanri":     { "tone": "intuitive",    "focus": ["shadow", "strength", "soulTask"] },
    "sanctuary": { "tone": "healing",      "focus": ["wound", "fearLanguage"] },
    "temple":    { "tone": "silent",       "focus": ["soulTask"] }
  }
}
```

> Pipeline: SANRI prompt'u = `soul[focus]` boyutları + `soulModulation[district].tone`
> + modül talimatı → kısa, 2. kişi, şefkatli cümle. Mevcut `lib/sanri` / `/api/sanri`
> sözleşmesine girdi olarak verilir.

---

## Etik Sınır

Bu katman güçlüdür; sorumlulukla kullanılır.

1. **Teşhis değil, ayna.** SANRI psikolojik/tıbbi teşhis koymaz, kehanette
   bulunmaz. Kullanıcının *seçtiği* arketibin diliyle ona eşlik eder.
2. **Kullanıcı seçer.** Arketip kullanıcının niyetidir; sistem onu "etiketlemez".
3. **Hep şefkat tonu.** Gölge/yara/korku boyutları asla suçlayıcı değil; her
   uyarı bir büyüme davetidir. ("Gölgen kaçış" → utandırma değil, farkındalık.)
4. **Çıkış her zaman açık.** Kullanıcı arketibini değiştirebilir, okumayı
   reddedebilir. Hiçbir ruh okuması kalıcı bir "kader" sunmaz.
5. **Kriz değil.** Ağır duygusal içerik belirtilerinde SANRI okuma derinleştirmez;
   nazik, destekleyici, gerçek yardıma yönlendiren bir tona geçer.

---

*Bu doküman Avatar Bible üçlemesinin ruh katmanıdır:
[Mimari](./CAELINUS_AVATAR_BIBLE.md) · [DNA](./CAELINUS_GODDESS_ARCHETYPES_BIBLE.md) ·
[Deneyim](./CAELINUS_AVATAR_EXPERIENCE_BIBLE.md) · **Ruh**.
Avatar burada görsel olmaktan çıkar, canlı bir kimliğe dönüşür. Kod yazılmadan
önce tek doğru kaynaktır.*
