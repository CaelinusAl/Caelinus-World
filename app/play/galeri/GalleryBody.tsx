"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";

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

export type Filters = {
  archetype: ArchetypeId | null;
  zodiac: ZodiacId | null;
  scene: SceneId | null;
};

export type GalleryItem = {
  id: string;
  archetype: string;
  zodiac: string;
  scene: string;
  url: string;
  createdAt: string;
};

type Props = {
  items: GalleryItem[];
  filters: Filters;
  /** True when the server couldn't reach Supabase (missing service-role
   *  key in dev). Surfaced as a friendly note instead of an error. */
  unavailable?: boolean;
};

const T = {
  brand: "Caelinus · Play",
  studio: { tr: "Stüdyo", en: "Studio" },
  myLooks: { tr: "Görünümlerim", en: "My looks" },
  hero: {
    eyebrow: { tr: "Caelinus · Galeri", en: "Caelinus · Gallery" },
    title: {
      tr: "Evrenin yansımaları",
      en: "Reflections of the universe",
    },
    lead: {
      tr: "Stüdyodan çıkmış her tanrıça karesi burada toplanır. İstediğin arşetipi, burcu ya da sahneyi seç; aynısını sen de çiz.",
      en: "Every goddess frame that has left the studio gathers here. Pick the archetype, sign or scene that calls you — and paint your own.",
    },
  },
  filters: {
    title: { tr: "Filtreler", en: "Filters" },
    archetype: { tr: "Arşetip", en: "Archetype" },
    zodiac: { tr: "Burç", en: "Sign" },
    scene: { tr: "Sahne", en: "Scene" },
    all: { tr: "Tümü", en: "All" },
    clear: { tr: "Temizle", en: "Clear" },
  },
  empty: {
    title: { tr: "Bu eşleşmeyle henüz bir kare yok", en: "No frames match this combo yet" },
    body: {
      tr: "Belki ilk sen olursun. Stüdyoya gir, kendi tanrıçanı çiz; karen burada parlayacak.",
      en: "Maybe you go first. Step into the studio, paint your goddess; your frame will glow here.",
    },
    cta: { tr: "Stüdyoya git", en: "Open the studio" },
  },
  unavailable: {
    tr: "Galeri şu an hazırlanıyor. Birkaç saniye sonra yeniden dene.",
    en: "The gallery is warming up. Try again in a moment.",
  },
  studioCta: { tr: "Sen de çiz", en: "Make your own" },
} as const;

const ARCHETYPE_BY_ID = new Map(ARCHETYPES.map((a) => [a.id as string, a]));
const ZODIAC_BY_ID = new Map(ZODIACS.map((z) => [z.id as string, z]));
const SCENE_BY_ID = new Map(SCENES.map((s) => [s.id as string, s]));

export default function GalleryBody({ items, filters, unavailable }: Props) {
  const router = useRouter();
  const { lang, hydrated, hydrate, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const empty = !unavailable && items.length === 0;
  const hasFilter = !!(filters.archetype || filters.zodiac || filters.scene);

  function pushFilters(next: Filters) {
    const search = new URLSearchParams();
    if (next.archetype) search.set("archetype", next.archetype);
    if (next.zodiac) search.set("zodiac", next.zodiac);
    if (next.scene) search.set("scene", next.scene);
    const qs = search.toString();
    startTransition(() => {
      router.push(qs ? `/play/galeri?${qs}` : "/play/galeri");
    });
  }

  const heroLead = useMemo(() => {
    if (!hasFilter) return T.hero.lead[L];
    const parts = [
      filters.archetype
        ? ARCHETYPE_BY_ID.get(filters.archetype)?.label[L]
        : null,
      filters.zodiac ? ZODIAC_BY_ID.get(filters.zodiac)?.label[L] : null,
      filters.scene ? SCENE_BY_ID.get(filters.scene)?.label[L] : null,
    ].filter(Boolean) as string[];
    return parts.join(" · ");
  }, [filters, hasFilter, L]);

  return (
    <div className="play-shell">
      <header className="play-ribbon">
        <Link href="/play" className="play-ribbon-brand">
          <span className="play-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="play-ribbon-name">{T.brand}</span>
        </Link>
        <div className="play-ribbon-actions">
          <Link href="/play" className="play-ribbon-btn">
            {T.studio[L]}
          </Link>
          <Link href="/play/looks" className="play-ribbon-btn">
            {T.myLooks[L]}
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
          tone="cosmic"
          eyebrow={T.hero.eyebrow[L]}
          title={T.hero.title[L]}
          lead={heroLead}
        />

        <section className="play-gallery-filters" aria-busy={pending}>
          <FilterRow
            label={T.filters.archetype[L]}
            options={ARCHETYPES.map((a) => ({
              id: a.id,
              label: a.label[L],
            }))}
            value={filters.archetype}
            onChange={(v) =>
              pushFilters({ ...filters, archetype: v as ArchetypeId | null })
            }
            allLabel={T.filters.all[L]}
          />
          <FilterRow
            label={T.filters.zodiac[L]}
            options={ZODIACS.map((z) => ({
              id: z.id,
              label: `${z.glyph} ${z.label[L]}`,
            }))}
            value={filters.zodiac}
            onChange={(v) =>
              pushFilters({ ...filters, zodiac: v as ZodiacId | null })
            }
            allLabel={T.filters.all[L]}
          />
          <FilterRow
            label={T.filters.scene[L]}
            options={SCENES.map((s) => ({
              id: s.id,
              label: s.label[L],
            }))}
            value={filters.scene}
            onChange={(v) =>
              pushFilters({ ...filters, scene: v as SceneId | null })
            }
            allLabel={T.filters.all[L]}
          />
          {hasFilter ? (
            <button
              type="button"
              className="play-gallery-clear"
              onClick={() =>
                pushFilters({ archetype: null, zodiac: null, scene: null })
              }
            >
              {T.filters.clear[L]}
            </button>
          ) : null}
        </section>

        {unavailable ? (
          <p className="play-gallery-unavailable">{T.unavailable[L]}</p>
        ) : null}

        {empty ? (
          <section className="play-gallery-empty">
            <h2>{T.empty.title[L]}</h2>
            <p>{T.empty.body[L]}</p>
            <CinemaCTA
              href="/play"
              variant="primary"
              tone="magenta"
              trailingGlyph="→"
            >
              {T.empty.cta[L]}
            </CinemaCTA>
          </section>
        ) : null}

        {items.length > 0 ? (
          <div className="play-looks-grid play-gallery-grid">
            {items.map((it) => {
              const a = ARCHETYPE_BY_ID.get(it.archetype as ArchetypeId);
              const z = ZODIAC_BY_ID.get(it.zodiac as ZodiacId);
              const s = SCENE_BY_ID.get(it.scene as SceneId);
              const meta = [a?.label[L], s?.label[L]]
                .filter(Boolean)
                .join(" · ");
              const studioHref =
                `/play?archetype=${it.archetype}` +
                `&zodiac=${it.zodiac}&scene=${it.scene}`;
              return (
                <StageCard
                  key={it.id}
                  as="link"
                  href={studioHref}
                  variant="poster"
                  tone={z?.tone ?? "cosmic"}
                  image={it.url}
                  eyebrow={meta || undefined}
                  title={z?.label[L] ?? it.zodiac}
                  meta={
                    <span>
                      {new Date(it.createdAt).toLocaleDateString(
                        L === "tr" ? "tr-TR" : "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </span>
                  }
                />
              );
            })}
          </div>
        ) : null}

        {items.length > 0 ? (
          <p className="play-gallery-foot">
            <Link href="/play" className="play-gallery-foot-link">
              {T.studioCta[L]} →
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}

/* ── Filter row ──────────────────────────────────────────────── */

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
  allLabel,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (next: T | null) => void;
  allLabel: string;
}) {
  return (
    <div className="play-gallery-filter-row">
      <span className="play-gallery-filter-label">{label}</span>
      <div className="play-gallery-filter-chips">
        <button
          type="button"
          className={
            "play-gallery-chip" + (value === null ? " is-active" : "")
          }
          onClick={() => onChange(null)}
        >
          {allLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={
              "play-gallery-chip" + (value === opt.id ? " is-active" : "")
            }
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
