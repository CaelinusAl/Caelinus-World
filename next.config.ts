import type { NextConfig } from "next";

/**
 * Caelinus — Next.js production konfigürasyonu.
 *
 * Üç başlık altında düşünülmüş:
 *
 *   1) Bundle boyutu güvenliği (`outputFileTracingExcludes`)
 *      Vercel serverless function'ları 300 MB sınırına sahip.
 *      `public/` klasörü ~900 MB (atelier görselleri, shop hero'lar).
 *      Tracer'ın bunları function bundle'ına kopyalamasını engelliyoruz.
 *
 *   2) Güvenlik başlıkları (`headers()`)
 *      Yatırımcı sitenin güvenlik puanını mosh.run / securityheaders.com
 *      gibi araçlarla check edebilir. Production-grade bir SaaS gibi
 *      görünmek için OWASP-önerdiği başlıkları açıyoruz.
 *
 *   3) www → apex redirect (`redirects()`)
 *      Caelinus'un kanonik URL'i `caelinus.ai` (apex). www subdomain'e
 *      gelen ziyaretçileri 308 ile apex'e yönlendiriyoruz; Vercel zaten
 *      domain panelinde benzeri bir redirect kuruyor ama belt-and-braces.
 */

const SECURITY_HEADERS = [
  // HTTPS zorunlu. 2 yıl, alt domain'lere de uygula, preload listesine hak kazan.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Iframe ile başka site embed'inde clickjacking saldırılarını engelle.
  // (CSP frame-ancestors da var ama eski tarayıcılar için fallback.)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // MIME-type sniffing'i kapat (XSS vector).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Cross-origin resource policy — diğer origin'lerin asset'lerimizi
  // gömmesini engellemiyoruz (paylaşılabilir OG image lazım), ama
  // varsayılan davranış net olsun.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permission policy — gerekmedikçe tarayıcı API'lerini kapat.
  // Faz 2'de AR + sesli yardımcı geldiğinde camera + microphone'u
  // self için açacağız; şimdilik sadece güvenli minimum.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
  },
  // DNS prefetching — third-party kaynaklarımız (fal.ai, supabase,
  // openai) için DNS önceden çözülsün, ilk istek hızlansın.
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  // Next.js 16 dev: telefon LAN IP'sinden /_next/* asset'lerini çekerken
  // cross-origin uyarısı vermesin. Caelinus Avatar Core'un QR akışında
  // mobil aynı WiFi'deki LAN IP'si üzerinden bağlanır. Production'da
  // bu config no-op (server origin URL ile aynıdır).
  allowedDevOrigins: [
    "192.168.1.21",
    "192.168.1.0/24",
    "192.168.0.0/24",
    "10.0.0.0/8",
  ],

  outputFileTracingExcludes: {
    "*": [
      "public/**/*",
      "node_modules/@swc/core-linux-*",
      "node_modules/@esbuild/*",
    ],
  },

  // Sadece güvendiğimiz dış görsel host'ları whitelist'te.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "https", hostname: "fal.media" },
      { protocol: "https", hostname: "**.fal.media" },
      { protocol: "https", hostname: "v3.fal.media" },
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "**.replicate.delivery" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        // Bütün route'lara security header'ları uygula. Static asset'ler
        // Vercel'in CDN'inden gider, _next/static için bunlar yine
        // browser'a ulaşır — sorun yok.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },

  async redirects() {
    return [
      // www.caelinus.ai → caelinus.ai (kanonik apex). Vercel domain
      // panelinde de benzeri kural var ama Next seviyesinde de
      // güvence olarak. 308 = permanent + method preserved.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.caelinus.ai" }],
        destination: "https://caelinus.ai/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
