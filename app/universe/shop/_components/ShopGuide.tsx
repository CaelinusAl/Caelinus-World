"use client";

/**
 * ShopGuide — "İçeride neler var?" yön bulma şeridi.
 *
 * Üç mor oval portal yan yana durur:
 *   1. Aynaya Gir  → avatar bedeni oluşturma sayfası (Link)
 *   2. AI Kombin   → stylist modu (scene-store)
 *   3. Bazaar & Canlı → canlı/bazaar modu (scene-store)
 *
 * Mod butonları ilgili modu açar ve katalog/sahne alanına yumuşakça kaydırır.
 */

import Link from "next/link";
import { useSceneStore, type ShopMode } from "@/stores/scene-store";

type GuideItem = {
  mode: ShopMode;
  icon: string;
  title: string;
  desc: string;
};

const MODE_ITEMS: GuideItem[] = [
  {
    mode: "ai",
    icon: "✦",
    title: "AI Kombin",
    desc: "Stilist yapay zekâ sana özel haftalık kombinler kursun.",
  },
  {
    mode: "live",
    icon: "◈",
    title: "Bazaar & Canlı",
    desc: "Atölyeleri ve canlı alışveriş sahnesini keşfet.",
  },
];

export default function ShopGuide() {
  const activeMode = useSceneStore((s) => s.activeMode);
  const setMode = useSceneStore((s) => s.setMode);

  const handleSelect = (mode: ShopMode) => {
    setMode(mode);
    if (typeof document !== "undefined") {
      document
        .querySelector(".shop-main")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="shop-guide" aria-label="Caelinus Shop'ta neler var">
      <h2 className="shop-guide-title">İçeride neler var?</h2>
      <p className="shop-guide-sub">
        Caelinus Shop bir mağazadan fazlası — gezilen bir frekans evreni.
        Nereden başlamak istediğini seç.
      </p>

      <div className="shop-orbs">
        {/* Aynaya Gir — avatar bedeni oluşturma portalı */}
        <Link
          href="/universe/shop/avatar"
          className="shop-orb shop-orb--mirror"
          aria-label="Aynaya gir — avatar bedenini oluştur"
        >
          <span className="shop-orb-icon" aria-hidden="true">◍</span>
          <span className="shop-orb-title">Aynaya Gir</span>
          <span className="shop-orb-desc">
            Selfie&apos;ni yükle, frekansını seç, avatar bedenini doğur.
          </span>
          <span className="shop-orb-go" aria-hidden="true">Başla →</span>
        </Link>

        {MODE_ITEMS.map((g) => (
          <button
            key={g.mode}
            type="button"
            className={`shop-orb ${activeMode === g.mode ? "active" : ""}`}
            onClick={() => handleSelect(g.mode)}
            aria-pressed={activeMode === g.mode}
          >
            <span className="shop-orb-icon" aria-hidden="true">{g.icon}</span>
            <span className="shop-orb-title">{g.title}</span>
            <span className="shop-orb-desc">{g.desc}</span>
            <span className="shop-orb-go" aria-hidden="true">
              {activeMode === g.mode ? "Görüntüleniyor" : "Keşfet →"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
