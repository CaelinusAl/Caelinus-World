/**
 * CAELINUS — The Eight Orders · Vatandaşlık Katmanı (saf veri)
 *
 * Kaynak: CAELINUS_CIVILIZATION_BIBLE.md §2 "The Eight Orders" (canon).
 * Üst canon: CAELINUS_WORLD_BIBLE.md (çelişkide World kazanır).
 *
 * ÜÇ DİK EKSEN ilkesi: Order (düzen/vokasyon) — Archetype (kimlik) ve
 * District (bağlam) eksenlerinden BAĞIMSIZDIR. Selene + Oracle Circle +
 * Sanri aynı anda mümkündür. Bu dosya yalnızca Order eksenini tanımlar;
 * archetype `data/goddess-archetypes.ts`, district `data/avatar-districts.ts`.
 *
 * NOT: Saf veri. server-only modül import ETMEZ. Yeni mitoloji YOK —
 * Civilization Bible'da tanımlı 8 düzenin birebir veri karşılığı.
 */

import type { AvatarDistrictId } from "./avatar-districts";

export type OrderId =
  | "daughters-of-selene"
  | "mirror-keepers"
  | "rootwardens"
  | "golden-river-merchants"
  | "makers-circle"
  | "oracle-circle"
  | "stillwater-sisters"
  | "silent-ones";

/** Ortak rank basamağı (Civilization §3). */
export type AvatarRank = "reflection" | "initiate" | "member" | "elder";

/** Çağrı durumu (Civilization §3 — calling/inisiyasyon). */
export type CallingStatus = "wanderer" | "called" | "initiated";

export interface RobePalette {
  /** Cüppe ana rengi. */
  robe: string;
  /** Altın/vurgu izi (Asset Bible: altın damar). */
  accent: string;
  /** Sigil parıltısı (emission). */
  sigilGlow: string;
}

export interface CaelinusOrder {
  id: OrderId;
  /** Düzen adı (görünen). */
  title: string;
  /** Doğal yuva district (data/avatar-districts.ts anahtarı). */
  districtKey: AvatarDistrictId;
  /** Patron tanrıça(lar) — World Bible district tanrıçası; kullanıcının
   *  archetype'ından AYRI bir eksendir (serbest metin). */
  goddessAffinity: string;
  /** Düzenin taşıdığı ruhsal ders (Civilization §2). */
  lesson: string;
  /** Tek karakter sigil (Asset DNA ile render edilir). */
  sigil: string;
  /** Cüppe + altın damar paleti (Asset Bible DNA'sına göre). */
  robePalette: RobePalette;
  /** Üye rank ünvanı / kimlik cümlesi çekirdeği (Civilization §2). */
  avatarTitle: string;
  /** Düzene katılırken verilen başlangıç rank'ı. */
  defaultRank: AvatarRank;
  /** Kısa rol tanımı. */
  description: string;
}

export const ORDERS: Record<OrderId, CaelinusOrder> = {
  "daughters-of-selene": {
    id: "daughters-of-selene",
    title: "Daughters of Selîne",
    districtKey: "source",
    goddessAffinity: "Selîne (& Sophia)",
    lesson: "Bilgiyi yaşamak.",
    sigil: "☾",
    robePalette: { robe: "#e8eaf2", accent: "#f4d58a", sigilGlow: "#b69cff" },
    avatarTitle: "Selîne'nın Kızı",
    defaultRank: "initiate",
    description:
      "Kaynak'ın ve ay tapınaklarının koruyucuları; uygarlığın baş rahibeleri. İlk Yansıma'nın hafızasını taşır, yeni ruhların doğuşuna nezaret ederler.",
  },
  "mirror-keepers": {
    id: "mirror-keepers",
    title: "Mirror Keepers",
    districtKey: "mirror",
    goddessAffinity: "Mira",
    lesson: "Değişmeden ilerlenmez.",
    sigil: "◑",
    robePalette: { robe: "#c9c3e0", accent: "#cfd8e6", sigilGlow: "#a9b6d6" },
    avatarTitle: "Mirror Keeper",
    defaultRank: "initiate",
    description:
      "Mirror Gate'in bekçileri; her ruhu İlk Yansıma'dan geçiren inisiyasyon ustaları. Sana öteki benliğini gösterirler.",
  },
  rootwardens: {
    id: "rootwardens",
    title: "Rootwardens",
    districtKey: "gaia",
    goddessAffinity: "Gaia & Demetra",
    lesson: "Yaşamı beslemeden büyüyemezsin.",
    sigil: "❦",
    robePalette: { robe: "#6f9a5a", accent: "#e7c970", sigilGlow: "#9fe6a0" },
    avatarTitle: "Rootwarden",
    defaultRank: "initiate",
    description:
      "Gaia'nın şifacı-bahçıvanları; bitkisel zekânın, tohum kasalarının, canlı kök ağlarının koruyucuları. Uygarlığı besleyenler.",
  },
  "golden-river-merchants": {
    id: "golden-river-merchants",
    title: "Golden River Merchants",
    districtKey: "bazaar",
    goddessAffinity: "Inanna (& Terazi Muhafızı)",
    lesson: "Her alış bir veriştir; denge.",
    sigil: "⚖",
    robePalette: { robe: "#caa86a", accent: "#ffe9b8", sigilGlow: "#ffd98a" },
    avatarTitle: "Golden River Merchant",
    defaultRank: "initiate",
    description:
      "Bazaar loncası; River of Gold'u districtler arası taşıyan ve Terazi ile yeniden dağıtan tek düzen. Akışın durmamasını sağlarlar.",
  },
  "makers-circle": {
    id: "makers-circle",
    title: "Makers' Circle",
    districtKey: "atelier",
    goddessAffinity: "Artîs & Musa'lar",
    lesson: "Anlamı sen yaratırsın.",
    sigil: "⚒",
    robePalette: { robe: "#b08d6a", accent: "#d8c39a", sigilGlow: "#e8c98a" },
    avatarTitle: "Maker",
    defaultRank: "initiate",
    description:
      "Sanatçılar, avatar-ustaları, biçim verenler. Anlamı esere dönüştürür; bir avatarın görünür kimliğini onlar dokur. (Avatar Studio'nun ruhu.)",
  },
  "oracle-circle": {
    id: "oracle-circle",
    title: "Oracle Circle",
    districtKey: "sanri",
    goddessAffinity: "Hekate",
    lesson: "Sembollerle kendini tanı — her şey bir işaret.",
    sigil: "◉",
    robePalette: { robe: "#4a2d5e", accent: "#c9b6e6", sigilGlow: "#b69cff" },
    avatarTitle: "Oracle",
    defaultRank: "initiate",
    description:
      "SANRI okuyucuları; rüya yorumcuları, sembol çözücüleri, oracle/fal/kod-okuma ustaları. Sana kendi iç haritanı okuturlar.",
  },
  "stillwater-sisters": {
    id: "stillwater-sisters",
    title: "Stillwater Sisters",
    districtKey: "sanctuary",
    goddessAffinity: "Hestia",
    lesson: "Dinlenmek de kutsaldır.",
    sigil: "⚘",
    robePalette: { robe: "#9aa6cf", accent: "#cdbce6", sigilGlow: "#bcd4f5" },
    avatarTitle: "Stillwater Sister",
    defaultRank: "initiate",
    description:
      "Şifacılar, sığınak bekçileri; yorgun ruhları durgun havuzlarda arındırır, dinlendirir. Yolculuğun bir yarış olmadığını hatırlatırlar.",
  },
  "silent-ones": {
    id: "silent-ones",
    title: "Silent Ones",
    districtKey: "temple",
    goddessAffinity: "Nyx",
    lesson: "Sustuğunda her şeyi duyarsın.",
    sigil: "○",
    robePalette: { robe: "#2b2533", accent: "#6b5f86", sigilGlow: "#8f7fb0" },
    avatarTitle: "Silent One",
    defaultRank: "initiate",
    description:
      "Temple of Silence keşişleri; bütünleşmenin, ölüm-yeniden doğuşun, sessizliğin bekçileri. Döngünün kapanışına ve yeni başına nezaret ederler.",
  },
};

/** Civilization §2 gösterim sırası (World Loop ekseni). */
export const ORDER_ORDER: OrderId[] = [
  "daughters-of-selene",
  "mirror-keepers",
  "rootwardens",
  "makers-circle",
  "golden-river-merchants",
  "oracle-circle",
  "stillwater-sisters",
  "silent-ones",
];

export const ORDER_LIST: CaelinusOrder[] = ORDER_ORDER.map((id) => ORDERS[id]);

export function getOrder(id: OrderId): CaelinusOrder {
  return ORDERS[id];
}

/** Bir district'in doğal düzeni (varsa). */
export function orderForDistrict(
  districtKey: AvatarDistrictId
): CaelinusOrder | undefined {
  return ORDER_LIST.find((o) => o.districtKey === districtKey);
}

/* ────────── Rank etiketleri (Civilization §3) ────────── */

/** Ortak rank → görünen etiket. "member" rank'ı düzene özgü ünvana çözülür. */
export function resolveRankLabel(
  rank: AvatarRank,
  order?: CaelinusOrder | null
): string {
  switch (rank) {
    case "reflection":
      return "Yansıma";
    case "initiate":
      return "İnisiye";
    case "member":
      return order?.avatarTitle ?? "Üye";
    case "elder":
      return "Yaşlı (Elder)";
    default:
      return "Yansıma";
  }
}
