/**
 * SANRI · Sanrı'ya Sor — bilinç aynası sohbeti.
 */

import type { Metadata } from "next";
import Link from "next/link";
import SanriChat from "../_components/SanriChat";
import "../sanri.css";

export const metadata: Metadata = {
  title: "Sanrı'ya Sor — SANRI · Caelinus",
  description: "Bilinç aynası: bir soru, bir sıkışma, bir eşik anlat; Sanrı sana ayna tutsun.",
};

export default function SanriAskPage() {
  return (
    <main className="sanri-page">
      <div className="sanri-bg" aria-hidden="true">
        <div className="sanri-moon" />
        <div className="sanri-mist" />
      </div>

      <div className="sanri-shell">
        <header className="sanri-hero">
          <p className="sanri-kicker">SANRI · BİLİNÇ AYNASI</p>
          <h1 className="sanri-title">Sanrı'ya Sor</h1>
          <p className="sanri-lede">
            Yargı değil, ayna. Bir düşünce döngüsü, bir karar eşiği ya da içindeki
            sessiz soru — aynaya bırak.
          </p>
        </header>

        <SanriChat />

        <div className="sanri-foot">
          <Link href="/universe/sanri" className="sanri-back">← Tapınağa Dön</Link>
          <span className="sanri-whisper">Ayna, kalbin unuttuğunu hatırlar.</span>
        </div>
      </div>
    </main>
  );
}
