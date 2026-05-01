/**
 * Caelinus default Open Graph image — 1200×630 cinematic kart.
 *
 * WhatsApp / LinkedIn / Twitter / Slack / Discord — `caelinus.ai`
 * paylaşıldığında açılan zarf bu görsel olur. Yatırımcı linke
 * tıklamadan önceki ilk izlenim. Her şey bu kart üzerinden konuşur.
 *
 * Tasarım dili:
 *   • Frost gradient (koyu mavi → siyah) arka plan, kozmik atmosfer
 *   • Sol taraf: marka adı (CAELINUS) + bilingual tagline + URL
 *   • Sağ taraf: büyük ⌖ glyph, magenta+frost halka ile çevrili
 *   • Sağ üst: WORLD'S FIRST FREQUENCY ATELIER eyebrow
 *
 * Layout/locale bağımsız — tek bir global OG image her sayfada aynı
 * (sayfa-spesifik bir kart isteyen yapı için ileride per-route
 * `opengraph-image.tsx` eklenebilir).
 */

import { ImageResponse } from "next/og";

export const alt = "Caelinus — World's first frequency atelier";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ⌖ Caelinus mark inline SVG — bkz. icon.tsx'teki açıklama. Vercel
// edge'de font bağımsızlığı için PNG yerine SVG data-URI rendering.
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" stroke="white" stroke-width="2.5" fill="none"/><line x1="50" y1="6" x2="50" y2="94" stroke="white" stroke-width="2.5"/><line x1="6" y1="50" x2="94" y2="50" stroke="white" stroke-width="2.5"/></svg>`;
const MARK_DATA = `data:image/svg+xml,${encodeURIComponent(MARK_SVG)}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(110% 80% at 75% 30%, rgba(180,80,255,0.22) 0%, rgba(0,0,0,0) 55%), radial-gradient(120% 90% at 30% 70%, rgba(80,160,240,0.28) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, #050a18 0%, #020410 100%)",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Subtle vignette + grain */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)",
            display: "flex",
          }}
        />

        {/* Sol kolon: marka & tagline */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 64px",
            width: 720,
            height: "100%",
          }}
        >
          {/* Üst: eyebrow kapsülü */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(170,210,250,0.35)",
              background: "rgba(10,22,40,0.55)",
              fontSize: 18,
              letterSpacing: 6,
              fontWeight: 600,
              alignSelf: "flex-start",
              color: "rgba(220,240,255,0.92)",
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: "#ff5cb0",
                boxShadow: "0 0 12px #ff5cb0",
                display: "flex",
              }}
            />
            WORLD&apos;S FIRST FREQUENCY ATELIER
          </div>

          {/* Orta: marka adı */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                fontSize: 142,
                lineHeight: 1,
                fontWeight: 500,
                letterSpacing: 6,
                fontFamily: "Georgia, 'Times New Roman', serif",
                display: "flex",
              }}
            >
              CAELINUS
            </div>
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.3,
                color: "rgba(210,232,250,0.88)",
                fontWeight: 400,
                maxWidth: 600,
                display: "flex",
              }}
            >
              Wear your frequency · Frekansını giy
            </div>
            <div
              style={{
                fontSize: 22,
                color: "rgba(170,200,235,0.75)",
                marginTop: 4,
                lineHeight: 1.5,
                display: "flex",
              }}
            >
              AI · 3D try-on · Astrology · Designer atelier
            </div>
          </div>

          {/* Alt: URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 4,
              color: "#ffffff",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#ff5cb0",
                display: "flex",
              }}
            />
            CAELINUS.AI
          </div>
        </div>

        {/* Sağ kolon: ⌖ glyph + halka */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 530,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Dış halka */}
          <div
            style={{
              position: "absolute",
              width: 460,
              height: 460,
              borderRadius: 999,
              border: "1px solid rgba(170,220,255,0.22)",
              boxShadow:
                "0 0 80px rgba(120,200,255,0.18), inset 0 0 80px rgba(120,200,255,0.12)",
              display: "flex",
            }}
          />
          {/* Orta halka */}
          <div
            style={{
              position: "absolute",
              width: 360,
              height: 360,
              borderRadius: 999,
              border: "1px dashed rgba(225,130,255,0.32)",
              display: "flex",
            }}
          />
          {/* Glyph kapsülü */}
          <div
            style={{
              position: "relative",
              width: 280,
              height: 280,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at 35% 30%, rgba(220,240,255,0.95) 0%, rgba(110,160,230,0.4) 50%, rgba(20,30,60,0.0) 80%)",
              boxShadow: "0 0 60px rgba(140,200,250,0.4)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK_DATA} width={210} height={210} alt="" />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
