"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  CAELINUS IDENTITY — kanonik kimlik omurgası (Faz 1)              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * "Ey bizim Calinus'ımız" — beden, ilaç ve bilgelik tek hekimde
 * birleşir. Caelinus'ta da kullanıcının dağınık dijital izleri tek bir
 * kanonik bedende toplanır: frekansı, yüzü ve bedeni aynı kimliğin
 * üç boyutudur.
 *
 * ── Sorun ────────────────────────────────────────────────────────────
 * Bugüne dek kimlik DÖRT kopuk localStorage parçasında yaşıyordu ve
 * birbirini tanımıyordu:
 *
 *   1. Frekans profili  → `caelinus_frequency_profile_v1`
 *                         (stores/profile-store.ts)
 *   2. 2D portre        → `caelinus_user_avatar_url` + `_meta`
 *                         (lib/user-avatar.ts)
 *   3. 3D beden config  → `caelinus-avatar-config` + `-body-id`
 *                         (lib/avatar-storage.ts)
 *   4. Yüz dokusu       → `caelinus_face_texture`
 *                         (lib/avatar-storage.ts)
 *
 * Zodiac üç ayrı yerde tutuluyor ve çelişebiliyordu. Portre üreten
 * kullanıcının 3D sahnesi bundan habersizdi.
 *
 * ── Çözüm: projeksiyon + köprü, KOPYA DEĞİL ──────────────────────────
 * Bu modül parçaları çoğaltmaz. Dört store TEK DOĞRU KAYNAK olarak
 * kalır; `CaelinusIdentity` onların okuma-zamanı bileşik görünümüdür.
 * Böylece veri drift'i imkânsızdır — her parçanın tek bir yazıcısı var.
 *
 * Yazımlar mevcut setter'lara delege edilir; ardından tek bir birleşik
 * `caelinus:identity-changed` event'i yayılır. Eski tüketiciler (Badge,
 * TryOnCTA, 3D sahne) kendi anahtarlarını okumaya devam eder, hiç
 * değişmeden çalışır. Yeni birleşik UI bu kanonik görünümü tüketir.
 */

import { useEffect, useState } from "react";

import type { FrequencyProfile } from "@/lib/frequency";
import { FREQUENCY_PROFILE_KEY } from "@/stores/profile-store";
import type { AvatarConfig } from "@/types/avatar";
import { DEFAULT_AVATAR } from "@/types/avatar";
import {
  AVATAR_CONFIG_KEY,
  hasFaceTexture,
  loadAvatarBodyId,
  loadAvatarConfig,
  saveAvatarConfig,
  notifyAvatarConfigChanged,
} from "@/lib/avatar-storage";
import {
  readUserAvatar,
  writeUserAvatar,
  USER_AVATAR_URL_KEY,
  type AvatarKind,
  type UserAvatarMeta,
} from "@/lib/user-avatar";
import type { ZodiacId } from "@/data/play-assets";
import type { AvatarCanvasId } from "@/lib/avatar/canvases";
import type { BuilderTraits } from "@/lib/avatar/builder";

/* ── Birleşik event ──────────────────────────────────────────────────
   Tüm parça değişimleri bu tek event altında dinlenebilir. Eski
   `caelinus:avatar-changed` event'i de köprülenir (aşağıdaki hook). */
export const IDENTITY_CHANGED_EVENT = "caelinus:identity-changed";

/* ── Kanonik kimlik görünümü ─────────────────────────────────────────── */

/** Kullanıcının 2D portre boyutu (selfie / parametrik / ai-portrait). */
export type IdentityPortrait = {
  url: string;
  kind: AvatarKind;
  canvas?: AvatarCanvasId;
  /** Parametrik DNA — re-edit ve 3D'ye tohum aktarımı için. */
  traits?: BuilderTraits;
};

/** Kullanıcının 3D beden boyutu. */
export type IdentityBody = {
  config: AvatarConfig;
  /** Seçili base mesh GLB kimliği (yoksa varsayılan). */
  bodyId: string | null;
  /** Selfie yüz dokusu yüklenmiş mi (büyük base64 — burada taşınmaz). */
  hasFaceTexture: boolean;
};

/**
 * Tek kanonik kimlik. Dört parçanın bileşik, salt-okuma görünümü.
 * Hiçbir alan burada saklanmaz — hepsi kaynağından projekte edilir.
 */
export type CaelinusIdentity = {
  /**
   * Kanonik burç. Öncelik: portre meta → frekans profili. İkisi de
   * yoksa null. Tek bir "doğru" zodiac — çelişki son bulur.
   */
  zodiac: ZodiacId | null;
  /** Doğum + niyet frekans profili (Sanctum / onboarding kaynağı). */
  frequency: FrequencyProfile | null;
  /** 2D portre — varsa. */
  portrait: IdentityPortrait | null;
  /** 3D beden — kullanıcı hiç şekillendirdiyse. */
  body: IdentityBody | null;
  /**
   * Kullanıcı herhangi bir kimlik izi bıraktı mı? (frekans, portre veya
   * beden). Onboarding gating ve "kimliğini doğur" CTA'ları için.
   */
  hasAny: boolean;
};

/* ── Düşük seviyeli okuyucular ───────────────────────────────────────── */

function readFrequency(): FrequencyProfile | null {
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

function readBody(): IdentityBody | null {
  if (typeof window === "undefined") return null;
  try {
    const hasConfig = window.localStorage.getItem(AVATAR_CONFIG_KEY) !== null;
    const bodyId = loadAvatarBodyId();
    const face = hasFaceTexture();
    // Hiçbir beden izi yoksa null — "henüz şekillendirilmemiş".
    if (!hasConfig && !bodyId && !face) return null;
    return {
      config: loadAvatarConfig(),
      bodyId,
      hasFaceTexture: face,
    };
  } catch {
    return null;
  }
}

function readPortrait(): IdentityPortrait | null {
  const ua = readUserAvatar();
  if (!ua?.url) return null;
  const meta = ua.meta;
  return {
    url: ua.url,
    kind: meta?.kind ?? "selfie",
    canvas: meta?.canvas,
    traits: meta?.traits,
  };
}

/* ── Kanonik zodiac çözücü ───────────────────────────────────────────── */

/**
 * Tek "doğru" burç. Portre kullanıcı niyetine en yakın (en son
 * sahiplenilen) olduğu için önceliklidir; yoksa frekans profili.
 */
export function resolveZodiac(
  portrait: IdentityPortrait | null,
  frequency: FrequencyProfile | null,
  bodyZodiacFromMeta?: ZodiacId | null,
): ZodiacId | null {
  const fromMeta = readUserAvatar()?.meta?.zodiac ?? null;
  return (
    fromMeta ??
    bodyZodiacFromMeta ??
    (frequency?.zodiac as ZodiacId | undefined) ??
    null
  );
}

/* ── Ana okuyucu ─────────────────────────────────────────────────────── */

/**
 * Senkron oku. Server'da boş kimlik döner. UI'da kullanıyorsan
 * `useCaelinusIdentity()` tercih et — cross-tab + same-tab sync alır.
 */
export function readIdentity(): CaelinusIdentity {
  const frequency = readFrequency();
  const portrait = readPortrait();
  const body = readBody();
  const zodiac = resolveZodiac(portrait, frequency);

  return {
    zodiac,
    frequency,
    portrait,
    body,
    hasAny: Boolean(frequency || portrait || body),
  };
}

/* ── Yazıcılar — mevcut setter'lara delege ───────────────────────────── */

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IDENTITY_CHANGED_EVENT));
}

/**
 * Portre yaz. `writeUserAvatar`'a delege eder (eski tüketiciler
 * `caelinus:avatar-changed`'i de yakalar), sonra birleşik event yayar.
 */
export function setIdentityPortrait(url: string, meta: UserAvatarMeta): void {
  writeUserAvatar(url, meta);
  emitChanged();
}

/**
 * 3D beden config yaz. `saveAvatarConfig` + same-tab notify, sonra
 * birleşik event.
 */
export function setIdentityBody(config: AvatarConfig): void {
  saveAvatarConfig(config);
  notifyAvatarConfigChanged();
  emitChanged();
}

/**
 * Kanonik burcu tüm mevcut parçalara yaz — çelişkiyi kapatır.
 * Portre varsa meta.zodiac'ı günceller (URL ve traits korunur).
 * (Frekans profili immutable bir hesaplama olduğu için yeniden
 * yazılmaz; burç orada zaten doğum tarihinden türemiştir.)
 */
export function syncZodiac(zodiac: ZodiacId): void {
  if (typeof window === "undefined") return;
  const ua = readUserAvatar();
  if (ua?.url) {
    const nextMeta: UserAvatarMeta = {
      ...(ua.meta ?? { createdAt: new Date().toISOString() }),
      zodiac,
    } as UserAvatarMeta;
    writeUserAvatar(ua.url, nextMeta);
  }
  emitChanged();
}

/* ── React hook — tek kaynaktan kimliği dinle ────────────────────────── */

/**
 * Kanonik kimliği dinleyen hook. Dört parçanın HER değişimini yakalar:
 *
 *   • `storage`                     — cross-tab (tüm anahtarlar)
 *   • `caelinus:avatar-changed`     — eski portre köprüsü (same-tab)
 *   • `caelinus:identity-changed`   — yeni birleşik event
 *
 * SSR/hidrasyon eşleşsin diye ilk render'da boş kimlik döner.
 */
export function useCaelinusIdentity(): CaelinusIdentity {
  const [value, setValue] = useState<CaelinusIdentity>(EMPTY_IDENTITY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readIdentity());
    setHydrated(true);

    const onChange = () => setValue(readIdentity());

    // Yalnız kimlik anahtarlarına tepki ver — gürültüyü filtrele.
    const onStorage = (e: StorageEvent) => {
      if (
        e.key == null ||
        e.key === USER_AVATAR_URL_KEY ||
        e.key === FREQUENCY_PROFILE_KEY ||
        e.key === AVATAR_CONFIG_KEY ||
        e.key.startsWith("caelinus")
      ) {
        onChange();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("caelinus:avatar-changed", onChange);
    window.addEventListener(IDENTITY_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("caelinus:avatar-changed", onChange);
      window.removeEventListener(IDENTITY_CHANGED_EVENT, onChange);
    };
  }, []);

  return hydrated ? value : EMPTY_IDENTITY;
}

const EMPTY_IDENTITY: CaelinusIdentity = {
  zodiac: null,
  frequency: null,
  portrait: null,
  body: null,
  hasAny: false,
};

/* ── Faz 2 köprüsü: frekanstan beden tohumu ──────────────────────────
   Frekans profili 3D bedeni "önceden doldurur" — boş slider yerine
   evrenin çizdiği taslak. Burada sadece haritalama var; UI Faz 2'de
   bu fonksiyonu "evren senin için bir beden taslağı çizdi" anında
   çağıracak. Mevcut bir config'i EZMEZ; yalnızca kullanıcı henüz
   beden şekillendirmediyse uygulanmalıdır (çağıran taraf karar verir). */

const ELEMENT_SKIN_BIAS: Record<string, string> = {
  fire: "#d4a574", // honey-amber, sıcak
  earth: "#c99e6c", // caramel
  air: "#f4efe8", // ivory, hafif
  water: "#e8c9a0", // sand, serin
};

/**
 * Frekans profilinden bir AvatarConfig taslağı türet. Deterministik:
 * aynı profil → aynı taslak. Sadece bir başlangıç önerisidir.
 */
export function bodyDraftFromFrequency(
  frequency: FrequencyProfile,
): AvatarConfig {
  return {
    ...DEFAULT_AVATAR,
    skinTone: ELEMENT_SKIN_BIAS[frequency.element] ?? DEFAULT_AVATAR.skinTone,
    archetype: frequency.zodiac,
  };
}
