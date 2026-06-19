/**
 * CAELINUS — District Engine · Sözleşme (contract)
 *
 * Bir district bir sayfa değil; Caelinus evreninin yaşayan bir modülüdür.
 * Her district SEKİZ sütunu doldurmak zorundadır:
 *
 *   1. Hero        — kimlik görseli + imza renk/glow/sembol
 *   2. Blender     — district'e özel 3B sahne (GLB) + kapı modeli
 *   3. AI          — district'in asistanı (caelinus | sanri sağlayıcı)
 *   4. Data        — veri şeması kaynağı (supabase | external) + tablolar
 *   5. Route       — kanonik rota + alt portallar (gezinti)
 *   6. Lore        — anlatı / mitos (kicker, başlık, giriş)
 *   7. Economy     — ekonomi katmanı (entitlement / ürün sağlayıcı)
 *   8. Access      — üyelik izinleri (minimum tier + permissions)
 *
 * Bu tek tip; `lib/district/registry.ts` tek doğru kaynaktır. 3B kapılar,
 * navigasyon, kabuk (DistrictShell), erişim ve ekonomi hep buradan beslenir.
 */

import type { IconName } from "@/components/icons";

export type Bilingual = { tr: string; en: string };

/** Evrendeki district anahtarları. Yeni district = burada + registry. */
export type DistrictKey = "sanri" | "gaia" | "fashion" | "avatar";

/** Üyelik seviyeleri — erişim kapıları bunu kullanır. */
export type Tier = "guest" | "member" | "premium";

/** AI asistanın nereden beslendiği. */
export type AIProvider = "caelinus" | "sanri";

/** Veri şemasının sahibi. */
export type DataSource = "supabase" | "external";

/** Ekonomi sağlayıcısı. */
export type EconomyProvider = "stripe-caelinus" | "sanri-entitlements" | "none";

export type DistrictPortal = {
  id: string;
  title: Bilingual;
  subtitle?: Bilingual;
  href: string;
  /** Kart ikonu (emoji veya glyph). */
  icon: string;
  /** Bu portala girmek için gereken minimum tier (yoksa district minTier'ı). */
  minTier?: Tier;
};

/** 1) Hero — kimlik görseli + imza estetiği. */
export type DistrictHero = {
  /** Statik hero görseli (public/ altında). */
  image: string;
  /** Opsiyonel arka plan videosu. */
  video?: string;
  /** İmza aksan rengi (hex). */
  accent: string;
  /** Ambient glow için rgba. */
  glow: string;
  /** İkon ailesinden sembol. */
  symbol: IconName;
};

/**
 * 3B kamera kurulumu — başlangıç bakışı. Faz 1: tek sabit kamera + orbit.
 * `target` boşsa sahne merkezine bakılır.
 */
export type DistrictCamera = {
  /** Başlangıç kamera konumu (dünya birimi). */
  position: [number, number, number];
  /** Bakış hedefi (orbit pivotu). */
  target?: [number, number, number];
  /** Görüş açısı (derece). */
  fov?: number;
};

/* ───────────── Gelecek sahne katmanları (Faz 1'de OKUNMAZ) ─────────────
 * Aşağıdaki tipler `DistrictBlenderScene` motorunun yol haritasıdır. Hepsi
 * opsiyoneldir; tanımlanmadıkça motor onları render etmez. Bir district'in
 * .blend → .glb sahnesi zenginleştikçe bu alanlar doldurulur ve motora ilgili
 * katman eklenir (sözleşme kırılmadan). */

/** Kamera yolu — sinematik flythrough / rota (gelecek). */
export type DistrictCameraPath = {
  id: string;
  /** Sıralı kamera anahtar kareleri. */
  keyframes: { position: [number, number, number]; target: [number, number, number]; t: number }[];
  loop?: boolean;
};

/** 3B portal bölgesi — sahne içinde başka bir district'e/portala geçiş alanı (gelecek). */
export type DistrictPortalZone = {
  id: string;
  /** Sahnedeki tetik konumu. */
  position: [number, number, number];
  radius?: number;
  /** Gidilecek rota ya da komşu district anahtarı. */
  href: string;
};

/** NPC / hologram yerleşim noktası (gelecek). */
export type DistrictNpcPoint = {
  id: string;
  position: [number, number, number];
  /** NPC/asset kimliği (ayrı registry'den çözülür). */
  ref: string;
};

/** Enerji nehri / akış çizgisi (gelecek). */
export type DistrictEnergyRiver = {
  id: string;
  points: [number, number, number][];
  color?: string;
};

/** Atmosfer preset'i — sis, ton, bloom, gökyüzü (gelecek). */
export type DistrictAtmosphere = {
  /** HDRI/ortam adı veya preset anahtarı. */
  env?: string;
  fog?: { color: string; near: number; far: number };
  bloom?: number;
  background?: string;
};

/** Ses katmanı — ambiyans / bölgesel ses (gelecek). */
export type DistrictAudioLayer = {
  id: string;
  src: string;
  /** Konumsal ses ise kaynak noktası. */
  position?: [number, number, number];
  volume?: number;
  loop?: boolean;
};

/**
 * 2) Blender — district'e özel YAŞAYAN 3B sahne sözleşmesi.
 *
 * Bu bir "GLB viewer" yapılandırması değil; zamanla katmanlanacak bir district
 * motorunun tanımıdır. FAZ 1'de motor yalnızca `glb` + `camera` + `env`/atmosfer
 * temelini okur; `previewImage` yüklenirken poster olarak gösterilir. Diğer tüm
 * alanlar gelecekte devreye girer ve tanımlı değilse render edilmez.
 */
export type DistrictBlender = {
  /** Blender kaynak sahne kimliği (blender/districts/<sceneId>.blend). */
  sceneId: string;
  /** Export edilmiş GLB yolu (public/models/districts/<slug>/<slug>.glb). Yoksa placeholder. */
  glb?: string;
  /** Opsiyonel HDRI/ortam adı (kısayol; ya da `atmosphere.env`). */
  env?: string;
  /** Yüklenirken gösterilecek poster/önizleme görseli. */
  previewImage?: string;
  /** Faz 1: başlangıç kamerası (orbit pivotu + fov). */
  camera?: DistrictCamera;

  /* ── Gelecek katmanlar (Faz 1'de motor tarafından OKUNMAZ) ── */
  cameraPaths?: DistrictCameraPath[];
  portalZones?: DistrictPortalZone[];
  npcs?: DistrictNpcPoint[];
  energyRivers?: DistrictEnergyRiver[];
  atmosphere?: DistrictAtmosphere;
  audioLayers?: DistrictAudioLayer[];
};

/** 3) AI asistan. */
export type DistrictAI = {
  provider: AIProvider;
  /** İstek yapılan rota (caelinus: /api/ai/*, sanri: /api/sanri/*). */
  route: string;
  /** Caelinus sağlayıcısında system prompt kimliği. */
  promptId?: string;
};

/** 4) Veri şeması. */
export type DistrictData = {
  source: DataSource;
  /** İlgili tablo adları (supabase ya da external Postgres). */
  tables?: string[];
  /** supabase kaynağında migration dosyası. */
  migration?: string;
};

/** 6) Lore — anlatı. */
export type DistrictLore = {
  kicker: string;
  title: Bilingual;
  intro: Bilingual;
  mythos?: string;
};

/** 7) Ekonomi. */
export type DistrictEconomy = {
  provider: EconomyProvider;
  /** Caelinus ürün id'leri ya da Sanri product key'leri. */
  products?: string[];
  /** Premium kapıları açan entitlement anahtarları. */
  entitlements?: string[];
};

/** 8) Erişim / üyelik. */
export type DistrictAccess = {
  /** District'e girmek için gereken minimum tier. */
  minTier: Tier;
  /** District içi yetenek izinleri (örn. "kod-okuma", "matrix-yorum"). */
  permissions: string[];
};

/** Bir district'in tam tanımı — 8 sütun. */
export type District = {
  key: DistrictKey;
  /** URL/klasör/asset dostu kısa ad (örn. "bazaar"). Asset yolları bunu kullanır. */
  slug: string;
  name: Bilingual;
  /** Tek kelimelik duygu/ton (3B kapı altında ve kabukta gösterilir). */
  emotion: Bilingual;
  /** Yayında mı, yoksa "yakında" mı. */
  status: "live" | "soon";
  /** Kanonik rota. */
  route: string;
  /** Evren grafında komşu district'ler (3B navigasyon/portal için). */
  neighbors?: DistrictKey[];
  /** Alt portallar (gezinti). */
  portals: DistrictPortal[];

  hero: DistrictHero;
  blender: DistrictBlender;
  ai: DistrictAI;
  data: DistrictData;
  lore: DistrictLore;
  economy: DistrictEconomy;
  access: DistrictAccess;
};
