/**
 * Caelinus Body Library — kendi 3D avatar mesh kütüphanemiz.
 *
 * Vizyon: Avaturn / Ready Player Me gibi dış servislere bağlı
 * kalmadan, kendi 3D mesh'lerimizle bir "Caelinus avatar studio"
 * kuruyoruz. Bu library kullanıcının seçeceği base body'leri
 * tanımlar; her body Mixamo-uyumlu rig'le geliyor (catwalk
 * animasyonu + outfit bone binding hâlâ çalışsın diye).
 *
 * Mesh ekleme akışı:
 *   1. GLB'yi `/public/models/<name>.glb` altına koy
 *   2. Bu listeye yeni `BodyEntry` ekle
 *   3. (opsiyonel) `/public/models/previews/<name>.png` thumbnail
 *
 * Mesh hazırlık ipuçları:
 *   • Mixamo standart bone isimleri kullan (Hips, Spine, Spine1,
 *     Spine2, Neck, Head, LeftArm, RightArm vs.) — outfit binding
 *     ve catwalk retarget bunlara dayalı.
 *   • Tek skeleton, multi-mesh OK. Body + Head + Hair ayrı meshler
 *     olabilir; outfit binding doğru hidden parts ile çalışır.
 *   • Skin tone slider'ı dış mesh'lerde no-op (kendi PBR material'ı
 *     korunur).
 */

export type BodyGender = "feminine" | "masculine" | "neutral";

export type BodyEntry = {
  /** Stable kimlik — localStorage'a yazılır, hiç değişmemeli. */
  id: string;
  /** UI label (Türkçe). */
  label: string;
  /** Bir-iki cümlelik karakter kısa tanımı. */
  tagline: string;
  /** GLB URL — `/public/models/...` */
  url: string;
  /** Önizleme görseli — yoksa CSS gradient fallback. */
  preview?: string;
  /** Default kimlik — UI'da öne çıkacak. */
  isDefault?: boolean;
  /** Kullanıcının kendisinin önerdiği body — "yeni / seninki" rozeti. */
  isPersonal?: boolean;
  /** Kabaca cinsiyet — UI'da grouping için (gerçek seçim kullanıcıda). */
  gender: BodyGender;
  /** "Selin", "Ay", "Ateş" gibi şiirsel tema — Caelinus brand. */
  vibe?: string;
  /** Avatar'ın approximate boy (m) — sliderless preview için. */
  baseHeightM?: number;
  /** Bu body'de skin tone slider'ı override edebilir mi? Kendi
   *  texture'ı varsa false (dış mesh) — rengi mesh'in PBR material'ı
   *  kontrol eder. */
  supportsSkinToneOverride?: boolean;
  /** Avatar'ın hangi animation pipeline ile retarget olabileceği. */
  animationCompat: "mixamo" | "custom" | "static";
};

export const CAELINUS_BODY_LIBRARY: BodyEntry[] = [
  {
    id: "selin-v1",
    label: "Selin",
    tagline: "Senin frekansın — gerçek bir bedenden 3D'ye taşınmış mesh",
    url: "/models/selin.glb",
    preview: "/models/previews/selin.png",
    isPersonal: true,
    gender: "feminine",
    vibe: "Auteur — kendi hikâyesini dokuyan",
    baseHeightM: 1.70,
    supportsSkinToneOverride: false,
    animationCompat: "mixamo",
  },
  {
    id: "caelinus-default",
    label: "Caelinus Aslı",
    tagline: "Bald base mesh — boy/kilo/ten rengi tamamen senin elinde",
    url: "/models/caelinus-avatar.glb",
    isDefault: true,
    gender: "neutral",
    vibe: "Saf form — manifestonun başlangıç noktası",
    baseHeightM: 1.70,
    supportsSkinToneOverride: true,
    animationCompat: "mixamo",
  },
  {
    id: "caelinus-textured",
    label: "Caelinus Detaylı",
    tagline: "Texture'lu, daha gerçekçi — orta poly count, hızlı yükleme",
    url: "/models/caelinus-avatar5.glb",
    gender: "feminine",
    vibe: "Tanrıça — derinin nehir gibi aktığı",
    baseHeightM: 1.70,
    supportsSkinToneOverride: false,
    animationCompat: "mixamo",
  },
  {
    id: "caelinus-light",
    label: "Caelinus Hafif",
    tagline: "Düşük poly — mobil + yavaş cihazlar için",
    url: "/models/caelinus-avatar4.glb",
    gender: "neutral",
    vibe: "Heykel — basit, kalıcı, az detayda çok hikâye",
    baseHeightM: 1.70,
    supportsSkinToneOverride: true,
    animationCompat: "mixamo",
  },
  {
    id: "caelinus-hires",
    label: "Caelinus Yüksek",
    tagline: "26MB high-poly — masaüstü + iyi GPU için",
    url: "/models/caelinus-avatar3.glb",
    gender: "feminine",
    vibe: "Ritüel — her dokuda zaman var",
    baseHeightM: 1.70,
    supportsSkinToneOverride: false,
    animationCompat: "mixamo",
  },
  {
    id: "model-texture",
    label: "Model Texture",
    tagline: "PBR texture'lı, sahne-altı denemeler için",
    url: "/models/model_texture.glb",
    gender: "feminine",
    vibe: "Atelier — ölçü prototipinin kendisi",
    baseHeightM: 1.70,
    supportsSkinToneOverride: false,
    animationCompat: "mixamo",
  },
];

export const DEFAULT_BODY_ID = "selin-v1";

export function getBody(id: string | null | undefined): BodyEntry {
  if (!id) {
    return (
      CAELINUS_BODY_LIBRARY.find((b) => b.id === DEFAULT_BODY_ID) ??
      CAELINUS_BODY_LIBRARY[0]
    );
  }
  return (
    CAELINUS_BODY_LIBRARY.find((b) => b.id === id) ??
    CAELINUS_BODY_LIBRARY.find((b) => b.id === DEFAULT_BODY_ID) ??
    CAELINUS_BODY_LIBRARY[0]
  );
}

export function getBodyUrl(id: string | null | undefined): string {
  return getBody(id).url;
}
