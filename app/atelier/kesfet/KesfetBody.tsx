"use client";

/**
 * KesfetBody — interactive shell for `/atelier/kesfet`.
 *
 * The filtering state lives entirely in the URL. Every chip is a
 * `<Link>` that rebuilds the query string with the current state
 * minus the dimension being toggled, so the back button traces the
 * user's path through the directory.
 *
 * The search bar is a tiny GET-form. Hidden inputs preserve the other
 * dimensions so submitting "Ara" doesn't accidentally drop the
 * region/kind context.
 *
 * No JS is required for the happy path — the entire page degrades to
 * server-rendered HTML + form GETs.
 */

import Link from "next/link";
import { useMemo } from "react";

import { KIND_LABELS, ATELIER_KINDS } from "@/lib/atelier/validation";
import type { AtelierKind, AtelierRow } from "@/lib/supabase/types";
import {
  PROVINCE_REGIONS,
  PROVINCES,
  type ProvinceRegionId,
} from "@/data/provinces";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../_components/AtelierMatrix";

/** Server-side projection of the columns we surface on the directory. */
export type DiscoveryAtelier = Pick<
  AtelierRow,
  | "slug"
  | "name"
  | "kind"
  | "region"
  | "province"
  | "cover_image_url"
  | "avatar_image_url"
  | "bio_tr"
  | "bio_en"
  | "approved_at"
>;

type Filters = {
  q: string;
  kind: AtelierKind | null;
  region: string | null;
  province: string | null;
};

type Props = {
  ateliers: DiscoveryAtelier[];
  filters: Filters;
  page: number;
  totalPages: number;
  total: number;
};

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  back: { tr: "← Atelier", en: "← Atelier" },
  title: { tr: "Açık tezgâhları keşfet", en: "Discover open benches" },
  subtitle: {
    tr: "Caelinus kütüphanesinin onayladığı tüm atölyeler — zanaat türü, bölge ve isimle filtrele.",
    en: "Every atelier welcomed by the Caelinus librarians — filter by craft, region, and name.",
  },
  searchLabel: { tr: "Atölye ara", en: "Search ateliers" },
  searchPlaceholder: {
    tr: "Atölye adı yazın…",
    en: "Type an atelier name…",
  },
  searchButton: { tr: "Ara", en: "Search" },
  filterKind: { tr: "Zanaat türü", en: "Craft type" },
  filterRegion: { tr: "Bölge", en: "Region" },
  filterProvince: { tr: "İl", en: "Province" },
  all: { tr: "Hepsi", en: "All" },
  resultCount: {
    tr: (n: number) => `${n} açık tezgâh`,
    en: (n: number) => `${n} open bench${n === 1 ? "" : "es"}`,
  },
  noResults: {
    title: { tr: "Eşleşen bir atölye yok", en: "No matching ateliers" },
    body: {
      tr: "Filtrelerini gevşet ya da arama terimini değiştir — Caelinus kütüphanesi her hafta yeni başvurular onaylıyor.",
      en: "Loosen your filters or change the search — the Caelinus librarians approve new applications every week.",
    },
    cta: { tr: "Filtreleri sıfırla", en: "Reset filters" },
  },
  clearFilters: { tr: "Filtreleri sıfırla", en: "Clear filters" },
  prev: { tr: "← Önceki", en: "← Previous" },
  next: { tr: "Sonraki →", en: "Next →" },
  pageOf: {
    tr: (p: number, n: number) => `Sayfa ${p} / ${n}`,
    en: (p: number, n: number) => `Page ${p} of ${n}`,
  },
} as const;

const BASE = "/atelier/kesfet";

/** Build a query string out of the active filters, optionally toggling a
 *  single dimension. `null` clears that dimension; `undefined` keeps it.
 *  Toggling province automatically clears province if region changes. */
function buildHref(
  filters: Filters,
  override: Partial<Filters & { page: number }>,
): string {
  const next: Record<string, string> = {};
  const q = override.q !== undefined ? override.q : filters.q;
  const kind = override.kind !== undefined ? override.kind : filters.kind;
  const region =
    override.region !== undefined ? override.region : filters.region;

  let province =
    override.province !== undefined ? override.province : filters.province;
  // Province only makes sense within a region — drop it if region clears
  // or changes.
  if (override.region !== undefined && override.region !== filters.region) {
    province = override.province ?? null;
  }

  const page = override.page;

  if (q) next.q = q;
  if (kind) next.kind = kind;
  if (region) next.region = region;
  if (province) next.province = province;
  if (page && page > 1) next.page = String(page);

  const qs = new URLSearchParams(next).toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

/** Chip — a Link that highlights when its value matches the active state. */
function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`kesfet-chip ${active ? "is-active" : ""}`}
      scroll={false}
    >
      {children}
    </Link>
  );
}

function kindToTone(
  kind: AtelierKind,
): "magenta" | "cosmic" | "gold" | "amber" | "teal" {
  switch (kind) {
    case "designer":
      return "magenta";
    case "artisan":
      return "cosmic";
    case "farmer":
      return "teal";
    case "chef":
      return "amber";
    case "herbalist":
      return "gold";
    case "cooperative":
    case "other":
    default:
      return "magenta";
  }
}

export default function KesfetBody({
  ateliers,
  filters,
  page,
  totalPages,
  total,
}: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const provincesForRegion = useMemo(() => {
    if (!filters.region) return [];
    return PROVINCES.filter((p) => p.regionId === filters.region);
  }, [filters.region]);

  const hasActiveFilter = Boolean(
    filters.q || filters.kind || filters.region || filters.province,
  );

  return (
    <div className="atelier-shell">
      <AtelierMatrix intensity="soft" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">
            ⌖
          </span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>
        <div className="atelier-ribbon-actions">
          <Link href="/atelier" className="atelier-ribbon-btn">
            {T.back[L]}
          </Link>
          <button
            type="button"
            className="atelier-ribbon-lang"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={L === "tr" ? "is-active" : ""}>TR</span>
            <span className="atelier-ribbon-lang-divider">·</span>
            <span className={L === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </header>

      <main className="kesfet-shell">
        <header className="kesfet-hero">
          <h1 className="kesfet-hero-title">{T.title[L]}</h1>
          <p className="kesfet-hero-lead">{T.subtitle[L]}</p>
        </header>

        {/* Search bar — preserves other filters as hidden inputs so the
            form GET doesn't accidentally drop them. */}
        <form action={BASE} method="get" className="kesfet-search">
          <label htmlFor="kesfet-q" className="kesfet-search-label">
            {T.searchLabel[L]}
          </label>
          <div className="kesfet-search-row">
            <input
              id="kesfet-q"
              name="q"
              type="text"
              defaultValue={filters.q}
              placeholder={T.searchPlaceholder[L]}
              className="kesfet-search-input"
              autoComplete="off"
              maxLength={64}
            />
            {filters.kind ? (
              <input type="hidden" name="kind" value={filters.kind} />
            ) : null}
            {filters.region ? (
              <input type="hidden" name="region" value={filters.region} />
            ) : null}
            {filters.province ? (
              <input
                type="hidden"
                name="province"
                value={filters.province}
              />
            ) : null}
            <button type="submit" className="kesfet-search-submit">
              {T.searchButton[L]}
            </button>
          </div>
        </form>

        {/* Kind chips */}
        <section className="kesfet-filter-row">
          <h2 className="kesfet-filter-title">{T.filterKind[L]}</h2>
          <div className="kesfet-chip-row">
            <Chip
              href={buildHref(filters, { kind: null, page: 1 })}
              active={!filters.kind}
            >
              {T.all[L]}
            </Chip>
            {ATELIER_KINDS.map((k) => (
              <Chip
                key={k}
                href={buildHref(filters, { kind: k, page: 1 })}
                active={filters.kind === k}
              >
                {KIND_LABELS[k][L]}
              </Chip>
            ))}
          </div>
        </section>

        {/* Region chips */}
        <section className="kesfet-filter-row">
          <h2 className="kesfet-filter-title">{T.filterRegion[L]}</h2>
          <div className="kesfet-chip-row">
            <Chip
              href={buildHref(filters, {
                region: null,
                province: null,
                page: 1,
              })}
              active={!filters.region}
            >
              {T.all[L]}
            </Chip>
            {PROVINCE_REGIONS.map((r) => (
              <Chip
                key={r.id}
                href={buildHref(filters, {
                  region: r.id,
                  province: null,
                  page: 1,
                })}
                active={filters.region === r.id}
              >
                {r.name[L]}
              </Chip>
            ))}
          </div>
        </section>

        {/* Province chips — only render once a region is picked. Otherwise
            the chip row would be 81 items long, which is no longer a
            quick filter, it's a city dump. */}
        {filters.region ? (
          <section className="kesfet-filter-row">
            <h2 className="kesfet-filter-title">{T.filterProvince[L]}</h2>
            <div className="kesfet-chip-row kesfet-chip-row-wrap">
              <Chip
                href={buildHref(filters, { province: null, page: 1 })}
                active={!filters.province}
              >
                {T.all[L]}
              </Chip>
              {provincesForRegion.map((p) => (
                <Chip
                  key={p.id}
                  href={buildHref(filters, { province: p.id, page: 1 })}
                  active={filters.province === p.id}
                >
                  {p.name[L]}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        {/* Result meta + clear */}
        <div className="kesfet-meta">
          <span className="kesfet-meta-count">{T.resultCount[L](total)}</span>
          {hasActiveFilter ? (
            <Link
              href={BASE}
              className="kesfet-meta-clear"
              scroll={false}
            >
              {T.clearFilters[L]}
            </Link>
          ) : null}
        </div>

        {ateliers.length === 0 ? (
          <div className="kesfet-empty">
            <h3>{T.noResults.title[L]}</h3>
            <p>{T.noResults.body[L]}</p>
            <Link href={BASE} className="atelier-btn atelier-btn-primary">
              {T.noResults.cta[L]} →
            </Link>
          </div>
        ) : (
          <div className="kesfet-grid">
            {ateliers.map((a) => (
              <Link
                key={a.slug}
                href={`/atelier/${a.slug}`}
                className={`kesfet-card kesfet-card-${kindToTone(a.kind)}`}
              >
                <div className="kesfet-card-cover">
                  {a.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover_image_url} alt="" />
                  ) : (
                    <span aria-hidden="true">⌖</span>
                  )}
                </div>
                <div className="kesfet-card-body">
                  <p className="kesfet-card-eyebrow">
                    {KIND_LABELS[a.kind][L]}
                  </p>
                  <h3 className="kesfet-card-title">{a.name}</h3>
                  {a.bio_tr || a.bio_en ? (
                    <p className="kesfet-card-bio">
                      {(L === "en" && a.bio_en ? a.bio_en : a.bio_tr) ?? ""}
                    </p>
                  ) : null}
                  <div className="kesfet-card-meta">
                    {a.region ? (
                      <span className="kesfet-card-meta-pill">
                        {regionLabel(a.region as ProvinceRegionId, L)}
                      </span>
                    ) : null}
                    {a.province ? (
                      <span className="kesfet-card-meta-pill kesfet-card-meta-province">
                        {provinceLabel(a.province, L)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <nav className="kesfet-pagination" aria-label="Pagination">
            {page > 1 ? (
              <Link
                href={buildHref(filters, { page: page - 1 })}
                className="kesfet-page-btn"
              >
                {T.prev[L]}
              </Link>
            ) : (
              <span className="kesfet-page-btn is-disabled">{T.prev[L]}</span>
            )}
            <span className="kesfet-page-indicator">
              {T.pageOf[L](page, totalPages)}
            </span>
            {page < totalPages ? (
              <Link
                href={buildHref(filters, { page: page + 1 })}
                className="kesfet-page-btn"
              >
                {T.next[L]}
              </Link>
            ) : (
              <span className="kesfet-page-btn is-disabled">{T.next[L]}</span>
            )}
          </nav>
        ) : null}
      </main>
    </div>
  );
}

function regionLabel(id: ProvinceRegionId, lang: "tr" | "en"): string {
  const r = PROVINCE_REGIONS.find((x) => x.id === id);
  return r ? r.name[lang] : id;
}

function provinceLabel(id: string, lang: "tr" | "en"): string {
  const p = PROVINCES.find((x) => x.id === id);
  return p ? p.name[lang] : id.toUpperCase();
}
