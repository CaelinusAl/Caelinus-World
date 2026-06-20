/**
 * Caelinus AI — public surface.
 *
 * Tek import noktası: bütün UI bu modülden tip + helper alır,
 * bireysel iç dosyalardan değil. Bu sayede provider implementation
 * detayları (mock vs. gerçek backend) UI'dan sızdırılmaz.
 *
 * Side-effect: bu dosya import edildiği anda hem `mock` hem `studio`
 * provider'ı kayıt eder. Aktif provider seçimi:
 *   • `NEXT_PUBLIC_CAELINUS_AVATAR_PROVIDER` env var öncelikli
 *   • Yoksa "mock" (browser-side MediaPipe pipeline)
 *
 * Yeni bir provider eklemek için aynı pattern:
 *   `registerProvider(myProvider);`
 */

import { registerProvider, setActiveProvider } from "./provider";
import { caelinusStudioProvider } from "./providers/studio";
import { mockProvider } from "./providers/mock";

registerProvider(mockProvider);
registerProvider(caelinusStudioProvider);

/**
 * Build-time env var. Next.js bu string'i bundle'a inline eder; runtime
 * fallback yok. Geçerli değerler:
 *   • "mock"             — browser-side MediaPipe + 6 arketip (default)
 *   • "caelinus-ai-studio" — backend HTTP + SSE pipeline (S1+)
 */
const PROVIDER_FROM_ENV = process.env.NEXT_PUBLIC_CAELINUS_AVATAR_PROVIDER;
if (PROVIDER_FROM_ENV) {
  try {
    setActiveProvider(PROVIDER_FROM_ENV);
  } catch (err) {
    console.warn(
      `[caelinus-ai] env provider "${PROVIDER_FROM_ENV}" kayıtlı değil — mock'a düşülüyor.`,
      err,
    );
  }
}

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
  SelfieMeta,
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
