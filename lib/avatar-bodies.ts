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

// NOT: "masculine" (erkek beden / Faz C) kapsam dışı bırakıldı — şimdilik
// iptal. Yeniden ele alınırsa union'a geri eklenir + erkek base body GLB'si
// kütüphaneye girer.
export type BodyGender = "feminine" | "neutral";

export type BodyEntry = {
  /** Stable kimlik — localStorage'a yazılır, hiç değişmemeli. */
  id: string;
  /** UI label (Türkçe). */
  label: string;
  /** Bir-iki cümlelik karakter kısa tanımı. */
  tagline: string;
  /** GLB URL — `/public/models/...` */
  url: string;
  /** Opsiyonel saç GLB — runtime'da body'nin Head bone'una rigid
   *  attach edilir (kafa/animasyon hareketini takip eder). Ayrı dosya
   *  olması saçı değiştirilebilir kılar; spring-bone zinciri ileride
   *  physics için GLB'de korunur. Yoksa saç render edilmez. */
  hairUrl?: string;
  /** Önizleme görseli — yoksa CSS gradient fallback. */
  preview?: string;
  /** Default kimlik — UI'da öne çıkacak. */
  isDefault?: boolean;
  /** Kullanıcının kendisinin önerdiği body — "yeni / seninki" rozeti. */
  isPersonal?: boolean;
  /**
   * Beden hazır giyinik geliyor (örn. muse — saçlı + bikinili catwalk
   * avatarı). Bu bedenlerde try-on garment binding'i ATLANIR; yoksa
   * mesh'in kendi bikinisinin üstüne ikinci bir bikini bind edilir
   * (çift kıyafet çakışması). Işık/aura illüzyon try-on'u yine çalışır.
   */
  preDressed?: boolean;
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
  /**
   * Hangi materyal/render pipeline'ına ait:
   *   • "caelinus" — kendi bedenimiz; runtime ten-tonu + kendi materyal
   *     akışımız uygulanır (varsayılan, alan boşsa bu kabul edilir).
   *   • "external" — dışarıdan gelen/yüklenen avatar (Avaturn, Ready Player
   *     Me, foto-gerçek rig); orijinal materyalleri korunur.
   * Bu ALAN, "kaç mesh var" gibi kırılgan tahminlerin YERİNE geçer — parça
   * (saç / kıyafet / takı) eklendikçe sınıflandırma bozulmaz.
   */
  pipeline?: "caelinus" | "external";
};

/**
 * Caelinus beden kütüphanesi — şu an BOŞ ("avatarlar yapımda").
 *
 * Önceki tüm bedenler (Tanrıça + Selin + varyantlar) hatalı/eksik mesh
 * oldukları için kaldırıldı. Yeni bedenler Şeyma Karaş ile sıfırdan
 * dokunuyor (bkz. docs/avatar-system-and-sema-brief.md). Kütüphane boş
 * olduğu sürece tüm avatar yüzeyleri "Avatarlar yapımda" boş-durumunu
 * gösterir (AVATARS_IN_PRODUCTION).
 *
 * Yeni GLB teslim edildiğinde: dosyayı /public/models/ altına koy, buraya
 * bir BodyEntry ekle, public/avatars/manifest.json'a yansıt — gerisi
 * otomatik açılır.
 */
export const CAELINUS_BODY_LIBRARY: BodyEntry[] = [
  {
    // ── Yeni teslim edilen PBR avatar (caelinusai) — varsayılan beden ──
    // base_basic_pbr.glb: tek mesh, gömülü PBR texture seti
    // (diffuse + metallic/roughness + normal). 1.72 m, Y-up, ayaklar Y=0,
    // X/Z merkezli — runtime center/scale/frame ile mükemmel oturur.
    //
    // ÖNEMLİ: Bu GLB STATIK (skin/rig YOK, animasyon YOK). Bu yüzden:
    //   • pipeline:"external" → ModelAvatar kendi PBR materyallerini KORUR
    //     (ten-tonu override'ı uygulanmaz, foto-gerçek doku bozulmaz).
    //   • supportsSkinToneOverride:false → skin-tone slider no-op.
    //   • animationCompat:"static" → catwalk retarget no-op; avatar
    //     modellendiği pozda durur, wrapper'ın idle nefes/sway'i canlılık verir.
    //   • preDressed:false → base body; try-on garment binding açık kalır.
    id: "caelinus-pbr-v1",
    label: "Caelinus · PBR",
    tagline:
      "caelinusai PBR avatar — gerçek fiziksel-bazlı materyaller, gömülü " +
      "diffuse/metalik/normal doku seti. Yeni varsayılan beden.",
    url: "/models/caelinus-avatar-pbr.glb",
    preview: "/models/previews/caelinus-pbr.png",
    isDefault: true,
    isPersonal: true,
    gender: "feminine",
    vibe: "PBR — ışıkla yıkanan gerçekçi yüzey",
    baseHeightM: 1.72,
    // Kendi PBR doku seti var → ten-tonu override edilmez (doku korunur).
    supportsSkinToneOverride: false,
    animationCompat: "static",
    // Dışarıdan teslim, kendi materyalleriyle korunur.
    pipeline: "external",
  },
  {
    // ── Fallback / karşılaştırma sürümü — shaded (baked emissive) ──
    // base_basic_shaded.glb: tek emissive texture; ışıktan bağımsız sabit
    // görünüm. PBR ile yan yana karşılaştırma için kütüphanede tutulur.
    id: "caelinus-shaded-v1",
    label: "Caelinus · Shaded",
    tagline:
      "caelinusai shaded avatar — baked emissive sürüm; PBR ile " +
      "karşılaştırma/fallback için.",
    url: "/models/caelinus-avatar-shaded.glb",
    preview: "/models/previews/caelinus-shaded.png",
    isPersonal: true,
    gender: "feminine",
    vibe: "Shaded — sabit, ışıktan bağımsız doku",
    baseHeightM: 1.72,
    supportsSkinToneOverride: false,
    animationCompat: "static",
    pipeline: "external",
  },
  // NOT: "Selin" (selin-v1) ve "Caelinus · İlham" (caelinus-muse) bedenleri
  // beden seçiciden kaldırıldı. GLB dosyaları /public/models altında
  // duruyor (diğer sahneler fallback olarak kullanabilir); yalnızca bu
  // kütüphane kaydından çıkarıldılar.
];

/** Kütüphane boşken true — UI 3D yerine "yapımda" placeholder gösterir. */
export const AVATARS_IN_PRODUCTION = CAELINUS_BODY_LIBRARY.length === 0;

export const DEFAULT_BODY_ID = "caelinus-pbr-v1";

/**
 * Kütüphane boşken döndürülen güvenli sentinel — `.url` "" olduğundan
 * hiçbir 3D yüzey gerçek GLB yüklemez (sahne sarmalayıcıları zaten
 * AVATARS_IN_PRODUCTION ile placeholder'a düşer).
 */
const IN_PRODUCTION_BODY: BodyEntry = {
  id: "__in_production__",
  label: "Avatar",
  tagline: "",
  url: "",
  gender: "neutral",
  animationCompat: "static",
};

/**
 * Bir body GLB URL'inden eşleşen saç GLB URL'ini döndürür (yoksa null).
 * ModelAvatar saçı runtime'da Head bone'una bağlamak için kullanır —
 * böylece üç farklı sahne sarmalayıcısı (Configurator / AvatarScene /
 * Caelinus3DScene) ayrı ayrı saç prop'u geçmek zorunda kalmaz; tek
 * kaynak burası.
 */
export function getHairUrlForModelUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const match = CAELINUS_BODY_LIBRARY.find((b) => b.url === url);
  return match?.hairUrl ?? null;
}

/**
 * Bu GLB URL'i bizim kendi Caelinus bedenimiz mi? Kayıt (registry) tek
 * doğruluk kaynağıdır — ModelAvatar bu sayede "kaç skinned mesh var" gibi
 * kırılgan tahminler yerine kesin bilgiyle karar verir. Saç / kıyafet / takı
 * eklendikçe bu sonuç değişmez. Yalnızca `pipeline: "external"` olarak
 * işaretlenmiş kayıtlar dış avatar sayılır (alan boşsa "caelinus" kabul).
 */
export function isCaelinusBodyUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const match = CAELINUS_BODY_LIBRARY.find((b) => b.url === url);
  if (!match) return false;
  return (match.pipeline ?? "caelinus") === "caelinus";
}

export function getBody(id: string | null | undefined): BodyEntry {
  if (CAELINUS_BODY_LIBRARY.length === 0) return IN_PRODUCTION_BODY;
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
