import { notFound, redirect } from "next/navigation";

import { getOwnerItem } from "@/lib/atelier/items";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierRow } from "@/lib/supabase/types";

import ItemFormBody from "../_components/ItemFormBody";

export const metadata = {
  title: "Ürünü Düzenle · Atelier · Caelinus",
};

type Params = { slug: string; productId: string };

export default async function EditItemPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug, productId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/atelier/giris?next=${encodeURIComponent(
        `/atelier/${slug}/duzenle/urun/${productId}`,
      )}`,
    );
  }

  const { data: atelierData } = await supabase
    .from("ateliers")
    .select("id, owner_user_id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  const atelier = atelierData as Pick<
    AtelierRow,
    "id" | "owner_user_id" | "slug" | "name"
  > | null;

  if (!atelier) notFound();
  if (atelier.owner_user_id !== user.id) notFound();

  const item = await getOwnerItem(atelier.id, productId);
  if (!item) notFound();

  return (
    <ItemFormBody
      mode="edit"
      atelier={{ id: atelier.id, slug: atelier.slug, name: atelier.name }}
      item={item}
    />
  );
}
