import type { AvatarConfig } from "@/types/avatar";
import { DEFAULT_AVATAR } from "@/types/avatar";

const STORAGE_KEY = "caelinus-avatar-config";

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
