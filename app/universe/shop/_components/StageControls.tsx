"use client";

import { useSceneStore } from "@/stores/scene-store";
import { useWardrobeStore } from "@/stores/wardrobe-store";
import { archetypes } from "@/data/archetypes";
import { STAGE_CONFIGS } from "@/components/shop/scene";

const IS_DEV = process.env.NODE_ENV === "development";

export default function StageControls() {
  const stageId = useSceneStore((s) => s.stageId);
  const setStage = useSceneStore((s) => s.setStage);
  const archetypeId = useSceneStore((s) => s.archetypeId);
  const setArchetype = useSceneStore((s) => s.setArchetype);

  const catwalkOn = useWardrobeStore((s) => s.catwalkOn);
  const toggleCatwalk = useWardrobeStore((s) => s.toggleCatwalk);
  const debugBindings = useWardrobeStore((s) => s.debugBindings);
  const toggleDebug = useWardrobeStore((s) => s.toggleDebug);
  const showTuner = useWardrobeStore((s) => s.showTuner);
  const toggleTuner = useWardrobeStore((s) => s.toggleTuner);

  return (
    <>
      <div className="stage-selector">
        {Object.values(STAGE_CONFIGS).map((cfg) => (
          <button
            key={cfg.id}
            className={`stage-btn ${stageId === cfg.id ? "active" : ""}`}
            onClick={() => setStage(cfg.id)}
          >
            <span className="stage-btn-label">{cfg.label}</span>
            <span className="stage-btn-sub">{cfg.sub}</span>
          </button>
        ))}
        <button
          className={`stage-btn ${catwalkOn ? "active" : ""}`}
          onClick={toggleCatwalk}
          title="Catwalk animasyonunu ac/kapat"
        >
          <span className="stage-btn-label">Catwalk</span>
          <span className="stage-btn-sub">{catwalkOn ? "Aktif" : "Pasif"}</span>
        </button>
        <button
          className={`stage-btn ${debugBindings ? "active" : ""}`}
          onClick={toggleDebug}
          title="Outfit binding debug bilgisi"
        >
          <span className="stage-btn-label">Debug</span>
          <span className="stage-btn-sub">{debugBindings ? "ON" : "OFF"}</span>
        </button>
        {IS_DEV && (
          <button
            className={`stage-btn ${showTuner ? "active" : ""}`}
            onClick={toggleTuner}
            title="Outfit Transform Tuner (dev only)"
          >
            <span className="stage-btn-label">Tuner</span>
            <span className="stage-btn-sub">{showTuner ? "ON" : "OFF"}</span>
          </button>
        )}
      </div>

      <div className="shop-archetype-row">
        <h3 className="shop-section-mini-title">Arketip Sec</h3>
        <div className="shop-archetype-pills">
          {archetypes.map((a) => (
            <button
              key={a.id}
              className={`shop-archetype-pill ${archetypeId === a.id ? "active" : ""}`}
              onClick={() => setArchetype(a.id)}
              style={{
                borderColor: archetypeId === a.id ? a.tone : "rgba(255,255,255,0.12)",
                boxShadow: archetypeId === a.id ? `0 0 18px ${a.glow}` : "none",
              }}
            >
              <span className="shop-archetype-dot" style={{ background: a.tone }} />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
