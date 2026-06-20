"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import "./dunya.css";
import type { StoneData } from "./_components/MemoryStone";
import { createWorldAudio, type WorldAudio } from "./_components/worldAudio";

const World = dynamic(() => import("./_components/World"), {
  ssr: false,
  loading: () => <div className="dw-loading">Dünya uyanıyor…</div>,
});

export default function DunyaPage() {
  const [active, setActive] = useState<StoneData | null>(null);
  const audioRef = useRef<WorldAudio | null>(null);
  const startedRef = useRef(false);

  const begin = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    audioRef.current = createWorldAudio();
    audioRef.current.start();
  };

  useEffect(() => {
    audioRef.current?.enter(active?.id ?? null);
  }, [active]);

  useEffect(() => () => audioRef.current?.stop(), []);

  return (
    <div className="dw-root" onPointerDown={begin}>
      <World onActive={setActive} />

      <header className="dw-head">
        <span className="dw-title">CAELINUS</span>
        <span className="dw-sub">GAİA BAHÇESİ</span>
      </header>

      <div className={`dw-memory ${active ? "on" : ""}`}>
        {active && (
          <>
            <p className="dw-mname">{active.name}</p>
            <p className="dw-mfrag">&ldquo;{active.fragment}&rdquo;</p>
          </>
        )}
      </div>

      <p className="dw-hint">bir taşa yaklaş · dokun · hatırla</p>
    </div>
  );
}
