import Link from "next/link";
import CosmosHero from "./CosmosHero";

/**
 * /cosmos — Caelinus WebGL Dünyası + Anime.js'in canlı testbed'i.
 *
 * Arka plan SAYDAM: arkasında root layout'taki global WorldBackdrop
 * (WebGL cosmos sahnesi) görünür. Üstte CosmosHero, Anime.js v4 ile
 * başlığı stagger animasyonuyla açar. İkisi birleşince "içine girilen
 * canlı evren" hissi. Şeyma'nın koreografisi geldikçe diğer route'lara
 * (landing, /universe, gaia, sanctum) genişletilecek.
 */
export default function CosmosPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: "calc(var(--cae-page-top) + 8px) 32px 32px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Link href="/" style={{ opacity: 0.75 }}>
          ← UNIVERSE
        </Link>
        <CosmosHero />
      </div>
    </main>
  );
}
