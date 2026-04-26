import type { FaceAnalysis } from "@/lib/services/ai-types";

const STORAGE_KEY = "caelinus-avatar-face-applied";

export type StoredAvatarFace = {
  uploadId: string;
  sourceImageUrl: string;
  boundingBoxNorm: NonNullable<FaceAnalysis["boundingBoxNorm"]>;
  faceMapId: string;
  updatedAt: string;
};

export function saveAppliedAvatarFace(data: StoredAvatarFace): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota
  }
}

export function loadAppliedAvatarFace(): StoredAvatarFace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAvatarFace;
    if (
      !parsed.sourceImageUrl ||
      !parsed.boundingBoxNorm ||
      !parsed.faceMapId
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAppliedAvatarFace(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function resolveImageUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return url;
}
