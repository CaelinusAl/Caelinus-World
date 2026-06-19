/**
 * CAELINUS · NPC ENGINE — 3D / Avatar Entegrasyon Yapısı
 *
 * NPC verisini District 3D sahnesine bağlar. NPC'ler "mortal-scale" (~1.8-2m),
 * AZ ve SESSİZ yerleştirilir (canon: tanrıçalar 6.6m, NPC'ler küçük). avatarModel
 * yoksa stilize placeholder (robed silhouette) kullanılır.
 *
 * Bu dosya SÖZLEŞMEdir; gerçek R3F yerleşimi District sahnesinde (örn GaiaScene/
 * DistrictWalkScene) bu yapıyı tüketir. Mevcut sahne dosyalarına dokunmaz.
 */

import type { NPC } from "./types";

export type Vec3 = [number, number, number];

export interface NPCSpawn {
  npc: NPC;
  position: Vec3;
  rotationY: number;
  scale: number;
  /** GLB yoksa placeholder tipi. */
  placeholder?: "robed" | "silhouette" | "lightform";
  /** Yaklaşınca etkileşim yarıçapı (proximity prompt için). */
  interactRadius: number;
  /** Etkileşim ipucu (3D overlay). */
  prompt: string;
}

const DEFAULT_MODEL = "/models/npc/civ_robed_figure.glb"; // mevcut civ figürü (fallback)

/** Bir NPC'yi 3D yerleşim sözleşmesine çevir. location → anchor çözümü sahnede yapılır. */
export function toSpawn(npc: NPC, at: Vec3, rotationY = 0): NPCSpawn {
  return {
    npc,
    position: at,
    rotationY,
    scale: npc.archetype === "mystery" ? 1.9 : 1.8,
    placeholder: npc.avatarModel ? undefined : npc.interactionStyle === "silent" ? "silhouette" : "robed",
    interactRadius: 6,
    prompt: npc.interactionStyle === "silent" ? "[E] yaklaş" : `[E] ${npc.name} ile konuş`,
  };
}

/** GLB yolunu çöz (yoksa ortak fallback). */
export function resolveModel(npc: NPC): string {
  return npc.avatarModel ?? DEFAULT_MODEL;
}

/** District için spawn listesi üret (anchor haritası sahneden gelir). */
export function spawnsForDistrict(npcs: readonly NPC[], anchors: Record<string, { at: Vec3; rotationY?: number }>): NPCSpawn[] {
  return npcs
    .filter((n) => !n.location || anchors[n.location])
    .map((n) => {
      const a = (n.location && anchors[n.location]) || { at: [0, 0, 0] as Vec3, rotationY: 0 };
      return toSpawn(n, a.at, a.rotationY ?? 0);
    });
}
