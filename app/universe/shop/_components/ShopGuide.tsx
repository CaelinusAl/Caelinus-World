"use client";

/**
 * ShopGuide — "İçeride neler var?" yön bulma şeridi.
 *
 * İlk girişte kullanıcının Caelinus Shop'ta yapabileceklerini tek bakışta
 * anlaması için 4 yeteneği açık başlık + tek satır açıklamayla sunar.
 * Her kart hem ilgili modu açar (scene-store) hem de katalog/sahne alanına
 * yumuşakça kaydırır — yani eski mod pill'lerinin işlevini, anlaşılır bir
 * rehber kartı olarak üstlenir.
 */

import { useSceneStore, type ShopMode } from "@/stores/scene-store";

type GuideItem = {
  mode: ShopMode;
  icon: string;
  title: string;
  desc: string;
  cls: string;
};

const GUIDE: GuideItem[] = [
  {
    mode: "tryon",
    icon: "🪞",
    title: "Aynada Dene",
    desc: "Parçaları AI avatarının üzerinde sanal olarak dene.",
    cls: "shop-guide-card--tryon",
  },
  {
    mode: "freq",
    icon: "✶",
    title: "Frekansını Giy",
    desc: "Burcuna ve Solfeggio frekansına göre koleksiyonu gez.",
    cls: "shop-guide-card--freq",
  },
  {
    mode: "ai",
    icon: "✦",
    title: "AI Kombin",
    desc: "Stilist yapay zekâ sana özel haftalık kombinler kursun.",
    cls: "shop-guide-card--ai",
  },
  {
    mode: "live",
    icon: "◈",
    title: "Bazaar & Canlı",
    desc: "Atölyeleri ve canlı alışveriş sahnesini keşfet.",
    cls: "shop-guide-card--live",
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

      <div className="shop-guide-grid">
        {GUIDE.map((g) => (
          <button
            key={g.mode}
            type="button"
            className={`shop-guide-card ${g.cls} ${activeMode === g.mode ? "active" : ""}`}
            onClick={() => handleSelect(g.mode)}
            aria-pressed={activeMode === g.mode}
          >
            <span className="shop-guide-card-icon" aria-hidden="true">
              {g.icon}
            </span>
            <span className="shop-guide-card-title">{g.title}</span>
            <span className="shop-guide-card-desc">{g.desc}</span>
            <span className="shop-guide-card-go" aria-hidden="true">
              {activeMode === g.mode ? "Görüntüleniyor" : "Keşfet →"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
