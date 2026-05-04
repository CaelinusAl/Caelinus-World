/**
 * Caelinus AI — domain tipleri.
 *
 * Vizyon: Caelinus'in kendi avatar pipeline'ı için temiz, provider-
 * agnostic tipler. Bu tipler bir "AI avatar oluşturma sözleşmesi"
 * tanımlar — selfie + stil profili → 3D avatar (GLB URL + meta).
 *
 * Bugün mock provider (MediaPipe + body library) kullanıyoruz; yarın
 * gerçek bir AI backend (Caelinus AI Studio, Stability, custom
 * pipeline) bu sözleşmeyi karşılayan başka bir provider'la değişebilir
 * — ÜST katman (UI, storage, scene) hiç dokunulmaz kalır.
 */

/* ────────── Selfie giriş tarafı ────────── */

export type SelfieInput = {
  /** data:image/...;base64,... veya blob URL */
  dataUrl: string;
  /** Kaynak — kullanıcı upload mu, kameradan mı? Telemetri için. */
  source: "upload" | "webcam";
  capturedAt: string; // ISO
  width?: number;
  height?: number;
};

/* ────────── Stil profili — kullanıcının estetik kararları ────────── */

export type HairLength = "short" | "bob" | "medium" | "long" | "veil";
export type HairTexture = "straight" | "wavy" | "curly" | "coily";

/** Hex renk — saç, ten için. */
export type ColorHex = `#${string}`;

export type FaceStyle =
  | "natural" // gerçek yüze yakın
  | "soft" // ölçüleri yumuşatılmış
  | "sculpted" // yüksek karakterli, çizgili
  | "ethereal"; // bulanıklaşmış / ışıltılı

export type BodyTypeMood =
  | "slender"
  | "balanced"
  | "curvy"
  | "athletic"
  | "ritualistic"; // taşıdığı duruş — ölçüden çok hâl

export type OutfitMood =
  | "minimal"
  | "couture"
  | "bohemian"
  | "futurist"
  | "ritualistic"
  | "noir-luxe";

export type AvatarStyleProfile = {
  hair: {
    length: HairLength;
    texture: HairTexture;
    color: ColorHex;
  };
  skinTone: ColorHex;
  faceStyle: FaceStyle;
  bodyType: BodyTypeMood;
  outfitMood: OutfitMood;
  /** Caelinus'in dile getirdiği "frekans" — şiirsel etiket. */
  frequencyTag?: string;
};

/* ────────── Selfie analiz çıktısı (face detection sonrası) ────────── */

export type SelfieAnalysis = {
  detected: boolean;
  /** MediaPipe'den çıkan landmarks (nokta sayısı) — debug ve provider'a ipucu. */
  landmarkCount?: number;
  /** Yüz şekli sınıflandırması (heuristic). */
  faceShape?: "oval" | "round" | "heart" | "square" | "long";
  /** Tahmini ten tonu (kullanıcı override edebilir). */
  estimatedSkinTone?: ColorHex;
  /** Tahmini göz rengi (kullanıcı override edebilir). */
  estimatedEyeColor?: ColorHex;
  /** Saç kestirimi (heuristic). */
  estimatedHairColor?: ColorHex;
  /** Provider'ın işlemine girecek raw metrics (avatar-deform pipeline). */
  rawMetrics?: Record<string, number>;
};

/* ────────── Caelinus okuması — algılanan AI çıktısı ────────── */

/** Dört temel element — Caelinus dilinde kullanıcının taşıdığı enerji. */
export type EnergyElement = "fire" | "water" | "air" | "earth";

export const ENERGY_LABELS: Record<EnergyElement, { tr: string; en: string; glyph: string; color: ColorHex }> = {
  fire: { tr: "Ateş", en: "Fire", glyph: "✦", color: "#e87a3d" },
  water: { tr: "Su", en: "Water", glyph: "❍", color: "#6ba8c4" },
  air: { tr: "Hava", en: "Air", glyph: "◌", color: "#cfc8b8" },
  earth: { tr: "Toprak", en: "Earth", glyph: "☷", color: "#a87149" },
};

/**
 * Stil kimliği — kullanıcının "AI tarafından" tanımlanmış arketipi.
 * Bunlar provider tarafından üretilir; UI sadece label'ı gösterir.
 */
export type StyleIdentity = {
  /** Stable id — store'a yazılır. */
  id: string;
  /** Kullanıcıya gösterilen başlık — "Goddess Minimal", "Lunar Auteur"… */
  label: string;
  /** İngilizce alt başlık — "ICONOGRAPHIC · CRYSTALLINE". */
  subtitle?: string;
};

export type CaelinusReading = {
  styleIdentity: StyleIdentity;
  energy: EnergyElement;
  /** "Yangının zarafetinde duruyorsun." — italic mood cümlesi. */
  mood: string;
  /** Daha uzun şiirsel okuma — paragraf. */
  reading: string;
  /** Frekans etiketi — örn. "Auteur · 528 Hz". */
  frequencyTag: string;
};

/* ────────── AI Match — 6 varyasyon arasından kullanıcı seçer ────────── */

/**
 * Generated avatar'ın "6 AI sonucundan birisi" hâli. Her match
 * kendi style identity'sini, kendi GLB'sini ve kendi recommendation
 * skorunu taşır.
 */
export type AvatarMatch = {
  /** Stable id — kart UI key'i ve seçim referansı. */
  id: string;
  /** GLB url — body library'den. */
  glbUrl: string;
  /** Kart önizlemesi — body preview veya provider tarafından üretilen thumbnail. */
  thumbnailUrl?: string;
  /** Style profile — bu match'in stil parametreleri. */
  styleProfile: AvatarStyleProfile;
  /** Caelinus okuması — bu match'e özel. */
  reading: CaelinusReading;
  /** 0-100 — yüksekse "user için daha uygun". */
  recommendationScore: number;
  /** En yüksek skorlu match — "✦ Senin için". */
  isRecommended?: boolean;
  /** Match'in body library'deki kaynağı — debug. */
  sourceBodyId?: string;
};

/* ────────── Üretilen avatar ────────── */

export type GeneratedAvatar = {
  id: string;
  /** GLB URL — local /public/models veya CDN. */
  glbUrl: string;
  /** Avatar önizleme görseli — kart UI'larında kullanılır. */
  thumbnailUrl?: string;
  /** Üretildiği selfie analizi. */
  analysis?: SelfieAnalysis;
  /** Kullanıcının seçtiği stil profili. */
  styleProfile: AvatarStyleProfile;
  /** Provider kimliği. */
  provider: string;
  /** Provider versiyonu — schema migration için. */
  providerVersion?: string;
  /** Üretim zamanı. */
  generatedAt: string;
  /** Try-on için ipuçları — Caelinus shop'ın outfit binding'ine geçer. */
  outfitBindingHints?: {
    hiddenMeshParts?: string[];
    bindingScale?: number;
    /** External avatar mı (kendi yüz/saç texture'ı var)? */
    isPhotorealistic?: boolean;
    /** Skin tone slider'ı bu mesh'i etkiler mi? */
    supportsSkinToneOverride?: boolean;
  };
  /** Caelinus'in yorumu — şiirsel "okuma" (eski alan, geriye uyumlu). */
  caelinusReading?: string;
  /** Yapılandırılmış okuma — Style Identity + Energy + Mood. */
  reading?: CaelinusReading;
  /** Kullanıcının seçtiği match'in id'si (varsa). */
  matchId?: string;
};

/* ────────── Try-on event'leri ────────── */

export type TryOnState = {
  productId: string | null;
  status: "idle" | "binding" | "ready" | "error";
};

/* ────────── Default'lar — placeholder ve dropdown init için ────────── */

export const DEFAULT_STYLE_PROFILE: AvatarStyleProfile = {
  hair: { length: "long", texture: "wavy", color: "#1a1410" },
  skinTone: "#d4ad8a",
  faceStyle: "natural",
  bodyType: "balanced",
  outfitMood: "noir-luxe",
  frequencyTag: "Auteur",
};
