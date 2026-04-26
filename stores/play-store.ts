/**
 * Play studio store.
 *
 * Holds the multi-step generator state for `/play`:
 *
 *   step → archetype → zodiac → scene → render → result
 *
 * No persistence on purpose — each visit starts fresh, but the user
 * can step backwards inside a session. Render results live in the
 * store so the user can flip back through pickers without losing the
 * canvas they just produced.
 */
import { create } from "zustand";

import type {
  ArchetypeId,
  SceneId,
  ZodiacId,
} from "@/data/play-assets";

export type PlayStep =
  | "hero"          // splash, before they enter the studio
  | "archetype"
  | "zodiac"
  | "scene"
  | "render"        // generation in flight
  | "result";       // canvas + actions

export type RenderState =
  | { kind: "idle" }
  | { kind: "loading"; startedAt: number }
  | { kind: "ready"; url: string; cached: boolean }
  | { kind: "error"; message: string };

type PlayState = {
  step: PlayStep;
  archetype: ArchetypeId | null;
  zodiac: ZodiacId | null;
  scene: SceneId | null;
  render: RenderState;
  /** True when SAVE LOOK has been triggered for the current render —
   *  toggles the action button to "Saved" without polluting render
   *  state itself. */
  saved: boolean;
  /** Persisted look id once SAVE returns successfully — lets SHARE
   *  send people to /play/look/<id> instead of just the raw render url. */
  savedLookId: string | null;
  setStep: (step: PlayStep) => void;
  setArchetype: (id: ArchetypeId) => void;
  setZodiac: (id: ZodiacId) => void;
  setScene: (id: SceneId) => void;
  beginRender: () => void;
  setRenderResult: (url: string, cached: boolean) => void;
  setRenderError: (message: string) => void;
  markSaved: (lookId: string | null) => void;
  remix: () => void;
  reset: () => void;
};

const initialState = {
  step: "hero" as PlayStep,
  archetype: null,
  zodiac: null,
  scene: null,
  render: { kind: "idle" } as RenderState,
  saved: false,
  savedLookId: null,
};

export const usePlayStore = create<PlayState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setArchetype: (id) =>
    set({
      archetype: id,
      step: "zodiac",
      saved: false,
      savedLookId: null,
      render: { kind: "idle" },
    }),

  setZodiac: (id) =>
    set({
      zodiac: id,
      step: "scene",
      saved: false,
      savedLookId: null,
      render: { kind: "idle" },
    }),

  setScene: (id) =>
    set({ scene: id, saved: false, savedLookId: null }),

  beginRender: () =>
    set({
      step: "render",
      render: { kind: "loading", startedAt: Date.now() },
      saved: false,
      savedLookId: null,
    }),

  setRenderResult: (url, cached) =>
    set({ step: "result", render: { kind: "ready", url, cached } }),

  setRenderError: (message) =>
    set({ render: { kind: "error", message } }),

  markSaved: (lookId) => set({ saved: true, savedLookId: lookId ?? null }),

  /** Take the user back to AvatarPick to try another zodiac while
   *  keeping the archetype + scene choices. */
  remix: () =>
    set({
      step: "zodiac",
      render: { kind: "idle" },
      saved: false,
      savedLookId: null,
    }),

  reset: () => set({ ...initialState }),
}));
