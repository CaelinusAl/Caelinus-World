/**
 * /avatar — Avatar Studio (sekmeli).
 *
 * Vizyon: "Tanrıçanı kendin yarat, ya da kendi yüzünle ol."
 *
 *   • Sekme 1 (varsayılan): Builder — saç, göz, ten, dudak seçimleriyle
 *     parametric SVG tanrıça. Anlık, ücretsiz, mahremiyet sıfır risk.
 *   • Sekme 2: Selfie — fal-ai/nano-banana face-swap pipeline'ı,
 *     gerçek yüz transferi (~10sn).
 *
 * Her iki yolun çıktısı aynı `localStorage.caelinus_user_avatar_url`
 * altına yazılır; meta'da kind ile ayrılır. Shop / PDP / Stylist
 * akışları farketmez — hep aynı URL'i okur.
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { absoluteUrl } from "@/lib/i18n/locale";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

import AvatarStudio from "./AvatarStudioBody";
import "./avatar.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isTr = locale === "tr";
  const title = isTr
    ? "Avatar Studio — Tanrıçanı kendin yarat"
    : "Avatar Studio — Build your own goddess";
  const description = isTr
    ? "Saçını, gözünü, tenini, aurayı seç ve Caelinus tanrıçanı kendin çiz. Selfie istersen ikinci sekmede AI yüz transferi de var."
    : "Pick your hair, eyes, skin and aura — draw your own Caelinus goddess. Or use the selfie tab for AI face-swap on a goddess body."
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl(locale, "/avatar"),
      type: "website",
    },
    ...buildLocaleMetadata(locale, "/avatar"),
  };
}

export default async function AvatarPage() {
  const locale = await getLocale();
  return (
    <Suspense fallback={null}>
      <AvatarStudio lang={locale} />
    </Suspense>
  );
}
