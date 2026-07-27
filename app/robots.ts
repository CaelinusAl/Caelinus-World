import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { absoluteUrl } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";
import { PUBLIC_HOSTS, PUBLIC_ORIGINS } from "@/lib/public-domains";

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
  const requestHost = (await headers()).get("host")?.split(":")[0].toLowerCase();
  if (requestHost === PUBLIC_HOSTS.codex) {
    return {
      rules: [{
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/"],
      }],
      sitemap: `${PUBLIC_ORIGINS.codex}/sitemap.xml`,
      host: `${PUBLIC_ORIGINS.codex}/`,
    };
  }

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
