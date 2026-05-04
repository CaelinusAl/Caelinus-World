"use client";

/**
 * SVG → PNG data URL exporter.
 *
 * Avatar Builder'ın çıkardığı parametric avatar'ı kalıcı bir
 * görsel olarak saklayabilmek için: SVG'yi serialize edip
 * <canvas>'a çiziyor, oradan PNG data URL alıyoruz.
 *
 * Bu data URL `localStorage.caelinus_user_avatar_url` altına
 * yazılır — tüm Shop / PDP / Stylist akışları aynı URL'i okur.
 * Selfie ile yaratılan avatarın Supabase Storage URL'i
 * yerine geçer (kind: "parametric" meta'da işaretlenir).
 *
 * Boyut endişesi: 600×800 SVG → ~800×1066 PNG @ devicePixelRatio.
 * Base64 kodlanmış data URL ~80-200 KB. localStorage 5MB limit
 * altında çok rahat.
 *
 * ⚠ Server'da çalışmaz — `document` ve `Image` kullanır. Sadece
 * "use client" component'ten çağrı.
 */

const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 1066; // 3:4 oran

/**
 * SVG element'ini PNG data URL'ine çevir.
 *
 * Akış:
 *   1. SVGElement'i string'e serialize et (XMLSerializer)
 *   2. Bunu data URI olarak Image() içine yükle
 *   3. <canvas>'a çiz, canvas.toDataURL("image/png")
 *
 * Throws:
 *   • SVG load fail (CORS, malformed) → "Failed to rasterize avatar"
 *   • toDataURL throws (canvas tainted) → "Canvas export blocked"
 */
export async function svgToPngDataUrl(
  svg: SVGElement,
  width: number = TARGET_WIDTH,
  height: number = TARGET_HEIGHT,
): Promise<string> {
  const xml = new XMLSerializer().serializeToString(svg);
  // utf8 safe encode
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const src = `data:image/svg+xml;base64,${svg64}`;

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to rasterize avatar"));
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Soft kozmik arka plan zaten SVG'de var — yine de canvas'ı temizle.
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  try {
    return canvas.toDataURL("image/png");
  } catch {
    throw new Error("Canvas export blocked (CORS taint)");
  }
}

/**
 * Sayfada bir id ile bulunan SVG element'ini bul ve PNG'e çevir.
 * AvatarStudioBody save akışı için convenience.
 */
export async function exportSvgById(elementId: string): Promise<string> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Avatar element not found: #${elementId}`);
  // Component'in SVG'si bir wrapper içindeyse ilk svg child'ını al.
  const svg =
    el.tagName.toLowerCase() === "svg"
      ? (el as unknown as SVGElement)
      : (el.querySelector("svg") as SVGElement | null);
  if (!svg) throw new Error(`No <svg> in #${elementId}`);
  return svgToPngDataUrl(svg);
}
