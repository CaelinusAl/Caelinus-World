"use client";

/**
 * CosmosHero — /cosmos testbed'inin Anime.js v4 demo başlığı.
 *
 * Başlık harf-harf bölünür ve stagger ile aşağıdan yukarı belirir;
 * alt-başlık onun ardından gelir. Arkadaki WebGL cosmos dünyasıyla
 * birleşince "canlı giriş" hissi verir. Şeyma'nın koreografisi geldikçe
 * bu desen (createScope + stagger + onScroll) tüm siteye yayılacak.
 */

import { animate, stagger, utils } from "animejs";
import { useAnimeScope } from "@/components/anime/useAnimeScope";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

const TITLE = "CAELINUS COSMOS";

export default function CosmosHero() {
  const root = useAnimeScope(() => {
    if (prefersReducedMotion()) {
      utils.set(".cosmos-letter", { opacity: 1, y: 0 });
      utils.set(".cosmos-sub", { opacity: 1, y: 0 });
      return;
    }

    animate(".cosmos-letter", {
      opacity: [0, 1],
      y: [44, 0],
      duration: 1200,
      delay: stagger(55, { start: 250 }),
      ease: "out(3)",
    });

    animate(".cosmos-sub", {
      opacity: [0, 1],
      y: [18, 0],
      duration: 900,
      delay: 950,
      ease: "out(3)",
    });
  });

  return (
    <div ref={root} style={{ textAlign: "center" }}>
      <h1
        aria-label={TITLE}
        style={{
          fontSize: "54px",
          letterSpacing: "8px",
          margin: "24px 0 0",
          textShadow: "0 2px 40px rgba(0,0,0,0.6)",
        }}
      >
        {TITLE.split("").map((ch, i) => (
          <span
            key={i}
            className="cosmos-letter"
            aria-hidden="true"
            style={{ display: "inline-block", whiteSpace: "pre", opacity: 0 }}
          >
            {ch}
          </span>
        ))}
      </h1>
      <p
        className="cosmos-sub"
        style={{ marginTop: "16px", opacity: 0, fontSize: "16px" }}
      >
        The symbolic universe of fashion
      </p>
    </div>
  );
}
