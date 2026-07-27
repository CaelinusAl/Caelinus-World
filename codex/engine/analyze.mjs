// CAELINUS CODEX — analyze.mjs
// Three responsibilities:
//   1. Image manifest  — scan asset/, create UNANALYZED slots that later
//      AI-Vision passes will fill (multi-category, cross-bible ready).
//   2. Duplicate report — near-identical sections/paragraphs across the corpus.
//   3. Gap report       — declared bibles/pages that are missing or thin.

import fs from 'node:fs';
import path from 'node:path';
import { ASSET_DIR, BIBLES } from './config.mjs';

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

// ---- 1. IMAGE MANIFEST -----------------------------------------------------
export function buildImageManifest() {
  let files = [];
  try { files = fs.readdirSync(ASSET_DIR); } catch { files = []; }
  const images = files
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f, i) => {
      const st = fs.statSync(path.join(ASSET_DIR, f));
      return {
        id: 'img-' + String(i + 1).padStart(3, '0'),
        file: f,
        path: '/asset/' + encodeURIComponent(f),  // absolute from server root (ARCHIVE_ROOT)
        bytes: st.size,
        // ---- slots filled by a later AI-Vision pass ----
        status: 'unanalyzed',            // unanalyzed → analyzed → verified
        title: null,
        description: null,               // TR caption
        keywords: [],                    // auto keywords
        bibles: [],                      // one image can belong to many bibles
        volume: null,                    // primary placement (e.g. production)
        entities: [],                    // linked entity ids (cross-links)
        npc: null,                       // linked NPC, when applicable
        relations: [],                   // free-form relationship notes
      };
    });
  return {
    generatedAt: null, // stamped by build.mjs (Date.now unavailable in some sandboxes)
    total: images.length,
    analyzed: 0,
    note: 'Görseller Production Bible\'ın sayfalarıdır. Bu manifesto, sonraki AI-Vision geçişinin dolduracağı boş slotları tutar.',
    images,
  };
}

// ---- 2. DUPLICATE DETECTION ------------------------------------------------
// Signature = folded, normalized first ~200 chars. Sections sharing a signature
// (or a repeated exact paragraph) are flagged for the "merge" workflow.
const fold = (s) =>
  s.toLocaleLowerCase('tr').replace(/\s+/g, ' ').replace(/[^a-zçğıöşü0-9 ]/gi, '').trim();

export function buildDuplicateReport(volumes) {
  const bySig = new Map();
  for (const vol of volumes) {
    for (const sec of vol.sections) {
      const sig = fold(sec.text).slice(0, 200);
      if (sig.length < 40) continue;
      if (!bySig.has(sig)) bySig.set(sig, []);
      bySig.get(sig).push({ volume: vol.volumeTitle, bible: vol.bible, sectionId: sec.id, title: sec.title });
    }
  }
  const duplicates = [...bySig.values()].filter((g) => g.length > 1)
    .map((g) => ({ count: g.length, members: g }));

  // Repeated exact paragraphs (>= 8 words) appearing in 3+ sections = boilerplate.
  const paraCount = new Map();
  for (const vol of volumes) {
    for (const sec of vol.sections) {
      const seen = new Set();
      for (const b of sec.blocks) {
        for (const para of b.text.split(/\n{2,}/)) {
          const f = fold(para);
          if (f.split(' ').length < 8) continue;
          if (seen.has(f)) continue; seen.add(f);
          paraCount.set(f, (paraCount.get(f) || 0) + 1);
        }
      }
    }
  }
  const boilerplate = [...paraCount.entries()].filter(([, c]) => c >= 3)
    .map(([f, c]) => ({ count: c, sample: f.slice(0, 120) }))
    .sort((a, b) => b.count - a.count).slice(0, 25);

  return { duplicates, boilerplate };
}

// ---- 3. GAP REPORT (canon v2.0) --------------------------------------------
export function buildGapReport(volumes, bibles) {
  const gaps = [];

  // Container bibles (roster / parents) aren't "missing" if descendants have content
  const CONTAINERS = new Set(['CN-03', 'CN-04']);
  const childContent = (id) => bibles.some((b) => b.parent === id && b.sectionCount > 0);

  for (const b of bibles) {
    if (b.parent) continue;                       // leaves handled below
    if (CONTAINERS.has(b.id)) {
      if (b.id === 'CN-04' && !childContent('CN-04'))
        gaps.push({ severity: 'missing', bible: b.id, title: b.title, note: 'Alt-ciltlerde içerik yok.' });
      continue;                                    // CN-03 roster & filled CN-04 skip
    }
    if (b.sectionCount === 0) gaps.push({ severity: 'missing', bible: b.id, title: b.title,
      note: b.note || 'Kanonda tanımlı, henüz içerik yok.' });
  }
  for (const b of bibles) { // empty production children
    if (b.parent && b.sectionCount === 0) gaps.push({ severity: 'missing', bible: b.id, title: b.title,
      note: b.note || 'Alt-cilt boş.' });
  }

  // Per-profession page holes (SAYFA numbering)
  const pagesByProf = {};
  for (const v of volumes) for (const s of v.sections)
    if (s.kind === 'page' && s.num != null && s.profession) (pagesByProf[s.profession] ||= []).push(s.num);
  for (const [prof, nums] of Object.entries(pagesByProf)) {
    const pages = [...new Set(nums)].sort((a, b) => a - b);
    const max = pages[pages.length - 1]; const present = new Set(pages);
    const holes = []; for (let i = 1; i <= max; i++) if (!present.has(i)) holes.push(i);
    gaps.push({ severity: 'partial', bible: 'CN-03', title: `Meslek: ${prof}`,
      note: `${pages.length}/${max} sayfa yazılı, ${holes.length} boş.`,
      detail: { profession: prof, pagesPresent: pages.length, pagesMax: max,
        missingPageCount: holes.length, missingPagesSample: holes.slice(0, 24) } });
  }

  // Thin bibles (has content but < 3)
  for (const b of bibles) if (b.sectionCount > 0 && b.sectionCount < 3)
    gaps.push({ severity: 'thin', bible: b.id, title: b.title,
      note: `Yalnızca ${b.sectionCount} bölüm — genişletilebilir.` });

  return { gaps };
}
