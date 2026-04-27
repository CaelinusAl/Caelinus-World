"use client";

import Link from "next/link";

import { CinemaCTA, StageCard, StageHero } from "@/app/_stage";
import {
  ARCHETYPES,
  SCENES,
  ZODIACS,
  type ArchetypeId,
  type SceneId,
  type ZodiacId,
} from "@/data/play-assets";
import { useLangStore } from "@/stores/lang-store";

export type SavedLook = {
  id: string;
  archetype: string;
  zodiac: string;
  scene: string;
  renderUrl: string;
  createdAt: string;
};

const ARCHETYPE_BY_ID = new Map(ARCHETYPES.map((a) => [a.id as string, a]));
const ZODIAC_BY_ID = new Map(ZODIACS.map((z) => [z.id as string, z]));
const SCENE_BY_ID = new Map(SCENES.map((s) => [s.id as string, s]));

export default function LooksGallery({ looks }: { looks: SavedLook[] }) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const empty = looks.length === 0;

  return (
    <div className="play-shell">
      <header className="play-ribbon">
        <Link href="/play" className="play-ribbon-brand">
          <span className="play-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="play-ribbon-name">Caelinus · Play</span>
        </Link>
        <div className="play-ribbon-actions">
          <Link href="/play" className="play-ribbon-btn">
            {L === "tr" ? "Stüdyo" : "Studio"}
          </Link>
          <Link href="/play/galeri" className="play-ribbon-btn">
            {L === "tr" ? "Galeri" : "Gallery"}
          </Link>
          <button
            type="button"
            className="play-ribbon-lang"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={L === "tr" ? "is-active" : ""}>TR</span>
            <span className="play-ribbon-lang-divider">·</span>
            <span className={L === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </header>

      <main className="play-main">
        <StageHero
          layout="compact"
          tone="magenta"
          eyebrow={L === "tr" ? "Görünümlerim" : "My looks"}
          title={
            empty
              ? L === "tr"
                ? "Henüz kayıt yok"
                : "Nothing saved yet"
              : L === "tr"
                ? "Tanrıça arşivin"
                : "Your goddess archive"
          }
          lead={
            empty
              ? L === "tr"
                ? "Stüdyoya geri dön ve ilk görünümünü oluştur."
                : "Head back to the studio and generate your first look."
              : undefined
          }
          actions={
            empty ? (
              <CinemaCTA
                href="/play"
                variant="primary"
                tone="magenta"
                trailingGlyph="→"
              >
                {L === "tr" ? "Stüdyoya git" : "Open studio"}
              </CinemaCTA>
            ) : null
          }
        />

        {empty ? null : (
          <div className="play-looks-grid">
            {looks.map((look) => {
              const a = ARCHETYPE_BY_ID.get(look.archetype as ArchetypeId);
              const z = ZODIAC_BY_ID.get(look.zodiac as ZodiacId);
              const s = SCENE_BY_ID.get(look.scene as SceneId);
              const meta = [a?.label[L], s?.label[L]]
                .filter(Boolean)
                .join(" · ");
              return (
                <StageCard
                  key={look.id}
                  as="link"
                  href={`/play/look/${look.id}`}
                  variant="poster"
                  tone={z?.tone ?? "magenta"}
                  image={look.renderUrl}
                  eyebrow={meta || undefined}
                  title={z?.label[L] ?? look.zodiac}
                  meta={
                    <span>
                      {new Date(look.createdAt).toLocaleDateString(
                        L === "tr" ? "tr-TR" : "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </span>
                  }
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
