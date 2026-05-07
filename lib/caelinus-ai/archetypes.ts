/**
 * Caelinus AI — 6 arketip + skor + reading üretimi (server-safe).
 *
 * Bu modül HEM browser tarafındaki `mockProvider` HEM server tarafındaki
 * `caelinus-ai/jobs/runner` tarafından kullanılıyor. Tek kaynak prensibi:
 * arketipler nerede tanımlanırsa orada kalıyor, dağılmıyor.
 *
 * KRİTİK kurallar:
 *   • Bu dosya HİÇBİR browser API'si import etmez (no MediaPipe, no
 *     document, no IndexedDB). Pure TS data + saf fonksiyonlar.
 *   • ARCHETYPES sırası observable — recommendation skoru hash bazlı
 *     deterministic, sıra değişirse aynı kullanıcı için farklı arketip
 *     "recommended" olarak işaretlenebilir. Sırayı KORUYUN.
 *   • Bu 6 arketip Caelinus brand'in kalbi. Değiştirmeden önce founder
 *     onayı al (memory doc / roadmap'te D1 kararı).
 */

import {
  CAELINUS_BODY_LIBRARY,
  type BodyEntry,
} from "../avatar-bodies";
import type {
  AvatarStyleProfile,
  CaelinusReading,
  EnergyElement,
  SelfieAnalysis,
  StyleIdentity,
} from "./types";

/* ────────── Spec tipi ────────── */

export type ArchetypeSpec = {
  identity: StyleIdentity;
  energy: EnergyElement;
  /** Style bias — match'in stil profilini bu yöne kaydır. */
  bias: Partial<AvatarStyleProfile>;
  /** Body library tercih sırası — ilk müsait body seçilir. */
  preferredBodies: string[];
  /** Mood cümleleri — id hash ile birinden seçilir. */
  moods: string[];
  /** Şiirsel okuma (paragraf). */
  reading: (ctx: { frequencyTag: string; faceShape: string }) => string;
  /** Frekans etiketi — "Auteur · 528 Hz" gibi. */
  frequency: string;
};

/* ────────── 6 arketip — Caelinus dilinde ────────── */

export const ARCHETYPES: ArchetypeSpec[] = [
  {
    identity: {
      id: "goddess-minimal",
      label: "Goddess Minimal",
      subtitle: "ICONOGRAPHIC · CRYSTALLINE",
    },
    energy: "air",
    bias: {
      faceStyle: "natural",
      bodyType: "balanced",
      outfitMood: "minimal",
      hair: { length: "medium", texture: "straight", color: "#1a1410" },
    },
    preferredBodies: ["caelinus-default", "caelinus-light", "selin-v1"],
    moods: [
      "Az dokuda çok niyet — sessizliğin formdaki hâli.",
      "Hava gibi hafif, kuşlar gibi belirgin.",
      "Sadelik bir eksiklik değil; bir karar.",
    ],
    frequency: "Auteur · 528 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatlarınla bir ikona dönüşüyorsun — Caelinus seni "minimalin tanrıçası" olarak okudu. Dokuyu eksilttiğinde, niyet daha duruluyor.`,
  },
  {
    identity: {
      id: "lunar-auteur",
      label: "Lunar Auteur",
      subtitle: "NIGHT · INK · INTERIOR",
    },
    energy: "water",
    bias: {
      faceStyle: "ethereal",
      bodyType: "slender",
      outfitMood: "noir-luxe",
      hair: { length: "long", texture: "wavy", color: "#0c0908" },
    },
    preferredBodies: ["selin-v1", "caelinus-textured", "caelinus-hires"],
    moods: [
      "Aydan akarak geliyorsun.",
      "Suyun en derin sarkısı sende.",
      "Gece bir kostüm değil; senin doğal yüzeyin.",
    ],
    frequency: "Lunar · 639 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} yüzünde gecenin bir refleksi var — Caelinus seni "lunar auteur" olarak işaretledi. Siyah seni soğutmaz; içine çağırır.`,
  },
  {
    identity: {
      id: "solar-couture",
      label: "Solar Couture",
      subtitle: "GOLD · ATELIER · CEREMONIAL",
    },
    energy: "fire",
    bias: {
      faceStyle: "sculpted",
      bodyType: "balanced",
      outfitMood: "couture",
      hair: { length: "long", texture: "wavy", color: "#3b2a1f" },
    },
    preferredBodies: ["caelinus-textured", "caelinus-hires", "model-texture"],
    moods: [
      "Yangının zarafetinde duruyorsun.",
      "Işık seninle birlikte yanıyor.",
      "Altın bir renk değil; senin getirdiğin bir hâl.",
    ],
    frequency: "Solar · 741 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatların atölyede yontulmuş gibi — Caelinus seni "solar couture" frekansında okudu. Her dikiş bir tören niyetidir sende.`,
  },
  {
    identity: {
      id: "earth-veil",
      label: "Earth Veil",
      subtitle: "BOHEMIAN · TERRACOTTA · ROOTED",
    },
    energy: "earth",
    bias: {
      faceStyle: "soft",
      bodyType: "curvy",
      outfitMood: "bohemian",
      hair: { length: "long", texture: "curly", color: "#6b4226" },
    },
    preferredBodies: ["caelinus-textured", "selin-v1", "caelinus-default"],
    moods: [
      "Toprağın sabrını giyiniyorsun.",
      "Köklerinden yükseliyorsun.",
      "Dokuların arasında dünya kokusu var.",
    ],
    frequency: "Gaia · 432 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatların yumuşak ışıkla okunuyor — Caelinus seni "earth veil" olarak okudu. Senin doğallığın bir tarz değil; bir varlık biçimi.`,
  },
  {
    identity: {
      id: "futurist-oracle",
      label: "Futurist Oracle",
      subtitle: "METALLIC · GLITCH · PROPHETIC",
    },
    energy: "air",
    bias: {
      faceStyle: "sculpted",
      bodyType: "athletic",
      outfitMood: "futurist",
      hair: { length: "short", texture: "straight", color: "#cfc8c0" },
    },
    preferredBodies: ["caelinus-light", "caelinus-default", "model-texture"],
    moods: [
      "Geleceğin sesini bugünden duyuyorsun.",
      "Metalik ışık senin ikinci derin.",
      "Bir kâhin gibi duruyorsun — ama gülen bir kâhin.",
    ],
    frequency: "Future · 963 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatlarında metalik bir keskinlik var — Caelinus seni "futurist oracle" olarak gördü. Geleceği taşıma biçimin bir kostümden çok bir frekans.`,
  },
  {
    identity: {
      id: "ritual-flame",
      label: "Ritual Flame",
      subtitle: "TEMPLE · GLOW · INITIATION",
    },
    energy: "fire",
    bias: {
      faceStyle: "ethereal",
      bodyType: "ritualistic",
      outfitMood: "ritualistic",
      hair: { length: "veil", texture: "wavy", color: "#7d2f5a" },
    },
    preferredBodies: ["caelinus-hires", "caelinus-textured", "selin-v1"],
    moods: [
      "Her parçan bir geçit.",
      "Tören senin doğal akışın.",
      "İçindeki ateş ışığa, ışık dokuya dönüşüyor.",
    ],
    frequency: "Ritual · 852 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatların bir mabet kapısı gibi — Caelinus seni "ritual flame" olarak okudu. Sende moda bir ifade değil; bir geçiş ritüeli.`,
  },
];

/* ────────── Server-safe yardımcılar ────────── */

export function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickBody(preferred: string[]): BodyEntry {
  for (const id of preferred) {
    const found = CAELINUS_BODY_LIBRARY.find((b) => b.id === id);
    if (found) return found;
  }
  return CAELINUS_BODY_LIBRARY[0];
}

export function buildReading(
  archetype: ArchetypeSpec,
  ctx: { faceShape: string; matchId: string },
): CaelinusReading {
  const moodIdx = hashId(ctx.matchId) % archetype.moods.length;
  return {
    styleIdentity: archetype.identity,
    energy: archetype.energy,
    mood: archetype.moods[moodIdx],
    reading: archetype.reading({
      frequencyTag: archetype.frequency,
      faceShape: ctx.faceShape,
    }),
    frequencyTag: archetype.frequency,
  };
}

export function scoreMatch(
  archetype: ArchetypeSpec,
  user: AvatarStyleProfile,
  analysis?: SelfieAnalysis,
): number {
  let score = 50;

  if (archetype.bias.outfitMood && user.outfitMood) {
    score += archetype.bias.outfitMood === user.outfitMood ? 22 : -8;
  }
  if (archetype.bias.faceStyle && user.faceStyle) {
    score += archetype.bias.faceStyle === user.faceStyle ? 14 : -4;
  }
  if (archetype.bias.bodyType && user.bodyType) {
    score += archetype.bias.bodyType === user.bodyType ? 10 : -2;
  }
  if (archetype.bias.hair && user.hair) {
    if (archetype.bias.hair.texture === user.hair.texture) score += 4;
    if (archetype.bias.hair.length === user.hair.length) score += 4;
  }

  if (analysis?.faceShape) {
    const shape = analysis.faceShape;
    if (
      (archetype.energy === "fire" && (shape === "heart" || shape === "oval")) ||
      (archetype.energy === "water" && (shape === "long" || shape === "oval")) ||
      (archetype.energy === "earth" && (shape === "round" || shape === "square")) ||
      (archetype.energy === "air" && (shape === "oval" || shape === "long"))
    ) {
      score += 8;
    }
  }

  // Stochastic shimmer (deterministic — aynı archetype = aynı sonuç)
  score += (hashId(archetype.identity.id) % 7) - 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildVariantStyle(
  base: AvatarStyleProfile,
  archetype: ArchetypeSpec,
): AvatarStyleProfile {
  return {
    ...base,
    ...archetype.bias,
    hair: { ...base.hair, ...(archetype.bias.hair ?? {}) },
    frequencyTag: archetype.frequency,
  };
}
