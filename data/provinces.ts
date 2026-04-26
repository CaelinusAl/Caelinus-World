/**
 * CAELINUS — Province Atlas
 *
 * 81 Turkish provinces grouped by 7 phytogeographic / cultural regions,
 * each linked to the Caelinus plants (`/data/gaia.ts`) most native to it.
 *
 * Soil / climate / whisper come from the *region* by default; a province
 * may override any field with its own `signature` for a unique voice.
 *
 * The atlas is consumed by `/universe/gaia/atlas` to let the visitor
 * walk the whole country and hear the plants of every land.
 */

import type { GaiaPlant } from "@/data/gaia";

export type ProvinceRegionId =
  | "marmara"
  | "ege"
  | "akdeniz"
  | "ic-anadolu"
  | "karadeniz"
  | "dogu-anadolu"
  | "guneydogu-anadolu";

export type ProvinceRegion = {
  id: ProvinceRegionId;
  name: { tr: string; en: string };
  /** Hex tone used to color the region's provinces. */
  tone: string;
  soil: { tr: string; en: string };
  climate: { tr: string; en: string };
  /** Single-line poetic whisper — used as panel epigraph. */
  whisper: { tr: string; en: string };
  /** Up to 3 plant ids that *are* the region's vocal identity. */
  signaturePlants: string[];
  /** Real geographic landmarks (mountains, rivers, plateaus). */
  landmarks: { tr: string[]; en: string[] };
  /** A second, more detailed climate / micro-climate sentence. */
  microclimate: { tr: string; en: string };
  /** Caelinus philosophy of this soil — the why. */
  philosophy: { tr: string; en: string };
};

export const PROVINCE_REGIONS: ProvinceRegion[] = [
  {
    id: "marmara",
    name: { tr: "Marmara", en: "Marmara" },
    tone: "#9aaa6a",
    soil: {
      tr: "Killi-tınlı alüvyal ovalar, Trakya'nın bereketli düzü ve Uludağ eteklerinin volkanik iç toprağı bir araya gelir.",
      en: "Clay-loam alluvial plains, the fertile Thracian flats meeting the volcanic foothills of Uludağ.",
    },
    climate: {
      tr: "Yumuşak Akdenizleşmiş Karadeniz iklimi — kışları nemli, yazları ılık. İki denizin arası bir geçiş kuşağıdır.",
      en: "A softened, half-Mediterranean climate — humid winters, warm summers. The space between two seas is a corridor.",
    },
    microclimate: {
      tr: "Marmara'nın kıyıları zeytine, Trakya ovaları ayçiçek ve buğdaya, Uludağ'ın yamaçları kestane ve kayına yatakdır.",
      en: "The Marmara coast cradles the olive, Thracian plains grow sunflower and wheat, Uludağ's slopes belong to chestnut and beech.",
    },
    whisper: {
      tr: "İki denizin arasındaki toprak hem çiçek hem buğday ister; geçiş, bereketin başka bir adıdır.",
      en: "The land between two seas wants both blossom and grain — transition is another word for abundance.",
    },
    philosophy: {
      tr: "Marmara'nın hafızası, geçmesini bilenin toprağıdır. Burada her şey kıyıdadır — denizin ve karanın, geçmişin ve gelecek nefesin.",
      en: "Marmara's memory is the soil of those who know how to cross. Everything here lives at an edge — between sea and land, past and incoming breath.",
    },
    signaturePlants: ["zeytin", "kayin", "kestane"],
    landmarks: {
      tr: ["Uludağ", "Marmara Denizi", "Trakya Ovası", "Kaz Dağları"],
      en: ["Mount Uludağ", "Sea of Marmara", "Thrace Plain", "Mount Ida (Kaz Dağları)"],
    },
  },
  {
    id: "ege",
    name: { tr: "Ege", en: "Aegean" },
    tone: "#d4b78a",
    soil: {
      tr: "Tınlı, kireçli, taşlı — Bozdağ ve Aydın Dağları'nın eteklerinde gözenekli, dolayısıyla aroma için ideal.",
      en: "Loamy, calcareous, stony — porous on the slopes of Bozdağlar and the Aydın Mountains, ideal for aromatics.",
    },
    climate: {
      tr: "Yedi ay süren güneş, tuzlu meltem, açık gece. Ege, kokunun mevsim olduğu coğrafyadır.",
      en: "Seven months of sun, salt-laced meltem, transparent nights. The Aegean is the geography where fragrance becomes a season.",
    },
    microclimate: {
      tr: "Sahil zeytin, biberiye ve kekiğe; iç kesim incir, üzüm ve haşhaşa; yüksek yamaçlar adaçayı ve lavantaya açıktır.",
      en: "The coast belongs to olive, rosemary, thyme; the inland to fig, vine and poppy; the higher slopes to sage and lavender.",
    },
    whisper: {
      tr: "Burada toprak güneşi yağa, çiçeği koku akışına, üzümü zamana çevirir.",
      en: "Here the soil turns sun into oil, blossom into fragrance, grape into time.",
    },
    philosophy: {
      tr: "Ege, ışığın yavaş yazıdır. Acele yoktur — kekik bile dağ rüzgârıyla ne zaman olgunlaşacağını yıllarca dinler.",
      en: "The Aegean is the slow handwriting of light. There is no rush — even thyme listens for years to know when to ripen on the wind.",
    },
    signaturePlants: ["zeytin", "incir", "asma"],
    landmarks: {
      tr: ["Bozdağlar", "Bafa Gölü", "Menderes Vadisi", "Kuşadası kıyısı"],
      en: ["Bozdağ Range", "Lake Bafa", "Meander Valley", "Kuşadası coast"],
    },
  },
  {
    id: "akdeniz",
    name: { tr: "Akdeniz", en: "Mediterranean" },
    tone: "#a08aff",
    soil: {
      tr: "Karstik, kireçli, kırmızı terra rossa — Toroslar'ın kalker dudağında zengin taşlı, drene.",
      en: "Karstic, calcareous, red terra rossa — rich, stony and well-drained along the limestone lip of the Taurus.",
    },
    climate: {
      tr: "Sıcak nemli kıyı, çiçeklerin yılda iki kere açtığı bir uzun mevsim; içeride Toroslar'ın gece serinliği.",
      en: "A hot humid coast where flowers bloom twice a year; inland, the night cool of the Taurus.",
    },
    microclimate: {
      tr: "Kıyıda narenciye, defne, yasemin; orta yamaçta sedir, biberiye, kekik; tepelerde kızılçam ve geven.",
      en: "Citrus, bay and jasmine on the shore; cedar, rosemary and thyme on the mid slope; Calabrian pine and astragalus at the heights.",
    },
    whisper: {
      tr: "Defne, biberiye, gül — kıyıdan dağa yükselen bir koku merdiveni.",
      en: "Bay, rosemary, rose — a ladder of scents that climbs from coast to peak.",
    },
    philosophy: {
      tr: "Akdeniz toprağı, bekleyişin altın hâlidir. Buradaki her bitki bir yaz daha öğrenmek ister.",
      en: "The Mediterranean soil is the golden form of waiting. Every plant here wants to learn one more summer.",
    },
    signaturePlants: ["sedir", "defne", "nar"],
    landmarks: {
      tr: ["Toros Dağları", "Beydağları", "Likya kıyısı", "Çukurova"],
      en: ["Taurus Mountains", "Bey Mountains", "Lycian coast", "Çukurova plain"],
    },
  },
  {
    id: "ic-anadolu",
    name: { tr: "İç Anadolu", en: "Central Anatolia" },
    tone: "#f0d9a8",
    soil: {
      tr: "Volkanik tüf, kireçli step, killi plato — mineral yoğun, kuru, sabırlı.",
      en: "Volcanic tuff, calcareous steppe, clayey plateau — mineral-dense, dry, patient.",
    },
    climate: {
      tr: "Karasal: sert kış, sıcak ve kuru yaz. Rüzgâr açık, gece ile gündüz arasındaki fark gerçek bir konuşmadır.",
      en: "Continental: harsh winter, dry hot summer. The wind is open, and the gap between night and day is a real conversation.",
    },
    microclimate: {
      tr: "Tuz Gölü çevresi — geven, lavanta, gül; Ankara stebi — kekik, mahlep, çavdar; Konya ovası — buğday, badem, asma.",
      en: "Around Lake Tuz — astragalus, lavender, rose; the Ankara steppe — thyme, mahaleb, rye; the Konya plain — wheat, almond, vine.",
    },
    whisper: {
      tr: "Buğdayın doğduğu yer; toprak burada eski ve sabırlıdır — biraz suya çok cevap verir.",
      en: "The cradle of wheat; the soil here is old and patient — to a little water it answers with a great deal.",
    },
    philosophy: {
      tr: "İç Anadolu, az şeyi derin yaşamayı öğreten topraktır. Burada bir tohum, bir dua kadar uzun bekler.",
      en: "Central Anatolia teaches how to live little things deeply. Here a seed waits as long as a prayer.",
    },
    signaturePlants: ["bugday", "gul", "geven"],
    landmarks: {
      tr: ["Tuz Gölü", "Kapadokya", "Erciyes Dağı", "Hasan Dağı", "Konya Ovası"],
      en: ["Lake Tuz", "Cappadocia", "Mount Erciyes", "Mount Hasan", "Konya Plain"],
    },
  },
  {
    id: "karadeniz",
    name: { tr: "Karadeniz", en: "Black Sea" },
    tone: "#7fb87a",
    soil: {
      tr: "Asidik, humus zengini — orman tabanı toprağı; çay ve fındık için tarihi olarak şekillenmiş.",
      en: "Acidic, humus-rich — a forest-floor soil that history shaped for tea and hazelnut.",
    },
    climate: {
      tr: "Yüksek nem, düzenli yağmur, dört mevsim yeşil. Bulut buradadır.",
      en: "High humidity, steady rainfall, evergreen through every season. The cloud lives here.",
    },
    microclimate: {
      tr: "Doğu Karadeniz — çay, mısır, kestane, fındık; Batı Karadeniz — kayın, gürgen, ceviz; vadi kıyıları — ısırgan ve melisa.",
      en: "Eastern Black Sea — tea, maize, chestnut, hazelnut; Western — beech, hornbeam, walnut; valley banks — nettle and lemon balm.",
    },
    whisper: {
      tr: "Yağmur bir hafıza tutar — çay, fındık, ısırgan onun sesidir.",
      en: "The rain keeps a memory — tea, hazelnut, nettle are its voice.",
    },
    philosophy: {
      tr: "Karadeniz, dinlenmenin değil dinlemenin toprağıdır. Bulut, dağ, deniz aynı cümleyi söylemek için sıraya girer.",
      en: "The Black Sea is the soil of listening, not resting. Cloud, mountain and sea queue up to speak the same sentence.",
    },
    signaturePlants: ["cay", "findik", "kestane"],
    landmarks: {
      tr: ["Kaçkar Dağları", "Yeşil Vadi", "Sümela", "Ayder Yaylası", "Boztepe"],
      en: ["Kaçkar Mountains", "Green Valley", "Sumela", "Ayder Plateau", "Mount Boztepe"],
    },
  },
  {
    id: "dogu-anadolu",
    name: { tr: "Doğu Anadolu", en: "Eastern Anatolia" },
    tone: "#6ec3ff",
    soil: {
      tr: "Bazaltik volkanik, yüksek rakım kayalık-step — mineral keskin, kar tarafından arınmış.",
      en: "Basaltic volcanic; high-altitude rocky steppe — mineral-sharp, scoured clean by snow.",
    },
    climate: {
      tr: "Yüksek dağ iklimi — uzun ve sert kış, kısa serin yaz. Hava ince, ışık çıplaktır.",
      en: "High-mountain climate — long harsh winter, short cool summer. The air is thin and the light is naked.",
    },
    microclimate: {
      tr: "Erzurum yaylaları — geven, ladin; Malatya — kayısı, üzüm, ceviz; Hakkari yamaçları — ters lale, kardelen, salep.",
      en: "Erzurum plateaus — astragalus, spruce; Malatya — apricot, vine, walnut; Hakkari slopes — fritillaria, snowdrop, salep.",
    },
    whisper: {
      tr: "İrtifa konuşur burada; az olan, daha derin bir şifaya dönüşür.",
      en: "Altitude speaks here; what is little turns into a deeper healing.",
    },
    philosophy: {
      tr: "Doğu, sertliğin altında saklı bir incelik öğretir. Bir kayısı tek bir gecede şekerini kara borçlanır.",
      en: "The East teaches a delicacy hidden beneath severity. An apricot owes its sweetness to a single night of snow.",
    },
    signaturePlants: ["kayisi", "ters-lale", "geven"],
    landmarks: {
      tr: ["Ağrı Dağı", "Van Gölü", "Nemrut Krater Gölü", "Cilo-Sat Dağları", "Munzur"],
      en: ["Mount Ararat", "Lake Van", "Nemrut crater lake", "Cilo-Sat Mountains", "Munzur"],
    },
  },
  {
    id: "guneydogu-anadolu",
    name: { tr: "Güneydoğu Anadolu", en: "Southeastern Anatolia" },
    tone: "#ff8ad9",
    soil: {
      tr: "Bazaltik, kalkerli — Mezopotamya kapılarının zengin, mineral içen toprağı.",
      en: "Basaltic and calcareous — the rich, mineral-drinking soil at Mesopotamia's gate.",
    },
    climate: {
      tr: "Çok sıcak ve kuru yaz, ılık kış — tarımın doğduğu güneş, buğdayın evlendiği iklim.",
      en: "Very hot dry summer, mild winter — the sun under which farming was born, the climate wheat married.",
    },
    microclimate: {
      tr: "Antep yaylası — Antep fıstığı, sumak; Şanlıurfa ovası — buğday, mercimek, nar; Mardin platosu — bağ, mahlep, badem.",
      en: "Antep plateau — pistachio, sumac; Şanlıurfa plain — wheat, lentil, pomegranate; Mardin plateau — vine, mahaleb, almond.",
    },
    whisper: {
      tr: "Antep fıstığı, bağ, nar — sıcak toprağın altın sözü.",
      en: "Pistachio, vineyard, pomegranate — the warm soil's golden speech.",
    },
    philosophy: {
      tr: "Burası ilk hasadın hatırasını taşıyor. Sumak ekşi değil, bilgedir; buğday yiyecek değil, anadildir.",
      en: "This soil carries the memory of the first harvest. Sumac is not sour, it is wise; wheat is not food, it is mother tongue.",
    },
    signaturePlants: ["antepfistigi", "nar", "bugday"],
    landmarks: {
      tr: ["Fırat", "Dicle", "Karacadağ", "Göbeklitepe çevresi", "Mardin Platosu"],
      en: ["Euphrates", "Tigris", "Karacadağ", "Göbeklitepe surroundings", "Mardin Plateau"],
    },
  },
];

export type Province = {
  /** ASCII id (matches plate / city slug). */
  id: string;
  /** Plate number, "01"–"81". */
  plate: string;
  name: { tr: string; en: string };
  regionId: ProvinceRegionId;
  /** Caelinus plants most native to this province (3–6 ids). */
  plantIds: GaiaPlant["id"][];
  /** Optional voice unique to the province. */
  signature?: { tr: string; en: string };
};

export const PROVINCES: Province[] = [
  // 01 — 10
  {
    id: "adana", plate: "01",
    name: { tr: "Adana", en: "Adana" },
    regionId: "akdeniz",
    plantIds: ["pamuk", "biberiye", "kekik", "defne", "nar", "kudretnari"],
    signature: {
      tr: "Çukurova güneşi — pamuğu, narı, biberiyeyi aynı toprakta yetiştiren alev rüzgârı.",
      en: "Çukurova's sun — a flame wind that grows cotton, pomegranate and rosemary in the same soil.",
    },
  },
  {
    id: "adiyaman", plate: "02",
    name: { tr: "Adıyaman", en: "Adıyaman" },
    regionId: "guneydogu-anadolu",
    plantIds: ["antepfistigi", "ters-lale", "kantaron", "sumak", "nar"],
    signature: {
      tr: "Nemrut'un eteğinde ters laleler — gözyaşı bile başını eğer.",
      en: "Crown imperials at Nemrut's foot — even a tear bows its head.",
    },
  },
  {
    id: "afyonkarahisar", plate: "03",
    name: { tr: "Afyonkarahisar", en: "Afyonkarahisar" },
    regionId: "ege",
    plantIds: ["adacayi", "kekik", "kiraz", "lavanta", "kavak"],
    signature: {
      tr: "Mermerin altında sıcak su, üstünde haşhaş, adaçayı ve kiraz tarlaları.",
      en: "Hot springs beneath the marble; poppy, sage and cherry orchards above.",
    },
  },
  {
    id: "agri", plate: "04",
    name: { tr: "Ağrı", en: "Ağrı" },
    regionId: "dogu-anadolu",
    plantIds: ["yabani-lale", "geven", "kekik", "kayisi"],
    signature: {
      tr: "Ağrı Dağı'nın eteğinde yabani lale — buz tutan toprağın altın taçı.",
      en: "At Ararat's foot the wild tulip — the golden crown of frozen soil.",
    },
  },
  {
    id: "amasya", plate: "05",
    name: { tr: "Amasya", en: "Amasya" },
    regionId: "karadeniz",
    plantIds: ["amasya-sogani", "elma", "ceviz", "murdum-erigi", "kantaron", "yesilerik"],
    signature: {
      tr: "Yeşilırmak'ın koyduğu bir mektup — soğan, elma, vişne; padişahın yaz meyvesi ve gözyaşının altındaki şifa.",
      en: "A letter the Yeşilırmak left behind — onion, apple, sour cherry; the sultan's summer fruit and the medicine beneath the tear.",
    },
  },
  {
    id: "ankara", plate: "06",
    name: { tr: "Ankara", en: "Ankara" },
    regionId: "ic-anadolu",
    plantIds: ["armut", "papatya", "adacayi", "kavak", "geven", "cigdem", "uzum"],
    signature: {
      tr: "Sultan armudunun ve step papatyasının başkenti — Beypazarı kekiği, Kalecik Karası salkımı, mart başında bozkırın çiğdemi.",
      en: "Capital of the sultan pear and the steppe chamomile — Beypazarı thyme, the Kalecik Karası cluster, the steppe's crocus at the start of March.",
    },
  },
  {
    id: "antalya", plate: "07",
    name: { tr: "Antalya", en: "Antalya" },
    regionId: "akdeniz",
    plantIds: ["mandalina", "portakal", "limon", "patlican", "defne", "biberiye", "kizilcam", "nar", "yasemin", "zeytin"],
    signature: {
      tr: "Toros'ların eteğinde defne ve kızılçam — Finike'nin altın portakalı, Kumluca'nın limonu, Kemer-Demre köy bahçelerinde ata tohum patlıcan ve mandalina.",
      en: "Bay and Calabrian pine at the foot of Taurus — Finike's golden orange, Kumluca's lemon, heirloom eggplant and mandarin in the village gardens of Kemer and Demre.",
    },
  },
  {
    id: "artvin", plate: "08",
    name: { tr: "Artvin", en: "Artvin" },
    regionId: "karadeniz",
    plantIds: ["ladin", "kardelen", "isirgan", "cay", "kantaron", "yabanmersini"],
    signature: {
      tr: "Kaçkar'ın yamacında kardelen ve mor likarba — ladin ormanının ilk fısıltısı, yaban mersininin gizli sırrı.",
      en: "Snowdrops and purple likarba on Kaçkar's slope — the first whisper of the spruce forest, the hidden secret of the wild bilberry.",
    },
  },
  {
    id: "aydin", plate: "09",
    name: { tr: "Aydın", en: "Aydın" },
    regionId: "ege",
    plantIds: ["incir", "zeytin", "enginar", "pamuk", "defne", "kestane", "cilek"],
    signature: {
      tr: "Söke ovasında dünyanın en iyi sarılop inciri — Sultanhisar'ın ata tohum çileği Ege'nin kırmızı kalbidir.",
      en: "On the Söke plain, the world's finest sarılop fig — the heirloom strawberry of Sultanhisar is the Aegean's red heart.",
    },
  },
  {
    id: "balikesir", plate: "10",
    name: { tr: "Balıkesir", en: "Balıkesir" },
    regionId: "marmara",
    plantIds: ["zeytin", "rezene", "lavanta", "ihlamur", "kantaron"],
    signature: {
      tr: "Edremit körfezi — zeytinin tuzlu rüzgârla evlendiği koy.",
      en: "Edremit Bay — the cove where the olive marries the salt wind.",
    },
  },

  // 11 — 20
  {
    id: "bilecik", plate: "11",
    name: { tr: "Bilecik", en: "Bilecik" },
    regionId: "marmara",
    plantIds: ["armut", "mese", "ceviz", "kantaron"],
    signature: {
      tr: "Osmanlı'nın doğduğu toprak — armut bahçeleri ve meşe ormanları.",
      en: "Soil where the Ottomans were born — orchards of pear, forests of oak.",
    },
  },
  {
    id: "bingol", plate: "12",
    name: { tr: "Bingöl", en: "Bingöl" },
    regionId: "dogu-anadolu",
    plantIds: ["geven", "kekik", "kayisi", "kantaron"],
  },
  {
    id: "bitlis", plate: "13",
    name: { tr: "Bitlis", en: "Bitlis" },
    regionId: "dogu-anadolu",
    plantIds: ["yabani-lale", "ceviz", "geven", "kekik"],
    signature: {
      tr: "Nemrut Krater Gölü çevresinde yabani laleler — kraterin içindeki bahar.",
      en: "Wild tulips around the Nemrut crater lake — spring inside a crater.",
    },
  },
  {
    id: "bolu", plate: "14",
    name: { tr: "Bolu", en: "Bolu" },
    regionId: "karadeniz",
    plantIds: ["kayin", "kardelen", "mese", "kantaron", "ceviz"],
    signature: {
      tr: "Yedigöller'in sessizliği kayın ve kardelenden konuşur.",
      en: "The silence of Yedigöller speaks through beech and snowdrop.",
    },
  },
  {
    id: "burdur", plate: "15",
    name: { tr: "Burdur", en: "Burdur" },
    regionId: "akdeniz",
    plantIds: ["gul", "lavanta", "kizilcam", "adacayi", "kekik"],
    signature: {
      tr: "Gül vadisinin batı yakası — mor ve pembe iki nefes; arkasında kızılçam.",
      en: "The western shore of the rose valley — purple and pink, with Calabrian pine behind.",
    },
  },
  {
    id: "bursa", plate: "16",
    name: { tr: "Bursa", en: "Bursa" },
    regionId: "marmara",
    plantIds: ["kestane", "ihlamur", "cinar", "ceviz", "hanimeli", "yasemin"],
    signature: {
      tr: "Uludağ'ın gölgesinde kestane, ipek ve eski çınarlar — coğrafi işaretli yumuşak kalp.",
      en: "Chestnut, silk and ancient planes under Uludağ — a soft heart of geographical indication.",
    },
  },
  {
    id: "canakkale", plate: "17",
    name: { tr: "Çanakkale", en: "Çanakkale" },
    regionId: "marmara",
    plantIds: ["zeytin", "kizilcam", "kekik", "defne", "kantaron"],
    signature: {
      tr: "Kaz Dağları'nın eteğinde zeytin ve kızılçam — Truva'nın sessiz tanıkları.",
      en: "Olive and Calabrian pine at Mount Ida's foot — Troy's silent witnesses.",
    },
  },
  {
    id: "cankiri", plate: "18",
    name: { tr: "Çankırı", en: "Çankırı" },
    regionId: "ic-anadolu",
    plantIds: ["kavak", "geven", "adacayi", "kekik"],
  },
  {
    id: "corum", plate: "19",
    name: { tr: "Çorum", en: "Çorum" },
    regionId: "karadeniz",
    plantIds: ["armut", "ceviz", "kantaron", "kereviz"],
    signature: {
      tr: "Hattuşa'nın toprağı — leblebi ve armudun kadim hafızası.",
      en: "The soil of Hattusa — the ancient memory of roasted chickpea and pear.",
    },
  },
  {
    id: "denizli", plate: "20",
    name: { tr: "Denizli", en: "Denizli" },
    regionId: "ege",
    plantIds: ["asma", "kiraz", "zeytin", "kekik", "adacayi", "rezene"],
    signature: {
      tr: "Pamukkale'nin beyaz teraslarında sıcak su, etrafında üzüm bağları ve kiraz.",
      en: "Hot waters on Pamukkale's white terraces, vineyards and cherry around.",
    },
  },

  // 21 — 30
  {
    id: "diyarbakir", plate: "21",
    name: { tr: "Diyarbakır", en: "Diyarbakır" },
    regionId: "guneydogu-anadolu",
    plantIds: ["diyarbakir-karpuzu", "bugday", "asma", "pamuk", "antepfistigi", "sumak", "nar"],
    signature: {
      tr: "Karacadağ buğdayının doğduğu kara taşlı toprak — Dicle'nin sıcak çocuğu, ay büyüklüğünde karpuz.",
      en: "The black-stoned soil where Karacadağ wheat was born — the warm child of the Tigris, a moon-sized watermelon.",
    },
  },
  {
    id: "edirne", plate: "22",
    name: { tr: "Edirne", en: "Edirne" },
    regionId: "marmara",
    plantIds: ["aycicegi", "bugday", "lavanta", "rezene", "kereviz"],
    signature: {
      tr: "Trakya ovasının ayçiçeği denizi — sarı bir nefes, buğdayın ikiz kardeşi.",
      en: "The sunflower sea of the Thracian plain — a yellow breath, the twin of wheat.",
    },
  },
  {
    id: "elazig", plate: "23",
    name: { tr: "Elazığ", en: "Elazığ" },
    regionId: "dogu-anadolu",
    plantIds: ["asma", "uzum", "kayisi", "murdum-erigi", "ceviz", "geven"],
    signature: {
      tr: "Öküzgözü ve Boğazkere üzümünün doğduğu yer — Doğu'nun şarap diyarı, asmanın ve salkımın iki adı.",
      en: "Where the Öküzgözü and Boğazkere grapes were born — the East's wine country, the two names of vine and cluster.",
    },
  },
  {
    id: "erzincan", plate: "24",
    name: { tr: "Erzincan", en: "Erzincan" },
    regionId: "dogu-anadolu",
    plantIds: ["kayisi", "ceviz", "geven", "kekik"],
    signature: {
      tr: "Cimin üzümünün ve kayısının ovası — dağlar arasında ılık bir avuç.",
      en: "The plain of Cimin grape and apricot — a warm palm between mountains.",
    },
  },
  {
    id: "erzurum", plate: "25",
    name: { tr: "Erzurum", en: "Erzurum" },
    regionId: "dogu-anadolu",
    plantIds: ["geven", "ladin", "sedir", "kekik", "kayisi"],
    signature: {
      tr: "Palandöken'in ayazı — yüksek, açık, mineral bir nefes; geven gümüşten konuşur.",
      en: "Palandöken's frost — high, clear, a mineral breath; the milkvetch speaks of silver.",
    },
  },
  {
    id: "eskisehir", plate: "26",
    name: { tr: "Eskişehir", en: "Eskişehir" },
    regionId: "ic-anadolu",
    plantIds: ["papatya", "lavanta", "kekik", "adacayi", "kavak", "cigdem"],
    signature: {
      tr: "Lületaşının yumuşaklığında lavanta tarlaları, yol kenarlarında kavak — mart başında Sivrihisar bozkırının ilk çiğdemi.",
      en: "Lavender fields in the softness of meerschaum, poplars along the roads — at the start of March the first crocus of the Sivrihisar steppe.",
    },
  },
  {
    id: "gaziantep", plate: "27",
    name: { tr: "Gaziantep", en: "Gaziantep" },
    regionId: "guneydogu-anadolu",
    plantIds: ["antepfistigi", "mahlep", "sumak", "nar", "kekik", "yasemin", "urfa-isot"],
    signature: {
      tr: "Bakırın, fıstığın ve mahlebin şehri — Urfa isotunun komşusu, baharatın kadim mutfağı.",
      en: "City of copper, pistachio and mahaleb — neighbour of Urfa isot, an ancient kitchen of spice.",
    },
  },
  {
    id: "giresun", plate: "28",
    name: { tr: "Giresun", en: "Giresun" },
    regionId: "karadeniz",
    plantIds: ["kiraz", "findik", "cay", "misir", "kantaron"],
    signature: {
      tr: "Kerasus — kirazın Latince adının doğduğu yer; aynı zamanda fındığın beşiği.",
      en: "Kerasus — where the Latin name of cherry was born; cradle of hazelnut as well.",
    },
  },
  {
    id: "gumushane", plate: "29",
    name: { tr: "Gümüşhane", en: "Gümüşhane" },
    regionId: "karadeniz",
    plantIds: ["kayisi", "mese", "kantaron", "ceviz"],
    signature: {
      tr: "Kuşburnu ve dut pestilinin yatağı — gümüşten önce şeker konuşur.",
      en: "The bed of rose hip and mulberry pestil — sweetness speaks before silver.",
    },
  },
  {
    id: "hakkari", plate: "30",
    name: { tr: "Hakkâri", en: "Hakkâri" },
    regionId: "dogu-anadolu",
    plantIds: ["ters-lale", "yabani-lale", "geven", "ladin", "sedir"],
    signature: {
      tr: "Cilo-Sat dağlarında ters laleler — Anadolu'nun en yüksek dua noktası.",
      en: "Crown imperials on Cilo-Sat — Anatolia's highest place of prayer.",
    },
  },

  // 31 — 40
  {
    id: "hatay", plate: "31",
    name: { tr: "Hatay", en: "Hatay" },
    regionId: "akdeniz",
    plantIds: ["defne", "nar", "pamuk", "kekik", "melisa", "yasemin", "zeytin", "mandalina", "portakal", "limon"],
    signature: {
      tr: "Antakya — defne, nar, melisa ile konuşan eski bir liman; portakal, mandalina ve limonun aynı bahçede ışıdığı baharatların kadim kapısı.",
      en: "Antakya — an old harbor speaking through bay, pomegranate and lemon balm; the ancient gate of spice where orange, mandarin and lemon glow in the same garden.",
    },
  },
  {
    id: "isparta", plate: "32",
    name: { tr: "Isparta", en: "Isparta" },
    regionId: "akdeniz",
    plantIds: ["gul", "lavanta", "kizilcam", "elma", "adacayi", "kekik"],
    signature: {
      tr: "Gül vadisi — Türkiye'nin pembe kalbi 639 Hz'te atar; eteğinde elma ve kızılçam.",
      en: "The rose valley — Turkey's pink heart beats at 639 Hz; apple and Calabrian pine at its foot.",
    },
  },
  {
    id: "mersin", plate: "33",
    name: { tr: "Mersin", en: "Mersin" },
    regionId: "akdeniz",
    plantIds: ["mandalina", "portakal", "limon", "cilek", "nar", "defne", "biberiye", "sedef-otu", "zeytin", "kudretnari"],
    signature: {
      tr: "Tarsus'un portakal ve mandalina bahçeleri, Lamas'ın limonu ve Silifke'nin çileği — sıcak kıyının altın ve kırmızı meyveleri.",
      en: "Tarsus's orange and mandarin orchards, Lamas's lemon and Silifke's strawberry — the gold and red fruits of a warm coast.",
    },
  },
  {
    id: "istanbul", plate: "34",
    name: { tr: "İstanbul", en: "İstanbul" },
    regionId: "marmara",
    plantIds: ["ihlamur", "cinar", "hanimeli", "yasemin", "defne", "lavanta"],
    signature: {
      tr: "İki kıtanın arasında nefes alan şehir — yasemin, ıhlamur, eski çınarlar konuşur.",
      en: "The city breathing between two continents — jasmine, linden and ancient planes speak.",
    },
  },
  {
    id: "izmir", plate: "35",
    name: { tr: "İzmir", en: "İzmir" },
    regionId: "ege",
    plantIds: ["zeytin", "incir", "asma", "lavanta", "adacayi", "biberiye"],
    signature: {
      tr: "Ege'nin tuzlu rüzgârı zeytine, incire, üzüme, adaçayına akar.",
      en: "The Aegean's salt wind flows into olive, fig, vine and sage.",
    },
  },
  {
    id: "kars", plate: "36",
    name: { tr: "Kars", en: "Kars" },
    regionId: "dogu-anadolu",
    plantIds: ["sedir", "ladin", "geven", "kayisi", "kekik"],
    signature: {
      tr: "Yüksek otlak — peynirin ve kekiğin yıldızlı sessizliği.",
      en: "High pasture — the starlit silence of cheese and thyme.",
    },
  },
  {
    id: "kastamonu", plate: "37",
    name: { tr: "Kastamonu", en: "Kastamonu" },
    regionId: "karadeniz",
    plantIds: ["taskopru-sarimsagi", "kestane", "sedir", "kayin", "mese", "ceviz", "kantaron"],
    signature: {
      tr: "Ilgaz Dağları'nın ardında kayın ve kestane — Taşköprü sarımsağı, dağın beyaz ateşi olarak konuşur.",
      en: "Beech and chestnut behind the Ilgaz mountains — Taşköprü garlic speaks as the white fire of the slope.",
    },
  },
  {
    id: "kayseri", plate: "38",
    name: { tr: "Kayseri", en: "Kayseri" },
    regionId: "ic-anadolu",
    plantIds: ["asma", "papatya", "adacayi", "geven", "kekik", "kantaron", "bal-kabagi"],
    signature: {
      tr: "Erciyes'in eteğinde bağlar — pastırma, sucuk ve şarabın kadim mutfağı.",
      en: "Vineyards at Erciyes' foot — the ancient kitchen of pastırma, sucuk and wine.",
    },
  },
  {
    id: "kirklareli", plate: "39",
    name: { tr: "Kırklareli", en: "Kırklareli" },
    regionId: "marmara",
    plantIds: ["aycicegi", "bugday", "lavanta", "kantaron", "rezene"],
    signature: {
      tr: "Trakya'nın yeşil bir kuzey köşesi — ayçiçek ve buğday tarlaları.",
      en: "A green northern corner of Thrace — sunflower and wheat fields.",
    },
  },
  {
    id: "kirsehir", plate: "40",
    name: { tr: "Kırşehir", en: "Kırşehir" },
    regionId: "ic-anadolu",
    plantIds: ["bugday", "geven", "papatya", "adacayi", "kekik"],
  },

  // 41 — 50
  {
    id: "kocaeli", plate: "41",
    name: { tr: "Kocaeli", en: "Kocaeli" },
    regionId: "marmara",
    plantIds: ["findik", "ihlamur", "kantaron", "kereviz"],
    signature: {
      tr: "İzmit körfezinin ıhlamuru — şehir ve denizin ortak kokusu.",
      en: "The linden of the İzmit gulf — the shared scent of city and sea.",
    },
  },
  {
    id: "konya", plate: "42",
    name: { tr: "Konya", en: "Konya" },
    regionId: "ic-anadolu",
    plantIds: ["bugday", "salep", "papatya", "adacayi", "kekik", "geven", "mor-havuc", "aksehir-bamyasi", "bal-kabagi"],
    signature: {
      tr: "Anadolu'nun buğday merkezi — Akşehir'in ipsi bamyası, Ereğli'nin mor havucu, hasadın bal kabağı; salep ve papatya bir step duasıdır.",
      en: "Anatolia's wheat heart — Akşehir's threaded okra, Ereğli's purple carrot, harvest's honey pumpkin; salep and chamomile a steppe prayer.",
    },
  },
  {
    id: "kutahya", plate: "43",
    name: { tr: "Kütahya", en: "Kütahya" },
    regionId: "ege",
    plantIds: ["mese", "kekik", "adacayi", "lavanta", "asma"],
    signature: {
      tr: "Çini, lavanta ve dağ üzümü — toprağın renkli desenleri.",
      en: "Tile, lavender and mountain grape — the soil's coloured patterns.",
    },
  },
  {
    id: "malatya", plate: "44",
    name: { tr: "Malatya", en: "Malatya" },
    regionId: "dogu-anadolu",
    plantIds: ["kayisi", "yesil-mercimek", "asma", "ceviz", "murdum-erigi", "kantaron"],
    signature: {
      tr: "Kayısının başkenti — Doğu'nun gece ayazıyla altın eti olgunlaştıran toprağı; yeşil mercimek tabakta gece olur.",
      en: "Capital of apricot — soil that ripens golden flesh under the East's night frost; the green lentil becomes night on the plate.",
    },
  },
  {
    id: "manisa", plate: "45",
    name: { tr: "Manisa", en: "Manisa" },
    regionId: "ege",
    plantIds: ["asma", "uzum", "zeytin", "kiraz", "lavanta", "adacayi", "cinar", "kirkagac-kavunu", "domates"],
    signature: {
      tr: "Sultaniye üzümü ve Salihli kirazı — Ege'nin kehribar kanı; Kırkağaç'ın altın kavunu, ata tohum domatesi ve salkımın çekirdeksiz hafızası yaz akşamında konuşur.",
      en: "Sultaniye grape and Salihli cherry — the amber blood of the Aegean; Kırkağaç's golden melon, heirloom tomato and the seedless memory of the cluster speak in the summer evening.",
    },
  },
  {
    id: "kahramanmaras", plate: "46",
    name: { tr: "Kahramanmaraş", en: "Kahramanmaraş" },
    regionId: "akdeniz",
    plantIds: ["maras-biberi", "salep", "sumak", "biberiye", "kekik", "defne"],
    signature: {
      tr: "Maraş dondurması bir damla salep; Maraş biberi bir tutam güneş — taşın üstünde sabırla kuruyan ateş.",
      en: "Maraş ice cream is one drop of salep; Maraş pepper a pinch of sun — fire patiently drying on stone.",
    },
  },
  {
    id: "mardin", plate: "47",
    name: { tr: "Mardin", en: "Mardin" },
    regionId: "guneydogu-anadolu",
    plantIds: ["mardin-nohudu", "asma", "mahlep", "antepfistigi", "sumak", "nar", "yasemin"],
    signature: {
      tr: "Mezopotamya'ya bakan taş şehir — bağ, fıstık, mahlep ve nohudun kadim dili; ekmek arkadaşının kapısı.",
      en: "A stone city facing Mesopotamia — the ancient tongue of vine, pistachio, mahaleb and chickpea; the gate of the friend of bread.",
    },
  },
  {
    id: "mugla", plate: "48",
    name: { tr: "Muğla", en: "Muğla" },
    regionId: "ege",
    plantIds: ["kizilcam", "zeytin", "defne", "biberiye", "incir", "kekik", "mandalina"],
    signature: {
      tr: "Marmaris kızılçam balının vatanı — Bodrum mandalinasının kabuğu körfezde bayrama döner.",
      en: "Home of Marmaris pine honey — the peel of Bodrum's mandarin turns the gulf into a feast.",
    },
  },
  {
    id: "mus", plate: "49",
    name: { tr: "Muş", en: "Muş" },
    regionId: "dogu-anadolu",
    plantIds: ["yabani-lale", "geven", "ladin", "kekik"],
    signature: {
      tr: "Muş ovasının yabani laleleri — Anadolu lalesinin doğa anası.",
      en: "Wild tulips of the Muş plain — the natural mother of Anatolian tulips.",
    },
  },
  {
    id: "nevsehir", plate: "50",
    name: { tr: "Nevşehir", en: "Nevşehir" },
    regionId: "ic-anadolu",
    plantIds: ["asma", "safran", "geven", "kekik", "adacayi"],
    signature: {
      tr: "Kapadokya — peri bacalarının altında bağ, safran ve volkanik bilgelik.",
      en: "Cappadocia — vineyards, saffron and volcanic wisdom beneath the fairy chimneys.",
    },
  },

  // 51 — 60
  {
    id: "nigde", plate: "51",
    name: { tr: "Niğde", en: "Niğde" },
    regionId: "ic-anadolu",
    plantIds: ["domates", "mor-havuc", "bal-kabagi", "elma", "asma", "geven", "kekik", "yesilerik"],
    signature: {
      tr: "Aksu elmasının başkenti — volkanik toprakta ata tohum domates ve mor havuç olgunlaşır; yaz akşamında ekmeğin üstüne güneş düşer.",
      en: "Capital of the Aksu apple — heirloom tomato and purple carrot ripen in volcanic soil; sun falls upon bread in the summer evening.",
    },
  },
  {
    id: "ordu", plate: "52",
    name: { tr: "Ordu", en: "Ordu" },
    regionId: "karadeniz",
    plantIds: ["findik", "misir", "cay", "kestane", "kantaron", "isirgan", "yabanmersini"],
    signature: {
      tr: "Fındığın ve mısırın denizle konuştuğu yeşil şerit — Persembe yaylasının mor yaban mersini.",
      en: "The green ribbon where hazelnut and maize speak with the sea — the purple wild bilberry of the Perşembe plateau.",
    },
  },
  {
    id: "rize", plate: "53",
    name: { tr: "Rize", en: "Rize" },
    regionId: "karadeniz",
    plantIds: ["cay", "misir", "kestane", "isirgan", "kardelen", "kantaron", "yabanmersini"],
    signature: {
      tr: "Türkiye'nin çay kalbi — yağmurun yeşili, mısırın altın saçı, kardelenin ilk fısıltısı, yaban mersini'nin (likarba) mor sırrı.",
      en: "Turkey's heart of tea — the rain's own green, maize's golden hair, the snowdrop's first whisper, the wild bilberry's (likarba) purple secret.",
    },
  },
  {
    id: "sakarya", plate: "54",
    name: { tr: "Sakarya", en: "Sakarya" },
    regionId: "marmara",
    plantIds: ["findik", "kayin", "ihlamur", "kantaron", "rezene"],
    signature: {
      tr: "Sapanca'nın ıhlamuru ve fındığı — şehirden bir saat uzakta nefes.",
      en: "Sapanca's linden and hazelnut — a breath one hour away from the city.",
    },
  },
  {
    id: "samsun", plate: "55",
    name: { tr: "Samsun", en: "Samsun" },
    regionId: "karadeniz",
    plantIds: ["misir", "bugday", "isirgan", "kantaron", "kereviz", "fasulye"],
    signature: {
      tr: "Bafra ovasının mısırı, Çarşamba'nın buğdayı — Karadeniz'in altın iki kardeşi.",
      en: "Bafra's maize and Çarşamba's wheat — the Black Sea's two golden siblings.",
    },
  },
  {
    id: "siirt", plate: "56",
    name: { tr: "Siirt", en: "Siirt" },
    regionId: "guneydogu-anadolu",
    plantIds: ["antepfistigi", "mahlep", "asma", "sumak", "kantaron"],
    signature: {
      tr: "Bıttım fıstığının ve bal'ın yatağı — taş kemerlerin altında saklı bir tatlılık.",
      en: "The bed of pistachio and honey — sweetness hidden beneath stone arches.",
    },
  },
  {
    id: "sinop", plate: "57",
    name: { tr: "Sinop", en: "Sinop" },
    regionId: "karadeniz",
    plantIds: ["kestane", "kayin", "mese", "ladin", "kantaron"],
    signature: {
      tr: "Türkiye'nin en kuzey burnunda kestane ve kayın ormanları.",
      en: "Chestnut and beech forests at Turkey's northernmost cape.",
    },
  },
  {
    id: "sivas", plate: "58",
    name: { tr: "Sivas", en: "Sivas" },
    regionId: "ic-anadolu",
    plantIds: ["bugday", "salep", "geven", "kekik", "kantaron", "adacayi"],
    signature: {
      tr: "Kızılırmak'ın açtığı geniş step — geven, kekik ve buğday diyarı.",
      en: "The wide steppe the Kızılırmak carves — land of milkvetch, thyme and wheat.",
    },
  },
  {
    id: "tekirdag", plate: "59",
    name: { tr: "Tekirdağ", en: "Tekirdağ" },
    regionId: "marmara",
    plantIds: ["aycicegi", "bugday", "asma", "uzum", "lavanta", "rezene", "kantaron"],
    signature: {
      tr: "Trakya'nın ayçiçeği denizi — sarı bir nefes; Mürefte ve Şarköy salkımları, üzümün ve buğdayın anaforu.",
      en: "The sunflower sea of Thrace — a yellow breath; the clusters of Mürefte and Şarköy, an eddy of wheat and vine.",
    },
  },
  {
    id: "tokat", plate: "60",
    name: { tr: "Tokat", en: "Tokat" },
    regionId: "karadeniz",
    plantIds: ["asma", "elma", "safran", "ceviz", "kantaron", "murdum-erigi"],
    signature: {
      tr: "Narince üzümünün toprağı — Karadeniz'in tatlı bir iç vadisi.",
      en: "Soil of the Narince grape — a sweet inner valley of the Black Sea.",
    },
  },

  // 61 — 70
  {
    id: "trabzon", plate: "61",
    name: { tr: "Trabzon", en: "Trabzon" },
    regionId: "karadeniz",
    plantIds: ["findik", "cay", "misir", "kestane", "isirgan", "kardelen", "yabanmersini"],
    signature: {
      tr: "Sumela'nın sislerinde fındık, çay, mısır, kardelen ve yaban mersini — bulutun konuştuğu dil.",
      en: "Hazelnut, tea, maize, snowdrop and wild bilberry in the mists of Sumela — the language of the cloud.",
    },
  },
  {
    id: "tunceli", plate: "62",
    name: { tr: "Tunceli", en: "Tunceli" },
    regionId: "dogu-anadolu",
    plantIds: ["ters-lale", "yabani-lale", "geven", "kantaron", "kekik"],
    signature: {
      tr: "Munzur'un eteklerinde ters lale, yabani lale ve dağ otları konuşur.",
      en: "Crown imperial, wild tulip and mountain herbs speak at the Munzur foothills.",
    },
  },
  {
    id: "sanliurfa", plate: "63",
    name: { tr: "Şanlıurfa", en: "Şanlıurfa" },
    regionId: "guneydogu-anadolu",
    plantIds: ["urfa-isot", "yesil-mercimek", "bugday", "nar", "pamuk", "antepfistigi", "sumak", "kudretnari"],
    signature: {
      tr: "Göbeklitepe'nin toprağı — buğdayın, narın, pamuğun ve isotun doğduğu yer; Harran ovasında mercimek bir tasta gece olur.",
      en: "The soil of Göbeklitepe — where wheat, pomegranate, cotton and isot were born; on the Harran plain the lentil becomes night in a bowl.",
    },
  },
  {
    id: "usak", plate: "64",
    name: { tr: "Uşak", en: "Uşak" },
    regionId: "ege",
    plantIds: ["asma", "mese", "kekik", "adacayi"],
    signature: {
      tr: "Eşme'nin halıları, Uşak'ın bağları — desen ve üzüm aynı toprakta.",
      en: "Eşme carpets and Uşak vineyards — pattern and grape from the same soil.",
    },
  },
  {
    id: "van", plate: "65",
    name: { tr: "Van", en: "Van" },
    regionId: "dogu-anadolu",
    plantIds: ["yabani-lale", "geven", "ladin", "sedir", "kekik"],
    signature: {
      tr: "Van Gölü'nün mavisi — yüksek, soğuk, derin; yamaçta yabani laleler.",
      en: "The blue of Lake Van — high, cold, deep; wild tulips on the slopes.",
    },
  },
  {
    id: "yozgat", plate: "66",
    name: { tr: "Yozgat", en: "Yozgat" },
    regionId: "ic-anadolu",
    plantIds: ["bugday", "kavak", "geven", "kekik", "kantaron"],
    signature: {
      tr: "Çamlık'ın altında step buğdayı — sarı bir uzun yatış.",
      en: "Steppe wheat beneath the pine grove — a long yellow lying down.",
    },
  },
  {
    id: "zonguldak", plate: "67",
    name: { tr: "Zonguldak", en: "Zonguldak" },
    regionId: "karadeniz",
    plantIds: ["kayin", "kestane", "mese", "kantaron", "kereviz"],
    signature: {
      tr: "Kömür'ün altında kayın ormanı — sert toprağın yumuşak nefesi.",
      en: "Beech forest above the coal — the hard soil's soft breath.",
    },
  },
  {
    id: "aksaray", plate: "68",
    name: { tr: "Aksaray", en: "Aksaray" },
    regionId: "ic-anadolu",
    plantIds: ["cilek", "bugday", "salep", "papatya", "geven", "kekik"],
    signature: {
      tr: "Hasan Dağı'nın gölgesinde geniş step — buğdayın huzurlu yatağı, ata tohum çileğin küçük kırmızı kalbi.",
      en: "Broad steppe under Mount Hasan — the peaceful bed of wheat, the small red heart of the heirloom strawberry.",
    },
  },
  {
    id: "bayburt", plate: "69",
    name: { tr: "Bayburt", en: "Bayburt" },
    regionId: "karadeniz",
    plantIds: ["sedir", "kayin", "mese", "kekik", "kantaron"],
  },
  {
    id: "karaman", plate: "70",
    name: { tr: "Karaman", en: "Karaman" },
    regionId: "ic-anadolu",
    plantIds: ["bugday", "elma", "asma", "adacayi", "kekik"],
    signature: {
      tr: "Türkçe'nin doğum yeri — buğday, elma ve bağ aynı dil ile sarmalanmış.",
      en: "Birthplace of the Turkish language — wheat, apple and vine wrapped in one tongue.",
    },
  },

  // 71 — 81
  {
    id: "kirikkale", plate: "71",
    name: { tr: "Kırıkkale", en: "Kırıkkale" },
    regionId: "ic-anadolu",
    plantIds: ["bugday", "kavak", "geven", "kekik", "adacayi"],
  },
  {
    id: "batman", plate: "72",
    name: { tr: "Batman", en: "Batman" },
    regionId: "guneydogu-anadolu",
    plantIds: ["bugday", "antepfistigi", "sumak", "asma", "kantaron"],
    signature: {
      tr: "Hasankeyf'in kayalarında bağ ve buğday — Dicle ile aynı yaşta.",
      en: "Vine and wheat on Hasankeyf's cliffs — as old as the Tigris.",
    },
  },
  {
    id: "sirnak", plate: "73",
    name: { tr: "Şırnak", en: "Şırnak" },
    regionId: "guneydogu-anadolu",
    plantIds: ["antepfistigi", "ters-lale", "kantaron", "kekik"],
  },
  {
    id: "bartin", plate: "74",
    name: { tr: "Bartın", en: "Bartın" },
    regionId: "karadeniz",
    plantIds: ["kayin", "kestane", "mese", "kantaron", "ceviz"],
    signature: {
      tr: "Amasra'nın kayın ormanı — denize bakan eski bir bilge.",
      en: "Amasra's beech forest — an old sage looking at the sea.",
    },
  },
  {
    id: "ardahan", plate: "75",
    name: { tr: "Ardahan", en: "Ardahan" },
    regionId: "dogu-anadolu",
    plantIds: ["yabani-lale", "sedir", "ladin", "kekik"],
    signature: {
      tr: "Çıldır Gölü'nün üstündeki yüksek bozkır — gümüşten bir sessizlik.",
      en: "The high steppe above Lake Çıldır — a silver silence.",
    },
  },
  {
    id: "igdir", plate: "76",
    name: { tr: "Iğdır", en: "Iğdır" },
    regionId: "dogu-anadolu",
    plantIds: ["kayisi", "asma", "nar", "geven", "kekik"],
    signature: {
      tr: "Türkiye'nin en doğusunda Akdenizleşmiş bir avuç — kayısı, üzüm ve nar.",
      en: "On Turkey's eastern edge a Mediterranean pocket — apricot, vine and pomegranate.",
    },
  },
  {
    id: "yalova", plate: "77",
    name: { tr: "Yalova", en: "Yalova" },
    regionId: "marmara",
    plantIds: ["ihlamur", "hanimeli", "yasemin", "kantaron", "yesilerik"],
    signature: {
      tr: "Termal kaynaklar, ıhlamur ve hanımeli — şehirden kaçanın küçük bahçesi.",
      en: "Thermal springs, linden and honeysuckle — the small garden of those who flee the city.",
    },
  },
  {
    id: "karabuk", plate: "78",
    name: { tr: "Karabük", en: "Karabük" },
    regionId: "karadeniz",
    plantIds: ["safran", "kayin", "mese", "ladin"],
    signature: {
      tr: "Safranbolu — adına ve toprağına safran katmış bir şehir; çevresi kayın ormanı.",
      en: "Safranbolu — a city that mixed saffron into its name and soil; surrounded by beech.",
    },
  },
  {
    id: "kilis", plate: "79",
    name: { tr: "Kilis", en: "Kilis" },
    regionId: "guneydogu-anadolu",
    plantIds: ["zeytin", "asma", "antepfistigi", "sumak"],
    signature: {
      tr: "Türkiye'nin güney kapısında zeytin ve bağ — Suriye ile ortak nefes.",
      en: "At Turkey's southern gate, olive and vineyard — a breath shared with Syria.",
    },
  },
  {
    id: "osmaniye", plate: "80",
    name: { tr: "Osmaniye", en: "Osmaniye" },
    regionId: "akdeniz",
    plantIds: ["pamuk", "biberiye", "nar", "kekik", "defne", "antepfistigi"],
    signature: {
      tr: "Çukurova'nın doğu yarısı — pamuk ve narın aynı tarlada konuştuğu yer.",
      en: "The eastern half of Çukurova — where cotton and pomegranate speak in one field.",
    },
  },
  {
    id: "duzce", plate: "81",
    name: { tr: "Düzce", en: "Düzce" },
    regionId: "karadeniz",
    plantIds: ["findik", "kayin", "kestane", "kantaron", "isirgan"],
    signature: {
      tr: "Yedigöller'e komşu fındık ve kayın ormanları — yağmurun en sessiz hâli.",
      en: "Hazelnut and beech forests near Yedigöller — the quietest form of rain.",
    },
  },
];

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

export function getProvincesByRegion(regionId: ProvinceRegionId): Province[] {
  return PROVINCES.filter((p) => p.regionId === regionId);
}

export function getProvincesByPlant(plantId: string): Province[] {
  return PROVINCES.filter((p) => p.plantIds.includes(plantId as GaiaPlant["id"]));
}

export function getProvinceRegion(regionId: ProvinceRegionId): ProvinceRegion {
  return PROVINCE_REGIONS.find((r) => r.id === regionId)!;
}
