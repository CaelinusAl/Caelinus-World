"use client";

/**
 * /universe/gaia/sahne — Universe 2.0 · Gaia (gezilebilir district sahnesi)
 *
 * Hibrit: mevcut render arka plan + yürünebilir 3B objeler. R3F yalnız
 * tarayıcıda → sahne dynamic(ssr:false). DOM overlay bilinç katmanını
 * (mantra / Çağrı / Kapı), ambient ses ve portal geçiş veil'ini taşır.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setAmbienceMuted, startAmbience, stopAmbience } from "./_components/ambience";
import "./sahne.css";

const GaiaScene = dynamic(() => import("./_components/GaiaScene"), {
  ssr: false,
  loading: () => (
    <div className="gsahne-loading">
      <span>🌳</span>
      <p>Gaia uyanıyor…</p>
    </div>
  ),
});

export default function GaiaSahnePage() {
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const [soundStarted, setSoundStarted] = useState(false);
  const [entering, setEntering] = useState(false);
  const enteringRef = useRef(false);

  // Ambient ses — ilk kullanıcı jestinde otomatik başlar (autoplay politikası).
  useEffect(() => {
    const onFirstGesture = () => {
      if (startAmbience()) setSoundStarted(true);
      window.removeEventListener("pointerdown", onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: false });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      stopAmbience();
    };
  }, []);

  function toggleSound() {
    if (!soundStarted) {
      if (startAmbience()) {
        setSoundStarted(true);
        setMuted(false);
      }
      return;
    }
    const next = !muted;
    setMuted(next);
    setAmbienceMuted(next);
  }

  // Portala dokununca geçiş hissi: veil dolar → bahçeye in.
  const enterPortal = useCallback(() => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    setEntering(true);
    setTimeout(() => router.push("/universe/gaia"), 1100);
  }, [router]);

  return (
    <main className="gsahne-root">
      <div className="gsahne-canvas">
        <GaiaScene onEnter={enterPortal} />
      </div>

      {/* ── Bilinç katmanı (overlay) ── */}
      <header className="gsahne-top">
        <span className="gsahne-name">🌳 GAIA</span>
        <span className="gsahne-emotion">Köklülük</span>
      </header>

      <button className="gsahne-sound" onClick={toggleSound} aria-label="Ortam sesi">
        {soundStarted && !muted ? "🔊" : "🔇"}
      </button>

      <div className="gsahne-card">
        <p className="gsahne-mantra">“Nature remembers what the human heart forgets.”</p>
        <div className="gsahne-meta">
          <span><b>Çağrı</b> · Şifacı</span>
          <span className="gsahne-sep">·</span>
          <span><b>Kapı</b> · Mirror</span>
        </div>
      </div>

      <div className="gsahne-hint">sürükle · döndür · yakınlaştır — <b>portala dokun</b> bahçeye in</div>

      <nav className="gsahne-nav">
        <button className="gsahne-link" onClick={() => router.push("/universe")}>← Galaksi</button>
        <button className="gsahne-link gsahne-link-go" onClick={() => router.push("/universe/gaia")}>
          Gaia’s Garden’a gir →
        </button>
      </nav>

      {/* Portal geçiş veil'i */}
      <div className={`gsahne-veil${entering ? " is-entering" : ""}`} aria-hidden="true">
        <span className="gsahne-veil-glyph">🌀</span>
      </div>
    </main>
  );
}
