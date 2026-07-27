// CAELINUS CODEX — entities.mjs
// Scans every section for entity mentions, builds an occurrence index and a
// co-occurrence relationship graph, and layers the hand-authored canonical
// chains on top. This is what makes the Codex "clickable everywhere".

import { ENTITIES, CHAINS, ENTITY_TYPES } from './config.mjs';

const foldTR = (s) =>
  s.toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]))
    .replace(/i̇/g, 'i');

// Pre-fold aliases once.
const prepared = ENTITIES.map((e) => ({
  ...e,
  needles: [...new Set([e.label, ...e.aliases])].map((a) => foldTR(a.trim())).filter(Boolean),
}));

function countMentions(foldedText, needles) {
  let n = 0;
  for (const needle of needles) {
    if (!needle) continue;
    // word-ish boundary: needle surrounded by non-letter or string edge
    let idx = 0;
    while ((idx = foldedText.indexOf(needle, idx)) !== -1) {
      const before = foldedText[idx - 1];
      const after = foldedText[idx + needle.length];
      const bOk = before === undefined || !/[a-z0-9]/.test(before);
      const aOk = after === undefined || !/[a-z0-9]/.test(after);
      if (bOk && aOk) n++;
      idx += needle.length;
    }
  }
  return n;
}

export function buildEntityGraph(volumes) {
  // occurrences: entityId -> [{sectionId, bibleId, volumeTitle, sectionTitle, count}]
  const occurrences = new Map(prepared.map((e) => [e.id, []]));
  const totals = new Map(prepared.map((e) => [e.id, 0]));
  // co-occurrence weights
  const edgeW = new Map(); // "a|b" -> weight

  for (const vol of volumes) {
    for (const sec of vol.sections) {
      const folded = foldTR(sec.text);
      const present = [];
      for (const e of prepared) {
        const c = countMentions(folded, e.needles);
        if (c > 0) {
          occurrences.get(e.id).push({
            sectionId: sec.id, bibleId: vol.bible, volumeTitle: vol.volumeTitle,
            sectionTitle: sec.title, count: c,
          });
          totals.set(e.id, totals.get(e.id) + c);
          present.push(e.id);
        }
      }
      // co-occurrence edges within this section
      for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
          const key = [present[i], present[j]].sort().join('|');
          edgeW.set(key, (edgeW.get(key) || 0) + 1);
        }
      }
      // attach the entities found to the section for the reader
      sec.entities = present;
    }
  }

  // Canonical chain edges (strong, curated) — boost weights so they dominate.
  const chainEdges = new Set();
  for (const chain of CHAINS) {
    for (let i = 0; i < chain.steps.length - 1; i++) {
      const key = [chain.steps[i], chain.steps[i + 1]].sort().join('|');
      chainEdges.add(key);
      edgeW.set(key, (edgeW.get(key) || 0) + 100);
    }
  }

  const nodes = prepared
    .map((e) => ({
      id: e.id, label: e.label, type: e.type, color: ENTITY_TYPES[e.type].color,
      total: totals.get(e.id), sections: occurrences.get(e.id).length,
    }))
    .filter((n) => n.total > 0 || CHAINS.some((c) => c.steps.includes(n.id)));

  const liveIds = new Set(nodes.map((n) => n.id));
  const edges = [...edgeW.entries()]
    .map(([k, w]) => { const [a, b] = k.split('|'); return { a, b, weight: w, canonical: chainEdges.has(k) }; })
    .filter((e) => liveIds.has(e.a) && liveIds.has(e.b) && (e.weight >= 2 || e.canonical));

  const occObj = {};
  for (const [id, arr] of occurrences) if (arr.length) occObj[id] = arr.sort((x, y) => y.count - x.count);

  return {
    nodes, edges,
    chains: CHAINS.map((c) => ({ ...c, steps: c.steps.filter((s) => liveIds.has(s)) })),
    occurrences: occObj,
    types: ENTITY_TYPES,
  };
}
