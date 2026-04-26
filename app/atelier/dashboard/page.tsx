import { redirect } from "next/navigation";

import DashboardBody from "./DashboardBody";
import { isCurrentUserAdmin } from "@/lib/atelier/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierRow, ProfileRow } from "@/lib/supabase/types";

type AtelierListRow = Pick<
  AtelierRow,
  | "id"
  | "slug"
  | "name"
  | "kind"
  | "status"
  | "region"
  | "province"
  | "updated_at"
  | "cover_image_url"
  | "avatar_image_url"
>;

type ProfileSummary = Pick<
  ProfileRow,
  "display_name" | "avatar_url" | "locale"
>;

export const metadata = {
  title: "Tezgâh · Caelinus Atelier",
};

/**
 * Atelier dashboard.
 *
 * Middleware (`/middleware.ts`) already redirects unauthenticated
 * visitors here to /atelier/giris. The server-side check below is
 * a defence-in-depth: even if middleware is bypassed (e.g. local
 * dev with no Supabase wiring), this page won't render private data.
 */
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/atelier/giris?next=/atelier/dashboard");

  const ateliersResult = await supabase
    .from("ateliers")
    .select(
      "id, slug, name, kind, status, region, province, updated_at, cover_image_url, avatar_image_url",
    )
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  const profileResult = await supabase
    .from("profiles")
    .select("display_name, avatar_url, locale")
    .eq("id", user.id)
    .maybeSingle();

  const ateliers = (ateliersResult.data ?? []) as AtelierListRow[];
  const profile = profileResult.data as ProfileSummary | null;
  const isAdmin = await isCurrentUserAdmin();

  return (
    <DashboardBody
      email={user.email ?? null}
      displayName={profile?.display_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      ateliers={ateliers}
      isAdmin={isAdmin}
    />
  );
}
