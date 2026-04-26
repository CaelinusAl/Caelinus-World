"use client";

/**
 * AvatarPicker — 12 zodiac picks arranged in a circle around a big
 * NebulaPortal preview. The portal mirrors the active zodiac (glyph
 * + tone), so the user immediately sees their choice "centred" on
 * stage before moving on.
 */

import { CinemaCTA, NebulaPortal } from "@/app/_stage";
import { ZODIACS, type ZodiacId } from "@/data/play-assets";
import { usePlayStore } from "@/stores/play-store";

type Props = { lang: "tr" | "en" };

export default function AvatarPicker({ lang }: Props) {
  const selected = usePlayStore((s) => s.zodiac);
  const setZodiac = usePlayStore((s) => s.setZodiac);

  const focus =
    selected != null
      ? ZODIACS.find((z) => z.id === selected) ?? ZODIACS[0]
      : null;

  return (
    <div className="play-step play-step--zodiac">
      <header className="play-step-head">
        <p className="play-step-eyebrow">
          {lang === "tr" ? "Adım 02" : "Step 02"}
        </p>
        <h2 className="play-step-title">
          {lang === "tr" ? "Avatar Seç" : "Pick an Avatar"}
        </h2>
        <p className="play-step-lead">
          {lang === "tr"
            ? "Burcunu seç — her sembol kendi paletini, ruhunu, ışığını taşır."
            : "Pick your sign — each symbol carries its own palette, spirit, light."}
        </p>
      </header>

      <div className="play-zodiac-stage">
        <div className="play-zodiac-ring" aria-label={lang === "tr" ? "Burç çemberi" : "Zodiac ring"}>
          {ZODIACS.map((z, i) => {
            const angle = (i / ZODIACS.length) * 360 - 90; // 0° on top
            const active = selected === z.id;
            return (
              <button
                key={z.id}
                type="button"
                className={
                  "play-zodiac-pip" +
                  (active ? " is-active" : "") +
                  ` play-zodiac-pip--${z.tone}`
                }
                style={{
                  ["--angle" as string]: `${angle}deg`,
                }}
                onClick={() => setZodiac(z.id)}
                aria-label={z.label[lang]}
                aria-pressed={active}
              >
                <span className="play-zodiac-pip-glyph">{z.glyph}</span>
                <span className="play-zodiac-pip-name">{z.label[lang]}</span>
              </button>
            );
          })}

          <div className="play-zodiac-core">
            <NebulaPortal
              size={240}
              tone={focus ? focus.tone : "magenta"}
              pulse
            >
              <span className="play-zodiac-core-glyph" aria-hidden="true">
                {focus ? focus.glyph : "✦"}
              </span>
            </NebulaPortal>
            <p className="play-zodiac-core-label">
              {focus
                ? focus.label[lang]
                : lang === "tr"
                  ? "Bir sembol seç"
                  : "Pick a symbol"}
            </p>
          </div>
        </div>
      </div>

      {selected ? (
        <div className="play-step-foot">
          <CinemaCTA
            variant="primary"
            tone={focus ? focus.tone : "magenta"}
            trailingGlyph="→"
            onClick={() => setZodiac(selected)}
          >
            {lang === "tr" ? "Sahneye geç" : "Choose a scene"}
          </CinemaCTA>
        </div>
      ) : null}
    </div>
  );
}

// `setZodiac` already advances the step — re-clicking it after
// selection just keeps the state aligned and is a no-op for the
// store except advancing the step machine.
