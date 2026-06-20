/**
 * Fiyat biçimlendirme + canlı USD→TRY kuru.
 *
 * Fiyatlar üründe USD (numericPrice) olarak tutulur. Vitrinde hem USD hem
 * TL gösteririz: "$120 · ₺4.080". TL, canlı kurla hesaplanır; kur çekilemezse
 * FALLBACK_USD_TRY kullanılır (UX hiçbir zaman kırılmaz).
 *
 * Kur, server tarafında `fetchUsdTry()` ile çekilip 1 saat cache'lenir
 * (bkz. app/api/fx/route.ts). İstemci `PriceDual` bileşeni /api/fx'ten alır.
 */

/** Canlı kur erişilemezse kullanılacak yedek kur. */
export const FALLBACK_USD_TRY = 34;

export function formatUsd(usd: number): string {
  return `$${Math.round(usd).toLocaleString("en-US")}`;
}

export function formatTry(usd: number, rate: number): string {
  const tl = Math.round(usd * rate);
  return `₺${tl.toLocaleString("tr-TR")}`;
}

export function formatDual(usd: number, rate: number): string {
  return `${formatUsd(usd)} · ${formatTry(usd, rate)}`;
}

/**
 * Canlı USD→TRY kurunu çeker (server-only kullanım; anahtar gerektirmez).
 * open.er-api.com ücretsiz ve anahtarsızdır. Hata/uyumsuzlukta yedeğe düşer.
 */
export async function fetchUsdTry(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_USD_TRY;
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data?.rates?.TRY;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_USD_TRY;
  } catch {
    return FALLBACK_USD_TRY;
  }
}
