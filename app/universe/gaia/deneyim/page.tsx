"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";

import "./deneyim.css";

const GaiaExperience = dynamic(() => import("./_components/GaiaExperience"), {
  ssr: false,
  loading: () => <div className="gx-loading">Gaia uyanıyor…</div>,
});

export default function GaiaDeneyimPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  // pointer-parallax: matte arka plan + glow hafifçe kayar (2.5B derinlik)
  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    el.style.setProperty("--gx-px", (-x * 1.6).toFixed(2));
    el.style.setProperty("--gx-py", (-y * 1.2).toFixed(2));
  }, []);

  return (
    <div ref={rootRef} className="gx-root" onPointerMove={onMove}>
      <div className="gx-pulse" aria-hidden />
      <div className="gx-canvas">
        <GaiaExperience />
      </div>

      <header className="gx-head">
        <span className="gx-title">GAIA</span>
        <span className="gx-sub">KÖKLÜLÜK</span>
      </header>

      <div className="gx-overlay">
        <p className="gx-mantra">&ldquo;Nature remembers what the human heart forgets.&rdquo;</p>
        <p className="gx-meta">
          <b>Çağrı</b> · Şifacı &nbsp;·&nbsp; <b>Kapı</b> · Mirror
        </p>
        <p className="gx-hint">izle · hisset — Gaia&rsquo;nın kalbi atıyor</p>
      </div>
    </div>
  );
}
