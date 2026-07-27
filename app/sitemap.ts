import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { absoluteUrl } from "@/lib/i18n/locale";
import { PUBLIC_HOSTS, PUBLIC_ORIGINS } from "@/lib/public-domains";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Caelinus sitemap — emitted at `/sitemap.xml` on every host.
 *
 * Strategy
 * --------
 * Each public route is listed **once per locale subdomain**, with
 * `alternates.languages` cross-referencing the other one. Search
 * engines treat the language entry as authoritative, so listing each
 * URL twice (once with the TR origin, once with the EN origin) gives
 * us the canonical pair without duplicating content concerns.
 *
 * The function runs at build/request time (Next decides). We try a
 * Supabase admin read to enumerate dynamic routes (atelier slugs,
 * public look ids); if the service-role key is missing in this
 * environment the catch falls back to static-only — better than 5xx.
 */

export const dynamic = "force-dynamic";

type Freq = "daily" | "weekly" | "monthly" | "yearly";

type StaticRoute = {
  path: string;
  priority: number;
  changeFrequency: Freq;
};

const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/manifesto", priority: 0.7, changeFrequency: "monthly" },
  { path: "/universe", priority: 0.8, changeFrequency: "weekly" },
  { path: "/universe/shop", priority: 0.7, changeFrequency: "weekly" },
  { path: "/universe/gaia", priority: 0.7, changeFrequency: "weekly" },
  { path: "/play", priority: 0.9, changeFrequency: "weekly" },
  { path: "/play/galeri", priority: 0.8, changeFrequency: "daily" },
  { path: "/atelier", priority: 0.7, changeFrequency: "weekly" },
  { path: "/atelier/kesfet", priority: 0.8, changeFrequency: "daily" },
  { path: "/atelier/basvuru", priority: 0.5, changeFrequency: "monthly" },
  { path: "/ai", priority: 0.5, changeFrequency: "monthly" },
];

type DynamicRoute = {
  path: string;
  lastModified: Date;
  priority: number;
  changeFrequency: Freq;
};

/** Pull approved atelier slugs. Returns `[]` on any failure (e.g. no
 *  service-role key in dev) — better an incomplete sitemap than 500. */
async function fetchAtelierSlugs(): Promise<DynamicRoute[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("ateliers")
      .select("slug, updated_at")
      .eq("status", "approved")
      .limit(5000);
    type Row = { slug: string; updated_at: string };
    const rows = (data as Row[] | null) ?? [];
    return rows.map((row) => ({
      path: `/atelier/${row.slug}`,
      lastModified: new Date(row.updated_at),
      priority: 0.6,
      changeFrequency: "weekly",
    }));
  } catch {
    return [];
  }
}

/** Pull public look ids. Looks are public by virtue of being saved
 *  to `user_play_looks`; we cap to 10k to keep the sitemap a
 *  reasonable size (Google's hard limit is 50k URLs / 50MB). */
async function fetchLookIds(): Promise<DynamicRoute[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("user_play_looks")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(10000);
    type Row = { id: string; created_at: string };
    const rows = (data as Row[] | null) ?? [];
    return rows.map((row) => ({
      path: `/play/look/${row.id}`,
      lastModified: new Date(row.created_at),
      priority: 0.5,
      changeFrequency: "monthly",
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHost = (await headers()).get("host")?.split(":")[0].toLowerCase();
  if (requestHost === PUBLIC_HOSTS.codex) {
    return [{
      url: `${PUBLIC_ORIGINS.codex}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    }];
  }

  const [atelierRoutes, lookRoutes] = await Promise.all([
    fetchAtelierSlugs(),
    fetchLookIds(),
  ]);

  const now = new Date();
  const allRoutes: DynamicRoute[] = [
    ...STATIC_ROUTES.map((r) => ({
      ...r,
      lastModified: now,
    })),
    ...atelierRoutes,
    ...lookRoutes,
  ];

  // Emit each route on the TR host with EN as the alternate. Listing
  // it once and pointing the alternate at EN is the canonical
  // pattern for hreflang sitemaps; Google reads both ways from there.
  return allRoutes.map((route) => ({
    url: absoluteUrl("tr", route.path),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        "tr-TR": absoluteUrl("tr", route.path),
        "en-US": absoluteUrl("en", route.path),
        "x-default": absoluteUrl("tr", route.path),
      },
    },
  }));
}
