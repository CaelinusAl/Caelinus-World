// CAELINUS CODEX — relmap.mjs  (MASTER RELATION MAP)
// "Bütün Caelinus'u tek grafik olarak gör." Horizontal production chains ×
// vertical aspect layers (Gameplay/Quest/NPC/Animation/Sound/ConceptArt/
// ImageVault/ProductionPage/UnrealAsset). Grounded in codex.json; honest about
// which layers have data and which are gaps. READ-ONLY.
//   node codex/engine/relmap.mjs

import fs from 'node:fs';
import path from 'node:path';
import { ARCHIVE_ROOT, CODEX_ROOT, DATA_DIR, SOURCES } from './config.mjs';

const OUT = path.join(CODEX_ROOT, 'canon');
fs.mkdirSync(OUT, { recursive: true });
const rel = (p) => path.relative(ARCHIVE_ROOT, p).replace(/\\/g, '/');
const codex = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'codex.json'), 'utf8'));
const images = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'images.json'), 'utf8'));

const foldTR = (x) => x.toLocaleLowerCase('tr')
  .replace(/[çğıöşü]/g, c => ({ ç:'c', ğ:'g', ı:'i', ö:'o', ş:'s', ü:'u' }[c])).replace(/i̇/g,'i');
const raw = {}; for (const s of SOURCES) raw[s.file] = foldTR(fs.readFileSync(path.join(ARCHIVE_ROOT, s.file), 'utf8'));
// word-boundary count (consistent with audit.mjs) → avoids substring false positives (Han⊄hane)
function probeCount(term){ const n=foldTR(term); let c=0;
  for(const f in raw){ const t=raw[f]; let i=0;
    while((i=t.indexOf(n,i))!==-1){ const b=t[i-1], a=t[i+n.length];
      if((b===undefined||!/[a-z0-9]/.test(b))&&(a===undefined||!/[a-z0-9]/.test(a))) c++;
      i+=n.length; } }
  return c; }

// ---- vertical aspect layers every content node SHOULD eventually have -------
// Selin's full vertical spine (CANON v2.0 relation graph)
const LAYERS = [
  { id: 'content',   label: 'Content (entity)', have: () => true },
  { id: 'meslek',    label: 'Meslekler',        probe: ['meslek','usta','çırak'] },
  { id: 'npc',       label: 'NPC',              probe: ['npc','komşu'] },
  { id: 'craft',     label: 'Craft',            probe: ['zanaat','el emeği','üret','craft'] },
  { id: 'quest',     label: 'Quest',            probe: ['quest','görev'] },
  { id: 'economy',   label: 'Ekonomi',          probe: ['ekonomi','pazar','tüccar','ticaret'] },
  { id: 'city',      label: 'Şehir',            probe: ['şehir','il ','kent','adana'] },
  { id: 'festival',  label: 'Festival',         probe: ['festival','şenlik','bayram'] },
  { id: 'animation', label: 'Animation',        probe: ['animation','animasyon'] },
  { id: 'sound',     label: 'Sound / VO',       probe: ['müzik','vokal','ezan','ses '] },
  { id: 'art',       label: 'Concept Art',      probe: ['concept','çizim','art'] },
  { id: 'image',     label: 'Image Vault',      special: 'images-unlinked' },
  { id: 'gameplay',  label: 'Gameplay',         probe: ['engine','mekanik','oynan'] },
  { id: 'blueprint', label: 'Blueprint',        probe: ['blueprint'] },
  { id: 'unreal',    label: 'Unreal Asset',     probe: ['unreal','nanite','world partition','pcg','niagara'] },
];

// entity → occurrence count for content-layer grounding
const ent = {}; for (const n of codex.graph.nodes) ent[foldTR(n.label)] = n;

function layerStatus(nodeTerm, layer) {
  if (layer.have) return { status: 'HAVE', n: null };
  if (layer.special === 'images-unlinked')
    return { status: images.analyzed > 0 ? 'PARTIAL' : 'UNLINKED', n: images.total };
  // co-occurrence proxy: does the node term appear near layer terms anywhere?
  const nodeHits = probeCount(nodeTerm);
  if (nodeHits === 0) return { status: 'MISSING', n: 0 };
  let layerHits = 0; for (const t of layer.probe) layerHits += probeCount(t);
  if (layerHits === 0) return { status: 'MISSING', n: 0 };
  // heuristic: both present in corpus → PARTIAL (real linkage unverified)
  return { status: 'PARTIAL', n: layerHits };
}

// ---- horizontal chains (Selin's expanded spine) ---------------------------
const CHAINS = [
  { id:'pamuk', label:'Pamuk → Anadolu', nodes:['Pamuk','Çiftçi','Dokumacı','Boyacı','Terzi','Pazar','Festival','Ekonomi','Anadolu'] },
  { id:'ekmek', label:'Buğday → Ekonomi', nodes:['Tohum','Buğday','Çiftçi','Değirmenci','Fırıncı','Ekmek','Pazar','Han','Festival','Ekonomi'] },
  { id:'maden', label:'Maden → Savunma', nodes:['Maden','Madenci','Demirci','Silah Ustası','İnşaat','Savunma'] },
];

const chainData = CHAINS.map(c => ({
  id: c.id, label: c.label,
  nodes: c.nodes.map(name => {
    const hits = probeCount(name);
    const status = hits === 0 ? 'MISSING' : hits <= 2 ? 'ORPHANED' : 'PRESENT';
    return { name, hits, status };
  }),
}));

// ---- full vertical for exemplar nodes --------------------------------------
const EXEMPLARS = ['Çiftçi', 'Fırıncı', 'Pamuk'];
const verticals = EXEMPLARS.map(name => ({
  node: name,
  layers: LAYERS.map(L => ({ layer: L.label, ...layerStatus(name, L) })),
}));

// ---- global layer completeness ---------------------------------------------
const layerTotals = LAYERS.map(L => {
  if (L.have) return { layer: L.label, coverage: 'HAVE (text)' };
  if (L.special) return { layer: L.label, coverage: `${images.total} görsel, 0 bağlı → UNLINKED` };
  const c = L.probe.reduce((n,t)=>n+probeCount(t),0);
  return { layer: L.label, coverage: c === 0 ? 'MISSING' : `${c} mention (bağlantı UNVERIFIED)` };
});

// =====================================================================
// WRITE relation_map.json (for the reader's Atlas, later)
// =====================================================================
const nodes = [], edges = [];
const seen = new Set();
const addNode = (id, label, type, status) => { if (!seen.has(id)) { seen.add(id); nodes.push({ id, label, type, status }); } };
for (const c of chainData) {
  for (let i = 0; i < c.nodes.length; i++) {
    const n = c.nodes[i]; addNode('c:'+foldTR(n.name), n.name, 'content', n.status);
    if (i) edges.push({ from: 'c:'+foldTR(c.nodes[i-1].name), to: 'c:'+foldTR(n.name), type: 'chain', chain: c.id });
  }
}
for (const L of LAYERS) addNode('l:'+L.id, L.label, 'layer', null);
for (const v of verticals) for (const l of v.layers)
  edges.push({ from: 'c:'+foldTR(v.node), to: 'l:'+LAYERS.find(x=>x.label===l.layer).id, type: 'aspect', status: l.status });
fs.writeFileSync(path.join(OUT, 'relation_map.json'),
  JSON.stringify({ generatedAt: '2026-07-27', layers: LAYERS.map(l=>l.label), chains: chainData, verticals, nodes, edges }, null, 2));

// =====================================================================
// WRITE MASTER_RELATION_MAP.md
// =====================================================================
let md = `<!-- CAELINUS CODEX — MASTER RELATION MAP · engine/relmap.mjs · READ-ONLY -->\n\n`;
md += `# CAELINUS — MASTER RELATION MAP v1.0\n\n`;
md += `> "Bütün Caelinus'u tek grafik olarak gör." Yatay = üretim zincirleri. Dikey = her düğümün sahip olması gereken katmanlar (Gameplay → Quest → NPC → Animation → Sound → Concept Art → Image Vault → Production Page → Unreal Asset).\n\n`;
md += `Bu harita **eksikleri değil bütünü** gösterir: neyin bağlı, neyin boş olduğunu. Bağlantı çıkarımları **UNVERIFIED** (gerçek bağ Phase 3 görsel + C1 parse sonrası kesinleşir).\n\n`;

md += `## 1. Dikey katman bütünlüğü (global)\n\n| Katman | Durum |\n|---|---|\n`;
for (const t of layerTotals) md += `| ${t.layer} | ${t.coverage} |\n`;

md += `\n## 2. Yatay üretim zincirleri\n\n`;
for (const c of chainData) {
  md += `### ${c.label}\n\n`;
  md += c.nodes.map(n => `${n.name}${n.status==='MISSING'?' ❌':n.status==='ORPHANED'?' ⚠️':' ✅'}`).join('  →  ') + '\n\n';
  const gaps = c.nodes.filter(n=>n.status!=='PRESENT').map(n=>n.name);
  md += `Eksik/zayıf: ${gaps.length?gaps.join(', '):'—'}\n\n`;
}

md += `## 3. Örnek düğümlerde tam dikey (Selin'in istediği görünüm)\n\n`;
for (const v of verticals) {
  md += `### ${v.node}\n\n\`\`\`\n${v.node}\n`;
  for (const l of v.layers) md += `   ↓ ${l.layer.padEnd(22)} [${l.status}]\n`;
  md += `\`\`\`\n\n`;
}

md += `## 4. Okuma\n`;
md += `- **HAVE** = veri var (metin/varlık). **PARTIAL** = korpusta ilgili terim var ama bağ doğrulanmadı. **UNLINKED** = 132 görsel henüz hiçbir düğüme bağlı değil. **MISSING** = hiç yok. **ORPHANED** = 1-2 kez geçiyor.\n`;
md += `- Şu an her dikey zincirin en zayıf halkaları: **Quest, Animation, Sound, Unreal Asset** (neredeyse tümü MISSING) ve **Image Vault** (132 görsel UNLINKED).\n`;
md += `- Bu boşluklar Phase 3 (görsel) ve sonraki içerik turlarında doldurulacak. Harita her \`build\`+\`relmap\` çalıştırmasında güncellenir.\n\n`;
md += `_Makine kopyası: \`codex/canon/relation_map.json\` (okuyucu Atlas'ı için)._\n`;
fs.writeFileSync(path.join(OUT, 'MASTER_RELATION_MAP.md'), md, 'utf8');

console.log('MASTER RELATION MAP written.');
console.log('Chains:', chainData.map(c=>`${c.label}: ${c.nodes.filter(n=>n.status==='PRESENT').length}/${c.nodes.length} present`).join(' | '));
console.log('Layers:', layerTotals.map(t=>`${t.layer}=${t.coverage.split(' ')[0]}`).join(', '));
