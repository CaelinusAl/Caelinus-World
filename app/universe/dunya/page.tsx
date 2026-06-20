"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import "./dunya.css";
import type { StoneData } from "./_components/MemoryStone";

const World = dynamic(() => import("./_components/World"), {
  ssr: false,
  loading: () => <div className="dw-loading">Dünya uyanıyor…</div>,
});

export default function DunyaPage() {
  const [active, setActive] = useState<StoneData | null>(null);

  return (
    <div className="dw-root">
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
