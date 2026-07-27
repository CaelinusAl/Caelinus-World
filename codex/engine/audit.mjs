// CAELINUS CODEX — audit.mjs  (Master Audit & Gap Analysis)
// READ-ONLY. Deletes nothing, merges nothing, rewrites nothing, does no image
// deep-analysis. Produces grounded reports from codex.json + raw source scans.
//   node codex/engine/audit.mjs
// Writes /codex/audit/*.md and returns a JSON summary on stdout.

import fs from 'node:fs';
import path from 'node:path';
import { ARCHIVE_ROOT, CODEX_ROOT, DATA_DIR, ASSET_DIR, SOURCES } from './config.mjs';

const AUDIT_DIR = path.join(CODEX_ROOT, 'audit');
fs.mkdirSync(AUDIT_DIR, { recursive: true });
const rel = (p) => path.relative(ARCHIVE_ROOT, p).replace(/\\/g, '/');
const codex = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'codex.json'), 'utf8'));
const images = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'images.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'report.json'), 'utf8'));

// ---- raw source cache + first-occurrence locator -------------------------
const rawByFile = {};
for (const s of SOURCES) {
  const p = path.join(ARCHIVE_ROOT, s.file);
  rawByFile[s.file] = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').split('\n');
}
const foldTR = (x) => x.toLocaleLowerCase('tr')
  .replace(/[çğıöşü]/g, c => ({ ç:'c', ğ:'g', ı:'i', ö:'o', ş:'s', ü:'u' }[c])).replace(/i̇/g,'i');

// word-boundary probe across all raw files → {count, files:{file:count}, first:'file:line'}
function probe(term) {
  const needle = foldTR(term);
  let count = 0, first = null; const files = {};
  for (const s of SOURCES) {
    const lines = rawByFile[s.file];
    for (let i = 0; i < lines.length; i++) {
      const f = foldTR(lines[i]); let idx = 0, hit = false;
      while ((idx = f.indexOf(needle, idx)) !== -1) {
        const b = f[idx-1], a = f[idx+needle.length];
        if ((b===undefined||!/[a-z0-9]/.test(b)) && (a===undefined||!/[a-z0-9]/.test(a))) {
          count++; files[s.file]=(files[s.file]||0)+1; hit=true;
          if (!first) first = `${rel(path.join(ARCHIVE_ROOT,s.file))}:${i+1}`;
        }
        idx += needle.length;
      }
    }
  }
  return { count, files, first };
}

// ---- image header reader (PNG IHDR / JPEG SOF) ----------------------------
function imgDims(file) {
  const p = path.join(ASSET_DIR, file);
  const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(64);
  fs.readSync(fd, buf, 0, 64, 0); fs.closeSync(fd);
  if (buf.slice(0,8).toString('hex') === '89504e470d0a1a0a') // PNG
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), fmt: 'png' };
  if (buf[0]===0xff && buf[1]===0xd8) return { w: null, h: null, fmt: 'jpeg' }; // needs marker walk
  return { w: null, h: null, fmt: 'unknown' };
}
function gcd(a,b){ return b? gcd(b,a%b):a; }
function ratio(w,h){ if(!w||!h) return '?'; const g=gcd(w,h); return `${w/g}:${h/g}`; }

// =====================================================================
// SECTION STATUS
// =====================================================================
const dupSectionIds = new Set();
for (const d of report.duplicates.duplicates) for (const m of d.members) dupSectionIds.add(m.sectionId);

function sectionStatus(s) {
  if (dupSectionIds.has(s.id)) return 'DUPLICATE';
  if (s.kind === 'intro' || /^(giriş|untitled)$/i.test(s.title)) return 'UNVERIFIED';
  if (s.wordCount < 80) return 'DRAFT';
  if (s.wordCount >= 250 && (s.entities?.length||0) >= 4) return 'CANONICAL_COMPLETE';
  return 'CANONICAL_PARTIAL';
}

const sections = [];
for (const v of codex.volumes) for (const s of v.sections)
  sections.push({ ...s, bible: s.canonBible || v.bible, volumeTitle: v.volumeTitle,
    sourceFile: rel(path.join(ARCHIVE_ROOT, v.file || '')),
    status: sectionStatus(s) });

// =====================================================================
// ENTITY STATUS
// =====================================================================
const occ = codex.graph.occurrences;
function entityStatus(n) {
  const c = n.total, secs = n.sections;
  if (c === 0) return 'MISSING';
  if (c <= 2) return 'ORPHANED';
  if (c >= 50 && secs >= 5) return 'CANONICAL_COMPLETE';
  return 'CANONICAL_PARTIAL';
}
const entities = codex.graph.nodes.map(n => ({ ...n, status: entityStatus(n) }));

// =====================================================================
// CANONICAL 18-BIBLE MAP  (mapping is editorial → inferences = UNVERIFIED)
// =====================================================================
const CANON_BIBLES = [
  { name: 'Founder / Genesis Bible',      map: ['genesis','founder'], state: 'PRESENT' },
  { name: 'World Bible',                  map: [], state: 'SCATTERED', note: 'Adana + 81 il çerçevesi Genesis içinde; müstakil cilt yok.', from: ['CAELINUS-genesis.txt'] },
  { name: 'Living Civilization Bible',    map: ['professions'], state: 'PARTIAL', note: 'Fırıncı dosyası CİLT 1 = "CIVILIZATION DESIGN BIBLE". İKİ meslek yazılı: Çiftçi (MESLEK 09) + Fırıncı (MESLEK 10).', from: ['CAELINUS PRODUCTION BIBLE-MESLEKLER.txt'] },
  { name: 'NPC Bible',                    map: [], state: 'PARTIAL', note: 'YAZILI ama gömülü: Çiftçi dosyasında "Cilt 1 — NPC BIBLE" olarak var (+ Meslekler 232 & Art madde 6). Müstakil dosya değil.', from: ['CAELINUS PRODUCTION BIBLE.txt'] },
  { name: 'Production Bible',             map: ['production'], state: 'PARTIAL', note: 'DİKKAT: "CAELINUS PRODUCTION BIBLE.txt" aslında MESLEK 09 ÇİFTÇİ meslek dosyasıdır; içinde NPC + Engineering CİLT\'leri var (parse defekti → UNVERIFIED).' },
  { name: 'Gameplay Bible',               map: [], state: 'SCATTERED', note: 'Oyuncu yolculuğu Genesis BÖLÜM 3; mekanikler meslek ...ENGINE sayfalarında.' },
  { name: 'Engineering Bible',            map: [], state: 'PARTIAL', note: 'YAZILI ama gömülü: Çiftçi dosyasında "CİLT 2 — ENGINEERING BIBLE" (soil/crop/climate/harvest engine sayfaları).', from: ['CAELINUS PRODUCTION BIBLE.txt'] },
  { name: 'Environment Bible',            map: [], state: 'MISSING', note: 'Biyom/çevre taksonomisi yok (dağ/ova/orman yalnızca anlatı).' },
  { name: 'Art Direction Bible',          map: ['art'], state: 'PRESENT' },
  { name: 'AI Behaviour Bible',           map: [], state: 'SCATTERED', note: 'NPC davranışı Production NPC Philosophy + Living Memory içinde.' },
  { name: 'Historical & Cultural Bible',  map: [], state: 'SCATTERED', note: 'Anadolu/kültür teması tüm ciltlere yayılmış; müstakil cilt yok.' },
  { name: 'Economy Bible',                map: [], state: 'SCATTERED', note: 'Ekonomi Genesis "Yaşayan Ekonomi" + Meslekler market engine sayfaları.' },
  { name: 'Architecture Bible',           map: [], state: 'MISSING', note: 'Mimari yalnızca Art Bible madde 3\'te ilke düzeyinde.' },
  { name: 'Audio & Music Bible',          map: [], state: 'MISSING', note: 'Ses yalnızca Art Bible madde 5\'te ilke düzeyinde.' },
  { name: 'Cinematic Bible',              map: [], state: 'MISSING', note: 'Kamera Art Bible madde 4; müstakil sinematik cilt yok.' },
  { name: 'UI / UX Codex',                map: [], state: 'MISSING' },
  { name: 'Unreal Implementation Bible',  map: [], state: 'SCATTERED', note: 'Unreal/World Partition/PCG/Niagara referansları Production içinde dağınık.' },
  { name: 'Canonical Decisions Archive',  map: [], state: 'MISSING', note: 'Kanonik kararlar (ör. ilk-iz FROZEN) yalnızca ekip hafızasında, arşivde cilt yok.' },
];

// =====================================================================
// PRODUCTION CHAINS  (probe each node for real presence)
// =====================================================================
const CHAIN_DEFS = [
  { id:'ekmek', label:'Ekmek Zinciri', nodes:[
    ['Çiftçi','çiftçi'],['Değirmenci','değirmenci'],['Fırıncı','fırıncı'],['Pazar','pazar'],['Han','han'],['Festival','festival'],['Ekonomi','ekonomi']]},
  { id:'pamuk', label:'Pamuk / Tekstil Zinciri', nodes:[
    ['Pamuk','pamuk'],['Çiftçi','çiftçi'],['Dokumacı','dokumacı'],['Boyacı','boyacı'],['Terzi','terzi'],['Tüccar','tüccar']]},
  { id:'maden', label:'Maden / Savunma Zinciri', nodes:[
    ['Maden','maden'],['Madenci','madenci'],['Demirci','demirci'],['Silah Ustası','silah ustası'],['İnşaat','inşaat'],['Savunma','savunma']]},
];
const chains = CHAIN_DEFS.map(c => ({
  ...c,
  nodes: c.nodes.map(([label, term]) => {
    const pr = probe(term);
    return { label, term, count: pr.count, first: pr.first, present: pr.count >= 3,
      status: pr.count === 0 ? 'MISSING' : pr.count <= 2 ? 'ORPHANED' : 'PRESENT' };
  }),
}));

// =====================================================================
// TECH / UNREAL probes
// =====================================================================
const TECH_TERMS = ['unreal','world partition','pcg','niagara','lumen','nanite','blueprint','chaos','metahuman','navmesh','megascan'];
const tech = TECH_TERMS.map(t => ({ term: t, ...probe(t) })).filter(t => t.count > 0);

// =====================================================================
// IMAGE INVENTORY  (file-level only, no vision)
// =====================================================================
const imgRows = images.images.map((im, i) => {
  const d = imgDims(im.file);
  const m = im.file.match(/(\d{2})_(\d{2})_(\d{2})/); // hh_mm_ss from ChatGPT export name
  const tkey = m ? `${m[1]}:${m[2]}` : '?';           // series = same minute batch
  return { assetId: `IMG-CAEL-${String(i+1).padStart(4,'0')}`, file: im.file,
    path: rel(path.join(ASSET_DIR, im.file)), bytes: im.bytes,
    w: d.w, h: d.h, fmt: d.fmt, ratio: ratio(d.w, d.h), seriesKey: tkey,
    status: ['VISUAL_ONLY','UNVERIFIED'] };
});
// dimension families (most exports share one canvas) + TIGHT dup candidates.
// NOTE: 116/132 are 1536×1024, so byte-proximity is unreliable for true visual
// dedup — real dedup needs perceptual hashing (deferred to Phase 3).
const dimFamilies = {}; for (const r of imgRows) { const k=`${r.w}×${r.h}`; (dimFamilies[k] ||= []).push(r.assetId); }
const seriesMap = {}; for (const r of imgRows) (seriesMap[r.seriesKey] ||= []).push(r.assetId);
const dupCandidates = [];
for (let i=0;i<imgRows.length;i++) for (let j=i+1;j<imgRows.length;j++){
  const a=imgRows[i], b=imgRows[j];
  // only near-exact byte match (<0.1%) AND same series-minute → plausible dup
  if (a.w && a.w===b.w && a.h===b.h && a.seriesKey===b.seriesKey &&
      Math.abs(a.bytes-b.bytes)/Math.max(a.bytes,b.bytes) < 0.001)
    dupCandidates.push([a.assetId, b.assetId]);
}
const lowQ = imgRows.filter(r => (r.w && r.w < 768) || r.bytes < 120*1024);

// =====================================================================
// CRITICAL FINDINGS  (structural discoveries from raw scan)
// =====================================================================
const CRITICAL = [
  { id:'C1', sev:'CRITICAL', title:'"Production Bible" aslında ÇİFTÇİ meslek dosyası + gömülü NPC/Engineering ciltleri',
    detail:'`CAELINUS PRODUCTION BIBLE.txt` başlığı "Meslek 09 — ÇİFTÇİ"; içinde "Cilt 1 — NPC BIBLE" ve "CİLT 2 — ENGINEERING BIBLE" alt-ciltleri var. Yani NPC Bible ve Engineering Bible EKSİK DEĞİL — bu dosyada yazılı. Motor bu dosyayı yanlış profille (generic banner) ayrıştırdı → 19 düz bölüm; gerçek SAYFA/CİLT yapısı kayboldu.',
    src:'CAELINUS PRODUCTION BIBLE.txt:1-3', action:'Phase 1: parse profilini professions (case-insensitive CİLT/MESLEK/SAYFA) yap, yeniden ingest. Silme/birleştirme YOK.' },
  { id:'C2', sev:'CRITICAL', title:'İki meslek yazılı (Çiftçi + Fırıncı), tek değil',
    detail:'Önceki gap raporu "yalnızca 1 meslek" diyordu. Gerçek: MESLEK 09 ÇİFTÇİ (Production dosyası) + MESLEK 10 FIRINCI (Meslekler dosyası).',
    src:'CAELINUS PRODUCTION BIBLE.txt / CAELINUS PRODUCTION BIBLE-MESLEKLER.txt', action:'Envanteri 2 meslek olarak düzelt.' },
  { id:'C3', sev:'HIGH', title:'Marker büyük/küçük harf tutarsızlığı (Meslek/MESLEK, Cilt/CİLT, Sayfa/SAYFA)',
    detail:'Aynı dosyada hem "Meslek 09"/"Cilt 1"/"Sayfa 1" (title case, gerçek başlıklar) hem "MESLEK/CİLT/SAYFA" (uppercase, running banner) kullanılıyor. Türkçe İ/i katlaması nedeniyle case-sensitive parser başlıkları kaçırdı.',
    src:'CAELINUS PRODUCTION BIBLE.txt', action:'Parser + kaynak normalizasyonu; Canonical Decisions Archive\'a marker standardı yaz.' },
  { id:'C4', sev:'MEDIUM', title:'Tüm 148 bölüm şu an TEXT_ONLY; tüm 132 görsel VISUAL_ONLY',
    detail:'Hiç metin↔görsel bağlantısı yok (Vision analizi yapılmadı). Kritik bölümlerin görseli, görsellerin metni belirsiz.',
    src:'data/images.json', action:'Phase 3 AI-Vision.' },
];

// =====================================================================
// WRITE REPORTS
// =====================================================================
const H = (t) => `<!-- CAELINUS CODEX — generated by engine/audit.mjs · READ-ONLY audit -->\n\n# ${t}\n\n> Otomatik üretildi. Hiçbir dosya silinmedi/birleştirilmedi/yeniden yazılmadı. Emin olunmayan çıkarımlar **UNVERIFIED**.\n\n`;
const w = (name, body) => fs.writeFileSync(path.join(AUDIT_DIR, name), body, 'utf8');

// 1. MASTER_INVENTORY
let mi = H('MASTER INVENTORY');
mi += `## Kaynak dosyalar (${SOURCES.length})\n\n| Bible | Dosya | Bölüm |\n|---|---|---|\n`;
for (const s of SOURCES) { const v = codex.volumes.find(v=>v.bible===s.id);
  mi += `| ${s.bible} | \`${rel(path.join(ARCHIVE_ROOT,s.file))}\` | ${v?v.sections.length:0} |\n`; }
mi += `\n## Bible'lar / Ciltler (${codex.bibles.length})\n\n| Bible | Yazılı? | Alt-cilt | Bölüm |\n|---|---|---|---|\n`;
for (const b of codex.bibles) mi += `| ${b.tr} | ${b.hasSource?'✓':'✗ (gap)'} | ${(b.subVolumes||[]).join(', ')||'—'} | ${b.sectionCount} |\n`;
mi += `\n## Bölümler (${sections.length}) — statülü\n\n| # | Başlık | Bible | Alt-cilt | Kelime | Link | Statü | Kaynak |\n|---|---|---|---|---|---|---|---|\n`;
for (const s of sections) mi += `| ${s.num??''} | ${s.title.replace(/\|/g,'/')} | ${s.bible} | ${s.subVolume||''} | ${s.wordCount} | ${s.entities?.length||0} | ${s.status} | \`${s.sourceFile}\` |\n`;
mi += `\n## Varlıklar (${entities.length})\n\n| Varlık | Tip | Mention | Bölüm | Statü |\n|---|---|---|---|---|\n`;
for (const e of entities.sort((a,b)=>b.total-a.total)) mi += `| ${e.label} | ${e.type} | ${e.total} | ${e.sections} | ${e.status} |\n`;
mi += `\n## Görseller: ${imgRows.length} (detay → IMAGE_INVENTORY.md)\n`;
mi += `\n## Tespit edilen teknik/Unreal referansları\n\n| Terim | Adet | İlk konum |\n|---|---|---|\n`;
for (const t of tech) mi += `| ${t.term} | ${t.count} | \`${t.first||''}\` |\n`;
w('MASTER_INVENTORY.md', mi);

// 2. CANON_STATUS_MATRIX
let cm = H('CANON STATUS MATRIX');
cm += `Statü lejantı: CANONICAL_COMPLETE · CANONICAL_PARTIAL · DRAFT · DUPLICATE · CONFLICT · MISSING · UNVERIFIED · VISUAL_ONLY · TEXT_ONLY · ORPHANED\n\n`;
const statusCount = {}; for (const s of sections) statusCount[s.status]=(statusCount[s.status]||0)+1;
cm += `## Bölüm statü dağılımı\n\n| Statü | Adet |\n|---|---|\n`;
for (const [k,v2] of Object.entries(statusCount).sort((a,b)=>b[1]-a[1])) cm += `| ${k} | ${v2} |\n`;
cm += `\n> NOT: Şu an **hiçbir bölümün görsel bağlantısı yok** (132 görsel analiz edilmedi) → tüm metin bölümleri fiilen **TEXT_ONLY**, tüm görseller **VISUAL_ONLY**. Bu Phase 3'te çözülür.\n`;
cm += `\n## Bölüm bazında (kaynak yollu)\n\n| Başlık | Bible | Statü | Kaynak |\n|---|---|---|---|\n`;
for (const s of sections) cm += `| ${s.title.replace(/\|/g,'/')} | ${s.bible} | ${s.status} | \`${s.sourceFile}\` |\n`;
w('CANON_STATUS_MATRIX.md', cm);

// 3. GAP_ANALYSIS
let ga = H('GAP ANALYSIS');
ga += `## ⚠ KRİTİK YAPISAL BULGULAR\n\n`;
for (const c of CRITICAL) ga += `### [${c.sev}] ${c.id} — ${c.title}\n${c.detail}\n\n- Kaynak: \`${c.src}\`\n- Öneri: ${c.action}\n\n`;
ga += `## Motorun raporladığı boşluklar\n\n`;
for (const g of report.gaps.gaps) { ga += `### [${g.severity.toUpperCase()}] ${g.title}\n${g.note}\n`;
  if (g.detail) ga += `\n- ${g.detail.pagesPresent}/${g.detail.pagesMax} sayfa · ${g.detail.professionsWritten} meslek yazılı · ${g.detail.missingPageCount} boş sayfa\n`;
  ga += `\n`; }
ga += `## Kanonik 18-Bible karşılaştırması\n\n| Bible | Durum | Kaynak / not |\n|---|---|---|\n`;
for (const cb of CANON_BIBLES) ga += `| ${cb.name} | ${cb.state} | ${(cb.note||'')} ${(cb.from?('['+cb.from.join(', ')+']'):'')} |\n`;
ga += `\n## Orphan / eksik varlıklar\n\n| Varlık | Mention | Statü |\n|---|---|---|\n`;
for (const e of entities.filter(e=>['ORPHANED','MISSING'].includes(e.status))) ga += `| ${e.label} | ${e.total} | ${e.status} |\n`;
w('GAP_ANALYSIS.md', ga);

// 4. DUPLICATE_CONFLICT_REPORT
let dc = H('DUPLICATE & CONFLICT REPORT');
dc += `> Hiçbir şey otomatik silinmedi/birleştirilmedi — yalnızca öneri.\n\n## Birebir/near tekrarlar (${report.duplicates.duplicates.length})\n\n`;
if (!report.duplicates.duplicates.length) dc += `_Yok._\n`;
for (const d of report.duplicates.duplicates) { dc += `- **${d.count}× tekrar:** ${d.members.map(m=>`\`${m.title}\` (${m.bible})`).join(' · ')}\n  - Öneri: SUGGEST_MERGE_REVIEW (insan kararı)\n`; }
dc += `\n## Tekrarlayan paragraf (boilerplate) — ${report.duplicates.boilerplate.length}\n\n`;
for (const b of report.duplicates.boilerplate) dc += `- ${b.count}×: "${b.sample}…"\n`;
dc += `\n## Sayfa numarası çakışmaları (Meslekler SAYFA)\n\n`;
const profSecs = codex.volumes.filter(v=>['ciftci','firinci'].includes(v.id)).flatMap(v=>v.sections);
const pageNums = {}; for (const s of profSecs) if(s.num!=null){ (pageNums[s.num]||=[]).push(`${s.profession||''} ${s.title}`); }
const pageClash = Object.entries(pageNums).filter(([,a])=>a.length>1);
dc += pageClash.length? pageClash.map(([n,a])=>`- SAYFA ${n}: ${a.join(' / ')}`).join('\n')+'\n' : '_Yok._\n';
dc += `\n## Görsel tekrar adayları (${dupCandidates.length}) — aynı boyut + ~aynı byte\n\n`;
dc += dupCandidates.length? dupCandidates.slice(0,40).map(([a,b])=>`- ${a} ≈ ${b}`).join('\n')+'\n' : '_Yok._\n';
dc += `\n## Çelişki (CONFLICT) taraması\n\nMetinler arası açık kanonik çelişki otomatik tespit edilmedi. Bu alan **UNVERIFIED** — insan editoryal incelemesi gerekir (ör. meslek numaralandırması: dosya başlığı "MESLEK 10 — FIRINCI" ama Meslekler içinde "MESLEK 09 — ÇİFTÇİ" referansı geçiyor → numaralandırma tutarsızlığı adayı).\n`;
w('DUPLICATE_CONFLICT_REPORT.md', dc);

// 5. IMAGE_INVENTORY
let ii = H('IMAGE INVENTORY');
ii += `Toplam **${imgRows.length}** görsel. Derin AI-Vision analizi YAPILMADI (Phase 3). Yalnızca dosya-seviyesi envanter.\n\n`;
ii += `## Boyut aileleri\n\n| Boyut | Adet |\n|---|---|\n`;
for (const [k,a] of Object.entries(dimFamilies).sort((x,y)=>y[1].length-x[1].length)) ii += `| ${k} | ${a.length} |\n`;
ii += `\n> 116/132 görsel 1536×1024 → byte-yakınlığı ile gerçek görsel tekrar tespiti GÜVENİLMEZ. Gerçek dedup Phase 3'te perceptual hash ile yapılacak. Aşağıdaki tekrar adayları yalnızca aynı dakika + ~aynı byte (<%0.1) filtresidir, **UNVERIFIED**.\n`;
ii += `\n## Seri (aynı dakika batch'i)\n\n| Seri (hh:mm) | Görsel sayısı |\n|---|---|\n`;
for (const [k,a] of Object.entries(seriesMap).sort((x,y)=>y[1].length-x[1].length)) ii += `| ${k} | ${a.length} |\n`;
ii += `\n## Tekrar adayları (${dupCandidates.length}, UNVERIFIED)\n\n`;
ii += dupCandidates.length? dupCandidates.slice(0,40).map(([a,b])=>`- ${a} ≈ ${b}`).join('\n')+'\n' : '_Sıkı filtrede aday yok — perceptual hash gerek._\n';
ii += `\n## Düşük kalite / şüpheli (${lowQ.length})\n\n`;
ii += lowQ.length? lowQ.map(r=>`- ${r.assetId} \`${r.file}\` ${r.w}×${r.h} ${(r.bytes/1024|0)}KB`).join('\n')+'\n' : '_Yok — tümü yüksek çözünürlük._\n';
ii += `\n## Tam envanter\n\n| Asset ID | Boyut | Oran | Format | KB | Seri | Statü | Dosya |\n|---|---|---|---|---|---|---|---|\n`;
for (const r of imgRows) ii += `| ${r.assetId} | ${r.w||'?'}×${r.h||'?'} | ${r.ratio} | ${r.fmt} | ${r.bytes/1024|0} | ${r.seriesKey} | ${r.status.join('+')} | \`${r.path}\` |\n`;
ii += `\n> Tüm görseller açıklamasız + metinle eşleşmemiş (VISUAL_ONLY). Olası Bible ataması Phase 3'te AI-Vision ile yapılacak.\n`;
w('IMAGE_INVENTORY.md', ii);

// 6. PRODUCTION_CHAIN_GAPS
let pc = H('PRODUCTION CHAIN GAPS');
for (const c of chains) {
  pc += `## ${c.label}\n\n| Halka | Durum | Mention | İlk konum |\n|---|---|---|---|\n`;
  for (const n of c.nodes) pc += `| ${n.label} | ${n.status} | ${n.count} | ${n.first?`\`${n.first}\``:'—'} |\n`;
  const missing = c.nodes.filter(n=>n.status!=='PRESENT').map(n=>n.label);
  pc += `\n**Eksik/zayıf halkalar:** ${missing.length? missing.join(', '):'—'}\n\n`;
}
pc += `> Sonuç: yalnızca **Fırıncı** mesleği yazıldığı için üç zincirin çoğu halkası MISSING/ORPHANED. Çiftçi, Pazar, Festival, Ekonomi anlatı düzeyinde geçer ama müstakil meslek/sistem cildi yok.\n`;
w('PRODUCTION_CHAIN_GAPS.md', pc);

// 7. MISSING_BIBLES_REPORT
let mb = H('MISSING BIBLES REPORT');
mb += `## World Bible\n\n**Durum: SCATTERED (hiç yazılmadı değil — parçalı).**\n\n`;
mb += `- Adana + "81 İl" çerçevesi, Seyhan, Anadolu teması **Genesis** içinde: \`CAELINUS-genesis.txt\`\n`;
mb += `- Coğrafya/biyom taksonomisi (dağ/ova/orman/delta) yalnızca anlatı; yapılandırılmış cilt yok.\n`;
mb += `- **Birleşim önerisi (kayıpsız):** Genesis'teki mekân/coğrafya pasajları + Art Bible mimari/ışık ilkeleri → yeni \`WORLD_BIBLE.md\` iskeleti (kaynak referanslı, kopyalamadan işaret ederek).\n\n`;
mb += `## NPC Bible\n\n**Durum: SCATTERED (gömülü, güçlü).**\n\n`;
mb += `- NPC felsefesi + Living Memory + First Impression: \`CAELINUS PRODUCTION BIBLE.txt\` (67 mention)\n`;
mb += `- NPC olarak meslek/usta/çırak davranışı: \`CAELINUS PRODUCTION BIBLE-MESLEKLER.txt\` (232 mention)\n`;
mb += `- Art Bible madde 6 "İNSAN" (komşu/esnaf/çiftçi/çocuk/usta): \`CAELINUS ART BIBLE 001.txt\`\n`;
mb += `- **Birleşim önerisi:** bu üç kaynaktaki NPC bölümlerine işaret eden bir \`NPC_BIBLE.md\` indeks cildi; AI Behaviour Bible ile ortak.\n\n`;
mb += `## Tamamen eksik (müstakil + parçası da yok)\n\n`;
for (const cb of CANON_BIBLES.filter(c=>c.state==='MISSING')) mb += `- **${cb.name}** — ${cb.note||''}\n`;
w('MISSING_BIBLES_REPORT.md', mb);

// 8. CODEX_REPAIR_PLAN
let rp = H('CODEX REPAIR PLAN');
rp += `## ⚠ Önce oku — kritik yapısal bulgular\n\n`;
for (const c of CRITICAL) rp += `- **[${c.sev}] ${c.id}** ${c.title} → ${c.action}\n`;
rp += `\n## Öncelik yol haritası\n\n`;
rp += `### PHASE 0 — Archive Safety\n- Arşivin tam yedeği (kaynak .txt + asset/ 132 görsel) alınır; her bölüme kaynak dosya:satır izlenebilirliği zaten \`audit/\` içinde. Hiçbir orijinal dokunulmaz.\n\n`;
rp += `### PHASE 1 — Canon Repair\n- ${report.duplicates.duplicates.length} tekrar kümesi insan onayıyla incelenir (otomatik merge YOK).\n- Meslek numaralandırma tutarsızlığı (MESLEK 09/10) netleştirilir → Canonical Decisions Archive'a yazılır.\n- ${statusCount.DRAFT||0} DRAFT + ${statusCount.UNVERIFIED||0} UNVERIFIED bölüm statüsü kesinleştirilir.\n\n`;
rp += `### PHASE 2 — Missing Bibles\n- Öncelik: World Bible, NPC Bible (parçalı kaynaklardan kayıpsız indeks). Sonra Environment, Audio, Cinematic, Architecture, UI/UX, Canonical Decisions.\n\n`;
rp += `### PHASE 3 — Image Intelligence\n- ${imgRows.length} görselin AI-Vision analizi; her görsel → description/keywords/bibles/entities/npc; VISUAL_ONLY → linked.\n\n`;
rp += `### PHASE 4 — Editorial Completion\n- Zincir eksikleri (Değirmenci, Boyacı, Tüccar, Madenci, Demirci, Silah Ustası, İnşaat, Savunma meslekleri).\n- Her kritik bölüm için Unreal karşılığı + ekonomi bağı + AI davranışı + kültür bağı tamamlanır.\n\n`;
rp += `### PHASE 5 — Cursor Handoff\n- \`data/codex.json\` + \`audit/*.md\` temiz veri sözleşmesi olarak Cursor'a devredilir; şema dondurulur.\n\n`;
rp += `## Önerilen ilk onarım sırası (somut)\n1. PHASE 0 yedek\n2. Meslek numaralandırma çelişkisini karara bağla\n3. NPC Bible indeksini parçalı kaynaklardan kur (en yüksek hazır içerik)\n4. World Bible indeksini Genesis'ten kur\n5. Görsel Vision analizi (132) — çünkü tüm bölümler şu an TEXT_ONLY\n`;
w('CODEX_REPAIR_PLAN.md', rp);

// =====================================================================
// SUMMARY (stdout, for the assistant to present)
// =====================================================================
const orphanEnts = entities.filter(e=>['ORPHANED','MISSING'].includes(e.status));
const summary = {
  critical: CRITICAL.map(c=>({id:c.id,sev:c.sev,title:c.title})),
  counts: { sources: SOURCES.length, bibles: codex.bibles.length, sections: sections.length,
    entities: entities.length, images: imgRows.length, statusCount },
  canonBibles: CANON_BIBLES.map(c=>({name:c.name,state:c.state})),
  missingBibles: CANON_BIBLES.filter(c=>['MISSING','SCATTERED'].includes(c.state)).map(c=>({name:c.name,state:c.state})),
  chainGaps: chains.flatMap(c=>c.nodes.filter(n=>n.status!=='PRESENT').map(n=>({chain:c.label,node:n.label,status:n.status}))),
  duplicates: report.duplicates.duplicates,
  imgDupCandidates: dupCandidates.length,
  files: fs.readdirSync(AUDIT_DIR).sort(),
};
console.log(JSON.stringify(summary, null, 1));
