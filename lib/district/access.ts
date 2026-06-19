/**
 * CAELINUS — District Engine · Erişim (saf yardımcılar)
 *
 * Üyelik (Tier) sıralaması ve district/portal kapıları. Bu dosya SAFtır
 * (server import yok) → hem client hem server güvenle kullanır. Kullanıcının
 * gerçek tier'ını çözmek için `access.server.ts` (Supabase) kullanılır.
 */

import type { District, DistrictPortal, Tier } from "./types";

const TIER_RANK: Record<Tier, number> = {
  guest: 0,
  member: 1,
  premium: 2,
};

/** Verilen tier, gereken tier'ı karşılıyor mu? */
export function meetsTier(have: Tier, need: Tier): boolean {
  return TIER_RANK[have] >= TIER_RANK[need];
}

/** Kullanıcı bu district'e girebilir mi? */
export function canEnterDistrict(district: District, tier: Tier): boolean {
  return meetsTier(tier, district.access.minTier);
}

/** Portalın gerektirdiği tier (portal.minTier yoksa district.minTier). */
export function portalRequiredTier(district: District, portal: DistrictPortal): Tier {
  return portal.minTier ?? district.access.minTier;
}

/** Kullanıcı bu portalı kullanabilir mi? */
export function canUsePortal(district: District, portal: DistrictPortal, tier: Tier): boolean {
  return meetsTier(tier, portalRequiredTier(district, portal));
}

/** Bir izin premium gerektiriyor mu? (örn. "kod-okuma:premium") */
export function permissionTier(permission: string): Tier {
  if (permission.endsWith(":premium")) return "premium";
  if (permission.endsWith(":member")) return "member";
  return "guest";
}
