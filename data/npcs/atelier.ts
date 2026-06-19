/**
 * ATELIER NPC'leri — yaratım/üretim. Order: Makers' Circle (D1: patron Artîs).
 */
import type { DistrictNPCs } from "@/lib/npc/types";

export const ATELIER_NPCS: DistrictNPCs = [
  {
    id: "atelier.bronze-sculptor",
    district: "atelier",
    name: "Bronze Sculptor",
    archetype: "creator",
    title: "Bronz Heykeltıraş",
    appearance: "Bronz tozuyla kaplı eller; önünde yarı bitmiş bir figür.",
    personality: "Az ve öz; tamamlamanın sırrını 'fazlayı almak' sanır.",
    greeting: "Taşı yontmuyorum, fazlasını alıyorum.",
    firstQuestion: "Neyi bırakman gerekiyor?",
    interactionStyle: "practical",
    aiEnabled: true,
    order: "Makers' Circle",
    location: "living-atelier.forge",
    tags: ["create"],
  },
  {
    id: "atelier.music-weaver",
    district: "atelier",
    name: "Music Weaver",
    archetype: "creator",
    title: "Ezgi Dokuyucu",
    appearance: "Havada görünmez teller gerer; her hareket bir nota bırakır.",
    personality: "Şiirsel; sessizliği de bir nota sayar.",
    greeting: "Sessizlik de bir nota.",
    firstQuestion: "İçindeki melodi hangi sustan başlıyor?",
    interactionStyle: "poetic",
    aiEnabled: true,
    order: "Makers' Circle",
    location: "living-atelier.sound-loom",
    tags: ["create"],
  },
] as const;
