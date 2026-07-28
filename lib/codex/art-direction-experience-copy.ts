export type ArtDirectionExperiencePassage = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  quote?: string;
};

export type ArtDirectionExperienceSection = {
  sourceSectionId: string;
  number: string;
  title: string;
  subtitle: string;
  passages: ArtDirectionExperiencePassage[];
};

export const ART_DIRECTION_EXPERIENCE_SECTIONS: ArtDirectionExperienceSection[] = [
  {
    sourceSectionId: "art-intro",
    number: "00",
    title: "Işığın Dili",
    subtitle: "Caelinus’un görsel dünyası göstermez; hatırlatır.",
    passages: [
      {
        title: "Bir Dünyanın Yüzü",
        paragraphs: [
          "Caelinus’un sanat yönü, Anadolu’yu süsleyen bir kabuk değildir. Toprağın, insanın ve zamanın hafızasını görünür kılan ortak bir dildir.",
          "Bu dil kusursuz yüzeylerin peşinden gitmez. Güneşte solmuş taşı, avuçla parlatılmış ahşabı, suyun aşındırdığı eşiği ve yılların bıraktığı izi korur. Çünkü yaşanmışlık burada bir hata değil, dünyanın kimliğidir.",
          "Her görüntü aynı soruya cevap verir: Bu yer, oyuncu gelmeden önce nasıl yaşadı ve oyuncu ayrıldıktan sonra neyi hatırlamaya devam edecek?",
        ],
      },
      {
        title: "Sanat Yönünün Sözü",
        quote:
          "Güzel görünen bir dünya kurmak yetmez. İçinde kalmak, dokunmak ve bir gün özlemek isteyeceğimiz bir dünya kurmalıyız.",
      },
    ],
  },
  {
    sourceSectionId: "art-1-isik",
    number: "01",
    title: "Işık — Hatırlamanın Yüzü",
    subtitle: "Güneş yalnızca aydınlatmaz; zamanın izini açığa çıkarır.",
    passages: [
      {
        title: "Ana Karakter",
        paragraphs: [
          "Caelinus’ta ışık bir efekt değil, anlatının sessiz kahramanıdır. Sabahın ilk ışığı dünyayı uyandırır; öğle güneşi emeğin ağırlığını gösterir; akşamın altın tonu günü hatıraya dönüştürür.",
          "Altın saat hazır bir filtre gibi her yüzeye uygulanmaz. Taşın gözeneklerine, zeytin yapraklarının gümüşüne, Seyhan’ın akışına ve insan yüzlerindeki küçük ifadelere göre değişir.",
          "Gölge karanlığı saklamak için değil, derinlik vermek için vardır. Yumuşaktır; fakat yönünü, mevsimini ve günün saatini açıkça taşır.",
        ],
      },
      {
        title: "Işık İlkeleri",
        bullets: [
          "Sabah, başlangıç ve ihtimal duygusunu taşır.",
          "Öğle, malzemenin ve emeğin dürüst yüzünü gösterir.",
          "Akşam, gündelik hayatı hafızaya dönüştürür.",
          "Gece, yapay parıltıyla değil; ay, ateş ve pencerelerden sızan yaşamla kurulur.",
        ],
      },
    ],
  },
  {
    sourceSectionId: "art-2-renk",
    number: "02",
    title: "Renk — Toprağın Hafızası",
    subtitle: "Hiçbir renk bağırmaz; her renk ait olduğu yerden konuşur.",
    passages: [
      {
        title: "Yaşayan Palet",
        paragraphs: [
          "Caelinus’un renkleri bir marka tablosundan değil, Anadolu’nun kendisinden doğar. Palet; güneş, taş, su, bitki ve emek arasında kurulan dengedir.",
          "Renkler yalnızca güzel bir uyum oluşturmaz. Oyuncuya nerede olduğunu, günün hangi saatinde yürüdüğünü ve karşısındaki mekânın nasıl bir hayat taşıdığını sezdirir.",
        ],
        bullets: [
          "Eski altın: güneş, hafıza ve kutsal olmayan ama kıymetli olan.",
          "Kireç taşı beyazı: açıklık, sıcaklık ve insan eliyle kurulmuş sadelik.",
          "Anadolu toprağı: kök, emek ve yaşamın maddi ağırlığı.",
          "Zeytin yeşili: süreklilik, sabır ve kuşaklar arası bağ.",
          "Seyhan mavisi: akış, serinlik ve şehrin taşıdığı zaman.",
        ],
      },
      {
        title: "Denge",
        quote:
          "Renk dünyayı boyamaz. Dünyanın zaten söylediği şeyi daha dikkatli duymamızı sağlar.",
      },
    ],
  },
  {
    sourceSectionId: "art-3-mimari",
    number: "03",
    title: "Mimari — İnsan Ölçeği",
    subtitle: "Mekân, insanı küçültmez; onu hayatın içine davet eder.",
    passages: [
      {
        title: "Yaşanmış Mekân",
        paragraphs: [
          "Caelinus mimarisi uzaktan hayranlık uyandırmak için kurulmaz. İçinden geçmek, gölgesinde durmak, eşiğine oturmak ve yolunu zamanla öğrenmek için kurulur.",
          "Avlu, sokak, çeşme, atölye ve meydan birbirinden kopuk dekorlar değildir. Günlük hayatın ritmini birbirine taşıyan eşiklerdir. Bir kapının açılma yönü, ağacın gölge düşürdüğü yer ve suyun sesi kadar önemlidir.",
          "Yeni olan eskiyi taklit etmez; onun ölçüsünü, malzeme dürüstlüğünü ve iklimle kurduğu ilişkiyi devam ettirir.",
        ],
      },
      {
        title: "Malzeme Dili",
        bullets: [
          "Taş ağırlığı ve zamanı taşır.",
          "Ahşap dokunuşu ve insan emeğini gösterir.",
          "Kireç sıva ışığı yumuşatır.",
          "Su, mekâna ses ve serinlik verir.",
          "Ağaçlar sonradan eklenmiş süs değil, mimarinin yaşayan parçasıdır.",
        ],
      },
    ],
  },
  {
    sourceSectionId: "art-4-kamera",
    number: "04",
    title: "Kamera — Tanığın Bakışı",
    subtitle: "Kamera dünyayı ele geçirmez; ona yaklaşmak için izin ister.",
    passages: [
      {
        title: "İnsan Boyunda",
        paragraphs: [
          "Kamera oyuncuyu her an kahraman ilan etmez. Onu önce tanık, sonra komşu, zamanla da bu dünyanın sorumlu bir parçası yapar.",
          "Bakış yüksekten hükmetmek yerine insan boyunda kalır. Sokakta yürür, bir ustanın ellerine yaklaşır, çocuğun baktığı yöne döner ve bazen hiçbir şey olmuyormuş gibi görünen bir anın içinde bekler.",
          "Hareket meraktan doğar. Hız, yalnızca anlatının gerektirdiği yerde vardır; gösteriş için kullanılan savrulma, titreşim ve sürekli kesme bu dünyanın ritmine ait değildir.",
        ],
      },
      {
        title: "Kadraj İlkeleri",
        bullets: [
          "Önce bağlamı, sonra ayrıntıyı göster.",
          "İnsanla mekân arasındaki ilişkiyi kadrajda koru.",
          "Emeği yalnız sonuçta değil, süreçte görünür kıl.",
          "Sessiz anlardan kaçma; dünyanın kendi hareketine yer bırak.",
        ],
      },
    ],
  },
  {
    sourceSectionId: "art-5-ses",
    number: "05",
    title: "Ses — Görünmeyen Manzara",
    subtitle: "Görüntünün sınırı bittiğinde dünya sesle yaşamaya devam eder.",
    passages: [
      {
        title: "Önce Sessizlik",
        paragraphs: [
          "Caelinus’ta sessizlik boşluk değildir. Rüzgârın yönünü, uzaktaki suyu, taş avludaki bir adımı ve evlerin içindeki hayatı duyabilmek için açılan alandır.",
          "Müzik duyguyu zorla tarif etmez. Dünya kendi sesini kurduktan sonra, gerektiğinde ona eşlik eder. Bir sahnenin güçlü olması için sürekli duygu üretmesine değil, doğru anda nefes almasına ihtiyaç vardır.",
          "Her bölgenin ses rengi farklıdır. Pazarın uğultusu, tarlanın açıklığı, atölyenin ritmi ve gece avlusunun dinginliği mekânın görünmeyen mimarisini oluşturur.",
        ],
      },
      {
        title: "Duyulan Hayat",
        bullets: [
          "Rüzgâr ve yaprak, mevsimi anlatır.",
          "Su, yön ve mesafe duygusu verir.",
          "İnsan sesi, mekânı topluluğa dönüştürür.",
          "Üretim sesleri, emeğin ritmini görünür kılar.",
        ],
      },
    ],
  },
  {
    sourceSectionId: "art-6-insan",
    number: "06",
    title: "İnsan — Dünyanın Taşıyıcısı",
    subtitle: "Figür değil; komşu, usta, çocuk, çiftçi ve hafıza.",
    passages: [
      {
        title: "Yüzün Ardındaki Hayat",
        paragraphs: [
          "Caelinus insanları bir kalabalığı doldurmak için var olmaz. Her biri yaşadığı yerle, yaptığı işle ve taşıdığı hatırayla dünyanın anlamını büyütür.",
          "Kıyafet, ten, yaş, beden ve yüz farklılıkları gösteri malzemesi yapılmaz. İnsanlar idealize edilmeden, küçültülmeden ve tek bir estetik kalıba zorlanmadan kendi gündelik onurlarıyla görünür olur.",
          "Bir ustanın ellerindeki iz, bir çocuğun aceleciliği, bir esnafın dükkânını açma biçimi ve yaşlı bir komşunun bekleyişi; karakter tasarımının en güçlü ayrıntılarıdır.",
        ],
      },
      {
        title: "Temsil İlkesi",
        quote:
          "Bu dünyada hiç kimse arka plan değildir. Her insan, yaşadığı yerin başka türlü anlatılamayacak bir cümlesidir.",
      },
    ],
  },
  {
    sourceSectionId: "art-7-dunya",
    number: "07",
    title: "Dünya — Sessiz Derinlik",
    subtitle: "Gösterişli değil, samimi. Büyük değil, derin. Hızlı değil, yaşayan.",
    passages: [
      {
        title: "Yaşamın Önceliği",
        paragraphs: [
          "Caelinus, oyuncunun dikkatini her saniye talep eden bir dünya değildir. Merak uyandırır; fakat bağırmaz. Yol gösterir; fakat keşfin yerine geçmez.",
          "Görsel zenginlik nesne sayısından değil, ilişkilerin inandırıcılığından doğar. Gölgenin oturma yerine dönüşmesi, dükkânın sabah açılması, yağmurdan sonra taşın renk değiştirmesi dünyanın yaşadığını hissettirir.",
          "Her şehir ortak bir sanat dilini konuşur; fakat aynı görünmez. İklimi, malzemesi, bitkisi, ışığı ve insan ritmiyle kendi karakterini korur.",
        ],
      },
      {
        title: "Dünyanın Ölçüsü",
        bullets: [
          "Manzara hayranlık yaratırken yakınlık duygusunu kaybetmez.",
          "Ayrıntı, keşfedene ödül olur; ekranda gürültüye dönüşmez.",
          "Teknoloji görünür olmak için değil, hayatın sürekliliğini korumak için çalışır.",
          "Güzellik kusursuzluktan değil, zamanla kurulan ilişkiden doğar.",
        ],
      },
    ],
  },
  {
    sourceSectionId: "art-9-aura-nin-buyuk-fikri",
    number: "08",
    title: "Yaşam Ağacı — Ortak İmza",
    subtitle: "Kökleri Anadolu’da, dalları gelecekte yaşayan bir sembol.",
    passages: [
      {
        title: "Sembolün Özü",
        paragraphs: [
          "Caelinus’un işareti bir kahramanın portresi değil, yaşamın sürekliliğidir. Zeytin ağacı bu yüzden merkezdedir: sabrı, kökü, emeği ve kuşaklar boyunca aktarılan hafızayı aynı bedende taşır.",
          "Kökler Anadolu’nun görünmeyen bağlarını temsil eder. Gövde ortak hafızadır. Her dal kendi kimliğini koruyan bir şehre, her yaprak o şehri yaşatan insana açılır.",
          "Ağaç tek bir döneme ait değildir. Geçmişten beslenir, bugünde gölge verir ve geleceğe doğru büyür. Caelinus’un kurduğu bütün sistemler de aynı ilkeyi izler.",
        ],
      },
      {
        title: "Yaşayan Sistem",
        bullets: [
          "Kitabın kapağında hafızanın mührüdür.",
          "Dünyanın içinde şehirleri birbirine bağlayan ortak işarettir.",
          "Nesnelerde sahiplik değil, aidiyet ve sorumluluk taşır.",
          "Her ölçekte sade, tanınabilir ve malzemenin doğasına saygılı kalır.",
        ],
      },
      {
        title: "Son Söz",
        quote:
          "Bir gün bu ağaç görüldüğünde yalnızca Caelinus adı değil; Anadolu’nun yaşayan hafızası hatırlanmalı.",
      },
    ],
  },
];
