import AtelierHomeBody, {
  type FeaturedAtelier,
} from "./_components/AtelierHomeBody";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierRow } from "@/lib/supabase/types";

export const metadata = {
  title: "Caelinus · Atelier",
  description:
    "Caelinus Atelier — üreticiler, tasarımcılar, çiftçiler, şefler için toprağa bağlı bir tezgâh.",
};

/**
 * Atelier landing.
 *
 * Server component so we can read the current user (if any) and
 * tailor the call-to-action accordingly. The richer "authed" body
 * is split out into a client component so we can keep this thin.
 */
export default async function AtelierPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let atelierStatus:
    | "none"
    | "draft"
    | "pending"
    | "approved"
    | "rejected"
    | null = null;

  if (user) {
    const atelierResult = await supabase
      .from("ateliers")
      .select("status")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const atelier = atelierResult.data as Pick<AtelierRow, "status"> | null;
    atelierStatus = atelier?.status ?? "none";
  }

  // Featured strip: latest approved ateliers. RLS already restricts
  // public selects to status = 'approved', so the same query runs for
  // anonymous and authed visitors.
  const featuredResult = await supabase
    .from("ateliers")
    .select(
      "slug, name, kind, region, province, cover_image_url, avatar_image_url",
    )
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(6);

  const featured = (featuredResult.data ?? []) as FeaturedAtelier[];

  return (
    <AtelierHomeBody
      authed={!!user}
      email={user?.email ?? null}
      atelierStatus={atelierStatus}
      featured={featured}
    />
  );
}
