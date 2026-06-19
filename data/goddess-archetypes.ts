/**
 * CAELINUS — 12 Tanrıça Arketipi · Ruhsal & Görsel DNA (saf veri)
 *
 * Kaynak: CAELINUS_GODDESS_ARCHETYPES_BIBLE.md (tek doğru kaynak).
 * Avatar Bible Bölüm 3 ile uyumlu. Her tanrıça bir FREKANS PAKETİdir:
 * renk + aura + saç/kıyafet/takı dili + semboller + ışık + district
 * ilişkileri + AI prompt dili (avatar/portrait/fashion/3d).
 *
 * Bu veri, doğuş akışındaki "Tanrıça Seç" kartlarını ve portre
 * kompozisyonunun renk/sembol/ışık DNA'sını besler.
 *
 * NOT: Bu, Moda AI adaptörü olan `lib/data/goddess-archetypes.ts`'ten
 * AYRI ve farklı bir dosyadır (o 6 marka arketibinin projeksiyonu;
 * bu 12 mitolojik tanrıça DNA'sı). Saf veri — server-only import ETMEZ.
 */

import type { AvatarDistrictId } from "./avatar-districts";

export type GoddessId =
  | "selene"
  | "gaia"
  | "freya"
  | "sophia"
  | "artemis"
  | "isis"
  | "inanna"
  | "persephone"
  | "hekate"
  | "athena"
  | "aphrodite"
  | "kali";

/** Mevcut data/archetypes.ts ten/ışık tonlarıyla köprü. */
export type GoddessTone = "light" | "golden" | "dark" | "cosmic" | "minimal";

export interface GoddessPalette {
  /** Birincil kimlik rengi. */
  primary: string;
  /** İkincil (gölge/derinlik) rengi. */
  secondary: string;
  /** Vurgu / parıltı rengi. */
  accent: string;
  /** Ten/ışık tonu köprüsü. */
  tone: GoddessTone;
}

export interface GoddessDistricts {
  /** Doğal yuva — burada en güçlü. */
  home: AvatarDistrictId;
  strong: AvatarDistrictId[];
  weak: AvatarDistrictId[];
}

export interface GoddessPromptLanguage {
  avatar: string;
  portrait: string;
  fashion: string;
  model3d: string;
}

/**
 * Ruh katmanı — Soul Bible'daki 8 boyut. SANRI Caelinus-side composer (Phase 4)
 * bunları okur. Türkçe, 2. kişi-dostu, kısa. Bunlar TEŞHİS DEĞİL; ayna.
 * Etik sınır: CAELINUS_AVATAR_SOUL_BIBLE.md §Etik (şefkat tonu, kriz yönlendirmesi).
 */
export interface GoddessSoul {
  /** Gölgede kalan, kaçılan yan. */
  shadow: string;
  /** Doğal hediye, en parlak kapasite. */
  strength: string;
  /** İyileşmeye çalıştığı kök yara. */
  wound: string;
  /** Nasıl sever / sevilmek ister. */
  loveLanguage: string;
  /** En derin korku. */
  fearLanguage: string;
  /** Bolluk/değer ile ilişki. */
  moneyLanguage: string;
  /** Bağ kurma biçimi, sınırları. */
  relationLanguage: string;
  /** Bu yaşamda öğrenmeye geldiği ders (okumanın çatısı). */
  soulTask: string;
}

export interface GoddessArchetype {
  id: GoddessId;
  /** Görünen ad. */
  name: string;
  /** Unvan (Ay Tanrıçası…). */
  title: string;
  /** Tek kelime frekans — kartta öne çıkar. */
  frequency: string;
  /** Kartta gösterilen açılış cümlesi. */
  opening: string;
  origin: { myth: string; caelinus: string };
  palette: GoddessPalette;
  aura: string;
  hair: string;
  clothing: string;
  jewelry: string;
  symbols: string[];
  /** Kart + portre kompozisyonu için tek sembol işareti. */
  symbolGlyph: string;
  light: string;
  districts: GoddessDistricts;
  promptLanguage: GoddessPromptLanguage;
  soul: GoddessSoul;
}

export const GODDESS_ARCHETYPES: Record<GoddessId, GoddessArchetype> = {
  selene: {
    id: "selene",
    name: "Selene",
    title: "Ay Tanrıçası",
    frequency: "Sezgi",
    opening: "Gecenin ve döngülerin sessiz bilgeliği.",
    origin: { myth: "Yunan ay tanrıçası", caelinus: "Sezgi, gece bilgeliği, döngüler" },
    palette: { primary: "#9fb8d8", secondary: "#1b2540", accent: "#eef3ff", tone: "cosmic" },
    aura: "Sisli gümüş hale, yavaş dalgalanan parıltı",
    hair: "Uzun, akan, ay ışığı vurgulu, yumuşak dalga",
    clothing: "Akan ipek, asimetrik drape, ay ışığı pırıltısı",
    jewelry: "Hilal alın takısı, gümüş, opal, inci",
    symbols: ["crescent", "mirror", "pearl", "night-flower"],
    symbolGlyph: "☾",
    light: "Soğuk ay ışığı, yumuşak mavi rim-light, sisli gloom",
    districts: { home: "sanri", strong: ["mirror", "source"], weak: ["bazaar"] },
    promptLanguage: {
      avatar:
        "ethereal moon goddess, silver-blue luminescence, crescent diadem, flowing silk, serene gaze, soft moonlit rim light",
      portrait:
        "serene distant face, silver rim light, crescent diadem sharp, night mist background",
      fashion:
        "full-body flowing silk gown, asymmetric drape, moonlit shimmer, slow movement",
      model3d:
        "pearlescent skin shader, silver-blue emissive rim, anisotropic shimmering hair",
    },
    soul: {
      shadow: "Kaçış — gerçekten uzaklaşıp gece/hayal dünyasına sığınma",
      strength: "Sezgi — söylenmeyeni bilmek, döngüleri okumak",
      wound: "Görülmemek; fazla görünürse kaybolacağı korkusu",
      loveLanguage: "Sessiz varlık, derin anlaşılma, kelimesiz huzur",
      fearLanguage: "Aydınlığa çıkmak, sahnede olmak, çıplak görünmek",
      moneyLanguage: "Akış — para gelir gider, döngülere güvenir; biriktirmekte zorlanır",
      relationLanguage: "Derin ama mesafeli; az kişiyle çok bağ; geri çekilme ihtiyacı",
      soulTask: "Sezgisine güvenip ışığını saklamadan parlamayı öğrenmek",
    },
  },
  gaia: {
    id: "gaia",
    name: "Gaia",
    title: "Toprak Ana",
    frequency: "Köklülük",
    opening: "Toprağın bereketi, şifanın kaynağı.",
    origin: { myth: "İlksel toprak tanrıçası", caelinus: "Köklülük, bereket, şifa" },
    palette: { primary: "#7faa5a", secondary: "#5b4326", accent: "#e7c970", tone: "golden" },
    aura: "Yeşil-altın canlı parıltı, uçuşan polen/ışık zerreleri",
    hair: "Kalın, doğal, içine örülmüş yaprak/dal; toprak tonları",
    clothing: "Organik dokuma, yaprak katmanları, doğal lif, akışkan",
    jewelry: "Ahşap, kehribar, yeşim, canlı bitki örgüsü",
    symbols: ["vine", "seed", "sacred-circle", "tree-root"],
    symbolGlyph: "✿",
    light: "Sıcak öğleden sonra ışığı, yapraktan süzülen dappled light",
    districts: { home: "gaia", strong: ["sanctuary", "source"], weak: ["mirror"] },
    promptLanguage: {
      avatar:
        "earth mother goddess, moss-green and gold, woven organic robes, vines in hair, warm dappled forest light, abundant living aura",
      portrait:
        "warm face, leaves in hair, gold-green light, earthen background",
      fashion:
        "layered organic gown, leaf detailing, natural flow, abundant feeling",
      model3d:
        "warm subsurface-scatter skin, real-geometry leaves, soft green ambient light",
    },
    soul: {
      shadow: "Aşırı verme — kendini tüketene dek başkalarını besleme",
      strength: "Şifa ve bereket — büyütmek, kök saldırmak, beslemek",
      wound: "İhmal edilme; 'ben kimi besliyorum, beni kim besliyor?' yarası",
      loveLanguage: "Bakım, beslemek, fiziksel mevcudiyet, sıcaklık",
      fearLanguage: "Köksüzlük, terk edilme, kuraklık (sevgisiz kalmak)",
      moneyLanguage: "Bolluk doğaldır ama akışı paylaşmaktan kendine pay ayıramaz",
      relationLanguage: "Koşulsuz bağlanma, derin sadakat; bırakmakta zorlanma",
      soulTask: "Önce kendini besleyerek gerçek bereketi öğrenmek",
    },
  },
  freya: {
    id: "freya",
    name: "Freya",
    title: "Aşk ve Savaş Tanrıçası",
    frequency: "Tutku",
    opening: "Aşk ve cesaretin vahşi özgürlüğü.",
    origin: { myth: "İskandinav tanrıçası", caelinus: "Tutku, cesaret, vahşi özgürlük" },
    palette: { primary: "#c9722f", secondary: "#7a1f1f", accent: "#e8b15a", tone: "golden" },
    aura: "Altın kıvılcımlar, sıcak enerji dalgaları, hareketli ışık",
    hair: "Gür, dalgalı, kızıl-altın; rüzgârda savrulan; örgü detayları",
    clothing: "Zırh + ipek karışımı, tüy detayları, güçlü silüet",
    jewelry: "Altın torc, kehribar, dövülmüş metal",
    symbols: ["falcon-feather", "amber", "sword", "cat"],
    symbolGlyph: "⚔",
    light: "Sıcak gün batımı, dramatik kontrast, altın spot",
    districts: { home: "bazaar", strong: ["atelier", "source"], weak: ["temple"] },
    promptLanguage: {
      avatar:
        "warrior love goddess, red-gold and amber, armor-silk fusion, falcon feathers, fierce confident gaze, dramatic sunset light",
      portrait:
        "strong determined gaze, amber jewelry, gold sunset contrast",
      fashion:
        "armor-gown fusion, feather accent, powerful shoulders, motion and power",
      model3d:
        "metallic armor PBR + silk cloth sim, warm rim, spark particles",
    },
    soul: {
      shadow: "Kıskançlık ve sahiplenme; tutkuyu kontrole çevirme",
      strength: "Cesaret ve tutku — istediğini ister, korkmadan sever",
      wound: "İstediğini istemenin 'fazla' olduğu inancı; reddedilme",
      loveLanguage: "Tutku, yoğunluk, sahici istek, bedensel ve duygusal cömertlik",
      fearLanguage: "İstenmemek, arzunun karşılıksız kalması",
      moneyLanguage: "Cömert ve cesur; risk alır, bazen tutkuyla savurur",
      relationLanguage: "Ateşli, tam teslim ama özgürlük ister; sahiplenme/özgürlük gerilimi",
      soulTask: "Tutkuyu sahiplenmeden, özgürce sevmeyi öğrenmek",
    },
  },
  sophia: {
    id: "sophia",
    name: "Sophia",
    title: "Bilgelik Tanrıçası",
    frequency: "Bilgelik",
    opening: "Kutsal geometrinin ve içgörünün dingin ışığı.",
    origin: { myth: "Gnostik bilgelik figürü", caelinus: "İçgörü, kutsal geometri, sükûnet" },
    palette: { primary: "#2d3f6b", secondary: "#e9e2c5", accent: "#bcd4f5", tone: "light" },
    aura: "Sakin mavi-beyaz hale, ince ışık halkaları, geometrik parıltı",
    hair: "Düzgün, asil, toplanmış veya yumuşak; temiz çizgi",
    clothing: "Mimari kıvrımlar, temiz çizgiler, asil heykelsi drape",
    jewelry: "İnce altın geometri, beyaz taş, halka motifleri",
    symbols: ["book", "sacred-geometry", "dove", "star-map"],
    symbolGlyph: "◈",
    light: "Berrak yüksek ışık, geniş soft fill, gölgesiz dinginlik",
    districts: { home: "source", strong: ["sanri", "mirror"], weak: ["bazaar"] },
    promptLanguage: {
      avatar:
        "wisdom goddess, deep navy and white-gold, architectural drapery, sacred geometry halo, serene knowing gaze, clear luminous light",
      portrait:
        "calm wise face, fine gold geometry jewelry, clear light",
      fashion:
        "sculptural clean gown, architectural folds, noble posture",
      model3d:
        "matte elegant cloth, fine emissive geometry ring, clear neutral light",
    },
    soul: {
      shadow: "Aşırı zihinsellik — kalpten kopup soğuk bilgeliğe çekilme",
      strength: "İçgörü ve berraklık — özü görmek, sükûnetle bilmek",
      wound: "Hissetmek yerine anlamaya kaçma; duyguya güvensizlik",
      loveLanguage: "Anlam paylaşımı, derin sohbet, zihinsel yakınlık",
      fearLanguage: "Yanılmak, bilmemek, kontrolü kaybetmek",
      moneyLanguage: "Ölçülü, akılcı; değeri anlamla ölçer, maddeye mesafeli",
      relationLanguage: "Seçici, derin, az; yüzeysellikten kaçınır",
      soulTask: "Bilgeliği zihinden kalbe indirmeyi öğrenmek",
    },
  },
  artemis: {
    id: "artemis",
    name: "Artemis",
    title: "Av ve Vahşi Doğa Tanrıçası",
    frequency: "Bağımsızlık",
    opening: "Vahşi doğanın odaklı, özgür koruyucusu.",
    origin: { myth: "Yunan av tanrıçası", caelinus: "Bağımsızlık, odak, koruyuculuk" },
    palette: { primary: "#3f5e44", secondary: "#9aa6ad", accent: "#6f8a99", tone: "minimal" },
    aura: "Keskin gümüş kontur, soğuk net enerji, az ama belirgin",
    hair: "Pratik, toplanmış, atletik; örgü/at kuyruğu; sade",
    clothing: "Hareket özgürlüğü, kısa tunik, deri detay, atletik silüet",
    jewelry: "Sade gümüş, kemik/boynuz, minimal",
    symbols: ["bow", "deer", "crescent", "forest"],
    symbolGlyph: "➹",
    light: "Alacakaranlık orman ışığı, dappled, soğuk net kontur",
    districts: { home: "gaia", strong: ["source", "sanctuary"], weak: ["bazaar"] },
    promptLanguage: {
      avatar:
        "huntress goddess, forest-green and silver, short athletic tunic, bow, focused fierce eyes, cold dappled twilight forest light",
      portrait:
        "focused sharp gaze, plain silver jewelry, twilight forest",
      fashion:
        "athletic short tunic, leather accessory, motion-ready stance",
      model3d:
        "athletic rig, matte leather/cloth, cold silver rim, natural shadow",
    },
    soul: {
      shadow: "Aşırı bağımsızlık — yardım/yakınlığı reddedip yalnızlaşma",
      strength: "Odak ve özgürlük — kendi yolunu net çizmek, korumak",
      wound: "Güvenmenin tehlikeli olduğu inancı; ihanet yarası",
      loveLanguage: "Alan tanımak, sadakat, ortak amaç, sözden çok eylem",
      fearLanguage: "Bağımlı/kıstırılmış olmak, özgürlüğünü yitirmek",
      moneyLanguage: "Bağımsızlık aracı; özerklik için biriktirir, borçtan kaçar",
      relationLanguage: "Mesafeli özerk; derin ama 'kendi çadırım' şartıyla",
      soulTask: "Güçten ödün vermeden yakınlığa izin vermeyi öğrenmek",
    },
  },
  isis: {
    id: "isis",
    name: "Isis",
    title: "Sihir ve Annelik Tanrıçası",
    frequency: "Sihir",
    opening: "Koruyan, büyüleyen, yaşam veren kraliçe.",
    origin: { myth: "Mısır tanrıçası", caelinus: "Koruma, sihir, kraliçelik, yaşam gücü" },
    palette: { primary: "#1f4e8c", secondary: "#d9af4e", accent: "#36b8a6", tone: "golden" },
    aura: "Altın kanat izi, ihtişamlı hale, görkemli parıltı",
    hair: "Mısır silüeti, düz/kuşatılmış, altın bantlı; görkemli",
    clothing: "Kanat drape, altın yaka, Mısır silüeti, görkemli",
    jewelry: "Geniş altın yaka, lapis, scarabe, taç",
    symbols: ["wings", "ankh", "throne", "sirius"],
    symbolGlyph: "☥",
    light: "Görkemli altın ışık, parlak vurgular, tapınak parıltısı",
    districts: { home: "sanctuary", strong: ["bazaar", "temple"], weak: [] },
    promptLanguage: {
      avatar:
        "egyptian magic goddess, lapis blue and gold, winged drape, broad gold collar, ankh, regal protective gaze, majestic golden light",
      portrait:
        "majestic face, broad gold collar, lapis crown, temple light",
      fashion:
        "winged drape gown, gold collar, queenly posture",
      model3d:
        "gold metallic PBR collar, wing geometry/transparency, warm majestic light",
    },
    soul: {
      shadow: "Kurtarıcılık — herkesi taşıma, kendi ihtiyacını gizleme",
      strength: "Koruma ve onarma — parçalanmışı bir araya getirmek",
      wound: "Kayıp ve dağılma; 'sevdiğimi koruyamazsam' korkusu",
      loveLanguage: "Korumak, sadakatle yanında durmak, büyük adanmışlık",
      fearLanguage: "Kaybetmek, dağılmak, korumasız kalmak",
      moneyLanguage: "Güvenlik için; sevdiklerini koruyacak kale olarak kullanır",
      relationLanguage: "Derin adanma, kraliçe-koruyucu; bazen taşıyıcı rolüne sıkışır",
      soulTask: "Korurken kendini de korumayı, taşırken bırakmayı öğrenmek",
    },
  },
  inanna: {
    id: "inanna",
    name: "Inanna",
    title: "Gök Kraliçesi",
    frequency: "Egemenlik",
    opening: "Gök ile yerin arasında egemen yükseliş.",
    origin: { myth: "Sümer tanrıçası", caelinus: "Güç, tutku, yükseliş-iniş, kozmik egemenlik" },
    palette: { primary: "#5b3b8c", secondary: "#d9af4e", accent: "#1b2540", tone: "cosmic" },
    aura: "Mor-altın kozmik tozsu hale, yıldız bokeh",
    hair: "Hacimli, kraliyet; yıldız tokalı; yukarı doğru görkemli",
    clothing: "Kraliyet drape, yıldız işlemeleri, güçlü omuz hattı",
    jewelry: "Çok katlı altın, yıldız broş, lapis",
    symbols: ["eight-point-star", "lion", "gate", "crown"],
    symbolGlyph: "✴",
    light: "Kozmik gece + altın spot, yıldız parıltısı",
    districts: { home: "bazaar", strong: ["source", "mirror"], weak: ["gaia"] },
    promptLanguage: {
      avatar:
        "queen of heaven goddess, star-purple and gold, royal embroidered drape, eight-point star crown, commanding gaze, cosmic night light",
      portrait:
        "sovereign gaze, star crown, purple-gold cosmic background",
      fashion:
        "royal drape, star embroidery, powerful shoulders, majestic ascent",
      model3d:
        "purple-gold emissive embroidery, star particle halo, cosmic HDR",
    },
    soul: {
      shadow: "Güç açlığı ve gurur; düşüşü kabullenememe",
      strength: "Yükseliş ve egemenlik — sahne almak, ışıldamak, yön vermek",
      wound: "Değerinin başarısına bağlı olduğu inancı; iniş korkusu",
      loveLanguage: "Görülmek, takdir, eşit güçte bir bağ, ihtişam paylaşımı",
      fearLanguage: "Düşmek, küçülmek, tahtını/parıltısını kaybetmek",
      moneyLanguage: "Statü ve güç; cömert ama görünürlükle bağlı",
      relationLanguage: "Yoğun, dramatik; eşit ya da hiç; iniş-çıkışlı",
      soulTask: "Değerin parıltıdan değil, varlıktan geldiğini öğrenmek",
    },
  },
  persephone: {
    id: "persephone",
    name: "Persephone",
    title: "Yeraltı ve Bahar Tanrıçası",
    frequency: "İkilik",
    opening: "Ölüm ve baharın iki yüzlü dönüşümü.",
    origin: { myth: "Yunan ikilik tanrıçası", caelinus: "Dönüşüm, mevsim, ölüm-yeniden doğuş" },
    palette: { primary: "#8e2433", secondary: "#d98aa0", accent: "#2b2733", tone: "dark" },
    aura: "Pembe-siyah geçişli, dönüşen renk alanı (ikilik)",
    hair: "Çiçekli ama gölgeli; yarı örgü yarı serbest; iki-tonlu",
    clothing: "İki-yüzlü palet (yarı çiçek yarı gölge), katmanlı geçiş",
    jewelry: "Nar taneleri, altın taç, koyu taşlar",
    symbols: ["pomegranate", "asphodel", "crown", "threshold"],
    symbolGlyph: "◐",
    light: "Yarı sıcak yarı soğuk, dramatik geçiş ışığı",
    districts: { home: "mirror", strong: ["gaia", "sanri"], weak: ["temple"] },
    promptLanguage: {
      avatar:
        "goddess of duality, pomegranate red and rose with charcoal, half-bloom half-shadow gown, crown, transformative gaze, split warm-cold light",
      portrait:
        "half-warm half-cold face, pomegranate motif, transition light",
      fashion:
        "two-faced gown (bloom/shadow), layered transformation silhouette",
      model3d:
        "dual-zone shader (bloom/charcoal), gradient light, transition emission",
    },
    soul: {
      shadow: "İkiye bölünme — kimliğini başkasının dünyasına göre değiştirme",
      strength: "Dönüşüm — karanlıkta da çiçekte de var olabilmek",
      wound: "Kendine ait bir krallık olmaması; başkasının dünyasında yaşama",
      loveLanguage: "Derin dönüşümsel bağ; sevgiliyle birlikte değişmek",
      fearLanguage: "İki dünya arasında sıkışıp hiçbirine ait olamamak",
      moneyLanguage: "Mevsimsel; bolluk-kıtlık döngüleri, istikrarla zorlanma",
      relationLanguage: "Yoğun bağ ama kimlik kaybı riski; ait olma/özgün olma gerilimi",
      soulTask: "İki dünya arasında kendi krallığını kurmayı öğrenmek",
    },
  },
  hekate: {
    id: "hekate",
    name: "Hekate",
    title: "Eşik ve Büyü Tanrıçası",
    frequency: "Eşik",
    opening: "Kavşaklarda duran, dönüşümün anahtarı.",
    origin: { myth: "Yunan kavşak/büyü tanrıçası", caelinus: "Eşikler, dönüşüm, gizem" },
    palette: { primary: "#4a2d5e", secondary: "#2b2d33", accent: "#7fe6a0", tone: "dark" },
    aura: "Mor-siyah duman, kıvılcımlanan eşik enerjisi",
    hair: "Uzun, gölgeli, hareketli; kapüşon altında; karanlık parıltı",
    clothing: "Koyu kat kat pelerin, kapüşon, akan gölgeler",
    jewelry: "Anahtar motifleri, oksitlenmiş gümüş, obsidyen",
    symbols: ["three-roads", "key", "torch", "serpent"],
    symbolGlyph: "✠",
    light: "Meşale alevi + soğuk gölge, düşük anahtar (low-key)",
    districts: { home: "sanri", strong: ["mirror", "temple"], weak: ["bazaar"] },
    promptLanguage: {
      avatar:
        "goddess of thresholds, plum-purple and charcoal with phosphor green, layered hooded cloak, keys, mysterious gaze, torch and cold shadow",
      portrait:
        "mysterious face in hood shadow, key jewelry, torchlight",
      fashion:
        "layered hooded cloak, flowing shadow, threshold stance",
      model3d:
        "dark cloth sim, purple-green emissive accents, torch light + smoke particles",
    },
    soul: {
      shadow: "İzolasyon — eşikte kalıp hiçbir kapıdan geçmeme",
      strength: "Eşik bilgeliği — geçişleri, kavşakları, dönüşümü görmek",
      wound: "Ait olmamak, dışarıda/arada kalmışlık yarası",
      loveLanguage: "Gizli derinlik, koşulsuz kabul (en karanlık yanı dahil)",
      fearLanguage: "Görülüp reddedilmek; karanlığının dışlanması",
      moneyLanguage: "Bağımsız ve gizli; güç ve özgürlük aracı, gösterişsiz",
      relationLanguage: "Eşikte; derin ama tam içeri girmeyen; gizemli mesafe",
      soulTask: "Eşikte beklemeyi bırakıp bir kapıdan geçmeyi öğrenmek",
    },
  },
  athena: {
    id: "athena",
    name: "Athena",
    title: "Strateji ve Zanaat Tanrıçası",
    frequency: "Akıl",
    opening: "Strateji, zanaat ve onurlu güç.",
    origin: { myth: "Yunan akıl tanrıçası", caelinus: "Strateji, zanaat, onurlu güç" },
    palette: { primary: "#6e7a3f", secondary: "#9a6b3b", accent: "#ece3cf", tone: "minimal" },
    aura: "Sakin bronz-altın kontur, dengeli net enerji",
    hair: "Düzgün, toplanmış, asil; miğfer/bant ile; kontrollü",
    clothing: "Mimari zırh-drape, heykelsi temiz kıvrımlar",
    jewelry: "Bronz, sade altın, kalkan motifi",
    symbols: ["owl", "olive-branch", "shield", "helmet"],
    symbolGlyph: "◆",
    light: "Net gündüz ışığı, heykelsi modelleme, dengeli",
    districts: { home: "atelier", strong: ["source", "mirror"], weak: ["sanri"] },
    promptLanguage: {
      avatar:
        "strategy goddess, olive-green and bronze, architectural armor-drape, owl, composed dignified gaze, clear sculptural daylight",
      portrait:
        "dignified calm face, bronze jewelry, shield/owl accent, clear light",
      fashion:
        "sculptural armor-drape, clean folds, balanced powerful posture",
      model3d:
        "bronze metallic + matte cloth, sculptural key light, controlled shadow",
    },
    soul: {
      shadow: "Aşırı kontrol ve duygusuz mantık; kalbini zırhlama",
      strength: "Strateji ve onur — net görmek, doğru kararı vermek",
      wound: "Sevilmek için 'güçlü/yararlı' olmak zorunda olduğu inancı",
      loveLanguage: "Sadakat, güvenilirlik, ortak hedef, pratik destek",
      fearLanguage: "Zayıf/savunmasız görünmek, kontrolü kaybetmek",
      moneyLanguage: "Stratejik, güvenli, planlı; akıllı yönetir, riskten kaçar",
      relationLanguage: "Onurlu, sadık ama mesafeli; kırılganlıkta zorlanma",
      soulTask: "Zırhı indirip kırılgan olmaya izin vermeyi öğrenmek",
    },
  },
  aphrodite: {
    id: "aphrodite",
    name: "Aphrodite",
    title: "Aşk ve Güzellik Tanrıçası",
    frequency: "Çekim",
    opening: "Çekimin, uyumun ve zarafetin nefesi.",
    origin: { myth: "Yunan aşk tanrıçası", caelinus: "Çekim, uyum, zarafet" },
    palette: { primary: "#e7b7c4", secondary: "#bfe3d8", accent: "#d9a87e", tone: "light" },
    aura: "Işıltılı pembe-altın sis, köpüksü yumuşak ışık",
    hair: "Uzun, dalgalı, ışıltılı; deniz esintisi hissi; yumuşak",
    clothing: "Akışkan şeffaf katmanlar, deniz köpüğü dokusu",
    jewelry: "İnci, sedef, gül altını, ince zincirler",
    symbols: ["seashell", "rose", "dove", "foam"],
    symbolGlyph: "✽",
    light: "Yumuşak pembe glow, sedef parıltı, soft bloom",
    districts: { home: "bazaar", strong: ["atelier", "mirror"], weak: ["temple"] },
    promptLanguage: {
      avatar:
        "goddess of beauty, pearl-pink and seafoam with rose-gold, flowing sheer layers, pearls, alluring soft gaze, dreamy pink bloom light",
      portrait:
        "graceful alluring face, pearl jewelry, nacre shimmer, soft pink glow",
      fashion:
        "flowing sheer layered gown, rose-gold detail, graceful flow",
      model3d:
        "pearlescent skin shader, sheer cloth layers, pink soft bloom post",
    },
    soul: {
      shadow: "Onay bağımlılığı; değerini çekicilik/beğeniyle ölçme",
      strength: "Çekim ve uyum — güzelliği, bağı, hazzı yaratmak",
      wound: "'Sadece görüntüm için seviliyorum' yarası; derinliğin görülmemesi",
      loveLanguage: "Yakınlık, dokunuş, güzellik, hayranlık ve karşılıklı arzu",
      fearLanguage: "İstenmemek, çekiciliğini/değerini yitirmek",
      moneyLanguage: "Güzellik ve hazza akar; cömert ama değer-özsaygı bağı kırılgan",
      relationLanguage: "Sıcak, baştan çıkarıcı, bağ kurucu; onaya bağımlılık riski",
      soulTask: "Değerin görünüşten değil, özden geldiğini öğrenmek",
    },
  },
  kali: {
    id: "kali",
    name: "Kali",
    title: "Dönüşüm ve Yıkım Tanrıçası",
    frequency: "Dönüşüm",
    opening: "Yıkıp yeniden yaratan korkusuz güç.",
    origin: { myth: "Hindu dönüşüm tanrıçası", caelinus: "Korkusuzluk, yıkıp yeniden yaratma" },
    palette: { primary: "#0e0e14", secondary: "#8e1f24", accent: "#3a3f7a", tone: "dark" },
    aura: "Koyu alev dili, yoğun titreşen enerji",
    hair: "Uzun, vahşi, serbest; siyah; hareketli ve dramatik",
    clothing: "Dramatik siyah, kırmızı vurgu, güçlü dik silüet",
    jewelry: "Koyu metal, kırmızı taş, sembolik motifler",
    symbols: ["sword", "lotus", "third-eye", "flame"],
    symbolGlyph: "✸",
    light: "Sert kontrast, kırmızı rim, derin gölge",
    districts: { home: "mirror", strong: ["temple", "sanri"], weak: ["gaia", "sanctuary"] },
    promptLanguage: {
      avatar:
        "goddess of transformation, night-black and blood-red with indigo, dramatic dark robes, sword, fearless intense gaze, hard red-rim contrast light",
      portrait:
        "fearless intense face, third eye, dark metal jewelry, red rim light",
      fashion:
        "dramatic black gown, red accent, upright powerful silhouette",
      model3d:
        "dark skin + red emissive rim, dramatic single key, flame particles",
    },
    soul: {
      shadow: "Yıkıcılık — dönüştürmek yerine yakıp yok etme, kendine de",
      strength: "Korkusuz dönüşüm — eskiyi bitirip yeniye yer açmak",
      wound: "Öfkenin/gücün 'tehlikeli, sevilmez' olduğu inancı",
      loveLanguage: "Radikal dürüstlük, tam kabul, dönüştürücü yoğunluk",
      fearLanguage: "Bastırılmak, ehlileştirilmek, gücünden utandırılmak",
      moneyLanguage: "Ya hep ya hiç; yıkıp yeniden kurar, istikrarla gerilimli",
      relationLanguage: "Yoğun, dönüştürücü, sınır tanımayan; ölçü öğrenmesi gerek",
      soulTask: "Yıkımı bilgeliğe çevirip yaratıcı güce dönüştürmeyi öğrenmek",
    },
  },
};

/** Doğuş kartlarındaki gösterim sırası (Experience Bible 12-tanrıça sırası). */
export const GODDESS_ORDER: GoddessId[] = [
  "selene",
  "gaia",
  "freya",
  "sophia",
  "artemis",
  "isis",
  "inanna",
  "persephone",
  "hekate",
  "athena",
  "aphrodite",
  "kali",
];

export const GODDESS_LIST: GoddessArchetype[] = GODDESS_ORDER.map(
  (id) => GODDESS_ARCHETYPES[id]
);

export function getGoddess(id: GoddessId): GoddessArchetype {
  return GODDESS_ARCHETYPES[id];
}
