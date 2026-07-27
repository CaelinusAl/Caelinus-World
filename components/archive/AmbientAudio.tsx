"use client";

import { useEffect, useRef, useState } from "react";

import { createAmbience, type Ambience } from "@/lib/caelinus/ambience";

type AmbientAudioProps = {
  initialAmbience?: Ambience | null;
};

export default function AmbientAudio({ initialAmbience = null }: AmbientAudioProps) {
  const ambience = useRef<Ambience | null>(initialAmbience);
  const mutedRef = useRef(false);
  const [enabled, setEnabled] = useState(Boolean(initialAmbience));
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const onVisibility = () => {
      ambience.current?.setMuted(document.hidden || mutedRef.current);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      ambience.current?.dispose();
      ambience.current = null;
    };
  }, []);

  const toggle = () => {
    if (!enabled) {
      ambience.current = createAmbience();
      ambience.current.resume();
      mutedRef.current = false;
      setEnabled(true);
      setMuted(false);
      return;
    }
    const next = !muted;
    mutedRef.current = next;
    ambience.current?.setMuted(next);
    setMuted(next);
  };

  return (
    <button
      type="button"
      className="archive-audio"
      aria-pressed={enabled && !muted}
      aria-label={!enabled ? "Ortam sesini başlat" : muted ? "Ortam sesini aç" : "Ortam sesini kapat"}
      onClick={toggle}
    >
      <span aria-hidden="true">{!enabled || muted ? "◌" : "◉"}</span>
      <span>{!enabled ? "Ambiyans" : muted ? "Sessiz" : "Ses açık"}</span>
    </button>
  );
}
