"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { createCodexRoomTone, type Ambience } from "@/lib/caelinus/ambience";

export default function CodexAmbientAudio() {
  const pathname = usePathname();
  const ambienceRef = useRef<Ambience | null>(null);
  const mutedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const start = () => {
      if (ambienceRef.current) return;
      try {
        ambienceRef.current = createCodexRoomTone();
        ambienceRef.current.resume();
        setStarted(true);
      } catch {
        ambienceRef.current = null;
      }
    };
    const onVisibility = () => {
      ambienceRef.current?.setMuted(document.hidden || mutedRef.current);
    };
    window.addEventListener("caelinus:codex-enter", start);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("caelinus:codex-enter", start);
      document.removeEventListener("visibilitychange", onVisibility);
      ambienceRef.current?.dispose();
      ambienceRef.current = null;
    };
  }, []);

  if (pathname.startsWith("/archive/internal")) return null;
  if (!started && (pathname === "/archive" || pathname === "/")) return null;

  const toggle = () => {
    if (!ambienceRef.current) {
      try {
        ambienceRef.current = createCodexRoomTone();
        ambienceRef.current.resume();
        setStarted(true);
        setMuted(false);
      } catch {
        ambienceRef.current = null;
      }
      return;
    }
    const next = !muted;
    mutedRef.current = next;
    ambienceRef.current.setMuted(next);
    setMuted(next);
  };

  return (
    <button
      type="button"
      className="codex-ambient"
      onClick={toggle}
      aria-pressed={started && !muted}
      aria-label={!started ? "Start Codex ambience" : muted ? "Unmute Codex ambience" : "Mute Codex ambience"}
    >
      <span aria-hidden="true">{!started || muted ? "◌" : "◉"}</span>
      <span>{!started ? "Ambience" : muted ? "Muted" : "Listening"}</span>
    </button>
  );
}
