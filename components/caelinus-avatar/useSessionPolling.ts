"use client";

/**
 * useSessionPolling — desktop'ta backend session state'ini periyodik
 * çeken hook.
 *
 * Davranış:
 *   • sessionId verilince her INTERVAL_MS'de bir GET /api/avatar/session/[id]
 *   • Status "ready" / "error" / "expired" olunca polling durur
 *   • 404 → expired olarak işaretlenir
 *   • Network hatası geçici → max 3 retry, sonra error
 *
 * Polling Vercel'de native — WebSocket'e geçmek istersen aynı state
 * machine korunur, sadece transport değişir.
 *
 * S2 — Resource hijyen (`AbortController` + mount-guard):
 *   • Her `tick()` kendi AbortController'ını kurar; unmount/yeni session
 *     halinde `controller.abort()` çağrılır, uçuştaki fetch hemen düşer.
 *   • `mountedRef` setState'i unmount sonrası tetiklemekten korur
 *     (React 19 + StrictMode dev double-mount'ında console warning yok).
 *   • Cleanup sırasında pending setTimeout `clearTimeout` ile iptal edilir
 *     ve `stoppedRef.current = true` ile tick döngüsü kendiliğinden çıkar.
 */

import { useEffect, useRef, useState } from "react";

import type { AvatarSession } from "@/lib/caelinus-avatar-core";

const INTERVAL_MS = 1500;
const MAX_NETWORK_FAILS = 3;

type State = {
  session: AvatarSession | null;
  error: string | null;
};

export function useSessionPolling(sessionId: string | null): State {
  const [state, setState] = useState<State>({ session: null, error: null });
  const failCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setState({ session: null, error: null });
      return;
    }

    stoppedRef.current = false;
    failCountRef.current = 0;

    /** Mount-safe state setter — unmount sonrası no-op. */
    const safeSetState = (next: State | ((s: State) => State)) => {
      if (!mountedRef.current) return;
      setState(next);
    };

    const tick = async () => {
      if (stoppedRef.current) return;

      // Bu tick'in kendi AbortController'ı — unmount sırasında
      // cleanup'tan abort edilir, fetch promise hemen reddeder.
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch(`/api/avatar/session/${sessionId}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (stoppedRef.current) return;

        if (res.status === 404) {
          safeSetState({ session: null, error: "Session süresi doldu." });
          stoppedRef.current = true;
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { session: AvatarSession };
        if (stoppedRef.current) return;

        failCountRef.current = 0;
        safeSetState({ session: data.session, error: null });

        if (
          data.session.status === "ready" ||
          data.session.status === "error" ||
          data.session.status === "expired"
        ) {
          stoppedRef.current = true;
          return;
        }
      } catch (err: unknown) {
        // Cleanup'tan kaynaklanan abort — sessizce çık, retry sayma.
        if ((err as { name?: string })?.name === "AbortError") {
          return;
        }
        failCountRef.current += 1;
        if (failCountRef.current >= MAX_NETWORK_FAILS) {
          safeSetState((s) => ({
            ...s,
            error: "Backend ile bağlantı kurulamıyor.",
          }));
          stoppedRef.current = true;
          return;
        }
        console.warn("[useSessionPolling] tick error:", err);
      } finally {
        // Bu tick bitince controller referansını temizle —
        // bir sonraki tick yeni controller alır.
        if (abortRef.current === ctrl) abortRef.current = null;
      }

      if (!stoppedRef.current && mountedRef.current) {
        timerRef.current = window.setTimeout(tick, INTERVAL_MS);
      }
    };

    void tick();

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Uçuştaki fetch'i kes — leak'i kapat
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [sessionId]);

  return state;
}
