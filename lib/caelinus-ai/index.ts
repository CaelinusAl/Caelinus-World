/**
 * Caelinus AI — public surface.
 *
 * Tek import noktası: bütün UI bu modülden tip + helper alır,
 * bireysel iç dosyalardan değil. Bu sayede provider implementation
 * detayları (mock vs. gerçek backend) UI'dan sızdırılmaz.
 *
 * Side-effect: bu dosya import edildiği anda mock provider kayıt
 * olur. Yeni bir provider eklemek için aynı pattern:
 *   `registerProvider(myProvider);`
 */

import { registerProvider } from "./provider";
import { mockProvider } from "./providers/mock";

registerProvider(mockProvider);

export type {
  AvatarMatch,
  AvatarStyleProfile,
  CaelinusReading,
  ColorHex,
  EnergyElement,
  GeneratedAvatar,
  HairLength,
  HairTexture,
  FaceStyle,
  BodyTypeMood,
  OutfitMood,
  SelfieAnalysis,
  SelfieInput,
  StyleIdentity,
  TryOnState,
} from "./types";
export { DEFAULT_STYLE_PROFILE, ENERGY_LABELS } from "./types";

export type {
  AvatarProvider,
  GenerateInput,
  ProgressUpdate,
} from "./provider";
export {
  getActiveProvider,
  setActiveProvider,
  listProviders,
} from "./provider";

export {
  TRYON_VARIANTS,
  TRYON_VARIANT_COUNT,
  getVariantForProduct,
  getVariantIndexForProduct,
} from "./try-on-variants";

export {
  saveStyleProfile,
  loadStyleProfile,
  saveGeneratedAvatar,
  loadGeneratedAvatar,
  clearGeneratedAvatar,
  GENERATED_AVATAR_KEY,
  saveSelfie,
  loadSelfie,
  clearSelfie,
} from "./storage";
