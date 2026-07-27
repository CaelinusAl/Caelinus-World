"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createTempleEntranceSound, type Ambience } from "@/lib/caelinus/ambience";

import AtmosphericField from "./AtmosphericField";

type CinematicIntroProps = {
  onBegin: () => void;
  onEnter: () => void;
};

export default function CinematicIntro({ onBegin, onEnter }: CinematicIntroProps) {
  const [phase, setPhase] = useState<"idle" | "opening">("idle");
  const [showThresholdTitle, setShowThresholdTitle] = useState(false);
  const phaseRef = useRef<"idle" | "opening">("idle");
  const ambienceRef = useRef<Ambience | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handedOffRef = useRef(false);

  const finish = useCallback(() => {
    if (handedOffRef.current) return;
    handedOffRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      window.localStorage.setItem("caelinus:temple-threshold-seen", "1");
    } catch {
      // Storage may be unavailable in private/locked-down contexts.
    }
    ambienceRef.current?.dispose();
    ambienceRef.current = null;
    onEnter();
  }, [onEnter]);

  const begin = () => {
    if (phase !== "idle") return;
    onBegin();
    try {
      setShowThresholdTitle(
        window.localStorage.getItem("caelinus:temple-threshold-seen") !== "1",
      );
    } catch {
      setShowThresholdTitle(true);
    }
    try {
      ambienceRef.current = createTempleEntranceSound();
      ambienceRef.current.resume();
    } catch {
      ambienceRef.current = null;
    }
    phaseRef.current = "opening";
    setPhase("opening");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timerRef.current = setTimeout(finish, reduced ? 250 : 9600);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phaseRef.current === "opening") finish();
    };
    const onVisibility = () => ambienceRef.current?.setMuted(document.hidden);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!handedOffRef.current) ambienceRef.current?.dispose();
    };
  }, [finish]);

  return (
    <section
      className={`archive-intro is-${phase}`}
      aria-labelledby="archive-intro-title"
      aria-describedby="archive-intro-subtitle"
    >
      <div className="archive-intro__light" aria-hidden="true" />
      <AtmosphericField />

      <div className="archive-temple-stage" aria-hidden="true">
        <div className="archive-temple-door">
          <div className="archive-temple-door__lintel" />
          <div className="archive-temple-stones">
            {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
          </div>
          <div className="archive-temple-door__leaf is-left" />
          <div className="archive-temple-door__leaf is-right" />
          <div className="archive-temple-seal">✶</div>
          <div className="archive-temple-door__beyond">
            <div className="archive-genesis-book">
              <div className="archive-genesis-book__cover" />
              <div className="archive-genesis-book__pages">
                <span>GENESIS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showThresholdTitle ? (
        <div className="archive-threshold-title">
          <h1 id="archive-intro-title">Temple of Silence</h1>
          <p id="archive-intro-subtitle">The Living Codex of Caelinus</p>
        </div>
      ) : (
        <>
          <span id="archive-intro-title" className="sr-only">Temple of Silence</span>
          <span id="archive-intro-subtitle" className="sr-only">The Living Codex of Caelinus</span>
        </>
      )}

      <div className="archive-intro__content">
        {phase === "idle" ? (
          <button type="button" className="archive-enter" onClick={begin} autoFocus>
            <span>Yaklaş</span>
          </button>
        ) : null}
      </div>
      {phase === "opening" ? (
        <button type="button" className="archive-intro__skip" onClick={finish}>
          Girişi atla
        </button>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {phase === "opening" ? "Taşlar hareket ediyor. Genesis kitabına yaklaşılıyor." : ""}
      </p>
    </section>
  );
}
