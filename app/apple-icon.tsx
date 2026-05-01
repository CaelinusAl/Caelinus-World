/**
 * Caelinus Apple touch icon — iOS / iPadOS home-screen ikon.
 *
 * Kullanıcı `caelinus.ai`'i Safari'de "Add to Home Screen" ile ana
 * ekrana eklediğinde bu görsel gelir. 180×180 Apple'ın tek istediği
 * boyut; PWA manifest ayrıca daha büyük boyutları üretir (manifest.ts).
 *
 * Tasarım: frost+magenta gradient küre üzerinde Caelinus ⌖ mark'ı +
 * altında ince "CAELINUS" yazısı. Ana favicon'dan biraz daha zengin
 * çünkü 180×180'de daha çok piksel oynama alanı var.
 */

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// ⌖ mark — bkz. icon.tsx'teki açıklama. Inline SVG data-URI font
// bağımsızlığı sağlar; Vercel edge'de kararlı render olur.
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="32" stroke="white" stroke-width="4" fill="none"/><line x1="50" y1="4" x2="50" y2="96" stroke="white" stroke-width="4"/><line x1="4" y1="50" x2="96" y2="50" stroke="white" stroke-width="4"/></svg>`;
const MARK_DATA = `data:image/svg+xml,${encodeURIComponent(MARK_SVG)}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          background:
            "radial-gradient(circle at 32% 28%, #d8eaff 0%, #6892d8 50%, #2a3360 100%)",
          color: "#ffffff",
          padding: 24,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_DATA} width={86} height={86} alt="" />
        <div
          style={{
            fontSize: 16,
            letterSpacing: 6,
            opacity: 0.92,
            fontWeight: 600,
            display: "flex",
          }}
        >
          CAELINUS
        </div>
      </div>
    ),
    { ...size },
  );
}
