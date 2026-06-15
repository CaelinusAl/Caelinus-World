"use client";

/**
 * CAELINUS — Frekans Ağı · kimlik köprüsü (Faz 0)
 *
 * Caelinus'un kimliği bugüne dek `localStorage`'da yaşıyordu (cihaza
 * bağlı, paylaşılamaz). Ortak bir evren için kimlik HESABA bağlı olmalı.
 *
 * Bu hook, kullanıcı giriş yaptığında tarayıcısındaki FrequencyProfile'ı
 * bir kez hesabına yazar (`syncFrequencyToAccount`). Sessiz çalışır; UI
 * göstermek istersen döndürdüğü `status`'ü kullanabilirsin.
 *
 * Idempotent: her kullanıcı için bir kez (localStorage marker) çalışır,
 * böylece sayfa gezintisinde tekrar tekrar yazmaz.
 */

import { useEffect, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { supabaseConfigured } from "@/lib/env";
import type { FrequencyProfile } from "@/lib/frequency";
import { FREQUENCY_PROFILE_KEY } from "@/stores/profile-store";

import { syncFrequencyToAccount } from "./actions";

type SyncStatus = "idle" | "syncing" | "synced" | "skipped" | "error";

function markerKey(userId: string): string {
  return `caelinus_freq_synced_v1:${userId}`;
}

function readLocalProfile(): FrequencyProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FREQUENCY_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FrequencyProfile;
    if (!parsed?.zodiac || typeof parsed.frequency !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Oturum açık + tarayıcıda frekans profili varsa, profili hesaba taşır.
 * Layout'a (ör. bir client provider) bir kez yerleştir.
 */
export function useMemberSync(): { status: SyncStatus } {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const ran = useRef(false);

  useEffect(() => {
    if (!supabaseConfigured()) {
      setStatus("skipped");
      return;
    }
    const supabase = createSupabaseBrowserClient();

    async function attempt() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Kullanıcı başına bir kez.
      const key = markerKey(user.id);
      if (window.localStorage.getItem(key)) {
        setStatus("synced");
        return;
      }

      const profile = readLocalProfile();
      if (!profile) {
        setStatus("skipped");
        return;
      }

      setStatus("syncing");
      const res = await syncFrequencyToAccount(profile);
      if (res.ok) {
        try {
          window.localStorage.setItem(key, new Date().toISOString());
        } catch {
          /* quota / privacy — sorun değil, sonra tekrar dener */
        }
        setStatus("synced");
      } else {
        setStatus("error");
      }
    }

    // İlk yükleme + sonraki giriş olayları.
    void attempt();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        ran.current = false;
        void attempt();
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status };
}
