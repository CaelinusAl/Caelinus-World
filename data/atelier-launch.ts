/**
 * Caelinus Atelier — launch designers (statik kayıt).
 *
 * Faz-1 launch'ında Atelier altyapısı (Supabase tabloları) henüz tüm
 * deployment'larda kurulmadığı için, yatırımcı demosunda göstereceğimiz
 * ilk imza tasarımcılar bu modülde **kod içinde** tanımlanır. Hem
 * `/atelier` ana sayfasındaki "Açık tezgâhlar" şeridinde, hem
 * `/atelier/kesfet` dizininde, DB'den dönen onaylı atelier'lerin önüne
 * eklenir.
 *
 * Her launch atelier'in detay sayfası (`/atelier/<slug>`) DB'ye değil,
 * statik bir route'a (`app/atelier/<slug>/page.tsx`) çözülür. Next.js
 * routing'inde explicit segment dynamic `[slug]`'tan önce eşleşir, bu
 * yüzden DB hit etmeden landing render edilir.
 *
 * Bu yapı, gerçek atelier hesabı/onayı gelene kadar showcase amaçlıdır.
 * Naz Yardımcı kendi hesabını açıp DB'ye taşındığında, o satır bu
 * listeden çıkarılır ve `/atelier/n-yardimci` route'u sade
 * `[slug]/page.tsx`'e düşer.
 */

import type { FeaturedAtelier } from "@/app/atelier/_components/AtelierHomeBody";
import type { DiscoveryAtelier } from "@/app/atelier/kesfet/KesfetBody";
import type { AtelierKind } from "@/lib/supabase/types";

/**
 * `LaunchAtelier` — superset of `FeaturedAtelier` and `DiscoveryAtelier`
 * with the extra fields we need for the static showcase landing page.
 *
 * Field semantics mirror the `ateliers` table columns 1:1 so the same
 * value flows naturally through every existing component (StageCard,
 * KesfetBody grid card, etc.) without conditional checks.
 */
export type LaunchAtelier = {
  slug: string;
  name: string;
  kind: AtelierKind;
  region: string;
  province: string;
  cover_image_url: string;
  avatar_image_url: string;
  bio_tr: string;
  bio_en: string;
  story_tr: string;
  story_en: string;
  approved_at: string;
  /**
   * Showcase tag — ürünler henüz yayında değil. Detail sayfasında
   * "Koleksiyon yakında" rozeti gösterir; checkout aktif olmaz.
   */
  comingSoon: boolean;
};

export const LAUNCH_ATELIERS: ReadonlyArray<LaunchAtelier> = [
  {
    slug: "n-yardimci",
    name: "N. Yardımcı",
    kind: "designer",
    region: "marmara",
    province: "istanbul",
    cover_image_url: "/atelier/n-yardimci/cover.png",
    avatar_image_url: "/atelier/n-yardimci/cover.png",
    bio_tr:
      "Constantinople'dan çağdaş bir tasarım atölyesi. Kadının duruşunu mimari net çizgilerle örerek sade ama derin parçalar üretir — her kıyafet bir manifesto, her kumaş bir hatıra.",
    bio_en:
      "A contemporary design atelier from Constantinople. Weaves the woman's stance with architectural clean lines into minimal yet profound pieces — each garment a manifesto, each fabric a memory.",
    story_tr:
      "Caelinus Atelier'in açılış imza tasarımcısı. Geleneksel Anadolu tekstilini modern silüetlerle harmanlıyor; sürdürülebilir kumaşlar ve sınırlı seri üretimle çalışıyor. İlk koleksiyonu yakında Caelinus tezgâhında.",
    story_en:
      "Caelinus Atelier's inaugural signature designer. Blends traditional Anatolian textiles with modern silhouettes; works with sustainable fabrics and limited-run production. The debut collection arrives soon at the Caelinus bench.",
    approved_at: "2026-04-30T00:00:00.000Z",
    comingSoon: true,
  },
];

/**
 * Helpers — projeksiyon adapter'ları. DB satırları ile launch satırları
 * aynı StageCard / kesfet grid kartına aktığı için, anyway-needed cast'i
 * tek yere topluyoruz.
 */

export function asFeaturedAtelier(a: LaunchAtelier): FeaturedAtelier {
  return {
    slug: a.slug,
    name: a.name,
    kind: a.kind,
    region: a.region,
    province: a.province,
    cover_image_url: a.cover_image_url,
    avatar_image_url: a.avatar_image_url,
  };
}

export function asDiscoveryAtelier(a: LaunchAtelier): DiscoveryAtelier {
  return {
    slug: a.slug,
    name: a.name,
    kind: a.kind,
    region: a.region,
    province: a.province,
    cover_image_url: a.cover_image_url,
    avatar_image_url: a.avatar_image_url,
    bio_tr: a.bio_tr,
    bio_en: a.bio_en,
    approved_at: a.approved_at,
  };
}

/** Slug bu launch listesinde mi? — dedupe ve route guard için. */
export function isLaunchSlug(slug: string): boolean {
  return LAUNCH_ATELIERS.some((a) => a.slug === slug);
}

/** Slug ile launch atelier kaydını bul. */
export function findLaunchAtelier(slug: string): LaunchAtelier | null {
  return LAUNCH_ATELIERS.find((a) => a.slug === slug) ?? null;
}
