import AtelierHomeBody, {
  type FeaturedAtelier,
} from "./_components/AtelierHomeBody";
import {
  asFeaturedAtelier,
  isLaunchSlug,
  LAUNCH_ATELIERS,
} from "@/data/atelier-launch";
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
    // Atelier tablosu bazı dev / preview ortamlarında henüz yok; query
    // 404 dönerse status'u 'none' kabul edip akışı kırmıyoruz.
    try {
      const atelierResult = await supabase
        .from("ateliers")
        .select("status")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const atelier = atelierResult.data as Pick<AtelierRow, "status"> | null;
      atelierStatus = atelier?.status ?? "none";
    } catch {
      atelierStatus = "none";
    }
  }

  // Featured strip — launch designer'lar (statik) + DB'den gelen onaylı
  // atelier'ler. Launch list başa konur ki yatırımcı demosu sırasında
  // ilk imza tasarımcı (Naz Yardımcı, Constantinople) hep en üstte
  // görünsün. Slug bazlı dedupe — aynı atelier hem launch hem DB'de
  // kayıtlıysa launch versiyonu kazanır.
  let dbFeatured: FeaturedAtelier[] = [];
  try {
    const featuredResult = await supabase
      .from("ateliers")
      .select(
        "slug, name, kind, region, province, cover_image_url, avatar_image_url",
      )
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(6);
    dbFeatured = (featuredResult.data ?? []) as FeaturedAtelier[];
  } catch {
    // Atelier tablosu henüz mevcut değilse sessizce launch listesine
    // düşeriz; site stabil kalır.
    dbFeatured = [];
  }

  const launchFeatured = LAUNCH_ATELIERS.map(asFeaturedAtelier);
  const featured: FeaturedAtelier[] = [
    ...launchFeatured,
    ...dbFeatured.filter((a) => !isLaunchSlug(a.slug)),
  ].slice(0, 6);

  return (
    <AtelierHomeBody
      authed={!!user}
      email={user?.email ?? null}
      atelierStatus={atelierStatus}
      featured={featured}
    />
  );
}
