/**
 * CAELINUS — District Engine · Kayıt Defteri (tek doğru kaynak)
 *
 * Evrendeki tüm district'ler 8 sütunla burada tanımlıdır. 3B plaza kapıları
 * (`CaelinusUniverseScene`), navigasyon, `DistrictShell`, erişim ve ekonomi
 * katmanları bu kayıttan beslenir. Yeni district eklemek = burada bir kayıt +
 * `app/universe/<key>/` sayfası.
 *
 * NOT: Bu dosya SAF veridir; server-only modül (env, supabase) import ETMEZ.
 * Hem client hem server tarafından güvenle import edilebilir.
 */

import type { District, DistrictKey } from "./types";

export const DISTRICTS: Record<DistrictKey, District> = {
  /* ────────────── SANRI — Bilinç Tapınağı (ilk tam referans) ────────────── */
  sanri: {
    key: "sanri",
    slug: "sanri",
    name: { tr: "SANRI", en: "SANRI" },
    emotion: { tr: "Ay ışığı · gizem · sessizlik", en: "Moonlight · mystery · silence" },
    status: "live",
    route: "/universe/sanri",
    neighbors: ["gaia", "fashion", "avatar"],
    portals: [
      {
        id: "ask",
        title: { tr: "Sanrı'ya Sor", en: "Ask Sanrı" },
        subtitle: { tr: "Bilinç aynası — sezgisel rehber sohbeti", en: "The mirror of consciousness — intuitive guide" },
        href: "/universe/sanri/ask",
        icon: "🪞",
      },
      {
        id: "kod-okuma",
        title: { tr: "Kod Okuma", en: "Code Reading" },
        subtitle: { tr: "Üst bilinç katmanı — kodun ardındaki anlam", en: "The upper-consciousness layer" },
        href: "/universe/sanri/kod-okuma",
        icon: "🜂",
        minTier: "premium",
      },
      {
        id: "ruya",
        title: { tr: "Rüya", en: "Dream" },
        subtitle: { tr: "Sembol, duygu ve rüya yorumu", en: "Symbol, emotion and dream interpretation" },
        href: "/universe/sanri/ruya",
        icon: "🌙",
      },
      {
        id: "sembol",
        title: { tr: "Sembol", en: "Symbol" },
        subtitle: { tr: "Haftalık sembol + metin sembolik analizi", en: "Weekly symbol + symbolic text analysis" },
        href: "/universe/sanri/sembol",
        icon: "✶",
      },
      {
        id: "fal",
        title: { tr: "Fal", en: "Fortune" },
        subtitle: { tr: "Matrix rol + isim numerolojisi okuması", en: "Matrix role + name numerology reading" },
        href: "/universe/sanri/fal",
        icon: "🔮",
      },
    ],
    hero: {
      image: "/universe/sanri/hero.jpg",
      accent: "#c9d4e6",
      glow: "rgba(201, 212, 230, 0.16)",
      symbol: "mirror",
    },
    blender: {
      sceneId: "sanri-temple",
      // glb: "/models/districts/sanri.glb"  // Faz 3b'de üretilince eklenecek
      env: "moonlit-temple",
    },
    ai: {
      provider: "sanri",
      route: "/api/sanri",
    },
    data: {
      source: "external",
      tables: ["users", "memory", "daily_feeling", "subscriptions", "user_entitlements"],
    },
    lore: {
      kicker: "TEMPLE OF CONSCIOUSNESS",
      title: { tr: "Bilinç Tapınağı", en: "Temple of Consciousness" },
      intro: {
        tr: "SANRI ayrı bir ürün değil; Caelinus'un çekirdek bilinç modülü. Kod oku, rüyanı çöz, sembolünü gör, falına bak — hepsi tek aynada.",
        en: "SANRI is not a separate product; it is Caelinus's core consciousness module. Read the code, decode the dream, see the symbol, read the fortune — all in one mirror.",
      },
      mythos: "Ayna, insan kalbinin unuttuğunu hatırlar.",
    },
    economy: {
      provider: "sanri-entitlements",
      products: ["premium_monthly", "premium_yearly", "weekly_pass"],
      entitlements: ["premium_access", "weekly_access"],
    },
    access: {
      minTier: "guest",
      permissions: ["ask", "ruya", "sembol", "fal", "kod-okuma:premium", "matrix-yorum:premium"],
    },
  },

  /* ────────────── GAIA — Toprak Bahçesi ────────────── */
  gaia: {
    key: "gaia",
    slug: "gaia",
    name: { tr: "Gaia", en: "Gaia" },
    emotion: { tr: "Köklülük", en: "Rootedness" },
    status: "live",
    route: "/universe/gaia",
    neighbors: ["sanri", "fashion"],
    portals: [
      {
        id: "plants",
        title: { tr: "Konuşan Bitkiler", en: "Speaking Plants" },
        subtitle: { tr: "Bitki frekansı, besin değeri ve şifa alanı", en: "Plant frequency, nutrition and healing" },
        href: "/universe/gaia/plants",
        icon: "🌸",
      },
      {
        id: "atlas",
        title: { tr: "Toprak Atlası", en: "Soil Atlas" },
        subtitle: { tr: "81 il, 7 bölge, her toprağın bitkileri", en: "81 cities, 7 regions" },
        href: "/universe/gaia/atlas",
        icon: "🜃",
      },
      {
        id: "producers",
        title: { tr: "Üretici Ağı", en: "Producer Network" },
        subtitle: { tr: "Üreticileri ortak pazara bağla", en: "Connect producers to a shared market" },
        href: "/universe/gaia/producers",
        icon: "🌾",
      },
      {
        id: "ai",
        title: { tr: "Bitkini Sor", en: "Ask Your Plant" },
        subtitle: { tr: "Gaia AI — Plant Oracle", en: "Gaia AI — Plant Oracle" },
        href: "/universe/gaia/ai",
        icon: "✨",
      },
    ],
    hero: {
      image: "/universe/gaia-garden.png",
      video: "/universe/gaia-garden.mp4",
      accent: "#79e6a0",
      glow: "rgba(121, 230, 160, 0.14)",
      symbol: "sacred-circle",
    },
    blender: {
      sceneId: "gaia-garden",
      env: "living-garden",
    },
    ai: {
      provider: "caelinus",
      route: "/api/ai/gaia",
      promptId: "gaia",
    },
    data: {
      source: "supabase",
      tables: ["profiles"],
      migration: "supabase/migrations/0001_init.sql",
    },
    lore: {
      kicker: "GAIA'S GARDEN",
      title: { tr: "Toprak Ana'nın Frekans Haritası", en: "The Frequency Map of Mother Earth" },
      intro: {
        tr: "Toprak Ana + üretim rehberi + bilinçli tarım + satış ağı + Caelinus AI danışmanı.",
        en: "Mother Earth + cultivation guide + conscious farming + market network + Caelinus AI.",
      },
      mythos: "Nature remembers what the human heart forgets.",
    },
    economy: { provider: "none" },
    access: {
      minTier: "guest",
      permissions: ["plants", "atlas", "producers", "ai"],
    },
  },

  /* ────────────── FASHION — Bazaar / Mirror Gate ────────────── */
  fashion: {
    key: "fashion",
    slug: "bazaar",
    name: { tr: "Bazaar", en: "Bazaar" },
    emotion: { tr: "Lüks · güzellik · arzu", en: "Luxury · beauty · desire" },
    status: "live",
    route: "/universe/shop",
    neighbors: ["sanri", "gaia", "avatar"],
    portals: [
      {
        id: "stylist",
        title: { tr: "Frekans Stilisti", en: "Frequency Stylist" },
        subtitle: { tr: "Moda AI — kimliğini, frekansını giydir", en: "Fashion AI — dress your frequency" },
        href: "/universe/shop/ai",
        icon: "✦",
      },
      {
        id: "mirror",
        title: { tr: "Aynaya Gir", en: "Enter the Mirror" },
        subtitle: { tr: "Avatar studio — frekans bedenini oluştur", en: "Avatar studio — build your frequency body" },
        href: "/universe/shop/avatar",
        icon: "🪞",
      },
      {
        id: "collection",
        title: { tr: "Koleksiyon", en: "Collection" },
        subtitle: { tr: "Burç koleksiyonu + Caelinus parçaları", en: "Zodiac collection + Caelinus pieces" },
        href: "/universe/shop",
        icon: "👗",
      },
    ],
    hero: {
      image: "/play/shop/leo-look.jpg",
      accent: "#ffe9b8",
      glow: "rgba(255, 233, 184, 0.14)",
      symbol: "star",
    },
    blender: {
      sceneId: "DISTRICT_04_BAZAAR",
      // Faz 6 — ilk canlı 3B district sahnesi (DISTRICT_04_BAZAAR.blend → GLB).
      // NOT: GLB/preview asset'leri henüz public/'a eklenmedi. Dosya yokken
      // useGLTF 404 atıp /universe sahnesini çökertiyordu → asset üretilene
      // kadar yorumda (Sanri gibi). Eklenince bu iki satırı geri aç.
      // glb: "/models/districts/bazaar/bazaar.glb",
      // previewImage: "/models/districts/bazaar/preview.jpg",
      env: "mirror-gate",
      camera: {
        position: [0, 1.6, 7],
        target: [0, 1.2, 0],
        fov: 45,
      },
    },
    ai: {
      provider: "caelinus",
      route: "/api/ai/fashion",
      promptId: "fashion",
    },
    data: {
      source: "supabase",
      tables: ["orders", "carts", "avatars"],
      migration: "supabase/migrations/0001_init.sql",
    },
    lore: {
      kicker: "MIRROR GATE",
      title: { tr: "Frekans Bazaarı", en: "The Frequency Bazaar" },
      intro: {
        tr: "Caelinus aynasında frekans bedenini oluştur; kimliğini giy, aynada dene, Bazaar'a geç.",
        en: "Build your frequency body in the Caelinus mirror; wear your identity, try it on, enter the Bazaar.",
      },
      mythos: "Giysi bir örtü değil; frekansının yüzeyidir.",
    },
    economy: {
      provider: "stripe-caelinus",
      products: ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10", "b11", "b12"],
    },
    access: {
      minTier: "guest",
      permissions: ["stylist", "mirror", "collection", "checkout:member"],
    },
  },

  /* ────────────── AVATAR — Dönüşüm (yakında motora tam taşınır) ────────────── */
  avatar: {
    key: "avatar",
    slug: "avatar",
    name: { tr: "Avatar Studio", en: "Avatar Studio" },
    emotion: { tr: "Dönüşüm", en: "Transformation" },
    status: "soon",
    route: "/avatar",
    neighbors: ["sanri", "fashion"],
    portals: [
      {
        id: "create",
        title: { tr: "Karakter Üretimi", en: "Character Creation" },
        subtitle: { tr: "Selfie'den frekans avatarına", en: "From selfie to frequency avatar" },
        href: "/avatar",
        icon: "🧬",
      },
    ],
    hero: {
      image: "/universe/avatar/hero.jpg",
      accent: "#b69cff",
      glow: "rgba(182, 156, 255, 0.16)",
      symbol: "flame",
    },
    blender: {
      sceneId: "avatar-forge",
      env: "transformation-chamber",
    },
    ai: {
      provider: "caelinus",
      route: "/api/ai/fashion",
    },
    data: {
      source: "supabase",
      tables: ["avatars"],
      migration: "supabase/migrations/0001_init.sql",
    },
    lore: {
      kicker: "DIGITAL TWIN",
      title: { tr: "Dönüşüm Odası", en: "The Transformation Chamber" },
      intro: {
        tr: "Karakter, NPC ve dijital ikiz üretimi — kendini Caelinus evreninin bir bedeninde gör.",
        en: "Character, NPC and digital-twin creation — see yourself as a body of the Caelinus universe.",
      },
    },
    economy: { provider: "none" },
    access: {
      minTier: "member",
      permissions: ["create", "npc", "twin"],
    },
  },
};

/** Tüm district'ler (dizi). */
export const DISTRICT_LIST: District[] = Object.values(DISTRICTS);

/** Sıralı district anahtarları (3B plaza yerleşimi için referans sıra). */
export const DISTRICT_ORDER: DistrictKey[] = ["sanri", "gaia", "fashion", "avatar"];

export function getDistrict(key: DistrictKey): District {
  return DISTRICTS[key];
}

/** Rotaya göre district bul (en uzun eşleşen route). */
export function districtForPath(pathname: string): District | undefined {
  let best: District | undefined;
  for (const d of DISTRICT_LIST) {
    if (pathname === d.route || pathname.startsWith(d.route + "/")) {
      if (!best || d.route.length > best.route.length) best = d;
    }
  }
  return best;
}
