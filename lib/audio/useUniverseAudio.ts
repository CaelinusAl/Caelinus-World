"use client";

/**
 * useUniverseAudio — Caelinus Evreni için ses kancaları (audio hooks).
 *
 * Tasarım kuralları:
 *   • ASLA autoplay yok. Ses yalnızca kullanıcı bir kez "enable" ettikten sonra
 *     çalar (tarayıcı autoplay politikalarıyla uyumlu, AAA web standardı).
 *   • Dosyalar henüz yoksa sessizce no-op olur (play promise yutulur) — böylece
 *     gerçek ses varlıkları sonradan /public/audio'ya eklenince otomatik çalışır.
 *   • Tüm kanca isimleri sahne olaylarına bağlanır: hover · click · warp ·
 *     arrival · ambience (uzay) · planet ambience.
 *
 * Gerçek varlık eklemek için: /public/audio/{ambient,hover,click,warp,arrive}.mp3
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Channel = "ambient" | "hover" | "click" | "warp" | "arrive" | "planet";

const SOURCES: Record<Channel, string> = {
  ambient: "/audio/space-ambient.mp3",
  hover: "/audio/hover.mp3",
  click: "/audio/click.mp3",
  warp: "/audio/warp.mp3",
  arrive: "/audio/arrive.mp3",
  planet: "/audio/planet-ambient.mp3",
};

const LOOPING: Partial<Record<Channel, boolean>> = {
  ambient: true,
  planet: true,
};

export function useUniverseAudio() {
  const [enabled, setEnabled] = useState(false);
  const elements = useRef<Partial<Record<Channel, HTMLAudioElement>>>({});
  const lastHover = useRef(0);

  // Lazy element üretimi — yalnızca tarayıcıda, etkinleştirilince.
  const el = useCallback((ch: Channel) => {
    if (typeof window === "undefined") return null;
    let a = elements.current[ch];
    if (!a) {
      a = new Audio(SOURCES[ch]);
      a.loop = !!LOOPING[ch];
      a.preload = "none";
      a.volume = ch === "ambient" ? 0.32 : ch === "planet" ? 0.28 : 0.5;
      elements.current[ch] = a;
    }
    return a;
  }, []);

  const safePlay = useCallback(
    (ch: Channel, opts?: { restart?: boolean; volume?: number }) => {
      if (!enabled) return;
      const a = el(ch);
      if (!a) return;
      if (opts?.volume != null) a.volume = opts.volume;
      try {
        if (opts?.restart) a.currentTime = 0;
        void a.play().catch(() => {});
      } catch {
        /* varlık yok → sessiz */
      }
    },
    [enabled, el],
  );

  const stop = useCallback(
    (ch: Channel) => {
      const a = elements.current[ch];
      if (!a) return;
      try {
        a.pause();
        a.currentTime = 0;
      } catch {
        /* yok say */
      }
    },
    [],
  );

  // Kullanıcı jesti sonrası uzay ambiyansını başlat / durdur.
  useEffect(() => {
    if (enabled) safePlay("ambient");
    else {
      const all = elements.current;
      (Object.keys(all) as Channel[]).forEach((ch) => stop(ch));
    }
  }, [enabled, safePlay, stop]);

  // Sayfadan ayrılırken temizle.
  useEffect(() => {
    return () => {
      const all = elements.current;
      (Object.keys(all) as Channel[]).forEach((ch) => {
        const a = all[ch];
        if (a) {
          a.pause();
          a.src = "";
        }
      });
    };
  }, []);

  // ─── Sahne kancaları ───
  const onHover = useCallback(() => {
    const now = performance.now();
    if (now - lastHover.current < 90) return; // debounce
    lastHover.current = now;
    safePlay("hover", { restart: true, volume: 0.32 });
  }, [safePlay]);

  const onClick = useCallback(
    () => safePlay("click", { restart: true }),
    [safePlay],
  );
  const onWarp = useCallback(
    () => safePlay("warp", { restart: true, volume: 0.6 }),
    [safePlay],
  );
  const onArrive = useCallback(
    () => safePlay("arrive", { restart: true }),
    [safePlay],
  );

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { enabled, toggle, onHover, onClick, onWarp, onArrive };
}

export type UniverseAudio = ReturnType<typeof useUniverseAudio>;
