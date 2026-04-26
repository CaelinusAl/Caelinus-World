import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  const atelier = await fetchAtelier(slug);
  if (!atelier || atelier.status !== "approved") {
    return { title: "Atelier · Caelinus" };
  }

  const description =
    atelier.bio_tr?.trim() ||
    atelier.bio_en?.trim() ||
    "Caelinus · Atelier — bilinçli üretici tezgâhı.";

  return {
    title: `${atelier.name} · Caelinus Atelier`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${atelier.name} · Caelinus Atelier`,
      description: description.slice(0, 200),
      type: "profile",
      images: atelier.cover_image_url ? [atelier.cover_image_url] : [],
    },
  };
}

export default async function AtelierPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const atelier = await fetchAtelier(slug);

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

  return <AtelierPublicBody atelier={atelier} isOwner={isOwner} />;
}
