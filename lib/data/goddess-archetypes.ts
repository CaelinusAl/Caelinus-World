/**
 * CAELINUS — Tanrıça arketip adaptörü (Moda AI için).
 *
 * Tek doğru kaynak `lib/caelinus-ai/archetypes.ts` (6 tanrıça kimliği —
 * founder onaylı, sırası korunur). Burada yeni arketip TANIMLAMIYORUZ;
 * Moda AI'nın kullanacağı sade görünümü + prompt bloğunu türetiriz.
 */

import { ARCHETYPES } from "@/lib/caelinus-ai/archetypes";
import type { AILang } from "@/lib/ai/types";

export type GoddessArchetype = {
  id: string;
  label: string;
  subtitle: string;
  energy: string;
  frequency: string;
  mood: string;
};

export const GODDESS_ARCHETYPES: GoddessArchetype[] = ARCHETYPES.map((a) => ({
  id: a.identity.id,
  label: a.identity.label,
  subtitle: a.identity.subtitle ?? "",
  energy: a.energy,
  frequency: a.frequency,
  mood: a.moods[0] ?? "",
}));

const ENERGY_TR: Record<string, string> = {
  fire: "Ateş",
  earth: "Toprak",
  air: "Hava",
  water: "Su",
};

/** System prompt'a gömülecek tanrıça arketip bloğu. */
export function buildGoddessBlock(lang: AILang): string {
  return GODDESS_ARCHETYPES.map((g) => {
    const energy = lang === "tr" ? ENERGY_TR[g.energy] ?? g.energy : g.energy;
    return `- ${g.label} (${g.subtitle}) · ${energy} · ${g.frequency} — ${g.mood}`;
  }).join("\n");
}
