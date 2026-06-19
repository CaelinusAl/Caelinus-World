/**
 * CAELINUS · NPC ENGINE — Çekirdek Tipler
 *
 * Yaşayan medeniyet sakinleri. Bu bir OYUN/RPG NPC'si DEĞİL — sembolik bir
 * yaşayan dünyanın bilinç katmanıdır. Tüm district'ler aynı District Engine'i
 * kullanır; NPC'ler bu motora oturan, ölçeklenebilir (1000+) bir registry'dir.
 *
 * Tasarım ilkeleri:
 *   • NPC = veri (saf), davranış = motor (dialogue/ai). Karıştırma.
 *   • district anahtarları lib/district/registry ile UYUMLU ama DECOUPLED
 *     (bu modül o dosyayı import ETMEZ → paralel district çalışmasıyla çakışmaz).
 *   • aiEnabled=false → script'li diyalog; aiEnabled=true → AI persona (lib/npc/ai).
 */

export const NPC_ARCHETYPES = [
  "guide", // yönlendirir (Gate Keeper, Path Guide, District Host)
  "merchant", // ürün/hizmet (Frequency Tailor, Jewelry Keeper)
  "oracle", // sembolik içgörü (Oracle of Silence, Dream Interpreter)
  "memory", // unutulmuş bilgi (Keeper of Forgotten Names, Archive Monk)
  "creator", // sanatsal yaratım (Painter, Sculptor, Music Weaver)
  "mystery", // saf atmosfer (Silent Woman, Moon Walker, Faceless Witness)
] as const;
export type NPCArchetype = (typeof NPC_ARCHETYPES)[number];

export const INTERACTION_STYLES = ["practical", "symbolic", "poetic", "silent"] as const;
export type InteractionStyle = (typeof INTERACTION_STYLES)[number];

/** District anahtarları — lib/district/registry ile aynı sözlük, decoupled tutuldu. */
export const NPC_DISTRICTS = [
  "mirror", // Mirror Gate
  "bazaar", // Bazaar
  "sanri", // Sanri
  "gaia", // Gaia
  "atelier", // Atelier
  "fashion", // Fashion
  "avatar", // Avatar Studio
] as const;
export type NPCDistrict = (typeof NPC_DISTRICTS)[number];

export interface NPC {
  /** Kararlı, benzersiz anahtar. Format: `<district>.<slug>` (örn "sanri.oracle-of-silence"). */
  id: string;
  district: NPCDistrict;

  name: string;
  archetype: NPCArchetype;
  title: string;

  /** Görünüş tarifi (3D/2D üretim + AI persona için). */
  appearance: string;
  /** Kişilik/ruh (AI persona çekirdeği). */
  personality: string;

  greeting: string;
  firstQuestion: string;

  interactionStyle: InteractionStyle;

  /** true → AI ile konuşur (lib/npc/ai persona). false → script'li dialogue (lib/npc/dialogue). */
  aiEnabled: boolean;

  /** 3D entegrasyon: GLB yolu (public/ altı). Yoksa placeholder/sprite. */
  avatarModel?: string;
  /** District içi konum etiketi / spawn anchor adı (3D yerleşim). */
  location?: string;

  /** Ölçeklenebilirlik meta'sı. */
  tags?: string[];
  /** Bağlı Order (canon: Daughters of Selîne, Oracle Circle, vb.). */
  order?: string;
  /** Script'li diyalog dalı (aiEnabled=false ise). lib/npc/dialogue tüketir. */
  dialogueId?: string;
}

/** Bir district'in NPC paketini tanımlamak için yardımcı (data/npcs/*.ts kullanır). */
export type DistrictNPCs = readonly NPC[];

export function isNPCArchetype(v: string): v is NPCArchetype {
  return (NPC_ARCHETYPES as readonly string[]).includes(v);
}
export function isNPCDistrict(v: string): v is NPCDistrict {
  return (NPC_DISTRICTS as readonly string[]).includes(v);
}
