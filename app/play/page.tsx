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

import {
  ARCHETYPES,
  SCENES,
  ZODIACS,
  lookCacheKey,
  type ArchetypeId,
  type SceneId,
  type ZodiacId,
} from "@/data/play-assets";
import { findPreset } from "@/data/play-presets";
import { briefHash } from "@/lib/play/brief";
import { useAuthStore } from "@/stores/auth-store";
import { useLangStore } from "@/stores/lang-store";
import { usePlayStore } from "@/stores/play-store";

import PlayDashboard from "./_components/PlayDashboard";

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
  // Set when ?preset=<id> seeded a full triple — picked up by a
  // dedicated effect below so we render exactly once per mount, after
  // the lang store has hydrated and Zustand state has settled.
  const [pendingAutoRender, setPendingAutoRender] = useState(false);

  // Auto-dismiss toasts so the action row doesn't keep stale text.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Honour ?preset=<id> and ?archetype=…&zodiac=…&scene=… so the gallery
  // (and investor demo links) can deep-link someone straight into a
  // known-good triple. We do this once per mount; the user can still
  // navigate steps freely after. `?preset=wow` is the investor-facing
  // flagship — it also flips `pendingAutoRender` so the render fires
  // on its own as soon as state has settled.
  useEffect(() => {
    if (seededFromUrlRef.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    // Presets win over loose params — they're explicit + curated.
    const preset = findPreset(params.get("preset"));
    if (preset) {
      setArchetype(preset.archetype);
      setZodiac(preset.zodiac);
      setScene(preset.scene);
      setStep("scene");
      setPendingAutoRender(true);
      seededFromUrlRef.current = true;
      return;
    }

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
  //
  // Timeout protection: the server route caps Replicate polling at 60s,
  // but a stalled connection (slow DNS, dropped TCP, hung CDN) could
  // theoretically freeze the client forever. We arm an AbortController
  // at 75s (server budget + 15s buffer) so the user always gets back
  // to a retry-able error state instead of an infinite shimmer.
  const triggerRender = useCallback(async () => {
    if (!archetype || !zodiac || !scene) return;
    beginRender();
    // Read variant + brief from the store at call time so a re-roll
    // that just bumped the index doesn't race a stale closure.
    const { variant: currentVariant, brief: currentBrief } =
      usePlayStore.getState();
    const controller = new AbortController();
    const abortTimer = window.setTimeout(() => controller.abort(), 75_000);
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
        signal: controller.signal,
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
      // AbortError = our 75s safety net fired. Give the user a clear
      // "provider is slow, hit retry" message instead of the generic
      // "connection failed" line — they can click Try again and the
      // next attempt usually lands inside 25s.
      const isAbort =
        err instanceof DOMException && err.name === "AbortError";
      setRenderError(
        isAbort
          ? L === "tr"
            ? "AI sağlayıcı 75 saniye içinde yanıt vermedi. Tekrar dene."
            : "The AI provider didn't respond within 75s. Try again."
          : err instanceof Error
            ? err.message
            : L === "tr"
              ? "Bağlantı kurulamadı."
              : "Connection failed.",
      );
    } finally {
      window.clearTimeout(abortTimer);
    }
  }, [archetype, zodiac, scene, beginRender, setRenderResult, setRenderError, L]);

  // ── Auto-render after preset seeding ──────────────────────
  // `?preset=<id>` flipped pendingAutoRender; once Zustand has the full
  // triple settled and we're not already rendering, fire once and clear
  // the flag. The triggerRender callback closes over the latest state,
  // so by the time this effect runs the request will carry the right
  // (archetype, zodiac, scene) tuple.
  useEffect(() => {
    if (!pendingAutoRender) return;
    if (!archetype || !zodiac || !scene) return;
    if (render.kind === "loading" || render.kind === "ready") return;
    setPendingAutoRender(false);
    void triggerRender();
  }, [pendingAutoRender, archetype, zodiac, scene, render.kind, triggerRender]);

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
        <PlayDashboard
          lang={L}
          onGenerate={triggerRender}
          onRetry={triggerRender}
          onSave={handleSave}
          onShare={handleShare}
          onReroll={triggerReroll}
          toast={toast}
        />
      </main>
    </div>
  );
}
