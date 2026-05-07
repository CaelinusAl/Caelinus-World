/**
 * Caelinus Avatar Core — Outfit Preset Library.
 *
 * Şimdilik mock — kıyafet GLB'leri yok, accent rengi + frekans + mood
 * ile sahnenin görsel tonu değişiyor (try-on illusion stratejisinin
 * bir uzantısı). İleride gerçek outfit GLB'leri eklendiğinde
 * `glbUrl` ve `hiddenMeshParts` doldurulur — UI dokunulmadan çalışır.
 */

import type { OutfitPreset } from "./types";

export const OUTFIT_PRESETS: OutfitPreset[] = [
  {
    id: "noir-ritual",
    label: "Noir Ritual",
    tagline: "Gece töreni — siyah + altın",
    accent: "#caa56a",
    frequency: "Lunar · 639 Hz",
  },
  {
    id: "solar-couture",
    label: "Solar Couture",
    tagline: "Atölye altını, hatlar yontulmuş",
    accent: "#e87a3d",
    frequency: "Solar · 741 Hz",
  },
  {
    id: "earth-veil",
    label: "Earth Veil",
    tagline: "Toprak dokulu, akan, sıcak",
    accent: "#a87149",
    frequency: "Gaia · 432 Hz",
  },
  {
    id: "futurist-glow",
    label: "Futurist Glow",
    tagline: "Metalik, geleceğin sesi",
    accent: "#cfc8b8",
    frequency: "Future · 963 Hz",
  },
  {
    id: "ocean-mist",
    label: "Ocean Mist",
    tagline: "Suyun en derin sarkısı",
    accent: "#6ba8c4",
    frequency: "Marine · 528 Hz",
  },
  {
    id: "minimal-veil",
    label: "Minimal Veil",
    tagline: "Sade — niyet doku öncesi",
    accent: "#ead0a8",
    frequency: "Auteur · 528 Hz",
  },
];

export const DEFAULT_OUTFIT_ID = "noir-ritual";

export function getOutfit(id: string | null | undefined): OutfitPreset {
  if (!id) {
    return (
      OUTFIT_PRESETS.find((o) => o.id === DEFAULT_OUTFIT_ID) ??
      OUTFIT_PRESETS[0]
    );
  }
  return (
    OUTFIT_PRESETS.find((o) => o.id === id) ??
    OUTFIT_PRESETS.find((o) => o.id === DEFAULT_OUTFIT_ID) ??
    OUTFIT_PRESETS[0]
  );
}
