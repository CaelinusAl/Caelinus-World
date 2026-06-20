"use client";

/**
 * DwellTracker — Gaia sahnesi oturum-süresi telemetrisi (görünmez, DOM yok).
 *
 * Başarı metriği: "Gaia'ya giren kullanıcı 30 sn'den fazla kalıyor mu?"
 * - Yalnız GÖRÜNÜR süreyi sayar (sekme arka plana alınınca durur).
 * - 30sn eşiği aşılınca bir kez 'heartbeat30' yollar (ayrılış beacon'ı kaybolsa
 *   bile eşik verisi garanti).
 * - Ayrılışta (visibility hidden / pagehide / SPA unmount) 'leave' + toplam süre.
 * - navigator.sendBeacon ile best-effort; analizde session başına MAX(dwell_ms).
 *
 * Sahne kodu (GaiaScene/page.tsx) DEĞİŞTİRİLMEZ — bu bileşen layout'tan mount edilir.
 */

import { useEffect } from "react";

const THRESHOLD_MS = 30_000;

type Props = { scene?: string; variant?: string };

export default function DwellTracker({ scene = "gaia", variant = "baseline" }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let sessionKey: string;
    try {
      const existing = sessionStorage.getItem("cae_dwell_sk");
      if (existing) {
        sessionKey = existing;
      } else {
        sessionKey =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
        sessionStorage.setItem("cae_dwell_sk", sessionKey);
      }
    } catch {
      sessionKey = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    }

    let visibleStart = Date.now();
    let accumulated = 0; // toplam görünür süre (ms)
    let interactions = 0;
    let sent30 = false;
    let thresholdTimer: number | undefined;

    const visibleMs = () =>
      accumulated +
      (document.visibilityState === "visible" ? Date.now() - visibleStart : 0);

    const send = (reason: string, dwellMs: number) => {
      const payload = JSON.stringify({
        scene,
        variant,
        sessionKey,
        dwellMs: Math.round(dwellMs),
        interactions,
        reason,
      });
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            "/api/dwell",
            new Blob([payload], { type: "application/json" })
          );
        } else {
          void fetch("/api/dwell", {
            method: "POST",
            body: payload,
            keepalive: true,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch {
        /* best-effort */
      }
    };

    const armThreshold = () => {
      if (sent30) return;
      const remaining = THRESHOLD_MS - visibleMs();
      if (remaining <= 0) {
        sent30 = true;
        send("heartbeat30", visibleMs());
        return;
      }
      thresholdTimer = window.setTimeout(() => {
        if (!sent30 && document.visibilityState === "visible") {
          sent30 = true;
          send("heartbeat30", visibleMs());
        }
      }, remaining);
    };

    const onInteract = () => {
      interactions += 1;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        accumulated += Date.now() - visibleStart;
        if (thresholdTimer) {
          clearTimeout(thresholdTimer);
          thresholdTimer = undefined;
        }
        send("leave", accumulated);
      } else {
        visibleStart = Date.now();
        armThreshold();
      }
    };

    const onPageHide = () => send("leave", visibleMs());

    window.addEventListener("pointerdown", onInteract, { passive: true });
    window.addEventListener("keydown", onInteract);
    window.addEventListener("wheel", onInteract, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    armThreshold();

    return () => {
      send("leave", visibleMs()); // SPA route değişiminde ayrılışı yakala
      if (thresholdTimer) clearTimeout(thresholdTimer);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("wheel", onInteract);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [scene, variant]);

  return null;
}
