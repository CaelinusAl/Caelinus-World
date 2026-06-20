import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getServerUser } from "@/lib/supabase/server";
import { getMyMemberProfile } from "@/lib/members/server";

import JoinForm from "./JoinForm";

export const metadata: Metadata = {
  title: "Ağa Katıl",
  description: "Caelinus Frekans Ağına katıl — kullanıcı adını seç, rollerini belirle, frekansını bağla.",
};

export default async function JoinNetworkPage() {
  const user = await getServerUser();
  if (!user) redirect("/atelier/giris?next=/network/katil");

  const profile = await getMyMemberProfile();

  return (
    <JoinForm
      initialHandle={profile?.handle ?? ""}
      initialRoles={profile?.roles ?? ["seeker"]}
      initialHomeCode={profile?.homeCode ?? null}
      alreadyInNetwork={Boolean(profile?.inNetwork)}
    />
  );
}
