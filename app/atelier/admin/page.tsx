import { redirect } from "next/navigation";

import {
  AdminGateError,
  requireAdmin,
} from "@/lib/atelier/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AtelierRow, ProfileRow } from "@/lib/supabase/types";

import AdminBody, { type AdminAtelier, type AdminOwner } from "./AdminBody";

export const metadata = {
  title: "Moderasyon · Caelinus Atelier",
};

// Re-fetch on every visit — moderation state changes mid-session and
// we deliberately render no client cache for it.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // ─── gate ──────────────────────────────────────────────────────
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminGateError) {
      if (err.reason === "unauthenticated") {
        redirect("/atelier/giris?next=/atelier/admin");
      }
      // Authenticated but not on the allow-list — bounce them home
      // rather than expose the moderation surface.
      redirect("/atelier/dashboard");
    }
    throw err;
  }

  // ─── data ──────────────────────────────────────────────────────
  // Admin client (service role) so env-only admins can list/moderate
  // even before they're added to the `caelinus_admins` table. RLS
  // would otherwise hide pending/rejected/draft rows that aren't theirs.
  const supabase = createSupabaseAdminClient();

  const { data: atelierData, error: atelierErr } = await supabase
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
    .order("created_at", { ascending: false });

  const ateliers = ((atelierData ?? []) as AtelierRow[]) as AdminAtelier[];

  // Hydrate owner emails / display names with a single follow-up query.
  // Doing it client-side via auth.admin would mean N round trips; one
  // batch over `profiles` is far cheaper.
  const ownerIds = Array.from(new Set(ateliers.map((a) => a.owner_user_id)));
  let owners: Record<string, AdminOwner> = {};
  if (ownerIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", ownerIds);
    const profiles = (profileData ?? []) as Pick<
      ProfileRow,
      "id" | "email" | "display_name"
    >[];
    owners = Object.fromEntries(
      profiles.map((p) => [
        p.id,
        {
          id: p.id,
          email: p.email,
          displayName: p.display_name,
        } satisfies AdminOwner,
      ]),
    );
  }

  return (
    <AdminBody
      ateliers={ateliers}
      owners={owners}
      loadError={atelierErr?.message ?? null}
    />
  );
}
