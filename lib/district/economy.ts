/**
 * CAELINUS — District Engine · Ekonomi çözümleyici (saf)
 *
 * District'in ekonomi katmanını okur: hangi sağlayıcı, hangi ürünler ve
 * premium kapılarını açan entitlement anahtarları. Kullanıcının gerçek
 * entitlement'larını çözmek (Sanri /billing/me/access veya Stripe) Faz 5'te
 * server tarafında yapılır; bu dosya yalnızca tanımı yorumlar.
 */

import type { District, DistrictPortal } from "./types";
import { permissionTier } from "./access";

/** District ücretli mi (entitlement geçidi var mı)? */
export function isMonetized(district: District): boolean {
  return district.economy.provider !== "none";
}

/** Portal premium gerektiriyor mu? */
export function isPremiumPortal(portal: DistrictPortal): boolean {
  return portal.minTier === "premium";
}

/** District'in premium izinleri (örn. "kod-okuma:premium"). */
export function premiumPermissions(district: District): string[] {
  return district.access.permissions.filter((p) => permissionTier(p) === "premium");
}
