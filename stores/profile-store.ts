import { create } from "zustand";
import type { FrequencyProfile, Intent } from "@/lib/frequency";
import { computeProfile } from "@/lib/frequency";

const STORAGE_KEY = "caelinus_frequency_profile_v1";

function loadFromStorage(): FrequencyProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FrequencyProfile;
    if (!parsed?.zodiac || typeof parsed.frequency !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(profile: FrequencyProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (profile) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore quota / privacy errors
  }
}

type ProfileState = {
  profile: FrequencyProfile | null;
  hydrated: boolean;

  /** Read profile from localStorage. Safe to call multiple times. */
  hydrate: () => void;
  /** Compute and persist a new profile from a DOB + intent. */
  attune: (dob: string, intent: Intent) => FrequencyProfile;
  /** Replace the current profile and persist. */
  setProfile: (profile: FrequencyProfile) => void;
  /** Forget the current profile (logout-like). */
  reset: () => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  hydrated: false,

  hydrate: () => {
    set({ profile: loadFromStorage(), hydrated: true });
  },

  attune: (dob, intent) => {
    const profile = computeProfile(dob, intent);
    saveToStorage(profile);
    set({ profile, hydrated: true });
    return profile;
  },

  setProfile: (profile) => {
    saveToStorage(profile);
    set({ profile, hydrated: true });
  },

  reset: () => {
    saveToStorage(null);
    set({ profile: null });
  },
}));
