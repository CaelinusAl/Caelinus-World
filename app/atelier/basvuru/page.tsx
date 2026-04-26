import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import BasvuruForm from "./BasvuruForm";

export const metadata = {
  title: "Atelier Başvurusu · Caelinus",
  description:
    "Caelinus Atelier başvurunu hazırla — kim olduğunu, ne ürettiğini, hangi toprağa bağlı olduğunu anlat.",
};

/**
 * Atelier application page.
 *
 * Server component:
 *   1. Requires an authenticated user — sends unauthed visitors to the
 *      sign-in page and brings them back here after.
 *   2. If the user already has a non-rejected atelier, sends them
 *      straight to its edit page (no point starting a second
 *      application from scratch — they can do that from the dashboard).
 *
 * The actual form lives in `BasvuruForm` (client component) because it
 * uses Supabase's browser client, controlled inputs, and form state.
 */
export default async function BasvuruPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/atelier/giris?next=/atelier/basvuru");

  // If the user already has an active atelier, route them to its
  // editor. Rejected ones don't block — the owner is allowed to start
  // again. (We keep the rejected row around for audit history.)
  const existing = await supabase
    .from("ateliers")
    .select("slug, status")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = existing.data as { slug: string; status: string } | null;
  if (row && row.status !== "rejected") {
    redirect(`/atelier/${row.slug}/duzenle`);
  }

  return <BasvuruForm email={user.email ?? null} />;
}
