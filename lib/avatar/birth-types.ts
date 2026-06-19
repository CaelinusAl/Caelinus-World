/**
 * CAELINUS — Avatar Doğuş Akışı · tipler (Phase 1A MVP).
 *
 * Doğuş deneyiminin durum makinesi ve doğan avatarın şekli. Bu faz
 * yalnızca Portrait katmanı üretir (Avatar Bible §4); fashion/universe/3D
 * sonraki fazlara bırakılmıştır. Kalıcılık şimdilik localStorage
 * (`birth-storage.ts`); Supabase migration YOK.
 */

import type { GoddessId } from "@/data/goddess-archetypes";
import type { AvatarDistrictId } from "@/data/avatar-districts";
import type { AvatarRank, CallingStatus, OrderId } from "@/data/orders";

/** Doğuş akışı eşikleri (Experience Bible §2) + Çağrı (Civilization §3–§4).
 *  `calling` karşılaşma sonrası açılan vatandaşlık eşiğidir (additive). */
export type BirthStep =
  | "face"
  | "privacy"
  | "goddess"
  | "district"
  | "intensity"
  | "birth"
  | "encounter"
  | "calling";

/** Stil yoğunluğu — Hafif ↔ Dengeli ↔ Tam Tanrıça (Experience Bible §2[5]). */
export type BirthIntensity = "light" | "balanced" | "full";

export const BIRTH_INTENSITY_LABELS: Record<
  BirthIntensity,
  { label: string; hint: string }
> = {
  light: { label: "Hafif", hint: "Sana çok benzer, ince bir tanrıça dokunuşu." },
  balanced: { label: "Dengeli", hint: "Kimlik korunur, frekans güçlüdür." },
  full: { label: "Tam Tanrıça", hint: "En sinematik, en dönüştürülmüş." },
};

/** Akış boyunca toplanan niyetler. */
export interface BirthSelection {
  /** [1] Yüz Ver — kırpılmış yüz dokusu (dataURL) veya null (silüet). */
  faceDataUrl: string | null;
  /** [2] Gizlilik sözü kabul edildi mi. */
  privacyAccepted: boolean;
  /** [3] Tanrıça seçimi. */
  goddess: GoddessId | null;
  /** [4] District seçimi. */
  district: AvatarDistrictId;
  /** [5] Stil yoğunluğu. */
  intensity: BirthIntensity;
}

/** Doğmuş avatar — karşılaşma ekranı + kalıcılık için. */
export interface BornAvatar {
  id: string;
  goddess: GoddessId;
  district: AvatarDistrictId;
  intensity: BirthIntensity;
  /** Üretilen Portrait kompozisyonu (dataURL). */
  portraitDataUrl: string;
  /** Kimlik kaynağı — kırpılmış yüz (dataURL) veya null. */
  faceDataUrl: string | null;
  createdAt: string;

  /* ───── Vatandaşlık katmanı (Order ekseni · ADDİTİF, opsiyonel) ─────
   * Civilization Bible §2–§3. Bu alanlar eski kayıtlarda bulunmayabilir;
   * `birth-storage` toleranslı parse eder. Avatar üretimi (archetype +
   * district) bunlardan BAĞIMSIZ çalışmaya devam eder. */

  /** Çağrıldığı düzen — yoksa Gezgin (Wanderer, canon: kutsal). */
  order?: OrderId;
  /** Ortak rank basamağı — yoksa "reflection" varsayılır. */
  rank?: AvatarRank;
  /** Çağrı durumu — yoksa "wanderer" varsayılır. */
  callingStatus?: CallingStatus;
}
