/**
 * Caelinus PWA web manifest — `/manifest.webmanifest` üzerinden servis edilir.
 *
 * Kullanıcı `caelinus.ai`'i Chrome/Safari'de "Add to Home Screen" /
 * "Install App" ile ekleyince:
 *   • Splash screen `theme_color` + `background_color` ile boyanır
 *   • Standalone mod açılır (browser chrome yok, app gibi)
 *   • İkon: app/icon.tsx + apple-icon.tsx (Next otomatik bunları
 *     manifest icon listesine senkronlar)
 *
 * Faz 2'de PWA service worker (offline cache, push) eklenince bu
 * manifest hâlihazırda hazır olacak — kart gibi davransın diye yapı
 * şimdiden kuruluyor.
 */

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Caelinus — Wear Your Frequency",
    short_name: "Caelinus",
    description:
      "World's first AI-driven frequency fashion atelier. Wear your frequency, dance with the cosmos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#03060f",
    theme_color: "#03060f",
    categories: ["lifestyle", "shopping", "fashion", "art-and-design"],
    lang: "tr-TR",
    dir: "ltr",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
