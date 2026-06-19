"use client";

/**
 * /universe/gaia/sahne — Universe 2.0 · Gaia (gezilebilir district sahnesi)
 *
 * Hibrit: mevcut render arka plan + yürünebilir 3B objeler. R3F yalnız
 * tarayıcıda çalışır → sahne dynamic(ssr:false). DOM overlay bilinç katmanını
 * (mantra / Çağrı / Kapı) ve ambient ses toggle'ını taşır.
 */

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sound, setSound] = useState(false);

  function toggleSound() {
    const a = audioRef.current;
    if (!a) return;
    if (sound) {
      a.pause();
      setSound(false);
    } else {
      // best-effort: dosya yoksa/oynatılamıyorsa sessizce yut
      a.play().then(() => setSound(true)).catch(() => setSound(false));
    }
  }

  return (
    <main className="gsahne-root">
      <div className="gsahne-canvas">
        <GaiaScene onEnter={() => router.push("/universe/gaia")} />
      </div>

      {/* Ambient ses — opsiyonel asset: public/universe/gaia-ambient.mp3 */}
      <audio ref={audioRef} src="/universe/gaia-ambient.mp3" loop preload="none" />

      {/* ── Bilinç katmanı (overlay) ── */}
      <header className="gsahne-top">
        <span className="gsahne-name">🌳 GAIA</span>
        <span className="gsahne-emotion">Köklülük</span>
      </header>

      <button className="gsahne-sound" onClick={toggleSound} aria-label="Ortam sesi">
        {sound ? "🔊" : "🔇"}
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
    </main>
  );
}
