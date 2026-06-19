"use client";

/**
 * CAELINUS — Avatar Doğuş · localStorage kalıcılığı (Phase 1A MVP).
 *
 * Doğan avatar kullanıcı cihazında saklanır. Supabase migration YOK
 * (Phase 1A kapsamı dışı). Auth-bound persist ileride bu modülü
 * `profiles.caelinus_avatar_url` köprüsüyle genişletecek.
 *
 * Anahtar: `caelinus_avatar_birth_v1` → JSON: BornAvatar
 */

import { useEffect, useState } from "react";

import type { BornAvatar } from "./birth-types";

export const BIRTH_AVATAR_KEY = "caelinus_avatar_birth_v1";
const BIRTH_EVENT = "caelinus:born-avatar-changed";

export function readBornAvatar(): BornAvatar | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BIRTH_AVATAR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BornAvatar;
    if (parsed?.id && parsed?.goddess && parsed?.portraitDataUrl) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function writeBornAvatar(avatar: BornAvatar): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BIRTH_AVATAR_KEY, JSON.stringify(avatar));
    window.dispatchEvent(new CustomEvent(BIRTH_EVENT));
  } catch {
    /* quota / corrupt — sessizce yut */
  }
}

export function clearBornAvatar(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BIRTH_AVATAR_KEY);
    window.dispatchEvent(new CustomEvent(BIRTH_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Doğan avatarı dinleyen hook. İlk render'da null (SSR/hidrasyon eşleşsin),
 * mount sonrası okur, same-tab + cross-tab değişimi senkronize eder.
 */
export function useBornAvatar(): BornAvatar | null {
  const [value, setValue] = useState<BornAvatar | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readBornAvatar());
    setHydrated(true);

    const onChange = () => setValue(readBornAvatar());
    window.addEventListener("storage", onChange);
    window.addEventListener(BIRTH_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(BIRTH_EVENT, onChange);
    };
  }, []);

  return hydrated ? value : null;
}
