/**
 * CAELINUS — Avatar Testi · "Bu evrende nerede yaşıyorsun?" (tek doğru kaynak · saf veri + saf skorlama)
 *
 * Çıktı 5 değer: Ana Bilinç · İkincil Bilinç · Düştüğün Gölge · Kapın · Çağrın
 * + ŞU AN (okuma) + SONRAKİ ADIM (Kapı'dan türeyen bu-hafta eylemi).
 *
 * Canon kaynaklar:
 *   • CAELINUS_AVATAR_TEST.md        (test tasarımı, sonuç kartı, formüller)
 *   • CAELINUS_LIGHT_SHADOW_SYSTEM.md (8 bilinç: ışık/gölge adları)
 *   • CAELINUS_SHADOW_BIBLE.md        (Kapı = gölgenin panzehiri)
 *   • data/goddess-archetypes.ts      (arketip eşlemesi — sonuç → avatar)
 *
 * KRİTİK:
 *   • Saf veri + saf fonksiyon. server-only / browser API import ETMEZ.
 *   • Test YÖNLENDİRMEZ: sorular district sormaz, davranıştan frekans çıkarır.
 *   • Etik: teşhis değil, AYNA. Her sonuç bir KAPI (umut + yön) sunar.
 */

import { AVATAR_DISTRICT_ORDER, type AvatarDistrictId } from "./avatar-districts";

/* ────────── Tipler ────────── */

export type TestAxis = "light" | "shadow";

export type TestOption = {
  /** Gündelik, herkesin anlayacağı ifade (sorularda gösterilen). */
  label: string;
  /** Şiirsel alternatif (opsiyonel UI varyasyonu). */
  poetic?: string;
  /** Bu seçeneğin puan yazdığı district. */
  district: AvatarDistrictId;
};

export type TestQuestion = {
  id: string;
  axis: TestAxis;
  prompt: string;
  options: TestOption[];
};

/** Kullanıcı cevapları: questionId → seçilen option index. */
export type TestAnswers = Record<string, number>;

export type AvatarTestResult = {
  primary: AvatarDistrictId;
  secondary: AvatarDistrictId;
  shadow: AvatarDistrictId;
  gate: AvatarDistrictId;
  calling: string;
  /** ŞU AN — ışık+gölge tek cümle. */
  reading: string;
  /** SONRAKİ ADIM — Kapı'dan türeyen bu-hafta eylemi. */
  nextStep: string;
  lightScores: Record<AvatarDistrictId, number>;
  shadowScores: Record<AvatarDistrictId, number>;
};

/* ────────── 8 Bilinç — Işık / Gölge adları (Light/Shadow System) ────────── */

export const CONSCIOUSNESS: Record<AvatarDistrictId, { light: string; shadow: string }> = {
  source:    { light: "Doğuş",          shadow: "Doğuşa Bağımlılık" },
  mirror:    { light: "Kendini Görmek", shadow: "Kararsızlık" },
  sanri:     { light: "Bilgelik",       shadow: "Bilgide Kaybolmak" },
  gaia:      { light: "Yaşam",          shadow: "Kendini Unutmak" },
  bazaar:    { light: "Paylaşım",       shadow: "Onay Bağımlılığı" },
  atelier:   { light: "Yaratım",        shadow: "Tamamlayamamak" },
  sanctuary: { light: "Şifa",           shadow: "Şifadan Çıkamamak" },
  temple:    { light: "Huzur",          shadow: "Kaçış" },
};

/** Işık özü — "neden geldin". */
const LIGHT_ESSENCE: Record<AvatarDistrictId, string> = {
  source:    "Kendini hatırlamak",
  mirror:    "Hakikati görüp seçmek",
  sanri:     "Görmek ve anlamak",
  gaia:      "Yaşamı büyütmek",
  bazaar:    "Paylaşmak ve birleştirmek",
  atelier:   "Kurmak ve ustalaşmak",
  sanctuary: "İyileştirmek",
  temple:    "Bırakıp huzura ermek",
};

/** Gölge özü — "neye düştün". */
const SHADOW_ESSENCE: Record<AvatarDistrictId, string> = {
  source:    "geçmişe takıldın",
  mirror:    "karar veremiyorsun",
  sanri:     "bilgide ve yorumda kayboldun",
  gaia:      "kendini unuttun",
  bazaar:    "onay aramakta kayboldun",
  atelier:   "hiçbir şeyi bitiremiyorsun",
  sanctuary: "sığınakta saklanıyorsun",
  temple:    "kaçıp izole oldun",
};

/* ────────── Kapı = gölgenin panzehiri (founder eşlemesi) ────────── */

export const GATE_MAP: Record<AvatarDistrictId, AvatarDistrictId> = {
  source:    "atelier",   // geçmişe/doğuşa bağımlılık → ileriye kur
  sanri:     "gaia",      // bilgide kaybolmak → yaşa, köklen
  mirror:    "atelier",   // kararsızlık → seç ve kur
  gaia:      "mirror",    // kendini unutmak → kendine bak
  bazaar:    "source",    // onay bağımlılığı → kaynağa dön
  atelier:   "temple",    // tamamlayamamak → bırak
  sanctuary: "bazaar",    // şifadan çıkamamak → hayata/topluluğa dön
  temple:    "source",    // kaçış → yeniden doğ
};

/* ────────── Çağrı (Ana Bilinç → vokasyon) ────────── */

export const CALLING_MAP: Record<AvatarDistrictId, string> = {
  source:    "İsim Bekçisi",
  mirror:    "Eşik Rehberi",
  sanri:     "Oracle",
  gaia:      "Şifacı",
  bazaar:    "İlham Perisi",
  atelier:   "Usta",
  sanctuary: "Koruyucu-Şifacı",
  temple:    "Sessiz Bekçi",
};

/* ────────── Sonraki Adım (Kapı → bu-hafta eylemi) ────────── */

export const NEXT_STEP_MAP: Record<AvatarDistrictId, string> = {
  source:    "Bu hafta dışarıdan onay arama; kendine dön, ne istediğini yaz.",
  sanri:     "Bu hafta cevabı dışarıda arama; bir sabah sezgine kulak ver.",
  mirror:    "Bu hafta başkalarını beslemeyi bir an bırak; kendine bak, bir kararı ertelemeden ver.",
  gaia:      "Bu hafta düşünmeyi bırak; bir şey yap, yaşa, dokun.",
  bazaar:    "Bu hafta yalnız kalma; birine ulaş, paylaş.",
  atelier:   "Bu hafta yeni bir şey başlatma; yarım kalanlardan birini bitir ya da bırak.",
  sanctuary: "Bu hafta kendini taşıma; birinden yardım iste, dinlen.",
  temple:    "Bu hafta bitirmeye çalışma; bırakmayı çalış.",
};

/* ────────── Soru Bankası — 6 ışık + 6 gölge ────────── */

export const AVATAR_TEST_QUESTIONS: TestQuestion[] = [
  /* ── IŞIK (doğal hâl) ── */
  {
    id: "L1",
    axis: "light",
    prompt: "Boş bir günün var. İçinden gelen İLK şey ne?",
    options: [
      { label: "Kendime zaman ayırıp düşünmek", poetic: "Suya bakıp kendimi hatırlamak", district: "source" },
      { label: "Bir rüyamı/sezgimi merak etmek", poetic: "Bir işaretin peşine düşmek", district: "sanri" },
      { label: "Bir bitkiyle ilgilenmek, bir şey üretmek", poetic: "Bir şey büyütmek", district: "gaia" },
      { label: "Yalnız ve sessiz kalmak", poetic: "Hiçbir şey yapmadan dinginleşmek", district: "temple" },
    ],
  },
  {
    id: "L2",
    axis: "light",
    prompt: "Seni en çok ne canlandırır / besler?",
    options: [
      { label: "Bir kararı netleştirmek", poetic: "İki tarafı da görüp seçmek", district: "mirror" },
      { label: "Arkadaşlarla buluşmak, paylaşmak", poetic: "Bir araya getirmek", district: "bazaar" },
      { label: "Bir şey tasarlamak, çözmek", poetic: "Ustalaşmak", district: "atelier" },
      { label: "Birini iyileştirmek, sarmalamak", poetic: "Şefkat vermek", district: "sanctuary" },
    ],
  },
  {
    id: "L3",
    axis: "light",
    prompt: "İnsanlar sana en çok ne için gelir?",
    options: [
      { label: "Bir şeyi büyütmem/beslemem için", district: "gaia" },
      { label: "Bir planı/çözümü kurmam için", district: "atelier" },
      { label: "Yaralarını sarmam için", district: "sanctuary" },
      { label: "Altındaki anlamı okumam için", district: "sanri" },
    ],
  },
  {
    id: "L4",
    axis: "light",
    prompt: "Sana göre bilgelik nedir?",
    options: [
      { label: "Kendine dürüst olmak", poetic: "Özünü hatırlamak", district: "source" },
      { label: "Doğru anı seçebilmek", poetic: "Görüp karar vermek", district: "mirror" },
      { label: "Susmayı bilmek", poetic: "İç huzur", district: "temple" },
      { label: "Cömertçe paylaşmak", district: "bazaar" },
    ],
  },
  {
    id: "L5",
    axis: "light",
    prompt: "Bir şeyi yaparken en çok ne sana iyi gelir?",
    options: [
      { label: "Bir şeyin büyüdüğünü görmek", district: "gaia" },
      { label: "İnsanlarla paylaşmak", district: "bazaar" },
      { label: "Bir şeyi kusursuz kurmak", district: "atelier" },
      { label: "Kendimle baş başa kalmak", poetic: "Yeniden başlamak", district: "source" },
    ],
  },
  {
    id: "L6",
    axis: "light",
    prompt: "Hangi cümle sana en yakın?",
    options: [
      { label: "Her şeyde bir anlam ararım", district: "sanri" },
      { label: "Önce başkalarına bakarım", district: "sanctuary" },
      { label: "Her şeyi iki yönden tartarım", district: "mirror" },
      { label: "Gürültüden uzak olmayı severim", district: "temple" },
    ],
  },

  /* ── GÖLGE (stres hâli) ── */
  {
    id: "S1",
    axis: "shadow",
    prompt: "Zorlandığında İLK düştüğün tuzak?",
    options: [
      { label: "Hiçbir şeyi bitirememek", poetic: "Yeterince iyi bulmamak", district: "atelier" },
      { label: "Aşırı düşünmek, yorumlamak", poetic: "Bilgide kaybolmak", district: "sanri" },
      { label: "Donup kalmak, değişememek", district: "gaia" },
      { label: "Onay aramak", poetic: "Başkalarının gözünde kaybolmak", district: "bazaar" },
    ],
  },
  {
    id: "S2",
    axis: "shadow",
    prompt: "Tamamen tükendiğinde nereye düşersin?",
    options: [
      { label: "Geçmişe, 'keşke'lere takılırım", district: "source" },
      { label: "Karar veremem, eşikte donarım", district: "mirror" },
      { label: "Kendimi ihmal edip başkalarını taşırım", district: "sanctuary" },
      { label: "Kaçar, izole olurum", district: "temple" },
    ],
  },
  {
    id: "S3",
    axis: "shadow",
    prompt: "Bir şeyi erteliyorsan sebebi genelde?",
    options: [
      { label: "Yeterince mükemmel değil", district: "atelier" },
      { label: "Karar veremiyorum", district: "mirror" },
      { label: "Anlamını/doğrusunu çözemedim", district: "sanri" },
      { label: "Bırakmak/bitirmek istemiyorum", district: "temple" },
    ],
  },
  {
    id: "S4",
    axis: "shadow",
    prompt: "Stres altında en sık yaptığın?",
    options: [
      { label: "Herkesi memnun etmeye çalışırım", district: "bazaar" },
      { label: "Herkese bakar, kendimi unuturum", district: "sanctuary" },
      { label: "Aynı yerde sıkışıp kalırım", district: "gaia" },
      { label: "Eskiyi özler, geri dönmek isterim", district: "source" },
    ],
  },
  {
    id: "S5",
    axis: "shadow",
    prompt: "Seni en çok ne yıpratır?",
    options: [
      { label: "Bitmeyen 'daha iyi olabilir' hissi", district: "atelier" },
      { label: "Beğenilmeme korkusu", district: "bazaar" },
      { label: "Yalnızlığa fazla kaçmak", district: "temple" },
      { label: "Bir türlü seçememek", district: "mirror" },
    ],
  },
  {
    id: "S6",
    axis: "shadow",
    prompt: "'Keşke...' cümlen genelde neyle biter?",
    options: [
      { label: "...kafamı bu kadar yormasam", district: "sanri" },
      { label: "...değişebilsem, kıpırdayabilsem", district: "gaia" },
      { label: "...kendime de baksam", district: "sanctuary" },
      { label: "...o anı geri alabilsem", district: "source" },
    ],
  },
];

/* ────────── Skorlama (saf fonksiyon) ────────── */

function emptyScores(): Record<AvatarDistrictId, number> {
  const s = {} as Record<AvatarDistrictId, number>;
  for (const d of AVATAR_DISTRICT_ORDER) s[d] = 0;
  return s;
}

/** En yüksek skorlu district'i, eşitlikte AVATAR_DISTRICT_ORDER sırasıyla seç (deterministik). */
function topDistrict(
  scores: Record<AvatarDistrictId, number>,
  exclude: AvatarDistrictId[] = [],
): AvatarDistrictId {
  let best: AvatarDistrictId = AVATAR_DISTRICT_ORDER[0];
  let bestScore = -1;
  for (const d of AVATAR_DISTRICT_ORDER) {
    if (exclude.includes(d)) continue;
    if (scores[d] > bestScore) {
      bestScore = scores[d];
      best = d;
    }
  }
  return best;
}

/** ŞU AN okuması — ışık özü + gölge özü. */
export function buildReading(primary: AvatarDistrictId, shadow: AvatarDistrictId): string {
  return `${LIGHT_ESSENCE[primary]} için buradasın. Ama şu an ${SHADOW_ESSENCE[shadow]}.`;
}

/**
 * Cevapları sonuç kartına çevirir.
 * @param answers questionId → seçilen option index
 */
export function scoreAvatarTest(answers: TestAnswers): AvatarTestResult {
  const lightScores = emptyScores();
  const shadowScores = emptyScores();

  for (const q of AVATAR_TEST_QUESTIONS) {
    const idx = answers[q.id];
    if (idx === undefined || idx < 0 || idx >= q.options.length) continue;
    const opt = q.options[idx];
    if (q.axis === "light") lightScores[opt.district] += 1;
    else shadowScores[opt.district] += 1;
  }

  const primary = topDistrict(lightScores);
  const secondary = topDistrict(lightScores, [primary]);
  const shadow = topDistrict(shadowScores);
  const gate = GATE_MAP[shadow];
  const calling = CALLING_MAP[primary];
  const nextStep = NEXT_STEP_MAP[gate];
  const reading = buildReading(primary, shadow);

  return { primary, secondary, shadow, gate, calling, reading, nextStep, lightScores, shadowScores };
}
