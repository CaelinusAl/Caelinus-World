export type GenesisExperiencePassage = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  quote?: string;
};

export type GenesisExperienceChapter = {
  sourceSectionId: string;
  number: string;
  title: string;
  subtitle: string;
  passages: GenesisExperiencePassage[];
};

/**
 * Presentation-only Genesis copy.
 *
 * This text gives the public reading experience a coherent voice while the
 * frozen source remains untouched and available through the read-only adapter.
 */
export const GENESIS_EXPERIENCE_CHAPTERS: GenesisExperienceChapter[] = [
  {
    sourceSectionId: "genesis-20-genesis-005",
    number: "005",
    title: "Yaşayan Dünya",
    subtitle: "Hareket eden değil, doğru zamanda nefes alan",
    passages: [
      {
        title: "Dünya Nefes Almalı",
        paragraphs: [
          "Caelinus bir harita değil, zamanın içinden geçen yaşayan bir organizmadır. Sabahı, akşamı, sessiz günleri, kalabalık geceleri ve değişen mevsimleri vardır.",
          "Hayat yalnızca oyuncu baktığında başlamaz. Dünya kendi ritmini sürdürür; oyuncu geldiğinde onu bekleyen bir dekor değil, devam eden bir yaşam bulur.",
        ],
      },
      {
        title: "Sessizlik de Hayattır",
        paragraphs: [
          "Yaşayan olmak sürekli hareket etmek değildir. Bir meydanın boş kalması, yağmurdan sonra taşların susması veya bir ustanın dükkânını kapatması da dünyanın nefesidir.",
        ],
        quote: "Yaşayan dünya, doğru zamanda konuşan ve doğru zamanda susabilen dünyadır.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-21-genesis-006",
    number: "006",
    title: "İki Dünya Arasında Köprü",
    subtitle: "Teknoloji, yaşadığımız yeri yeniden sevdirmeli",
    passages: [
      {
        title: "Ekrandan Hayata",
        paragraphs: [
          "Dijital deneyim gerçek dünyadan kaçılan bir yer olmak zorunda değildir. Bazen bir şehrin sesini ilk kez orada duyar, sonra o sesi gerçek sokaklarda aramaya başlarız.",
          "Caelinus’un köprüsü bu meraktan doğar: dijitalde keşfedilen bir hikâye, gerçek bir mekâna, insana, üretime veya kültürel hafızaya uzanır.",
        ],
      },
      {
        title: "Yeniden Bakmak",
        paragraphs: [
          "Amaç insanı toprağından uzaklaştırmak değil; daha dikkatli bakması için ona yeni bir pencere açmaktır. Oyuncu kapattığı ekrandan dünyaya biraz daha yakın dönmelidir.",
        ],
        quote: "Teknolojinin en büyük başarısı, insana yaşadığı dünyayı yeniden sevdirebilmesidir.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-22-genesis-007",
    number: "007",
    title: "Yaşayan Ekonomi",
    subtitle: "Emeğin, güvenin ve bilginin dolaşımı",
    passages: [
      {
        title: "Değer Nerede Başlar?",
        paragraphs: [
          "Bir ekonomi yalnızca alım ve satımdan oluşmaz. Bir tohumu eken insanın bilgisi, bir ustanın yıllarca geliştirdiği el hareketi ve topluluğun kurduğu güven de değerdir.",
          "Caelinus’ta üretim, oyuncuyu meşgul eden bir sayaç değil; toprağın, insanın ve zamanın birbirine nasıl bağlandığını gösteren bir yaşam biçimidir.",
        ],
      },
      {
        title: "Tüketici Değil, Katılımcı",
        paragraphs: [
          "Oyuncu hazır değeri yalnızca tüketmez. Süreci öğrenir, emeği tanır, iş birliği kurar ve oluşan değerin hikâyesini taşır.",
        ],
        quote: "Ekonomi para akışından önce güvenin, emeğin ve bilginin dolaşımıdır.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-23-genesis-008",
    number: "008",
    title: "81 Şehir, Tek Uygarlık",
    subtitle: "Aynı olmak değil, birbirini duyabilmek",
    passages: [
      {
        title: "Birbirine Açılan Şehirler",
        paragraphs: [
          "Her şehir kendi kimliğiyle yaşar; fakat hiçbir şehir yalnız değildir. Birinin üretimi diğerinin sofrasına, birinin ezgisi diğerinin hafızasına, birinin yolu diğerinin hikâyesine ulaşır.",
          "Tek uygarlık fikri farklılıkları silmez. Tam tersine, her şehrin kendi sesiyle ortak anlatıya katılmasını sağlar.",
        ],
      },
      {
        title: "Yerelden Büyümek",
        paragraphs: [
          "Caelinus önce kendi evini anlamayı seçer. Çünkü dünyaya açılan güçlü bir sistem, köklerini tanıyan ve her yeni adımda o köklere özen gösteren sistemdir.",
        ],
        quote: "Bir ülke şehirlerinin toplamı değil, şehirlerini birbirine bağlayan hafızadır.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-24-genesis-009",
    number: "009",
    title: "Teknoloji Görünmez Olmalıdır",
    subtitle: "Hatırlanan araç değil, yaşanan deneyimdir",
    passages: [
      {
        title: "Gösteri Değil Hizmet",
        paragraphs: [
          "Güçlü teknoloji kendini sürekli kanıtlamaya çalışmaz. Işığın doğal görünmesini, kalabalığın anlamlı davranmasını ve dünyanın kesintisiz hissettirmesini sağlar; sonra geri çekilir.",
          "Bir sistem yalnızca teknik olarak etkileyici olduğu için değil, oyuncunun dünyayla kurduğu bağı derinleştirdiği için değerlidir.",
        ],
      },
      {
        title: "İnsan Ölçeği",
        paragraphs: [
          "Arayüz, yapay zekâ ve gerçek zamanlı altyapı aynı ilkeye hizmet eder: karmaşıklığı insana yüklememek. Teknoloji büyüdükçe deneyim daha sade, anlaşılır ve doğal olmalıdır.",
        ],
        quote: "Teknoloji amaç değil, daha insani bir deneyimin görünmeyen aracıdır.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-25-genesis-010",
    number: "010",
    title: "Bir Oyun Değil, Bir Platform",
    subtitle: "Tamamlanan bir ürün değil, büyüyen bir temel",
    passages: [
      {
        title: "Uzun Ömürlü Temel",
        paragraphs: [
          "Tek bir hikâye sona erebilir; yaşayan bir dünya yeni şehirler, insanlar ve anlamlarla büyümeye devam eder. Caelinus bu büyümeyi taşıyacak ortak bir temel olarak tasarlanır.",
          "Her yeni katman eskisini geçersiz kılmamalı; onun üzerine daha tutarlı, daha erişilebilir ve daha zengin bir deneyim kurmalıdır.",
        ],
      },
      {
        title: "Büyümenin Ölçüsü",
        paragraphs: [
          "Büyümek yalnızca daha fazla içerik eklemek değildir. Yeni bir şehrin kendi kimliğini koruyabilmesi, yeni bir ortaklığın güveni güçlendirmesi ve alınan kararların yıllar sonra da doğru kalabilmesidir.",
        ],
        quote: "Bir oyun tamamlanır. Yaşayan bir platform, doğru temeller üzerinde büyür.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-26-bolum-ii-strateji",
    number: "011",
    title: "Neden Şimdi?",
    subtitle: "Doğru fikir, doğru zamanda sorumluluğa dönüşür",
    passages: [
      {
        title: "Kesişen Dönüşümler",
        paragraphs: [
          "Gerçek zamanlı grafikler, yapay zekâ, dijital üretim ve çevrimiçi topluluklar aynı dönemde olgunlaşıyor. Kültürel hafızanın dijital dünyada nasıl yaşayacağı sorusu da hiç olmadığı kadar görünür.",
          "Bu araçların varlığı başarıyı garanti etmez. Yalnızca daha önce mümkün olmayan bir deneyimi, doğru ekip ve doğru ölçekte sınama fırsatı verir.",
        ],
      },
      {
        title: "Zamanın Hakkını Vermek",
        paragraphs: [
          "Şimdi başlamak acele etmek değildir. Küçük, doğrulanabilir adımlarla öğrenmek ve teknoloji değişirken ana niyeti korumaktır.",
        ],
        quote: "Doğru fikir tek başına yetmez; doğru zamanda, doğru biçimde hayata geçirilmelidir.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-27-bolum-ii-strateji",
    number: "012",
    title: "İlk Yol Arkadaşları",
    subtitle: "Herkese seslenmeden önce birine gerçekten dokunmak",
    passages: [
      {
        title: "İlk Kullanıcı",
        paragraphs: [
          "Caelinus ilk gün herkes için yapılmış gibi davranmaz. Şehrini merak eden, kültürle bağ kurmak isteyen, üretimin ardındaki insanı görmek isteyen küçük ama dikkatli bir toplulukla başlar.",
          "Bu ilk insanlar yalnızca ürünü kullanan kişiler değildir. Nelerin anlaşılmadığını, hangi duygunun sahici olduğunu ve dünyanın nerede sessiz kaldığını gösteren yol arkadaşlarıdır.",
        ],
      },
      {
        title: "Topluluk",
        paragraphs: [
          "Topluluk sayı satın alarak kurulmaz. Dinleyerek, sözünü tutarak ve insanların bıraktığı katkıya özen göstererek büyür.",
        ],
        quote: "Büyük topluluklar, tek tek insanların güveniyle kurulur.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-28-bolum-ii-strateji",
    number: "013",
    title: "İnsanlar Neden Geri Döner?",
    subtitle: "Ödül için değil, ait oldukları yere dönmek",
    passages: [
      {
        title: "Hatırlanan Dünya",
        paragraphs: [
          "Bir ödül döngüsü insanı geri çağırabilir; fakat ödül bittiğinde çağrı da biter. Hatıra, ilişki ve aidiyet ise dünyayı bir menüden çıkarıp dönülecek bir yere dönüştürür.",
          "Mevsimin değişmesi, tanıdık bir insanın yeni bir hikâye anlatması veya birlikte kurulan bir alanın büyümesi geri dönüşe doğal bir neden verir.",
        ],
      },
      {
        title: "Dikkat Değil Bağ",
        paragraphs: [
          "Amaç oyuncuyu mümkün olduğunca uzun tutmak değildir. Geçirdiği zamanın anlamlı olmasını ve ayrıldığında yanında bir duygu taşımasını sağlamaktır.",
        ],
        quote: "İnsanlar ödüller için gelir; kendilerine ait bir hatıra bulduklarında kalır.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-29-bolum-ii-strateji",
    number: "014",
    title: "Değer Üreten Gelir",
    subtitle: "Kullanıcının dikkatini değil, güvenini kazanmak",
    passages: [
      {
        title: "Önce Deneyim",
        paragraphs: [
          "Gelir modeli dünyanın davranışını belirlememeli; dünyanın sürdürülebilir biçimde yaşamasına hizmet etmelidir. Tasarım, insanı ödeme baskısıyla yönlendirdiği anda kurulan güven zayıflar.",
          "Bu nedenle her gelir kararı açık, ölçülü ve deneyimin ana niyetiyle uyumlu olmalıdır.",
        ],
      },
      {
        title: "Uzun Vadeli Güven",
        paragraphs: [
          "Tek bir kaynağa bağımlı olmayan yapı, ürün olgunlaştıkça ve gerçek iş birlikleri doğrulandıkça adım adım gelişir. Kısa vadeli kazanç, uzun vadeli ilişkinin önüne geçemez.",
        ],
        quote: "Gelir, dikkati satmaktan değil; insana gerçek değer sunmaktan doğmalıdır.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-30-bolum-ii-strateji",
    number: "015",
    title: "Yaşayan Mimari",
    subtitle: "Bugünü çözerken geleceği taşıyan teknik omurga",
    passages: [
      {
        title: "Modüler Temel",
        paragraphs: [
          "Şehirler, hikâyeler ve sistemler aynı anda değil, doğru sırayla büyür. Teknik mimari her yeni parçanın bütünü bozmadan eklenebilmesini ve gerektiğinde bağımsız gelişebilmesini sağlamalıdır.",
          "Web deneyimleri erken fikirleri doğrular; yüksek nitelikli gerçek zamanlı dünya ise uzun vadeli üretim hedefini taşır. Araçlar farklı olsa da veri ve kimlik aynı kaynaktan beslenir.",
        ],
      },
      {
        title: "Değişime Dayanmak",
        paragraphs: [
          "Kod ve teknoloji değişecektir. Sağlam mimari, değişimi inkâr etmez; ana sözleşmeleri koruyarak ona yer açar.",
        ],
        quote: "İyi mimari yalnızca bugünü çalıştırmaz; yarının değişimine alan bırakır.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-31-bolum-ii-strateji",
    number: "016",
    title: "İlk Üç Yıl",
    subtitle: "Büyük vizyonu doğru sıradaki küçük adımlar taşır",
    passages: [
      {
        title: "Birinci Yıl — Temel",
        paragraphs: [
          "İlk amaç en büyük dünyayı kurmak değil; Adana’da oynanabilir, anlaşılır ve ölçülebilir bir çekirdek deneyimi doğrulamaktır. Hareket, etkileşim, üretim ve ilk topluluk testleri aynı sağlam temelde buluşur.",
        ],
      },
      {
        title: "İkinci Yıl — Derinlik",
        paragraphs: [
          "Temel doğrulandığında şehir daha derin davranmaya başlar. Mevsimler, topluluk etkinlikleri, ekonomi katmanı ve içerik araçları gerçek kullanıcı davranışıyla sınanır.",
        ],
      },
      {
        title: "Üçüncü Yıl — Platform",
        paragraphs: [
          "Öğrenilenler yeni şehirlere, yerel üretici ve kültür iş birliklerine taşınır. Büyümenin ölçüsü hız değil; her yeni adımın sonrakini daha güvenli hâle getirmesidir.",
        ],
        quote: "Hızlı büyümek mümkün olabilir. Sağlam büyümek zorunludur.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-32-bolum-iii-yatirim-dosyasi",
    number: "017",
    title: "Geleceğe Verilen Güven",
    subtitle: "Yatırım dosyası",
    passages: [
      {
        title: "Problem ve Niyet",
        paragraphs: [
          "Dijital deneyimler güçlenirken şehirlerin hikâyeleri, yerel üretimin bilgisi ve kültürel hafıza parçalı kalıyor. Caelinus bu parçaları tek bir yaşayan deneyimde buluşturmayı önerir.",
          "Bugünkü çalışma tamamlanmış bir dünya değil; çözülmesi gereken problemi, kurulacak deneyimi ve doğrulanacak ilk adımları açıkça tanımlayan erken bir temeldir.",
        ],
      },
      {
        title: "Ortaklık Daveti",
        paragraphs: [
          "İstenen yalnızca finansman değildir. Kültürel doğruluk, teknik disiplin, sürdürülebilir üretim ve ölçülebilir ilerleme konusunda aynı sorumluluğu paylaşacak ortaklardır.",
        ],
        quote: "Her yatırım, aslında geleceğe verilmiş bir güvendir.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-33-bolum-iii-vizyon",
    number: "018",
    title: "2036 — Yaşayan Bir Uygarlık",
    subtitle: "Geleceğin hafızasını bugünden korumak",
    passages: [
      {
        title: "Bir Sabah",
        paragraphs: [
          "Dünyanın herhangi bir yerindeki bir çocuk Caelinus’u açar. Karşısında ezberlenmiş bir harita değil; şehirleri konuşan, mevsimleri değişen, insanları üreten ve geçmişi bugüne bağlayan yaşayan bir Türkiye bulur.",
          "Belki kurucuların adını bilmez. Fakat bir ağacın, ustanın veya şehrin neden unutulmaması gerektiğini hisseder.",
        ],
      },
      {
        title: "Değişmeyen İhtiyaç",
        paragraphs: [
          "Teknoloji, şirketler ve pazarlar değişecektir. İnsanın ait olma, hatırlanma ve kendinden daha büyük bir hikâyeye bağlanma ihtiyacı kalacaktır.",
        ],
        quote: "Caelinus, tamamlanmış bir gelecek vaadi değil; o geleceğe özenle yürüme sözüdür.",
      },
    ],
  },
  {
    sourceSectionId: "genesis-34-son-sayfa",
    number: "∞",
    title: "Kurucunun Yemini",
    subtitle: "Son sayfa değil, taşınacak söz",
    passages: [
      {
        title: "Hatırlayanlara",
        paragraphs: [
          "Bir gün bu metin bir rafta, bir masada veya hiç tanımadığımız bir çocuğun elinde olabilir. İsimler unutulsa bile niyetin anlaşılması yeterlidir: kültürü tüketmeyen, yaşatan bir teknoloji kurmak.",
        ],
      },
      {
        title: "Söz",
        bullets: [
          "Kısa vadeli kazanç için uzun vadeli değerlerden vazgeçmemek.",
          "İnsanların dikkatini değil, güvenini kazanmaya çalışmak.",
          "Kültürü kullanan değil, onu geleceğe taşıyan sistemler üretmek.",
          "Hızdan önce sağlamlığı, gösteriden önce anlamı seçmek.",
          "Her kararda bu dünyanın insana ve hafızaya hizmet edip etmediğini sormak.",
        ],
        quote: "Şehir kurmuyorum. İnsanlara ait oldukları yeri yeniden hatırlatıyorum. — Selin Irmak",
      },
    ],
  },
];
