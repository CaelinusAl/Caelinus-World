import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierRow } from "@/lib/supabase/types";

import ItemFormBody from "../_components/ItemFormBody";

export const metadata = {
  title: "Yeni Ürün · Atelier · Caelinus",
};

type Params = { slug: string };

export default async function NewItemPage({
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
      `/atelier/giris?next=${encodeURIComponent(
        `/atelier/${slug}/duzenle/urun/yeni`,
      )}`,
    );
  }

  const { data } = await supabase
    .from("ateliers")
    .select("id, owner_user_id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  const atelier = data as Pick<
    AtelierRow,
    "id" | "owner_user_id" | "slug" | "name"
  > | null;

  if (!atelier) notFound();
  if (atelier.owner_user_id !== user.id) notFound();

  return (
    <ItemFormBody
      mode="create"
      atelier={{ id: atelier.id, slug: atelier.slug, name: atelier.name }}
    />
  );
}
