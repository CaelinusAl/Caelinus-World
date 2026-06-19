/**
 * CAELINUS — Bitki bilgi adaptörü (Gaia AI için).
 *
 * Tek doğru kaynak `data/gaia.ts`'tir. Burada yeni veri YAZMIYORUZ;
 * yalnızca konuşan-AI'nın system prompt'una gömeceği sade, token-dostu
 * bir "bitki bilgi bloğu" türetiyoruz. Böylece AI uydurmak yerine
 * Caelinus bahçesinin gerçek bitki kütüphanesine dayanır.
 */

import {
  plants,
  regions,
  MOOD_LABELS,
  type GaiaPlant,
  type Mood,
  type RegionId,
} from "@/data/gaia";
import type { AILang } from "@/lib/ai/types";

export type PlantSummary = {
  id: string;
  name: string;
  scientific: string;
  region: string;
  moods: string[];
  frequency: number;
  healing: string;
};

function regionLabel(id: RegionId, lang: AILang): string {
  return regions.find((r) => r.id === id)?.name[lang] ?? id;
}

function moodLabels(moods: Mood[], lang: AILang): string[] {
  return moods.map((m) => MOOD_LABELS[m]?.[lang] ?? m);
}

/** Tek bitkiyi AI bağlamı için sadeleştir. */
export function toPlantSummary(p: GaiaPlant, lang: AILang): PlantSummary {
  return {
    id: p.id,
    name: p.name[lang],
    scientific: p.scientific,
    region: regionLabel(p.region, lang),
    moods: moodLabels(p.moods, lang),
    frequency: p.frequency,
    healing: p.healing[lang],
  };
}

export function allPlantSummaries(lang: AILang): PlantSummary[] {
  return plants.map((p) => toPlantSummary(p, lang));
}

/**
 * System prompt'a gömülecek kompakt bilgi bloğu. Her bitki tek satır:
 * `Ad (Bilimsel) · Bölge · Hz · ruh hâlleri — şifa özeti`.
 * ~bitki sayısı satır; düşük token, yüksek dayanak.
 */
export function buildPlantKnowledgeBlock(lang: AILang): string {
  const lines = plants.map((p) => {
    const s = toPlantSummary(p, lang);
    return `- ${s.name} (${s.scientific}) · ${s.region} · ${s.frequency}Hz · ${s.moods.join(", ")} — ${s.healing}`;
  });
  return lines.join("\n");
}

/** Bölge imzaları — "toprak hafızası" bağlamı için. */
export function buildRegionBlock(lang: AILang): string {
  return regions
    .map((r) => `- ${r.name[lang]} (${r.cities.join(", ")}): ${r.signature[lang]}`)
    .join("\n");
}
