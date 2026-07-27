// CAELINUS CODEX — ingest.mjs
// Parses each source .txt into a structured tree:
//   Volume → (sub-volume / profession) → Section → Blocks[{heading, text}]
// Purely config-driven via SOURCES profiles.

import fs from 'node:fs';
import path from 'node:path';
import { ARCHIVE_ROOT, SOURCES, CILT_TO_CANON } from './config.mjs';

const UPPER = 'A-ZÇĞİıÖŞÜ';
const LOWER = 'a-zçğıiöşü';

// A line is an ALLCAPS subheading if it is short, letter-bearing, and has no
// lowercase cased letters (Turkish-aware). Excludes pure punctuation/numbers.
function isCapsHeading(line) {
  const t = line.trim();
  if (t.length < 3 || t.length > 64) return false;
  if (!/[A-ZÇĞİÖŞÜ]/.test(t)) return false;          // must contain an uppercase letter
  if (new RegExp(`[${LOWER}]`).test(t)) return false; // no lowercase letters
  if (t.split(/\s+/).length > 9) return false;        // headings are short
  if (/[.!?]$/.test(t)) return false;                 // sentences aren't headings
  return true;
}

const norm = (s) => s.replace(/\s+/g, ' ').trim();

function makeSlug(...parts) {
  return parts
    .join('-')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Split a raw body (array of lines) into labeled blocks using CAPS subheadings.
function splitBlocks(lines) {
  const blocks = [];
  let current = { heading: null, lines: [] };
  const flush = () => {
    const text = current.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text || current.heading) blocks.push({ heading: current.heading, text });
  };
  for (const line of lines) {
    if (isCapsHeading(line)) {
      flush();
      current = { heading: norm(line), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  flush();
  return blocks.filter((b) => b.text || b.heading);
}

function matchMarker(line, markers) {
  for (const m of markers) {
    const mm = line.match(m.re);
    if (mm) return { def: m, groups: mm };
  }
  return null;
}

function nextCapsTitle(lines, startIdx) {
  for (let i = startIdx; i < Math.min(lines.length, startIdx + 6); i++) {
    const t = lines[i]?.trim();
    if (!t) continue;
    if (isCapsHeading(t)) return { title: norm(t), consumed: i + 1 };
    return { title: norm(t), consumed: i + 1 }; // first non-empty line as title fallback
  }
  return { title: 'Untitled', consumed: startIdx };
}

function isNoise(line, noise) {
  return noise.some((re) => re.test(line.trim()));
}

export function ingestSource(src) {
  const filePath = path.join(ARCHIVE_ROOT, src.file);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const p = src.profile;

  const sections = [];
  let subVolume = null;   // professions: CİLT
  let profession = null;  // professions: MESLEK
  let open = null;        // current section accumulator
  let seq = 0;

  const closeSection = () => {
    if (!open) return;
    const blocks = splitBlocks(open.bodyLines);
    const fullText = blocks.map((b) => (b.heading ? b.heading + '\n' : '') + b.text).join('\n\n').trim();
    const excerpt = norm(blocks.map((b) => b.text).join(' ')).slice(0, 220);
    // canon routing: profession pages route by cilt tag; others take source bible
    const canonBible = (p.routeByCilt && open.subVolume && CILT_TO_CANON[open.subVolume])
      ? CILT_TO_CANON[open.subVolume]
      : src.bible;
    sections.push({
      id: open.id,
      seq: open.seq,
      kind: open.kind,
      num: open.num ?? null,
      title: open.title,
      subVolume: open.subVolume,
      profession: open.profession,
      canonBible,
      startLine: open.startLine,
      blocks,
      text: fullText,
      excerpt,
      wordCount: fullText.split(/\s+/).filter(Boolean).length,
    });
    open = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    // professions: sub-volume + profession context lines
    if (p.subVolumeMarker) {
      const sv = t.match(p.subVolumeMarker.re);
      if (sv) { subVolume = { num: Number(sv[p.subVolumeMarker.num]), title: norm(sv[p.subVolumeMarker.title]) }; continue; }
    }
    if (p.professionMarker) {
      const pr = t.match(p.professionMarker.re);
      if (pr) { profession = { num: Number(pr[p.professionMarker.num]), title: norm(pr[p.professionMarker.title]) }; continue; }
    }

    const hit = matchMarker(t, p.sectionMarkers);
    if (hit) {
      closeSection();
      seq += 1;
      let title, num = null;
      if (hit.def.titleFromNextCaps) {
        const { title: tt, consumed } = nextCapsTitle(lines, i + 1);
        title = tt; i = consumed - 1;
        if (hit.def.num) num = Number(hit.groups[hit.def.num]);
      } else {
        if (hit.def.num) num = Number(hit.groups[hit.def.num]);
        title = hit.def.title ? norm(hit.groups[hit.def.title]) : norm(t);
      }
      open = {
        id: makeSlug(src.id, subVolume ? 'c' + subVolume.num : '', num != null ? String(num) : String(seq), title),
        seq, kind: hit.def.kind, num, title,
        subVolume: subVolume ? subVolume.title : null,
        profession: profession ? profession.title : null,
        startLine: i + 1, bodyLines: [],
      };
      continue;
    }

    if (open) {
      if (!isNoise(line, p.noise)) open.bodyLines.push(line);
    } else if (t && !isNoise(line, p.noise)) {
      // Preamble before the first marker → synthetic intro section
      open = {
        id: makeSlug(src.id, 'intro'), seq: ++seq, kind: 'intro', num: null,
        title: 'Giriş', subVolume: null, profession: profession ? profession.title : null,
        startLine: i + 1, bodyLines: [line],
      };
    }
  }
  closeSection();

  return {
    id: src.id,
    bible: src.bible,
    file: src.file,
    volumeTitle: src.volumeTitle,
    sectionCount: sections.length,
    sections,
  };
}

export function ingestAll() {
  return SOURCES.map(ingestSource);
}
