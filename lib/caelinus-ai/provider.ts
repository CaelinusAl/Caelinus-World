/**
 * Caelinus AI — Avatar Provider sözleşmesi.
 *
 * Bu interface bir "stilize avatar üretici" beklentisini tanımlar.
 * Aynı interface'i karşılayan birden çok provider olabilir:
 *   • MockProvider — MediaPipe + body library (bugünkü)
 *   • CaelinusAIProvider — bizim kendi backend'imiz (yarın)
 *   • StabilityProvider — Stability/SD + parametric body (yarın)
 *
 * Üst katman (UI, storage) sadece `AvatarProvider`'a bağımlı; kim
 * bu sözleşmeyi karşılarsa onunla çalışır. Provider seçimi:
 *   • UI'da seçici yok şimdilik — `getActiveProvider()` default mock'u
 *     döndürür. İleride env var (NEXT_PUBLIC_CAELINUS_AVATAR_PROVIDER)
 *     veya kullanıcı tercihi ile değişir.
 */

import type {
  AvatarMatch,
  AvatarStyleProfile,
  GeneratedAvatar,
  SelfieAnalysis,
  SelfieInput,
} from "./types";

/* ────────── Progress callback'i ────────── */

export type ProgressUpdate = {
  phase:
    | "preparing"
    | "analyzing-selfie"
    | "matching-archetype"
    | "generating-variants"
    | "rigging"
    | "rendering"
    | "polishing"
    | "ready";
  /** 0-100 */
  progress: number;
  /** Türkçe poetic mesaj — "Yüzünden bir frekans okuyoruz…". */
  message: string;
};

export type GenerateInput = {
  selfie?: SelfieInput;
  style: AvatarStyleProfile;
  onProgress?: (update: ProgressUpdate) => void;
  /** İptal sinyali — kullanıcı modal'ı kapatırsa. */
  signal?: AbortSignal;
};

/* ────────── Provider arayüzü ────────── */

export interface AvatarProvider {
  /** Stable id — log + storage referansı. */
  readonly id: string;
  /** UI'da gösterilen label. */
  readonly label: string;
  /** Provider versiyonu — generated avatar meta'sına yazılır. */
  readonly version: string;
  /** Selfie kabul ediyor mu (bazı sade providerlar sadece style profili kullanır). */
  readonly supportsSelfie: boolean;
  /** Tahmini latency (ms) — UI loading bar'ı önden bilgilendirsin. */
  readonly estimatedLatencyMs: number;

  /**
   * Selfie analizi — provider'ın selfie'yi nasıl yorumladığı.
   * Style customizer için ipuçları (estimatedSkinTone, estimatedHairColor)
   * verir; user override edebilir.
   */
  analyzeSelfie?(selfie: SelfieInput): Promise<SelfieAnalysis>;

  /**
   * Avatar üretimi — selfie + style → GLB URL + meta.
   */
  generate(input: GenerateInput): Promise<GeneratedAvatar>;

  /**
   * Çoklu varyasyon — "AI 6 farklı avatar buldu, biri öneriyor"
   * deneyimi. Generate'in yerine değil, ondan ÖNCE çağrılır:
   * kullanıcı 6 karttan birini seçer, sonra `generate({ matchId })`
   * ile finalize edilir. Provider opsiyonel olarak implement eder.
   */
  generateMatches?(input: GenerateInput): Promise<AvatarMatch[]>;

  /**
   * Bir match'i final GeneratedAvatar'a dönüştürür. UI seçim
   * yapınca bu çağrılır — provider, match'i son rötuşlardan
   * geçirip GeneratedAvatar döndürür (signing, polish vs.).
   * Default implementation: match'in field'larını GeneratedAvatar
   * shape'ine map eder.
   */
  finalizeMatch?(input: {
    match: AvatarMatch;
    selfie?: SelfieInput;
    onProgress?: (u: ProgressUpdate) => void;
    signal?: AbortSignal;
  }): Promise<GeneratedAvatar>;
}

/* ────────── Provider registry ────────── */

const REGISTRY = new Map<string, AvatarProvider>();
let activeProviderId: string | null = null;

export function registerProvider(p: AvatarProvider): void {
  REGISTRY.set(p.id, p);
  if (!activeProviderId) activeProviderId = p.id;
}

export function setActiveProvider(id: string): void {
  if (!REGISTRY.has(id)) {
    throw new Error(`[caelinus-ai] provider "${id}" registered değil`);
  }
  activeProviderId = id;
}

export function getActiveProvider(): AvatarProvider {
  const id =
    activeProviderId ||
    process.env.NEXT_PUBLIC_CAELINUS_AVATAR_PROVIDER ||
    "mock";
  const provider = REGISTRY.get(id);
  if (!provider) {
    // İlk request'te mock provider lazy-register'lı olabilir; çağıran
    // taraf import etmiş olmalı (provider'ı side-effect import ile
    // self-register ediyoruz — `providers/mock.ts`).
    throw new Error(
      `[caelinus-ai] aktif provider yok. Provider'ı side-effect import et.`,
    );
  }
  return provider;
}

export function listProviders(): AvatarProvider[] {
  return Array.from(REGISTRY.values());
}
