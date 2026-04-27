"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { CinemaCTA, StageHero } from "@/app/_stage";
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

export type GallerySort = "recent" | "popular" | "random";

export type GalleryItem = {
  id: string;
  archetype: string;
  zodiac: string;
  scene: string;
  url: string;
  likesCount: number;
  createdAt: string;
};

type Props = {
  items: GalleryItem[];
  filters: Filters;
  sort: GallerySort;
  page: number;
  pageSize: number;
  hasNext: boolean;
  /** Render IDs the signed-in viewer has already liked. Empty for anon. */
  likedIds: string[];
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
  sort: {
    label: { tr: "Sırala", en: "Sort" },
    recent: { tr: "En yeni", en: "Latest" },
    popular: { tr: "Popüler", en: "Popular" },
    random: { tr: "Sürpriz", en: "Surprise" },
  },
  page: {
    prev: { tr: "← Önceki", en: "← Prev" },
    next: { tr: "Sonraki →", en: "Next →" },
    label: { tr: "Sayfa", en: "Page" },
  },
  empty: {
    title: {
      tr: "Bu eşleşmeyle henüz bir kare yok",
      en: "No frames match this combo yet",
    },
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
  like: {
    aria: { tr: "Beğen", en: "Like" },
    unaria: { tr: "Beğenmekten vazgeç", en: "Unlike" },
  },
} as const;

const ARCHETYPE_BY_ID = new Map(ARCHETYPES.map((a) => [a.id as string, a]));
const ZODIAC_BY_ID = new Map(ZODIACS.map((z) => [z.id as string, z]));
const SCENE_BY_ID = new Map(SCENES.map((s) => [s.id as string, s]));

export default function GalleryBody({
  items,
  filters,
  sort,
  page,
  hasNext,
  likedIds,
  unavailable,
}: Props) {
  const router = useRouter();
  const { lang, hydrated, hydrate, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Local state mirrors the server-rendered list so we can optimistically
  // bump like counts and toggle hearts before the network round trip.
  const [liveItems, setLiveItems] = useState<GalleryItem[]>(items);
  const [liked, setLiked] = useState<Set<string>>(() => new Set(likedIds));

  // When the server prop changes (filter/sort/page navigation), reseed
  // both maps so we don't leak optimistic state across navigations.
  useEffect(() => {
    setLiveItems(items);
    setLiked(new Set(likedIds));
  }, [items, likedIds]);

  const empty = !unavailable && liveItems.length === 0;
  const hasFilter = !!(filters.archetype || filters.zodiac || filters.scene);

  function buildHref(next: {
    filters?: Filters;
    sort?: GallerySort;
    page?: number;
  }) {
    const f = next.filters ?? filters;
    const s = next.sort ?? sort;
    const p = next.page ?? page;
    const search = new URLSearchParams();
    if (f.archetype) search.set("archetype", f.archetype);
    if (f.zodiac) search.set("zodiac", f.zodiac);
    if (f.scene) search.set("scene", f.scene);
    if (s !== "recent") search.set("sort", s);
    if (p > 1) search.set("page", String(p));
    const qs = search.toString();
    return qs ? `/play/galeri?${qs}` : "/play/galeri";
  }

  function pushFilters(nextFilters: Filters) {
    // Reset to page 1 when filters change so the user always lands on
    // the freshest results for the new combination.
    startTransition(() => {
      router.push(buildHref({ filters: nextFilters, page: 1 }));
    });
  }

  function pushSort(nextSort: GallerySort) {
    startTransition(() => {
      router.push(buildHref({ sort: nextSort, page: 1 }));
    });
  }

  async function toggleLike(item: GalleryItem) {
    const wasLiked = liked.has(item.id);
    // Optimistic flip — UI feels instant. We undo on server error.
    setLiked((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    setLiveItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, likesCount: Math.max(0, it.likesCount + (wasLiked ? -1 : 1)) }
          : it,
      ),
    );

    try {
      const res = await fetch("/api/play/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId: item.id }),
      });
      if (res.status === 401) {
        // Roll back optimistic flip then bounce to login.
        setLiked((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(item.id);
          else next.delete(item.id);
          return next;
        });
        setLiveItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, likesCount: item.likesCount } : it,
          ),
        );
        window.location.href = `/atelier/giris?next=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`;
        return;
      }
      if (!res.ok) {
        throw new Error(`like failed: ${res.status}`);
      }
      const j = (await res.json()) as { liked: boolean; count: number };
      // Reconcile with the server's authoritative count.
      setLiked((prev) => {
        const next = new Set(prev);
        if (j.liked) next.add(item.id);
        else next.delete(item.id);
        return next;
      });
      setLiveItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, likesCount: j.count } : it,
        ),
      );
    } catch {
      // Network failure — revert to original state.
      setLiked((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(item.id);
        else next.delete(item.id);
        return next;
      });
      setLiveItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, likesCount: item.likesCount } : it,
        ),
      );
    }
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

  const showPagination = sort !== "random" && (page > 1 || hasNext);

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
            options={ARCHETYPES.map((a) => ({ id: a.id, label: a.label[L] }))}
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
            options={SCENES.map((s) => ({ id: s.id, label: s.label[L] }))}
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

        <section className="play-gallery-sort" aria-label={T.sort.label[L]}>
          <span className="play-gallery-sort-label">{T.sort.label[L]}</span>
          <div className="play-gallery-sort-tabs">
            {(["recent", "popular", "random"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                className={
                  "play-gallery-sort-tab" + (sort === opt ? " is-active" : "")
                }
                onClick={() => pushSort(opt)}
              >
                {T.sort[opt][L]}
              </button>
            ))}
          </div>
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

        {liveItems.length > 0 ? (
          <div className="play-looks-grid play-gallery-grid">
            {liveItems.map((it) => (
              <GalleryCard
                key={it.id}
                item={it}
                lang={L}
                liked={liked.has(it.id)}
                onLike={toggleLike}
                likeAria={
                  liked.has(it.id) ? T.like.unaria[L] : T.like.aria[L]
                }
              />
            ))}
          </div>
        ) : null}

        {showPagination ? (
          <nav className="play-gallery-pagination" aria-label="Pagination">
            {page > 1 ? (
              <Link
                href={buildHref({ page: page - 1 })}
                className="play-gallery-page-btn"
                rel="prev"
              >
                {T.page.prev[L]}
              </Link>
            ) : (
              <span className="play-gallery-page-btn is-disabled" aria-disabled="true">
                {T.page.prev[L]}
              </span>
            )}
            <span className="play-gallery-page-current">
              {T.page.label[L]} {page}
            </span>
            {hasNext ? (
              <Link
                href={buildHref({ page: page + 1 })}
                className="play-gallery-page-btn"
                rel="next"
              >
                {T.page.next[L]}
              </Link>
            ) : (
              <span className="play-gallery-page-btn is-disabled" aria-disabled="true">
                {T.page.next[L]}
              </span>
            )}
          </nav>
        ) : null}

        {liveItems.length > 0 ? (
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

/* ── Card ────────────────────────────────────────────────────── */

function GalleryCard({
  item,
  lang,
  liked,
  onLike,
  likeAria,
}: {
  item: GalleryItem;
  lang: "tr" | "en";
  liked: boolean;
  onLike: (item: GalleryItem) => void;
  likeAria: string;
}) {
  const a = ARCHETYPE_BY_ID.get(item.archetype as ArchetypeId);
  const z = ZODIAC_BY_ID.get(item.zodiac as ZodiacId);
  const s = SCENE_BY_ID.get(item.scene as SceneId);
  const meta = [a?.label[lang], s?.label[lang]].filter(Boolean).join(" · ");
  const studioHref =
    `/play?archetype=${item.archetype}` +
    `&zodiac=${item.zodiac}&scene=${item.scene}`;

  return (
    <article className="play-gallery-card">
      <Link href={studioHref} className="play-gallery-card-link">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={z?.label[lang] ?? item.zodiac}
          className="play-gallery-card-img"
          loading="lazy"
        />
        <div className="play-gallery-card-body">
          <p className="play-gallery-card-eyebrow">{meta}</p>
          <h3 className="play-gallery-card-title">
            {z?.label[lang] ?? item.zodiac}
          </h3>
          <p className="play-gallery-card-meta">
            {new Date(item.createdAt).toLocaleDateString(
              lang === "tr" ? "tr-TR" : "en-GB",
              { day: "2-digit", month: "short", year: "numeric" },
            )}
          </p>
        </div>
      </Link>
      <button
        type="button"
        className={"play-gallery-like" + (liked ? " is-liked" : "")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLike(item);
        }}
        aria-label={likeAria}
        aria-pressed={liked}
      >
        <span className="play-gallery-like-icon" aria-hidden="true">
          {liked ? "♥" : "♡"}
        </span>
        <span className="play-gallery-like-count">{item.likesCount}</span>
      </button>
    </article>
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
