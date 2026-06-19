/**
 * CAELINUS · SANRI District — Bilinç Tapınağı (landing)
 *
 * District Engine'in ilk tam referans district'i. Kimlik, lore, portallar
 * ve erişim hep `lib/district/registry.ts`'ten gelir; kullanıcının tier'ı
 * server tarafında (`access.server`) çözülür ve portallar buna göre kapılanır.
 */

import type { Metadata } from "next";
import { getDistrict } from "@/lib/district/registry";
import { resolveTier } from "@/lib/district/access.server";
import DistrictShell from "@/components/district/DistrictShell";

export const metadata: Metadata = {
  title: "SANRI — Bilinç Tapınağı · Caelinus",
  description:
    "SANRI, Caelinus'un çekirdek bilinç modülü. Kod oku, rüyanı çöz, sembolünü gör, falına bak — hepsi tek aynada.",
};

export default async function SanriDistrictPage() {
  const district = getDistrict("sanri");
  const tier = await resolveTier();

  return <DistrictShell district={district} locale="tr" tier={tier} />;
}
