// CAELINUS CODEX — build.mjs
// Orchestrates the Living Codex Engine → /codex/data/*.json.
// Canon v2.0: sections group into the 16-cilt tree (uniform Bible template).
//   node engine/build.mjs

import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, CODEX_ROOT, BIBLES, SOURCES } from './config.mjs';
import { ingestAll } from './ingest.mjs';
import { buildEntityGraph } from './entities.mjs';
import { buildImageManifest, buildDuplicateReport, buildGapReport } from './analyze.mjs';

const stamp = () => { try { return new Date().toISOString(); } catch { return null; } };
const write = (name, obj) => { fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(obj, null, 2), 'utf8'); };

// canon status (authoritative) from the manifest mirror
const canon = JSON.parse(fs.readFileSync(path.join(CODEX_ROOT, 'canon', 'canon.json'), 'utf8'));
const canonStatus = {}; const canonNote = {};
for (const b of canon.bibles) { canonStatus[b.id] = b.status; canonNote[b.id] = b.note || '';
  for (const c of (b.children || [])) { canonStatus[c.id] = c.status; } }

console.log('CAELINUS CODEX — building (canon v2.0)…\n');

// 1. Ingest → volumes (by source); entities annotate sections
const volumes = ingestAll();
for (const v of volumes) console.log(`  ✓ ${v.file.padEnd(42)} → ${v.sectionCount} sections`);
const graph = buildEntityGraph(volumes);
console.log(`\n  ✓ entities: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

// 2. Flatten sections, tag provenance
const allSections = [];
for (const v of volumes) for (const s of v.sections)
  allSections.push({ ...s, sourceId: v.id, sourceFile: v.file, sourceBible: v.bible });

// 3. Group into the 16-cilt uniform template by canonBible
const bibles = BIBLES.map((b) => {
  const secs = allSections.filter((s) => s.canonBible === b.id)
    .sort((x, y) => (x.profession || '').localeCompare(y.profession || '') || (x.num ?? x.seq) - (y.num ?? y.seq));
  const sources = [...new Set(secs.map((s) => s.sourceFile))];
  const subVolumes = [...new Set(secs.map((s) => s.subVolume).filter(Boolean))];
  const professions = [...new Set(secs.map((s) => s.profession).filter(Boolean))];
  return {
    id: b.id, title: b.title, tr: b.tr, glyph: b.glyph, accent: b.accent,
    order: b.order, parent: b.parent || null,
    status: canonStatus[b.id] || (secs.length ? 'PARTIAL' : 'MISSING'),
    note: canonNote[b.id] || '',
    hasSource: secs.length > 0,
    sources, subVolumes, professions,
    sectionCount: secs.length,
    sections: secs,   // uniform: every bible carries its own sections
  };
});

// 4. Images + analysis
const images = buildImageManifest(); images.generatedAt = stamp();
const dupes = buildDuplicateReport(volumes);
const gaps = buildGapReport(volumes, bibles);
console.log(`  ✓ images: ${images.total} indexed slots`);
console.log(`  ✓ bibles: ${bibles.length} (${bibles.filter(b=>b.hasSource).length} with content)`);
console.log(`  ✓ gaps: ${gaps.gaps.length} · duplicates: ${dupes.duplicates.length}`);

// 5. Master codex.json
const codex = {
  meta: {
    name: 'CAELINUS CODEX', subtitle: 'The Living Digital Twin of Türkiye — Knowledge Archive',
    canonVersion: '2.0', generatedAt: stamp(),
    bibleCount: bibles.length, sourceCount: SOURCES.length,
    sectionCount: allSections.length, imageCount: images.total, entityCount: graph.nodes.length,
  },
  bibles,        // 16-cilt uniform template, each with .sections
  volumes,       // provenance (by source) — used by audit/relmap
  graph,
};
write('codex.json', codex);
write('images.json', images);
write('report.json', { duplicates: dupes, gaps, meta: { generatedAt: stamp() } });

const kb = (fs.statSync(path.join(DATA_DIR, 'codex.json')).size / 1024).toFixed(0);
console.log(`\n  ✓ wrote data/codex.json (${kb} KB), images.json, report.json`);
console.log('\nCODEX BUILD COMPLETE.');
