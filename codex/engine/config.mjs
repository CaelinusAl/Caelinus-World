// CAELINUS CODEX — Living Codex Engine
// config.mjs — source manifest, parsing profiles, taxonomy, entity dictionary
//
// This is the single place that describes the archive. Adding a new Bible =
// adding a `sources` entry (+ optional profile). Everything downstream
// (ingest, entities, analysis, web reader) reads from here.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exists = (p) => { try { return fs.existsSync(p); } catch { return false; } };

export const CODEX_ROOT = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(CODEX_ROOT, 'data');

// PORTABLE paths (handoff-safe). Resolution order:
//   1) env override  2) in-repo codex/sources  3) legacy sibling (codex parent)
// This lets codex/ drop into ANY repo: text sources live in codex/sources/
// (versioned, small); the 132 images stay on a local path (git-ignored, ~330MB).
const LEGACY_ROOT = path.resolve(__dirname, '..', '..');           // parent of /codex (original archive)
const IN_REPO_SOURCES = path.join(CODEX_ROOT, 'sources');

export const SOURCES_DIR =
  process.env.CODEX_SOURCES_DIR ||
  (exists(IN_REPO_SOURCES) ? IN_REPO_SOURCES : LEGACY_ROOT);

// Images stay OUT of git (~330MB). Set CODEX_ASSET_DIR to override on any machine.
const LOCAL_ASSET_FALLBACK = 'C:\\Users\\selin\\OneDrive\\Desktop\\caelinus\\asset';
export const ASSET_DIR =
  process.env.CODEX_ASSET_DIR ||
  (exists(path.join(SOURCES_DIR, 'asset')) ? path.join(SOURCES_DIR, 'asset') :
   exists(path.join(LEGACY_ROOT, 'asset')) ? path.join(LEGACY_ROOT, 'asset') :
   exists(LOCAL_ASSET_FALLBACK) ? LOCAL_ASSET_FALLBACK :
   path.join(CODEX_ROOT, 'assets_local'));

// Kept for provenance/display (rel() base). Points at wherever sources resolve.
export const ARCHIVE_ROOT = SOURCES_DIR;

// ---------------------------------------------------------------------------
// CANONICAL BIBLES — the 16-cilt tree, CANON_MANIFEST v2.0 (Selin-owned).
// Each bible carries a canon id (CN-xx). `hasSource:false` → gap report.
// Section→bible routing: non-profession sources map to `bible`; profession
// sources route each SAYFA to a bible via its CİLT tag (CILT_TO_CANON).
// ---------------------------------------------------------------------------
export const BIBLES = [
  { id: 'CN-00',   title: 'Genesis',                   tr: 'Genesis',                     glyph: '✶', accent: '#e8c37a', order: 0 },
  { id: 'CN-01',   title: 'Founder Vision',            tr: 'Kurucu Vizyonu',              glyph: '⌘', accent: '#d9b86a', order: 1 },
  { id: 'CN-02',   title: 'World Bible',               tr: 'Dünya İncili',                glyph: '◍', accent: '#8fb0c4', order: 2, hasSource: false },
  { id: 'CN-03',   title: 'Living Civilization',       tr: 'Yaşayan Medeniyet',           glyph: '☗', accent: '#cdb892', order: 3 },
  { id: 'CN-04',   title: 'Production Bible',          tr: 'Prodüksiyon İncili',          glyph: '⚙', accent: '#b7c9a8', order: 4 },
  { id: 'CN-04.1', title: 'Production · NPC',          tr: 'Prodüksiyon · NPC',           glyph: '☖', accent: '#c9a0a0', order: 4.1, parent: 'CN-04' },
  { id: 'CN-04.2', title: 'Production · Engineering',  tr: 'Prodüksiyon · Mühendislik',   glyph: '⚙', accent: '#b7c9a8', order: 4.2, parent: 'CN-04' },
  { id: 'CN-04.3', title: 'Production · Gameplay',     tr: 'Prodüksiyon · Oynanış',       glyph: '◐', accent: '#b7c9a8', order: 4.3, parent: 'CN-04', hasSource: false },
  { id: 'CN-04.4', title: 'Production · Environment',  tr: 'Prodüksiyon · Çevre',         glyph: '❧', accent: '#9fb98a', order: 4.4, parent: 'CN-04' },
  { id: 'CN-04.5', title: 'Production · AI',           tr: 'Prodüksiyon · AI',            glyph: '◈', accent: '#c9a0a0', order: 4.5, parent: 'CN-04' },
  { id: 'CN-05',   title: 'Economy Bible',             tr: 'Ekonomi İncili',              glyph: '⚖', accent: '#e0b57a', order: 5, hasSource: false },
  { id: 'CN-06',   title: 'Architecture Bible',        tr: 'Mimari İncili',               glyph: '⌂', accent: '#c8b28c', order: 6, hasSource: false },
  { id: 'CN-07',   title: 'Mastery Bible',             tr: 'Ustalık İncili',              glyph: '✦', accent: '#f0d189', order: 7 },
  { id: 'CN-08',   title: 'Civilization Design Bible', tr: 'Medeniyet Tasarımı İncili',   glyph: '☉', accent: '#e8c37a', order: 8 },
  { id: 'CN-09',   title: 'Art Direction Bible',       tr: 'Sanat Yönetimi İncili',       glyph: '☀', accent: '#f0d189', order: 9 },
  { id: 'CN-10',   title: 'Audio Bible',               tr: 'Ses İncili',                  glyph: '♪', accent: '#a9c0b0', order: 10, hasSource: false },
  { id: 'CN-11',   title: 'Cinematic Bible',           tr: 'Sinematik İncil',             glyph: '❉', accent: '#d9b86a', order: 11, hasSource: false },
  { id: 'CN-12',   title: 'UI/UX Codex',               tr: 'UI/UX Kodeksi',               glyph: '▤', accent: '#8fb0c4', order: 12, hasSource: false },
  { id: 'CN-13',   title: 'Unreal Implementation',     tr: 'Unreal Uygulama',             glyph: '◮', accent: '#9aa6b8', order: 13, hasSource: false },
  { id: 'CN-14',   title: 'Historical Bible',          tr: 'Tarih İncili',                glyph: '☾', accent: '#c8b28c', order: 14, hasSource: false },
  { id: 'CN-15',   title: 'Canon Decisions',           tr: 'Kanon Kararları',             glyph: '⧉', accent: '#cdb892', order: 15, hasSource: false },
];

// CİLT etiketi → hangi canon bible'a düşer (Selin kararı, CANON_MANIFEST §2)
export const CILT_TO_CANON = {
  'NPC BIBLE': 'CN-04.1',
  'ENGINEERING BIBLE': 'CN-04.2',
  'CIVILIZATION DESIGN BIBLE': 'CN-08',
  'USTALIK SİSTEMLERİ': 'CN-07',
};

// ---------------------------------------------------------------------------
// SOURCES — each text file, its owning bible, and its parse profile.
// Markers below were verified directly against the archive files.
// ---------------------------------------------------------------------------
// Shared professions profile — markers accept BOTH "CİLT/MESLEK/SAYFA" (banner,
// uppercase) and "Cilt/Meslek/Sayfa" (title-case, real headings). This fixes the
// C1 defect where the Çiftçi file's title-case markers were missed.
const PROFESSIONS_PROFILE = {
  subVolumeMarker:  { re: /^(?:CİLT|Cilt)\s+(\d+)\s*[—-]\s*(.+)$/,  num: 1, title: 2 },
  professionMarker: { re: /^(?:MESLEK|Meslek)\s+(\d+)\s*[—-]\s*(.+)$/, num: 1, title: 2 },
  sectionMarkers: [
    { re: /^(?:SAYFA|Sayfa)\s+(\d+)\s*[—-]\s*(.+)$/, kind: 'page', num: 1, title: 2 },
  ],
  noise: [/^CAELINUS PRODUCTION BIBLE$/i, /^(?:MESLEK|Meslek)\s+\d+\s*[—-]/, /^(?:CİLT|Cilt)\s+\d+\s*[—-]/],
  routeByCilt: true,
};

export const SOURCES = [
  {
    id: 'genesis',
    bible: 'CN-00',
    file: 'CAELINUS-genesis.txt',
    volumeTitle: 'Genesis — 2036 Vizyonu',
    // Genesis mixes a slide deck, numbered BÖLÜM chapters, and repeated
    // PROJECT GENESIS essays. Any of these starts a new section.
    profile: {
      sectionMarkers: [
        { re: /^Slayt\s+(\d+)\s*[—-]\s*(.+)$/,  kind: 'slide',   num: 1, title: 2 },
        { re: /^BÖLÜM\s+(\d+)\s*[—-]\s*(.+)$/i,  kind: 'chapter', num: 1, title: 2 },
        { re: /^PROJECT GENESIS$/,               kind: 'essay',   titleFromNextCaps: true },
      ],
      // running-header / repeated lines to drop (also fed to duplicate detector)
      noise: [/^CAELINUS$/, /^PROJECT GENESIS$/],
    },
  },
  {
    id: 'founder',
    bible: 'CN-01',
    file: 'FOUNDER DATA ROOM.txt',
    volumeTitle: 'Kurucu Odası & Ahit',
    profile: {
      sectionMarkers: [
        { re: /^DOSYA\s+(\d+)$/,                 kind: 'file',    num: 1, titleFromNextCaps: true },
        { re: /^(THE ONE LAW|THE FOUNDER LETTER|THE COVENANT|KURUCU ANDI|KURUCUNUN SON SÖZÜ)$/, kind: 'charter', title: 1 },
      ],
      noise: [/^CAELINUS$/],
    },
  },
  {
    id: 'art',
    bible: 'CN-09',
    file: 'CAELINUS ART BIBLE 001.txt',
    volumeTitle: 'Sanat İncili — Işığın Dili',
    profile: {
      sectionMarkers: [
        { re: /^(\d+)\.\s+([A-ZÇĞİÖŞÜ].{0,40})$/, kind: 'principle', num: 1, title: 2 },
        { re: /^(AURA'NIN BÜYÜK FİKRİ)$/,          kind: 'principle', title: 1 },
      ],
      noise: [],
    },
  },
  {
    // C1 FIX: this file is actually MESLEK 09 — ÇİFTÇİ with "Cilt 1 — NPC BIBLE"
    // + "CİLT 2 — ENGINEERING BIBLE". Parsed with the professions profile; each
    // SAYFA routes to its canon bible by cilt. Roster home = CN-03.
    id: 'ciftci',
    bible: 'CN-03',
    file: 'CAELINUS PRODUCTION BIBLE.txt',
    volumeTitle: 'Çiftçi — MESLEK 09',
    profile: PROFESSIONS_PROFILE,
  },
  {
    id: 'firinci',
    bible: 'CN-03',
    file: 'CAELINUS PRODUCTION BIBLE-MESLEKLER.txt',
    volumeTitle: 'Fırıncı — MESLEK 10',
    profile: PROFESSIONS_PROFILE,
  },
];

// ---------------------------------------------------------------------------
// ENTITY DICTIONARY — the vocabulary of Caelinus.
// Each entity: canonical id, display label (TR), type, and aliases/surface
// forms searched (case-insensitive, diacritic-aware) across every section.
// The web reader turns these into clickable cross-links.
// ---------------------------------------------------------------------------
export const ENTITY_TYPES = {
  profession: { tr: 'Meslek',   en: 'Profession', color: '#cdb892' },
  material:   { tr: 'Ürün',     en: 'Material',   color: '#e0b externally' },
  place:      { tr: 'Yer',      en: 'Place',      color: '#8fb0c4' },
  system:     { tr: 'Sistem',   en: 'System',     color: '#b7c9a8' },
  pillar:     { tr: 'İlke',     en: 'Pillar',     color: '#f0d189' },
};
// fix stray token above
ENTITY_TYPES.material.color = '#e0b57a';

export const ENTITIES = [
  // — Professions —
  { id: 'ciftci',    label: 'Çiftçi',       type: 'profession', aliases: ['çiftçi', 'çiftçiler'] },
  { id: 'firinci',   label: 'Fırıncı',      type: 'profession', aliases: ['fırıncı', 'fırıncılar', 'fırın'] },
  { id: 'dokumaci',  label: 'Dokumacı',     type: 'profession', aliases: ['dokumacı', 'dokuma'] },
  { id: 'terzi',     label: 'Terzi',        type: 'profession', aliases: ['terzi'] },
  { id: 'bakirci',   label: 'Bakır Ustası', type: 'profession', aliases: ['bakır ustası', 'bakırcı', 'bakır'] },
  { id: 'muzisyen',  label: 'Müzisyen',     type: 'profession', aliases: ['müzisyen', 'müzik ustası'] },
  { id: 'usta',      label: 'Usta',         type: 'profession', aliases: ['usta', 'ustalık'] },
  { id: 'cirak',     label: 'Çırak',        type: 'profession', aliases: ['çırak', 'çıraklık', 'apprentice'] },
  { id: 'esnaf',     label: 'Esnaf',        type: 'profession', aliases: ['esnaf'] },

  // — Materials / products —
  { id: 'pamuk',     label: 'Pamuk',        type: 'material', aliases: ['pamuk'] },
  { id: 'bugday',    label: 'Buğday',       type: 'material', aliases: ['buğday', 'tahıl', 'grain'] },
  { id: 'ekmek',     label: 'Ekmek',        type: 'material', aliases: ['ekmek', 'bread'] },
  { id: 'zeytin',    label: 'Zeytin',       type: 'material', aliases: ['zeytin ağacı', 'zeytin'] },
  { id: 'zeytinyagi',label: 'Zeytinyağı',   type: 'material', aliases: ['zeytinyağı'] },
  { id: 'un',        label: 'Un',           type: 'material', aliases: [' un ', 'değirmen', 'mill'] },
  { id: 'tohum',     label: 'Tohum',        type: 'material', aliases: ['tohum', 'seed'] },

  // — Places —
  { id: 'adana',     label: 'Adana',        type: 'place', aliases: ['adana'] },
  { id: 'seyhan',    label: 'Seyhan',       type: 'place', aliases: ['seyhan'] },
  { id: 'konya',     label: 'Konya',        type: 'place', aliases: ['konya'] },
  { id: 'izmir',     label: 'İzmir',        type: 'place', aliases: ['izmir'] },
  { id: 'trabzon',   label: 'Trabzon',      type: 'place', aliases: ['trabzon'] },
  { id: 'anadolu',   label: 'Anadolu',      type: 'place', aliases: ['anadolu', 'anatolia'] },
  { id: 'iller81',   label: '81 İl',        type: 'place', aliases: ['81 il', '81 şehir', 'seksen bir'] },

  // — Systems —
  { id: 'toprak',    label: 'Toprak',       type: 'system', aliases: ['toprak', 'soil'] },
  { id: 'iklim',     label: 'İklim',        type: 'system', aliases: ['iklim', 'climate', 'hava'] },
  { id: 'pazar',     label: 'Pazar',        type: 'system', aliases: ['pazar', 'market'] },
  { id: 'festival',  label: 'Festival',     type: 'system', aliases: ['festival', 'şenlik'] },
  { id: 'ekonomi',   label: 'Ekonomi',      type: 'system', aliases: ['ekonomi', 'economy'] },
  { id: 'npc',       label: 'NPC / Komşu',  type: 'system', aliases: ['npc', 'komşu'] },
  { id: 'hafiza',    label: 'Hafıza',       type: 'system', aliases: ['hafıza', 'memory', 'anı'] },
  { id: 'bitki',     label: 'Bitki / DNA',  type: 'system', aliases: ['bitki', 'plant', 'dna'] },

  // — Pillars (founding principles / motifs) —
  { id: 'isik',      label: 'Işık',         type: 'pillar', aliases: ['altın saat', 'altın ışık', 'ışığın dili', 'ışık'] },
  { id: 'yasamagaci',label: 'Yaşam Ağacı',  type: 'pillar', aliases: ['yaşam ağacı', 'hayat ağacı'] },
  { id: 'onelaw',    label: 'The One Law',  type: 'pillar', aliases: ['the one law', 'tek yasa'] },
  { id: 'ilknefes',  label: 'İlk Nefes',    type: 'pillar', aliases: ['ilk nefes', 'first breath'] },
  { id: 'ait',       label: 'Ait Olma',     type: 'pillar', aliases: ['ait ol', 'aidiyet', 'evimde'] },
  { id: 'digitaltwin',label: 'Dijital İkiz',type: 'pillar', aliases: ['dijital ikiz', 'digital twin', 'yaşayan dijital'] },
];

// ---------------------------------------------------------------------------
// CANONICAL CHAINS — hand-authored relationship spines (the "Pamuk → Çiftçi →
// Dokumacı → …" example from the Genesis Directive). These are drawn as the
// backbone of the relationship graph, on top of auto-detected co-occurrence.
// ---------------------------------------------------------------------------
export const CHAINS = [
  {
    id: 'pamuk-zinciri',
    label: 'Pamuk → Ekonomi',
    steps: ['pamuk', 'ciftci', 'dokumaci', 'terzi', 'pazar', 'festival', 'ekonomi', 'anadolu'],
  },
  {
    id: 'ekmek-zinciri',
    label: 'Buğday → Medeniyet',
    steps: ['tohum', 'bugday', 'ciftci', 'un', 'firinci', 'ekmek', 'pazar', 'festival'],
  },
  {
    id: 'zeytin-zinciri',
    label: 'Zeytin → Yaşam Ağacı',
    steps: ['zeytin', 'zeytinyagi', 'ciftci', 'toprak', 'yasamagaci', 'anadolu'],
  },
  {
    id: 'ilk-nefes-zinciri',
    label: 'İlk Nefes → Aidiyet',
    steps: ['ilknefes', 'adana', 'isik', 'hafiza', 'ait', 'digitaltwin'],
  },
];
