"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./deneyim.css";
import { createJourneyAudio, type JourneyAudio } from "./_components/journeyAudio";

const GaiaExperience = dynamic(() => import("./_components/GaiaExperience"), {
  ssr: false,
  loading: () => <div className="gx-loading">Gaia uyanıyor…</div>,
});

const MANTRAS = [
  "Burası seni zaten tanıyordu.", // giriş
  "Toprak senden önce de seni biliyordu.", // yaklaşma
  "Hatırlamak için geldin.", // merkez
] as const;

function stageFor(p: number): number {
  if (p >= 0.7) return 2;
  if (p >= 0.12) return 1;
  return 0;
}

export default function GaiaDeneyimPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const audioRef = useRef<JourneyAudio | null>(null);
  const startedRef = useRef(false);
  const touchRef = useRef(0);

  const [stage, setStage] = useState(0);
  const [fading, setFading] = useState(false);
  const [moved, setMoved] = useState(false);
  const [veil, setVeil] = useState(false);

  const leaves = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        left: `${4 + ((i * 11 + (i % 3) * 7) % 92)}%`,
        dur: `${9 + (i % 5) * 2.5}s`,
        delay: `${(i % 6) * 1.7}s`,
        scale: 0.7 + (i % 4) * 0.25,
      })),
    [],
  );

  const apply = useCallback((p: number) => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--gx-zoom", p.toFixed(3));
    el.style.setProperty("--gx-progress", p.toFixed(3));
    audioRef.current?.setIntensity(p);
  }, []);

  const beginAudio = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!audioRef.current) audioRef.current = createJourneyAudio();
    audioRef.current.start();
  }, []);

  const advance = useCallback(
    (delta: number) => {
      beginAudio();
      if (!moved) setMoved(true);
      const next = Math.max(0, Math.min(1, progressRef.current + delta));
      progressRef.current = next;
      apply(next);
      const s = stageFor(next);
      setStage((prev) => {
        if (prev !== s) {
          setFading(true);
          window.setTimeout(() => setFading(false), 520);
        }
        return s;
      });
    },
    [apply, beginAudio, moved],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      advance(e.deltaY * 0.0011);
    },
    [advance],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    el.style.setProperty("--gx-px", (-x * 1.6).toFixed(2));
    el.style.setProperty("--gx-py", (-y * 1.2).toFixed(2));
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = e.touches[0]?.clientY ?? 0;
  }, []);
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      advance((touchRef.current - y) * 0.0016);
      touchRef.current = y;
    },
    [advance],
  );

  const onExit = useCallback(() => {
    setVeil(true);
    window.setTimeout(() => {
      window.location.href = "/universe/gaia";
    }, 1500);
  }, []);

  useEffect(() => {
    apply(0);
    return () => audioRef.current?.stop();
  }, [apply]);

  return (
    <div
      ref={rootRef}
      className="gx-root"
      onWheel={onWheel}
      onPointerMove={onPointerMove}
      onPointerDown={beginAudio}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <div className="gx-bg" aria-hidden />
      <div className="gx-veins" aria-hidden />
      <div className="gx-pulse" aria-hidden />

      <div className="gx-canvas">
        <GaiaExperience />
      </div>

      {leaves.map((l, i) => (
        <span
          key={i}
          className="gx-leaf"
          aria-hidden
          style={{ left: l.left, animationDuration: l.dur, animationDelay: l.delay, transform: `scale(${l.scale})` }}
        />
      ))}

      <header className="gx-head">
        <span className="gx-title">GAIA</span>
        <span className="gx-sub">KÖKLÜLÜK</span>
      </header>

      <button type="button" className="gx-exit" onClick={onExit}>
        ← geri
      </button>

      <div className="gx-overlay">
        <p className={`gx-mantra ${fading ? "fading" : ""}`}>&ldquo;{MANTRAS[stage]}&rdquo;</p>
        <p className={`gx-hint ${moved ? "gone" : ""}`}>↓ kaydır — ağaca yaklaş</p>
      </div>

      <div className={`gx-veil ${veil ? "on" : ""}`} aria-hidden>
        <p>&ldquo;Kalbin yolu unutmaz.&rdquo;</p>
      </div>
    </div>
  );
}
