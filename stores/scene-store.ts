import { create } from "zustand";
import type { SceneId, ArchetypeId, ShopCategory } from "@/types/play";

export type ShopMode = "tryon" | "ai" | "freq" | "live";

type SceneState = {
  stageId: SceneId;
  archetypeId: ArchetypeId;
  activeMode: ShopMode;
  activeCategory: ShopCategory;
  showCart: boolean;

  setStage: (id: SceneId) => void;
  setArchetype: (id: ArchetypeId) => void;
  setMode: (mode: ShopMode) => void;
  setCategory: (cat: ShopCategory) => void;
  toggleCart: () => void;
};

export const useSceneStore = create<SceneState>((set) => ({
  stageId: "beach",
  archetypeId: "cosmic",
  activeMode: "tryon",
  activeCategory: "all",
  showCart: false,

  setStage: (stageId) => set({ stageId }),
  setArchetype: (archetypeId) => set({ archetypeId }),
  setMode: (activeMode) => set({ activeMode }),
  setCategory: (activeCategory) => set({ activeCategory }),
  toggleCart: () => set((s) => ({ showCart: !s.showCart })),
}));
