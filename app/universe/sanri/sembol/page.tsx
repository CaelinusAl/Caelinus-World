"use client";

/**
 * SANRI · Sembol — haftalık sembol + metin sembolik analizi.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import SanriTextTool from "../_components/SanriTextTool";
import { weeklySymbol, analyzeSymbol } from "@/lib/sanri/client";
import "../sanri.css";

function pickText(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

export default function SanriSembolPage() {
  const [symbol, setSymbol] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let alive = true;
    weeklySymbol("tr")
      .then((s) => alive && setSymbol(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const title = symbol ? pickText(symbol, ["symbol", "title", "name"]) : "";
  const body = symbol ? pickText(symbol, ["reading", "message", "meaning", "text", "description"]) : "";

  return (
    <main className="sanri-page">
      <div className="sanri-bg" aria-hidden="true">
        <div className="sanri-moon" />
        <div className="sanri-mist" />
      </div>

      <div className="sanri-shell">
        <header className="sanri-hero">
          <p className="sanri-kicker">SANRI · SEMBOL</p>
          <h1 className="sanri-title">Sembol</h1>
          <p className="sanri-lede">
            Haftanın sembolünü gör; sonra kendi metnini ver, ardındaki sembolik ve
            numerolojik katmanı okuyalım.
          </p>
        </header>

        {(title || body) && (
          <section className="sanri-symbol-card">
            <p className="sanri-symbol-kicker">HAFTANIN SEMBOLÜ</p>
            {title && <h2 className="sanri-symbol-title">{title}</h2>}
            {body && <p className="sanri-symbol-body">{body}</p>}
          </section>
        )}

        <section className="sanri-section">
          <SanriTextTool
            placeholder="Bir cümle, bir isim ya da bir metin yaz; sembolik analizini al…"
            cta="Sembolü Çöz"
            run={async (text) => {
              const r = await analyzeSymbol(text);
              const t = pickText(r, ["analysis", "reading", "message", "text", "result"]);
              return t || JSON.stringify(r, null, 2);
            }}
          />
        </section>

        <div className="sanri-foot">
          <Link href="/universe/sanri" className="sanri-back">← Tapınağa Dön</Link>
          <span className="sanri-whisper">Her sembol bir kapıdır.</span>
        </div>
      </div>
    </main>
  );
}
