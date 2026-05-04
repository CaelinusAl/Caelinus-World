/**
 * Caelinus AI — persistence katmanı.
 *
 * • Style profile + GeneratedAvatar meta → localStorage (küçük JSON)
 * • Selfie data URL'i opsiyonel → IndexedDB (yer kaplar, ayrı blob)
 *
 * Bu katman provider-agnostic; hangi provider üretmiş olsa da
 * GeneratedAvatar same shape, same store.
 */

import type {
  AvatarStyleProfile,
  GeneratedAvatar,
  SelfieInput,
} from "./types";
import { DEFAULT_STYLE_PROFILE } from "./types";

const PROFILE_KEY = "caelinus_ai_style_profile";
const AVATAR_KEY = "caelinus_ai_generated_avatar";

const SELFIE_DB = "caelinus-ai-selfie";
const SELFIE_STORE = "selfies";
const SELFIE_KEY = "current"; // tek aktif selfie

/* ────────── Style profile ────────── */

export function saveStyleProfile(profile: AvatarStyleProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* swallow */
  }
}

export function loadStyleProfile(): AvatarStyleProfile {
  if (typeof window === "undefined") return DEFAULT_STYLE_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_STYLE_PROFILE;
    const parsed = JSON.parse(raw) as Partial<AvatarStyleProfile>;
    return { ...DEFAULT_STYLE_PROFILE, ...parsed };
  } catch {
    return DEFAULT_STYLE_PROFILE;
  }
}

/* ────────── Generated avatar ────────── */

export function saveGeneratedAvatar(avatar: GeneratedAvatar): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: AVATAR_KEY,
        newValue: JSON.stringify(avatar),
      }),
    );
  } catch {
    /* swallow */
  }
}

export function loadGeneratedAvatar(): GeneratedAvatar | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AVATAR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GeneratedAvatar;
  } catch {
    return null;
  }
}

export function clearGeneratedAvatar(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AVATAR_KEY);
    window.dispatchEvent(
      new StorageEvent("storage", { key: AVATAR_KEY, newValue: null }),
    );
  } catch {
    /* swallow */
  }
}

export const GENERATED_AVATAR_KEY = AVATAR_KEY;

/* ────────── Selfie (IndexedDB) ────────── */

function openSelfieDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(SELFIE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SELFIE_STORE)) {
        db.createObjectStore(SELFIE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("openSelfieDB failed"));
  });
}

export async function saveSelfie(selfie: SelfieInput): Promise<void> {
  try {
    const db = await openSelfieDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SELFIE_STORE, "readwrite");
      tx.objectStore(SELFIE_STORE).put(selfie, SELFIE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn("[caelinus-ai] saveSelfie failed:", err);
  }
}

export async function loadSelfie(): Promise<SelfieInput | null> {
  try {
    const db = await openSelfieDB();
    const result = await new Promise<SelfieInput | null>((resolve, reject) => {
      const tx = db.transaction(SELFIE_STORE, "readonly");
      const req = tx.objectStore(SELFIE_STORE).get(SELFIE_KEY);
      req.onsuccess = () => resolve((req.result as SelfieInput) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

export async function clearSelfie(): Promise<void> {
  try {
    const db = await openSelfieDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SELFIE_STORE, "readwrite");
      tx.objectStore(SELFIE_STORE).delete(SELFIE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* swallow */
  }
}
