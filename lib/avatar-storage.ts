import type { AvatarConfig } from "@/types/avatar";
import { DEFAULT_AVATAR } from "@/types/avatar";

const STORAGE_KEY = "caelinus-avatar-config";
const FACE_TEXTURE_KEY = "caelinus_face_texture";
const BODY_ID_KEY = "caelinus-avatar-body-id";

/* ─────────────────────────────────────────────────────────
   Body ID — kullanıcının seçtiği base mesh kimliği. AvatarConfig
   içine (sliders/skin tone) gömmüyoruz çünkü body değiştirilince
   ölçü ayarlarının korunmasını istiyoruz, sadece referans değişir.
   ───────────────────────────────────────────────────────── */

export function saveAvatarBodyId(bodyId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BODY_ID_KEY, bodyId);
    window.dispatchEvent(
      new StorageEvent("storage", { key: BODY_ID_KEY, newValue: bodyId }),
    );
  } catch {
    /* swallow */
  }
}

export function loadAvatarBodyId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(BODY_ID_KEY);
  } catch {
    return null;
  }
}

export const AVATAR_BODY_ID_KEY = BODY_ID_KEY;

export function saveAvatarConfig(config: AvatarConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // quota exceeded or access denied — silently skip
  }
}

export function loadAvatarConfig(): AvatarConfig {
  if (typeof window === "undefined") return DEFAULT_AVATAR;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AVATAR;
    return { ...DEFAULT_AVATAR, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AVATAR;
  }
}

/**
 * Kullanıcı bedenini hiç şekillendirdi mi? — try-on sahnesi gating
 * için. "Kaydedilmiş bir config var" kriteri:
 *   • localStorage'da `caelinus-avatar-config` anahtarı var, VEYA
 *   • localStorage'da face texture var (selfie yüklemiş, henüz
 *     body değiştirmemiş olabilir; yine de avatarı sayılır)
 *
 * Hiçbiri yoksa kullanıcı sahnenin bos halini değil, "önce
 * bedenini şekillendir" CTA kartını görür.
 */
export function hasUserAvatarConfig(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem(STORAGE_KEY) !== null ||
      localStorage.getItem(FACE_TEXTURE_KEY) !== null ||
      localStorage.getItem(BODY_ID_KEY) !== null
    );
  } catch {
    return false;
  }
}

/**
 * Kullanıcı 3D Avatar Studio'da kaydet butonuna ilk kez basınca
 * STORAGE_KEY'i set eder; bu da `hasUserAvatarConfig()`'i true yapar.
 * Storage event'leri başka tab'larda da yayılır (storage event), ama
 * AYNI tab'da yayılmaz — TryOnSection same-tab senaryoda da yansısın
 * diye `saveAvatarConfig` sonrasında manuel bir storage event tetikler.
 */
export function notifyAvatarConfigChanged(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: localStorage.getItem(STORAGE_KEY),
      }),
    );
  } catch {
    /* swallow */
  }
}
