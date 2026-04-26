import AtelierHomeBody from "./_components/AtelierHomeBody";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    const { data: atelier } = await supabase
      .from("ateliers")
      .select("status")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    atelierStatus = atelier?.status ?? "none";
  }

  return (
    <AtelierHomeBody
      authed={!!user}
      email={user?.email ?? null}
      atelierStatus={atelierStatus}
    />
  );
}
