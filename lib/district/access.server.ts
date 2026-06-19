/**
 * CAELINUS — District Engine · Erişim (server)
 *
 * Kullanıcının gerçek üyelik (Tier) seviyesini çözer. Kimlik tek: Supabase.
 *   • Oturum yoksa  → guest
 *   • Oturum varsa  → member
 *   • Premium       → ekonomi katmanı (Faz 5: Sanri /billing/me/access veya
 *                      Stripe entitlement) ile yükseltilir.
 *
 * SADECE server-only modüllerden (server component / route handler) çağrılır.
 */

import "server-only";
import { getServerUser } from "@/lib/supabase/server";
import type { Tier } from "./types";

export async function resolveTier(): Promise<Tier> {
  let user = null;
  try {
    user = await getServerUser();
  } catch {
    user = null;
  }
  if (!user) return "guest";

  // TODO (Faz 5): premium entitlement köprüsü.
  // Sanri: GET /api/sanri/billing/me/access; Stripe: user_entitlements.
  return "member";
}
