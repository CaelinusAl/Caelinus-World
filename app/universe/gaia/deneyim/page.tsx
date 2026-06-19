"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import "./deneyim.css";

const GaiaExperience = dynamic(() => import("./_components/GaiaExperience"), {
  ssr: false,
  loading: () => <div className="gx-loading">Gaia uyanıyor…</div>,
});

export default function GaiaDeneyimPage() {
  const [veil, setVeil] = useState(false);

  const onEnter = useCallback(() => {
    setVeil(true);
    window.setTimeout(() => {
      window.location.href = "/universe/gaia";
    }, 1100);
  }, []);

  return (
    <div className="gx-root">
      <GaiaExperience onEnter={onEnter} />

      <header className="gx-head">
        <span className="gx-title">GAIA</span>
        <span className="gx-sub">DENEYİM · ULTRA</span>
      </header>

      <div className="gx-overlay">
        <p className="gx-mantra">&ldquo;Nature remembers what the human heart forgets.&rdquo;</p>
        <p className="gx-meta">
          <b>Çağrı</b> · Şifacı &nbsp;·&nbsp; <b>Kapı</b> · Mirror
        </p>
        <p className="gx-hint">sürükle · döndür · yakınlaştır — portala dokun</p>
      </div>

      <div className={`gx-veil ${veil ? "on" : ""}`} aria-hidden />
    </div>
  );
}
