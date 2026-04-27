"use client";

/**
 * /play — Cinematic Stage Studio.
 *
 * Multi-step generator that walks the visitor through:
 *   archetype → zodiac → scene → render → result
 *
 * State is held in a Zustand store (`stores/play-store.ts`); each
 * step component is isolated under `app/play/_components/`. The
 * render call hits `/api/play/render`, which in Faz 5b will hand off
 * to a real AI provider; until that route exists it returns 503 and
 * the canvas surfaces a friendly retry.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CinemaCTA, NebulaPortal, StageHero } from "@/app/_stage";
import {
  ARCHETYPES,
  SCENES,
  ZODIACS,
  lookCacheKey,
  type ArchetypeId,
  type SceneId,
  type ZodiacId,
} from "@/data/play-assets";
import { briefHash } from "@/lib/play/brief";
import { useAuthStore } from "@/stores/auth-store";
import { useLangStore } from "@/stores/lang-store";
import { usePlayStore } from "@/stores/play-store";

import ArchetypePicker from "./_components/ArchetypePicker";
import AvatarPicker from "./_components/AvatarPicker";
import LookActions from "./_components/LookActions";
import RenderCanvas from "./_components/RenderCanvas";
import ScenePicker from "./_components/ScenePicker";
import Stepper from "./_components/Stepper";

type RenderResponse =
  | { url: string; cached: boolean }
  | {
      error: string;
      message?: string;
      used?: number;
      limit?: number;
      reason?: string;
    };

export default function PlayPage() {
  const { lang, hydrated, hydrate, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  // Single-shot hydration on mount so the lang store reads localStorage
  // before we render any picker copy.
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Mirror the Supabase session into the auth store so the ScenePicker
  // can show the brief textarea only to signed-in users. The store is
  // global; init() is idempotent and self-cleans on unmount.
  useEffect(() => useAuthStore.getState().init(), []);

  const step = usePlayStore((s) => s.step);
  const archetype = usePlayStore((s) => s.archetype);
  const zodiac = usePlayStore((s) => s.zodiac);
  const scene = usePlayStore((s) => s.scene);
  const variant = usePlayStore((s) => s.variant);
  const render = usePlayStore((s) => s.render);
  const setStep = usePlayStore((s) => s.setStep);
  const setArchetype = usePlayStore((s) => s.setArchetype);
  const setZodiac = usePlayStore((s) => s.setZodiac);
  const setScene = usePlayStore((s) => s.setScene);
  const beginRender = usePlayStore((s) => s.beginRender);
  const setRenderResult = usePlayStore((s) => s.setRenderResult);
  const setRenderError = usePlayStore((s) => s.setRenderError);
  const markSaved = usePlayStore((s) => s.markSaved);
  const nextVariant = usePlayStore((s) => s.nextVariant);

  const [toast, setToast] = useState<string | null>(null);
  const seededFromUrlRef = useRef(false);

  // Auto-dismiss toasts so the action row doesn't keep stale text.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Honour ?archetype=…&zodiac=…&scene=… so the gallery can deep-link
  // someone straight into the result for that triple. We do this once
  // per mount; the user can still navigate steps freely after.
  useEffect(() => {
    if (seededFromUrlRef.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const a = params.get("archetype");
    const z = params.get("zodiac");
    const s = params.get("scene");
    const validA = ARCHETYPES.find((x) => x.id === a)?.id as
      | ArchetypeId
      | undefined;
    const validZ = ZODIACS.find((x) => x.id === z)?.id as ZodiacId | undefined;
    const validS = SCENES.find((x) => x.id === s)?.id as SceneId | undefined;
    if (validA) setArchetype(validA);
    if (validZ) setZodiac(validZ);
    if (validS) setScene(validS);
    if (validA && validZ && validS) {
      // All three present → jump to scene step so the existing
      // generate-on-pick handler can fire on the first interaction. We
      // don't auto-render here because it would race the lang store's
      // hydration and produce an English toast in a TR session.
      setStep("scene");
    }
    seededFromUrlRef.current = true;
  }, [setArchetype, setZodiac, setScene, setStep]);

  // ── Render trigger ────────────────────────────────────────
  // Called from ScenePicker (and Retry button on error). Posts the
  // current triple to /api/play/render. The route will either return
  // a cached URL right away or paint a fresh image from the AI provider.
  const triggerRender = useCallback(async () => {
    if (!archetype || !zodiac || !scene) return;
    beginRender();
    // Read variant + brief from the store at call time so a re-roll
    // that just bumped the index doesn't race a stale closure.
    const { variant: currentVariant, brief: currentBrief } =
      usePlayStore.getState();
    try {
      const res = await fetch("/api/play/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype,
          zodiac,
          scene,
          variant: currentVariant,
          brief: currentBrief || undefined,
          lang: L,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as RenderResponse | null;
        let msg: string;
        if (res.status === 401) {
          // Brief was supplied but no session — bounce to login. We
          // preserve the current studio state so the user can come
          // back and hit Generate again.
          window.location.href = "/atelier/giris?next=/play";
          return;
        } else if (res.status === 429) {
          // Quota response carries a friendly TR message; fall back to a
          // generic English line if we ever localise on the server.
          msg =
            (j && "message" in j && j.message) ||
            (L === "tr"
              ? "Saatlik render limitine ulaştın. Biraz sonra tekrar dene."
              : "Hourly render limit reached. Try again later.");
        } else if (res.status === 503) {
          msg =
            L === "tr"
              ? "AI sağlayıcı şu an yanıt veremiyor. Bir saniye sonra tekrar dene."
              : "The AI provider isn't responding right now. Try again in a moment.";
        } else if (res.status === 502) {
          msg =
            L === "tr"
              ? "Görünüm çizilirken bir şey ters gitti. Tekrar dene."
              : "Something went wrong while painting your look. Try again.";
        } else {
          msg =
            (j && "message" in j && j.message) ||
            (j && "error" in j && j.error) ||
            (L === "tr"
              ? "Görünüm oluşturulamadı."
              : "Could not generate the look.");
        }
        setRenderError(msg);
        return;
      }
      const j = (await res.json()) as RenderResponse;
      if ("error" in j) {
        setRenderError(("message" in j && j.message) || j.error);
      } else {
        setRenderResult(j.url, j.cached);
      }
    } catch (err) {
      setRenderError(
        err instanceof Error
          ? err.message
          : L === "tr"
            ? "Bağlantı kurulamadı."
            : "Connection failed.",
      );
    }
  }, [archetype, zodiac, scene, beginRender, setRenderResult, setRenderError, L]);

  // ── Re-roll (F2a) ─────────────────────────────────────────
  // Bump the variant index in the store, then immediately re-render.
  // Each variant maps to its own play_renders cache row + likes_count
  // so the canonical (v1) gallery entry isn't disturbed.
  const triggerReroll = useCallback(() => {
    if (variant >= 8) return; // server caps at 8 anyway; mirror it client-side
    nextVariant();
    void triggerRender();
  }, [variant, nextVariant, triggerRender]);

  const savedLookId = usePlayStore((s) => s.savedLookId);

  // ── Save look ─────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (render.kind !== "ready" || !archetype || !zodiac || !scene) return;
    try {
      // Pull the brief fresh from the store so a save right after a
      // re-roll uses the same brief that was rendered with. We hash
      // it client-side using the same FNV-1a routine as the server so
      // the cacheKey lines up — server still rehashes for verification.
      const { brief: currentBrief } = usePlayStore.getState();
      const briefDigest = currentBrief ? briefHash(currentBrief) : "";
      const res = await fetch("/api/play/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype,
          zodiac,
          scene,
          renderUrl: render.url,
          variant,
          brief: currentBrief || undefined,
          // Match the variant + brief actually rendered — otherwise
          // the save server-side cache_key check fails for v2+ rerolls
          // or briefed renders.
          cacheKey: lookCacheKey(
            archetype,
            zodiac,
            scene,
            variant,
            briefDigest,
          ),
        }),
      });
      if (res.status === 401) {
        // not signed in — bounce to login with a return path
        window.location.href = "/atelier/giris?next=/play";
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setToast(
          j?.error ??
            (L === "tr" ? "Kaydedilemedi." : "Could not save."),
        );
        return;
      }
      const j = (await res.json().catch(() => null)) as
        | { ok: true; lookId: string | null }
        | null;
      markSaved(j?.lookId ?? null);
      setToast(
        L === "tr"
          ? "Görünüm /play/looks altına kaydedildi."
          : "Saved to /play/looks.",
      );
    } catch {
      setToast(L === "tr" ? "Bağlantı sorunu." : "Connection issue.");
    }
  }, [render, archetype, zodiac, scene, variant, markSaved, L]);

  // ── Share look ────────────────────────────────────────────
  // Prefer the public /play/look/<id> URL once the look has been
  // saved (it carries OG meta, cleaner sharing). Falls back to the
  // raw render URL when the user hasn't saved yet.
  const handleShare = useCallback(async () => {
    if (render.kind !== "ready") return;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = savedLookId
      ? `${origin}/play/look/${savedLookId}`
      : render.url;
    try {
      await navigator.clipboard.writeText(url);
      setToast(L === "tr" ? "Bağlantı panoya kopyalandı." : "Link copied.");
    } catch {
      setToast(L === "tr" ? "Kopyalanamadı." : "Copy failed.");
    }
  }, [render, savedLookId, L]);

  return (
    <div className="play-shell">
      <header className="play-ribbon">
        <Link href="/universe" className="play-ribbon-brand">
          <span className="play-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="play-ribbon-name">Caelinus · Play</span>
        </Link>
        <div className="play-ribbon-actions">
          <Link href="/play/galeri" className="play-ribbon-btn">
            {L === "tr" ? "Galeri" : "Gallery"}
          </Link>
          <Link href="/play/looks" className="play-ribbon-btn">
            {L === "tr" ? "Görünümlerim" : "My looks"}
          </Link>
          <button
            type="button"
            className="play-ribbon-lang"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={L === "tr" ? "is-active" : ""}>TR</span>
            <span className="play-ribbon-lang-divider">·</span>
            <span className={L === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </header>

      <main className="play-main">
        {step !== "hero" ? <Stepper lang={L} /> : null}

        {step === "hero" ? (
          <StageHero
            tone="magenta"
            eyebrow={L === "tr" ? "Caelinus · Play" : "Caelinus · Play"}
            title={
              L === "tr" ? "Tanrıça Sahnesine Gir" : "Enter the Goddess Stage"
            }
            lead={
              L === "tr"
                ? "Üç adımda kendi tanrıçanı seç: figür, burç, sahne. Caelinus, AI ile sana özel bir poster çizer."
                : "Pick your goddess in three moves: figure, sign, scene. Caelinus paints you a one-off poster with AI."
            }
            portalSlot={
              <NebulaPortal size={240} tone="magenta" pulse>
                <span className="play-hero-portal-glyph" aria-hidden="true">
                  ✦
                </span>
              </NebulaPortal>
            }
            actions={
              <CinemaCTA
                variant="luminous"
                tone="magenta"
                trailingGlyph="→"
                onClick={() => setStep("archetype")}
              >
                {L === "tr" ? "Sahneye gir" : "Enter the playground"}
              </CinemaCTA>
            }
          />
        ) : null}

        {step === "archetype" ? <ArchetypePicker lang={L} /> : null}
        {step === "zodiac" ? <AvatarPicker lang={L} /> : null}
        {step === "scene" ? (
          <ScenePicker lang={L} onGenerate={triggerRender} />
        ) : null}

        {(step === "render" || step === "result") ? (
          <>
            <RenderCanvas lang={L} onRetry={triggerRender} />
            {step === "result" && render.kind === "ready" ? (
              <LookActions
                lang={L}
                onSave={handleSave}
                onShare={handleShare}
                onReroll={triggerReroll}
                variant={variant}
                toast={toast}
              />
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
