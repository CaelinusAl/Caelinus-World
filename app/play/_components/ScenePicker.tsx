"use client";

/**
 * ScenePicker — final picker. 4 cinematic SceneTiles that decide the
 * background palette of the look. Once the user picks a scene we kick
 * off the render automatically.
 */

import { CinemaCTA, SceneTile } from "@/app/_stage";
import { findZodiac, SCENES, type SceneId } from "@/data/play-assets";
import { usePlayStore } from "@/stores/play-store";

type Props = {
  lang: "tr" | "en";
  /** Render trigger — caller passes the same fn used by the page so
   *  network logic stays out of the picker. */
  onGenerate: () => void;
};

export default function ScenePicker({ lang, onGenerate }: Props) {
  const scene = usePlayStore((s) => s.scene);
  const zodiacId = usePlayStore((s) => s.zodiac);
  const setScene = usePlayStore((s) => s.setScene);

  const z = findZodiac(zodiacId);

  return (
    <div className="play-step play-step--scene">
      <header className="play-step-head">
        <p className="play-step-eyebrow">
          {lang === "tr" ? "Adım 03" : "Step 03"}
        </p>
        <h2 className="play-step-title">
          {lang === "tr" ? "Sahne Seç" : "Pick a Scene"}
        </h2>
        <p className="play-step-lead">
          {lang === "tr"
            ? "Tanrıçan nereye düşsün? Sahil, kahve, gece, resort."
            : "Where should she land? Beach, coffee, night, resort."}
        </p>
      </header>

      <div className="play-scene-grid">
        {SCENES.map((s) => (
          <SceneTile
            key={s.id}
            tone={s.tone}
            label={s.label[lang]}
            glyph={s.glyph}
            active={scene === s.id}
            onClick={() => setScene(s.id as SceneId)}
            aspect="square"
          />
        ))}
      </div>

      {scene ? (
        <div className="play-step-foot">
          <CinemaCTA
            variant="luminous"
            tone={z ? z.tone : "magenta"}
            trailingGlyph="✦"
            onClick={onGenerate}
          >
            {lang === "tr" ? "Görünümü oluştur" : "Generate look"}
          </CinemaCTA>
        </div>
      ) : null}
    </div>
  );
}
