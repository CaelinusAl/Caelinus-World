"use client";

/**
 * DistrictPortals — District Engine portal ızgarası.
 *
 * Registry'deki `district.portals` listesini, kullanıcının tier'ına göre
 * kapı (gate) mantığıyla render eder. Kilitli portallar gereken üyeliği
 * gösterir ve girişe değil yükseltmeye yönlendirir.
 */

import Link from "next/link";
import type { District, Tier } from "@/lib/district/types";
import { canUsePortal, portalRequiredTier } from "@/lib/district/access";

const TIER_LABEL: Record<Tier, string> = {
  guest: "",
  member: "Üyelik",
  premium: "Premium",
};

type Props = {
  district: District;
  locale: "tr" | "en";
  tier: Tier;
  /** Kilitli portala tıklayınca gidilecek (örn. /atelier/giris). */
  upgradeHref?: string;
};

export default function DistrictPortals({ district, locale, tier, upgradeHref = "/atelier/giris" }: Props) {
  return (
    <div className="district-portals">
      {district.portals.map((portal) => {
        const unlocked = canUsePortal(district, portal, tier);
        const need = portalRequiredTier(district, portal);
        const href = unlocked ? portal.href : `${upgradeHref}?next=${encodeURIComponent(portal.href)}`;

        return (
          <Link
            key={portal.id}
            href={href}
            className={`district-portal ${unlocked ? "" : "is-locked"}`}
            aria-disabled={!unlocked}
          >
            <span className="district-portal-glow" aria-hidden="true" />
            <span className="district-portal-icon" aria-hidden="true">
              {portal.icon}
            </span>
            <span className="district-portal-title">{portal.title[locale]}</span>
            {portal.subtitle && (
              <span className="district-portal-sub">{portal.subtitle[locale]}</span>
            )}
            {!unlocked && (
              <span className="district-portal-lock">
                🔒 {TIER_LABEL[need] || need}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
