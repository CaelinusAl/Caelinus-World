import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";

/**
 * Caelinus robots.txt — emitted at `/robots.txt` on every host.
 *
 * Each subdomain advertises its own sitemap so crawlers find both
 * locale variants. Private surfaces (account, atelier dashboards,
 * API endpoints, the auth callback) are disallowed everywhere.
 *
 * We compute the sitemap URL from the *current* host so a Vercel
 * preview deployment's robots points at its own sitemap rather than
 * production — saves a round of "why is my preview indexing prod?".
 */

export default async function robots(): Promise<MetadataRoute.Robots> {
  const locale = await getLocale();
  const sitemapUrl = absoluteUrl(locale, "/sitemap.xml");
  const host = absoluteUrl(locale, "/");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/hesap",
          "/hesap/",
          "/atelier/dashboard",
          "/atelier/dashboard/",
          "/atelier/admin",
          "/atelier/admin/",
          "/atelier/basvuru",
          "/atelier/*/duzenle",
          "/atelier/*/duzenle/",
          "/atelier/*/checkout/",
        ],
      },
    ],
    sitemap: sitemapUrl,
    host,
  };
}
