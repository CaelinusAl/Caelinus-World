/**
 * Caelinus favicon — dynamic SVG generated at request time.
 *
 * Next.js App Router otomatik olarak bu dosyayı `/icon` route'una
 * bağlar ve `<link rel="icon">` tagını layout'a injekte eder. 32×32
 * tarayıcı sekmesinde, 16×16 ile tab grubu görünümünde kullanılır.
 *
 * Tasarım: frost gradient diskinin üzerinde Caelinus ⌖ mark'ı. Mark,
 * markanın her yerinde aynı glyph (footer, ribbon, atelier kartları).
 */

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Caelinus ⌖ mark — Unicode U+2316 (POSITION INDICATOR) Vercel'in
// font CDN'inde yoktu (400 dönüyordu); o yüzden glyph'i inline SVG
// olarak çiziyoruz: daire + dikey/yatay çapraz. Aynı görsel, font
// bağımsız, her ortamda çalışır.
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="32" stroke="white" stroke-width="5" fill="none"/><line x1="50" y1="4" x2="50" y2="96" stroke="white" stroke-width="5"/><line x1="4" y1="50" x2="96" y2="50" stroke="white" stroke-width="5"/></svg>`;
const MARK_DATA = `data:image/svg+xml,${encodeURIComponent(MARK_SVG)}`;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 35% 30%, #cfe5ff 0%, #5a8bd6 55%, #1a2a4a 100%)",
          borderRadius: 6,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_DATA} width={20} height={20} alt="" />
      </div>
    ),
    { ...size },
  );
}
