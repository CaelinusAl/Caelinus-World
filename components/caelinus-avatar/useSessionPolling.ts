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

  useEffect(() => {
    if (!sessionId) {
      setState({ session: null, error: null });
      return;
    }

    stoppedRef.current = false;
    failCountRef.current = 0;

    const tick = async () => {
      if (stoppedRef.current) return;
      try {
        const res = await fetch(`/api/avatar/session/${sessionId}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          setState({ session: null, error: "Session süresi doldu." });
          stoppedRef.current = true;
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { session: AvatarSession };
        failCountRef.current = 0;
        setState({ session: data.session, error: null });

        if (
          data.session.status === "ready" ||
          data.session.status === "error" ||
          data.session.status === "expired"
        ) {
          stoppedRef.current = true;
          return;
        }
      } catch (err) {
        failCountRef.current += 1;
        if (failCountRef.current >= MAX_NETWORK_FAILS) {
          setState((s) => ({
            ...s,
            error: "Backend ile bağlantı kurulamıyor.",
          }));
          stoppedRef.current = true;
          return;
        }
        console.warn("[useSessionPolling] tick error:", err);
      }

      if (!stoppedRef.current) {
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
    };
  }, [sessionId]);

  return state;
}
