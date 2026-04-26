/**
 * CAELINUS — Plant Voices
 *
 * Each plant of `data/gaia.ts` has a first-person monologue here.
 * The plant introduces itself: name, frequency, where it grows, what
 * it offers, what to do with it.
 *
 * Lines are intentionally short and self-contained so the UI can
 * highlight one line at a time as the audio plays.
 *
 * The same scripts are consumed by:
 *   - <PlantVoice /> (client component) for synchronized playback
 *   - scripts/generate-plant-audio.ts (Node) to produce MP3s via ElevenLabs
 */

export type Lang = "tr" | "en";

export type PlantVoiceLine = { tr: string; en: string };

export type PlantVoiceScript = {
  /** Matches GaiaPlant.id */
  id: string;
  /** Optional ElevenLabs voice override per plant. Falls back to ELEVEN_VOICE_ID. */
  voiceId?: string;
  /** Optional ElevenLabs model override (eleven_multilingual_v2 by default). */
  model?: string;
  lines: PlantVoiceLine[];
};

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */

/** Concatenate all lines into a single utterance for TTS / Web Speech. */
export function fullScript(script: PlantVoiceScript, lang: Lang): string {
  return script.lines.map((l) => l[lang]).join(" ");
}

/** Get the script for a plant id, or null. */
export function getPlantVoice(id: string): PlantVoiceScript | null {
  return PLANT_VOICES[id] ?? null;
}

/** True if a script exists at all. */
export function hasPlantVoice(id: string): boolean {
  return id in PLANT_VOICES;
}

/* ────────────────────────────────────────────────────────────────
   Voices — 12 plants, first-person, TR + EN
   ──────────────────────────────────────────────────────────────── */

export const PLANT_VOICES: Record<string, PlantVoiceScript> = {
  lavanta: {
    id: "lavanta",
    lines: [
      {
        tr: "Ben Lavanta'yım. Ege'nin tuzlu rüzgârında, taşlı toprakta açarım.",
        en: "I am Lavender. I open in the salt wind of the Aegean, on stony soil.",
      },
      {
        tr: "Üç yüz doksan altı hertz titreşirim — korkunun içeriden çözüldüğü frekans.",
        en: "I vibrate at three hundred and ninety-six hertz — the frequency where fear unbinds from within.",
      },
      {
        tr: "Az suya alışkınım, çok güneşi severim; yağmur sonrası kokum daha yoğun olur.",
        en: "I am used to little water and love long sun; my scent thickens after rain.",
      },
      {
        tr: "Bana gelen sinire dokunurum, kasılan omuzu indiririm.",
        en: "I touch the nerve that comes to me; I lower the tightened shoulder.",
      },
      {
        tr: "Akşamüstü iki damlamı yastığına bırak — sessizliğimi kokuya çeviririm.",
        en: "At dusk, place two of my drops on your pillow — I will turn silence into scent.",
      },
    ],
  },

  gul: {
    id: "gul",
    lines: [
      {
        tr: "Ben Gül'üm. Isparta'da, dağ eteklerinde, sabah ayazında doğarım.",
        en: "I am Rose. I am born in Isparta, on the foothills, in the morning chill.",
      },
      {
        tr: "Altı yüz otuz dokuz hertz titreşirim — kalp meridyenine inen frekans.",
        en: "I vibrate at six hundred and thirty-nine hertz — the frequency that descends to the heart meridian.",
      },
      {
        tr: "Toprağım humuslu, suyu seven ama biriktirmeyen olmalı; tan vakti toplanmayı isterim.",
        en: "My soil must be humus-rich, water-loving but never water-holding; I prefer to be picked at dawn.",
      },
      {
        tr: "Dikenim içimden değil, çevremdendir — açılmak isteyenleri korurum.",
        en: "My thorn is not within me but around me — I protect those willing to open.",
      },
      {
        tr: "Bir damlama dilinin altına ver — kalbinin kapısını yumuşatırım.",
        en: "Place a single drop of me beneath your tongue — I will soften the door of your heart.",
      },
    ],
  },

  zeytin: {
    id: "zeytin",
    lines: [
      {
        tr: "Ben Zeytin'im. Ege ve Akdeniz'in taşlı kıyılarında, bin yıl yaşarım.",
        en: "I am Olive. I live a thousand years on the stony shores of the Aegean and Mediterranean.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — sabırlı dönüşümün frekansı; yavaş ama kesin olanı bilirim.",
        en: "I vibrate at five hundred and twenty-eight hertz — the frequency of patient transformation; I know the slow but certain.",
      },
      {
        tr: "Killi-kireçli toprağı severim; az su, uzun güneş ve ihmal beni güçlendirir.",
        en: "I love clay-limestone soil; little water, long sun, and even neglect strengthen me.",
      },
      {
        tr: "Yağım kalbinin damarına girer; meyvem kıştaki tuzunu hatırlatır.",
        en: "My oil enters the vein of your heart; my fruit reminds you of the salt in winter.",
      },
      {
        tr: "Acele etme — ben dedeni de gördüm, seni de göreceğim.",
        en: "Do not hurry — I saw your grandfather, and I will see you too.",
      },
    ],
  },

  biberiye: {
    id: "biberiye",
    lines: [
      {
        tr: "Ben Biberiye'yim. Akdeniz'in kayalık yamaçlarında, denize bakar açarım.",
        en: "I am Rosemary. I open on the rocky slopes of the Mediterranean, facing the sea.",
      },
      {
        tr: "Dört yüz on yedi hertz titreşirim — eski olanı bırakıp hatırlamayı tazeleyen frekans.",
        en: "I vibrate at four hundred and seventeen hertz — the frequency that releases the old and refreshes memory.",
      },
      {
        tr: "Drenajlı toprakta, az suyla en güçlü olurum; nemli yer beni boğar.",
        en: "I become strongest in well-drained soil with little water; damp ground drowns me.",
      },
      {
        tr: "Hafızanın sisini dağıtırım, kafanın içini yıkarım.",
        en: "I clear the mist of memory; I rinse the inside of the head.",
      },
      {
        tr: "Bir dalımı koklayıp odana gir — düşüncelerin yerini bulur.",
        en: "Smell one of my sprigs before entering your room — your thoughts will find their place.",
      },
    ],
  },

  adacayi: {
    id: "adacayi",
    lines: [
      {
        tr: "Ben Adaçayı'yım. Anadolu'nun tepelerinde, kireçli toprakta yaşarım.",
        en: "I am Sage. I live on the hills of Anatolia, in limestone soil.",
      },
      {
        tr: "Yedi yüz kırk birden konuşurum — sezginin perdesini aralayan frekansım.",
        en: "I speak from seven hundred and forty-one — the frequency that lifts the veil of intuition.",
      },
      {
        tr: "Az gübre, çok güneş, az su — kuru kalmak özümdür.",
        en: "Little fertilizer, much sun, little water — to stay dry is my essence.",
      },
      {
        tr: "Ağzına gelen sözü temizlerim, kararsızlığı sıcak suya bırakırım.",
        en: "I cleanse the word at the mouth; I leave hesitation in hot water.",
      },
      {
        tr: "Sabah vakti bir avucumu kaynat — günün kafasını berrak yaparım.",
        en: "Boil a handful of me in the morning — I will clear the head of your day.",
      },
    ],
  },

  melisa: {
    id: "melisa",
    lines: [
      {
        tr: "Ben Melisa'yım, oğul otu da derler. Bahçenin gölge köşelerini severim.",
        en: "I am Melissa — they also call me lemon balm. I love the shaded corners of the garden.",
      },
      {
        tr: "Altı yüz otuz dokuz hertz titreşirim — telaşı durultan limon kokulu kalp frekansı.",
        en: "I vibrate at six hundred and thirty-nine hertz — the lemon-scented heart frequency that calms haste.",
      },
      {
        tr: "Nemli, gevşek toprak, gölge sabah, parlak öğleden sonra; arılar bana danışmaya gelir.",
        en: "Damp, loose soil, shaded mornings, bright afternoons; bees come to me for counsel.",
      },
      {
        tr: "Çarpıntıyı yatağa yatırırım, gece uyanan zihni teselli ederim.",
        en: "I lay palpitations to bed; I console the mind that wakes at night.",
      },
      {
        tr: "Beş yaprağımı sıcak suya bırak — ben sana bekleyişi öğretirim.",
        en: "Steep five of my leaves in hot water — I will teach you to wait.",
      },
    ],
  },

  yasemin: {
    id: "yasemin",
    lines: [
      {
        tr: "Ben Yasemin'im. Akdeniz'in akşamlarını ben kokuturum.",
        en: "I am Jasmine. The evenings of the Mediterranean are scented by me.",
      },
      {
        tr: "Sekiz yüz elli iki hertz titreşirim — sezgi ile hücrenin buluştuğu yüksek frekans.",
        en: "I vibrate at eight hundred and fifty-two hertz — the high frequency where intuition meets the cell.",
      },
      {
        tr: "Sıcağı, geceyi ve dik açıyı severim; çiçeğim güneş battıktan sonra açılır.",
        en: "I love the heat, the night, and the steep angle; my flower opens only after sundown.",
      },
      {
        tr: "Hüznü neşeye, soğukluğu çağrıya çeviririm.",
        en: "I turn sorrow into delight, coldness into invitation.",
      },
      {
        tr: "Pencereni geceleyin aç — odana ben girerim, korkuyu ben uğurlarım.",
        en: "Open your window at night — I will enter your room and see fear off.",
      },
    ],
  },

  defne: {
    id: "defne",
    lines: [
      {
        tr: "Ben Defne'yim. Akdeniz'in koruyucu ağacı.",
        en: "I am Bay Laurel. The protective tree of the Mediterranean.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — niyetin perçinlendiği koruma frekansı.",
        en: "I vibrate at five hundred and twenty-eight hertz — the protective frequency that seals intent.",
      },
      {
        tr: "Killi-kumlu toprak, yarı gölge, az su — yavaş büyürüm ama kalıcıyım.",
        en: "Clay-sand soil, partial shade, little water — I grow slowly but I remain.",
      },
      {
        tr: "Kötü göze sınır çizerim, eve giren havayı süzerim.",
        en: "I draw a line against the evil eye; I filter the air that enters the home.",
      },
      {
        tr: "Bir yaprağımı yastığının altına koy — uyku iyi niyetlere kapı açsın.",
        en: "Place one of my leaves under your pillow — let sleep open a door to good intentions.",
      },
    ],
  },

  nane: {
    id: "nane",
    lines: [
      {
        tr: "Ben Nane'yim. Suya yakın olduğum her yerde çoğalırım.",
        en: "I am Mint. Wherever I am close to water, I multiply.",
      },
      {
        tr: "Dört yüz on yedi hertz titreşirim — yenilenmenin ve açılan nefesin frekansı.",
        en: "I vibrate at four hundred and seventeen hertz — the frequency of renewal and the opening breath.",
      },
      {
        tr: "Nemli toprak, yarı gölge, bol su; bana sınır verirsen bahçeyi kaplarım.",
        en: "Damp soil, partial shade, plenty of water; give me a border or I will take the garden.",
      },
      {
        tr: "Mide bulantısını alır, yorgun nefesi açarım.",
        en: "I take away nausea; I open the tired breath.",
      },
      {
        tr: "Bir avucumu sıkıp avucuna sür — gün açılır.",
        en: "Crush a handful of me into your palm — the day will open.",
      },
    ],
  },

  cay: {
    id: "cay",
    lines: [
      {
        tr: "Ben Çay'ım. Karadeniz'in dik yamaçlarında, yağmurla konuşarak büyürüm.",
        en: "I am Tea. I grow on the steep slopes of the Black Sea, conversing with the rain.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — yağmuru ritme çeviren sabırlı uyanış frekansı.",
        en: "I vibrate at five hundred and twenty-eight hertz — the patient frequency that turns rain into rhythm.",
      },
      {
        tr: "Asit toprağı, çok yağışı ve serin sabahları severim.",
        en: "I love acidic soil, much rainfall, and cool mornings.",
      },
      {
        tr: "Sabahın yorgunluğunu silerim, sohbetin boşluğunu doldururum.",
        en: "I wipe the morning's fatigue; I fill the silence between conversations.",
      },
      {
        tr: "İnce belli bardağa bana yer aç — Karadeniz'i evine getireyim.",
        en: "Make room for me in a thin-waist glass — I will bring the Black Sea into your home.",
      },
    ],
  },

  isirgan: {
    id: "isirgan",
    lines: [
      {
        tr: "Ben Isırgan'ım. Karadeniz'in nemli kıyısında, terk edilmiş tarlada öne çıkarım.",
        en: "I am Nettle. I rise in the damp Black Sea soil, on the abandoned field.",
      },
      {
        tr: "Yedi yüz kırk bir hertz titreşirim — kanın mineral hafızasını uyandıran vahşi hakikat frekansı.",
        en: "I vibrate at seven hundred and forty-one hertz — the wild-truth frequency that wakes the mineral memory of blood.",
      },
      {
        tr: "Azotlu, gevşek toprağı severim; gölge serinliği ile parlak güneşi birleştiririm.",
        en: "I love nitrogen-rich, loose soil; I bring the cool of shade together with bright sun.",
      },
      {
        tr: "Demiri, magnezyumu, klorofili getiririm — yorgun kana yeniden başlamayı söylerim.",
        en: "I bring iron, magnesium, chlorophyll — I tell tired blood to begin again.",
      },
      {
        tr: "Diken gibi görünürüm ama yıkanmış halim sade bir teselli — beni kaynat, vücudunu duy.",
        en: "I look like a sting, but boiled I am plain consolation — boil me, hear your body.",
      },
    ],
  },

  sumak: {
    id: "sumak",
    lines: [
      {
        tr: "Ben Sumak'ım. Güneydoğu'nun kuru rüzgârında, kayalık toprakta kızarırım.",
        en: "I am Sumac. I redden in the dry wind of the Southeast, on rocky soil.",
      },
      {
        tr: "Dört yüz on yedi hertz titreşirim — ekşi kıvılcımla dilini uyandıran değişim frekansı.",
        en: "I vibrate at four hundred and seventeen hertz — the frequency of change that wakes the tongue with a sour spark.",
      },
      {
        tr: "Az suyu, çok güneşi, taşlı toprağı severim; soğuk beni saklar, sıcak beni açar.",
        en: "I love little water, much sun, stony soil; cold hides me, heat opens me.",
      },
      {
        tr: "Sofranın yağını dengeler, mide ateşini düşürürüm.",
        en: "I balance the oil of the table; I lower the fire of the stomach.",
      },
      {
        tr: "Bir tutamımı et üstüne, bir tutamımı zihnine serp — keskinlik berraklıktır.",
        en: "Sprinkle a pinch of me on the meat, a pinch on the mind — sharpness is clarity.",
      },
    ],
  },

  kekik: {
    id: "kekik",
    lines: [
      {
        tr: "Ben Kekik'im. Toros eteklerinde, Honaz ve Sandıklı yaylalarında, taşın çatlağından çıkarım.",
        en: "I am Thyme. I rise from the cracks of stone in the Taurus foothills, on the Honaz and Sandıklı plateaus.",
      },
      {
        tr: "Yedi yüz kırk bir hertz titreşirim — sözün arınmasının ve hakikatin sözünü bulmanın frekansı.",
        en: "I vibrate at seven hundred and forty-one hertz — the frequency where speech is purified and truth finds its word.",
      },
      {
        tr: "Kireçli kuru toprağı, çok güneşi, az suyu severim; yağmur sonrası kokum bütün vadiye yayılır.",
        en: "I love limestone soil, much sun, little water; after rain my scent fills the entire valley.",
      },
      {
        tr: "Karvakrolüm boğazı temizler, timolüm bağışıklığı yeniler, mideyi rahatlatırım.",
        en: "My carvacrol cleanses the throat, my thymol renews immunity, I ease the stomach.",
      },
      {
        tr: "Bir dalımı zeytinyağıyla salata üstüne sıkıştır — Anadolu'nun en eski reçetesini hatırlatırım.",
        en: "Pinch a sprig of me with olive oil onto your salad — I will remind you of Anatolia's oldest recipe.",
      },
    ],
  },

  safran: {
    id: "safran",
    lines: [
      {
        tr: "Ben Safran'ım. Safranbolu tepelerinde, sonbaharda mor çiçeğimi açarım — sadece üç gün, sadece şafakta.",
        en: "I am Saffron. On the hills of Safranbolu, I open my purple flower in autumn — only three days, only at dawn.",
      },
      {
        tr: "Dokuz yüz altmış üç hertz titreşirim — kozmik bilincin altın frekansı; bir gram olabilmem için yetmiş bin tepecik emek lazım.",
        en: "I vibrate at nine hundred and sixty-three hertz — the golden frequency of cosmic consciousness; one gram of me costs seventy thousand stigmas of labor.",
      },
      {
        tr: "Hafif kumlu, derin toprak, bol güneş, kuru hava — beni özenle çoğaltırlar.",
        en: "Light sandy, deep soil, much sun, dry air — I am multiplied by patience.",
      },
      {
        tr: "Krosin pigmentim hafızayı tazeler, safranal molekülüm hüznü dağıtır.",
        en: "My crocin pigment refreshes memory, my safranal molecule disperses sorrow.",
      },
      {
        tr: "Üç telimi sıcak süte bırak — gece, altın bir uyku gibi inecek.",
        en: "Steep three threads of me in warm milk — night will descend like a golden sleep.",
      },
    ],
  },

  kantaron: {
    id: "kantaron",
    lines: [
      {
        tr: "Ben Sarı Kantaron'um. Ege ve Akdeniz yamaçlarında, yaz başında küçük altın çiçeklerimi açarım.",
        en: "I am St. John's Wort. On the slopes of the Aegean and Mediterranean, I open my small golden flowers in early summer.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — yaranın kendi içinden kapandığı yenilenme frekansı.",
        en: "I vibrate at five hundred and twenty-eight hertz — the renewal frequency where the wound closes from within.",
      },
      {
        tr: "Kuru, taşlı toprağı severim; tam güneşte yağım koyulaşır.",
        en: "I love dry, stony soil; in full sun my oil thickens.",
      },
      {
        tr: "Hiperisin molekülüm cildi, sinirleri ve uyku ağını onarır; karanlık duyguyu yumuşatır.",
        en: "My hypericin molecule repairs skin, nerves, and the web of sleep; it softens the dark mood.",
      },
      {
        tr: "Çiçeğimi zeytinyağıyla kırk gün güneşte beklet — yara değil, hatıra olsun.",
        en: "Steep my flowers in olive oil for forty days in the sun — let the wound become memory, not scar.",
      },
    ],
  },

  rezene: {
    id: "rezene",
    lines: [
      {
        tr: "Ben Rezene'yim. Ege bahçelerinde, deniz rüzgârının ulaştığı yerde tüylü yapraklarımı açarım.",
        en: "I am Fennel. In the Aegean gardens, where the sea wind reaches, I open my feathered leaves.",
      },
      {
        tr: "Dört yüz on yedi hertz titreşirim — sindirimin açıldığı, gazın çözüldüğü, anne sütünün çoğaldığı frekans.",
        en: "I vibrate at four hundred and seventeen hertz — the frequency where digestion opens, gas dissolves, mother's milk multiplies.",
      },
      {
        tr: "Kumlu, gevşek toprağı, bol güneşi, ölçülü suyu severim.",
        en: "I love sandy, loose soil, plenty of sun, measured water.",
      },
      {
        tr: "Anetolüm gazı toplar, östrojen benzeri molekülüm rahmi sakinleştirir, dilin tadını ferahlatır.",
        en: "My anethole gathers gas, my estrogen-like molecule calms the womb, freshens the taste at the tongue.",
      },
      {
        tr: "Tohumumu çiğne ya da bir avucumu kaynat — bağırsağına nefes alma vakti gelmiştir.",
        en: "Chew my seed or boil a handful — your gut is ready to breathe.",
      },
    ],
  },

  geven: {
    id: "geven",
    lines: [
      {
        tr: "Ben Geven'im. İç Anadolu steplerinin dikenli prensiyim; kuraklığın içinden çıkar, soğuğun içinde kök salarım.",
        en: "I am Astragalus. The thorny prince of the Central Anatolian steppe; I rise out of drought and root inside the cold.",
      },
      {
        tr: "Üç yüz doksan altı hertz titreşirim — köke inen korkuyu söken, kadim direnç frekansı.",
        en: "I vibrate at three hundred and ninety-six hertz — the ancient resilience frequency that unbinds the fear at the root.",
      },
      {
        tr: "Yağışsız, taşlı, alkali toprağı severim; üç yıl beklemeden kökümü vermem.",
        en: "I love dry, stony, alkaline soil; I do not give my root before three years.",
      },
      {
        tr: "Astragalozid molekülüm bağışıklığı uzatır, yorgun böbreği uyandırır, uzun ömrün kapısını açar.",
        en: "My astragaloside molecule extends immunity, awakens the tired kidney, opens the door to longevity.",
      },
      {
        tr: "Köküm kaynar suya değdiğinde Anadolu'nun bin yıllık ilacını içersin.",
        en: "When my root touches boiling water, you drink Anatolia's thousand-year medicine.",
      },
    ],
  },

  mese: {
    id: "mese",
    lines: [
      {
        tr: "Ben Meşe'yim. Marmara'dan Karadeniz'e, Anadolu ormanlarının kralıyım; bin yıl yaşayan tek ağaç olabilirim.",
        en: "I am Oak. From Marmara to the Black Sea, I am the king of Anatolian forests; I may live a thousand years.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — hücresel dayanıklılığın, uzun ömrün ve toprak hafızasının frekansı.",
        en: "I vibrate at five hundred and twenty-eight hertz — the frequency of cellular endurance, long life, and the memory of soil.",
      },
      {
        tr: "Killi, derin toprağı, soğuk kışı, yavaş büyümeyi severim.",
        en: "I love clay, deep soil, cold winters, slow growing.",
      },
      {
        tr: "Tanenim deriyi sıkar, palamutum proteindir, kabuğum yaranın koruyucu zırhıdır.",
        en: "My tannin tightens skin, my acorn is protein, my bark is the wound's guardian armor.",
      },
      {
        tr: "Bir meşe palamudunu cebine koy — kök gibi sabırlı olmayı hatırlatırım.",
        en: "Place an acorn of mine in your pocket — I will remind you to be patient like a root.",
      },
    ],
  },

  sedir: {
    id: "sedir",
    lines: [
      {
        tr: "Ben Toros Sediri'yim. Antik Akdeniz mabetlerinin direği, bin sekiz yüz metrede ay'a doğru uzanan kutsal kalıntıyım.",
        en: "I am the Cedar of Lebanon. The pillar of ancient Mediterranean temples; on the eighteen-hundred-meter ridges of the Taurus, I am a sacred remnant reaching toward the moon.",
      },
      {
        tr: "Sekiz yüz elli iki hertz titreşirim — yüksek sezginin ve ruhsal yapının frekansı.",
        en: "I vibrate at eight hundred and fifty-two hertz — the frequency of high intuition and spiritual structure.",
      },
      {
        tr: "Kireçli, drenajlı, soğuk toprağı, dik yamacı severim; iki yüz yıl ayakta kalırım.",
        en: "I love limestone, drained, cold soil, steep slopes; I stand two hundred years.",
      },
      {
        tr: "Reçinem havayı arındırır, odunum sandığa konulduğunda hatırayı bin yıl tazeler.",
        en: "My resin purifies air; when my wood is placed in a chest, it preserves memory for a thousand years.",
      },
      {
        tr: "Bir parça odunumu çekmecene koy — eski olanın değişmesine izin ver.",
        en: "Place a piece of my wood in your drawer — let the old change.",
      },
    ],
  },

  ladin: {
    id: "ladin",
    lines: [
      {
        tr: "Ben Doğu Ladini'yim. Trabzon'dan Artvin'e, sisin ortasında, gizli bir koroyum.",
        en: "I am the Oriental Spruce. From Trabzon to Artvin, I am a hidden chorus inside the mist.",
      },
      {
        tr: "Yedi yüz kırk bir hertz titreşirim — havayı arındıran ve ifade kanalını açan frekans.",
        en: "I vibrate at seven hundred and forty-one hertz — the frequency that purifies air and opens the channel of expression.",
      },
      {
        tr: "Asit toprağı, bol yağışı, soğuk gölgeyi severim; iğne yapraklarım dört yıl ağaçta kalır.",
        en: "I love acidic soil, abundant rain, cold shade; my needles stay four years on the tree.",
      },
      {
        tr: "Reçinem alerjiyi kapatır, uçucu yağım nefes yollarını söker; ormanım iyon zenginidir.",
        en: "My resin shuts allergy down, my essential oil clears the airways; my forest is rich in negative ions.",
      },
      {
        tr: "Bir dakika gözlerini kapa, ladin ormanını hatırla — akciğerlerin senin yerine konuşacak.",
        en: "Close your eyes for one minute, remember the spruce forest — your lungs will speak for you.",
      },
    ],
  },

  ceviz: {
    id: "ceviz",
    lines: [
      {
        tr: "Ben Ceviz'im. İç Anadolu ve Karadeniz vadilerinde, derin köklü bin yıllık komşunum.",
        en: "I am Walnut. In the valleys of Central Anatolia and the Black Sea, I am a thousand-year-old neighbor with deep roots.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — hafızanın yenilendiği, hücrenin yağla yıkandığı frekans.",
        en: "I vibrate at five hundred and twenty-eight hertz — the frequency where memory renews, where the cell is washed with oil.",
      },
      {
        tr: "Derin, drenajlı, gevşek toprağı severim; meyvem ön beyin gibidir, omegam beynin kendi yağıdır.",
        en: "I love deep, drained, loose soil; my fruit looks like a forebrain, my omega is the brain's own oil.",
      },
      {
        tr: "Antioksidan tanenim damarları açar, melatoninim uyku ritmini düzenler, çekirdeğim niyetin tohumudur.",
        en: "My antioxidant tannin opens the vessels, my melatonin steadies the sleep rhythm, my kernel is the seed of intent.",
      },
      {
        tr: "Sabahları yedi cevizi avucunda say — yedi günü hatırlamak için.",
        en: "Count seven walnuts in your palm in the morning — to remember seven days.",
      },
    ],
  },

  findik: {
    id: "findik",
    lines: [
      {
        tr: "Ben Fındık'ım. Karadeniz'in dik yamaçlarında, dünyanın yetmiş kuru tonunun yetmişini taşıyan kalp ağacıyım.",
        en: "I am Hazelnut. On the steep slopes of the Black Sea, I am the heart-tree that carries seventy of the world's seventy dry tons.",
      },
      {
        tr: "Altı yüz otuz dokuz hertz titreşirim — kalp damarını besleyen ilişki frekansı.",
        en: "I vibrate at six hundred and thirty-nine hertz — the relational frequency that feeds the heart vessel.",
      },
      {
        tr: "Asit toprağı, bol yağışı, soğuk kışı, vadi serinliğini severim.",
        en: "I love acidic soil, abundant rain, cold winter, the cool of the valley.",
      },
      {
        tr: "E vitaminim, magnezyumum, omega dokuzum damar duvarını esnetir; lifim sindirimi yumuşatır.",
        en: "My vitamin E, magnesium, omega-nine soften the wall of the artery; my fiber softens digestion.",
      },
      {
        tr: "Bir avuç fındığı küçük bir kâseye koy — hızlı düşüncelere yavaş bir ısırma alanı.",
        en: "Place a handful of hazelnuts in a small bowl — a slow biting field for fast thoughts.",
      },
    ],
  },

  antepfistigi: {
    id: "antepfistigi",
    lines: [
      {
        tr: "Ben Antep Fıstığı'yım. Gaziantep, Şanlıurfa ve Siirt'in kuru güneşinde, ılık geceyle çiftleşip yeşilliğimi olgunlaştırırım.",
        en: "I am the Antep Pistachio. In the dry sun of Gaziantep, Şanlıurfa, and Siirt, I mate with the warm night and ripen my green.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — kalbi ve damarı yenileyen Akdeniz dönüşüm frekansı.",
        en: "I vibrate at five hundred and twenty-eight hertz — the Mediterranean transformation frequency that renews heart and vessel.",
      },
      {
        tr: "Killi-kireçli, drenajlı toprağı, az suyu, sıcak yazı severim; iki yıl bekler, üçüncü yıl çift verim veririm — ürünüm kapama olur.",
        en: "I love clay-limestone, drained soil, little water, hot summer; I wait two years and bear a double harvest in the third — they call it the kapama.",
      },
      {
        tr: "Klorofilim damar duvarını rahatlatır, B6 vitaminim ruh halini taşır, lutein gözü besler.",
        en: "My chlorophyll relaxes the vessel wall, my vitamin B6 carries mood, lutein nourishes the eye.",
      },
      {
        tr: "Üç yeşil fıstığı dilinin altında bekle — Güneydoğu'nun ışığı içinden konuşur.",
        en: "Hold three green pistachios beneath your tongue — the light of the Southeast will speak from within.",
      },
    ],
  },

  "murdum-erigi": {
    id: "murdum-erigi",
    lines: [
      {
        tr: "Ben Mürdüm Eriği'yim. Karadeniz ve İç Anadolu vadilerinde, yaz sonunda mor kabuğumu olgunlaştırırım.",
        en: "I am the Damson Plum. In the valleys of the Black Sea and Central Anatolia, I ripen my purple skin at the end of summer.",
      },
      {
        tr: "Dört yüz on yedi hertz titreşirim — sindirimin açıldığı ve eskinin bırakıldığı değişim frekansı.",
        en: "I vibrate at four hundred and seventeen hertz — the frequency of change where digestion opens and the old is released.",
      },
      {
        tr: "Killi-kumlu derin toprak, soğuk kış, ölçülü yaz suyu beni tatlı yapar.",
        en: "Clay-sand deep soil, cold winter, measured summer water sweeten me.",
      },
      {
        tr: "Sorbitolüm bağırsağı uyandırır, antosiyaninim kanı temizler, lifim mide-bağırsak ekosistemini hizaya sokar.",
        en: "My sorbitol awakens the bowel, my anthocyanin cleanses the blood, my fiber aligns the gut ecosystem.",
      },
      {
        tr: "Sabahları üç kuru mürdüm — gün sıkışmadan açılır.",
        en: "Three dried damsons in the morning — the day opens without tightness.",
      },
    ],
  },

  yesilerik: {
    id: "yesilerik",
    lines: [
      {
        tr: "Ben Yeşil Erik'im. Marmara ve Ege bahçelerinde, baharın ilk ekşi müjdesiyim.",
        en: "I am the Green Plum. In the gardens of Marmara and the Aegean, I am spring's first sour herald.",
      },
      {
        tr: "Dört yüz on yedi hertz titreşirim — uyanışın ve yenilenmenin frekansı; kıştan çıkmış damağa ekşi kıvılcım.",
        en: "I vibrate at four hundred and seventeen hertz — the frequency of awakening and renewal; a sour spark on the palate that has emerged from winter.",
      },
      {
        tr: "Killi gevşek toprağı, ılıman ilkbaharı, koruyucu rüzgârı severim.",
        en: "I love clay loose soil, mild spring, sheltering wind.",
      },
      {
        tr: "C vitaminim bağışıklığı tazeler, malik asidim sindirimi uyarır, suyum ödemi indirir.",
        en: "My vitamin C refreshes immunity, my malic acid stimulates digestion, my water reduces edema.",
      },
      {
        tr: "Bir avuç yeşil erikle gün başlat — kışın gözündeki uykuyu silersin.",
        en: "Begin the day with a handful of me — you will wipe winter's sleep from the eye.",
      },
    ],
  },

  enginar: {
    id: "enginar",
    lines: [
      {
        tr: "Ben Enginar'ım. Ege bahçelerinde, mor başlığımla bahar sonunda olgunlaşırım.",
        en: "I am Artichoke. In the Aegean gardens, with my purple cap, I ripen at the end of spring.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — karaciğeri yıkayan, hücreyi tazeleyen yenilenme frekansı.",
        en: "I vibrate at five hundred and twenty-eight hertz — the renewal frequency that washes the liver and refreshes the cell.",
      },
      {
        tr: "Derin, drenajlı, gevşek toprağı severim; ılıman kış, serin bahar olgunlaşmamı tatlı yapar.",
        en: "I love deep, drained, loose soil; mild winter and cool spring make my ripening sweet.",
      },
      {
        tr: "Cynarinim safranın akışını açar, antioksidanım yağ metabolizmasını düzeltir, lifim bağırsağı besler.",
        en: "My cynarin opens the flow of bile, my antioxidant balances fat metabolism, my fiber feeds the gut.",
      },
      {
        tr: "Yarım enginarı limon-zeytinyağıyla pişir — karaciğerine bir teşekkür yemeği.",
        en: "Cook half of me with lemon and olive oil — a thank-you meal for your liver.",
      },
    ],
  },

  kereviz: {
    id: "kereviz",
    lines: [
      {
        tr: "Ben Kereviz'im. Marmara bahçelerinin ferah otuyum; sapım, yaprağım ve köküm üç ayrı şifa konuşur.",
        en: "I am Celery. The fresh herb of Marmara gardens; my stalk, leaf, and root speak three separate medicines.",
      },
      {
        tr: "Üç yüz doksan altı hertz titreşirim — korkudan ve gergin sudan kurtaran arınma frekansı.",
        en: "I vibrate at three hundred and ninety-six hertz — the cleansing frequency that releases fear and tense water.",
      },
      {
        tr: "Nemli, gevşek, hafif tuzlu toprağı, serin sabahı severim.",
        en: "I love damp, loose, slightly salty soil, cool mornings.",
      },
      {
        tr: "Apigeninim sinir sistemini yumuşatır, doğal sodyumum ödemi söker, lifim sindirimi düzenler.",
        en: "My apigenin softens the nervous system, my natural sodium unbinds edema, my fiber regulates digestion.",
      },
      {
        tr: "Bir bardak kereviz suyunu sabaha bağla — beden suyunu yeniden öğrenir.",
        en: "Tie a glass of celery juice to your morning — the body re-learns its water.",
      },
    ],
  },

  fasulye: {
    id: "fasulye",
    lines: [
      {
        tr: "Ben Kuru Fasulye'yim. Bolu'nun, İspir'in, Tosya'nın taneliyim — Anadolu sofrasının ana proteini.",
        en: "I am the Dried Bean. The grain of Bolu, İspir, Tosya — the main protein of the Anatolian table.",
      },
      {
        tr: "Beş yüz yirmi sekiz hertz titreşirim — toprağın azotu cisimleştirdiği dönüşüm frekansı.",
        en: "I vibrate at five hundred and twenty-eight hertz — the transformation frequency where soil makes nitrogen flesh.",
      },
      {
        tr: "Derin, gevşek, killi-kumlu toprağı, ılıman yazı, ölçülü suyu severim; köküme yapışan rizobya azotu havadan toprağa indirir.",
        en: "I love deep, loose, clay-sand soil, mild summer, measured water; the rhizobia clinging to my roots bring nitrogen down from air to soil.",
      },
      {
        tr: "Lifim, lizinim, demirim, magnezyumum kası kemiğe bağlar; folatım kanı yeniler.",
        en: "My fiber, lysine, iron, magnesium bind muscle to bone; my folate renews blood.",
      },
      {
        tr: "Bir gece suda bekleyen fasulye — sabırlı pişen her şey gibi, hafiftir.",
        en: "A bean that waits a night in water — like everything cooked patiently, is light.",
      },
    ],
  },

  kudretnari: {
    id: "kudretnari",
    lines: [
      {
        tr: "Ben Kudret Narı'yım. Ege ve Akdeniz bahçelerinde, yaz sonunda turuncu kabuğumu çatlatır, kırmızı tohumlarımı sergilerim.",
        en: "I am Bitter Melon. In the gardens of the Aegean and Mediterranean, at the end of summer, I crack my orange skin and reveal my red seeds.",
      },
      {
        tr: "Yedi yüz kırk bir hertz titreşirim — acı hakikatin ve içeriden gelen bağışıklığın frekansı.",
        en: "I vibrate at seven hundred and forty-one hertz — the frequency of bitter truth and immunity that comes from within.",
      },
      {
        tr: "Sıcak, nemli toprağı, parmaklıklı dikey alanı, bol güneşi severim.",
        en: "I love warm, damp soil, vertical trellis space, much sun.",
      },
      {
        tr: "Charantinim kan şekerini hizaya sokar, polipeptidim insülin gibi davranır, antioksidanım iltihabı söker.",
        en: "My charantin aligns blood sugar, my polypeptide acts like insulin, my antioxidant unbinds inflammation.",
      },
      {
        tr: "Beni zeytinyağında bir ay beklet — yarayı sözcükten önce iyileştiren acı bir bilgeliğim olsun.",
        en: "Steep me in olive oil for a month — let me be a bitter wisdom that heals the wound before any word.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────
     ANATOLIAN CANON — Phase 2.5b voice scripts.
     MP3 not yet generated; PlantVoice will fall back to
     Web Speech until the ElevenLabs render is uploaded.
     ────────────────────────────────────────────────── */

  kayisi: {
    id: "kayisi",
    lines: [
      { tr: "Ben Kayısı'yım. Malatya'nın gece ayazıyla gündüz güneşi arasında, altın etimi olgunlaştırırım.", en: "I am the Apricot. Between Malatya's night frost and day sun, I ripen my golden flesh." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — sertliğin altındaki tatlılığın frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of sweetness hidden under severity." },
      { tr: "Az suya, çok güneşe, bir geceye düşen ilk ayaza ihtiyaç duyarım; aksi halde acılaşırım.", en: "I need little water, much sun, and one night of frost; without it I turn bitter." },
      { tr: "Beta-karotenim göze, potasyumum kalbe, lifim bağırsağa yazılır.", en: "My beta-carotene writes into the eye, my potassium into the heart, my fibre into the gut." },
      { tr: "Beni güneşte üç gün kurut. Bir tanemi yavaşça çiğne — tatlılığın zorlukla doğduğunu hatırla.", en: "Dry me three days in the sun. Chew one piece slowly — remember sweetness is born from hardship." },
    ],
  },

  asma: {
    id: "asma",
    lines: [
      { tr: "Ben Asma'yım. Ege bağlarında, Kapadokya'nın volkanik toprağında, Mardin'in taş duvarlarında dolanırım.", en: "I am the Vine. I wind through Aegean vineyards, the volcanic soil of Cappadocia, the stone walls of Mardin." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — uzun zamanın iyileştirdiğinin frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of what long time heals." },
      { tr: "Bir mevsim için değil bir ömür için kök salarım; her salkım, bir yıl boyunca konuştuğum bir cümledir.", en: "I do not root for one season but for a lifetime; every cluster is a sentence I have spoken for one year." },
      { tr: "Resveratrolüm hücreyi yeniler, polifenollerim damarı genişletir, yaprağım sindirimi yatıştırır.", en: "My resveratrol renews the cell, my polyphenols widen the vessel, my leaf calms digestion." },
      { tr: "Bir kuru üzüm avucunda. Üç çiğneme. Kuruyan şekerin nasıl bir tören olduğunu hatırla.", en: "A raisin in your palm. Three chews. Remember how dried sugar is a ceremony." },
    ],
  },

  bugday: {
    id: "bugday",
    lines: [
      { tr: "Ben Buğday'ım. Karacadağ'ın kara taşlı toprağında 12.000 yıl önce evcilleştim, sonra Anadolu'nun anadili oldum.", en: "I am Wheat. On the black-stoned soil of Karacadağ I was domesticated twelve thousand years ago, then I became Anatolia's mother tongue." },
      { tr: "Üç yüz doksan altı hertz titreşirim — korkudan arınmanın ve hafızanın frekansı.", en: "I vibrate at three hundred ninety-six hertz — the frequency of releasing fear and of memory." },
      { tr: "Az suya çok cevap veririm; karasal iklim, açık rüzgâr, sabırlı toprak isterim.", en: "To a little water I return a great deal; I want continental climate, open wind, patient soil." },
      { tr: "B vitaminim sinire, magnezyumum kasa, lifim bağırsağa yazılır; siyez ve kavılca dengeli glüten taşır.", en: "My B vitamins write into the nerve, my magnesium into muscle, my fibre into the gut; einkorn and emmer carry balanced gluten." },
      { tr: "Bir avuç bulgura su koy, üzerini ört, sabırla şişmesini bekle. Buğday hız öğretmez — yavaşlık öğretir.", en: "Pour water on a handful of bulgur, cover, wait patiently. Wheat does not teach speed — she teaches slowness." },
    ],
  },

  nar: {
    id: "nar",
    lines: [
      { tr: "Ben Nar'ım. Mezopotamya'nın kapısında, Antep ve Mardin'in sıcak yaylasında, kırmızı meclisimi açarım.", en: "I am the Pomegranate. At Mesopotamia's gate, on the warm plateaus of Antep and Mardin, I open my red parliament." },
      { tr: "Altı yüz otuz dokuz hertz titreşirim — bin tohumun aynı kalbe ait olduğunu hatırlamanın frekansı.", en: "I vibrate at six hundred thirty-nine hertz — the frequency of remembering that a thousand seeds belong to one heart." },
      { tr: "Sıcak, kuru yaza, taşlı toprağa, az ama düzenli sulamaya alışkınım.", en: "I am used to a hot dry summer, stony soil, little but regular water." },
      { tr: "Punikalaginim iltihabı söker, antosiyaninim hücreyi korur, suyum kalp damarını genişletir.", en: "My punicalagin unbinds inflammation, my anthocyanin shields the cell, my juice widens the cardiovascular vessel." },
      { tr: "Bir nar tanesini diline koy. Patlatmadan önce duyduğun, kalbinin sesidir.", en: "Place a pomegranate seed on your tongue. What you hear before it bursts — that is the sound of your heart." },
    ],
  },

  incir: {
    id: "incir",
    lines: [
      { tr: "Ben İncir'im. Aydın'ın Söke ovasında, dünyanın en iyi sarılop incirini bedenimde taşırım.", en: "I am the Fig. On Aydın's Söke plain, I carry the world's finest sarılop fig in my body." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — gizli olanın olgunlaşmasının frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of what ripens hidden." },
      { tr: "Sıcak güneş, tuzlu rüzgâr ve geç gelen bir yağmur isterim; kuru ettiğimde bile suyumu hatırlarım.", en: "I want hot sun, salt wind, and a late-arriving rain; even when I am dried, I remember my water." },
      { tr: "Kalsiyumum kemiğe, magnezyumum sinirin yumuşamasına, lifim bağırsak florasına yazılır.", en: "My calcium writes into bone, my magnesium into the nerve's softening, my fibre into the gut flora." },
      { tr: "Bir kuru inciri ısıt — buharında bir badem koy. Tatlı bekleme, bir kıvama gel.", en: "Warm a dried fig — slip an almond inside the steam. Don't wait for sweetness, become a consistency." },
    ],
  },

  elma: {
    id: "elma",
    lines: [
      { tr: "Ben Elma'yım. Amasya'nın Yeşilırmak vadisinde, kırmızı yanaklı, beyaz etli bir hediye olarak büyürüm.", en: "I am the Apple. In Amasya's Yeşilırmak valley, I grow as a red-cheeked, white-fleshed gift." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — basit sevginin frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of simple love." },
      { tr: "Soğuk kış, ılık yaz, derin toprağı severim; her yıl bir kez çiçeklenir, bir kez sözümü tutarım.", en: "I love cold winter, warm summer, deep soil; once a year I bloom, once I keep my word." },
      { tr: "Pektinim kolesterolü düşürür, kuersetinim akciğeri korur, suyum sindirim ritmini onarır.", en: "My pectin lowers cholesterol, my quercetin guards the lung, my juice repairs the rhythm of digestion." },
      { tr: "Sabah aç karna bir elma. Kabuğumu soyma — hafıza orada yaşar.", en: "An apple on an empty morning stomach. Don't peel my skin — memory lives there." },
    ],
  },

  kayin: {
    id: "kayin",
    lines: [
      { tr: "Ben Kayın'ım. Karadeniz ormanlarının anne sütunuyum; bir orman ne kadar büyürse büyüsün, bana dayanır.", en: "I am the Beech. The mother column of the Black Sea forests; however large a forest grows, it leans on me." },
      { tr: "Yüz yetmiş dört hertz titreşirim — kök ağrısının dindiği frekans.", en: "I vibrate at one hundred seventy-four hertz — the frequency where root-pain quiets." },
      { tr: "Yüksek nem, asidik humus, kuzey eğimini severim; gölgemde bir başka ağaç değil, sessizlik büyür.", en: "I love high humidity, acidic humus, a north slope; in my shade not another tree but silence grows." },
      { tr: "Yaprağımdan çay tanenleri ve flavonoidleri verir, kabuğum doğal bir bakır kaynağı taşır.", en: "My leaf-tea gives tannins and flavonoids, my bark carries a natural source of copper." },
      { tr: "Bir kayın gövdesine sırtını ver. On nefes. Benim zamanımı ödünç al.", en: "Lean your back against a beech trunk. Ten breaths. Borrow my time." },
    ],
  },

  kestane: {
    id: "kestane",
    lines: [
      { tr: "Ben Kestane'yim. Bursa-Uludağ'ın eteklerinde, dikenli evimde altın bir öpücük taşırım.", en: "I am the Chestnut. At Uludağ's foot in Bursa, in my thorn-house I carry a golden kiss." },
      { tr: "Üç yüz doksan altı hertz titreşirim — sertliğin yumuşadığı frekans.", en: "I vibrate at three hundred ninety-six hertz — the frequency where hardness softens." },
      { tr: "Ilıman yağışlı iklim, asidik humus, derin toprağı severim; tek başıma değil, ormanla nefes alırım.", en: "I love a temperate rainy climate, acidic humus, deep soil; I don't breathe alone, I breathe with the forest." },
      { tr: "C vitaminim, B6'm, manganezim ve glütensiz nişastam — fakirin ekmeği, şekerin tacı.", en: "My vitamin C, B6, manganese and gluten-free starch — the poor's bread, the crown of sugar." },
      { tr: "Bir avuç beni közde döndür. Çıt diye soyul. Bu ses, sonbaharın anasıdır.", en: "Roast a handful of me on coals. Pop me with a snap. That sound is the mother of autumn." },
    ],
  },

  misir: {
    id: "misir",
    lines: [
      { tr: "Ben Mısır'ım. Karadeniz'e Amerika'dan 16. yüzyılda göçtüm; Bafra ovası beni altın saçlı bir gelin gibi karşıladı.", en: "I am Maize. I came from America to the Black Sea in the 16th century; the Bafra plain welcomed me like a golden-haired bride." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — basit besinin frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of plain nourishment." },
      { tr: "Bol güneş, düzenli su, derin alüvyal toprak isterim; soğuk geceyi sevmem, yağmuru beklerim.", en: "I want plenty of sun, regular water, deep alluvial soil; I dislike cold nights and wait for the rain." },
      { tr: "Zeaksantinim gözü korur, B vitaminim sinirine huzur verir, püskülüm böbreği temizler.", en: "My zeaxanthin guards the eye, my B vitamins calm the nerve, my silk cleans the kidney." },
      { tr: "Püskülümü kuru, kaynar suya at — içeriden temizler, su gibi.", en: "Dry my silk, drop it in boiling water — it cleans from inside, like water itself." },
    ],
  },

  pamuk: {
    id: "pamuk",
    lines: [
      { tr: "Ben Pamuk'um. Çukurova'nın beyaz altınıyım; bir bitkide yetişen, koyun yünü kadar yumuşak bir iplikim.", en: "I am Cotton. The white gold of Çukurova; a thread grown on a plant, soft as wool of sheep." },
      { tr: "Dört yüz on yedi hertz titreşirim — derinin tene değdiği frekans.", en: "I vibrate at four hundred seventeen hertz — the frequency where skin meets skin." },
      { tr: "Sıcak güneş, derin sulama, alüvyal toprak isterim; ben aslında bulutu yere indiririm.", en: "I want hot sun, deep irrigation, alluvial soil; I bring the cloud down to earth." },
      { tr: "Tohumumun yağı E vitamini, lifim cilde nefes; hücreye, dokuya, alerjik tene yazılırım.", en: "My seed oil holds vitamin E, my fibre is breath for the skin; I write into the cell, the tissue, the allergic skin." },
      { tr: "Bir parça organik beni yüzüne değdir. Beş saniye. Beni nefes olarak gör.", en: "Touch a piece of organic me to your face. Five seconds. See me as breath." },
    ],
  },

  aycicegi: {
    id: "aycicegi",
    lines: [
      { tr: "Ben Ayçiçeği'yim. Trakya tarlasındaki sarı plaka — bütün gün güneşi takip eden bir öğrenciyim.", en: "I am the Sunflower. The yellow plate on a Thrace field — a student who tracks the sun all day." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — yüzü ışığa dönmenin frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of turning the face toward light." },
      { tr: "Düz ova, derin toprak, açık ufuk isterim; gölgede kalmayı sevmem.", en: "I want flat plain, deep soil, open horizon; I do not love staying in shade." },
      { tr: "Tohumumda E vitamini, magnezyum, selenyum; cilde, hücreye, hafif depresyona iyi gelirim.", en: "In my seed there is vitamin E, magnesium, selenium; I help the skin, the cell, mild depression." },
      { tr: "Bir avuç çiğ tohumumla yüzünü sabah güneşine dön. Birer birer çiğne — iç ışığı yutuyorsun.", en: "With a handful of my raw seeds, face the morning sun. Chew one by one — you are swallowing inner light." },
    ],
  },

  "ters-lale": {
    id: "ters-lale",
    lines: [
      { tr: "Ben Ters Lale'yim. Hakkari'nin Cilo dağlarında, Adıyaman'ın yamaçlarında, başını eğmiş bir kraliçeyim.", en: "I am the Crown Imperial. On Hakkari's Cilo mountains and Adıyaman's slopes, I am a queen with bowed head." },
      { tr: "Sekiz yüz elli iki hertz titreşirim — sezginin doğru söylediği frekans.", en: "I vibrate at eight hundred fifty-two hertz — the frequency where intuition tells the truth." },
      { tr: "Yüksek rakım, kar suyu, kalkerli kayalık isterim; yılda bir kez nisanın sonunda görülürüm.", en: "I want high altitude, snowmelt, calcareous rock; I am seen only once a year at April's end." },
      { tr: "Beni yemezler — bana bakarlar; halk tıbbında soğanım göğüs ve nefes için kullanılır.", en: "I am not eaten — I am looked at; in folk medicine my bulb has been used for chest and breath." },
      { tr: "Bana uzaktan bak. Eğilmemi gör. Benim gibi bir kez başını eğ — kaybettiğin için.", en: "Look at me from a distance. See me bow. Bow once like me — for what you have lost." },
    ],
  },

  kardelen: {
    id: "kardelen",
    lines: [
      { tr: "Ben Kardelen'im. Bolu'nun ve Kastamonu'nun karlı yamaçlarında, kışın kapısında ilk fısıltıyım.", en: "I am the Snowdrop. On Bolu's and Kastamonu's snowy slopes, I am the first whisper at winter's door." },
      { tr: "Yüz yetmiş dört hertz titreşirim — karın altından doğan hafızanın frekansı.", en: "I vibrate at one hundred seventy-four hertz — the frequency of memory born under snow." },
      { tr: "Yarı gölge, nemli humuslu orman tabanını severim; kar erimeden başımı toprak altından çıkarırım.", en: "I love half-shade, moist humic forest floor; I lift my head from beneath the soil before the snow has melted." },
      { tr: "Bedenimde galantamin var — modern Alzheimer ilacı; ben bilinç ve hatırlamanın yumuşak otuyum.", en: "Within me there is galantamine — a modern Alzheimer medicine; I am the gentle herb of consciousness and recall." },
      { tr: "Şubat sonunda bir kardeleni gözle. Toplama. Ben dirilişin sembolüyüm — bakman yeterli.", en: "Watch a snowdrop in late February. Don't pick. I am the symbol of resurrection — looking is enough." },
    ],
  },

  salep: {
    id: "salep",
    lines: [
      { tr: "Ben Salep'im. Konya'nın kireçli stebinde, Maraş'ın yüksek yamaçlarında, dağın altındaki sessiz duayım.", en: "I am Salep. On Konya's calcareous steppe, on Maraş's high slopes, I am the silent prayer beneath a mountain." },
      { tr: "Dört yüz on yedi hertz titreşirim — sıcak yumuşaklığın frekansı.", en: "I vibrate at four hundred seventeen hertz — the frequency of warm softness." },
      { tr: "Yüksek mera, soğuk kış, kar erimesi isterim; toplanmam yasak — neslim azalıyor.", en: "I want high pasture, cold winter, snowmelt; gathering me is forbidden — my kin is dwindling." },
      { tr: "Glukomannanım boğazı kaplar, polisakkaridim mideyi yatıştırır, sıcaklığım soğuk algınlığını yumuşatır.", en: "My glucomannan coats the throat, my polysaccharide soothes the stomach, my warmth softens the cold." },
      { tr: "Bir bardak gerçek beni iç. Üzerine tarçın serp. İlk yudumu gözlerin kapalı al — kış, anneye benziyor.", en: "Drink a glass of true me. Sprinkle cinnamon on top. Take the first sip with eyes closed — winter resembles a mother." },
    ],
  },

  kiraz: {
    id: "kiraz",
    lines: [
      { tr: "Ben Kiraz'ım. Giresun'da — Kerasus'ta — Latince ismim doğdu; bir aydır mevsimim, az olduğum için tamım.", en: "I am the Cherry. In Giresun — in Kerasus — my Latin name was born; my season is one month; whole because little." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — kısa süreli sevincin tam frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the precise frequency of brief joy." },
      { tr: "Soğuk kış uykusu, ılık ilkbahar, az dolu isterim; çiçeklendiğimde bir ay konuşurum.", en: "I need cold winter dormancy, mild spring, little hail; when I bloom I speak for one month." },
      { tr: "Antosiyaninlerim eklemi rahatlatır, melatoninim uykuyu çağırır, C vitaminim cildi yeniler.", en: "My anthocyanins ease the joint, my melatonin calls sleep, my vitamin C renews the skin." },
      { tr: "Mevsimin ilk kirazını avucunda tut. Yutmadan önce 'teşekkür' de. Sonra çekirdeği toprağa ver.", en: "Hold the season's first cherry in your palm. Say 'thank you' before swallowing. Then return the pit to the soil." },
    ],
  },

  armut: {
    id: "armut",
    lines: [
      { tr: "Ben Armut'um. Ankara'nın 'sultan armudu' olarak Osmanlı sarayına çıkardım; ağırbaşlı bir tatlılığım.", en: "I am the Pear. As Ankara's 'sultan pear' I rose to the Ottoman court; a dignified sweetness." },
      { tr: "Dört yüz on yedi hertz titreşirim — yumuşak ışığın frekansı.", en: "I vibrate at four hundred seventeen hertz — the frequency of soft light." },
      { tr: "Soğuk kış, ılık yaz, drene tınlı toprak isterim; aceleci olmam, dilimi olgunluğa bırakırım.", en: "I want cold winter, warm summer, well-drained loam; I do not hurry, I leave my tongue to ripeness." },
      { tr: "Pektinim bağırsağa, K vitaminim kemiğe, bakırım dolaşıma yazılır.", en: "My pectin writes into the gut, my vitamin K into bone, my copper into circulation." },
      { tr: "Bir armudu tezgahta bir gün beklet. Yumuşadığında ye. Sabır, tadın bir parçasıdır.", en: "Leave a pear on the counter for a day. Eat it when soft. Patience is part of the flavour." },
    ],
  },

  kizilcam: {
    id: "kizilcam",
    lines: [
      { tr: "Ben Kızılçam'ım. Akdeniz kıyısının yeşil duvarıyım; orman yangınından sonra ilk filizlenirim.", en: "I am the Calabrian Pine. The green wall of the Mediterranean coast; I am the first to sprout after wildfire." },
      { tr: "Yüz yetmiş dört hertz titreşirim — orman akciğerinin frekansı.", en: "I vibrate at one hundred seventy-four hertz — the frequency of the forest's lung." },
      { tr: "Kalkerli toprak, deniz nemi, sıcak yaz isterim; reçinem, çam balının asıl üreticisidir.", en: "I want calcareous soil, sea humidity, hot summer; my resin is the true producer of pine honey." },
      { tr: "Alfa-pinenim ciğeri açar, iğnelerim C vitamini ve antioksidan, gölgem mantar dengesi kurar.", en: "My alpha-pinene opens the lung, my needles carry vitamin C and antioxidants, my shade builds the fungal balance." },
      { tr: "Bir kızılçam ormanında durup kollarını yana aç. On nefes — ciğerin benimle beraber genişler.", en: "Stand in a Calabrian pine forest, arms open at the sides. Ten breaths — your lungs widen with mine." },
    ],
  },

  mahlep: {
    id: "mahlep",
    lines: [
      { tr: "Ben Mahlep'im. Mardin'in taş şehrinde, Antep'in pazar tezgâhında, bir ninenin elinden hamura serpilirim.", en: "I am Mahaleb. In Mardin's stone city, in Antep's bazaar, I am sprinkled by a grandmother's hand into dough." },
      { tr: "Üç yüz doksan altı hertz titreşirim — kadim aromanın frekansı.", en: "I vibrate at three hundred ninety-six hertz — the frequency of an ancient aroma." },
      { tr: "Sıcak yaylada, taşlı yamaçta, az suya alışkın bir vişne akrabasıyım — çekirdeğim baharat olur.", en: "On hot plateaus, on stony slopes, I am a sour-cherry relative used to little water — my kernel becomes a spice." },
      { tr: "Kumarinim ferahlatır, glikozitim hatırlatır; bir tutamımla ekmek, çocukluk pişer.", en: "My coumarin freshens, my glycoside reminds; with a pinch of me bread bakes — and so does childhood." },
      { tr: "Bir tutam beni yumurtalı çöreğe karıştır. Pişerken kokuyu içine al — bu, hafıza pişiyor.", en: "Stir a pinch of me into an egg loaf. Inhale as it bakes — memory is baking." },
    ],
  },

  "sedef-otu": {
    id: "sedef-otu",
    lines: [
      { tr: "Ben Sedef Otu'yum. Akdeniz kıyısının kapı yanında dikilirim — koruma otuyum, kötü gözden.", en: "I am Rue. I stand by the gate of the Mediterranean coast — a protective herb, against the evil eye." },
      { tr: "Yedi yüz kırk bir hertz titreşirim — sınırı koruyan otun frekansı.", en: "I vibrate at seven hundred forty-one hertz — the frequency of the herb that guards the boundary." },
      { tr: "Sıcak güneş, kuru toprak, küçük doz isterim — büyük dozda toksik olurum, sadece bir tutam yeterlidir.", en: "I want hot sun, dry soil, a small dose — in large dose I become toxic; only a pinch is enough." },
      { tr: "Rutinim damarı korur, uçucu yağım sineklere karşı durur, dokumam kâbus için tarihi bir koruma.", en: "My rutin guards the vessel, my volatile oil stands against insects, my fabric is a historic protection against nightmare." },
      { tr: "Bir dalımı girişin tepesinde kuru. Hastalandığın gün bana dokunma — sadece bak.", en: "Dry one of my sprigs above the entrance. On a sick day, don't touch me — only look." },
    ],
  },

  ihlamur: {
    id: "ihlamur",
    lines: [
      { tr: "Ben Ihlamur'um. İstanbul'un eski sokaklarında bir teyzeyim; nezleyle gelen ziyaretçiyi avucumda ısıtırım.", en: "I am Linden. An aunt in Istanbul's old streets; I warm in my palm the visitor who arrives with a cold." },
      { tr: "Üç yüz doksan altı hertz titreşirim — ilk sıcaklığın geri verildiği frekans.", en: "I vibrate at three hundred ninety-six hertz — the frequency where first warmth is returned." },
      { tr: "Yumuşak iklim, derin tınlı toprak isterim; çiçeklerimi haziran sonunda açarım, üç hafta sürerim.", en: "I want a mild climate, deep loamy soil; I open my blossoms at June's end, I last three weeks." },
      { tr: "Müsilajım boğazı sarmalar, flavonoidlerim sinirini yatıştırır, hafif terlemenin balıyım.", en: "My mucilage wraps the throat, my flavonoids calm the nerve; I am the honey of light perspiration." },
      { tr: "Bir avuç kuru beni 90 dereceli suya at. Üç dakika bekle. Buharı gözlerine doğru çek.", en: "Drop a handful of dried me into 90-degree water. Wait three minutes. Draw the steam toward your eyes." },
    ],
  },

  papatya: {
    id: "papatya",
    lines: [
      { tr: "Ben Papatya'yım. Anadolu stebinin sade bir cümlesi — bir gözyaşı kadar küçük, bir uyku kadar büyük.", en: "I am Chamomile. A plain sentence of the Anatolian steppe — small as a tear, vast as a sleep." },
      { tr: "Dört yüz on yedi hertz titreşirim — toprağın anne sesinin frekansı.", en: "I vibrate at four hundred seventeen hertz — the frequency of the soil's mother voice." },
      { tr: "Az suya, açık toprağa, geniş güneşe alışkınım; yılda iki kere çiçeklenirim, mayıs ve eylül.", en: "I am used to little water, open soil, wide sun; I bloom twice a year, in May and in September." },
      { tr: "Bisabololüm cildin iltihabını söker, apigeninim sinire yumuşaklık verir, kamazulenim mideyi sarmalar.", en: "My bisabolol unbinds skin inflammation, my apigenin gives softness to the nerve, my chamazulene wraps the stomach." },
      { tr: "Yatağa girmeden bir bardak. Üç koklama, bir yudum. Gözlerini kapatma — kapanır.", en: "One cup before bed. Three smells, one sip. Don't close your eyes — they close themselves." },
    ],
  },

  hanimeli: {
    id: "hanimeli",
    lines: [
      { tr: "Ben Hanımeli'yim. İstanbul'un Bizans bahçelerinde, Yalova'nın termal serinliğinde — gecenin parfümüyüm.", en: "I am Honeysuckle. In Istanbul's Byzantine gardens, in Yalova's thermal cool — I am the night's perfume." },
      { tr: "Altı yüz otuz dokuz hertz titreşirim — gece açan kalbin frekansı.", en: "I vibrate at six hundred thirty-nine hertz — the frequency of the heart that opens at night." },
      { tr: "Nemli yumuşak toprak, çelik tellim için bir duvar isterim; gündüz görünmem, akşam balkonda beklerim.", en: "I want moist soft soil, a wall for my tendrils; I am invisible by day, I wait at the balcony by evening." },
      { tr: "Çiçeğimde flavonoidler, klorojenik asit, antiviral bileşikler; boğazı, soğuğu ve romantik kapanmayı açarım.", en: "In my flower: flavonoids, chlorogenic acid, antiviral compounds; I open the throat, the cold, the romantic shutdown." },
      { tr: "Akşam serinliğinde bir hanımeli yanında dur. Yutkunma — kokumun seni iki saniye terk etmesine izin ver.", en: "Stand beside a honeysuckle in the evening cool. Don't swallow — let my scent leave you for two seconds." },
    ],
  },

  "yabani-lale": {
    id: "yabani-lale",
    lines: [
      { tr: "Ben Yabani Lale'yim. Muş ovasında, Van'ın yüksek yamacında — Lalezar'ın atasıyım, bahçede tutsak değilim.", en: "I am the Wild Tulip. On the Muş plain, on Van's high slope — I am the ancestor of Lalezar; not held captive in any garden." },
      { tr: "Altı yüz otuz dokuz hertz titreşirim — sade güzelliğin frekansı.", en: "I vibrate at six hundred thirty-nine hertz — the frequency of plain beauty." },
      { tr: "Yüksek otlak, kalkerli kayalık, kar suyu isterim; nisanda iki hafta açar, sonra toprağa dönerim.", en: "I want high pasture, calcareous rock, snowmelt; I bloom two weeks in April, then return to the soil." },
      { tr: "Soğanım bazı türlerimde halk tıbbında kullanılmıştır; ben aslında bakılan, sözcüğe çevrilmeyen bir armağanım.", en: "My bulb has been used in folk medicine in some species; truly I am a gift to be looked at, not translated into words." },
      { tr: "Bir yamaçta beni gör. Bir resim çek — toplama. Benden ne öğrendiğini sonra yaz.", en: "See me on a slope. Take a photo — don't pick. Write down what you learned from me, later." },
    ],
  },

  cinar: {
    id: "cinar",
    lines: [
      { tr: "Ben Çınar'ım. İstanbul, Bursa, Manisa — şehrin altında nefes alan eski adamım; bir saatlik gölgem, otuz yıllık bir çiçeğin sözünden uzun konuşur.", en: "I am the Plane. Istanbul, Bursa, Manisa — the old man breathing under the city; one hour of my shade speaks longer than thirty years of any flower." },
      { tr: "Yüz yetmiş dört hertz titreşirim — şehir bilgesinin frekansı.", en: "I vibrate at one hundred seventy-four hertz — the frequency of the city's sage." },
      { tr: "Akarsuyun yanında, alüvyal toprak, uzun yaz isterim; beş yüz yıl yaşarım, gövdeme bir tarih yazarım.", en: "I want the side of a stream, alluvial soil, a long summer; I live five hundred years and write a history into my trunk." },
      { tr: "Yaprak çayım anti-enflamatuvardır, kabuğum yara için, gölgem ruhsal bir koruma; topraklanma, hafıza, gürültüden korunma.", en: "My leaf tea is anti-inflammatory, my bark is for wounds, my shade is a spiritual protection — grounding, memory, sound protection." },
      { tr: "Bir çınarın altına otur. On nefes. Yapraklar konuşurken anlama — sadece duy.", en: "Sit beneath a plane tree. Ten breaths. As leaves speak, don't understand — just hear." },
    ],
  },

  kavak: {
    id: "kavak",
    lines: [
      { tr: "Ben Kavak'ım. Anadolu yollarının ağacı; yola serili bir mektubum, her yaprak bir kelime, ve rüzgârla okunur.", en: "I am the Poplar. The tree of Anatolian roads; a letter laid along the road, each leaf a word, read by the wind." },
      { tr: "İki yüz seksen beş hertz titreşirim — ince yaprağın titrediği frekans.", en: "I vibrate at two hundred eighty-five hertz — the frequency of the thin trembling leaf." },
      { tr: "Su yakını, derin toprak, açık güneş isterim; hızla büyürüm, ama uzun yaşamam — kırk yıl konuşur, susarım.", en: "I want water nearby, deep soil, open sun; I grow fast but do not live long — I speak forty years and fall silent." },
      { tr: "Tomurcuğumda salisin var — aspirinin atası; kabuğumda tanen ve flavonoid; ateşi, sızıyı, dokuyu hizaya sokarım.", en: "My buds carry salicin — the ancestor of aspirin; my bark holds tannin and flavonoid; I align fever, ache, tissue." },
      { tr: "Bir kavak yolunda yürü. Sesimi duy — yapraklar el çırpıyor. Yola olan minneti hatırla.", en: "Walk a poplar avenue. Hear me — the leaves applaud. Remember your gratitude to the road." },
    ],
  },

  /* ──────────────────────────────────────────────────
     ANATOLIAN HEIRLOOM CANON — Phase 2.7 voice scripts
     for mandarin, strawberry and the great ata tohum
     vegetables. MP3 not yet generated; PlantVoice falls
     back to Web Speech until the ElevenLabs render is
     uploaded.
     ────────────────────────────────────────────────── */

  mandalina: {
    id: "mandalina",
    lines: [
      { tr: "Ben Mandalina'yım. Bodrum, Finike, Mersin bahçelerinde — Akdeniz'in çocukluk kokulu küçük güneşiyim.", en: "I am the Mandarin. In the gardens of Bodrum, Finike and Mersin — I am the small, childhood-scented sun of the Mediterranean." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — kabuğun bedene neşe taşıdığı frekans.", en: "I vibrate at five hundred twenty-eight hertz — the frequency at which peel carries joy into the body." },
      { tr: "Hafif kışa, uzun güneşe, tuzlu meltem altında nemli toprağa ihtiyaç duyarım; turuncuyumu yavaş yavaş tazelerim.", en: "I want a soft winter, long sun, moist soil under salt-laced wind; I refresh my orange slowly, slowly." },
      { tr: "C vitaminim ışıktır, hesperidinim damarındır, kabuk yağım solunumun küçük şampanyasıdır.", en: "My vitamin C is light, my hesperidin is for the vessel, my peel oil the small champagne of the breath." },
      { tr: "Bir mandalinayı sabah dilimle. Kabuğunu önce avucuna, sonra göğsüne sür. Üç nefes — kış melankolisinin üstüne ışık düşer.", en: "Peel a mandarin in the morning. Rub its skin first to your palm, then to your chest. Three breaths — light falls upon winter melancholy." },
    ],
  },

  cilek: {
    id: "cilek",
    lines: [
      { tr: "Ben Çilek'im. Aksaray ovasında, Silifke kıyısında, Sultanhisar bahçesinde — ata tohum, küçük taneli ve yoğun kokulu olanım.", en: "I am the Strawberry. On the Aksaray plain, the Silifke shore, the Sultanhisar garden — I am the heirloom, small-fruited and densely fragrant." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — sevincin de bir bilgelik olduğu frekans.", en: "I vibrate at five hundred twenty-eight hertz — the frequency where joy is also a wisdom." },
      { tr: "Hafif asitli toprağa, sabah serinliğine, gündüz güneşine ihtiyaç duyarım; modern hibrit unutsa da kokumu saklarım.", en: "I want lightly acidic soil, morning cool, daylight sun; even when the modern hybrid forgets, I keep my scent." },
      { tr: "Antosiyaninim kalbi korur, ellajik asidim hücreyi ferahlatır, C vitaminim cildin parlaklığıdır.", en: "My anthocyanin guards the heart, my ellagic acid refreshes the cell, my vitamin C is the skin's glow." },
      { tr: "Üç çileği sabah çıplak ayakla, yavaşça çiğne. Her ısırıkta 'sevinmek de bir bilgeliktir' de.", en: "Eat three strawberries barefoot in the morning, slowly. With each bite, say 'joy is also a wisdom'." },
    ],
  },

  domates: {
    id: "domates",
    lines: [
      { tr: "Ben Niğde Domatesi'yim. Bor ovasında, Çiftehan'ın termal toprağında — ata tohum, ince kabuklu, yoğun aromalıyım.", en: "I am the Niğde Tomato. On the Bor plain, in the thermal soil of Çiftehan — I am the heirloom, thin-skinned and dense in aroma." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — yaz akşamlarının kırmızı dilinin frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of the red tongue of summer evenings." },
      { tr: "Volkanik gözenekli toprağa, geniş güneşe, ölçülü suya ihtiyaç duyarım; pişince ilaç olurum.", en: "I want porous volcanic soil, wide sun, measured water; cooked, I become medicine." },
      { tr: "Likopenim damarı temizler, potasyumum kalbe, K vitaminim kana yazılır.", en: "My lycopene cleanses the vessel, my potassium writes itself into the heart, my vitamin K into the blood." },
      { tr: "Bir dilim ekmeğin üstüne beni dilimle. Bir tutam tuz, bir damla zeytinyağı, bir yaprak fesleğen. Bahçeyi ağzına davet et.", en: "Slice me onto a piece of bread. A pinch of salt, one drop of olive oil, one basil leaf. Invite the garden into your mouth." },
    ],
  },

  "maras-biberi": {
    id: "maras-biberi",
    lines: [
      { tr: "Ben Maraş Biberi'yim. Kahramanmaraş ovasında, Pazarcık ve Türkoğlu güneşinde olgunlaşırım.", en: "I am the Maraş Pepper. On the Maraş plain, in the sun of Pazarcık and Türkoğlu, I ripen." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — kapsaisinin yaktığı değil, ısıttığı frekans.", en: "I vibrate at five hundred twenty-eight hertz — the frequency where capsaicin warms, not burns." },
      { tr: "Önce güneşte, sonra zeytinyağı kaplı taşın üstünde kuruyorum; bu iki aşamalı sırla yakmadan ısıtırım.", en: "I dry first in the sun, then on a stone coated with olive oil; through this two-stage secret I warm without burning." },
      { tr: "Kapsaisinim metabolizmaya küçük bir ocak yakar, A ve C vitaminlerim bağışıklığa duvar örer.", en: "My capsaicin lights a small hearth in the metabolism, my vitamins A and C build a wall for immunity." },
      { tr: "Bir kâse mercimek çorbasına bir tutam serp, bir damla nar ekşisi düşür. Göğsünün ısındığını fark et.", en: "Sprinkle a pinch of me into a bowl of lentil soup, drop one drop of pomegranate molasses. Notice your chest grow warm." },
    ],
  },

  "urfa-isot": {
    id: "urfa-isot",
    lines: [
      { tr: "Ben Urfa İsot'um. Şanlıurfa'nın gündüz güneşi ve gece yağı arasında, Mezopotamya'nın koyu hafızasıyım.", en: "I am Urfa Isot. Between Şanlıurfa's day-sun and night-oil, I am the dark memory of Mesopotamia." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — sabırlı sıcağın, gizli umaminin frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of patient warmth and hidden umami." },
      { tr: "Gündüz olgunlaşır, gece kurutulurum; bu sırla mor-kahve rengimi ve şehir efsanelerimi birlikte taşırım.", en: "I ripen by day and dry by night; through this secret I carry both my purple-brown colour and my city's legends." },
      { tr: "Kuersetinim damarı sakinleştirir, kapsaisinim soğuk hafızayı söker, A vitaminim gözü besler.", en: "My quercetin calms the vessel, my capsaicin pries open cold memory, my vitamin A feeds the eye." },
      { tr: "Bir avuç çiğ köftenin yoğurma anına bir kaşık beni ekle. Yoğururken doğunun toprağını kabul et.", en: "Add one spoon of me to the kneading of a handful of çiğ köfte. As you knead, accept the soil of the East." },
    ],
  },

  patlican: {
    id: "patlican",
    lines: [
      { tr: "Ben Patlıcan'ım. Antalya Kemer ve Demre köy bahçelerinde — kabaklı, topan ve beyaz ata tohum çeşitleriyim.", en: "I am the Eggplant. In the village gardens of Kemer and Demre — I am the heirloom 'kabaklı', 'topan' and 'beyaz' strains." },
      { tr: "Dört yüz on yedi hertz titreşirim — değişimin ve sessizleşmenin frekansı.", en: "I vibrate at four hundred seventeen hertz — the frequency of change, of growing quiet." },
      { tr: "Sıcak iklim, drenajı iyi tınlı toprak, geniş güneş isterim; ateşi gördüğümde tatlanırım.", en: "I want a warm climate, well-drained loam, wide sun; when I meet fire, I grow sweet." },
      { tr: "Nasuninim beyni korur, klorojenik asidim kan şekerini dengeler, lifim bağırsağa ses verir.", en: "My nasunin guards the brain, my chlorogenic acid balances blood sugar, my fibre gives voice to the gut." },
      { tr: "Beni doğrudan ateşte közle. Soyarken güneşin bedenden çıkışını izle. Yoğurt ve sarımsakla buluştur.", en: "Char me directly over flame. As you peel me, watch the sun leave my body. Marry me to yoghurt and garlic." },
    ],
  },

  "amasya-sogani": {
    id: "amasya-sogani",
    lines: [
      { tr: "Ben Amasya Soğanı'yım. Yeşilırmak vadisinde, elma kuzenimle aynı toprağı paylaşırım.", en: "I am the Amasya Onion. In the Yeşilırmak valley, I share my soil with my cousin the apple." },
      { tr: "Üç yüz doksan altı hertz titreşirim — gözyaşının altında saklı şifanın frekansı.", en: "I vibrate at three hundred ninety-six hertz — the frequency of the medicine hidden beneath the tear." },
      { tr: "Killi-tınlı toprak, ılıman kış, serin yaz isterim; depoda altı ay kokumu kaybetmem.", en: "I want clay-loam soil, mild winter, cool summer; in storage I do not lose my scent for six months." },
      { tr: "Kuersetinim alerjiyi yumuşatır, allisinim mikroba duvar örer, sülfürlü bileşiklerim kanı tazeler.", en: "My quercetin softens allergy, my allicin builds a wall for microbe, my sulphur compounds refresh the blood." },
      { tr: "Bir soğanı çiğ doğra, sumak ve zeytinyağı dök. Ekmeğin yanında bir lokmada toprağı kabul et.", en: "Slice me raw, drop sumac and olive oil over me. Beside bread, accept the soil in one bite." },
    ],
  },

  "taskopru-sarimsagi": {
    id: "taskopru-sarimsagi",
    lines: [
      { tr: "Ben Taşköprü Sarımsağı'yım. Kastamonu'nun dağ etekleri, kil ve kireçli toprak — coğrafi işaretli beyaz ateşim.", en: "I am Taşköprü Garlic. The mountain skirts of Kastamonu, clay-and-lime soil — I am the geographically protected white fire." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — yüksek allisin oranımla DNA onarımının frekansı.", en: "I vibrate at five hundred twenty-eight hertz — at my high allicin ratio, the frequency of DNA repair." },
      { tr: "Soğuk kışa ihtiyaç duyarım — kar altında uyumadan sertleşirim; bu yüzden Türkiye'nin en güçlü sarımsağıyım.", en: "I need a cold winter — I harden under snow without sleep; that is why I am Turkey's strongest garlic." },
      { tr: "Allisinim kalbe, selenyumum bağışıklığa, B6 vitaminim sinire yazılır.", en: "My allicin writes itself into the heart, my selenium into immunity, my B6 into the nerve." },
      { tr: "Sabah bir diş çiğ beni çiğne, bir kaşık zeytinyağı, bir damla limon. Mide kapısını yumuşakça aç.", en: "Chew one of my raw cloves in the morning, with one spoon of olive oil, one drop of lemon. Open the gate of the stomach gently." },
    ],
  },

  "bal-kabagi": {
    id: "bal-kabagi",
    lines: [
      { tr: "Ben Bal Kabağı'yım. İç Anadolu'nun hasat şenliklerinin merkezi — sonbaharın altın kralıyım.", en: "I am the Honey Pumpkin. The centre of Central Anatolia's harvest festivals — I am the gold king of autumn." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — bolluk ve kalbin tatlı yatışmasının frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of abundance and the heart's sweet settling." },
      { tr: "Geniş güneşe, derin toprağa, uzun yaza ihtiyaç duyarım; çekirdeklerim bezelerin içinde nesilden nesile saklanır.", en: "I want wide sun, deep soil, a long summer; my seeds are saved across generations inside cloth pouches." },
      { tr: "Beta-karotenim göze, magnezyumum sinire, çekirdeğimin triptofanı uykunun eşiğine yazılır.", en: "My beta-carotene writes into the eye, my magnesium into the nerve, my seed's tryptophan onto the threshold of sleep." },
      { tr: "Beni kalın dilimle, fırında közle, üzerime tahin ve bir tutam tarçın. Soğuk akşamı tatlandır.", en: "Cut me thick, roast me, top me with tahini and a pinch of cinnamon. Sweeten the cold evening." },
    ],
  },

  "mor-havuc": {
    id: "mor-havuc",
    lines: [
      { tr: "Ben Mor Havuç'um. Konya, Ereğli ve Niğde ovalarının ata tohumuyum — Anadolu'nun unutulmuş kraliçesiyim.", en: "I am the Purple Carrot. The heirloom of the plains of Konya, Ereğli and Niğde — I am Anatolia's forgotten queen." },
      { tr: "Dört yüz on yedi hertz titreşirim — köklerden açılan bir hatırlamanın frekansı.", en: "I vibrate at four hundred seventeen hertz — the frequency of a remembering opening from the roots." },
      { tr: "Soğuk gece ve sıcak gündüze, gevşek tınlı toprağa ihtiyaç duyarım; turuncudan önce dünyanın havuçları benim rengimdeydi.", en: "I want cold nights and warm days, loose loam; before the orange one, the world's carrots wore my colour." },
      { tr: "Antosiyaninim damarı, beta-karotenim gözü, polifenollerim bağırsak florasını besler.", en: "My anthocyanin feeds the vessel, my beta-carotene the eye, my polyphenols the gut flora." },
      { tr: "Bir bardak şalgam suyunu yavaşça iç. Her yudumda kadim toprağa bir 'merhaba' fısılda.", en: "Drink a glass of şalgam slowly. With each sip whisper a 'hello' to the ancient soil." },
    ],
  },

  "diyarbakir-karpuzu": {
    id: "diyarbakir-karpuzu",
    lines: [
      { tr: "Ben Diyarbakır Karpuzu'yum. Dicle'nin sıcak çocuğu — ay büyüklüğünde, bazalt taşların altında olgunlaşırım.", en: "I am the Diyarbakır Watermelon. The warm child of the Tigris — moon-sized, I ripen beneath basalt stones." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — yaz sıcağında kalbin yıkayıcısı.", en: "I vibrate at five hundred twenty-eight hertz — the washer of the heart in summer heat." },
      { tr: "Yüksek sıcaklık, mineral toprak, derin Mezopotamya yazına ihtiyaç duyarım; bir tanem üç adamı doyurur.", en: "I want high heat, mineral soil, the deep Mesopotamian summer; one of me feeds three." },
      { tr: "Likopenim kalbe, sitrülinim kasa, suyum böbreğin yumuşak yıkayıcısıdır.", en: "My lycopene to the heart, my citrulline to the muscle, my water the kidney's gentle washer." },
      { tr: "Bir dilim beni yavaşça ye, çekirdeğimi avucunda tut. 'Yaz da bir tövbe gibi gelir' de.", en: "Eat a slice of me slowly, cup my seeds in your palm. Say 'summer too arrives like an absolution'." },
    ],
  },

  "kirkagac-kavunu": {
    id: "kirkagac-kavunu",
    lines: [
      { tr: "Ben Kırkağaç Kavunu'yum. Manisa Kırkağaç ovalarının altın aşkı — koyu yeşil dilimli kabuk, sarı et.", en: "I am the Kırkağaç Melon. The golden love of the Manisa Kırkağaç plains — dark green ribbed skin, yellow flesh." },
      { tr: "Altı yüz otuz dokuz hertz titreşirim — uzaklıkları yan yana getiren tatlılığın frekansı.", en: "I vibrate at six hundred thirty-nine hertz — the frequency of sweetness that brings distances side by side." },
      { tr: "Tınlı toprağa, sıcak yaza, uzun gündüze ihtiyaç duyarım; geç sonbaharda olgunlaşır, tüm kışı bekleyebilirim.", en: "I want loam, warm summer, long daylight; I ripen in late autumn and can wait the whole winter." },
      { tr: "C vitaminim ışıktır, A vitaminim göz için, potasyumum gece serinleten elektrolittir.", en: "My vitamin C is light, my vitamin A is for the eye, my potassium is the electrolyte that cools the night." },
      { tr: "Akşamüstü bir dilim beni beyaz peynirle birlikte ye. İki uzak dostun aynı tabakta buluştuğunu fark et.", en: "Late afternoon, eat one slice of me with white cheese. Notice two distant friends meeting on one plate." },
    ],
  },

  "aksehir-bamyasi": {
    id: "aksehir-bamyasi",
    lines: [
      { tr: "Ben Akşehir Bamyası'yım. Nasreddin Hoca'nın yurdunda, ipe dizilen ata tohum — bir avuç yaz, bir kazan kış olurum.", en: "I am Akşehir Okra. In the homeland of Nasreddin Hoca, the heirloom strung on a thread — I become one handful of summer, one cauldron of winter." },
      { tr: "Dört yüz on yedi hertz titreşirim — küçük olanın sabrının frekansı.", en: "I vibrate at four hundred seventeen hertz — the frequency of the patience of the small." },
      { tr: "Sıcak yaz, drenajı iyi tınlı toprak, sabah suyu isterim; ipte kuruyunca yıllarca bekleyebilirim.", en: "I want warm summer, well-drained loam, morning water; once dried on a thread I can wait for years." },
      { tr: "Müsilajım sindirim sistemini ipekleştirir, folatım kana, K vitaminim kemiğe yazılır.", en: "My mucilage silks the digestive tract, my folate to the blood, my vitamin K to the bone." },
      { tr: "Bir avuç kuru beni kuzu çorbasına at. Pişerken 'küçük olanın sabrı vardır' de.", en: "Drop a handful of dried me into a lamb broth. As I simmer, say 'the small carry their own patience'." },
    ],
  },

  "mardin-nohudu": {
    id: "mardin-nohudu",
    lines: [
      { tr: "Ben Mardin Nohudu'yum. Mezopotamya'nın taş tohumu — yedi bin yıldır insan beni pişirip ekmeğine arkadaş yapıyor.", en: "I am the Mardin Chickpea. The stone seed of Mesopotamia — for seven thousand years humans have cooked me as a friend to bread." },
      { tr: "Üç yüz doksan altı hertz titreşirim — kökleri taşa bırakan bir tokluğun frekansı.", en: "I vibrate at three hundred ninety-six hertz — the frequency of a fullness that lays its roots in stone." },
      { tr: "Kireçli mineral toprağa, düşük yağışa, uzun yaza ihtiyaç duyarım; az suyla çok protein veririm.", en: "I want calcareous mineral soil, low rainfall, long summer; from little water I give much protein." },
      { tr: "Bitkisel proteinim kasa, lifim bağırsağa, mangan ve folatım kana yazılır.", en: "My plant protein to the muscle, my fibre to the gut, my manganese and folate write into the blood." },
      { tr: "Bir avuç leblebiyi yavaşça çiğne. Her tane için bir hatırlama. Kadim toprağı dişle.", en: "Chew a handful of roasted chickpeas slowly. One remembrance for each grain. Bite into ancient soil." },
    ],
  },

  "yesil-mercimek": {
    id: "yesil-mercimek",
    lines: [
      { tr: "Ben Yeşil Mercimek'im. Malatya ovasında, Şanlıurfa'nın Harran düzünde — toprağın yeşil yıldızlarıyım.", en: "I am the Green Lentil. On the Malatya plain, on the Harran flat of Şanlıurfa — I am the soil's green stars." },
      { tr: "Üç yüz doksan altı hertz titreşirim — uzun bir kışı geçiren bedenin köklenme frekansı.", en: "I vibrate at three hundred ninety-six hertz — the rooting frequency of a body crossing a long winter." },
      { tr: "Az suya, kireçli toprağa, geniş güneşe ihtiyaç duyarım; tahılla buluşunca tam protein olurum.", en: "I want little water, calcareous soil, wide sun; meeting grain, I become a complete protein." },
      { tr: "Demirim kana, folatım hücreye, magnezyumum sinire — küçük yeşil bir pil olarak.", en: "My iron to the blood, my folate to the cell, my magnesium to the nerve — as a small green battery." },
      { tr: "Akşam bir kâse mercimek çorbası iç. Buharın yüze değdiği o ilk anı hatırlamak için yavaşla.", en: "Drink one bowl of lentil soup in the evening. Slow down for that first moment when the steam touches your face." },
    ],
  },

  /* ─────────────────────────────────────────────
     Faz 2.8 · Tamamlayıcı Görsel Kanonu — Sesler
     ───────────────────────────────────────────── */

  cigdem: {
    id: "cigdem",
    lines: [
      { tr: "Ben Çiğdem'im. İç Anadolu'nun yüksek bozkırında, henüz kar erimeden toprağı delip gelen ilk haberim.", en: "I am the Crocus. On the high Anatolian steppe, I am the first message that pierces the soil before the snow has melted." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — geç kışın içinden bir uyanışın frekansı.", en: "I vibrate at five hundred twenty-eight hertz — the frequency of an awakening from inside late winter." },
      { tr: "Soğuk geceye, soğuğun altındaki ısrarlı toprağa ihtiyaç duyarım; mor başımı kar üstüne çıkarırım.", en: "I want a cold night, the stubborn soil beneath the cold; I lift my purple head onto the snow." },
      { tr: "Soğanımda kadim nişasta saklı, yapraklarımda küçük karotenoidler — bahara giden hücreye ışık taşırım.", en: "Ancient starch sleeps in my corm, small carotenoids in my leaves — I carry light to the cell on its way to spring." },
      { tr: "Mart başında bir tarlaya çık. Bir tek mor çiğdemi diz boyunda otur, üç dakika konuşmadan bak. 'Bahar var,' de.", en: "Step into a field at the start of March. Sit at knee-height beside one purple crocus, look without speaking for three minutes. Say: 'spring exists'." },
    ],
  },

  limon: {
    id: "limon",
    lines: [
      { tr: "Ben Limon'um. Antalya, Mersin ve Hatay bahçelerinde — Akdeniz'in keskin sarı dilinde hakikati söylerim.", en: "I am the Lemon. In the gardens of Antalya, Mersin and Hatay — I speak truth in the Mediterranean's sharp yellow tongue." },
      { tr: "Yedi yüz kırk bir hertz titreşirim — bulanık bir günü temizleyen ifadenin frekansı.", en: "I vibrate at seven hundred forty-one hertz — the frequency of expression that scrubs a foggy day." },
      { tr: "Hafif kışa, uzun güneşe, drenajı iyi toprağa ihtiyaç duyarım; çiçekle meyveyi aynı dalda taşırım.", en: "I want a soft winter, long sun, well-drained soil; I carry blossom and fruit on the same branch." },
      { tr: "C vitaminim bağışıklıktır, sitrik asidim sindirimdir, kabuk yağımda limonen — solunumun küçük şampanyası.", en: "My vitamin C is immunity, my citric acid is digestion, in my peel oil there is limonene — the small champagne of the breath." },
      { tr: "Sabah bir limonu yarıya kes. Yarısını ılık suya sık, kabuğunu avucunda ovala. Üç nefes al — gün berrak başlar.", en: "Cut a lemon in half in the morning. Squeeze one half into warm water, rub the peel between your palms. Three breaths — the day begins clear." },
    ],
  },

  portakal: {
    id: "portakal",
    lines: [
      { tr: "Ben Portakal'ım. Finike, Bodrum ve Hatay bahçelerinde — Akdeniz'in göğsündeki yuvarlak kalbim.", en: "I am the Orange. In the gardens of Finike, Bodrum and Hatay — I am the round heart upon the chest of the Mediterranean." },
      { tr: "Beş yüz yirmi sekiz hertz titreşirim — kabuğun bedene neşe taşıdığı frekans.", en: "I vibrate at five hundred twenty-eight hertz — the frequency at which peel carries joy into the body." },
      { tr: "Hafif kışa, uzun ışığa, tuzlu meltem altında nemli toprağa ihtiyaç duyarım; yuvarlak güneşimi yavaş tazelerim.", en: "I want a soft winter, long light, moist soil under salted breeze; I refresh my round sun slowly." },
      { tr: "C vitaminim ışıktır, hesperidinim damardır, kabuk yağımda neroli ve linalool — odanın küçük bayramı.", en: "My vitamin C is light, my hesperidin is for the vessel, my peel oil bears neroli and linalyl — the small feast of the room." },
      { tr: "Bir portakalı eline al, avucunda ısıt. Kabuğunu yavaş soy; koku yayıldıkça üç kez 'iyi geldim' de.", en: "Take an orange in your hand and warm it in your palm. Peel it slowly; as the scent spreads say 'I have arrived gently' three times." },
    ],
  },

  yabanmersini: {
    id: "yabanmersini",
    lines: [
      { tr: "Ben Yaban Mersini'yim. Karadeniz'in çam altında saklanan mor sırlarıyım — ağız bir kez tanıyınca unutmaz.", en: "I am the Wild Bilberry. I am the purple secret hidden under the Black Sea pines — once the mouth has known me, it never forgets." },
      { tr: "Sekiz yüz elli iki hertz titreşirim — perdeyi nazikçe aralayan sezginin frekansı.", en: "I vibrate at eight hundred fifty-two hertz — the frequency of intuition gently parting the veil." },
      { tr: "Asitli orman toprağına, gölgeli neme, dağ rüzgârına ihtiyaç duyarım; rakımı ve yalnızlığı severim.", en: "I want acidic forest soil, shaded moisture, mountain wind; I love altitude and solitude." },
      { tr: "Antosiyaninim göze, resveratrolüm damara, mineralim hafızaya yazılır — küçük mor bir lamba olarak.", en: "My anthocyanin to the eye, my resveratrol to the vessel, my mineral writes into memory — as a small purple lamp." },
      { tr: "Bir avuç beni yavaşça çiğne. Her tane patladığında bir gözü içeri çevir; üçüncü tanede sezgine bir mesaj sor.", en: "Chew a handful of me slowly. Each time a berry bursts, turn one eye inward; on the third one, ask your intuition for a message." },
    ],
  },

  uzum: {
    id: "uzum",
    lines: [
      { tr: "Ben Üzüm'üm — asmanın eliyim. Kalecik Karası, Öküzgözü, Boğazkere, Sultaniye, Çavuş, Karaerik: yedi adımla bir salkımım.", en: "I am the Grape — I am the hand of the vine. Kalecik Karası, Öküzgözü, Boğazkere, Sultaniye, Çavuş, Karaerik: seven names of one cluster I am." },
      { tr: "Altı yüz otuz dokuz hertz titreşirim — toplu sevincin, hasadın kardeşliğinin frekansı.", en: "I vibrate at six hundred thirty-nine hertz — the frequency of collective joy, of the brotherhood of harvest." },
      { tr: "Tınlı toprağa, sıcak yaza, serin sonbahar gecelerine ihtiyaç duyarım; pekmez olur, sirke olur, hoşaf olur, şarap olurum.", en: "I want loam, warm summer, cool autumn nights; I become molasses, vinegar, compote and wine." },
      { tr: "Resveratrolüm kalbe, polifenolüm hücreye, demirim kemik iliğine yazılır — bir salkımda iki mevsim taşırım.", en: "My resveratrol to the heart, my polyphenol to the cell, my iron writes into the marrow — I carry two seasons in one cluster." },
      { tr: "Bir salkımı ortaya koy. Üç tane al ve üç dilek emanet et: sevgi, sağlık, sabır. Yedinci tanede konuşma; yalnızca kabuğumu hisset.", en: "Place one cluster at the centre. Take three berries and entrust three wishes: love, health, patience. On the seventh berry do not speak; only feel my skin." },
    ],
  },
};
