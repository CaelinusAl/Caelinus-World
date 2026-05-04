/**
 * Avaturn — avatar URL ve binary persistence katmanı.
 *
 * Vizyon: Avaturn iframe'i `ExportAvatarResult` döndürüyor ve
 * GLB ya bir HTTP URL (paid plan / login) ya bir dataURL (base64
 * encoded, demo subdomain) olabiliyor. Demo'da gelen dataURL ~5-15 MB
 * olabilir; bu localStorage'a sığmaz (5MB hard limit). Çözüm:
 *
 *   • httpURL → localStorage'a string olarak kaydet (kalıcı, küçük).
 *   • dataURL → fetch'le Blob'a çevir → IndexedDB'ye yaz (50-500MB
 *     limit, kalıcı, hızlı). Sayfa açıldığında Blob'dan
 *     `URL.createObjectURL()` ile bir runtime URL üretip
 *     ModelAvatar'a veriyoruz; bu URL sayfa açık olduğu sürece
 *     yaşar, refresh'te yeniden yaratılır (IndexedDB'den blob
 *     hâlâ orada).
 *
 * Bu sayede demo subdomain bile "kalıcı avatar" hissi verir —
 * kullanıcı 3 dakika harcayıp avatar yarattıktan sonra refresh
 * etse bile aynı avatar otomatik yüklenir.
 *
 * Meta (localStorage):
 *   - avatarId, sessionId, gender, bodyId, urlType, httpURL?
 *
 * Binary (IndexedDB):
 *   - DB: caelinus-avaturn / Store: avatars / Key: avatarId
 *   - Value: Blob (model/gltf-binary)
 */

import type { ExportAvatarResult } from "@avaturn/sdk";

const META_KEY = "caelinus_avaturn_meta";
const DB_NAME = "caelinus-avaturn";
const STORE_NAME = "avatars";
const DB_VERSION = 1;

export type AvaturnGender = "male" | "female";

export type AvaturnMeta = {
  avatarId: string;
  sessionId: string;
  bodyId: string;
  gender: AvaturnGender;
  supportsFaceAnimations: boolean;
  urlType: "dataURL" | "httpURL";
  /** Sadece urlType==="httpURL" iken set. */
  httpURL?: string;
  createdAt: string;
};

export type AvaturnAvatar = AvaturnMeta & {
  /** Runtime resolvable URL — httpURL veya `URL.createObjectURL()` çıktısı. */
  url: string;
};

/* ─────────────────────────────────────────────────────────
   IndexedDB primitives
   ───────────────────────────────────────────────────────── */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported in this environment"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

async function idbPut(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("IndexedDB put failed"));
    };
  });
}

async function idbGet(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as Blob | undefined) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error("IndexedDB get failed"));
    };
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("IndexedDB delete failed"));
    };
  });
}

/* ─────────────────────────────────────────────────────────
   Meta (localStorage)
   ───────────────────────────────────────────────────────── */

function readMeta(): AvaturnMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AvaturnMeta;
  } catch {
    return null;
  }
}

function writeMeta(meta: AvaturnMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    window.dispatchEvent(
      new StorageEvent("storage", { key: META_KEY, newValue: JSON.stringify(meta) }),
    );
  } catch (err) {
    console.warn("[avaturn] writeMeta failed:", err);
  }
}

function clearMeta(): void {
  try {
    localStorage.removeItem(META_KEY);
    window.dispatchEvent(
      new StorageEvent("storage", { key: META_KEY, newValue: null }),
    );
  } catch {
    /* swallow */
  }
}

/* ─────────────────────────────────────────────────────────
   Public API — save, load, clear
   ───────────────────────────────────────────────────────── */

/**
 * Avaturn `export` callback'inden gelen ham sonucu kalıcı hale
 * getirir. dataURL ise IndexedDB'ye blob olarak yazar; httpURL
 * ise sadece meta'ya kaydeder. Her durumda runtime URL döndürür.
 */
export async function saveAvaturnAvatar(
  result: ExportAvatarResult,
): Promise<AvaturnAvatar | null> {
  if (typeof window === "undefined") return null;
  const meta: AvaturnMeta = {
    avatarId: result.avatarId,
    sessionId: result.sessionId,
    bodyId: result.bodyId,
    gender: result.gender,
    supportsFaceAnimations: result.avatarSupportsFaceAnimations,
    urlType: result.urlType,
    httpURL: result.urlType === "httpURL" ? result.url : undefined,
    createdAt: new Date().toISOString(),
  };

  let runtimeUrl = result.url;

  if (result.urlType === "dataURL") {
    try {
      // dataURL → Blob → IndexedDB
      const resp = await fetch(result.url);
      const blob = await resp.blob();
      await idbPut(result.avatarId, blob);
      runtimeUrl = URL.createObjectURL(blob);
    } catch (err) {
      console.warn("[avaturn] dataURL → IndexedDB save failed:", err);
      // Fail-soft: hâlâ runtime URL'i (dataURL) verebiliriz, ama
      // refresh'ten sonra kaybolur.
    }
  }

  writeMeta(meta);
  return { ...meta, url: runtimeUrl };
}

/**
 * Sayfa açılışında çağrılır. Meta varsa, urlType'a göre runtime
 * URL'i resolve eder (httpURL hazır; dataURL → IndexedDB blob →
 * objectURL).
 */
export async function loadAvaturnAvatar(): Promise<AvaturnAvatar | null> {
  const meta = readMeta();
  if (!meta) return null;

  if (meta.urlType === "httpURL" && meta.httpURL) {
    return { ...meta, url: meta.httpURL };
  }

  if (meta.urlType === "dataURL") {
    try {
      const blob = await idbGet(meta.avatarId);
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      return { ...meta, url };
    } catch (err) {
      console.warn("[avaturn] IndexedDB load failed:", err);
      return null;
    }
  }

  return null;
}

export async function clearAvaturnAvatar(): Promise<void> {
  const meta = readMeta();
  if (meta && meta.urlType === "dataURL") {
    try {
      await idbDelete(meta.avatarId);
    } catch {
      /* tolerated */
    }
  }
  clearMeta();
}

export function getAvaturnMeta(): AvaturnMeta | null {
  return readMeta();
}

/** Storage event listener'lar bu key'i dinler. */
export const AVATURN_STORAGE_KEY = META_KEY;
