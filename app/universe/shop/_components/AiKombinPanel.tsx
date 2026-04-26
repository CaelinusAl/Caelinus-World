"use client";

import { useState } from "react";
import { products } from "@/data/products";
import { useWardrobeStore } from "@/stores/wardrobe-store";
import { useSceneStore } from "@/stores/scene-store";
import type { ShopCategory } from "@/types/play";

const CATEGORY_ICONS: Record<Exclude<ShopCategory, "all">, string> = {
  bikini: "👙",
  pareo: "🧣",
  bag: "👜",
  heels: "👠",
  jewelry: "💎",
};

const WEEKLY_LOOKS = [
  {
    id: "w1",
    title: "Moonlit Goddess",
    frequency: "639 Hz",
    mood: "Ay enerjisi, yumusak feminen guc",
    productIds: ["b4", "pr3", "bg1", "h2", "j3"],
    gradient: "linear-gradient(135deg, rgba(100,140,255,0.18), rgba(170,120,255,0.14))",
  },
  {
    id: "w2",
    title: "Solar Fire Queen",
    frequency: "741 Hz",
    mood: "Gunes enerjisi, cesur ve parlak",
    productIds: ["b5", "pr1", "bg2", "h1", "j1"],
    gradient: "linear-gradient(135deg, rgba(255,180,80,0.18), rgba(255,120,120,0.14))",
  },
  {
    id: "w3",
    title: "Night Oracle",
    frequency: "852 Hz",
    mood: "Gece manyetizmasi, gizemli cekim",
    productIds: ["b6", "pr2", "bg3", "h3", "j4"],
    gradient: "linear-gradient(135deg, rgba(120,80,255,0.18), rgba(80,200,255,0.14))",
  },
];

const AI_SUGGESTIONS = [
  { zodiac: "Koc",     frequency: "396 Hz", combo: "Fire Muse + Nebula Wrap + Venus Stiletto", tip: "Kirmizinin tonlariyla cesaretin frekansini yukselt" },
  { zodiac: "Boga",    frequency: "417 Hz", combo: "Earth Veil + Gaia Pareo + Eclipse Tote",    tip: "Toprak tonlari seninle konusuyor, dogal kumaslara yonel" },
  { zodiac: "Ikizler", frequency: "528 Hz", combo: "Twin Light + Zodiac Chain + Stardust Mini",  tip: "Dualite gucun: bir gun minimal, bir gun kozmik" },
  { zodiac: "Akrep",   frequency: "852 Hz", combo: "Night Oracle + Moonlight Drape + Crystal Ear Cuff", tip: "Gecenin enerjisini giyinmelisin, koyu tonlar ve parlak detaylar" },
];

export default function AiKombinPanel() {
  const [aiTab, setAiTab] = useState<"weekly" | "zodiac">("weekly");
  const dressProduct = useWardrobeStore((s) => s.dressProduct);
  const setMode = useSceneStore((s) => s.setMode);

  const loadWeeklyLook = (productIds: string[]) => {
    useWardrobeStore.getState().clearAllSlots();
    productIds.forEach((pid) => {
      const p = products.find((pr) => pr.id === pid);
      if (p) dressProduct(p);
    });
    setMode("tryon");
  };

  return (
    <>
      <div className="shop-ai-header">
        <div className="shop-ai-kicker">CAELINUS AI</div>
        <h2 className="shop-ai-title">Frekans Kombin Rehberi</h2>
        <p className="shop-ai-subtitle">AI, frekansina ve burcuna gore sana ozel kombinler oneriyor</p>
        <div className="shop-ai-tabs">
          <button className={`shop-ai-tab ${aiTab === "weekly" ? "active" : ""}`} onClick={() => setAiTab("weekly")}>
            Haftanin Kombinleri
          </button>
          <button className={`shop-ai-tab ${aiTab === "zodiac" ? "active" : ""}`} onClick={() => setAiTab("zodiac")}>
            Burc Onerileri
          </button>
        </div>
      </div>

      {aiTab === "weekly" ? (
        <div className="shop-weekly-grid">
          {WEEKLY_LOOKS.map((look) => (
            <div key={look.id} className="shop-weekly-card" style={{ background: look.gradient }}>
              <div className="shop-weekly-freq">{look.frequency}</div>
              <h3 className="shop-weekly-name">{look.title}</h3>
              <p className="shop-weekly-mood">{look.mood}</p>
              <div className="shop-weekly-items">
                {look.productIds.map((pid) => {
                  const p = products.find((pr) => pr.id === pid);
                  return p ? (
                    <span key={pid} className="shop-weekly-item-pill">
                      {CATEGORY_ICONS[p.category as keyof typeof CATEGORY_ICONS]} {p.name}
                    </span>
                  ) : null;
                })}
              </div>
              <button className="shop-weekly-apply" onClick={() => loadWeeklyLook(look.productIds)}>
                👗 Bu Kombini Giydir
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="shop-zodiac-grid">
          {AI_SUGGESTIONS.map((s, i) => (
            <div key={i} className="shop-zodiac-card">
              <div className="shop-zodiac-sign">{s.zodiac}</div>
              <div className="shop-zodiac-freq">{s.frequency}</div>
              <p className="shop-zodiac-combo">{s.combo}</p>
              <p className="shop-zodiac-tip">💫 {s.tip}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
