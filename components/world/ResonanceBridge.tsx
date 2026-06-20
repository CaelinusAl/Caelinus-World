"use client";

/**
 * ResonanceBridge — frekans profili → WebGL dünyası köprüsü (5D çekirdeği).
 *
 * Kullanıcının kayıtlı frekans profilini (localStorage) okur, sahne-sürücü
 * "resonance" parametrelerine indirger ve world store'a yazar. Profil
 * değiştiğinde (onboarding "attune") evren canlı olarak yeniden boyanır.
 *
 * Görsel çıktısı yok (null döner); yalnızca durum köprüsü. WebGL kapalı
 * olsa bile çalışır, böylece açıldığında rezonans hazırdır.
 */

import { useEffect } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { useWorldStore } from "@/lib/world/store";
import { resonanceFromProfile } from "@/lib/world/resonance";

export default function ResonanceBridge() {
  const hydrate = useProfileStore((s) => s.hydrate);
  const hydrated = useProfileStore((s) => s.hydrated);
  const profile = useProfileStore((s) => s.profile);
  const setResonance = useWorldStore((s) => s.setResonance);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    setResonance(resonanceFromProfile(profile));
  }, [hydrated, profile, setResonance]);

  return null;
}
