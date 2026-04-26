import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserPlayLookRow } from "@/lib/supabase/types";

import LooksGallery, { type SavedLook } from "./LooksGallery";

export const metadata = {
  title: "Görünümlerim · Caelinus Play",
  description: "Caelinus Play studyoda kaydettiğin tanrıça görünümleri.",
};

export const dynamic = "force-dynamic";

export default async function LooksPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/atelier/giris?next=/play/looks");

  const result = await supabase
    .from("user_play_looks")
    .select("id, archetype, zodiac, scene, render_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (result.data ?? []) as Pick<
    UserPlayLookRow,
    "id" | "archetype" | "zodiac" | "scene" | "render_url" | "created_at"
  >[];

  const looks: SavedLook[] = rows.map((r) => ({
    id: r.id,
    archetype: r.archetype,
    zodiac: r.zodiac,
    scene: r.scene,
    renderUrl: r.render_url,
    createdAt: r.created_at,
  }));

  return <LooksGallery looks={looks} />;
}
