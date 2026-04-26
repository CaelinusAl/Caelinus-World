export type BodyType = "petite" | "balanced" | "curvy" | "runway";
export type BustSize = "s" | "m" | "l" | "xl";

export type AvatarConfig = {
  height: number;
  weight: number;
  bodyType: BodyType;
  bustSize: BustSize;
  hipRatio: number;
  skinTone: string;
  archetype: string;
};

export const DEFAULT_AVATAR: AvatarConfig = {
  height: 170,
  weight: 58,
  bodyType: "balanced",
  bustSize: "m",
  hipRatio: 1.0,
  skinTone: "#f4efe8",
  archetype: "cosmic",
};

export type BodyPresetMeta = {
  label: string;
  description: string;
  values: Partial<AvatarConfig>;
};

export const BODY_TYPE_PRESETS: Record<BodyType, BodyPresetMeta> = {
  petite: {
    label: "Petite",
    description: "Ince, kompakt, zarif",
    values: { height: 160, weight: 50, bustSize: "s", hipRatio: 0.88 },
  },
  balanced: {
    label: "Balanced",
    description: "Oranli, dengeli siluet",
    values: { height: 168, weight: 58, bustSize: "m", hipRatio: 1.0 },
  },
  curvy: {
    label: "Curvy",
    description: "Dolgun hatlar, feminen guc",
    values: { height: 170, weight: 72, bustSize: "l", hipRatio: 1.14 },
  },
  runway: {
    label: "Runway",
    description: "Uzun boy, podyum silueti",
    values: { height: 182, weight: 62, bustSize: "m", hipRatio: 0.94 },
  },
};

export type SkinToneOption = {
  hex: string;
  label: string;
};

export const SKIN_TONES: SkinToneOption[] = [
  { hex: "#fce4c7", label: "Porcelain" },
  { hex: "#f4efe8", label: "Ivory" },
  { hex: "#e8c9a0", label: "Sand" },
  { hex: "#d4a574", label: "Honey" },
  { hex: "#c99e6c", label: "Caramel" },
  { hex: "#a57247", label: "Amber" },
  { hex: "#6b3e26", label: "Cocoa" },
  { hex: "#3d2016", label: "Espresso" },
];
