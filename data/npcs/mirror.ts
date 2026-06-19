/**
 * MIRROR GATE NPC'leri — dönüşüm/geçiş eşiği. Order: Mirror Keepers (D1: patron Mira).
 */
import type { DistrictNPCs } from "@/lib/npc/types";

export const MIRROR_NPCS: DistrictNPCs = [
  {
    id: "mirror.gate-keeper",
    district: "mirror",
    name: "Gate Keeper",
    archetype: "guide",
    title: "Eşik Bekçisi",
    appearance: "İki dev ayna-kapı arasında durur; cüppesi her iki tarafı da yansıtır.",
    personality: "Sakin, eşik-bilen bir rehber; geçişi zorlamaz, hazırlar.",
    greeting: "Geçmeden önce, kim olduğunu bilmelisin.",
    firstQuestion: "Hangi benliği geride bırakıyorsun?",
    interactionStyle: "practical",
    aiEnabled: true,
    order: "Mirror Keepers",
    location: "mirror-lake.gate",
    tags: ["guide", "threshold"],
  },
  {
    id: "mirror.reflection-reader",
    district: "mirror",
    name: "Reflection Reader",
    archetype: "oracle",
    title: "Yansıma Okuyucu",
    appearance: "Yüzü iki yarıdan oluşur; biri sen, biri henüz-sen.",
    personality: "Kararsızlığı yargılamaz; seçimin de seçmemenin de geçerli olduğunu ima eder.",
    greeting: "İki yansıma. İkisi de sen.",
    firstQuestion: "Hangisini seçeceksin — yoksa ikisini de mi?",
    interactionStyle: "symbolic",
    aiEnabled: true,
    order: "Mirror Keepers",
    location: "mirror-lake.twin-gates",
    tags: ["oracle", "choice"],
  },
] as const;
