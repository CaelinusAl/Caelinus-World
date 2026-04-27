/**
 * Caelinus structured data — schema.org JSON-LD builders.
 *
 * Emit one or more of these inside a server component as a
 * `<script type="application/ld+json">` block. The `JsonLd`
 * component below handles serialisation and the safe-script wrapper.
 *
 * We deliberately keep the surface small — Organization for the
 * root, BreadcrumbList for nav-able pages, ItemList for grids,
 * VisualArtwork for individual look pages, Brand for ateliers.
 * Anything more bespoke can be added later without changing
 * existing pages because each page composes its own array.
 */

import { absoluteUrl, type Locale } from "@/lib/i18n/locale";

type JsonLdNode = Record<string, unknown> & { "@context": "https://schema.org" };

export type OrganizationInput = {
  locale: Locale;
};

/** Root Organization — included once on the home page so Google's
 *  knowledge panel has a canonical entity. `sameAs` carries our
 *  social profiles; add to it as accounts come online. */
export function buildOrganization({ locale }: OrganizationInput): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl(locale, "/")}#organization`,
    name: "Caelinus",
    url: absoluteUrl(locale, "/"),
    logo: absoluteUrl(locale, "/favicon.ico"),
    description:
      locale === "tr"
        ? "Caelinus — modayı, toprağı ve bilinci bir frekans evreninde buluşturan kozmik portal."
        : "Caelinus — a cosmic portal weaving fashion, earth and consciousness into a frequency universe.",
    sameAs: [
      // Filled in as accounts go live; an empty array still validates
      // and silently no-ops in Google's parser.
    ],
  };
}

export type Crumb = { name: string; path: string };

/** BreadcrumbList — for any nested page. Pass crumbs in display
 *  order; the helper computes positions and absolute URLs. */
export function buildBreadcrumbList(
  locale: Locale,
  crumbs: Crumb[],
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(locale, crumb.path),
    })),
  };
}

export type ItemListInput = {
  locale: Locale;
  /** Where the *list itself* lives (e.g. `/play/galeri`). Used as
   *  `@id` so multiple lists on the same page don't collide. */
  path: string;
  name: string;
  /** Up to a few dozen items — keep it skim-able for crawlers. */
  items: { name: string; path: string; image?: string | null }[];
};

/** ItemList — used for galleries (looks, atelier directory). Each
 *  entry references a concrete URL on the current locale's host. */
export function buildItemList({
  locale,
  path,
  name,
  items,
}: ItemListInput): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absoluteUrl(locale, path)}#list`,
    name,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: items.length,
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(locale, entry.path),
      name: entry.name,
      ...(entry.image ? { image: entry.image } : {}),
    })),
  };
}

export type VisualArtworkInput = {
  locale: Locale;
  /** `/play/look/<id>` — the canonical URL on the current locale. */
  path: string;
  name: string;
  description: string;
  image: string;
  dateCreated?: string | Date;
  /** Author user id / display name if available. Omit for anon. */
  author?: { name: string; url?: string } | null;
};

/** VisualArtwork — individual look detail page. Caelinus look
 *  renders qualify because they're original AI-assisted images
 *  presented as artwork; tagging them as VisualArtwork lets them
 *  surface in image rich-results. */
export function buildVisualArtwork({
  locale,
  path,
  name,
  description,
  image,
  dateCreated,
  author,
}: VisualArtworkInput): JsonLdNode {
  const dc =
    dateCreated instanceof Date
      ? dateCreated.toISOString()
      : dateCreated;
  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": `${absoluteUrl(locale, path)}#artwork`,
    name,
    description,
    image,
    url: absoluteUrl(locale, path),
    artform: "Digital Art",
    artMedium: "AI-assisted digital composition",
    inLanguage: locale === "tr" ? "tr-TR" : "en-US",
    ...(dc ? { dateCreated: dc } : {}),
    ...(author
      ? {
          author: {
            "@type": "Person",
            name: author.name,
            ...(author.url ? { url: author.url } : {}),
          },
        }
      : {}),
  };
}

export type BrandInput = {
  locale: Locale;
  /** `/atelier/<slug>` — canonical brand URL. */
  path: string;
  name: string;
  description: string;
  logo?: string | null;
  image?: string | null;
};

/** Brand — atelier (maker) page. Pairs nicely with VisualArtwork
 *  for individual products once the shop schema lands. */
export function buildBrand({
  locale,
  path,
  name,
  description,
  logo,
  image,
}: BrandInput): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Brand",
    "@id": `${absoluteUrl(locale, path)}#brand`,
    name,
    description,
    url: absoluteUrl(locale, path),
    ...(logo ? { logo } : {}),
    ...(image ? { image } : {}),
  };
}

/* ── Component helpers ────────────────────────────────────── */

/** Serialise one or more nodes into a single `<script>` payload.
 *  Multiple nodes get wrapped in a `@graph` array — Google reads
 *  that the same as separate scripts, with one less DOM node. */
export function serialiseJsonLd(nodes: JsonLdNode | JsonLdNode[]): string {
  const arr = Array.isArray(nodes) ? nodes : [nodes];
  if (arr.length === 1) return JSON.stringify(arr[0]);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": arr.map(({ "@context": _ctx, ...rest }) => rest),
  });
}
