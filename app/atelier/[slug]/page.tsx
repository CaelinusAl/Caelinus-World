import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/seo/JsonLd";
import { listOwnerItems, listPublicItems } from "@/lib/atelier/items";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";
import { buildBrand, buildBreadcrumbList } from "@/lib/seo/jsonld";
import { stripeReady } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierRow } from "@/lib/supabase/types";

import AtelierPublicBody from "./AtelierPublicBody";

/**
 * Public atelier page — `/atelier/<slug>`.
 *
 * Visibility rules (mirror what an admin would moderate):
 *   • status === "approved"        → visible to everyone
 *   • status !== "approved" + owner → visible as "preview" (banner shown)
 *   • status !== "approved" + other → 404 (don't leak existence)
 *
 * RLS on `ateliers` is the real gate; this just keeps the URL surface
 * honest so unapproved benches don't show up in unexpected places
 * (search engines, share previews, etc.).
 */

const ATELIER_COLUMNS = [
  "id",
  "owner_user_id",
  "slug",
  "name",
  "kind",
  "region",
  "province",
  "bio_tr",
  "bio_en",
  "story_tr",
  "story_en",
  "contact_email",
  "contact_phone",
  "website",
  "instagram",
  "cover_image_url",
  "avatar_image_url",
  "status",
  "rejected_reason",
  "approved_at",
  "created_at",
  "updated_at",
].join(", ");

async function fetchAtelier(slug: string): Promise<AtelierRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ateliers")
    .select(ATELIER_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as AtelierRow | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [locale, atelier] = await Promise.all([getLocale(), fetchAtelier(slug)]);
  if (!atelier || atelier.status !== "approved") {
    return { title: "Atelier · Caelinus" };
  }

  // Pick the bio in the visitor's locale; fall back to the other
  // locale's text so we never ship an empty description.
  const tr = locale === "tr";
  const primaryBio = tr ? atelier.bio_tr : atelier.bio_en;
  const secondaryBio = tr ? atelier.bio_en : atelier.bio_tr;
  const fallback = tr
    ? "Caelinus · Atelier — bilinçli üretici tezgâhı."
    : "Caelinus · Atelier — a conscious maker's bench.";
  const description =
    primaryBio?.trim() || secondaryBio?.trim() || fallback;

  return {
    title: `${atelier.name} · Caelinus Atelier`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${atelier.name} · Caelinus Atelier`,
      description: description.slice(0, 200),
      type: "profile",
      images: atelier.cover_image_url ? [atelier.cover_image_url] : [],
    },
    ...buildLocaleMetadata(locale, `/atelier/${atelier.slug}`),
  };
}

export default async function AtelierPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const [locale, atelier] = await Promise.all([getLocale(), fetchAtelier(slug)]);

  if (!atelier) notFound();

  // Are we looking at our own bench? Owners can preview pre-approved
  // pages so they can sanity-check before submitting / after edits.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === atelier.owner_user_id;

  if (atelier.status !== "approved" && !isOwner) {
    notFound();
  }

  // Owners get to preview every item (incl. drafts/archives) on their
  // own page; visitors only see published + sold-out, courtesy of RLS.
  const items = isOwner
    ? await listOwnerItems(atelier.id)
    : await listPublicItems(atelier.id);

  const validNotices = [
    "iptal",
    "yapilandirma",
    "stripe",
    "yok",
    "fiyatsiz",
    "kapali",
    "hata",
  ] as const;
  type Notice = (typeof validNotices)[number];
  const checkoutNotice: Notice | null =
    sp.checkout && validNotices.includes(sp.checkout as Notice)
      ? (sp.checkout as Notice)
      : null;

  // Only emit JSON-LD for approved benches — unapproved previews
  // shouldn't leak structured data into search results.
  const tr = locale === "tr";
  const path = `/atelier/${atelier.slug}`;
  const description =
    (tr ? atelier.bio_tr : atelier.bio_en)?.trim() ||
    (tr ? atelier.bio_en : atelier.bio_tr)?.trim() ||
    (tr
      ? "Caelinus · Atelier — bilinçli üretici tezgâhı."
      : "Caelinus · Atelier — a conscious maker's bench.");
  const jsonLd =
    atelier.status === "approved"
      ? [
          buildBrand({
            locale,
            path,
            name: atelier.name,
            description: description.slice(0, 200),
            logo: atelier.avatar_image_url,
            image: atelier.cover_image_url,
          }),
          buildBreadcrumbList(locale, [
            { name: "Caelinus", path: "/" },
            { name: tr ? "Atelier" : "Atelier", path: "/atelier" },
            { name: tr ? "Keşfet" : "Discover", path: "/atelier/kesfet" },
            { name: atelier.name, path },
          ]),
        ]
      : null;

  return (
    <>
      {jsonLd ? <JsonLd nodes={jsonLd} /> : null}
      <AtelierPublicBody
        atelier={atelier}
        isOwner={isOwner}
        items={items}
        checkoutEnabled={stripeReady()}
        checkoutNotice={checkoutNotice}
      />
    </>
  );
}
