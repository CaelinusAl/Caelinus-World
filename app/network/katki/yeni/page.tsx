import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getServerUser } from "@/lib/supabase/server";
import { getMyMemberProfile } from "@/lib/members/server";

import ContributionForm from "./ContributionForm";

export const metadata: Metadata = {
  title: "Katkı Ekle",
  description: "Caelinus dünyasına bir lore, dize, görsel ya da not ekle.",
};

export default async function NewContributionPage() {
  const user = await getServerUser();
  if (!user) redirect("/atelier/giris?next=/network/katki/yeni");

  // Katkının bir yazarı olmalı — handle yoksa önce ağa katıl.
  const profile = await getMyMemberProfile();
  if (!profile?.handle) redirect("/network/katil");

  return <ContributionForm authorHandle={profile.handle} />;
}
