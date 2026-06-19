/**
 * CAELINUS · NPC ENGINE — Registry
 *
 * Tüm district NPC paketlerini tek registry'de toplar. 1000+ NPC'ye ölçeklenir:
 * NPC'ler saf veri olduğundan registry sadece dizi birleştirme + index'tir.
 * Yeni district eklemek = data/npcs/<district>.ts yazıp burada import etmek.
 *
 * Bu modül lib/district/registry.ts'i IMPORT ETMEZ (decoupled, çakışmasız).
 */

import type { NPC, NPCArchetype, NPCDistrict } from "./types";
import { NPC_DISTRICTS } from "./types";

import { BAZAAR_NPCS } from "@/data/npcs/bazaar";
import { FASHION_NPCS } from "@/data/npcs/fashion";
import { SANRI_NPCS } from "@/data/npcs/sanri";
import { GAIA_NPCS } from "@/data/npcs/gaia";
import { MIRROR_NPCS } from "@/data/npcs/mirror";
import { ATELIER_NPCS } from "@/data/npcs/atelier";
import { AVATAR_NPCS } from "@/data/npcs/avatar";

/** Tüm NPC'ler — düz liste. */
export const ALL_NPCS: readonly NPC[] = [
  ...SANRI_NPCS,
  ...BAZAAR_NPCS,
  ...FASHION_NPCS,
  ...GAIA_NPCS,
  ...MIRROR_NPCS,
  ...ATELIER_NPCS,
  ...AVATAR_NPCS,
];

/** id → NPC (O(1) erişim, 1000+ için). */
const BY_ID: ReadonlyMap<string, NPC> = new Map(ALL_NPCS.map((n) => [n.id, n]));

/** district → NPC[] index. */
const BY_DISTRICT: Readonly<Record<NPCDistrict, NPC[]>> = (() => {
  const m = Object.fromEntries(NPC_DISTRICTS.map((d) => [d, [] as NPC[]])) as Record<NPCDistrict, NPC[]>;
  for (const n of ALL_NPCS) m[n.district].push(n);
  return m;
})();

export function getNPC(id: string): NPC | undefined {
  return BY_ID.get(id);
}
export function getNPCsByDistrict(district: NPCDistrict): readonly NPC[] {
  return BY_DISTRICT[district] ?? [];
}
export function getNPCsByArchetype(archetype: NPCArchetype): NPC[] {
  return ALL_NPCS.filter((n) => n.archetype === archetype);
}
export function getAINPCs(): NPC[] {
  return ALL_NPCS.filter((n) => n.aiEnabled);
}

/** Geliştirme-zamanı bütünlük denetimi (benzersiz id, geçerli alanlar). */
export function validateRegistry(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const n of ALL_NPCS) {
    if (seen.has(n.id)) errors.push(`duplicate id: ${n.id}`);
    seen.add(n.id);
    if (!n.id.startsWith(`${n.district}.`)) errors.push(`id/district mismatch: ${n.id}`);
    if (!n.greeting || !n.firstQuestion) errors.push(`missing dialogue seed: ${n.id}`);
  }
  return { ok: errors.length === 0, errors };
}

export const NPC_COUNT = ALL_NPCS.length;
