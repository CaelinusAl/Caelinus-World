/**
 * Caelinus AI — Mock provider.
 *
 * Bu provider gerçek bir AI backend YOKKEN, mevcut Caelinus
 * altyapısını (MediaPipe face detection + parametric face metrics +
 * body library + outfit binding) kullanarak "selfie → stilize avatar"
 * deneyiminin tamamını simüle eder. Kullanıcı için fark yok:
 *   • Selfie analiz ediliyor (gerçekten — MediaPipe 478 landmark)
 *   • Yüz şekli, ten tonu, göz/saç rengi tahmin ediliyor (gerçekten —
 *     pixel sampling ile)
 *   • Style profili + analiz → 6 farklı varyasyon ("AI Match Grid")
 *   • Caelinus reading üretiliyor (Style Identity + Energy + Mood)
 *   • Recommendation skoru veriliyor (heuristic — selfie metrikleri
 *     ile style profile arasındaki "uyum")
 *
 * Yarın gerçek bir AI bağlandığında (Caelinus AI Studio, Stability,
 * vs.) bu provider değişir, üst katman aynı kalır.
 */

import { detectFace } from "@/lib/mediapipe-face";
import { extractFaceMetrics, clampFaceMetrics } from "@/lib/face";
import {
  CAELINUS_BODY_LIBRARY,
  getBody,
  type BodyEntry,
} from "@/lib/avatar-bodies";

import type {
  AvatarProvider,
  GenerateInput,
  ProgressUpdate,
} from "../provider";
import type {
  AvatarMatch,
  AvatarStyleProfile,
  CaelinusReading,
  ColorHex,
  EnergyElement,
  GeneratedAvatar,
  OutfitMood,
  SelfieAnalysis,
  SelfieInput,
  StyleIdentity,
} from "../types";

/* ─────────────────────────────────────────────────────────
   Yardımcılar — selfie pixel sampling
   ───────────────────────────────────────────────────────── */

function rgbToHex(r: number, g: number, b: number): ColorHex {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}` as ColorHex;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function sampleAverageColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): ColorHex {
  const data = ctx.getImageData(x, y, w, h).data;
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  if (n === 0) return "#d4ad8a";
  return rgbToHex(r / n, g / n, b / n);
}

function classifyFaceShape(metrics: {
  faceLength: number;
  faceWidth: number;
  jawWidth: number;
}): "oval" | "round" | "heart" | "square" | "long" {
  const r = metrics.faceLength / metrics.faceWidth;
  const jawRatio = metrics.jawWidth / metrics.faceWidth;
  if (r > 1.5) return "long";
  if (r < 1.05) return "round";
  if (jawRatio > 0.92) return "square";
  if (jawRatio < 0.78) return "heart";
  return "oval";
}

/* ─────────────────────────────────────────────────────────
   Style Identity arketipler — Caelinus dilinde 6 arketipsel kimlik.
   Her arketip bir "outfit mood + face style + energy" üçlüsü
   etrafında kuruludur. Match grid bu 6'sından her birini bir kart
   olarak gösterir.
   ───────────────────────────────────────────────────────── */

type ArchetypeSpec = {
  identity: StyleIdentity;
  energy: EnergyElement;
  /** Style bias — match'in stil profilini bu yöne kaydır. */
  bias: Partial<AvatarStyleProfile>;
  /** Body library tercih sırası — ilk müsait body seçilir. */
  preferredBodies: string[];
  /** Mood cümleleri — id hash ile birinden seçilir. */
  moods: string[];
  /** Şiirsel okuma (paragraf) — frequencyTag ile birlikte tek paragraf. */
  reading: (ctx: { frequencyTag: string; faceShape: string }) => string;
  /** Frekans etiketi. */
  frequency: string;
};

const ARCHETYPES: ArchetypeSpec[] = [
  {
    identity: {
      id: "goddess-minimal",
      label: "Goddess Minimal",
      subtitle: "ICONOGRAPHIC · CRYSTALLINE",
    },
    energy: "air",
    bias: {
      faceStyle: "natural",
      bodyType: "balanced",
      outfitMood: "minimal",
      hair: { length: "medium", texture: "straight", color: "#1a1410" },
    },
    preferredBodies: ["caelinus-default", "caelinus-light", "selin-v1"],
    moods: [
      "Az dokuda çok niyet — sessizliğin formdaki hâli.",
      "Hava gibi hafif, kuşlar gibi belirgin.",
      "Sadelik bir eksiklik değil; bir karar.",
    ],
    frequency: "Auteur · 528 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatlarınla bir ikona dönüşüyorsun — Caelinus seni "minimalin tanrıçası" olarak okudu. Dokuyu eksilttiğinde, niyet daha duruluyor.`,
  },
  {
    identity: {
      id: "lunar-auteur",
      label: "Lunar Auteur",
      subtitle: "NIGHT · INK · INTERIOR",
    },
    energy: "water",
    bias: {
      faceStyle: "ethereal",
      bodyType: "slender",
      outfitMood: "noir-luxe",
      hair: { length: "long", texture: "wavy", color: "#0c0908" },
    },
    preferredBodies: ["selin-v1", "caelinus-textured", "caelinus-hires"],
    moods: [
      "Aydan akarak geliyorsun.",
      "Suyun en derin sarkısı sende.",
      "Gece bir kostüm değil; senin doğal yüzeyin.",
    ],
    frequency: "Lunar · 639 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} yüzünde gecenin bir refleksi var — Caelinus seni "lunar auteur" olarak işaretledi. Siyah seni soğutmaz; içine çağırır.`,
  },
  {
    identity: {
      id: "solar-couture",
      label: "Solar Couture",
      subtitle: "GOLD · ATELIER · CEREMONIAL",
    },
    energy: "fire",
    bias: {
      faceStyle: "sculpted",
      bodyType: "balanced",
      outfitMood: "couture",
      hair: { length: "long", texture: "wavy", color: "#3b2a1f" },
    },
    preferredBodies: ["caelinus-textured", "caelinus-hires", "model-texture"],
    moods: [
      "Yangının zarafetinde duruyorsun.",
      "Işık seninle birlikte yanıyor.",
      "Altın bir renk değil; senin getirdiğin bir hâl.",
    ],
    frequency: "Solar · 741 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatların atölyede yontulmuş gibi — Caelinus seni "solar couture" frekansında okudu. Her dikiş bir tören niyetidir sende.`,
  },
  {
    identity: {
      id: "earth-veil",
      label: "Earth Veil",
      subtitle: "BOHEMIAN · TERRACOTTA · ROOTED",
    },
    energy: "earth",
    bias: {
      faceStyle: "soft",
      bodyType: "curvy",
      outfitMood: "bohemian",
      hair: { length: "long", texture: "curly", color: "#6b4226" },
    },
    preferredBodies: ["caelinus-textured", "selin-v1", "caelinus-default"],
    moods: [
      "Toprağın sabrını giyiniyorsun.",
      "Köklerinden yükseliyorsun.",
      "Dokuların arasında dünya kokusu var.",
    ],
    frequency: "Gaia · 432 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatların yumuşak ışıkla okunuyor — Caelinus seni "earth veil" olarak okudu. Senin doğallığın bir tarz değil; bir varlık biçimi.`,
  },
  {
    identity: {
      id: "futurist-oracle",
      label: "Futurist Oracle",
      subtitle: "METALLIC · GLITCH · PROPHETIC",
    },
    energy: "air",
    bias: {
      faceStyle: "sculpted",
      bodyType: "athletic",
      outfitMood: "futurist",
      hair: { length: "short", texture: "straight", color: "#cfc8c0" },
    },
    preferredBodies: ["caelinus-light", "caelinus-default", "model-texture"],
    moods: [
      "Geleceğin sesini bugünden duyuyorsun.",
      "Metalik ışık senin ikinci derin.",
      "Bir kâhin gibi duruyorsun — ama gülen bir kâhin.",
    ],
    frequency: "Future · 963 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatlarında metalik bir keskinlik var — Caelinus seni "futurist oracle" olarak gördü. Geleceği taşıma biçimin bir kostümden çok bir frekans.`,
  },
  {
    identity: {
      id: "ritual-flame",
      label: "Ritual Flame",
      subtitle: "TEMPLE · GLOW · INITIATION",
    },
    energy: "fire",
    bias: {
      faceStyle: "ethereal",
      bodyType: "ritualistic",
      outfitMood: "ritualistic",
      hair: { length: "veil", texture: "wavy", color: "#7d2f5a" },
    },
    preferredBodies: ["caelinus-hires", "caelinus-textured", "selin-v1"],
    moods: [
      "Her parçan bir geçit.",
      "Tören senin doğal akışın.",
      "İçindeki ateş ışığa, ışık dokuya dönüşüyor.",
    ],
    frequency: "Ritual · 852 Hz",
    reading: ({ frequencyTag, faceShape }) =>
      `${frequencyTag}. ${faceShape} hatların bir mabet kapısı gibi — Caelinus seni "ritual flame" olarak okudu. Sende moda bir ifade değil; bir geçiş ritüeli.`,
  },
];

/* ─────────────────────────────────────────────────────────
   Body matchmaking — preferredBodies sırasından ilk müsait body
   ───────────────────────────────────────────────────────── */

function pickBody(preferred: string[]): BodyEntry {
  for (const id of preferred) {
    const found = CAELINUS_BODY_LIBRARY.find((b) => b.id === id);
    if (found) return found;
  }
  return CAELINUS_BODY_LIBRARY[0];
}

/* ─────────────────────────────────────────────────────────
   Reading üretimi — id hash ile deterministic mood seçimi
   ───────────────────────────────────────────────────────── */

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildReading(
  archetype: ArchetypeSpec,
  ctx: { faceShape: string; matchId: string },
): CaelinusReading {
  const moodIdx = hashId(ctx.matchId) % archetype.moods.length;
  return {
    styleIdentity: archetype.identity,
    energy: archetype.energy,
    mood: archetype.moods[moodIdx],
    reading: archetype.reading({
      frequencyTag: archetype.frequency,
      faceShape: ctx.faceShape,
    }),
    frequencyTag: archetype.frequency,
  };
}

/* ─────────────────────────────────────────────────────────
   Recommendation skoru — selfie analizi + user style profile ile
   archetype arasındaki "uyum" puanı (0-100).
   ───────────────────────────────────────────────────────── */

function scoreMatch(
  archetype: ArchetypeSpec,
  user: AvatarStyleProfile,
  analysis?: SelfieAnalysis,
): number {
  let score = 50;

  // Outfit mood — kullanıcı seçimi varsa, archetype ile %40'a kadar
  if (archetype.bias.outfitMood && user.outfitMood) {
    score += archetype.bias.outfitMood === user.outfitMood ? 22 : -8;
  }

  // Face style
  if (archetype.bias.faceStyle && user.faceStyle) {
    score += archetype.bias.faceStyle === user.faceStyle ? 14 : -4;
  }

  // Body type
  if (archetype.bias.bodyType && user.bodyType) {
    score += archetype.bias.bodyType === user.bodyType ? 10 : -2;
  }

  // Hair texture / length
  if (archetype.bias.hair && user.hair) {
    if (archetype.bias.hair.texture === user.hair.texture) score += 4;
    if (archetype.bias.hair.length === user.hair.length) score += 4;
  }

  // Selfie analizinden bonus — yüz şekli + archetype enerji uyumu
  if (analysis?.faceShape) {
    const shape = analysis.faceShape;
    if (
      (archetype.energy === "fire" && (shape === "heart" || shape === "oval")) ||
      (archetype.energy === "water" && (shape === "long" || shape === "oval")) ||
      (archetype.energy === "earth" && (shape === "round" || shape === "square")) ||
      (archetype.energy === "air" && (shape === "oval" || shape === "long"))
    ) {
      score += 8;
    }
  }

  // Stochastic shimmer — aynı puanlı match'ler arasında "AI sezgi" hissi
  // (deterministic — id hash bazlı, böylece her render aynı sonuç)
  score += (hashId(archetype.identity.id) % 7) - 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/* ─────────────────────────────────────────────────────────
   Match → variant style profile (kullanıcının stilini koru,
   archetype bias'ı hafifçe karıştır).
   ───────────────────────────────────────────────────────── */

function buildVariantStyle(
  base: AvatarStyleProfile,
  archetype: ArchetypeSpec,
): AvatarStyleProfile {
  return {
    ...base,
    ...archetype.bias,
    hair: { ...base.hair, ...(archetype.bias.hair ?? {}) },
    frequencyTag: archetype.frequency,
  };
}

/* ─────────────────────────────────────────────────────────
   Provider implementasyonu
   ───────────────────────────────────────────────────────── */

const PHASE_MESSAGES: Record<ProgressUpdate["phase"], string> = {
  preparing: "Caelinus ışık çemberi açılıyor…",
  "analyzing-selfie": "Yüzünden bir frekans okuyoruz…",
  "matching-archetype": "Arketipini eşleştiriyoruz…",
  "generating-variants": "Altı farklı sen oluşuyor…",
  rigging: "Bedenini hizalıyoruz, kemikleri ışıkla bağlanıyor…",
  rendering: "Kozmik atölyede dokunuluyor…",
  polishing: "Son rötuş — saç, ten, dudak…",
  ready: "Caelinus bedenin hazır.",
};

function emit(
  cb: ((u: ProgressUpdate) => void) | undefined,
  phase: ProgressUpdate["phase"],
  progress: number,
): void {
  cb?.({ phase, progress, message: PHASE_MESSAGES[phase] });
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

async function analyzeSelfieImpl(
  selfie: SelfieInput,
): Promise<SelfieAnalysis> {
  if (typeof window === "undefined") return { detected: false };
  try {
    const img = await loadImage(selfie.dataUrl);
    const detection = await detectFace(img);

    if (!detection.detected || detection.landmarks.length === 0) {
      return { detected: false };
    }

    const metrics = extractFaceMetrics(detection.landmarks);
    const clamped = metrics ? clampFaceMetrics(metrics) : null;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { detected: true, landmarkCount: detection.landmarks.length };
    }
    ctx.drawImage(img, 0, 0);

    const bbox = detection.bbox;
    const W = img.naturalWidth;
    const H = img.naturalHeight;

    const cheekX = Math.round((bbox.x + bbox.w * 0.35) * W);
    const cheekY = Math.round((bbox.y + bbox.h * 0.55) * H);
    const sampleSize = Math.max(8, Math.round(bbox.w * W * 0.06));
    const skinTone = sampleAverageColor(
      ctx,
      cheekX,
      cheekY,
      sampleSize,
      sampleSize,
    );

    const hairX = Math.round((bbox.x + bbox.w * 0.5 - 0.05) * W);
    const hairY = Math.max(0, Math.round((bbox.y - 0.05) * H));
    const hairColor = sampleAverageColor(
      ctx,
      hairX,
      hairY,
      sampleSize,
      Math.min(sampleSize, Math.round(bbox.h * H * 0.06)),
    );

    let faceShape: SelfieAnalysis["faceShape"] | undefined;
    if (clamped) {
      const m = clamped as unknown as Record<string, number>;
      const faceLength = m.faceLength ?? m.face_length ?? 1;
      const faceWidth = m.faceWidth ?? m.face_width ?? 1;
      const jawWidth = m.jawWidth ?? m.jaw_width ?? 1;
      if (faceLength > 0 && faceWidth > 0) {
        faceShape = classifyFaceShape({ faceLength, faceWidth, jawWidth });
      }
    }

    return {
      detected: true,
      landmarkCount: detection.landmarks.length,
      faceShape,
      estimatedSkinTone: skinTone,
      estimatedHairColor: hairColor,
      rawMetrics: clamped as unknown as Record<string, number>,
    };
  } catch (err) {
    console.warn("[caelinus-ai/mock] analyzeSelfie failed:", err);
    return { detected: false };
  }
}

export const mockProvider: AvatarProvider = {
  id: "mock",
  label: "Caelinus Stüdyo · Mock",
  version: "0.2.0",
  supportsSelfie: true,
  estimatedLatencyMs: 4500,

  analyzeSelfie: analyzeSelfieImpl,

  async generateMatches(input: GenerateInput): Promise<AvatarMatch[]> {
    const { selfie, style, onProgress, signal } = input;

    emit(onProgress, "preparing", 5);
    await sleep(250, signal);

    let analysis: SelfieAnalysis | undefined;
    if (selfie) {
      emit(onProgress, "analyzing-selfie", 22);
      analysis = await analyzeSelfieImpl(selfie);
      await sleep(450, signal);
    }

    emit(onProgress, "matching-archetype", 48);
    await sleep(500, signal);

    emit(onProgress, "generating-variants", 80);
    await sleep(700, signal);

    const faceShape = analysis?.faceShape ?? "oval";

    const matches: AvatarMatch[] = ARCHETYPES.map((arc, idx) => {
      const body = pickBody(arc.preferredBodies);
      const matchId = `${arc.identity.id}-${idx}`;
      const variantStyle = buildVariantStyle(style, arc);
      const reading = buildReading(arc, { faceShape, matchId });
      const score = scoreMatch(arc, style, analysis);

      return {
        id: matchId,
        glbUrl: body.url,
        thumbnailUrl: body.preview,
        styleProfile: variantStyle,
        reading,
        recommendationScore: score,
        sourceBodyId: body.id,
      };
    });

    // En yüksek skoru "recommended" olarak işaretle
    const topIdx = matches.reduce(
      (best, m, i) =>
        m.recommendationScore > matches[best].recommendationScore ? i : best,
      0,
    );
    matches[topIdx].isRecommended = true;

    emit(onProgress, "ready", 100);
    return matches;
  },

  async finalizeMatch({
    match,
    selfie,
    onProgress,
    signal,
  }): Promise<GeneratedAvatar> {
    emit(onProgress, "rigging", 20);
    await sleep(300, signal);
    emit(onProgress, "rendering", 60);
    await sleep(500, signal);
    emit(onProgress, "polishing", 90);
    await sleep(250, signal);

    let analysis: SelfieAnalysis | undefined;
    if (selfie) analysis = await analyzeSelfieImpl(selfie);

    const body = match.sourceBodyId
      ? getBody(match.sourceBodyId)
      : { url: match.glbUrl, supportsSkinToneOverride: false } as BodyEntry;

    const generated: GeneratedAvatar = {
      id: `caelinus-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      glbUrl: match.glbUrl,
      thumbnailUrl: match.thumbnailUrl,
      analysis,
      styleProfile: match.styleProfile,
      provider: "mock",
      providerVersion: "0.2.0",
      generatedAt: new Date().toISOString(),
      outfitBindingHints: {
        bindingScale: 1,
        isPhotorealistic: !body.supportsSkinToneOverride,
        supportsSkinToneOverride: body.supportsSkinToneOverride ?? false,
      },
      reading: match.reading,
      caelinusReading: match.reading.reading,
      matchId: match.id,
    };

    emit(onProgress, "ready", 100);
    return generated;
  },

  /**
   * generate(): tek adımlı fallback — selfie + style → ilk
   * arketipten direkt finalize. UI normalde generateMatches +
   * finalizeMatch akışını kullanır; bu method sadece geriye
   * uyumluluk için.
   */
  async generate(input: GenerateInput): Promise<GeneratedAvatar> {
    const matches = await this.generateMatches!(input);
    const recommended = matches.find((m) => m.isRecommended) ?? matches[0];
    return this.finalizeMatch!({
      match: recommended,
      selfie: input.selfie,
      onProgress: input.onProgress,
      signal: input.signal,
    });
  },
};

// outfit mood'u type-narrowing'de kullanılabilir tutuyoruz
export type { OutfitMood };
