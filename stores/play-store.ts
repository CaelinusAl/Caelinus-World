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
  /** F2a — re-roll index. 1 = canonical render shared across the
   *  gallery; 2..8 = fresh takes the user explicitly asked for. The
   *  page passes this to /api/play/render and uses it when calling
   *  lookCacheKey() for the save endpoint. */
  variant: number;
  /** F2b — optional one-line user brief. Empty string means "no
   *  brief" (canonical/public render). Authenticated-only on the
   *  server; the client may still hold a value (e.g. while signing
   *  in), but render/save will 401 it for anonymous users. */
  brief: string;
  setStep: (step: PlayStep) => void;
  setArchetype: (id: ArchetypeId) => void;
  setZodiac: (id: ZodiacId) => void;
  setScene: (id: SceneId) => void;
  setBrief: (text: string) => void;
  beginRender: () => void;
  setRenderResult: (url: string, cached: boolean) => void;
  setRenderError: (message: string) => void;
  markSaved: (lookId: string | null) => void;
  /** Bump the variant and reset the render canvas so the page can
   *  immediately fire a fresh render call. Capped at 8 to mirror the
   *  server-side cap in the request schema. */
  nextVariant: () => void;
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
  variant: 1,
  brief: "",
};

const MAX_VARIANT = 8;

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
      variant: 1,
      brief: "",
    }),

  setZodiac: (id) =>
    set({
      zodiac: id,
      step: "scene",
      saved: false,
      savedLookId: null,
      render: { kind: "idle" },
      variant: 1,
      brief: "",
    }),

  setScene: (id) =>
    set({ scene: id, saved: false, savedLookId: null, variant: 1 }),

  setBrief: (text) => set({ brief: text }),

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

  nextVariant: () =>
    set((state) => ({
      variant: Math.min(MAX_VARIANT, state.variant + 1),
      // Drop the old saved flag — the new variant is its own row in
      // play_renders so it needs its own save flow.
      saved: false,
      savedLookId: null,
      render: { kind: "idle" },
    })),

  /** Take the user back to AvatarPick to try another zodiac while
   *  keeping the archetype + scene choices. */
  remix: () =>
    set({
      step: "zodiac",
      render: { kind: "idle" },
      saved: false,
      savedLookId: null,
      variant: 1,
      brief: "",
    }),

  reset: () => set({ ...initialState }),
}));
