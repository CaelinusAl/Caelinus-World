import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierRow } from "@/lib/supabase/types";
import EditAtelierBody from "./EditAtelierBody";

export const metadata = {
  title: "Atelier Düzenle · Caelinus",
};

type Params = { slug: string };

/**
 * Edit page for a single atelier.
 *
 * Always server-side fetched + ownership-checked before we ever ship
 * anything to the browser. RLS would also block writes from a non-owner,
 * but reading the row owner-side first lets us:
 *   • show "not found" for slugs that don't exist or aren't ours,
 *   • avoid an extra round-trip on the client,
 *   • keep status logic (`draft → pending`) in one place.
 */
export default async function DuzenlePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/atelier/giris?next=${encodeURIComponent(`/atelier/${slug}/duzenle`)}`,
    );
  }

  const result = await supabase
    .from("ateliers")
    .select(
      [
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
      ].join(", "),
    )
    .eq("slug", slug)
    .maybeSingle();

  // Cast through the well-known row shape — the typed client narrows
  // selects to `never` for select-by-string lists, so we widen here.
  const atelier = result.data as AtelierRow | null;

  if (!atelier) notFound();
  if (atelier.owner_user_id !== user.id) {
    // Don't reveal the row's existence to a non-owner — pretend it
    // doesn't exist. (Admins still have a separate moderation route.)
    notFound();
  }

  return <EditAtelierBody atelier={atelier} />;
}
