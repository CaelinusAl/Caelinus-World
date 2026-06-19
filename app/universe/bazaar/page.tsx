/**
 * CAELINUS · BAZAAR District — İlk Yaşayan 3B District (Faz 6)
 *
 * District Engine + Blender entegrasyonunun ilk canlı kanıtı. DistrictShell
 * (registry'den lore/portal/erişim) + DistrictBlenderScene (gerçek GLB sahnesi,
 * orbit kamera) birlikte mount edilir.
 *
 * ÖNEMLİ: Bu rota mevcut /universe/shop (MirrorGate) deneyimine DOKUNMAZ;
 * ayrı bir kanıt sahnesidir. Kimlik tek kaynaktan (getDistrict("fashion")).
 */

import type { Metadata } from "next";
import { getDistrict } from "@/lib/district/registry";
import { resolveTier } from "@/lib/district/access.server";
import DistrictShell from "@/components/district/DistrictShell";
import BazaarSceneMount from "./_components/BazaarSceneMount";
import "./bazaar.css";

export const metadata: Metadata = {
  title: "Bazaar — İlk Yaşayan District · Caelinus",
  description:
    "DISTRICT_04_BAZAAR — Caelinus evreninin ilk canlı 3B district sahnesi. Frekans Bazaarı'nı aynanın içinden gezin.",
};

export default async function BazaarDistrictPage() {
  const district = getDistrict("fashion");
  const tier = await resolveTier();

  return (
    <DistrictShell
      district={district}
      locale="tr"
      tier={tier}
      scene={<BazaarSceneMount district={district} />}
    />
  );
}
