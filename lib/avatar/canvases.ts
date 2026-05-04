/**
 * Caelinus Avatar Canvases — Faz A.1
 *
 * "Boş tuval" base modelleri. Avatar Studio'da kullanıcı 3 evrensel
 * tuvalden birini seçer; selfie face-swap'i bu tuvalin üzerine
 * yapılır. Sonuç: kullanıcının yüzü + tarafsız beden modeli =
 * onun "kalıcı kıyafetsiz tuvali". Sonra Wardrobe'da bu tuvalin
 * üstüne shop ürünleri compose edilir (1 kredi/render).
 *
 * Önceki (Faz 3.4) lookbook target'larında ("CAELINUS PLAY" + "Gemini"
 * yazılı, multi-figure kompozit) face-swap çalışsa da kullanıcı sonucu
 * "kendi avatarım" olarak algılayamadı:
 *   • Yüz çerçevenin %5'ini kaplıyordu,
 *   • Marketing overlay'leri (logo, zodiac cursive, konstellation)
 *     "default afiş" hissi veriyordu,
 *   • Multi-figure (gemini ikizler) "yarı ben yarı default" karmaşası
 *     yaratıyordu.
 *
 * Bu kataloğun tüm tuvalleri:
 *   ✓ Single-figure (tek kişi)
 *   ✓ Text/logo/overlay yok
 *   ✓ Yüz çerçevenin ~%20-25'i (face-swap output'ta tanınır)
 *   ✓ PG-uygun (fal-ai safety_tolerance=5 geçer)
 *   ✓ Cosmic Caelinus estetiği (kimlik korunur)
 *
 * Kullanıcı seçimi `profiles.caelinus_avatar_base` (auth'lı) +
 * `localStorage` (anonim) ile saklanır. Render endpoint dynamic
 * `findCanvas(canvasId).src` üzerinden target image'ı çözer.
 *
 * Katalog dondurulmuş (`as const` + `readonly`) — UI ve render
 * route tek bir kaynaktan beslensin diye. Yeni tuval eklemek için
 * 3 adım: (1) `/public/avatar/base-options/<id>.jpg` koy,
 * (2) buraya entry ekle, (3) Migration 0012'deki
 * `caelinus_avatar_base` check constraint'ini güncelle.
 */

export type AvatarCanvasId = "silk" | "bodysuit" | "veil";

export type AvatarCanvas = {
  /** Stable ID — DB constraint, URL parametresi, localStorage key. */
  readonly id: AvatarCanvasId;
  readonly label: { tr: string; en: string };
  /** UI'da chip altında ipucu — "ne tür bir başlangıç?" */
  readonly hint: { tr: string; en: string };
  /** Public path — face-swap target. Mutlaka /public altında ve
   *  HTTP üzerinden erişilebilir olmalı (fal sunucusu fetch eder). */
  readonly src: string;
  /** Tek bir tuval önerilen (UI'da "best for layering" rozeti).
   *  Bodysuit cumulative dressing'de en tutarlı sonucu verir
   *  çünkü kıyafetsiz alan en az → nano-banana edit overlap karmaşası
   *  yaşamaz. */
  readonly recommended?: boolean;
  /** Render prompt'una eklenen kıyafet ipucu. Wardrobe try-on'da
   *  AI'ya "şu anki taban kıyafet bu" der, yeni outfit ile çatışmasın. */
  readonly garmentNote: string;
};

export const AVATAR_CANVASES: readonly AvatarCanvas[] = [
  {
    id: "silk",
    label: { tr: "İpek Tuval", en: "Silk Canvas" },
    hint: {
      tr: "Şampanya ipek slip — minimalist, modern, sade.",
      en: "Champagne silk slip — minimalist, modern, clean.",
    },
    src: "/avatar/base-options/base-option-1-silk-canvas.jpg",
    garmentNote:
      "champagne silk slip dress (replace this base garment with the new outfit when dressing)",
  },
  {
    id: "bodysuit",
    label: { tr: "Bodysuit Tuval", en: "Bodysuit Canvas" },
    hint: {
      tr: "Mat siyah bodysuit — ürünleri üst üste denemek için en temiz zemin.",
      en: "Matte black bodysuit — the cleanest base for layering products.",
    },
    src: "/avatar/base-options/base-option-2-bodysuit-canvas.jpg",
    recommended: true,
    garmentNote:
      "matte black long-sleeve bodysuit (treat as neutral underlayer; new outfits go on top or replace it)",
  },
  {
    id: "veil",
    label: { tr: "Yıldız Tülü", en: "Starlight Veil" },
    hint: {
      tr: "Şampanya yıldız tülü — şiirsel, painterly, tanrıça hissi.",
      en: "Champagne starlight veil — poetic, painterly, goddess aura.",
    },
    src: "/avatar/base-options/base-option-3-starlight-veil.jpg",
    garmentNote:
      "translucent champagne celestial veil (remove or partially replace when dressing with shop garments)",
  },
] as const;

/** Hangisi varsayılan — kullanıcı seçim yapmadıysa bu render edilir.
 *  `bodysuit` seçildi çünkü Wardrobe try-on'da en az çatışma yaratır. */
export const DEFAULT_CANVAS: AvatarCanvasId = "bodysuit";

/** ID → AvatarCanvas çözümleyicisi. Bilinmeyen / geçersiz ID için
 *  `null` döner; çağıran `?? findCanvas(DEFAULT_CANVAS)` ile defansif
 *  davranabilir. */
export function findCanvas(
  id: string | null | undefined,
): AvatarCanvas | null {
  if (!id) return null;
  const c = AVATAR_CANVASES.find((x) => x.id === id);
  return c ?? null;
}

/** Tüm canvas ID'lerinin runtime listesi — Zod enum, DB constraint
 *  doğrulaması ve URL search-param parsing için kullanılır. */
export const AVATAR_CANVAS_IDS = AVATAR_CANVASES.map((c) => c.id) as [
  AvatarCanvasId,
  ...AvatarCanvasId[],
];

/** Type-guard — runtime'da gelen bir string'in geçerli ID olup
 *  olmadığını kontrol eder. URL search-param ya da auth-store'dan
 *  okunan değeri güvenle daraltır. */
export function isAvatarCanvasId(v: unknown): v is AvatarCanvasId {
  return typeof v === "string" && AVATAR_CANVASES.some((c) => c.id === v);
}
