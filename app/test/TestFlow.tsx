"use client";

/**
 * Caelinus Bilinç Testi — canlı akış (client).
 * 12 soru → sonuç (Ana/İkincil/Gölge/Kapı/Çağrı) → Bilinç Kartı →
 * "Bu kart seni yüzde kaç anlattı?" → kayıt (best-effort).
 *
 * Tüm hesaplama saf veri/skorlama: @/data/avatar-test.
 */

import { useMemo, useRef, useState } from "react";

import {
  AVATAR_TEST_QUESTIONS,
  scoreAvatarTest,
  type AvatarTestResult,
  type TestAnswers,
} from "@/data/avatar-test";
import type { AvatarDistrictId } from "@/data/avatar-districts";

/* District görsel kimliği (kart aksanları). */
const META: Record<AvatarDistrictId, { name: string; color: string; glyph: string }> = {
  source:    { name: "Source",    color: "#f4ead0", glyph: "🌀" },
  mirror:    { name: "Mirror",    color: "#cfd8e6", glyph: "🪞" },
  sanri:     { name: "Sanri",     color: "#c9d4e6", glyph: "👁️" },
  gaia:      { name: "Gaia",      color: "#79e6a0", glyph: "🌳" },
  bazaar:    { name: "Bazaar",    color: "#ffe9b8", glyph: "🔥" },
  atelier:   { name: "Atelier",   color: "#d8c39a", glyph: "⚒️" },
  sanctuary: { name: "Sanctuary", color: "#f3d9c9", glyph: "🪽" },
  temple:    { name: "Temple",    color: "#b9b9c2", glyph: "🕯️" },
};

const TOTAL = AVATAR_TEST_QUESTIONS.length;

export default function TestFlow() {
  const [answers, setAnswers] = useState<TestAnswers>({});
  const [step, setStep] = useState(0); // 0..TOTAL-1 = soru, TOTAL = sonuç
  const [accuracy, setAccuracy] = useState(70);
  const [submitted, setSubmitted] = useState(false);
  const sessionKey = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  );

  const answeredCount = Object.keys(answers).length;
  const result: AvatarTestResult | null = useMemo(
    () => (answeredCount >= TOTAL ? scoreAvatarTest(answers) : null),
    [answers, answeredCount],
  );

  function choose(qid: string, idx: number) {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
    setStep((s) => Math.min(s + 1, TOTAL));
  }

  async function submit() {
    if (!result) return;
    setSubmitted(true);
    try {
      await fetch("/api/avatar-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary: result.primary,
          secondary: result.secondary,
          shadow: result.shadow,
          gate: result.gate,
          calling: result.calling,
          lightScores: result.lightScores,
          shadowScores: result.shadowScores,
          accuracy,
          sessionKey: sessionKey.current,
        }),
      });
    } catch {
      /* best-effort; sonuç zaten ekranda */
    }
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setAccuracy(70);
    setSubmitted(false);
    sessionKey.current =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  }

  /* ── Sonuç ekranı ── */
  if (step >= TOTAL && result) {
    return <ResultView result={result} accuracy={accuracy} setAccuracy={setAccuracy} submitted={submitted} onSubmit={submit} onRestart={restart} />;
  }

  /* ── Soru ekranı ── */
  const q = AVATAR_TEST_QUESTIONS[step];
  const progress = Math.round((step / TOTAL) * 100);

  return (
    <section className="ct-quiz">
      <header className="ct-head">
        <span className="ct-mark">🌀 CAELINUS</span>
        <span className="ct-count">{step + 1} / {TOTAL}</span>
      </header>
      <div className="ct-progress"><div className="ct-progress-fill" style={{ width: `${progress}%` }} /></div>

      <p className="ct-axis">{q.axis === "light" ? "✦ Doğal hâlin" : "☾ Zorlandığında"}</p>
      <h1 className="ct-q">{q.prompt}</h1>

      <ul className="ct-options">
        {q.options.map((o, i) => (
          <li key={i}>
            <button className="ct-option" onClick={() => choose(q.id, i)}>
              {o.label}
            </button>
          </li>
        ))}
      </ul>

      {step > 0 && (
        <button className="ct-back" onClick={() => setStep((s) => Math.max(0, s - 1))}>← geri</button>
      )}
    </section>
  );
}

/* ────────── Sonuç + Kart ────────── */

function Row({ label, district, dim }: { label: string; district: AvatarDistrictId; dim?: boolean }) {
  const m = META[district];
  return (
    <div className="ct-row">
      <span className="ct-row-label">{label}</span>
      <span className="ct-row-value" style={{ color: m.color, opacity: dim ? 0.8 : 1 }}>
        <span className="ct-dot" style={{ background: m.color }} /> {m.glyph} {m.name}
      </span>
    </div>
  );
}

function ResultView({
  result, accuracy, setAccuracy, submitted, onSubmit, onRestart,
}: {
  result: AvatarTestResult;
  accuracy: number;
  setAccuracy: (n: number) => void;
  submitted: boolean;
  onSubmit: () => void;
  onRestart: () => void;
}) {
  return (
    <section className="ct-result">
      {/* Paylaşılabilir kart */}
      <div className="ct-card">
        <div className="ct-card-top">
          <span className="ct-card-mark">🌀 CAELINUS</span>
          <span className="ct-card-sub">BİLİNÇ KARTI</span>
        </div>

        <div className="ct-rows">
          <Row label="ANA BİLİNÇ" district={result.primary} />
          <Row label="İKİNCİL BİLİNÇ" district={result.secondary} />
          <Row label="DÜŞTÜĞÜN GÖLGE" district={result.shadow} dim />
          <Row label="KAPIN" district={result.gate} />
        </div>

        <div className="ct-calling">
          <span className="ct-calling-label">ÇAĞRIN</span>
          <span className="ct-calling-value">{result.calling}</span>
        </div>

        <div className="ct-block">
          <span className="ct-block-label">ŞU AN</span>
          <p className="ct-reading">{result.reading}</p>
        </div>

        <div className="ct-block ct-next">
          <span className="ct-block-label">SONRAKİ ADIM</span>
          <p className="ct-nextstep">{result.nextStep}</p>
        </div>

        <p className="ct-motto">“Her gölgenin bir kapısı vardır.”</p>
      </div>

      {/* Altın veri: % kaç anlattı */}
      {!submitted ? (
        <div className="ct-accuracy">
          <label className="ct-acc-q">Bu kart seni yüzde kaç anlattı?</label>
          <div className="ct-acc-val">{accuracy}%</div>
          <input
            type="range" min={0} max={100} value={accuracy}
            onChange={(e) => setAccuracy(Number(e.target.value))}
            className="ct-slider"
          />
          <button className="ct-submit" onClick={onSubmit}>Gönder</button>
        </div>
      ) : (
        <div className="ct-thanks">
          <p>Teşekkürler. Bilincin kaydedildi. 🌙</p>
          <p className="ct-thanks-sub">Şu an buradasın. Çıkış kapın burada.</p>
          <button className="ct-restart" onClick={onRestart}>Tekrar dene</button>
        </div>
      )}
    </section>
  );
}
