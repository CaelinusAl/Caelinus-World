"use client";

/**
 * SANRI · Fal — Matrix rol + isim numerolojisi okuması.
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { matrixRol } from "@/lib/sanri/client";
import "../sanri.css";

function pickText(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

export default function SanriFalPage() {
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!birth || busy) return;
    setBusy(true);
    setError(false);
    setResult(null);
    try {
      const r = await matrixRol({ name: name.trim() || undefined, birth_date: birth, lang: "tr" });
      const t = pickText(r, ["reading", "summary", "message", "text", "result"]);
      setResult(t || JSON.stringify(r, null, 2));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sanri-page">
      <div className="sanri-bg" aria-hidden="true">
        <div className="sanri-moon" />
        <div className="sanri-mist" />
      </div>

      <div className="sanri-shell">
        <header className="sanri-hero">
          <p className="sanri-kicker">SANRI · FAL</p>
          <h1 className="sanri-title">Fal</h1>
          <p className="sanri-lede">
            Doğum tarihin ve isminin matris rolünü oku; sayıların ardındaki rolü gör.
          </p>
        </header>

        <form className="sanri-tool" onSubmit={onSubmit}>
          <input
            className="sanri-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="İsim (opsiyonel)"
            disabled={busy}
          />
          <input
            className="sanri-input"
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            aria-label="Doğum tarihi"
            disabled={busy}
          />
          <button type="submit" className="sanri-send" disabled={busy || !birth}>
            {busy ? "Aynada okunuyor…" : "Rolünü Oku"}
          </button>

          {error && (
            <p className="sanri-error" role="alert">
              Ayna şu an puslandı — birazdan tekrar dene.
            </p>
          )}
          {result && <div className="sanri-tool-result">{result}</div>}
        </form>

        <div className="sanri-foot">
          <Link href="/universe/sanri" className="sanri-back">← Tapınağa Dön</Link>
          <span className="sanri-whisper">Sayılar, ruhun gizli alfabesidir.</span>
        </div>
      </div>
    </main>
  );
}
