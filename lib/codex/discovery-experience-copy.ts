export const DISCOVERY_SLUGS = [
  "yasam-agaci",
  "ilk-meydan",
  "ilk-bilge",
] as const;

export type DiscoverySlug = (typeof DISCOVERY_SLUGS)[number];

export type DiscoverySectionCopy = {
  id: string;
  title: string;
  eyebrow: string;
  paragraphs: string[];
  bullets?: string[];
};

export type DiscoveryDossierCopy = {
  slug: DiscoverySlug;
  kind: "symbol" | "place" | "npc";
  glyph: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  canonicalEntityId?: string;
  canonicalAssetIds: string[];
  sections: DiscoverySectionCopy[];
  relatedLinks: Array<{
    label: string;
    detail: string;
    href: string;
  }>;
};

export const DISCOVERY_DOSSIERS: Record<
  DiscoverySlug,
  DiscoveryDossierCopy
> = {
  "yasam-agaci": {
    slug: "yasam-agaci",
    kind: "symbol",
    glyph: "⌘",
    title: "Yaşam Ağacı",
    subtitle: "Kökleri Anadolu’da, dalları gelecekte yaşayan ortak imza.",
    statusLabel: "Yaşayan sembol sistemi · Genesis bağlantısı",
    canonicalEntityId: "yasamagaci",
    canonicalAssetIds: [
      "IMG-CAEL-0001",
      "IMG-CAEL-0002",
      "IMG-CAEL-0003",
      "IMG-CAEL-0132",
    ],
    sections: [
      {
        id: "koken",
        eyebrow: "Sembol Katmanı 01",
        title: "Köken",
        paragraphs: [
          "Yaşam Ağacı, Caelinus’un bir kahramana ya da tek bir döneme ait olmayan işaretidir. Zeytin ağacının sabrı, Anadolu’nun katmanlı hafızası ve gelecek kuşaklara bırakılan gölge aynı gövdede birleşir.",
          "Kökler geçmişi saklamaz; bugünü besler. Dallar şehirlerin ayrı kimliklerine açılır. Yapraklar ise o şehirleri yaşayan, üreten ve hatırlayan insanları temsil eder.",
        ],
      },
      {
        id: "anlam",
        eyebrow: "Sembol Katmanı 02",
        title: "Sembol Anlamı",
        paragraphs: [
          "Ağaç, sahipliği değil aidiyeti anlatır. Merkezde bir iktidar işareti değil; her varlığın diğerine bağlı olduğunu hatırlatan yaşayan bir sistem vardır.",
        ],
        bullets: [
          "Kök: köken, hafıza ve görünmeyen bağlar.",
          "Gövde: ortak dil ve kuşaklar arası süreklilik.",
          "Dal: kendi karakterini koruyan şehir.",
          "Yaprak: birey, emek ve yaşayan katkı.",
          "Işık: bilginin ortaya çıkışı ve paylaşılması.",
        ],
      },
      {
        id: "glyph",
        eyebrow: "Sembol Katmanı 03",
        title: "Glyph Sistemi",
        paragraphs: [
          "Caelinus glyph’leri ağacın geometrisinden türeyen bir yön bulma ve anlam katmanıdır. Her işaret okunabilir, sade ve malzemenin doğasına uyumlu kalır; dekor olmak için değil, dünyanın hafızasını taşımak için kullanılır.",
          "Glyph ailesinin görsel ilkeleri ve anlam omurgası hazırdır. Nihai işaret seti, üretim yol haritasında okunabilirlik ve farklı malzemelerde uygulanabilirlik testleriyle tamamlanacaktır.",
        ],
      },
      {
        id: "baglar",
        eyebrow: "Sembol Katmanı 04",
        title: "Yaşayan Bağlar",
        paragraphs: [
          "Yaşam Ağacı kitap kapağında mühür, dünyada yön işareti, Hafıza Taşı’nda bilgi katmanı ve İlk Bilge’nin anlatısında kuşaklar arası söz olarak görünür.",
        ],
      },
    ],
    relatedLinks: [
      {
        label: "Art Direction Bible",
        detail: "Yaşam Ağacı — Ortak İmza",
        href: "/archive/chapter/art-direction#art-9-aura-nin-buyuk-fikri",
      },
      {
        label: "Hafıza Taşı",
        detail: "Sembolün oyun mekaniğine dönüştüğü Master Asset",
        href: "/archive/asset/IMG-CAEL-0038",
      },
      {
        label: "İlk Bilge",
        detail: "Sembolün sözlü hafızadaki taşıyıcısı",
        href: "/archive/discover/ilk-bilge",
      },
    ],
  },
  "ilk-meydan": {
    slug: "ilk-meydan",
    kind: "place",
    glyph: "⌂",
    title: "İlk Meydan",
    subtitle: "Bir şehrin kendini ilk kez birlikte hatırladığı yer.",
    statusLabel: "Dünya ve mekân sistemi · Adana Taş Meydanı",
    canonicalAssetIds: ["IMG-CAEL-0033", "IMG-CAEL-0042"],
    sections: [
      {
        id: "sahne",
        eyebrow: "Mekân Katmanı 01",
        title: "Unreal Sahnesi",
        paragraphs: [
          "İlk Meydan, Adana Taş Meydanı’nın Genesis içindeki Experience adıdır. Oyuncuyu bir görev merkezine değil; çeşme, pazar, hikâye panosu, han ve gündelik geçişlerin birlikte yaşadığı toplumsal bir kalbe kabul eder.",
          "42×38 metrelik üretim çerçevesi, modüler çevre parçaları, günün vakitleri ve etkileşim noktaları tanımlıdır. Gerçek zamanlı sahne üretim teslimiyle bu sayfadaki 3D deneyime bağlanacaktır.",
        ],
      },
      {
        id: "cevre",
        eyebrow: "Mekân Katmanı 02",
        title: "Çevresindeki İnsanlar",
        paragraphs: [
          "Meydanın çevresinde Pazarcı Hatun, Yaşlı Hikâyeci ve Gezici Tüccar gibi yaşayan karakterler bulunur. Burada insan kalabalığı dekor değildir; mekânın hangi saatte ve neden yaşadığını belirleyen ana sistemdir.",
        ],
        bullets: [
          "Pazarcı Hatun: üretim ve gündelik ekonomi.",
          "Yaşlı Hikâyeci: sözlü hafıza ve kuşaklar arası bağ.",
          "Gezici Tüccar: şehirler arası haber ve malzeme akışı.",
        ],
      },
      {
        id: "etkinlikler",
        eyebrow: "Living World System",
        title: "Etkinlikler",
        paragraphs: [
          "Meydanın etkinlik sistemi; sabah pazarı, akşam anlatısı ve mevsimsel buluşmaları aynı yaşayan takvimde bir araya getirir. Her etkinlik şehir ekonomisini, NPC ilişkilerini ve kolektif hafızayı besler.",
        ],
        bullets: [
          "Sabah pazarı: üretici, ürün ve şehir ekonomisi.",
          "Hikâye saati: sözlü tarih ve yeni hafıza kayıtları.",
          "Ortak sofra: aidiyet ve topluluk ilişkileri.",
          "Mevsim dönüşü: ışık, bitki ve üretim ritminin değişimi.",
        ],
      },
      {
        id: "tarih",
        eyebrow: "Mekân Katmanı 04",
        title: "Tarih Katmanları",
        paragraphs: [
          "Meydan tek bir dönemin yeniden inşası değildir. Taş, su, ticaret, anlatı ve bugünün dijital izleri üst üste yaşar. Tarih katmanları, yeni arşiv kayıtları doğrulandıkça genişleyen yaşayan bir yapı olarak tasarlanır.",
        ],
      },
    ],
    relatedLinks: [
      {
        label: "World Bible",
        detail: "Location: Meydan",
        href: "/archive/chapter/world-bible",
      },
      {
        label: "NPC Bible",
        detail: "Meydanın yaşayan insanları",
        href: "/archive/chapter/npc-bible",
      },
      {
        label: "İlk Bilge",
        detail: "Meydandaki sözlü hafıza kapısı",
        href: "/archive/discover/ilk-bilge",
      },
    ],
  },
  "ilk-bilge": {
    slug: "ilk-bilge",
    kind: "npc",
    glyph: "♙",
    title: "İlk Bilge",
    subtitle: "Şehrin geçmişini anlatmayan; onun nasıl dinleneceğini öğreten kişi.",
    statusLabel: "Yaşayan NPC sistemi · Yaşlı Hikâyeci arketipi",
    canonicalAssetIds: ["IMG-CAEL-0033"],
    sections: [
      {
        id: "kimlik",
        eyebrow: "NPC Katmanı 01",
        title: "Kimlik",
        paragraphs: [
          "İlk Bilge, Genesis’in oyuncuyu NPC Bible’a açan yaşayan karakter köprüsüdür. Meydanın Yaşlı Hikâyeci arketipinden doğar ve sözlü hafızayı oyuncunun kişisel yolculuğuna bağlar.",
          "Bilge oyuncuya uzun açıklamalar vermez. Bir taşı, ağacı ya da insanı doğru soruyla görmesini sağlar. Onun görevi cevap dağıtmak değil, merakı bir sorumluluğa dönüştürmektir.",
        ],
      },
      {
        id: "hafiza",
        eyebrow: "NPC Katmanı 02",
        title: "Hafıza ile İlişkisi",
        paragraphs: [
          "Bilge, Hafıza Taşı’nı etkinleştiren kişi değildir. Taşın taşıdığı sesleri dinlemek için gereken sabrı öğretir. Böylece bilgi bir ödül ekranı değil; insan, mekân ve zaman arasında kurulan ilişki olur.",
        ],
      },
      {
        id: "davranis",
        eyebrow: "NPC Katmanı 03",
        title: "Davranış Dili",
        bullets: [
          "Oyuncunun gelişini beklemeden kendi günlük ritmini sürdürür.",
          "Aynı soruya günün saatine ve oyuncunun geçmişine göre farklı yaklaşır.",
          "Görev işareti taşımaz; mekân, bakış ve kısa cümlelerle yön verir.",
          "Oyuncunun öğrendiği bilgiyi değil, onunla ne yaptığını hatırlar.",
        ],
        paragraphs: [
          "Bu davranış dili NPC Bible, Engineering ve Unreal katmanlarını aynı karakter vizyonunda birleştirir; teknik uygulama üretim yol haritasında adım adım doğrulanır.",
        ],
      },
      {
        id: "baglar",
        eyebrow: "NPC Katmanı 04",
        title: "İlişkili Sistemler",
        paragraphs: [
          "İlk Bilge; İlk Meydan’ın toplumsal ritmine, Yaşam Ağacı’nın sembol diline ve Hafıza Taşı’nın bilgi mekaniğine açılan insan kapısıdır.",
        ],
      },
    ],
    relatedLinks: [
      {
        label: "NPC Bible’ı Aç",
        detail: "Karakter, meslek ve davranış sistemleri",
        href: "/archive/chapter/npc-bible",
      },
      {
        label: "İlk Meydan",
        detail: "Bilge’nin yaşadığı toplumsal merkez",
        href: "/archive/discover/ilk-meydan",
      },
      {
        label: "Yaşam Ağacı",
        detail: "Bilge’nin taşıdığı sembol dili",
        href: "/archive/discover/yasam-agaci",
      },
    ],
  },
};

export const MEMORY_STONE_TAB_COPY = [
  {
    id: "lore",
    label: "Lore",
    title: "Taşın Hatırladığı",
    paragraphs: [
      "Hafıza Taşı bir koleksiyon nesnesi değildir. Bir yerde yaşamış insanların sesini, emeğini ve izini taşıyan karşılaşma noktasıdır.",
      "Oyuncu taşa dokunduğunda ödül toplamaz; bulunduğu yerin daha önce göremediği bir katmanına yaklaşır. Pasif, temas, ışık yükselişi ve hafıza açılımı aşamaları bu karşılaşmanın ritmini kurar.",
    ],
  },
  {
    id: "three-d",
    label: "3D Görünüm",
    title: "Model Readiness",
    paragraphs: [
      "Onaylı ölçek, malzeme, Nanite ve LOD kararları 3D üretim paketini yönlendirir. GLB ve Unreal aktarım modeli tamamlandığında bu panel gerçek zamanlı görüntüleyiciye dönüşecektir.",
    ],
  },
  {
    id: "blueprint",
    label: "Blueprint",
    title: "BP_CAEL_HafizaTasi",
    paragraphs: [
      "Blueprint akışı yaklaşma, temas, ışık yükselişi, hafıza açılımı ve sakinleşme durumlarını yönetir. Etkileşim tek bir tuş olayına değil; oyuncunun mesafesi, taşıdığı bilgi ve dünya hafızasına bağlanır.",
    ],
    bullets: [
      "Pasif: çevreyle aynı ritimde bekler.",
      "Temas: oyuncunun yaklaşımını ve uygunluğunu okur.",
      "Işık Yükselişi: glyph ve malzeme katmanlarını görünür kılar.",
      "Hafıza Açılımı: lore, görev, rota veya sinematik bağını açar.",
    ],
  },
  {
    id: "production",
    label: "Production Bible",
    title: "Master Asset Paketi",
    paragraphs: [
      "Phase D paketi kimlik, ölçek, malzeme, texture, collision, ses, VFX ve oyun entegrasyonunu tek üretim omurgasında toplar. Görsel kaynaklar salt okunur referanstır; çalışma mesh’i değildir.",
    ],
  },
  {
    id: "engineering",
    label: "Engineering",
    title: "Teknik Sınırlar",
    paragraphs: [
      "Taş 3.20 × 1.40 × 0.90 metre, kaidesi 4.60 metre olarak tanımlıdır. Static Mesh, özel collision, üç malzeme slotu ve 4K PBR seti hedeflenir.",
    ],
  },
  {
    id: "nanite",
    label: "Nanite",
    title: "Geometri Stratejisi",
    paragraphs: [
      "Hero kullanımında yüksek yüzey ayrıntısı Nanite ile korunur. Kimlik silhouette ve glyph okunabilirliğine bağlıdır; optimizasyon bu iki öğeyi zayıflatamaz.",
    ],
  },
  {
    id: "lod",
    label: "LOD",
    title: "Mesafe Stratejisi",
    paragraphs: [
      "Nanite dışı hedefler için LOD zinciri tanımlıdır. Optimizasyon değerleri gerçek 3D model üzerinde ölçülerek production teslimiyle kesinleştirilecektir.",
    ],
  },
] as const;

export const GENESIS_DISCOVERY_GATES = [
  {
    id: "hafiza-tasi",
    glyph: "◆",
    kind: "Asset",
    title: "Hafıza Taşı",
    description: "Lore, 3D readiness, Blueprint, Nanite ve LOD.",
    href: "/archive/asset/IMG-CAEL-0038",
    imageSrc: "/api/archive/asset/IMG-CAEL-0038",
  },
  {
    id: "yasam-agaci",
    glyph: "⌘",
    kind: "Sembol",
    title: "Yaşam Ağacı",
    description: "Köken, glyph sistemi ve yaşayan bağlar.",
    href: "/archive/discover/yasam-agaci",
    imageSrc: "/api/archive/asset/IMG-CAEL-0001",
  },
  {
    id: "ilk-meydan",
    glyph: "⌂",
    kind: "Mekân",
    title: "İlk Meydan",
    description: "Unreal sahnesi, NPC’ler, etkinlik ve tarih katmanları.",
    href: "/archive/discover/ilk-meydan",
    imageSrc: "/api/archive/asset/IMG-CAEL-0033",
  },
  {
    id: "ilk-bilge",
    glyph: "♙",
    kind: "NPC",
    title: "İlk Bilge",
    description: "Yaşlı Hikâyeci’den NPC Bible’a açılan insan kapısı.",
    href: "/archive/discover/ilk-bilge",
    imageSrc: "/api/archive/asset/IMG-CAEL-0033",
  },
] as const;
