"use client";

/**
 * ArchetypePicker — first picker in the studio. 7 silhouettes
 * (Light/Golden/Dark/Cosmic/Minimal/Athletic/Curvy) rendered as
 * StageCard tiles with a glow platform underneath. No real images
 * yet — each tile uses a glyph + tone gradient placeholder.
 */

import {
  CinemaCTA,
  GlowPlatform,
  StageCard,
  StageHero,
} from "@/app/_stage";
import { ARCHETYPES, type ArchetypeId } from "@/data/play-assets";
import { usePlayStore } from "@/stores/play-store";

type Props = { lang: "tr" | "en" };

export default function ArchetypePicker({ lang }: Props) {
  const selected = usePlayStore((s) => s.archetype);
  const setArchetype = usePlayStore((s) => s.setArchetype);

  return (
    <div className="play-step play-step--archetype">
      <StageHero
        layout="vertical"
        tone="magenta"
        eyebrow={lang === "tr" ? "Adım 01" : "Step 01"}
        title={lang === "tr" ? "Figür Seç" : "Pick a Figure"}
        lead={
          lang === "tr"
            ? "Hangi enerjide bir tanrıça olsun? Yedi siluet — vücut hattı ve aura."
            : "Which energy should the goddess carry? Seven silhouettes — body and aura."
        }
      />

      <div className="play-archetype-grid">
        {ARCHETYPES.map((a) => (
          <ArchetypeTile
            key={a.id}
            id={a.id}
            label={a.label[lang]}
            tagline={a.tagline[lang]}
            glyph={a.glyph}
            tone={a.tone}
            active={selected === a.id}
            onPick={setArchetype}
          />
        ))}
      </div>

      {selected ? (
        <div className="play-step-foot">
          <CinemaCTA
            variant="primary"
            tone="magenta"
            trailingGlyph="→"
            onClick={() => setArchetype(selected)}
          >
            {lang === "tr" ? "Devam et" : "Continue"}
          </CinemaCTA>
        </div>
      ) : null}
    </div>
  );
}

function ArchetypeTile({
  id,
  label,
  tagline,
  glyph,
  tone,
  active,
  onPick,
}: {
  id: ArchetypeId;
  label: string;
  tagline: string;
  glyph: string;
  tone: "magenta" | "cosmic" | "gold" | "amber" | "teal";
  active: boolean;
  onPick: (id: ArchetypeId) => void;
}) {
  return (
    <div className="play-archetype-tile-wrap">
      <StageCard
        as="button"
        variant="tile"
        tone={tone}
        glyph={glyph}
        title={label}
        body={tagline}
        active={active}
        onClick={() => onPick(id)}
      />
      <GlowPlatform
        width={150}
        tone={tone}
        intensity="soft"
        className="play-archetype-tile-platform"
      />
    </div>
  );
}
