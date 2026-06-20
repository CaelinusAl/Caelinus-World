"use client";

/**
 * /universe — Caelinus Evreni Ana Meydanı
 *
 * Three.js interaktif sahne: Yaşam Motoru merkezde,
 * 4 ışık yolu SANRI / GAIA / BAZAAR / ATELİER'e açılır.
 * SSR: ssr:false — Three.js sadece tarayıcıda (bu yüzden sayfa client component).
 */
import dynamic from "next/dynamic";

const CaelinusUniverseScene = dynamic(
  () => import("@/components/universe/CaelinusUniverseScene"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#000006",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "4px",
            color: "#6655aa",
            opacity: 0.5,
          }}
        >
          ✦
        </div>
      </div>
    ),
  }
);

export default function UniversePage() {
  return <CaelinusUniverseScene />;
}
