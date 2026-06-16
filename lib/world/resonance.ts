/**
 * ResonanceLayer — "5D"nin çekirdeği.
 *
 * Kullanıcının frekans profilini (zodiac · element · Solfeggio Hz) WebGL
 * dünyasının okuyabileceği saf parametrelere indirger. Tek doğru kaynak:
 * sahneler hep buradan beslenir, böylece evren kişinin frekansına göre
 * "uyanır" (Koç-Ateş sıcak turuncu, Balık-Su serin mavi…).
 *
 * Saf/bağımsız: yalnızca lib/frequency.ts sabitlerini kullanır.
 */

import {
  ELEMENT_TONE,
  INTENT_TUNING,
  type Element,
  type FrequencyProfile,
} from "@/lib/frequency";

export type Resonance = {
  /** Aktif element (profil yoksa null → nötr kozmos). */
  element: Element | null;
  /** Solfeggio Hz — ileride SoundLayer drone'unu da sürecek. */
  hz: number;
  /** Ana aksan rengi (hex) — sparkle/ışık. */
  primary: string;
  /** Yumuşak hale rengi (rgba). */
  glow: string;
  /** İkincil aksan (niyet rengi) — ikinci sparkle katmanı. */
  secondary: string;
  /** 0.9–1.2 — sürüklenme/parlaklık ölçeği (elemente göre nabız). */
  intensity: number;
  /** Profil var mı — sahneler nötr/uyanmış ayrımı için. */
  attuned: boolean;
};

/** Profil yokken: mevcut altın/mavi nötr kozmos. */
export const DEFAULT_RESONANCE: Resonance = {
  element: null,
  hz: 528,
  primary: "#e6c896",
  glow: "rgba(230, 200, 150, 0.40)",
  secondary: "#9cc2ff",
  intensity: 1,
  attuned: false,
};

/** Element → kozmik nabız: ateş canlı, su dingin. */
const ELEMENT_INTENSITY: Record<Element, number> = {
  fire: 1.18,
  air: 1.06,
  earth: 0.96,
  water: 0.9,
};

export function resonanceFromProfile(
  profile: FrequencyProfile | null,
): Resonance {
  if (!profile) return DEFAULT_RESONANCE;
  const tone = ELEMENT_TONE[profile.element];
  const secondary = INTENT_TUNING[profile.intent]?.color ?? tone.color;
  return {
    element: profile.element,
    hz: profile.frequency,
    primary: tone.color,
    glow: tone.glow,
    secondary,
    intensity: ELEMENT_INTENSITY[profile.element] ?? 1,
    attuned: true,
  };
}
