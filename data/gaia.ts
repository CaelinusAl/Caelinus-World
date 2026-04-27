/**
 * CAELINUS — Gaia Data Layer
 *
 * Single source of truth for everything that lives in /universe/gaia/*
 *
 *   plants     – the speaking plants of the garden
 *   producers  – the hands that grow them (cooperatives / villages /
 *                small farms; names are collective or fictional to stay
 *                KVKK / GDPR safe)
 *   regions    – Anatolian production zones with energetic signatures
 *
 * All three are linked by id arrays. Do not duplicate fields in the
 * UI — always derive from this module.
 *
 * Frequencies follow the Caelinus Solfeggio system used in
 * lib/frequency.ts so plants, products and the user's profile share
 * the same Hz vocabulary.
 */

import type { Intent, SolfeggioHz } from "@/lib/frequency";

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */

export type Mood =
  | "sleep"        // calm, gevşeme
  | "focus"        // odak, zihinsel netlik
  | "heart"        // duygu, ilişki
  | "cleansing"    // arınma, detoks
  | "awakening"    // uyanış, canlanma
  | "clarity"      // sezgi, perde aralanması
  | "grounding"    // köklenme, sabır
  | "joy";         // sevinç, açılma

export type RegionId =
  | "ege"
  | "akdeniz"
  | "ic-anadolu"
  | "karadeniz"
  | "guneydogu"
  | "dogu-anadolu"
  | "marmara";

export type Region = {
  id: RegionId;
  name: { tr: string; en: string };
  cities: string[];
  signature: { tr: string; en: string };
  /** Plant ids growing in this region. */
  plantIds: string[];
};

export type Producer = {
  id: string;
  name: { tr: string; en: string };
  /** "Selma Teyze", "Gül Anneleri Koop." — kept collective for KVKK. */
  kind: "cooperative" | "village" | "family-farm" | "atelier";
  region: RegionId;
  city: string;
  district?: string;
  /** Year the producer/cooperative started. */
  since: number;
  /** Plants this producer grows / ferments / processes. */
  plantIds: string[];
  story: { tr: string; en: string };
  method: { tr: string; en: string };
  certifications?: string[];
  /** Optional photo from /public; falls back to a generic Gaia image. */
  image?: string;
};

export type GaiaPlant = {
  id: string;
  name: { tr: string; en: string };
  scientific: string;
  image: string;
  /** Solfeggio Hz aligned to lib/frequency.ts. Falls outside set is OK. */
  frequency: number;
  /** Solfeggio bucket used for matching (closest Hz in the canonical 7). */
  solfeggioMatch: SolfeggioHz;
  region: RegionId;
  moods: Mood[];
  /** Aligned with onboarding Intents — used to surface "your plant". */
  intent: Intent;
  nutrition: { tr: string; en: string };
  healing: { tr: string; en: string };
  poetic: { tr: string; en: string };
  ritual: { tr: string; en: string };
  mythology: { tr: string; en: string };
  producerIds: string[];
  /** Caelinus product (data/products.ts) that pairs with this plant. */
  productMatchId?: string;
};

/* ─────────────────────────────────────────────
   REGIONS
   ───────────────────────────────────────────── */

export const regions: Region[] = [
  {
    id: "ege",
    name: { tr: "Ege", en: "Aegean" },
    cities: ["İzmir", "Manisa", "Aydın"],
    signature: {
      tr: "Güneşle konuşan, tuzlu rüzgâra alışkın aromatik toprak.",
      en: "Salt-wind, sun-conversing aromatic soil.",
    },
    plantIds: ["zeytin", "lavanta", "biberiye", "adacayi", "kantaron", "rezene", "enginar", "kudretnari", "kirkagac-kavunu", "asma", "incir", "kiraz"],
  },
  {
    id: "akdeniz",
    name: { tr: "Akdeniz", en: "Mediterranean" },
    cities: ["Antalya", "Muğla", "Mersin"],
    signature: {
      tr: "Yoğun güneş, gece kokuları, çiçeklerin uzun mevsimi.",
      en: "Long suns, night perfumes, the prolonged season of flowers.",
    },
    plantIds: ["yasemin", "defne", "nane", "biberiye", "sedir", "mandalina", "patlican", "limon", "portakal", "kizilcam", "sedef-otu"],
  },
  {
    id: "ic-anadolu",
    name: { tr: "İç Anadolu", en: "Central Anatolia" },
    cities: ["Isparta", "Konya", "Ankara"],
    signature: {
      tr: "Disiplinli yükseklik, çiçek ve tohumun sabırlı bilgeliği.",
      en: "Disciplined altitude, the patient wisdom of flower and seed.",
    },
    plantIds: ["gul", "lavanta", "melisa", "adacayi", "kekik", "geven", "ceviz", "fasulye", "cilek", "domates", "bal-kabagi", "mor-havuc", "aksehir-bamyasi", "cigdem", "bugday", "papatya", "kavak", "salep"],
  },
  {
    id: "karadeniz",
    name: { tr: "Karadeniz", en: "Black Sea" },
    cities: ["Trabzon", "Rize", "Giresun"],
    signature: {
      tr: "Yağmurun toprağa öğrettiği yeşil hafıza.",
      en: "The green memory the rain teaches the soil.",
    },
    plantIds: ["cay", "isirgan", "melisa", "nane", "mese", "ladin", "findik", "murdum-erigi", "safran", "amasya-sogani", "taskopru-sarimsagi", "yabanmersini", "elma", "kayin", "misir", "kardelen"],
  },
  {
    id: "guneydogu",
    name: { tr: "Güneydoğu", en: "Southeast" },
    cities: ["Gaziantep", "Şanlıurfa", "Mardin"],
    signature: {
      tr: "Mineral toprak, baharatın kıvılcımı, kadim ekşiler.",
      en: "Mineral soil, the spark of spice, ancient sours.",
    },
    plantIds: ["sumak", "antepfistigi", "maras-biberi", "urfa-isot", "diyarbakir-karpuzu", "mardin-nohudu", "nar", "pamuk", "mahlep"],
  },
  {
    id: "marmara",
    name: { tr: "Marmara", en: "Marmara" },
    cities: ["İstanbul", "Bursa", "Çanakkale", "Edirne"],
    signature: {
      tr: "İki denizin nefesi, geçişin toprağı.",
      en: "Breath of two seas, the soil of transitions.",
    },
    plantIds: ["yesilerik", "kereviz", "kestane", "kayin", "ihlamur", "armut", "hanimeli", "aycicegi", "cinar", "uzum"],
  },
  {
    id: "dogu-anadolu",
    name: { tr: "Doğu Anadolu", en: "Eastern Anatolia" },
    cities: ["Erzurum", "Malatya", "Van", "Hakkâri"],
    signature: {
      tr: "İrtifa konuşur — kar, kayısı, ters lale aynı dağı paylaşır.",
      en: "Altitude speaks — snow, apricot and crown imperial share one mountain.",
    },
    plantIds: ["kayisi", "ters-lale", "yabani-lale", "geven", "ladin", "yesil-mercimek"],
  },
];

/* ─────────────────────────────────────────────
   PRODUCERS
   Collective / fictional names so no real person is doxxed.
   ───────────────────────────────────────────── */

export const producers: Producer[] = [
  {
    id: "bayindir-lavanta-koop",
    name: { tr: "Bayındır Lavanta Kooperatifi", en: "Bayindir Lavender Cooperative" },
    kind: "cooperative",
    region: "ege",
    city: "İzmir",
    district: "Bayındır",
    since: 2014,
    plantIds: ["lavanta"],
    story: {
      tr: "Bayındır'ın mor yamaçlarında, 38 kadın üreticinin ortak kazanı kaynar. Lavanta hasadı haziran sonunda başlar; herkes günün ilk ışığıyla tarlada olur.",
      en: "On Bayindir's violet slopes, 38 women growers share one cauldron. Harvest begins in late June; the field is full at first light.",
    },
    method: {
      tr: "Kuru tarım. Damıtma odun ateşinde. Kuruma çardağında 14 gün gölgede dinlenir.",
      en: "Dry farming. Distillation over wood fire. Fourteen days of shaded rest on the drying canopy.",
    },
    certifications: ["Organik (TR-OT)", "Slow Food Presidia"],
  },
  {
    id: "isparta-gul-anneleri",
    name: { tr: "Isparta Gül Anneleri", en: "Isparta Rose Mothers" },
    kind: "cooperative",
    region: "ic-anadolu",
    city: "Isparta",
    district: "Atabey & Senirkent",
    since: 2008,
    plantIds: ["gul", "lavanta"],
    story: {
      tr: "Sekiz köyün anneleri, gül hasadında 03:00'te uyanır. 'Açmadan toplanır' derler. Bir damla gül yağı için bir buçuk ton yaprak gerekir.",
      en: "Mothers from eight villages wake at 3 AM for the rose harvest. 'Picked before it opens', they say. One drop of rose oil takes 1.5 tons of petals.",
    },
    method: {
      tr: "El hasadı. Soğuk damıtma. Hiçbir gül 2 saatten fazla hasattan sonra dinlemez.",
      en: "Hand harvest. Cold distillation. No rose rests longer than two hours after picking.",
    },
    certifications: ["Coğrafi İşaret · Isparta Gülü"],
  },
  {
    id: "mordogan-zeytin-koy",
    name: { tr: "Mordoğan Zeytin Köyü", en: "Mordogan Olive Village" },
    kind: "village",
    region: "ege",
    city: "İzmir",
    district: "Karaburun · Mordoğan",
    since: 1972,
    plantIds: ["zeytin"],
    story: {
      tr: "Üç kuşaktır aynı taş değirmen, aynı zeytinler. En genç üye 19, en yaşlı 84 yaşında. 'Zeytin hızla konuşmaz' der köy.",
      en: "Three generations, the same stone mill, the same trees. Youngest member 19, eldest 84. 'The olive does not speak fast', the village says.",
    },
    method: {
      tr: "Soğuk sıkım. Hasat, ağaca dokunulmadan ağdan; 6 saat içinde sıkıma gider.",
      en: "Cold-pressed. Harvested into nets without touching the tree; pressed within 6 hours.",
    },
    certifications: ["Erken Hasat · Naturel Sızma"],
  },
  {
    id: "bornova-otlar-meclisi",
    name: { tr: "Bornova Otlar Meclisi", en: "Bornova Herbs Council" },
    kind: "cooperative",
    region: "ege",
    city: "İzmir",
    district: "Bornova",
    since: 2019,
    plantIds: ["adacayi", "biberiye"],
    story: {
      tr: "Bornova yamaçlarında biriken kadim ot bilgisi; meclis ayda bir toplanır, her üye bir bitkinin sözcüsü olur. Adaçayı sözcüsü Selma Teyze 71 yaşında.",
      en: "The ancient herb wisdom of Bornova's slopes. The council meets monthly; each member becomes the voice of one plant.",
    },
    method: {
      tr: "Yarı yabani toplama. Gölgede kurutma. Cam kavanozda dinlendirme.",
      en: "Semi-wild gathering. Shade-drying. Resting in glass jars.",
    },
  },
  {
    id: "demre-akdeniz-otlari",
    name: { tr: "Demre Akdeniz Otları", en: "Demre Mediterranean Herbs" },
    kind: "family-farm",
    region: "akdeniz",
    city: "Antalya",
    district: "Demre",
    since: 2011,
    plantIds: ["biberiye", "defne"],
    story: {
      tr: "Likya yollarının üstünde, deniz tuzunu ve dağ rüzgârını aynı anda alan tek aile çiftliği. Defne ve biberiye burada beraber büyür.",
      en: "Above the Lycian Way, the only family farm tasting both sea salt and mountain wind. Bay and rosemary grow together here.",
    },
    method: {
      tr: "Yağmur sulu, kuru tarım. Hasat şafakta, çiy düşmeden.",
      en: "Rain-fed dry farming. Harvest at dawn, before the dew lifts.",
    },
  },
  {
    id: "antalya-cicek-atolyesi",
    name: { tr: "Antalya Çiçek Atölyesi", en: "Antalya Flower Atelier" },
    kind: "atelier",
    region: "akdeniz",
    city: "Antalya",
    district: "Aksu",
    since: 2017,
    plantIds: ["yasemin"],
    story: {
      tr: "Yasemin atölyesi geceleyin çalışır. Çiçek geceyi sever; 21:00 ile 03:00 arasında toplanır, sabah olmadan damıtılır.",
      en: "The jasmine atelier works at night. The flower loves dusk; gathered between 9 PM and 3 AM, distilled before dawn.",
    },
    method: {
      tr: "Gece hasadı. Su damıtma + enfleurage paralel.",
      en: "Night harvest. Hydrodistillation + enfleurage in parallel.",
    },
  },
  {
    id: "maca-sifa-vadisi",
    name: { tr: "Maçka Şifa Vadisi", en: "Macka Healing Valley" },
    kind: "cooperative",
    region: "karadeniz",
    city: "Trabzon",
    district: "Maçka",
    since: 2016,
    plantIds: ["melisa", "isirgan"],
    story: {
      tr: "Sumela'nın altındaki vadide, 22 üreticinin paylaştığı şifa hattı. Melisa ve ısırgan burada birlikte büyür — biri yumuşatır, biri uyandırır.",
      en: "Below Sumela, 22 growers share a healing line. Lemon balm and nettle grow side by side — one softens, the other awakens.",
    },
    method: {
      tr: "Yarı yabani hasat. Gölgede kurutma. Yün filelerde havalandırma.",
      en: "Semi-wild harvest. Shade-drying. Aerated in wool nets.",
    },
    certifications: ["Coğrafi İşaret başvurusu"],
  },
  {
    id: "of-cay-koop",
    name: { tr: "Of Çay Kooperatifi", en: "Of Tea Cooperative" },
    kind: "cooperative",
    region: "karadeniz",
    city: "Trabzon",
    district: "Of",
    since: 1989,
    plantIds: ["cay"],
    story: {
      tr: "Karadeniz'in en küçük çay kooperatifi. Yağmurla büyüyen, yağmurla içilen yaprak. Hasat mayıs–eylül arası beş kez gerçekleşir.",
      en: "The smallest tea cooperative on the Black Sea. A leaf grown in rain, drunk in rain. Five harvests from May to September.",
    },
    method: {
      tr: "El toplama. Geleneksel buharla sertleştirme. Uzun fermantasyon.",
      en: "Hand-picked. Traditional steam-fixing. Long fermentation.",
    },
    certifications: ["Karadeniz Çayı Coğrafi İşaret"],
  },
  {
    id: "akcaabat-toros-nane",
    name: { tr: "Akçaabat Toros Nane", en: "Akcaabat Toros Mint" },
    kind: "family-farm",
    region: "karadeniz",
    city: "Trabzon",
    district: "Akçaabat",
    since: 2009,
    plantIds: ["nane"],
    story: {
      tr: "Toros yamacında üç kardeşin paylaştığı küçük arazi. Nane suyu seven bitkiyi, derelerin yanında büyütürler.",
      en: "Three siblings share a small slope of the Taurus. Mint loves water — grown along the streams.",
    },
    method: {
      tr: "Akarsu yanı tarım. Hasat sabah çiy henüz inmişken.",
      en: "Streamside farming. Harvest while the morning dew is still down.",
    },
  },
  {
    id: "antep-koy-pazari",
    name: { tr: "Antep Köy Pazarı Kooperatifi", en: "Antep Village Market Cooperative" },
    kind: "cooperative",
    region: "guneydogu",
    city: "Gaziantep",
    district: "Şahinbey & Nizip",
    since: 2013,
    plantIds: ["sumak"],
    story: {
      tr: "Mineral toprağın baharat hafızası. Sumak burada güneşin tam olduğu üç ayda kuruyup öğütülür.",
      en: "The spice memory of mineral soil. Sumac dries and grinds here in the three months of full sun.",
    },
    method: {
      tr: "Güneşte kurutma. Taş öğütme. Cam kavanozda nemden uzak dinlendirme.",
      en: "Sun-drying. Stone-grinding. Resting away from moisture in glass.",
    },
  },
];

/* ─────────────────────────────────────────────
   PLANTS
   ───────────────────────────────────────────── */

export const plants: GaiaPlant[] = [
  {
    id: "lavanta",
    name: { tr: "Lavanta", en: "Lavender" },
    scientific: "Lavandula angustifolia",
    image: "/universe/plants/lavanta.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "ege",
    moods: ["sleep", "cleansing", "grounding"],
    intent: "calm",
    nutrition: {
      tr: "Aromatik yağlar, linalool, linalil asetat; sinir sistemini yumuşatan uçucular.",
      en: "Aromatic oils, linalool, linalyl acetate — volatiles that soften the nervous system.",
    },
    healing: {
      tr: "Uyku, gevşeme, stres boşaltımı, iç sesi yavaşlatma.",
      en: "Sleep, release, stress unwinding, slowing the inner voice.",
    },
    poetic: {
      tr: "Lavanta, toprağın mor nefesidir; sessizliği kokuya çevirir.",
      en: "Lavender is the violet breath of the earth — turning silence into scent.",
    },
    ritual: {
      tr: "Akşamüstü iki damla yastık ucuna. Üç derin nefes. Kapatılmamış işler bekleyebilir.",
      en: "Two drops on the pillow at dusk. Three deep breaths. Unfinished work can wait.",
    },
    mythology: {
      tr: "Romalılar lavantayı banyolarına atardı; isim Latince 'lavare' — yıkanmak.",
      en: "Romans tossed lavender into their baths; the name comes from Latin 'lavare' — to wash.",
    },
    producerIds: ["bayindir-lavanta-koop", "isparta-gul-anneleri"],
    productMatchId: "b1",
  },
  {
    id: "gul",
    name: { tr: "Gül", en: "Rose" },
    scientific: "Rosa damascena",
    image: "/universe/plants/gul.png",
    frequency: 639,
    solfeggioMatch: 639,
    region: "ic-anadolu",
    moods: ["heart", "joy", "grounding", "clarity"],
    intent: "love",
    nutrition: {
      tr: "Geraniol, sitronellol, çiçek özleri; kalp meridyenine inen aromatikler.",
      en: "Geraniol, citronellol, flower extracts; aromatics that descend into the heart meridian.",
    },
    healing: {
      tr: "Kalp açılımı, duygusal yumuşama, zarafet alanı.",
      en: "Heart opening, emotional softening, the field of grace.",
    },
    poetic: {
      tr: "Gül, toprağın kalpten konuştuğu andır; dikenin içinden güzelliği doğurur.",
      en: "The rose is when soil speaks from the heart; beauty born through the thorn.",
    },
    ritual: {
      tr: "Bir damla gül suyu sağ avucuna. Kalbine değdir. 'Ben buradayım' de.",
      en: "A drop of rose water on your right palm. Touch your heart. Say: 'I am here.'",
    },
    mythology: {
      tr: "Sufi geleneğinde gül, peygamberin teri olarak anılır; her yaprağı bir nefesin izidir.",
      en: "In Sufi tradition the rose is the prophet's perspiration; each petal a trace of breath.",
    },
    producerIds: ["isparta-gul-anneleri"],
    productMatchId: "b7",
  },
  {
    id: "zeytin",
    name: { tr: "Zeytin", en: "Olive" },
    scientific: "Olea europaea",
    image: "/universe/plants/zeytin.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ege",
    moods: ["grounding", "heart", "awakening"],
    intent: "power",
    nutrition: {
      tr: "Tekli doymamış yağlar, polifenoller (oleocanthal), E vitamini.",
      en: "Monounsaturated fats, polyphenols (oleocanthal), vitamin E.",
    },
    healing: {
      tr: "Kalp desteği, yaşam gücü, uzun ömür frekansı.",
      en: "Heart support, vitality, long-life frequency.",
    },
    poetic: {
      tr: "Zeytin, güneşle konuşan sabırlı bir bilgedir; zamanı yağa dönüştürür.",
      en: "The olive is a patient sage in conversation with the sun — it turns time into oil.",
    },
    ritual: {
      tr: "Sabah aç karna bir tatlı kaşığı erken hasat. Yutmadan önce on saniye dilinin altında.",
      en: "A teaspoon of early-harvest oil on an empty stomach. Hold under the tongue for ten seconds.",
    },
    mythology: {
      tr: "Athena'nın hediyesi: bir zeytin ağacı dikti, şehir onun adını aldı.",
      en: "Athena's gift: she planted an olive tree and the city took her name.",
    },
    producerIds: ["mordogan-zeytin-koy"],
    productMatchId: "b3",
  },
  {
    id: "biberiye",
    name: { tr: "Biberiye", en: "Rosemary" },
    scientific: "Salvia rosmarinus",
    image: "/universe/plants/biberiye.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "akdeniz",
    moods: ["focus", "awakening", "clarity"],
    intent: "clarity",
    nutrition: {
      tr: "Sineol, kafur, antioksidan diterpenler; hafıza ve odak için aromatikler.",
      en: "Cineole, camphor, antioxidant diterpenes — aromatics for memory and focus.",
    },
    healing: {
      tr: "Canlanma, odaklanma, zihinsel açıklık.",
      en: "Animation, focus, mental clarity.",
    },
    poetic: {
      tr: "Biberiye, rüzgârı hafızasında saklayan canlı bir uyanış dalgasıdır.",
      en: "Rosemary is a wave of awakening that holds the wind in its memory.",
    },
    ritual: {
      tr: "Çalışma masanın yanına bir dal. Düşünce dağıldığında üç kez koklat.",
      en: "A sprig at your desk. Smell three times whenever thoughts scatter.",
    },
    mythology: {
      tr: "Antik Yunan'da öğrenciler sınava biberiye taçla girerdi.",
      en: "In ancient Greece, students entered exams crowned with rosemary.",
    },
    producerIds: ["bornova-otlar-meclisi", "demre-akdeniz-otlari"],
    productMatchId: "b6",
  },
  {
    id: "adacayi",
    name: { tr: "Adaçayı", en: "Sage" },
    scientific: "Salvia officinalis",
    image: "/universe/plants/adacayi.png",
    frequency: 741,
    solfeggioMatch: 741,
    region: "ege",
    moods: ["cleansing", "clarity", "awakening", "sleep"],
    intent: "clarity",
    nutrition: {
      tr: "Tujon, sineol, ursolik asit; arındırıcı uçucular.",
      en: "Thujone, cineole, ursolic acid — purifying volatiles.",
    },
    healing: {
      tr: "Arınma, zihinsel berraklık, nefes alanını açma.",
      en: "Purification, mental clarity, opening the breath.",
    },
    poetic: {
      tr: "Adaçayı, eski bilgiyi yapraklarında taşıyan bir hafıza bitkisidir.",
      en: "Sage is a memory plant that carries old wisdom in its leaves.",
    },
    ritual: {
      tr: "Ay başında bir tutam yapraktan çay. Yalnız iç. Üç şey için teşekkür et.",
      en: "A pinch of leaves at the new moon. Drink alone. Thank three things.",
    },
    mythology: {
      tr: "Latince 'salvia' — kurtarmak. 'Adaçayı yetiştiren bahçede ölüm olmaz' der atalar.",
      en: "From Latin 'salvia' — to save. 'Where sage grows, death does not enter,' the elders say.",
    },
    producerIds: ["bornova-otlar-meclisi"],
    productMatchId: "b5",
  },
  {
    id: "melisa",
    name: { tr: "Melisa", en: "Lemon Balm" },
    scientific: "Melissa officinalis",
    image: "/universe/plants/melisa.png",
    frequency: 639,
    solfeggioMatch: 639,
    region: "karadeniz",
    moods: ["sleep", "heart", "joy"],
    intent: "calm",
    nutrition: {
      tr: "Sitronelal, geraniol, rosmarinik asit; kalbi sakinleştiren aromatikler.",
      en: "Citronellal, geraniol, rosmarinic acid; aromatics that soothe the heart.",
    },
    healing: {
      tr: "Sakinleşme, duygusal denge, gevşeme.",
      en: "Calming, emotional balance, release.",
    },
    poetic: {
      tr: "Melisa, telaşın içinden geçen ince bir huzur nehridir.",
      en: "Lemon balm is a slender river of stillness through the rush.",
    },
    ritual: {
      tr: "Hızlı bir günün ortasında bir bardak. Buharını yüzüne al. Bir kez gül.",
      en: "A cup in the middle of a fast day. Steam to your face. Smile once.",
    },
    mythology: {
      tr: "Yunanca 'mélissa' — bal arısı. Arıların bu bitkiye âşık olduğu söylenir.",
      en: "From Greek 'mélissa' — honeybee. The bees, they say, are in love with it.",
    },
    producerIds: ["maca-sifa-vadisi"],
    productMatchId: "b4",
  },
  {
    id: "yasemin",
    name: { tr: "Yasemin", en: "Jasmine" },
    scientific: "Jasminum officinale",
    image: "/universe/plants/yasemin.png",
    frequency: 852,
    solfeggioMatch: 852,
    region: "akdeniz",
    moods: ["heart", "joy", "clarity", "sleep"],
    intent: "love",
    nutrition: {
      tr: "Bensil asetat, indol, jasmin lakton; geceyi açan aromatikler.",
      en: "Benzyl acetate, indole, jasmine lactone — aromatics that open the night.",
    },
    healing: {
      tr: "Duygusal rahatlama, zarafet, yumuşak canlılık.",
      en: "Emotional relief, grace, soft vitality.",
    },
    poetic: {
      tr: "Yasemin, sıcak gecelerin nefesinden doğan gizli bir ay ışığıdır.",
      en: "Jasmine is a hidden moonlight born from the breath of warm nights.",
    },
    ritual: {
      tr: "Pencereni gece açık bırak. Yasemin senin yerine düşünür.",
      en: "Leave your window open at night. Jasmine will think for you.",
    },
    mythology: {
      tr: "Pers şiirinde yasemin, gizlenen aşkın haberini taşıyan elçidir.",
      en: "In Persian poetry, jasmine is the messenger of hidden love.",
    },
    producerIds: ["antalya-cicek-atolyesi"],
    productMatchId: "b8",
  },
  {
    id: "defne",
    name: { tr: "Defne", en: "Bay Laurel" },
    scientific: "Laurus nobilis",
    image: "/universe/plants/defne.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "akdeniz",
    moods: ["focus", "grounding", "awakening", "sleep"],
    intent: "power",
    nutrition: {
      tr: "Sineol, linalol, eugenol; koruyucu aromatik yapı.",
      en: "Cineole, linalool, eugenol — a protective aromatic frame.",
    },
    healing: {
      tr: "Koruma, güç, berrak zihin alanı.",
      en: "Protection, strength, a clear field of mind.",
    },
    poetic: {
      tr: "Defne, başarıyı yapraklarında taşıyan kadim bir eşiktir.",
      en: "The bay carries victory in its leaves — an ancient threshold.",
    },
    ritual: {
      tr: "Kapı eşiğine bir yaprak. Eve gelen rüzgâr arınmış girer.",
      en: "A leaf on your threshold. The wind that enters arrives cleansed.",
    },
    mythology: {
      tr: "Apollon'un dafne'si: değişimin ve kazanmanın aynı kelimede toplandığı yer.",
      en: "Apollo's Daphne: where transformation and victory share a word.",
    },
    producerIds: ["demre-akdeniz-otlari"],
    productMatchId: "b9",
  },
  {
    id: "nane",
    name: { tr: "Nane", en: "Mint" },
    scientific: "Mentha × piperita",
    image: "/universe/plants/nane.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "karadeniz",
    moods: ["awakening", "cleansing", "focus"],
    intent: "clarity",
    nutrition: {
      tr: "Mentol, mentol, limonen; soğuk uçucular.",
      en: "Menthol, menthone, limonene — cooling volatiles.",
    },
    healing: {
      tr: "Nefes açma, serinletme, mide rahatlatma.",
      en: "Opening the breath, cooling, calming the gut.",
    },
    poetic: {
      tr: "Nane, toprağın serin soluğu gibi gelir ve bedeni hafifletir.",
      en: "Mint arrives like the soil's cool breath and lightens the body.",
    },
    ritual: {
      tr: "Sabahları bir bardak ılık nane suyu. Gün açılır.",
      en: "A cup of warm mint water in the morning. The day opens.",
    },
    mythology: {
      tr: "Persephone, Minthe'yi bir bitkiye dönüştürdü; aşkın izi hâlâ kokusunda.",
      en: "Persephone turned Minthe into a plant; love's trace lingers in the scent.",
    },
    producerIds: ["akcaabat-toros-nane"],
    productMatchId: "b3",
  },
  {
    id: "cay",
    name: { tr: "Çay", en: "Tea" },
    scientific: "Camellia sinensis",
    image: "/universe/plants/cay.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "karadeniz",
    moods: ["focus", "grounding", "joy"],
    intent: "power",
    nutrition: {
      tr: "Polifenoller (EGCG), L-theanine, kafein; canlandıran ve odak veren bileşim.",
      en: "Polyphenols (EGCG), L-theanine, caffeine — a focusing, awakening blend.",
    },
    healing: {
      tr: "Canlılık, denge, ritim oluşturma.",
      en: "Vitality, balance, the building of rhythm.",
    },
    poetic: {
      tr: "Çay, yağmurun toprağa yazdığı ve insanın fincanda okuduğu şiirdir.",
      en: "Tea is the poem the rain writes on the soil and the human reads in the cup.",
    },
    ritual: {
      tr: "Akşam beşten sonra dem küçük. Saat değil, ses dinle.",
      en: "After 5 PM, brew small. Listen not to the clock, but to the sound.",
    },
    mythology: {
      tr: "Çin efsanesinde çay, yaprağın kuru kazana düşmesinden doğdu — kaza şifaya dönüştü.",
      en: "Chinese legend: tea was born when a leaf fell into a pot — accident became cure.",
    },
    producerIds: ["of-cay-koop"],
    productMatchId: "b11",
  },
  {
    id: "isirgan",
    name: { tr: "Isırgan", en: "Nettle" },
    scientific: "Urtica dioica",
    image: "/universe/plants/isirgan.png",
    frequency: 741,
    solfeggioMatch: 741,
    region: "karadeniz",
    moods: ["cleansing", "awakening", "grounding"],
    intent: "power",
    nutrition: {
      tr: "Demir, magnezyum, K vitamini, klorofil; yeşilin mineral hafızası.",
      en: "Iron, magnesium, vitamin K, chlorophyll — the mineral memory of green.",
    },
    healing: {
      tr: "Temizlenme, canlanma, köklenme.",
      en: "Cleansing, animation, rooting.",
    },
    poetic: {
      tr: "Isırgan, vahşi görünen ama özünde şifa taşıyan toprak dürüstlüğüdür.",
      en: "Nettle is wild on the outside, healing at the core — the soil's honesty.",
    },
    ritual: {
      tr: "İlkbaharda bir hafta ısırgan çorbası. Beden hatırlar.",
      en: "A week of nettle soup in spring. The body remembers.",
    },
    mythology: {
      tr: "Kelt geleneğinde ısırgan 'küçük cesaret' bitkisidir — dokunmaktan korkma.",
      en: "In Celtic tradition, nettle is the 'small courage' plant — do not fear the touch.",
    },
    producerIds: ["maca-sifa-vadisi"],
    productMatchId: "b10",
  },
  {
    id: "sumak",
    name: { tr: "Sumak", en: "Sumac" },
    scientific: "Rhus coriaria",
    image: "/universe/plants/sumak.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "guneydogu",
    moods: ["awakening", "joy", "focus"],
    intent: "power",
    nutrition: {
      tr: "Antosiyaninler, C vitamini, tannenler; antioksidan baharat.",
      en: "Anthocyanins, vitamin C, tannins — an antioxidant spice.",
    },
    healing: {
      tr: "Canlandırma, sindirim desteği, tat uyanışı.",
      en: "Animation, digestive support, the awakening of taste.",
    },
    poetic: {
      tr: "Sumak, toprağın ekşi kıvılcımıdır; bir lokmayı hafızaya dönüştürür.",
      en: "Sumac is the sour spark of soil; it turns a bite into memory.",
    },
    ritual: {
      tr: "Yemek bittikten sonra parmak ucu sumak. Yılın tadı dönüşür.",
      en: "A fingertip of sumac after the meal. The year's taste changes.",
    },
    mythology: {
      tr: "Anadolu'da 'sumak ekşisi' yağmur yağmadığında yakılır; gök hatırlasın diye.",
      en: "In Anatolia, sumac is burned when rain forgets — so the sky remembers.",
    },
    producerIds: ["antep-koy-pazari"],
    productMatchId: "b8",
  },
  {
    id: "kekik",
    name: { tr: "Kekik", en: "Thyme" },
    scientific: "Origanum onites",
    image: "/universe/plants/kekik.png",
    frequency: 741,
    solfeggioMatch: 741,
    region: "ic-anadolu",
    moods: ["cleansing", "awakening", "focus", "clarity"],
    intent: "clarity",
    nutrition: {
      tr: "Karvakrol, timol, p-simen, β-karyofilen; antioksidan ve antimikrobiyel uçucu yağlar; A vitamini, demir, mangan.",
      en: "Carvacrol, thymol, p-cymene, β-caryophyllene — antioxidant and antimicrobial volatiles; vitamin A, iron, manganese.",
    },
    healing: {
      tr: "Yedi yüz kırk bir hertzte titreşir; boğaz arınması, bağışıklık tazeleme, mide rahatlatma. Anadolu'nun en eski ifade otu — söz gibi açar.",
      en: "Vibrating at seven hundred and forty-one hertz; throat cleansing, immunity renewal, stomach relief. Anatolia's oldest plant of expression — opens like speech.",
    },
    poetic: {
      tr: "Kekik, taşın çatlağından çıkan kelimedir; sözün arınması, sözün bulunması.",
      en: "Thyme is the word that rises from the cracks of stone; speech purified, speech found.",
    },
    ritual: {
      tr: "Bir dal kekik, bir kaşık zeytinyağı, bir tutam tuz — ekmeğin üstüne. Anadolu'nun en eski reçetesi.",
      en: "A sprig of thyme, a spoon of olive oil, a pinch of salt — on bread. Anatolia's oldest recipe.",
    },
    mythology: {
      tr: "Antik Yunan'da 'thymos' — cesaret. Askerler savaş öncesi göğüslerine kekik koyardı. Honaz ve Sandıklı yaylaları, dünyanın en zengin kekik gen havuzu.",
      en: "From Greek 'thymos' — courage. Soldiers placed thyme on their chests before battle. The Honaz and Sandıklı plateaus hold the world's richest thyme gene pool.",
    },
    producerIds: ["bornova-otlar-meclisi", "demre-akdeniz-otlari"],
  },
  {
    id: "safran",
    name: { tr: "Safran", en: "Saffron" },
    scientific: "Crocus sativus",
    image: "/universe/plants/safran.png",
    frequency: 963,
    solfeggioMatch: 963,
    region: "karadeniz",
    moods: ["clarity", "joy", "heart", "sleep"],
    intent: "clarity",
    nutrition: {
      tr: "Krosin, krosetin, safranal, pikrokrosin; B6 ve manganez; antioksidan karotenoid pigmentler.",
      en: "Crocin, crocetin, safranal, picrocrocin; vitamin B6 and manganese; antioxidant carotenoid pigments.",
    },
    healing: {
      tr: "Dokuz yüz altmış üç hertzte titreşir — kozmik bilincin altın frekansı. Hafıza tazeleme, hüznün dağılması, hormonal denge, görme keskinliği.",
      en: "Vibrating at nine hundred and sixty-three hertz — the golden frequency of cosmic consciousness. Memory refresh, the dispersal of sorrow, hormonal balance, visual sharpness.",
    },
    poetic: {
      tr: "Safran, sonbahar şafağının üç günde söylediği bir cümledir; gerisi sessizlik.",
      en: "Saffron is a sentence the autumn dawn speaks across three days; the rest is silence.",
    },
    ritual: {
      tr: "Üç tel safran, bir bardak ılık süt, bir damla bal — yatmadan önce. Gece, altın gibi iner.",
      en: "Three threads of saffron, a glass of warm milk, a drop of honey — before sleep. Night descends like gold.",
    },
    mythology: {
      tr: "Safranbolu adını bu çiçekten alır. Bir gram safran için yetmiş bin tepecik gerekir; yedi yüz çiçek bir saatlik el emeği. Tarihin en pahalı baharatı, hep emeğin tanığı.",
      en: "Safranbolu takes its name from this flower. One gram of saffron requires seventy thousand stigmas — seven hundred flowers, an hour of hand-labour. History's most expensive spice has always been a witness to labor.",
    },
    producerIds: [],
  },
  {
    id: "kantaron",
    name: { tr: "Sarı Kantaron", en: "St. John's Wort" },
    scientific: "Hypericum perforatum",
    image: "/universe/plants/kantaron.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ege",
    moods: ["heart", "sleep", "awakening"],
    intent: "calm",
    nutrition: {
      tr: "Hiperisin, hiperforin, flavonoidler, kuersetin; nörotrofik destek, fotoaktif pigmentler.",
      en: "Hypericin, hyperforin, flavonoids, quercetin; neurotrophic support, photoactive pigments.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — yaranın içeriden kapandığı yenilenme frekansı. Cilt yarası, sinir hattı, uyku ağı, karanlık duygu hâli.",
      en: "Vibrating at five hundred and twenty-eight hertz — the renewal frequency where the wound closes from within. Skin wounds, the nerve line, the sleep web, the dark mood.",
    },
    poetic: {
      tr: "Kantaron, güneşi şişeye sığdıran küçük altın bir reçetedir.",
      en: "St. John's Wort is a small golden recipe that fits the sun into a bottle.",
    },
    ritual: {
      tr: "Çiçeğini zeytinyağında kırk gün, tam güneşte beklet — yağ kızıl olunca yara hatıraya dönüşür.",
      en: "Steep the flower in olive oil for forty days in full sun — when the oil reddens, the wound becomes memory.",
    },
    mythology: {
      tr: "Anadolu'da 'binbirdelikotu' — yaprağına bakınca güneşin geçtiği binbir gözenek görülür. Hıristiyan geleneğinde Vaftizci Yahya'nın doğum günü olan 24 Haziran'da toplanır.",
      en: "In Anatolia 'thousand-and-one-holes-grass' — hold the leaf to the sun and a thousand and one perforations of light show through. In Christian tradition, gathered on the 24th of June, John the Baptist's day.",
    },
    producerIds: ["bornova-otlar-meclisi", "demre-akdeniz-otlari"],
  },
  {
    id: "rezene",
    name: { tr: "Rezene", en: "Fennel" },
    scientific: "Foeniculum vulgare",
    image: "/universe/plants/rezene.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "ege",
    moods: ["cleansing", "focus", "joy"],
    intent: "clarity",
    nutrition: {
      tr: "Anetol, fenchone, estragol; C vitamini, potasyum, lif; östrojen benzeri fitoöstrojenler.",
      en: "Anethole, fenchone, estragole; vitamin C, potassium, fiber; estrogen-like phytoestrogens.",
    },
    healing: {
      tr: "Dört yüz on yedi hertzte titreşir — sindirimin açıldığı, gazın çözüldüğü, anne sütünün çoğaldığı frekans. Bağırsak, rahim, dilin tadı.",
      en: "Vibrating at four hundred and seventeen hertz — the frequency where digestion opens, gas dissolves, mother's milk multiplies. Bowel, womb, the taste at the tongue.",
    },
    poetic: {
      tr: "Rezene, denizin nefesi gibi gelir ve içeride sıkışmış neyin varsa serinletir.",
      en: "Fennel arrives like the breath of the sea and cools whatever is held tight within.",
    },
    ritual: {
      tr: "Yemekten sonra bir tutam tohum — diline koy, çiğne, yut. Karın, sözün ötesinde teşekkür eder.",
      en: "A pinch of seeds after the meal — place on the tongue, chew, swallow. The belly thanks you beyond words.",
    },
    mythology: {
      tr: "Antik Yunan'da rezene 'maraton' — Pers'e karşı kazanılan savaşın olduğu rezene tarlasının adı. Zaferi, sindirimden başlatan ot.",
      en: "In ancient Greek 'marathon' meant a fennel field — the name of the battlefield where Persia was defeated. The plant that begins victory with digestion.",
    },
    producerIds: ["bornova-otlar-meclisi"],
  },
  {
    id: "geven",
    name: { tr: "Geven", en: "Astragalus" },
    scientific: "Astragalus membranaceus",
    image: "/universe/plants/geven.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "ic-anadolu",
    moods: ["grounding", "cleansing", "awakening"],
    intent: "power",
    nutrition: {
      tr: "Astragalozid IV, polisakkaritler, flavonoidler, izoflavonlar; saponin temelli adaptojen bileşim.",
      en: "Astragaloside IV, polysaccharides, flavonoids, isoflavones — a saponin-based adaptogenic blend.",
    },
    healing: {
      tr: "Üç yüz doksan altı hertzte titreşir — köke inen korkuyu söken kadim direnç frekansı. Bağışıklık, böbrek desteği, uzun ömür alanı.",
      en: "Vibrating at three hundred and ninety-six hertz — the ancient resilience frequency that unbinds fear at the root. Immunity, kidney support, the field of longevity.",
    },
    poetic: {
      tr: "Geven, kuraklığın içinden ses çıkaran sabırlı bir prensestir; üç yıl beklemeyi bilir.",
      en: "Astragalus is a patient princess that sounds out of drought; she knows how to wait three years.",
    },
    ritual: {
      tr: "İki dilim kuru kök, bir bardak su, yirmi dakika hafif kaynama. Anadolu'nun bin yıllık ilacını içersin.",
      en: "Two slices of dry root, a glass of water, twenty minutes at low simmer. You drink Anatolia's thousand-year medicine.",
    },
    mythology: {
      tr: "Çin geleneğinde 'huang qi' — sarı imparator. Anadolu steplerinde geven kıraç tarlanın bekçisidir; yumuşak görünür, dikenle korur.",
      en: "In Chinese tradition 'huang qi' — yellow emperor. On the Anatolian steppe, astragalus is the guardian of the dry field; she looks soft, defends with thorns.",
    },
    producerIds: [],
  },
  {
    id: "mese",
    name: { tr: "Meşe", en: "Oak" },
    scientific: "Quercus robur",
    image: "/universe/plants/mese.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "karadeniz",
    moods: ["grounding", "awakening", "clarity", "heart"],
    intent: "power",
    nutrition: {
      tr: "Yüksek tanen içeriği, gallik asit, kuersetin; palamut: protein, kompleks karbonhidrat, B vitaminleri.",
      en: "High tannin content, gallic acid, quercetin; the acorn carries protein, complex carbohydrate, B vitamins.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — hücresel dayanıklılığın, uzun ömrün, toprak hafızasının frekansı. Tanen kabuğu yarayı kapatır.",
      en: "Vibrating at five hundred and twenty-eight hertz — the frequency of cellular endurance, long life, the memory of soil. Tannin bark closes the wound.",
    },
    poetic: {
      tr: "Meşe, Anadolu ormanlarının kralıdır; bin yıl yaşar ve hep kök gibi konuşur.",
      en: "The oak is the king of Anatolian forests; she lives a thousand years and always speaks like a root.",
    },
    ritual: {
      tr: "Bir meşe palamudunu cebine koy. Kararsızlık geldiğinde avucunda dolaştır — kök gibi sabırlı olmayı hatırlatır.",
      en: "Place an acorn in your pocket. When hesitation arrives, roll it in your palm — it reminds you to be patient like a root.",
    },
    mythology: {
      tr: "Slav, Kelt, Yunan ve Türk geleneklerinde meşe en kutsal ağaçtır. Kıraç toprakta bin yıl yaşar; Anadolu'da 'dede meşesi' deyimi vardır — bir köy, bir meşe.",
      en: "In Slavic, Celtic, Greek, and Turkic traditions, the oak is the most sacred tree. She lives a thousand years on dry land; in Anatolia 'grandfather oak' — one village, one oak.",
    },
    producerIds: [],
  },
  {
    id: "sedir",
    name: { tr: "Toros Sediri", en: "Cedar of Lebanon" },
    scientific: "Cedrus libani",
    image: "/universe/plants/sedir.png",
    frequency: 852,
    solfeggioMatch: 852,
    region: "akdeniz",
    moods: ["grounding", "clarity", "awakening", "sleep"],
    intent: "power",
    nutrition: {
      tr: "Α-pinen, β-pinen, sedrol, himachalen; antimikrobiyel reçine; doğal koruyucu uçucular.",
      en: "α-pinene, β-pinene, cedrol, himachalene — antimicrobial resin; natural preservative volatiles.",
    },
    healing: {
      tr: "Sekiz yüz elli iki hertzte titreşir — yüksek sezginin ve ruhsal yapının frekansı. Hava arınması, alan koruma, hafıza saklama.",
      en: "Vibrating at eight hundred and fifty-two hertz — the frequency of high intuition and spiritual structure. Air purification, field protection, memory preservation.",
    },
    poetic: {
      tr: "Sedir, bin sekiz yüz metrede ay'a doğru uzanan bir mabettir; antik tapınakların dik direği.",
      en: "The cedar is a temple reaching toward the moon at eighteen-hundred meters; the upright pillar of ancient sanctuaries.",
    },
    ritual: {
      tr: "Bir parça sedir odununu çekmecene koy — eski olanın değişmesine izin ver, hatıranı koru.",
      en: "Place a piece of cedar wood in your drawer — let the old change, preserve the memory.",
    },
    mythology: {
      tr: "Süleyman tapınağının direkleri Toros sedirindendi. Antik Mısır'da firavun sandukaları sedir ağacındandı; iki yüz yıl ayakta kalır, bin yıl hatırayı taşır.",
      en: "The pillars of Solomon's temple were Taurus cedar. In ancient Egypt, pharaohs' sarcophagi were cedar; she stands two hundred years, carries memory a thousand.",
    },
    producerIds: [],
  },
  {
    id: "ladin",
    name: { tr: "Doğu Ladini", en: "Oriental Spruce" },
    scientific: "Picea orientalis",
    image: "/universe/plants/ladin.png",
    frequency: 741,
    solfeggioMatch: 741,
    region: "karadeniz",
    moods: ["cleansing", "focus", "grounding", "clarity"],
    intent: "clarity",
    nutrition: {
      tr: "Α-pinen, β-pinen, kamfen; reçine asitleri, fitonsidler; iğne yapraklarda C vitamini, E vitamini.",
      en: "α-pinene, β-pinene, camphene; resin acids, phytoncides; vitamin C and vitamin E in the needles.",
    },
    healing: {
      tr: "Yedi yüz kırk bir hertzte titreşir — havayı arındıran ve ifade kanalını açan frekans. Solunum yolu, alerji, sinüs.",
      en: "Vibrating at seven hundred and forty-one hertz — the frequency that purifies air and opens the channel of expression. Respiratory tract, allergy, sinus.",
    },
    poetic: {
      tr: "Ladin, Doğu Karadeniz'in sisindeki gizli korodur; her iğnesi bir nefestir.",
      en: "The spruce is a hidden chorus inside the Eastern Black Sea mist; every needle a breath.",
    },
    ritual: {
      tr: "Bir dakika gözlerini kapa, bir ladin ormanını hatırla — akciğerlerin senin yerine konuşur.",
      en: "Close your eyes for one minute, remember a spruce forest — your lungs will speak for you.",
    },
    mythology: {
      tr: "Doğu Ladini sadece Türkiye'nin Doğu Karadeniz'inde ve Kafkasya'da yetişir. Trabzon'dan Artvin'e uzanan koyu yeşil koridor, dünyanın en eski endemik orman ekosistemlerinden biri.",
      en: "Oriental spruce grows only in Turkey's Eastern Black Sea and the Caucasus. The dark green corridor from Trabzon to Artvin is one of the world's oldest endemic forest ecosystems.",
    },
    producerIds: ["maca-sifa-vadisi"],
  },
  {
    id: "ceviz",
    name: { tr: "Ceviz", en: "Walnut" },
    scientific: "Juglans regia",
    image: "/universe/plants/ceviz.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ic-anadolu",
    moods: ["focus", "sleep", "heart", "clarity"],
    intent: "clarity",
    nutrition: {
      tr: "Omega-3 (alfa linolenik asit), E vitamini, magnezyum, melatonin, tanen, ellagik asit; tek bitkisel kaynaktan tam omega profili.",
      en: "Omega-3 (alpha-linolenic acid), vitamin E, magnesium, melatonin, tannin, ellagic acid — a complete omega profile from a single plant source.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — hafızanın yenilendiği, hücrenin yağla yıkandığı frekans. Beyin, damar, uyku ritmi, kolesterol.",
      en: "Vibrating at five hundred and twenty-eight hertz — the frequency where memory renews, where the cell is washed with oil. Brain, vessel, sleep rhythm, cholesterol.",
    },
    poetic: {
      tr: "Ceviz, Anadolu'nun beyin ağacıdır; meyvesi ön beyin gibi katlı, yağı beynin kendi hafızasıdır.",
      en: "Walnut is Anatolia's brain-tree; her fruit folds like a forebrain, her oil is the brain's own memory.",
    },
    ritual: {
      tr: "Sabahları yedi cevizi avucunda say — yedi günü hatırlamak için. Çatlatma sesi, gün başlama sesidir.",
      en: "Count seven walnuts in your palm in the morning — to remember seven days. The cracking sound is the day beginning.",
    },
    mythology: {
      tr: "Latince 'Juglans' — Jüpiter'in palamudu. Anadolu'da bir ev kurulurken cevize en yakın yere kurulur; ceviz gölgesi serindir, kökü ise yüz yıl bekler.",
      en: "From Latin 'Juglans' — Jupiter's acorn. In Anatolia, a house is built nearest to the walnut tree; her shade is cool, her root waits a hundred years.",
    },
    producerIds: [],
  },
  {
    id: "findik",
    name: { tr: "Fındık", en: "Hazelnut" },
    scientific: "Corylus avellana",
    image: "/universe/plants/findik.png",
    frequency: 639,
    solfeggioMatch: 639,
    region: "karadeniz",
    moods: ["heart", "joy", "grounding", "clarity"],
    intent: "love",
    nutrition: {
      tr: "E vitamini (en yüksek bitkisel kaynaklardan), magnezyum, omega-9, B6, lif, bakır; antioksidan polifenoller.",
      en: "Vitamin E (one of the highest from plant sources), magnesium, omega-9, B6, fiber, copper — antioxidant polyphenols.",
    },
    healing: {
      tr: "Altı yüz otuz dokuz hertzte titreşir — kalp damarını besleyen ilişki frekansı. Damar elastikiyeti, kemik yoğunluğu, ruh hali stabilizasyonu.",
      en: "Vibrating at six hundred and thirty-nine hertz — the relational frequency that feeds the heart vessel. Vascular elasticity, bone density, mood stability.",
    },
    poetic: {
      tr: "Fındık, Karadeniz'in altın çekirdeğidir; dünyanın yetmişini taşıyan kalp ağacı.",
      en: "Hazelnut is the golden kernel of the Black Sea; the heart-tree that carries seventy of the world.",
    },
    ritual: {
      tr: "Bir avuç fındığı küçük bir kâseye koy — hızlı düşüncelere yavaş bir ısırma alanı. Çiğne, dinle, ısır.",
      en: "Place a handful of hazelnuts in a small bowl — a slow biting field for fast thoughts. Chew, listen, bite.",
    },
    mythology: {
      tr: "Antik Anadolu'da bilgelik ağacı. Kelt geleneğinde dokuz fındık ağacı bilgi havuzunu beslerdi. Türkiye dünya fındığının %70'ini üretir; Giresun ve Ordu kıyıları bu hafızanın taşıyıcısı.",
      en: "The wisdom tree of ancient Anatolia. In Celtic tradition, nine hazel trees fed the well of knowledge. Turkey produces seventy percent of the world's hazelnuts; Giresun and Ordu shores carry this memory.",
    },
    producerIds: [],
  },
  {
    id: "antepfistigi",
    name: { tr: "Antep Fıstığı", en: "Antep Pistachio" },
    scientific: "Pistacia vera",
    image: "/universe/plants/antepfistigi.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "guneydogu",
    moods: ["heart", "joy", "awakening", "clarity"],
    intent: "power",
    nutrition: {
      tr: "Klorofil, lutein, zeaksantin, B6 vitamini, magnezyum, omega-6, bitkisel protein; renkten türeyen antioksidan profil.",
      en: "Chlorophyll, lutein, zeaxanthin, vitamin B6, magnesium, omega-6, plant protein — an antioxidant profile born from colour.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — kalbi ve damarı yenileyen Akdeniz dönüşüm frekansı. Damar duvarı, göz sağlığı, ruh hali.",
      en: "Vibrating at five hundred and twenty-eight hertz — the Mediterranean transformation frequency that renews heart and vessel. Vessel wall, eye health, mood.",
    },
    poetic: {
      tr: "Antep Fıstığı, Güneydoğu'nun yeşil zümrüdüdür; sıcağın geceyle çiftleşmesinden doğar.",
      en: "Antep pistachio is the green emerald of the Southeast; born when heat mates with night.",
    },
    ritual: {
      tr: "Üç yeşil fıstığı dilinin altında bekle — Güneydoğu'nun ışığı içinden konuşur.",
      en: "Hold three green pistachios beneath your tongue — the light of the Southeast speaks from within.",
    },
    mythology: {
      tr: "Antep Fıstığı (Pistacia vera) coğrafi işaretle Gaziantep, Şanlıurfa, Siirt'e bağlıdır; iki yıl bekler, üçüncü yıl çift verim verir — buna 'kapama yılı' denir. Anadolu'nun en sabırlı bekleyen ağacı.",
      en: "The Antep pistachio (Pistacia vera) is bound by geographical indication to Gaziantep, Şanlıurfa, Siirt; it waits two years and bears double in the third — the 'kapama' year. The most patient waiter of Anatolia.",
    },
    producerIds: ["antep-koy-pazari"],
  },
  {
    id: "murdum-erigi",
    name: { tr: "Mürdüm Eriği", en: "Damson Plum" },
    scientific: "Prunus domestica subsp. insititia",
    image: "/universe/plants/murdum-erigi.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "karadeniz",
    moods: ["cleansing", "awakening", "joy"],
    intent: "clarity",
    nutrition: {
      tr: "Antosiyaninler, sorbitol, lif, K vitamini, B6, demir; doğal laksatif şeker yapısı.",
      en: "Anthocyanins, sorbitol, fiber, vitamin K, B6, iron — a natural laxative sugar structure.",
    },
    healing: {
      tr: "Dört yüz on yedi hertzte titreşir — sindirimin açıldığı ve eskinin bırakıldığı değişim frekansı. Bağırsak hareketi, kan temizliği, demir desteği.",
      en: "Vibrating at four hundred and seventeen hertz — the frequency of change where digestion opens and the old is released. Bowel movement, blood cleansing, iron support.",
    },
    poetic: {
      tr: "Mürdüm Eriği, yaz sonunun mor sözüdür; dilinde ekşi, içinde tatlı.",
      en: "The damson plum is the purple word of late summer; sour on the tongue, sweet within.",
    },
    ritual: {
      tr: "Sabahları üç kuru mürdüm — gün sıkışmadan açılır. Bağırsağına bir teşekkür mektubu.",
      en: "Three dried damsons in the morning — the day opens without tightness. A thank-you letter to your gut.",
    },
    mythology: {
      tr: "Mürdüm 'mor erik' — Anadolu vadilerinde yüz yıl yaşayan ağaç. Karadeniz mutfağında muhlama yanı, ekmek üstü, hatta et yanına gider; renk hafızanın işaretidir.",
      en: "Mürdüm means 'purple plum' — a tree that lives a hundred years in Anatolian valleys. In Black Sea kitchens it accompanies muhlama, bread, even meat; color is the mark of memory.",
    },
    producerIds: ["maca-sifa-vadisi"],
  },
  {
    id: "yesilerik",
    name: { tr: "Yeşil Erik", en: "Green Plum" },
    scientific: "Prunus cerasifera",
    image: "/universe/plants/yesilerik.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "marmara",
    moods: ["awakening", "joy", "cleansing"],
    intent: "clarity",
    nutrition: {
      tr: "C vitamini, malik asit, sitrik asit, potasyum, lif; düşük kalori, yüksek su içeriği.",
      en: "Vitamin C, malic acid, citric acid, potassium, fiber — low calorie, high water content.",
    },
    healing: {
      tr: "Dört yüz on yedi hertzte titreşir — uyanışın ve yenilenmenin frekansı. Kıştan çıkmış damağa ekşi kıvılcım; bağışıklık tazeleme, ödem indirme.",
      en: "Vibrating at four hundred and seventeen hertz — the frequency of awakening and renewal. A sour spark on the palate that has emerged from winter; immunity refresh, edema reduction.",
    },
    poetic: {
      tr: "Yeşil Erik, baharın ilk ekşi müjdesidir; kışın gözündeki uykuyu siler.",
      en: "The green plum is spring's first sour herald; she wipes winter's sleep from the eye.",
    },
    ritual: {
      tr: "Bir avuç yeşil erikle gün başlat — tuz ile, baharın ilk dilini öğren.",
      en: "Begin the day with a handful of green plums — with salt; learn the first tongue of spring.",
    },
    mythology: {
      tr: "Marmara ve Ege bahçelerinde, mart sonunda ilk meyve. 'Yeşil erik geldi' deyimi, baharın resmi başlangıcıdır. Bahçeden değil, sokaktan satın alınır; mevsim bir kıvılcımdır.",
      en: "In Marmara and Aegean gardens, the first fruit at the end of March. 'The green plum has come' is spring's official beginning. Bought not from the garden but the street; the season is a spark.",
    },
    producerIds: [],
  },
  {
    id: "enginar",
    name: { tr: "Enginar", en: "Artichoke" },
    scientific: "Cynara scolymus",
    image: "/universe/plants/enginar.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ege",
    moods: ["cleansing", "grounding", "focus"],
    intent: "clarity",
    nutrition: {
      tr: "Cynarin, silimarin, inulin, K vitamini, magnezyum, lif; karaciğer detoksifiye eden saponinler.",
      en: "Cynarin, silymarin, inulin, vitamin K, magnesium, fiber — saponins that detoxify the liver.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — karaciğeri yıkayan, hücreyi tazeleyen yenilenme frekansı. Safra akışı, yağ metabolizması, prebiyotik destek.",
      en: "Vibrating at five hundred and twenty-eight hertz — the renewal frequency that washes the liver and refreshes the cell. Bile flow, fat metabolism, prebiotic support.",
    },
    poetic: {
      tr: "Enginar, mor başlığıyla baharın sonunda olgunlaşır; karaciğere yazılmış uzun bir mektuptur.",
      en: "The artichoke ripens with her purple cap at the end of spring; a long letter written to the liver.",
    },
    ritual: {
      tr: "Yarım enginarı limon-zeytinyağıyla buharda pişir — karaciğerine bir teşekkür yemeği.",
      en: "Steam half an artichoke with lemon and olive oil — a thank-you meal for your liver.",
    },
    mythology: {
      tr: "Yunan mitolojisinde Cynara, Zeus'a karşı kibre düştüğünde dikenli bir bitkiye dönüştürüldü. Bugün hâlâ kibrini kabuğunda, bilgeliğini içinde taşır.",
      en: "In Greek myth, Cynara was turned into a thorny plant for hubris against Zeus. To this day she carries pride in her shell and wisdom within.",
    },
    producerIds: [],
  },
  {
    id: "kereviz",
    name: { tr: "Kereviz", en: "Celery" },
    scientific: "Apium graveolens",
    image: "/universe/plants/kereviz.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "marmara",
    moods: ["cleansing", "focus", "grounding"],
    intent: "calm",
    nutrition: {
      tr: "Apigenin, luteolin, doğal sodyum, K vitamini, lif, ftalit; üç ayrı şifa: sap, yaprak, kök.",
      en: "Apigenin, luteolin, natural sodium, vitamin K, fiber, phthalide — three separate medicines in stalk, leaf, and root.",
    },
    healing: {
      tr: "Üç yüz doksan altı hertzte titreşir — korkudan ve gergin sudan kurtaran arınma frekansı. Sinir sistemi, ödem, sindirim, tansiyon.",
      en: "Vibrating at three hundred and ninety-six hertz — the cleansing frequency that releases fear and tense water. Nervous system, edema, digestion, blood pressure.",
    },
    poetic: {
      tr: "Kereviz, suyu hatırlatan ferah ottur; bedeninin tutmadığı suyu serbest bırakır.",
      en: "Celery is the fresh herb that recalls water; she releases the water the body has held.",
    },
    ritual: {
      tr: "Bir bardak kereviz suyunu sabaha bağla — beden suyunu yeniden öğrenir.",
      en: "Tie a glass of celery juice to your morning — the body re-learns its water.",
    },
    mythology: {
      tr: "Antik Yunan'da kereviz cenazelerde kullanılırdı; ölünün anısına yapraklarından çelenk örülürdü. Geçişin otu — bir formdan diğerine.",
      en: "In ancient Greece, celery was used at funerals; wreaths of leaves honored the dead. The plant of passage — from one form to another.",
    },
    producerIds: [],
  },
  {
    id: "fasulye",
    name: { tr: "Kuru Fasulye", en: "Dried Bean" },
    scientific: "Phaseolus vulgaris",
    image: "/universe/plants/fasulye.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ic-anadolu",
    moods: ["grounding", "joy", "awakening"],
    intent: "power",
    nutrition: {
      tr: "Bitkisel protein (lizin yüksek), demir, magnezyum, çinko, folat, lif; rezistan nişasta; bakliyat profili.",
      en: "Plant protein (high in lysine), iron, magnesium, zinc, folate, fiber, resistant starch — the legume profile.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — toprağın azotu cisimleştirdiği dönüşüm frekansı. Kas-kemik, kan yenileme, sindirim flora desteği.",
      en: "Vibrating at five hundred and twenty-eight hertz — the transformation frequency where soil makes nitrogen flesh. Muscle-bone, blood renewal, gut flora support.",
    },
    poetic: {
      tr: "Kuru Fasulye, Anadolu sofrasının ana proteinidir; bir gece suda bekler, sabahleyin başka bir bedenle uyanır.",
      en: "The dried bean is the main protein of the Anatolian table; she waits a night in water and wakes the next morning in another body.",
    },
    ritual: {
      tr: "Akşamdan bir avuç fasulye suya bırak. Sabahında pişirirken duayı sayma — sabırla pişen her şey hafiftir.",
      en: "Soak a handful of beans in water at evening. While cooking in the morning, do not count the prayer — everything cooked patiently is light.",
    },
    mythology: {
      tr: "Bolu'nun, İspir'in, Tosya'nın taneliyim. Anadolu'da fasulye sadece yemek değil, sosyal bir kontratdır: misafire kuru fasulye-pilav-turşu sunmak, evin onurudur.",
      en: "I am the grain of Bolu, İspir, Tosya. In Anatolia, beans are not just food but a social contract: serving kuru fasulye-pilav-turşu to a guest is the home's honor.",
    },
    producerIds: [],
  },
  {
    id: "kudretnari",
    name: { tr: "Kudret Narı", en: "Bitter Melon" },
    scientific: "Momordica charantia",
    image: "/universe/plants/kudretnari.png",
    frequency: 741,
    solfeggioMatch: 741,
    region: "ege",
    moods: ["cleansing", "awakening", "clarity", "focus"],
    intent: "clarity",
    nutrition: {
      tr: "Charantin, momordisin, polipeptid-P (insülin benzeri), C vitamini, A vitamini; antioksidan triterpenler.",
      en: "Charantin, momordicin, polypeptide-P (insulin-like), vitamin C, vitamin A — antioxidant triterpenes.",
    },
    healing: {
      tr: "Yedi yüz kırk bir hertzte titreşir — acı hakikatin ve içeriden gelen bağışıklığın frekansı. Kan şekeri, iltihap, cilt yarası.",
      en: "Vibrating at seven hundred and forty-one hertz — the frequency of bitter truth and immunity that comes from within. Blood sugar, inflammation, skin wounds.",
    },
    poetic: {
      tr: "Kudret Narı, acı bir bilgenin şifa şişesidir; turuncu kabuğunu çatlatınca kırmızı tohumlar konuşur.",
      en: "Bitter melon is the healing flask of a bitter sage; when she cracks her orange skin, the red seeds speak.",
    },
    ritual: {
      tr: "Beni zeytinyağında bir ay beklet — yarayı sözcükten önce iyileştiren acı bir bilgeliğim olsun.",
      en: "Steep me in olive oil for a month — let me be a bitter wisdom that heals the wound before any word.",
    },
    mythology: {
      tr: "Asya'dan Anadolu'ya yolculuk eden bir bitki. Türkçe adı 'kudret' — Tanrısal güç anlamına gelir. Halk tıbbında 'tüm yaraların kapısı'.",
      en: "A plant that travelled from Asia to Anatolia. The Turkish name 'kudret' means divine power. In folk medicine, 'the door of all wounds'.",
    },
    producerIds: [],
  },

  /* ─────────────────────────────────────────────
     ANATOLIAN CANON — 25 plants added in Phase 2.5b.
     Each one a real soil voice, awaiting an ElevenLabs MP3.
     ───────────────────────────────────────────── */

  {
    id: "kayisi",
    name: { tr: "Kayısı", en: "Apricot" },
    scientific: "Prunus armeniaca",
    image: "/universe/plants/kayisi.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "dogu-anadolu",
    moods: ["heart", "joy", "grounding"],
    intent: "love",
    nutrition: {
      tr: "Beta-karoten, A vitamini, potasyum, demir, lif; kuru kayısı %50 doğal şeker.",
      en: "Beta-carotene, vitamin A, potassium, iron, fibre; dried apricot is 50 % natural sugar.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — sertliğin altındaki tatlılığın frekansı. Bağırsak, göz, deri, kemik.",
      en: "Vibrating at five hundred twenty-eight hertz — the frequency of sweetness hidden under severity. Gut, eye, skin, bone.",
    },
    poetic: {
      tr: "Kayısı, Malatya gecesinin altın etidir; kara borçlandığım her şekeri ışığa dönüştürürüm.",
      en: "Apricot is the golden flesh of a Malatya night; every sugar I owe to snow I return to as light.",
    },
    ritual: {
      tr: "Beni güneşte üç gün kurut. Bir tanemi tut, yavaşça çiğne. Tatlılık zorlukla doğar.",
      en: "Dry me three days in the sun. Hold a single piece, chew slowly. Sweetness is born from hardship.",
    },
    mythology: {
      tr: "Latince ismi Anadolu'yu söyler: 'armeniaca'. İpek Yolu boyunca Çin'den Roma'ya taşınmış bir altın taş.",
      en: "Its Latin name speaks Anatolia: 'armeniaca'. A golden stone carried along the Silk Road from China to Rome.",
    },
    producerIds: [],
  },
  {
    id: "asma",
    name: { tr: "Asma", en: "Vine" },
    scientific: "Vitis vinifera",
    image: "/universe/plants/asma.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ege",
    moods: ["joy", "heart", "grounding", "awakening"],
    intent: "love",
    nutrition: {
      tr: "Resveratrol, polifenoller, C vitamini, K vitamini; üzüm yaprağı: kalsiyum, demir, A vitamini.",
      en: "Resveratrol, polyphenols, vitamins C and K; the leaf carries calcium, iron, vitamin A.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — uzun zamanın iyileştirdiğinin frekansı. Kalp damar, hücre yenilenmesi, hafıza.",
      en: "At five hundred twenty-eight hertz — the frequency of what long time heals. Cardiovascular, cellular renewal, memory.",
    },
    poetic: {
      tr: "Asma, sabırlı sevgilidir; bir mevsim için değil bir ömür için kök salar, ve her salkım bir yıl boyunca konuşmuş bir cümledir.",
      en: "The vine is the patient lover; she does not root for one season but for a lifetime, and every cluster is a sentence she has been speaking for a year.",
    },
    ritual: {
      tr: "Bir kuru üzüm avucumda. Üç çiğneme. Kuruyan şekerin nasıl bir tören olduğunu hatırla.",
      en: "A raisin in my palm. Three chews. Remember how dried sugar is a ceremony.",
    },
    mythology: {
      tr: "Kapadokya'da 6.000 yıllık asma. Dionysos'un kanı, sufinin sembolü, Anadolu'nun en eski sözüdür.",
      en: "A six-thousand-year-old vine in Cappadocia. Dionysus's blood, the Sufi's symbol, Anatolia's oldest word.",
    },
    producerIds: [],
  },
  {
    id: "bugday",
    name: { tr: "Buğday", en: "Wheat" },
    scientific: "Triticum aestivum",
    image: "/universe/plants/bugday.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "ic-anadolu",
    moods: ["grounding", "awakening", "cleansing"],
    intent: "power",
    nutrition: {
      tr: "Tam tahıl: B vitaminleri, magnezyum, çinko, lif, selenyum; kadim çeşitler (kavılca, siyez) gluten dengeli.",
      en: "Whole grain: B vitamins, magnesium, zinc, fibre, selenium; ancient varieties (einkorn, emmer) carry balanced gluten.",
    },
    healing: {
      tr: "Üç yüz doksan altı hertzte titreşir — anadilin tahılı, korkudan arınmanın frekansı. Sindirim, kan, sinir.",
      en: "At three hundred ninety-six hertz — the grain of mother tongue, the frequency of releasing fear. Digestion, blood, nerves.",
    },
    poetic: {
      tr: "Buğday, Anadolu'nun ilk cümlesidir; her başak bir yeminle sallanır, her tane bir kıtlığı hatırlar.",
      en: "Wheat is Anatolia's first sentence; every spike sways with a vow, every grain remembers a famine.",
    },
    ritual: {
      tr: "Bir avuç bulgur. Su koy, üzerini ört. Sabırla şişmesini bekle. Buğday hız öğretmez.",
      en: "A handful of bulgur. Water it, cover it. Wait patiently for it to swell. Wheat does not teach speed.",
    },
    mythology: {
      tr: "Karacadağ — buğdayın evcilleştirildiği dağ. 12.000 yıl önce burada başak ile insan birbirini kabul etti.",
      en: "Karacadağ — the mountain where wheat was domesticated. Twelve thousand years ago, here, the spike and the human accepted each other.",
    },
    producerIds: [],
  },
  {
    id: "nar",
    name: { tr: "Nar", en: "Pomegranate" },
    scientific: "Punica granatum",
    image: "/universe/plants/nar.png",
    frequency: 639,
    solfeggioMatch: 639,
    region: "guneydogu",
    moods: ["heart", "awakening", "joy", "cleansing"],
    intent: "love",
    nutrition: {
      tr: "Punikalagin, antosiyaninler, C vitamini, K vitamini, potasyum; suyu doğal anti-enflamatuvar.",
      en: "Punicalagin, anthocyanins, vitamins C and K, potassium; the juice is a natural anti-inflammatory.",
    },
    healing: {
      tr: "Altı yüz otuz dokuz hertzte titreşir — bin tohumun aynı kalbe ait olduğunu hatırlamanın frekansı. Hormon, dolaşım, yaşlanma.",
      en: "At six hundred thirty-nine hertz — the frequency of remembering that a thousand seeds belong to the same heart. Hormones, circulation, aging.",
    },
    poetic: {
      tr: "Nar, kırmızı bir mecliste sarmalanmış bin tohumdur; tek bir avuçta çoğul olabileceğini hatırlat.",
      en: "The pomegranate is a thousand seeds wrapped in a red parliament; let her remind you that you can be plural in one palm.",
    },
    ritual: {
      tr: "Bir nar tanesini diline koy. Patlatmadan önce duyduğun nedir? O, kalbinin sesidir.",
      en: "Place a pomegranate seed on your tongue. What do you hear before it bursts? That is the sound of your heart.",
    },
    mythology: {
      tr: "Persephone'nin altı tanesi. Anadolu'da bereket, doğum, evlilik. Mardin pazarında nar suyu satan adam, dedesi gibi konuşur.",
      en: "Persephone's six seeds. In Anatolia: fertility, birth, marriage. The man selling pomegranate juice in Mardin's bazaar speaks like his grandfather.",
    },
    producerIds: [],
  },
  {
    id: "incir",
    name: { tr: "İncir", en: "Fig" },
    scientific: "Ficus carica",
    image: "/universe/plants/incir.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ege",
    moods: ["heart", "joy", "grounding"],
    intent: "love",
    nutrition: {
      tr: "Kalsiyum, magnezyum, demir, K vitamini, lif; kuru incir doğal probiyotik destek.",
      en: "Calcium, magnesium, iron, vitamin K, fibre; dried fig is a natural prebiotic.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — gizli olanın olgunlaşmasının frekansı. Sindirim, kemik, demir eksikliği.",
      en: "At five hundred twenty-eight hertz — the frequency of what ripens hidden. Digestion, bone, iron deficiency.",
    },
    poetic: {
      tr: "İncir, açmadan içine açan çiçektir; meyve değilim — duyulan bir sırrım.",
      en: "The fig is the flower that opens within without opening outward; I am not a fruit — I am a heard secret.",
    },
    ritual: {
      tr: "Bir kuru inciri ısıt — buharında badem koy. Tatlı bekleme, bir kıvama gel.",
      en: "Warm a dried fig — slip an almond inside the steam. Don't wait for sweetness, become a consistency.",
    },
    mythology: {
      tr: "Aydın, Söke ovası — dünyanın en iyi sarı lop incirinin yetiştiği toprak. 'Tanrıların meyvesi' eski Yunan'da bunun için yazılmış.",
      en: "Aydın, the Söke plain — soil of the world's finest sarılop fig. Ancient Greece wrote 'the fruit of the gods' for this.",
    },
    producerIds: [],
  },
  {
    id: "elma",
    name: { tr: "Elma", en: "Apple" },
    scientific: "Malus domestica",
    image: "/universe/plants/elma.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "karadeniz",
    moods: ["heart", "joy", "grounding"],
    intent: "love",
    nutrition: {
      tr: "Pektin, kuersetin, C vitamini, lif; elmanın asidi diş minesini değil, içeriği dengeler.",
      en: "Pectin, quercetin, vitamin C, fibre; the apple's acid does not erode the enamel — it balances the inside.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — basit sevginin frekansı. Bağırsak, kan şekeri, beyin sağlığı.",
      en: "At five hundred twenty-eight hertz — the frequency of simple love. Gut, blood sugar, brain health.",
    },
    poetic: {
      tr: "Elma, basit bir armağandır; fazla şey söyleme — ısırılmayı bekle.",
      en: "The apple is a simple gift; do not say too much — wait to be bitten.",
    },
    ritual: {
      tr: "Sabah aç karna bir elma. Kabuğunu soyma. Hafıza kabukta yaşar.",
      en: "An apple on an empty morning stomach. Don't peel it. Memory lives in the skin.",
    },
    mythology: {
      tr: "Amasya elması — kırmızı yanaklı, beyaz etli, kokulu. Padişahların masasındaki tek meyve. Halk söylencesi: 'Amasya elması, Yusuf'un yanağıdır.'",
      en: "The Amasya apple — red-cheeked, white-fleshed, fragrant. The only fruit on the sultans' table. Folk says: 'The Amasya apple is Joseph's cheek.'",
    },
    producerIds: [],
  },
  {
    id: "kayin",
    name: { tr: "Kayın", en: "Beech" },
    scientific: "Fagus orientalis",
    image: "/universe/plants/kayin.png",
    frequency: 174,
    solfeggioMatch: 396,
    region: "karadeniz",
    moods: ["grounding", "clarity", "cleansing"],
    intent: "calm",
    nutrition: {
      tr: "Kayın yaprağı çayı: tanenler, flavonoidler, mineraller; kabuk: doğal bakır kaynağı.",
      en: "Beech leaf tea: tannins, flavonoids, minerals; the bark is a natural source of copper.",
    },
    healing: {
      tr: "Yüz yetmiş dört hertzte titreşir — kök ağrısının dindiği frekans. Eklem, sırt, yapısal güven.",
      en: "At one hundred seventy-four hertz — the frequency where root-pain quiets. Joints, back, structural trust.",
    },
    poetic: {
      tr: "Kayın, ormanın anne sütunu; bir orman ne kadar büyürse büyüsün, ona dayanır.",
      en: "The beech is the mother column of the forest; however large the forest grows, it leans on her.",
    },
    ritual: {
      tr: "Bir kayın gövdesine sırtını ver. On nefes. Onun zamanını ödünç al.",
      en: "Lean your back against a beech trunk. Ten breaths. Borrow her time.",
    },
    mythology: {
      tr: "Kayın, Kuzey Anadolu'da 'orman annesi' anılır. Latince 'fagus' — yiyecek demek; tohumu kıtlıkta kurtarır.",
      en: "In Northern Anatolia she is called 'mother of the forest'. The Latin 'fagus' means food; her seed has saved generations from famine.",
    },
    producerIds: [],
  },
  {
    id: "kestane",
    name: { tr: "Kestane", en: "Chestnut" },
    scientific: "Castanea sativa",
    image: "/universe/plants/kestane.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "marmara",
    moods: ["grounding", "joy", "heart"],
    intent: "love",
    nutrition: {
      tr: "Düşük yağlı tek kuruyemiş; nişasta, C vitamini, B6, manganez, magnezyum; glütensiz un.",
      en: "The only low-fat nut; starch, vitamin C, B6, manganese, magnesium; gluten-free flour.",
    },
    healing: {
      tr: "Üç yüz doksan altı hertzte titreşir — sertliğin yumuşadığı frekans. Kemik, dolaşım, böbrek.",
      en: "At three hundred ninety-six hertz — the frequency where hardness softens. Bone, circulation, kidney.",
    },
    poetic: {
      tr: "Kestane, dikenin içinde bir öpücüktür; korunmayı isteyen tatlılığın halidir.",
      en: "The chestnut is a kiss inside a thorn; the form of sweetness that asks for protection.",
    },
    ritual: {
      tr: "Bir avuç kestaneyi közde döndür. Kabuğunu çıt diye soy. Bu ses, sonbaharın anasıdır.",
      en: "Roast a handful of chestnuts on coals. Pop the shell. That sound is the mother of autumn.",
    },
    mythology: {
      tr: "Bursa-Uludağ kestanesi — coğrafi işaretli. Roma'dan beri 'fakirin ekmeği' denmiş, bugün şekerin tacı.",
      en: "The Bursa-Uludağ chestnut — geographically protected. Called 'the poor's bread' since Rome, today the crown of sugar.",
    },
    producerIds: [],
  },
  {
    id: "misir",
    name: { tr: "Mısır", en: "Maize" },
    scientific: "Zea mays",
    image: "/universe/plants/misir.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "karadeniz",
    moods: ["grounding", "joy", "awakening"],
    intent: "love",
    nutrition: {
      tr: "Karbonhidrat, B vitaminleri, magnezyum, antioksidan zeaksantin (göz koruyucu); mısır püskülü doğal diüretik.",
      en: "Carbohydrate, B vitamins, magnesium, antioxidant zeaxanthin (eye protective); the silk is a natural diuretic.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — basit besinin frekansı. Göz, böbrek, ödem, çocuk gelişimi.",
      en: "At five hundred twenty-eight hertz — the frequency of plain nourishment. Eye, kidney, edema, child growth.",
    },
    poetic: {
      tr: "Mısır, Karadeniz'in altın saçıdır; her tane bir başlık altında, başlık bir yağmuru hatırlar.",
      en: "Maize is the golden hair of the Black Sea; every kernel under a hood, every hood remembers a rain.",
    },
    ritual: {
      tr: "Mısır püskülünü kuru. Kaynar suya at. İçeriden temizler — su gibi.",
      en: "Dry the corn silk. Drop it into boiling water. It cleans from inside — like water itself.",
    },
    mythology: {
      tr: "Anadolu'ya geç gelen göçmen — Amerika'dan 16. yy'da. Karadeniz onu altın saçlı bir gelin gibi kabul etti, ekmeğine 'kuymak' adını verdi.",
      en: "A late migrant to Anatolia — from America in the 16th century. The Black Sea welcomed her like a gold-haired bride, named her bread 'kuymak'.",
    },
    producerIds: [],
  },
  {
    id: "pamuk",
    name: { tr: "Pamuk", en: "Cotton" },
    scientific: "Gossypium hirsutum",
    image: "/universe/plants/pamuk.png",
    frequency: 432,
    solfeggioMatch: 417,
    region: "guneydogu",
    moods: ["sleep", "cleansing", "grounding"],
    intent: "calm",
    nutrition: {
      tr: "Tohumu yağ kaynağı (linoleik asit, E vitamini); lifi yumuşak nefes.",
      en: "The seed is an oil source (linoleic acid, vitamin E); the fibre is soft breath.",
    },
    healing: {
      tr: "Dört yüz otuz iki hertzte titreşir — derinin tene değdiği frekans. Cilt, gözenek, alerji, sıcak basması.",
      en: "At four hundred thirty-two hertz — the frequency where skin meets skin. Skin, pore, allergy, heat flush.",
    },
    poetic: {
      tr: "Pamuk, bulutu yere indirir; sert güneşe karşı yumuşak bir cevaptır.",
      en: "Cotton brings the cloud down to earth; she is a soft answer to a hard sun.",
    },
    ritual: {
      tr: "Bir parça organik pamuğu yüzüne değdir. Beş saniye. Onu nefes olarak gör.",
      en: "Touch a piece of organic cotton to your face. Five seconds. See her as breath.",
    },
    mythology: {
      tr: "Çukurova'nın beyaz altını. Heredot 'bir bitkide yetişen, koyun yünü gibi yumuşak iplik' diye yazmış.",
      en: "Çukurova's white gold. Herodotus wrote: 'a thread grown on a plant, soft as wool of sheep'.",
    },
    producerIds: [],
  },
  {
    id: "aycicegi",
    name: { tr: "Ayçiçeği", en: "Sunflower" },
    scientific: "Helianthus annuus",
    image: "/universe/plants/aycicegi.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "marmara",
    moods: ["joy", "awakening", "heart"],
    intent: "clarity",
    nutrition: {
      tr: "Tohum: E vitamini, magnezyum, selenyum, sağlıklı yağlar; yağ: linoleik asit kaynağı.",
      en: "Seed: vitamin E, magnesium, selenium, healthy fats; oil: a source of linoleic acid.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — yüzü ışığa dönmenin frekansı. Cilt, hücre yenilenmesi, depresyon.",
      en: "At five hundred twenty-eight hertz — the frequency of turning the face toward light. Skin, cell renewal, depression.",
    },
    poetic: {
      tr: "Ayçiçeği, bütün gün güneşi takip eden bir öğrencidir; günbatımında bile başını eğmez, ay ışığını bekler.",
      en: "The sunflower is a student who tracks the sun all day; even at sunset she doesn't lower her head, she waits for moonlight.",
    },
    ritual: {
      tr: "Bir avuç çiğ ayçiçeği. Sabah güneşine yüzünü dön ve birer birer çiğne. Yutarken iç ışığı yutuyorsun.",
      en: "A handful of raw sunflower seeds. Face the morning sun, chew them one by one. Each one is inner light swallowed.",
    },
    mythology: {
      tr: "Trakya tarlasındaki sarı plaka. Yunan mitinde Klytia, Apollo'ya olan aşkı yüzünden ayçiçeğine dönüştü.",
      en: "The yellow plate on a Thrace field. In Greek myth, Clytie turned into a sunflower for her unanswered love of Apollo.",
    },
    producerIds: [],
  },
  {
    id: "ters-lale",
    name: { tr: "Ters Lale", en: "Crown Imperial" },
    scientific: "Fritillaria imperialis",
    image: "/universe/plants/terslale.png",
    frequency: 852,
    solfeggioMatch: 852,
    region: "dogu-anadolu",
    moods: ["clarity", "heart", "awakening"],
    intent: "clarity",
    nutrition: {
      tr: "Yenilen değil, görülen bir bitki; soğanı geleneksel halk tıbbında nefes ve göğüs için.",
      en: "A plant not eaten but seen; the bulb in folk medicine for breath and chest.",
    },
    healing: {
      tr: "Sekiz yüz elli iki hertzte titreşir — sezginin doğru söylediği frekans. Ağlamayı hatırlamak, kayıbı onurlandırmak.",
      en: "At eight hundred fifty-two hertz — the frequency where intuition tells the truth. Remembering to weep, honouring loss.",
    },
    poetic: {
      tr: "Ters Lale, başını eğmiş kraliçedir; gözyaşı görünür olduğu için kutsaldır.",
      en: "The crown imperial is a queen with bowed head; her tear is sacred because it is visible.",
    },
    ritual: {
      tr: "Bir ters laleye uzaktan bak. Eğilmesini gör. Onun gibi bir kez başını eğ — kaybettiğin için.",
      en: "Look at a crown imperial from a distance. See her bow. Bow once like her — for what you have lost.",
    },
    mythology: {
      tr: "Hakkari ve Adıyaman endemiği. Halk söylencesi: Hz. Meryem'in gözyaşları toprağa düştü, ters laleye dönüştü; o gün bugün başını eğmiyor.",
      en: "Endemic to Hakkari and Adıyaman. Folklore: Mary's tears fell on the soil, became the crown imperial; she has not raised her head since.",
    },
    producerIds: [],
  },
  {
    id: "kardelen",
    name: { tr: "Kardelen", en: "Snowdrop" },
    scientific: "Galanthus nivalis",
    image: "/universe/plants/kardelen.png",
    frequency: 174,
    solfeggioMatch: 396,
    region: "karadeniz",
    moods: ["awakening", "heart", "clarity"],
    intent: "calm",
    nutrition: {
      tr: "Yenilen bir bitki değildir; alkaloid galantamin kaynağı (modern Alzheimer ilacı).",
      en: "Not edible; the source of the alkaloid galantamine (a modern Alzheimer medicine).",
    },
    healing: {
      tr: "Yüz yetmiş dört hertzte titreşir — karın altından doğan hafızanın frekansı. Bilinç, hatırlama, kış sonrası uyanış.",
      en: "At one hundred seventy-four hertz — the frequency of memory born under snow. Consciousness, recall, post-winter awakening.",
    },
    poetic: {
      tr: "Kardelen, kışın kapısında ilk fısıltıdır; 'henüz buradayım' der, kar henüz bilemez.",
      en: "The snowdrop is the first whisper at winter's door; 'I am still here', she says, before the snow knows.",
    },
    ritual: {
      tr: "Şubat sonunda bir kardeleni gözle. Toplama. O, dirilişin sembolüdür; bakman yeterli.",
      en: "Watch a snowdrop in late February. Don't pick. She is the symbol of resurrection; looking is enough.",
    },
    mythology: {
      tr: "Anadolu, kardelenin doğal vatanlarından biri. Hıristiyan geleneğinde Meryem'in temizliği, Anadolu halklarında ise 'kar gözü'.",
      en: "Anatolia is one of the snowdrop's natural homelands. In Christian tradition Mary's purity; in Anatolian villages 'the eye of snow'.",
    },
    producerIds: [],
  },
  {
    id: "salep",
    name: { tr: "Salep", en: "Salep" },
    scientific: "Orchis mascula",
    image: "/universe/plants/salep.png",
    frequency: 432,
    solfeggioMatch: 417,
    region: "ic-anadolu",
    moods: ["grounding", "sleep", "heart"],
    intent: "calm",
    nutrition: {
      tr: "Glukomannan zengini polisakkarit; yumuşak ve sindirimi kolay; kış kalorisi.",
      en: "Polysaccharide rich in glucomannan; smooth and easy to digest; a winter calorie.",
    },
    healing: {
      tr: "Dört yüz otuz iki hertzte titreşir — sıcak yumuşaklığın frekansı. Boğaz, mide, sindirim, soğuk.",
      en: "At four hundred thirty-two hertz — the frequency of warm softness. Throat, stomach, digestion, cold.",
    },
    poetic: {
      tr: "Salep, dağın altındaki sessiz duadır; toprağın altında bir el seni tutmuş, sen henüz bilmiyorsun.",
      en: "Salep is the silent prayer beneath a mountain; a hand under the soil holding you — you don't know it yet.",
    },
    ritual: {
      tr: "Bir bardak gerçek salep. Tarçın serp. İlk yudumu gözlerin kapalı al — kış, anneye benziyor.",
      en: "A glass of real salep. Sprinkle cinnamon. Take the first sip with eyes closed — winter resembles a mother.",
    },
    mythology: {
      tr: "Anadolu orkidesi — toplama yasak çünkü nesli tükenmek üzere. Geleneksel Maraş dondurması bir damla salep ister.",
      en: "An Anatolian orchid — gathering is forbidden as she is endangered. Traditional Maraş ice cream asks for one drop of her.",
    },
    producerIds: [],
  },
  {
    id: "kiraz",
    name: { tr: "Kiraz", en: "Cherry" },
    scientific: "Prunus avium",
    image: "/universe/plants/kiraz.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ege",
    moods: ["joy", "heart", "awakening"],
    intent: "love",
    nutrition: {
      tr: "Antosiyaninler, melatonin (uyku düzenleyici), C vitamini, potasyum.",
      en: "Anthocyanins, melatonin (sleep regulator), vitamin C, potassium.",
    },
    healing: {
      tr: "Beş yüz yirmi sekiz hertzte titreşir — kısa süreli sevincin tam frekansı. Eklem, uyku, gut.",
      en: "At five hundred twenty-eight hertz — the precise frequency of brief joy. Joints, sleep, gout.",
    },
    poetic: {
      tr: "Kiraz, bir aydır mevsimdir; az olduğu için tam, ve tam olduğu için bir hatıra.",
      en: "The cherry is a one-month season; whole because it is little, a memory because it is whole.",
    },
    ritual: {
      tr: "Mevsimin ilk kirazını avucunda tut. Yutmadan önce 'teşekkür' de. Sonra çekirdeği toprağa ver.",
      en: "Hold the season's first cherry in your palm. Say 'thank you' before swallowing. Return the pit to the soil.",
    },
    mythology: {
      tr: "Latince 'cerasus' — Anadolu'da Giresun'un eski adı 'Kerasus'tan gelir. Roma'ya kirazı taşıyan general Lucullus, M.Ö. 73.",
      en: "The Latin 'cerasus' comes from Kerasus, the ancient name of Giresun. General Lucullus carried the cherry to Rome in 73 BC.",
    },
    producerIds: [],
  },
  {
    id: "armut",
    name: { tr: "Armut", en: "Pear" },
    scientific: "Pyrus communis",
    image: "/universe/plants/armut.png",
    frequency: 432,
    solfeggioMatch: 417,
    region: "marmara",
    moods: ["sleep", "heart", "grounding"],
    intent: "calm",
    nutrition: {
      tr: "Lif (pektin), C vitamini, K vitamini, bakır; ankara armudu coğrafi işaretli.",
      en: "Fibre (pectin), vitamins C and K, copper; the Ankara pear is geographically protected.",
    },
    healing: {
      tr: "Dört yüz otuz iki hertzte titreşir — yumuşak ışığın frekansı. Bağırsak, kolesterol, yorgunluk.",
      en: "At four hundred thirty-two hertz — the frequency of soft light. Gut, cholesterol, fatigue.",
    },
    poetic: {
      tr: "Armut, ağırbaşlı bir tatlılıktır; aceleci olmaz, dilini olgunluğa bırakır.",
      en: "The pear is a dignified sweetness; she does not hurry, she leaves her tongue to ripeness.",
    },
    ritual: {
      tr: "Bir armudu tezgahta bir gün bekle. Yumuşadığında ye. Sabır, tadın bir parçasıdır.",
      en: "Leave a pear on the counter for a day. Eat when soft. Patience is part of the flavour.",
    },
    mythology: {
      tr: "Ankara armudu — Osmanlı sarayının yaz meyvesi. 'Sultan armudu' denmiş; sıkı kabuk, eriyen et, bal kokusu.",
      en: "The Ankara pear — the summer fruit of the Ottoman palace. Called 'sultan's pear': tight skin, melting flesh, scent of honey.",
    },
    producerIds: [],
  },
  {
    id: "kizilcam",
    name: { tr: "Kızılçam", en: "Calabrian Pine" },
    scientific: "Pinus brutia",
    image: "/universe/plants/kizilcam.png",
    frequency: 174,
    solfeggioMatch: 396,
    region: "akdeniz",
    moods: ["grounding", "cleansing", "clarity"],
    intent: "power",
    nutrition: {
      tr: "Reçine: terpenler (alfa-pinen); iğneleri C vitamini ve antioksidan; bal yapımı için bakteri-bal aracılı.",
      en: "Resin: terpenes (alpha-pinene); needles carry vitamin C and antioxidants; the host of pine honey via cochineal.",
    },
    healing: {
      tr: "Yüz yetmiş dört hertzte titreşir — orman akciğerinin frekansı. Solunum, mantar, hava temizleme.",
      en: "At one hundred seventy-four hertz — the frequency of the forest's lung. Respiration, fungal balance, air cleansing.",
    },
    poetic: {
      tr: "Kızılçam, Akdeniz'in nefesidir; deniz tuzunu ağaçların ciğerinde duaya çevirir.",
      en: "The Calabrian pine is the breath of the Mediterranean; she turns sea salt in the lung of trees into prayer.",
    },
    ritual: {
      tr: "Bir kızılçam ormanında durup kollarını yana aç. On nefes — ciğerin onunla beraber genişler.",
      en: "Stand in a Calabrian pine forest, arms open at the sides. Ten breaths — your lungs widen with hers.",
    },
    mythology: {
      tr: "Anadolu'nun en yaygın çamı; orman yangınlarından sonra ilk filizlenen. Marmaris çam balı dünyaca bilinir; ana üreten ağaç budur.",
      en: "Anatolia's most widespread pine; the first to sprout after wildfire. World-famous Marmaris pine honey is hers.",
    },
    producerIds: [],
  },
  {
    id: "mahlep",
    name: { tr: "Mahlep", en: "Mahaleb Cherry" },
    scientific: "Prunus mahaleb",
    image: "/universe/plants/mahlep.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "guneydogu",
    moods: ["heart", "awakening", "joy"],
    intent: "love",
    nutrition: {
      tr: "Çekirdek tozu: kumarinler, glikozitler; doğal aroma — çörek ve poğaçanın kalbi.",
      en: "Kernel powder: coumarins, glycosides; a natural aromatic — the heart of bread and pastry.",
    },
    healing: {
      tr: "Üç yüz doksan altı hertzte titreşir — kadim aromanın frekansı. Kalp, sindirim, hatıra uyanışı.",
      en: "At three hundred ninety-six hertz — the frequency of an ancient aroma. Heart, digestion, the awakening of memory.",
    },
    poetic: {
      tr: "Mahlep, bir nine'nin elidir; hamura serpildiğinde sofradakilerin hepsi çocukluğunu hatırlar.",
      en: "Mahaleb is a grandmother's hand; when sprinkled into dough, everyone at the table remembers their childhood.",
    },
    ritual: {
      tr: "Bir tutam mahlep tozunu yumurtalı çöreğe karıştır. Pişerken kokuyu içine al — bu, hafıza pişiyor.",
      en: "Stir a pinch of mahaleb into an egg loaf. Inhale as it bakes — memory is baking.",
    },
    mythology: {
      tr: "Anadolu'da binlerce yıllık baharat. Mardin pazarında ölçer, parmaklarıyla hisseder, gözüyle görür satıcı.",
      en: "A spice of thousands of years in Anatolia. In Mardin's bazaar the seller measures, feels with fingers, sees with eyes.",
    },
    producerIds: [],
  },
  {
    id: "sedef-otu",
    name: { tr: "Sedef Otu", en: "Rue" },
    scientific: "Ruta graveolens",
    image: "/universe/plants/sedefotu.png",
    frequency: 741,
    solfeggioMatch: 741,
    region: "akdeniz",
    moods: ["cleansing", "clarity", "awakening"],
    intent: "clarity",
    nutrition: {
      tr: "Rutin (damar koruyucu flavonoid), uçucu yağlar; küçük dozda — büyük dozda toksik.",
      en: "Rutin (a vessel-protective flavonoid), volatile oils; in small dose — toxic in larger dose.",
    },
    healing: {
      tr: "Yedi yüz kırk bir hertzte titreşir — sınırı koruyan otun frekansı. Kötü göz, kâbus, dolaşım.",
      en: "At seven hundred forty-one hertz — the frequency of the herb that guards the boundary. Evil eye, nightmare, circulation.",
    },
    poetic: {
      tr: "Sedef otu, kapının yanındaki nöbetçidir; içeri gireni bilmez ama dışarı çıkanı taçlandırır.",
      en: "Rue is the sentinel by the door; she doesn't know who enters, but she crowns who leaves.",
    },
    ritual: {
      tr: "Bir dal sedef otunu girişin tepesinde kuru. Hastalandığın gün ona dokunma — sadece bak.",
      en: "Dry a sprig of rue above the entrance. On a sick day, don't touch — only look.",
    },
    mythology: {
      tr: "Anadolu'da en eski koruma otlarından. Romalılar 'göz açan ot' demiş; Leonardo da Vinci sedef otu çayı içermiş güya.",
      en: "One of Anatolia's oldest protective herbs. Romans called her 'the eye-opening weed'; legend says even Leonardo drank rue tea.",
    },
    producerIds: [],
  },
  {
    id: "ihlamur",
    name: { tr: "Ihlamur", en: "Linden" },
    scientific: "Tilia tomentosa",
    image: "/universe/plants/ihlamur.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "marmara",
    moods: ["sleep", "heart", "cleansing", "grounding"],
    intent: "calm",
    nutrition: {
      tr: "Müsilaj, flavonoidler, C vitamini, kuersetin; doğal yatıştırıcı, hafif terlemenin balı.",
      en: "Mucilage, flavonoids, vitamin C, quercetin; a gentle sedative, the honey of light perspiration.",
    },
    healing: {
      tr: "Üç yüz doksan altı hertzte titreşir — ilk sıcaklığın geri verildiği frekans. Soğuk algınlığı, anksiyete, uyku.",
      en: "At three hundred ninety-six hertz — the frequency where first warmth is returned. Cold, anxiety, sleep.",
    },
    poetic: {
      tr: "Ihlamur, bir teyzeyim; nezleyle gelen ziyaretçiyi avucumda ısıtırım, sözcük kullanmadan.",
      en: "I am linden, an aunt; I warm the visitor who arrives with a cold in my palm — no words.",
    },
    ritual: {
      tr: "Bir avuç kuru ıhlamur. 90 derece su (kaynar değil). Üç dakika bekle. Buharı gözlerine doğru çek.",
      en: "A handful of dried linden. 90-degree water (not boiling). Wait three minutes. Draw the steam toward your eyes.",
    },
    mythology: {
      tr: "İstanbul'un eski sokaklarında: 'Ihlamur Kasrı', 'Ihlamur Caddesi'. Ağaç ki kokusunu binaya verir.",
      en: "In Istanbul's old streets: 'Linden Pavilion', 'Linden Avenue'. A tree that lends her scent to a building.",
    },
    producerIds: [],
  },
  {
    id: "papatya",
    name: { tr: "Papatya", en: "Chamomile" },
    scientific: "Matricaria chamomilla",
    image: "/universe/plants/papatya.png",
    frequency: 432,
    solfeggioMatch: 417,
    region: "ic-anadolu",
    moods: ["sleep", "heart", "cleansing", "grounding"],
    intent: "calm",
    nutrition: {
      tr: "Kamazulen, bisabolol, apigenin (yatıştırıcı flavonoid); cilt için anti-enflamatuvar.",
      en: "Chamazulene, bisabolol, apigenin (a calming flavonoid); anti-inflammatory for skin.",
    },
    healing: {
      tr: "Dört yüz otuz iki hertzte titreşir — toprağın anne sesinin frekansı. Mide, uyku, çocuk ateşi, cilt.",
      en: "At four hundred thirty-two hertz — the frequency of the soil's mother voice. Stomach, sleep, child fever, skin.",
    },
    poetic: {
      tr: "Papatya, sade beyaz bir cümledir; bir gözyaşı kadar küçük, bir uyku kadar büyük.",
      en: "Chamomile is a plain white sentence; small as one tear, vast as one sleep.",
    },
    ritual: {
      tr: "Yatağa girmeden bir bardak. Üç koklama, bir yudum. Gözlerini kapatma — kapanır.",
      en: "One cup before bed. Three smells, one sip. Don't close your eyes — they close themselves.",
    },
    mythology: {
      tr: "Latince 'matricaria' — anne demektir. Eski Mısır'da güneş tanrısına adanmış. Anadolu'da 'her derde devalı'.",
      en: "Latin 'matricaria' — mother. Dedicated to the sun god in ancient Egypt. In Anatolia: 'a remedy for every ill'.",
    },
    producerIds: [],
  },
  {
    id: "hanimeli",
    name: { tr: "Hanımeli", en: "Honeysuckle" },
    scientific: "Lonicera japonica",
    image: "/universe/plants/hanimeli.png",
    frequency: 639,
    solfeggioMatch: 639,
    region: "marmara",
    moods: ["heart", "joy", "awakening"],
    intent: "love",
    nutrition: {
      tr: "Çiçek özü: flavonoidler, klorojenik asit, antiviral bileşikler; geleneksel Çin tıbbı çayı.",
      en: "Flower extract: flavonoids, chlorogenic acid, antiviral compounds; a tea in traditional Chinese medicine.",
    },
    healing: {
      tr: "Altı yüz otuz dokuz hertzte titreşir — gece açan kalbin frekansı. Boğaz, soğuk, romantik kapanma.",
      en: "At six hundred thirty-nine hertz — the frequency of the heart that opens at night. Throat, cold, the romantic shutdown.",
    },
    poetic: {
      tr: "Hanımeli, gecenin parfümüdür; gündüz görünmez, akşam balkonunda ansızın seni öpmek için bekler.",
      en: "Honeysuckle is the night's perfume; invisible by day, she waits on your balcony to kiss you suddenly at dusk.",
    },
    ritual: {
      tr: "Akşam serinliğinde bir hanımeli yanında dur. Yutkunma, sadece kokunun seni iki saniye terk etmesine izin ver.",
      en: "Stand beside a honeysuckle in the evening cool. Don't swallow — let the scent leave you for two seconds.",
    },
    mythology: {
      tr: "Bizans bahçelerinin en sık duvar bitkisi. Halk söylencesi: 'Hanımelinin koktuğu evde, kavga uzun sürmez.'",
      en: "The most common wall plant of Byzantine gardens. Folk says: 'Where honeysuckle smells, no quarrel lasts long.'",
    },
    producerIds: [],
  },
  {
    id: "yabani-lale",
    name: { tr: "Yabani Lale", en: "Wild Tulip" },
    scientific: "Tulipa armena",
    image: "/universe/plants/yabanilale.png",
    frequency: 639,
    solfeggioMatch: 639,
    region: "dogu-anadolu",
    moods: ["heart", "joy", "clarity"],
    intent: "love",
    nutrition: {
      tr: "Soğanı bazı türlerde geleneksel tıpta kullanılmış; yenilen bir bitki değil — bakılan bir armağandır.",
      en: "The bulb is used in folk medicine in some species; not eaten — a gift to be looked at.",
    },
    healing: {
      tr: "Altı yüz otuz dokuz hertzte titreşir — sade güzelliğin frekansı. Estetik şifa, kalp açılımı, hafıza.",
      en: "At six hundred thirty-nine hertz — the frequency of plain beauty. Aesthetic healing, heart opening, memory.",
    },
    poetic: {
      tr: "Yabani lale, Lalezar'ın atasıdır; bahçede tutsak olmayan, yamaçta özgür açan bir kraliçe.",
      en: "The wild tulip is the ancestor of Lalezar; a queen who does not stay captive in gardens but blooms free on a slope.",
    },
    ritual: {
      tr: "Bir yamaçta bir yabani laleyi gör. Bir resim çek — toplama. Ondan ne öğrendiğini sonra yaz.",
      en: "See a wild tulip on a slope. Take a photo — don't pick. Write down what she taught you, later.",
    },
    mythology: {
      tr: "Lale Anadolu'dan Hollanda'ya 16. yy'da gitti. 'Tulipa' adı Türkçe 'tülbent'ten — sarık. Bütün Avrupa lalesi Anadolu'dan.",
      en: "The tulip went from Anatolia to Holland in the 16th century. 'Tulipa' comes from Turkish 'tülbent' — turban. All of Europe's tulips are from Anatolia.",
    },
    producerIds: [],
  },
  {
    id: "cinar",
    name: { tr: "Çınar", en: "Plane Tree" },
    scientific: "Platanus orientalis",
    image: "/universe/plants/cinar.png",
    frequency: 174,
    solfeggioMatch: 396,
    region: "marmara",
    moods: ["grounding", "clarity", "cleansing"],
    intent: "calm",
    nutrition: {
      tr: "Geleneksel kullanım: yaprak çayı (anti-enflamatuvar), kabuk (yara), gölge (ruhsal).",
      en: "Traditional use: leaf tea (anti-inflammatory), bark (wound), shade (spiritual).",
    },
    healing: {
      tr: "Yüz yetmiş dört hertzte titreşir — şehir bilgesinin frekansı. Topraklanma, gürültüden korunma, hafıza.",
      en: "At one hundred seventy-four hertz — the frequency of the city's sage. Grounding, sound protection, memory.",
    },
    poetic: {
      tr: "Çınar, şehrin altında nefes alan eski adam; bir saatlik gölgesi otuz yıllık bir çiçeğin sözünden uzun konuşur.",
      en: "The plane is the old man breathing under the city; one hour of his shade speaks longer than thirty years of any flower.",
    },
    ritual: {
      tr: "Bir çınarın altına otur. On nefes. Yapraklar konuşurken — anlama. Sadece duy.",
      en: "Sit under a plane tree. Ten breaths. As leaves speak — don't understand. Just hear.",
    },
    mythology: {
      tr: "İstanbul, Bursa, Manisa — kadim çınarlar. Osmanlı'da bir çınarın altında karar alınırdı; mahkeme, meclis, evlenme.",
      en: "Istanbul, Bursa, Manisa — the ancient planes. In the Ottoman age, decisions were taken under one: court, council, marriage.",
    },
    producerIds: [],
  },
  {
    id: "kavak",
    name: { tr: "Kavak", en: "Poplar" },
    scientific: "Populus alba",
    image: "/universe/plants/kavak.png",
    frequency: 285,
    solfeggioMatch: 396,
    region: "ic-anadolu",
    moods: ["clarity", "awakening", "cleansing"],
    intent: "clarity",
    nutrition: {
      tr: "Tomurcuğunda salisin (aspirin atası); kabuk: tanen ve flavonoid; geleneksel mizaç düşürücü.",
      en: "Buds carry salicin (the ancestor of aspirin); bark: tannin and flavonoid; traditional fever reducer.",
    },
    healing: {
      tr: "İki yüz seksen beş hertzte titreşir — ince yaprağın titrediği frekans. Doku onarımı, ateş, sızı.",
      en: "At two hundred eighty-five hertz — the frequency of the thin trembling leaf. Tissue repair, fever, ache.",
    },
    poetic: {
      tr: "Kavak, yola serili bir mektubum; her yaprak bir kelime, ve rüzgârla okunur.",
      en: "I am the poplar, a letter laid along the road; each leaf a word, read by the wind.",
    },
    ritual: {
      tr: "Bir kavak yolunda yürü. Sesini duy — yapraklar el çırpıyor. Yola olan minneti hatırla.",
      en: "Walk a poplar avenue. Hear it — the leaves applaud. Remember your gratitude to the road.",
    },
    mythology: {
      tr: "Anadolu yollarının ağacı; 'kavak gibi uzamak' deyimi — hızlı büyüyen ama sabit duramayan. Söğüt akrabası.",
      en: "The tree of Anatolian roads; the saying 'grown like a poplar' — fast-growing yet unable to stand still. A relative of the willow.",
    },
    producerIds: [],
  },

  /* ──────────────────────────────────────────────────
     ANATOLIAN HEIRLOOM CANON — Phase 2.7
     Mandarin, strawberry and the great heirloom
     vegetables of Anatolia. Each one is a "ata tohum"
     (ancestor seed) — a memory the soil refuses to lose.
     ────────────────────────────────────────────────── */

  {
    id: "mandalina",
    name: { tr: "Mandalina", en: "Mandarin" },
    scientific: "Citrus reticulata",
    image: "/universe/plants/mandalina.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "akdeniz",
    moods: ["joy", "awakening", "heart"],
    intent: "love",
    nutrition: {
      tr: "C vitamini, beta-kriptoksantin, hesperidin; kabukta limonen — kapiler dolaşımın küçük şampanyası.",
      en: "Vitamin C, beta-cryptoxanthin, hesperidin; limonene in the peel — a small champagne for the capillaries.",
    },
    healing: {
      tr: "Bağışıklık, zihin temizliği, kış melankolisinin üstündeki ışık; kabuk yağı solunumu açar.",
      en: "Immunity, mental clearing, light over winter melancholy; peel oil opens the breath.",
    },
    poetic: {
      tr: "Mandalina, Akdeniz'in çocukluk kokulu küçük güneşidir; kabuğunu soyduğunda hava bayram olur.",
      en: "The mandarin is the small, childhood-scented sun of the Mediterranean; when you peel it the air becomes a feast.",
    },
    ritual: {
      tr: "Sabah bir mandalinayı dilimleme — kabuğunun kokusunu önce avucuna sür, sonra göğsüne. Üç nefes.",
      en: "Morning, peel a mandarin slowly — rub the peel's scent first into your palm, then your chest. Three breaths.",
    },
    mythology: {
      tr: "Çin'den İpek Yolu üzerinden Akdeniz'e; Bodrum, Finike ve Mersin bahçelerinde 'Satsuma' ve 'Klemantin' isimleriyle Anadolu kabuğuna girdi.",
      en: "From China along the Silk Road to the Mediterranean; in the gardens of Bodrum, Finike and Mersin it entered Anatolia as 'Satsuma' and 'Clementine'.",
    },
    producerIds: [],
  },

  {
    id: "cilek",
    name: { tr: "Çilek", en: "Strawberry" },
    scientific: "Fragaria × ananassa",
    image: "/universe/plants/cilek.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ic-anadolu",
    moods: ["heart", "joy", "awakening"],
    intent: "love",
    nutrition: {
      tr: "Antosiyanin, ellajik asit, C vitamini, mangan; kalp dostu küçük yumruk antioksidan.",
      en: "Anthocyanin, ellagic acid, vitamin C, manganese; a small heart-friendly antioxidant fist.",
    },
    healing: {
      tr: "Kalp ve damar dengesi, kapiler sağlık, cilt parlaklığı; iltihaba sessizce hayır der.",
      en: "Heart-vessel balance, capillary health, skin glow; quietly says no to inflammation.",
    },
    poetic: {
      tr: "Çilek, ilk yaz kalbidir — toprağın sevincini kırmızı bir hece olarak teline asar.",
      en: "Strawberry is the heart of early summer — it hangs the soil's joy on its stem as one red syllable.",
    },
    ritual: {
      tr: "Üç çileği sabah çıplak ayakla yer iken yavaşça çiğne; her ısırıkta 'sevinmek de bir bilgeliktir' de.",
      en: "Eat three strawberries barefoot in the morning, slowly; with each bite say 'joy is also a wisdom'.",
    },
    mythology: {
      tr: "Aksaray, Mersin Silifke ve Aydın Sultanhisar bahçelerinde ata tohum çilek — küçük tane, yoğun koku — modern hibritlerin unuttuğu lezzetin saklayıcısıdır.",
      en: "In the gardens of Aksaray, Silifke and Sultanhisar the heirloom strawberry — small berry, dense aroma — guards the flavour modern hybrids forgot.",
    },
    producerIds: [],
  },

  {
    id: "domates",
    name: { tr: "Niğde Domatesi", en: "Niğde Heirloom Tomato" },
    scientific: "Solanum lycopersicum",
    image: "/universe/plants/domates.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ic-anadolu",
    moods: ["heart", "grounding", "joy"],
    intent: "power",
    nutrition: {
      tr: "Likopen, potasyum, C ve K vitaminleri; pişince serbest kalan kalp koruyucu kırmızılık.",
      en: "Lycopene, potassium, vitamins C and K; the heart-protecting redness released by cooking.",
    },
    healing: {
      tr: "Kalp damarı, prostat, cilt; güneşin kasası olan domates, pişince ilaca dönüşür.",
      en: "Heart vessels, prostate, skin; the tomato is a vault of sun that becomes medicine when cooked.",
    },
    poetic: {
      tr: "Niğde domatesi, yaz akşamlarının kırmızı dilidir — bir dilim ekmeğin üstünde toprak konuşmaya başlar.",
      en: "Niğde's heirloom tomato is the red tongue of summer evenings — on a slice of bread the soil begins to speak.",
    },
    ritual: {
      tr: "Bir domatesi dilimle, üzerine bir tutam tuz, bir damla zeytinyağı, bir yaprak fesleğen; bahçeyi ağzına davet et.",
      en: "Slice a tomato, add a pinch of salt, one drop of olive oil, one basil leaf; invite the garden into your mouth.",
    },
    mythology: {
      tr: "16. yüzyılda Yeni Dünya'dan İstanbul mutfağına; Niğde, Manisa ve Antalya kasaba pazarlarında ata tohum çeşitleri — 'frenk patlıcanı' ismiyle Anadolu'ya kavruldu.",
      en: "From the New World to Istanbul kitchens in the 16th century; the heirloom strains of Niğde, Manisa and Antalya — once called 'Frankish eggplant' — were tempered into Anatolia.",
    },
    producerIds: [],
  },

  {
    id: "maras-biberi",
    name: { tr: "Maraş Biberi", en: "Maraş Pepper" },
    scientific: "Capsicum annuum 'Maraş'",
    image: "/universe/plants/marasbiberi.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "guneydogu",
    moods: ["awakening", "grounding", "cleansing"],
    intent: "power",
    nutrition: {
      tr: "Kapsaisin, A ve C vitaminleri, demir; metabolizmanın yavaş yanan ocağı.",
      en: "Capsaicin, vitamins A and C, iron; the slow-burning hearth of the metabolism.",
    },
    healing: {
      tr: "Dolaşımı açar, sindirimi başlatır, soğuk algınlığında ateşin küçük bir habercisidir.",
      en: "Opens circulation, kindles digestion, a small herald of fire in the cold season.",
    },
    poetic: {
      tr: "Maraş biberi, taşın üstünde kuruyan güneştir; bir tutamı aldığında dağ ağzına gelir.",
      en: "The Maraş pepper is sunlight drying on stone; one pinch and the mountain enters your mouth.",
    },
    ritual: {
      tr: "Bir kâse mercimek çorbasına bir tutam Maraş biberi serp, bir damla nar ekşisi düşür; göğsünün ısındığını fark et.",
      en: "Sprinkle a pinch of Maraş pepper into lentil soup, drop one drop of pomegranate molasses; notice your chest grow warm.",
    },
    mythology: {
      tr: "Maraş'ın taş ocaklarında geleneksel iki aşamalı kurutma — önce güneş, sonra zeytinyağıyla yağlama — biberi yakmadan ısıtmanın sırrıdır.",
      en: "Maraş's traditional two-stage drying — first sun, then a coat of olive oil — is the secret of warming a pepper without burning it.",
    },
    producerIds: [],
  },

  {
    id: "urfa-isot",
    name: { tr: "Urfa İsot", en: "Urfa Isot Pepper" },
    scientific: "Capsicum annuum 'İsot'",
    image: "/universe/plants/urfaisot.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "guneydogu",
    moods: ["grounding", "awakening", "clarity"],
    intent: "power",
    nutrition: {
      tr: "Kapsaisin, kuersetin, A ve C vitaminleri; gece kurutulduğu için tatlımsı umami bir derinlik kazanır.",
      en: "Capsaicin, quercetin, vitamins A and C; night-dried, it gains a sweet, umami depth.",
    },
    healing: {
      tr: "Soğuk hafızayı söker, kan dolaşımını sıcak tutar, depresyonun üstüne bir gece lambası gibi düşer.",
      en: "Pries open cold memory, keeps the blood warm, falls upon depression like a small night lamp.",
    },
    poetic: {
      tr: "Urfa isotu, Mezopotamya'nın koyu, sabırlı sıcağıdır — bir tutamla taş ocağı çiğ köfteye düşer.",
      en: "Urfa isot is the dark, patient heat of Mesopotamia — a pinch lets the stone quarry fall into çiğ köfte.",
    },
    ritual: {
      tr: "Bir avuç çiğ köftenin yoğurma anına bir kaşık isot ekle. Yoğururken doğunun toprağını kabul et.",
      en: "Add one spoon of isot to the kneading of a handful of çiğ köfte. As you knead, accept the soil of the East.",
    },
    mythology: {
      tr: "Urfa pazarlarında isot, gündüz güneşinde olgunlaşır, gece kurutulur — bu yüzden kahverengi-mor rengini ve şehir efsanelerini birlikte taşır.",
      en: "In Urfa's markets isot ripens by day and dries by night — that is why it carries both its purple-brown colour and its city's legends.",
    },
    producerIds: [],
  },

  {
    id: "patlican",
    name: { tr: "Kemer Patlıcanı", en: "Kemer Heirloom Eggplant" },
    scientific: "Solanum melongena",
    image: "/universe/plants/patlican.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "akdeniz",
    moods: ["grounding", "cleansing", "heart"],
    intent: "calm",
    nutrition: {
      tr: "Nasunin, klorojenik asit, lif, potasyum; mor kabuğun beyin koruyucu pigmenti.",
      en: "Nasunin, chlorogenic acid, fibre, potassium; the brain-guarding pigment of the purple skin.",
    },
    healing: {
      tr: "Kalp ve kolesterol dengesi, kan şekeri stabilizasyonu; köz ateşinde güneşin tatlı duman ilacı.",
      en: "Heart-cholesterol balance, blood-sugar stability; over coals, the sun's sweet smoke medicine.",
    },
    poetic: {
      tr: "Patlıcan, mor bir yumruk gibi olgunlaşır — ateşi gördüğünde sessizleşir ve tatlanır.",
      en: "The eggplant ripens like a purple fist — once it meets fire, it grows quiet and sweet.",
    },
    ritual: {
      tr: "Bir patlıcanı doğrudan ateşte közle. Soyarken güneşin bedenden çıkışını izle. Yoğurt ve sarımsakla buluştur.",
      en: "Char an eggplant directly over flame. As you peel it, watch the sun leave its body. Marry it to yoghurt and garlic.",
    },
    mythology: {
      tr: "Antalya Kemer ve Demre'nin köy bahçelerinde 'kabaklı', 'topan' ve 'beyaz' ata tohum çeşitleri; 'imam bayıldı' isminin Osmanlı mutfağına armağanı.",
      en: "In the village gardens of Kemer and Demre — the heirloom 'kabaklı', 'topan' and 'beyaz' strains; the gift behind the Ottoman dish 'imam bayıldı'.",
    },
    producerIds: [],
  },

  {
    id: "amasya-sogani",
    name: { tr: "Amasya Soğanı", en: "Amasya Onion" },
    scientific: "Allium cepa 'Amasya'",
    image: "/universe/plants/amasyasogani.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "karadeniz",
    moods: ["cleansing", "grounding"],
    intent: "calm",
    nutrition: {
      tr: "Kuersetin, allisin, sülfürlü bileşikler, B6; göz yaşının altında saklı ilaç.",
      en: "Quercetin, allicin, sulphur compounds, B6; the medicine hidden beneath the tear.",
    },
    healing: {
      tr: "Bağışıklık, antibakteriyel taban, bronşit ve öksürüğün eski reçetesi; kan şekeri dengesi.",
      en: "Immunity, antibacterial floor, an old prescription against bronchitis and cough; blood-sugar balance.",
    },
    poetic: {
      tr: "Amasya soğanı, elma kuzeniyle aynı toprağı paylaşır — acı tatlı bir hatırlama gibi.",
      en: "The Amasya onion shares its soil with the apple, its cousin — a remembering, both bitter and sweet.",
    },
    ritual: {
      tr: "Bir soğanı çiğ doğra, üzerine sumak ve zeytinyağı; ekmeğin yanında bir lokmada toprağı kabul et.",
      en: "Slice an onion raw, top with sumac and olive oil; alongside bread, accept the soil in one bite.",
    },
    mythology: {
      tr: "Halk hekimliğinde 'soğan suyu' öksürüğün ilk reçetesidir; Lokman Hekim'in dahi açıklayamadığı şifa, mutfakta saklıdır.",
      en: "In folk medicine 'onion juice' is the first prescription for cough; the healing even Hekim Lokman could not explain hides in the kitchen.",
    },
    producerIds: [],
  },

  {
    id: "taskopru-sarimsagi",
    name: { tr: "Taşköprü Sarımsağı", en: "Taşköprü Garlic" },
    scientific: "Allium sativum 'Taşköprü'",
    image: "/universe/plants/taskopru-sarimsagi.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "karadeniz",
    moods: ["cleansing", "grounding", "awakening"],
    intent: "power",
    nutrition: {
      tr: "Allisin, selenyum, B6, mangan; coğrafi işaretli yüksek allisin oranı — Türkiye'nin en güçlü beyaz ateşi.",
      en: "Allicin, selenium, B6, manganese; geographically protected for its high allicin — Turkey's strongest white fire.",
    },
    healing: {
      tr: "Bağışıklık, kalp damarı, kan basıncı, doğal antibiyotik; soğuk algınlığının kemiğine değer.",
      en: "Immunity, heart vessels, blood pressure, a natural antibiotic; reaches the bone of a cold.",
    },
    poetic: {
      tr: "Taşköprü sarımsağı, Kastamonu dağlarının beyaz ateşidir — bir dişi sabah çiğnenince gün başka türlü açılır.",
      en: "Taşköprü garlic is the white fire of the Kastamonu mountains — chew one clove in the morning and the day opens differently.",
    },
    ritual: {
      tr: "Sabah bir diş çiğ sarımsak, bir kaşık zeytinyağı, bir damla limon; mide kapısını yumuşakça aç.",
      en: "In the morning, one clove of raw garlic, one spoon of olive oil, one drop of lemon; open the gate of the stomach gently.",
    },
    mythology: {
      tr: "Hipokrat'ın reçetesinden Pir Sultan'ın bahçesine; Taşköprü, 1500 yıldır beyaz dişlerini Karadeniz'e veriyor.",
      en: "From Hippocrates' prescription to the garden of Pir Sultan; Taşköprü has given its white cloves to the Black Sea for 1,500 years.",
    },
    producerIds: [],
  },

  {
    id: "bal-kabagi",
    name: { tr: "Bal Kabağı", en: "Honey Pumpkin" },
    scientific: "Cucurbita moschata",
    image: "/universe/plants/balkabagi.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ic-anadolu",
    moods: ["grounding", "heart", "joy"],
    intent: "love",
    nutrition: {
      tr: "Beta-karoten, lif, magnezyum, çinko; çekirdeğinde uyku öncesi triptofan.",
      en: "Beta-carotene, fibre, magnesium, zinc; tryptophan in its seed for the threshold of sleep.",
    },
    healing: {
      tr: "Göz, deri, prostat, sindirim; soğuk gece için bir kase tatlı yatıştırıcı.",
      en: "Eyes, skin, prostate, digestion; one bowl of sweet calm for a cold night.",
    },
    poetic: {
      tr: "Bal kabağı, sonbaharın altın kralıdır — bir dilimi pişince mutfak güneşle dolar.",
      en: "The honey pumpkin is the gold king of autumn — one slice in the oven and the kitchen fills with sun.",
    },
    ritual: {
      tr: "Bal kabağını kalın dilimle, fırında közle, üstüne tahin ve bir tutam tarçın; soğuk akşamı tatlandır.",
      en: "Cut the pumpkin thick, roast it, top with tahini and a pinch of cinnamon; sweeten the cold evening.",
    },
    mythology: {
      tr: "İç Anadolu hasat şenliklerinin merkezi; çekirdekleri ata tohum olarak nesilden nesile bezelerin içinde saklanır.",
      en: "The centre of Central Anatolia's harvest festivals; its seeds, kept as ata tohum, are passed down inside cloth pouches across generations.",
    },
    producerIds: [],
  },

  {
    id: "mor-havuc",
    name: { tr: "Mor Havuç", en: "Purple Carrot" },
    scientific: "Daucus carota subsp. sativus var. atrorubens",
    image: "/universe/plants/mor-havuc.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "ic-anadolu",
    moods: ["grounding", "cleansing", "clarity"],
    intent: "calm",
    nutrition: {
      tr: "Antosiyanin, beta-karoten, lif, polifenoller; bağırsak florasını besleyen mor kralın iksiri.",
      en: "Anthocyanin, beta-carotene, fibre, polyphenols; the purple king's elixir for gut flora.",
    },
    healing: {
      tr: "Bağışıklık, antioksidan, kan basıncı; ferment edildiğinde şalgam suyu olarak kanı temizler.",
      en: "Immunity, antioxidant, blood pressure; fermented into şalgam, it cleanses the blood.",
    },
    poetic: {
      tr: "Mor havuç, Anadolu'nun unutulmuş kraliçesidir — turuncusu modern, moru kadim.",
      en: "The purple carrot is Anatolia's forgotten queen — orange is modern, purple is ancient.",
    },
    ritual: {
      tr: "Bir bardak şalgam suyunu yavaşça iç. Her yudumda kadim toprağa bir 'merhaba' fısılda.",
      en: "Drink a glass of şalgam slowly. With each sip, whisper a 'hello' to the ancient soil.",
    },
    mythology: {
      tr: "Konya, Ereğli ve Niğde'nin ata tohum havuçları; turuncu hibritten önce dünyanın havuçları mor, sarı ve beyazdı.",
      en: "The heirloom carrots of Konya, Ereğli and Niğde; before the orange hybrid, the world's carrots were purple, yellow and white.",
    },
    producerIds: [],
  },

  {
    id: "diyarbakir-karpuzu",
    name: { tr: "Diyarbakır Karpuzu", en: "Diyarbakır Watermelon" },
    scientific: "Citrullus lanatus 'Diyarbakır'",
    image: "/universe/plants/diyarbakir-karpuzu.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "guneydogu",
    moods: ["joy", "awakening", "heart"],
    intent: "love",
    nutrition: {
      tr: "Likopen, sitrülin, %92 su, magnezyum, B6; yaz sıcağında kalbin ve kasın yıkayıcısı.",
      en: "Lycopene, citrulline, 92% water, magnesium, B6; the washer of heart and muscle in summer heat.",
    },
    healing: {
      tr: "Hidrasyon, kalp damarı, kas onarımı, böbrek; sıcağın damarlardaki gerginliğini söker.",
      en: "Hydration, heart vessels, muscle repair, kidneys; loosens the tension of heat in the veins.",
    },
    poetic: {
      tr: "Diyarbakır karpuzu, Dicle'nin sıcak çocuğudur — ay büyüklüğünde, bazalt taşların altında olgunlaşır.",
      en: "The Diyarbakır watermelon is the warm child of the Tigris — moon-sized, ripening beneath basalt stones.",
    },
    ritual: {
      tr: "Bir dilim karpuzu yavaşça ye, çekirdeğini avuçta tut. 'Yaz da bir tövbe gibi gelir' de.",
      en: "Eat a slice of watermelon slowly, cup the seeds in your palm. Say 'summer too arrives like an absolution'.",
    },
    mythology: {
      tr: "Diyarbakır karpuzu yarışmaları 17. yüzyıldan beri sürer; bir karpuzun bir adamı yere serdiği halk hikâyeleri Mezopotamya'nın gururudur.",
      en: "Diyarbakır's watermelon contests have run since the 17th century; the folk tales of a watermelon flooring a man are Mesopotamia's pride.",
    },
    producerIds: [],
  },

  {
    id: "kirkagac-kavunu",
    name: { tr: "Kırkağaç Kavunu", en: "Kırkağaç Melon" },
    scientific: "Cucumis melo 'Kırkağaç'",
    image: "/universe/plants/kavun.png",
    frequency: 639,
    solfeggioMatch: 639,
    region: "ege",
    moods: ["heart", "joy", "sleep"],
    intent: "love",
    nutrition: {
      tr: "A vitamini, C vitamini, potasyum, %90 su; iliği serinleten yumuşak elektrolit.",
      en: "Vitamin A, vitamin C, potassium, 90% water; a soft electrolyte that cools the marrow.",
    },
    healing: {
      tr: "Hidrasyon, böbrek, ödem; akşamüstü yorgunluğun üzerine düşen bal rengi sessizlik.",
      en: "Hydration, kidneys, oedema; honey-coloured stillness falling upon late-afternoon fatigue.",
    },
    poetic: {
      tr: "Kırkağaç kavunu, Manisa'nın altın aşkıdır — bir dilimi açtığında oda bal kokar.",
      en: "The Kırkağaç melon is Manisa's golden love — open one slice and the room smells of honey.",
    },
    ritual: {
      tr: "Akşamüstü bir dilim kavunu beyaz peynirle birlikte ye; iki uzak dostun aynı tabakta buluştuğunu fark et.",
      en: "Late afternoon, eat a slice of melon with white cheese; notice two distant friends meeting on one plate.",
    },
    mythology: {
      tr: "Manisa Kırkağaç ovalarında ata tohum kavun — koyu yeşil dilimli kabuk, sarı et — Osmanlı sarayına gönderilen kavun kraliçesidir.",
      en: "In the plains of Manisa Kırkağaç the heirloom melon — dark green ribbed skin, yellow flesh — was the queen sent to the Ottoman palace.",
    },
    producerIds: [],
  },

  {
    id: "aksehir-bamyasi",
    name: { tr: "Akşehir Bamyası", en: "Akşehir Okra" },
    scientific: "Abelmoschus esculentus 'Akşehir'",
    image: "/universe/plants/aksehirbamyasi.png",
    frequency: 417,
    solfeggioMatch: 417,
    region: "ic-anadolu",
    moods: ["grounding", "heart", "cleansing"],
    intent: "calm",
    nutrition: {
      tr: "Lif, folat, K vitamini, magnezyum; müsilajı ile sindirim sistemini ipekleştirir.",
      en: "Fibre, folate, vitamin K, magnesium; its mucilage silks the digestive tract.",
    },
    healing: {
      tr: "Sindirim, kan şekeri, kolesterol; mide mukozasının dostu, antik bir prebiyotik.",
      en: "Digestion, blood sugar, cholesterol; friend of the gastric mucosa, an ancient prebiotic.",
    },
    poetic: {
      tr: "Akşehir bamyası, ipsi bir yıldızdır — küçüklüğünde toprak ona en sabırlı dilini öğretir.",
      en: "Akşehir's okra is a thread-fine star — in its smallness the soil teaches it its most patient tongue.",
    },
    ritual: {
      tr: "Bir avuç kuru bamyayı kuzu çorbasına at. Pişerken 'küçük olanın sabrı vardır' de.",
      en: "Drop a handful of dried okra into a lamb broth. As it simmers, say 'the small carry their own patience'.",
    },
    mythology: {
      tr: "Nasreddin Hoca'nın yurdu Akşehir'in ata tohum bamyası — ipe dizilip kurutulur, bir avuç yaz, bir kazan kış olur.",
      en: "Nasreddin Hoca's homeland of Akşehir holds the heirloom okra — strung and sun-dried, one handful of summer becomes a cauldron of winter.",
    },
    producerIds: [],
  },

  {
    id: "mardin-nohudu",
    name: { tr: "Mardin Nohudu", en: "Mardin Chickpea" },
    scientific: "Cicer arietinum 'Mardin'",
    image: "/universe/plants/mardinnohutu.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "guneydogu",
    moods: ["grounding", "focus"],
    intent: "power",
    nutrition: {
      tr: "Bitkisel protein, lif, mangan, folat, demir; tahılla buluşunca tam protein olur.",
      en: "Plant protein, fibre, manganese, folate, iron; meeting grain, it becomes a complete protein.",
    },
    healing: {
      tr: "Kan şekeri stabilizasyonu, kemik, bağırsak; sabırlı bir tokluk veren küçük güneş.",
      en: "Blood-sugar stability, bone, gut; a small sun granting a patient fullness.",
    },
    poetic: {
      tr: "Mardin nohudu, Mezopotamya'nın taş tohumudur — yedi bin yıldır insan onu pişirip kendisine ekmek arkadaşı yapıyor.",
      en: "The Mardin chickpea is the stone seed of Mesopotamia — for seven thousand years humans have cooked it as a friend to bread.",
    },
    ritual: {
      tr: "Bir avuç leblebiyi yavaşça çiğne; her tane için bir hatırlama. Kadim toprağı dişle.",
      en: "Chew a handful of roasted chickpeas slowly; one remembrance for each grain. Bite into ancient soil.",
    },
    mythology: {
      tr: "Çatalhöyük tabakalarında bulunan nohut tohumları, 9000 yıllık ekmek arkadaşının sessiz tanıklarıdır.",
      en: "Chickpea seeds found in the layers of Çatalhöyük are the silent witnesses of a 9,000-year-old friend of bread.",
    },
    producerIds: [],
  },

  {
    id: "yesil-mercimek",
    name: { tr: "Yeşil Mercimek", en: "Green Lentil" },
    scientific: "Lens culinaris",
    image: "/universe/plants/yesilmercimek.png",
    frequency: 396,
    solfeggioMatch: 396,
    region: "dogu-anadolu",
    moods: ["grounding", "focus", "cleansing"],
    intent: "power",
    nutrition: {
      tr: "Yüksek protein, demir, folat, magnezyum, lif; toprağın yeşil pillerinden biri.",
      en: "High protein, iron, folate, magnesium, fibre; one of the soil's green batteries.",
    },
    healing: {
      tr: "Kan, kemik, kalp; uzun bir kışın ortasında bedeni tekrar zemine bağlar.",
      en: "Blood, bone, heart; in the middle of a long winter it ties the body to the ground again.",
    },
    poetic: {
      tr: "Yeşil mercimek, toprağın yıldızlarıdır — bir tas çorbada gece tabağa iner.",
      en: "The green lentil is the soil's stars — in one bowl of soup the night descends into the plate.",
    },
    ritual: {
      tr: "Akşam bir kâse mercimek çorbası iç. Buharın yüze değdiği o ilk anı hatırlamak için yavaşla.",
      en: "Drink one bowl of lentil soup at evening. Slow down for that first moment when the steam touches your face.",
    },
    mythology: {
      tr: "Tevrat'ta Esau'nun çorbası, Anadolu'da düğün tabağı; mercimek, 8000 yıldır insanın yanından ayrılmayan tohumdur.",
      en: "Esau's pottage in scripture, the wedding plate in Anatolia; the lentil has not left humanity's side for eight thousand years.",
    },
    producerIds: [],
  },

  /* ─────────────────────────────────────────────
     Faz 2.8 · Tamamlayıcı Görsel Kanonu
     (kullanıcı-üretim görsellerine bağlı yeni bitkiler)
     ───────────────────────────────────────────── */

  {
    id: "cigdem",
    name: { tr: "Çiğdem", en: "Crocus" },
    scientific: "Crocus chrysanthus",
    image: "/universe/plants/cigdem.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "ic-anadolu",
    moods: ["awakening", "joy", "heart"],
    intent: "love",
    nutrition: {
      tr: "Soğanında nişasta, yapraklarında karotenoidler; kırlarda yaban arıların ilk şekeri.",
      en: "Starch in its corm, carotenoids in its leaves; the first sugar of the wild bee in the meadows.",
    },
    healing: {
      tr: "Geç kışın depresyonuna küçük bir uyandırma; göze ve kalbe sevinç döker.",
      en: "A small awakening against late-winter depression; pours joy into the eye and the heart.",
    },
    poetic: {
      tr: "Çiğdem, henüz kar erimeden toprağı delip gelen ilk haberdir — 'bahar var,' der, kimse henüz inanmazken.",
      en: "The crocus is the first message that pierces the soil before the snow has melted — 'spring exists,' it says, while no one yet believes.",
    },
    ritual: {
      tr: "Mart başında bir tarlaya çık. Bir tek mor çiğdemi dizinin yanına otur, üç dakika konuşmadan bak. Bekleyişe ders ver.",
      en: "Step into a field at the start of March. Sit beside one purple crocus and look at it without speaking for three minutes. Teach a lesson to waiting.",
    },
    mythology: {
      tr: "Anadolu'da çocuklar mart sabahları 'çiğdem pilavı' için tarlalara çıkar; her toplanan soğan, kışın bitişine küçük bir hediyedir.",
      en: "In Anatolia children take to the fields on March mornings for 'crocus pilaf'; every gathered corm is a small gift to the end of winter.",
    },
    producerIds: [],
  },

  {
    id: "limon",
    name: { tr: "Limon", en: "Lemon" },
    scientific: "Citrus limon",
    image: "/universe/plants/limon.png",
    frequency: 741,
    solfeggioMatch: 741,
    region: "akdeniz",
    moods: ["cleansing", "clarity", "awakening"],
    intent: "clarity",
    nutrition: {
      tr: "C vitamini, sitrik asit, limonen, flavonoidler; sabahın sarı uyandırması.",
      en: "Vitamin C, citric acid, limonene, flavonoids; the yellow morning-rouse.",
    },
    healing: {
      tr: "Karaciğer arınması, bağışıklık, sindirim; bulanık bir günü temizleyen ışık parçası.",
      en: "Liver cleansing, immunity, digestion; a shard of light that scrubs a foggy day.",
    },
    poetic: {
      tr: "Limon, Akdeniz'in keskin diliyle hakikati söyler; bir damla suya düşer, su uyanır.",
      en: "The lemon speaks truth with the Mediterranean's sharp tongue; one drop falls into water and the water awakens.",
    },
    ritual: {
      tr: "Sabah bir limonu yarıya kes. Yarısını ılık suya sık, kabuğunu avucunda ovala ve kokusunu içine çek. Üç nefes — gün berrak başlar.",
      en: "Cut a lemon in half in the morning. Squeeze one half into warm water, rub the peel between your palms and inhale. Three breaths — the day begins clear.",
    },
    mythology: {
      tr: "İpek Yolu üzerinden Hindistan'dan Akdeniz'e; Antalya, Mersin ve Hatay bahçelerinde 'meyer', 'lamas' ve 'kıbrıs' adlarıyla Anadolu'nun sarı dilini öğrendi.",
      en: "From India via the Silk Road to the Mediterranean; in the gardens of Antalya, Mersin and Hatay it learned Anatolia's yellow tongue under the names 'Meyer', 'Lamas' and 'Cyprus'.",
    },
    producerIds: [],
  },

  {
    id: "portakal",
    name: { tr: "Portakal", en: "Orange" },
    scientific: "Citrus sinensis",
    image: "/universe/plants/portakal.png",
    frequency: 528,
    solfeggioMatch: 528,
    region: "akdeniz",
    moods: ["joy", "heart", "awakening"],
    intent: "love",
    nutrition: {
      tr: "C vitamini, hesperidin, beta-karoten, folat; kabuk yağında neroli ve linalool.",
      en: "Vitamin C, hesperidin, beta-carotene, folate; neroli and linalool in the peel oil.",
    },
    healing: {
      tr: "Kalp damar, cilt, ruh hali; kış melankolisinin üstüne dökülen toplu güneş.",
      en: "Cardiovascular health, skin, mood; collective sunlight poured onto winter melancholy.",
    },
    poetic: {
      tr: "Portakal, Akdeniz'in göğsündeki yuvarlak kalptir; soyduğunda oda bir bayram olur, tabak bir güneştir.",
      en: "The orange is the round heart upon the chest of the Mediterranean; when you peel it the room becomes a feast, the plate a sun.",
    },
    ritual: {
      tr: "Bir portakalı eline al ve avucunda ısıt. Kabuğunu yavaş yavaş soy — kokusu yayıldıkça üç kez 'iyi geldim' de. Tabağa nazikçe yerleştir.",
      en: "Take an orange in your hand and warm it in your palm. Peel it slowly — as the scent spreads say 'I have arrived gently' three times. Place it on the plate with care.",
    },
    mythology: {
      tr: "Çin'den İpek Yolu üzerinden Pers ve Arap bahçelerine, oradan Akdeniz'e; Finike, Bodrum ve Hatay portakalı, Anadolu'nun ağzındaki sarı şarkıdır.",
      en: "From China via the Silk Road to Persian and Arab gardens, then to the Mediterranean; the orange of Finike, Bodrum and Hatay is the yellow song in Anatolia's mouth.",
    },
    producerIds: [],
  },

  {
    id: "yabanmersini",
    name: { tr: "Yaban Mersini", en: "Wild Bilberry" },
    scientific: "Vaccinium myrtillus",
    image: "/universe/plants/yabanmersini.png",
    frequency: 852,
    solfeggioMatch: 852,
    region: "karadeniz",
    moods: ["clarity", "focus", "heart"],
    intent: "clarity",
    nutrition: {
      tr: "Antosiyaninler, resveratrol, C vitamini, mangan; ormanın mor pili.",
      en: "Anthocyanins, resveratrol, vitamin C, manganese; the forest's purple battery.",
    },
    healing: {
      tr: "Göz, mikrosirkülasyon, hafıza; perdeyi nazikçe aralayan küçük mor lambalar.",
      en: "Eye, microcirculation, memory; small purple lamps that gently part the veil.",
    },
    poetic: {
      tr: "Yaban mersini, Karadeniz'in çam altında saklanan mor sırlarıdır — ağız bir kez tanıdıktan sonra unutmaz.",
      en: "The wild bilberry is the purple secret hidden under the Black Sea pines — once the mouth has known it, it never forgets.",
    },
    ritual: {
      tr: "Bir avuç yaban mersinini yavaşça çiğne. Her tane patladığında bir gözü içeri çevir; üçüncü tanede sezgine bir mesaj sor.",
      en: "Chew a handful of wild bilberries slowly. Each time a berry bursts, turn one eye inward; on the third one, ask your intuition for a message.",
    },
    mythology: {
      tr: "Pontus dağlarında 'likarba' ve 'çalı üzümü' adlarıyla bilinir; Lazlar ve Hemşinliler bu mor tohumu ormandan eve, anneanneden çocuğa taşır.",
      en: "Known in the Pontic mountains as 'likarba' and 'shrub-grape'; the Laz and Hemshin people carry this purple seed from the forest to the house, from grandmother to child.",
    },
    producerIds: [],
  },

  {
    id: "uzum",
    name: { tr: "Üzüm", en: "Grape" },
    scientific: "Vitis vinifera",
    image: "/universe/plants/uzum.png",
    frequency: 639,
    solfeggioMatch: 639,
    region: "marmara",
    moods: ["joy", "heart", "grounding"],
    intent: "love",
    nutrition: {
      tr: "Glikoz, fruktoz, resveratrol, polifenoller, demir, potasyum; bir salkımda iki mevsim.",
      en: "Glucose, fructose, resveratrol, polyphenols, iron, potassium; two seasons in one cluster.",
    },
    healing: {
      tr: "Kalp, dolaşım, kemik iliği; pekmezi kışın anneye, sirkesi mutfağa, hoşafı düğüne yetişir.",
      en: "Heart, circulation, marrow; its molasses tends the mother in winter, its vinegar tends the kitchen, its compote arrives at the wedding.",
    },
    poetic: {
      tr: "Üzüm, asmanın elidir — güneşi salkımda toplar, tabağa kadim bir ışık dağıtır.",
      en: "The grape is the hand of the vine — it gathers the sun into a cluster and scatters an ancient light onto the plate.",
    },
    ritual: {
      tr: "Bir salkım üzümü ortaya koy. Üç tane al, üç tanesine üç dilek emanet et: 'sevgi, sağlık, sabır'. Yedinci tanede konuşma — yalnızca kabuğunu hisset.",
      en: "Place one cluster of grapes at the centre. Take three berries and entrust three wishes — 'love, health, patience'. On the seventh berry do not speak — only feel the skin.",
    },
    mythology: {
      tr: "Kalecik Karası, Öküzgözü, Boğazkere, Sultaniye, Çavuş, Karaerik — Anadolu üzümünün yedi adı, Hattuşa'dan Mürefte'ye uzanan tek bir salkımdır.",
      en: "Kalecik Karası, Öküzgözü, Boğazkere, Sultaniye, Çavuş, Karaerik — the seven names of the Anatolian grape are one cluster reaching from Hattusha to Mürefte.",
    },
    producerIds: [],
  },
];

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

const plantsById = new Map(plants.map((p) => [p.id, p]));
const producersById = new Map(producers.map((p) => [p.id, p]));
const regionsById = new Map(regions.map((r) => [r.id, r]));

export function getPlant(id: string): GaiaPlant | undefined {
  return plantsById.get(id);
}

export function getProducer(id: string): Producer | undefined {
  return producersById.get(id);
}

export function getRegion(id: RegionId): Region | undefined {
  return regionsById.get(id);
}

export function getProducersForPlant(plantId: string): Producer[] {
  const plant = plantsById.get(plantId);
  if (!plant) return [];
  return plant.producerIds
    .map((id) => producersById.get(id))
    .filter((p): p is Producer => Boolean(p));
}

export function getPlantsForProducer(producerId: string): GaiaPlant[] {
  return plants.filter((p) => p.producerIds.includes(producerId));
}

export function getPlantsByMood(mood: Mood): GaiaPlant[] {
  return plants.filter((p) => p.moods.includes(mood));
}

export function getPlantsByIntent(intent: Intent): GaiaPlant[] {
  return plants.filter((p) => p.intent === intent);
}

export function getPlantsByRegion(region: RegionId): GaiaPlant[] {
  return plants.filter((p) => p.region === region);
}

/**
 * Pick the best plant for a given Solfeggio frequency.
 * Used by /onboarding reveal and FrequencyShelf personalization.
 */
export function bestPlantForFrequency(hz: number): GaiaPlant {
  let best = plants[0];
  let bestDist = Math.abs(best.solfeggioMatch - hz);
  for (let i = 1; i < plants.length; i++) {
    const d = Math.abs(plants[i].solfeggioMatch - hz);
    if (d < bestDist) {
      best = plants[i];
      bestDist = d;
    }
  }
  return best;
}

export const MOOD_LABELS: Record<Mood, { tr: string; en: string; symbol: string }> = {
  sleep:     { tr: "Uyku",      en: "Sleep",      symbol: "☾" },
  focus:     { tr: "Odak",      en: "Focus",      symbol: "△" },
  heart:     { tr: "Kalp",      en: "Heart",      symbol: "♡" },
  cleansing: { tr: "Arınma",    en: "Cleansing",  symbol: "✧" },
  awakening: { tr: "Uyanış",    en: "Awakening",  symbol: "✦" },
  clarity:   { tr: "Berraklık", en: "Clarity",    symbol: "◉" },
  grounding: { tr: "Köklenme",  en: "Grounding",  symbol: "▲" },
  joy:       { tr: "Sevinç",    en: "Joy",        symbol: "○" },
};

export const PRODUCER_KIND_LABELS: Record<Producer["kind"], { tr: string; en: string }> = {
  cooperative:   { tr: "Kooperatif",        en: "Cooperative" },
  village:       { tr: "Köy",                en: "Village" },
  "family-farm": { tr: "Aile Çiftliği",      en: "Family Farm" },
  atelier:       { tr: "Atölye",             en: "Atelier" },
};
