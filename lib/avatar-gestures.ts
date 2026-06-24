/**
 * Caelinus Jest Kütüphanesi — Faz D (animasyon).
 *
 * Avatar'a "doğal" hayat veren in-place hareket kliplerinin tek doğruluk
 * kaynağı. ModelAvatar zaten harici animasyon GLB'sini (`animationUrl`)
 * yükleyip avatar iskeletine retarget ediyor; bu registry hangi jestlerin
 * MEVCUT, hangilerinin BEKLEDIĞINI tanımlar ki UI yalnızca hazır olanları
 * göstersin ve yeni klip teslim edildiğinde tek satır değişiklikle açılsın.
 *
 * Klip sözleşmesi (her gesture GLB'si):
 *   • Mixamo standart bone isimleri (Hips, Spine, … Head, LeftArm…) — retarget
 *     bunlara dayalı. Export'ta `mixamorig:` prefix'ini TEMİZLE.
 *   • IN-PLACE: kök (Hips) ileri locomotion'ı baked OLMAMALI (catwalk hariç) —
 *     avatar olduğu yerde sahnede durur. "In Place" seçeneğiyle indir.
 *   • Tek armature, Y-up, metre ölçek. Klip adı serbest (motor skorlamayla seçer).
 *   • Hedef: ~1–3 sn döngü, ≤150 KB (Mixamo klipleri tipik 100–140 KB).
 *
 * Yeni klip ekleme: GLB'yi /public/models/gestures/ altına koy, aşağıdaki
 * entry'de `status: "available"` yap ve `url`'i ver. Gerisi otomatik.
 */

export type GestureId = "idle" | "catwalk" | "turn" | "pose" | "wave";

export type GestureEntry = {
  /** Stable kimlik. */
  id: GestureId;
  /** UI label (TR). */
  label: string;
  /** Bir cümlelik tanım. */
  tagline: string;
  /** Klip GLB yolu — status "available" ise dolu, "pending" ise null. */
  url: string | null;
  /** Klip hazır mı yoksa üretim bekliyor mu? */
  status: "available" | "pending";
  /** Locomotion ileri taşıyor mu (catwalk) yoksa in-place mi? */
  inPlace: boolean;
  /** UI'da varsayılan/öne çıkan jest. */
  isDefault?: boolean;
};

export const CAELINUS_GESTURES: GestureEntry[] = [
  {
    id: "idle",
    label: "Duruş",
    tagline: "Hafif nefes + doğal bekleme — sahne açılış jesti.",
    // Idle, base body GLB'sine gömülü klip + ModelAvatar'ın nefes/sway
    // useFrame animasyonuyla gelir; harici GLB gerekmez.
    url: null,
    status: "available",
    inPlace: true,
    isDefault: true,
  },
  {
    id: "catwalk",
    label: "Catwalk",
    tagline: "Podyum yürüyüşü — defile sahnesi için locomotion klibi.",
    url: "/models/caelinus-catwalk.glb",
    status: "available",
    inPlace: false,
  },
  {
    id: "turn",
    label: "Dönüş",
    tagline: "360° yavaş dönüş — kıyafeti her açıdan göster.",
    url: null,
    status: "pending",
    inPlace: true,
  },
  {
    id: "pose",
    label: "Poz",
    tagline: "Editoryal duruş — fotoğraf/kapak anı.",
    url: null,
    status: "pending",
    inPlace: true,
  },
  {
    id: "wave",
    label: "Selam",
    tagline: "El sallama — karşılama/onboarding jesti.",
    url: null,
    status: "pending",
    inPlace: true,
  },
];

/** Yalnızca teslim edilmiş (oynatılabilir) jestler. */
export const AVAILABLE_GESTURES = CAELINUS_GESTURES.filter(
  (g) => g.status === "available",
);

export const DEFAULT_GESTURE_ID: GestureId = "idle";

export function getGesture(id: GestureId | null | undefined): GestureEntry {
  return (
    CAELINUS_GESTURES.find((g) => g.id === id) ??
    CAELINUS_GESTURES.find((g) => g.id === DEFAULT_GESTURE_ID) ??
    CAELINUS_GESTURES[0]
  );
}

/** Bir jestin oynatılması için gereken animationUrl (idle → null). */
export function getGestureAnimationUrl(
  id: GestureId | null | undefined,
): string | null {
  const g = getGesture(id);
  return g.status === "available" ? g.url : null;
}
