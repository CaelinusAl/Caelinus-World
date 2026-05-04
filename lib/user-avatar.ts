"use client";

/**
 * Caelinus kullanıcı AI avatarı — paylaşılan localStorage ve hook.
 *
 * Bu modül, /avatar Studio'da üretilen face-swap çıktısının ürün
 * boyunca tek bir kaynaktan okunmasını sağlar. PDP "Avatarımda Dene"
 * CTA'sı, Shop AvatarBadge'i ve gelecekte StylistPanel'in
 * "AI ile avatarımda gör" akışı hep buradan tüketir.
 *
 * Storage anahtarları:
 *   • `caelinus_user_avatar_url`  — Supabase Storage public URL (string)
 *   • `caelinus_user_avatar_meta` — JSON: { zodiac, createdAt }
 *
 * Auth-bound persist (Faz 3.3) eklenince bu modül `profiles.
 * caelinus_avatar_url`'i de okuyacak; o zamana kadar localStorage
 * tek doğru.
 *
 * Storage event'i dinleriz, böylece bir tab'da avatar kaydedilince
 * diğer tab'larda Badge anında güncellenir (sayfa yenilemeye gerek yok).
 */

import { useEffect, useState } from "react";

import type { ZodiacId } from "@/data/play-assets";
import type { AvatarCanvasId } from "@/lib/avatar/canvases";
import type { BuilderTraits } from "@/lib/avatar/builder";

export const USER_AVATAR_URL_KEY = "caelinus_user_avatar_url";
export const USER_AVATAR_META_KEY = "caelinus_user_avatar_meta";

/**
 * Avatarın hangi yolla yaratıldığı.
 *
 *   • "selfie"     — fal-ai/nano-banana face-swap ile selfie + tuval
 *                    (mevcut /avatar selfie sekmesi)
 *   • "parametric" — kullanıcının seçtiği saç/göz/ten trait'lerinden
 *                    SVG ile çizilen Caelinus tanrıçası (yeni varsayılan)
 *   • "ai-portrait" — parametric trait'lerden text-to-image ile
 *                    üretilen photoreal portre ("Tanrıça Modu" upgrade)
 */
export type AvatarKind = "selfie" | "parametric" | "ai-portrait";

export type UserAvatarMeta = {
  /** Zodiac — selfie modunda zorunlu (face-swap signature bikini için
   *  kullanılır), parametric modunda opsiyonel (sadece aura rengi). */
  zodiac: ZodiacId;
  createdAt: string;
  /** Hangi yolla yaratıldı. Geriye dönük uyumluluk: yoksa "selfie"
   *  varsayılır (eski kayıtların hepsi selfie idi). */
  kind?: AvatarKind;
  /** Wardrobe Faz B — kullanıcının face-swap için seçtiği base
   *  canvas. Sadece kind === "selfie" iken anlamlı. */
  canvas?: AvatarCanvasId;
  /** Parametric / ai-portrait modunda — yeniden düzenleme için
   *  trait'ler tam olarak saklanır. Re-edit'te builder'a doğrudan
   *  load edilir, kullanıcı kaldığı yerden devam eder. */
  traits?: BuilderTraits;
};

export type UserAvatar = {
  url: string;
  meta: UserAvatarMeta | null;
};

/** Senkron oku. Server'da `null` döner; client'ta bir kez oku ve unutursan
 *  storage event yakalanmaz — UI'da kullanıyorsan `useUserAvatar()`. */
export function readUserAvatar(): UserAvatar | null {
  if (typeof window === "undefined") return null;
  try {
    const url = window.localStorage.getItem(USER_AVATAR_URL_KEY);
    if (!url) return null;
    const rawMeta = window.localStorage.getItem(USER_AVATAR_META_KEY);
    let meta: UserAvatarMeta | null = null;
    if (rawMeta) {
      const parsed = JSON.parse(rawMeta) as UserAvatarMeta;
      if (parsed?.zodiac && parsed?.createdAt) meta = parsed;
    }
    return { url, meta };
  } catch {
    return null;
  }
}

/** Avatarı kaydet. Aynı tab'daki listener'ları tetiklemek için
 *  `storage` event taklit etmiyoruz (browser zaten cross-tab atar);
 *  setter'ı çağıran component zaten state'ini güncelliyor. */
export function writeUserAvatar(url: string, meta: UserAvatarMeta): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_AVATAR_URL_KEY, url);
    window.localStorage.setItem(USER_AVATAR_META_KEY, JSON.stringify(meta));
    // Aynı tab içinden de dinleyenler güncelsin — custom event yayınla
    // (storage event yalnızca cross-tab tetikleniyor).
    window.dispatchEvent(new CustomEvent("caelinus:avatar-changed"));
  } catch {
    // quota / corrupt — sessizce yut.
  }
}

export function clearUserAvatar(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USER_AVATAR_URL_KEY);
    window.localStorage.removeItem(USER_AVATAR_META_KEY);
    window.dispatchEvent(new CustomEvent("caelinus:avatar-changed"));
  } catch {
    /* ignore */
  }
}

/**
 * React hook — kullanıcının kayıtlı AI avatarını dinler.
 *
 *   • İlk render'da `null` döner (SSR/hidrasyon eşleşsin diye).
 *   • Mount sonrası storage'dan okur.
 *   • `storage` event (cross-tab) ve `caelinus:avatar-changed`
 *     custom event (same-tab) ile sync olur.
 */
export function useUserAvatar(): UserAvatar | null {
  const [value, setValue] = useState<UserAvatar | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readUserAvatar());
    setHydrated(true);

    const onChange = () => setValue(readUserAvatar());
    window.addEventListener("storage", onChange);
    window.addEventListener("caelinus:avatar-changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("caelinus:avatar-changed", onChange);
    };
  }, []);

  // Hidrasyondan önce daima null — server-rendered HTML ile eşleşsin.
  return hydrated ? value : null;
}
