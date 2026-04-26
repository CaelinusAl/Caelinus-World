/**
 * Faz 2.8 — Smoke test: Visual ↔ Voice ↔ Plant ↔ Region/Province alignment.
 *
 *   npx tsx scripts/smoke-canon.ts
 *
 * Verifies:
 *   1. Every plant in data/gaia.ts has an image file on disk.
 *   2. Every plant has a voice script (TR + EN).
 *   3. Every plant.region is a known RegionId AND that region.plantIds
 *      contains the plant.
 *   4. Every plant id referenced from any region or province actually
 *      exists in the plants array.
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { plants, regions } from "../data/gaia";
import { PLANT_VOICES } from "../data/plant-voices";
import { PROVINCES } from "../data/provinces";

const PUBLIC_DIR = resolve(process.cwd(), "public");

let errors = 0;
let warnings = 0;
const ok = (m: string) => console.log("  ✓ " + m);
const warn = (m: string) => { warnings++; console.log("  ⚠ " + m); };
const err  = (m: string) => { errors++;   console.log("  ✗ " + m); };

console.log(`\n— Faz 2.8 canon-check —`);
console.log(`Plants:   ${plants.length}`);
console.log(`Regions:  ${regions.length}`);
console.log(`Voices:   ${Object.keys(PLANT_VOICES).length}`);
console.log(`Provinces: ${PROVINCES.length}\n`);

console.log("[1/4] Image files present on disk");
const missingImages: string[] = [];
for (const p of plants) {
  const rel = p.image.replace(/^\//, "");
  const fp = join(PUBLIC_DIR, rel);
  if (existsSync(fp)) ok(`${p.id.padEnd(24)} → ${p.image}`);
  else { missingImages.push(p.id); warn(`${p.id.padEnd(24)} → MISSING ${p.image}`); }
}
if (missingImages.length) {
  console.log(`\n  → ${missingImages.length} image(s) pending user generation:`);
  for (const id of missingImages) console.log(`     · ${id}`);
}

console.log("\n[2/4] Voice scripts present + bilingual");
for (const p of plants) {
  const v = PLANT_VOICES[p.id];
  if (!v) { warn(`${p.id} has no voice script (will fall back to ◐ Yakında konuşacak)`); continue; }
  if (!v.lines || v.lines.length === 0) err(`${p.id} voice has empty lines`);
  else if (!v.lines.every((l) => l.tr && l.en))
    err(`${p.id} voice missing TR or EN in some line`);
  else ok(`${p.id.padEnd(24)} ${v.lines.length} lines TR+EN`);
}

console.log("\n[3/4] plant.region ↔ region.plantIds bidirectional");
const plantById = new Map(plants.map((p) => [p.id, p]));
const regionById = new Map(regions.map((r) => [r.id, r]));
for (const p of plants) {
  const r = regionById.get(p.region);
  if (!r) { err(`${p.id} → unknown region '${p.region}'`); continue; }
  if (!r.plantIds.includes(p.id))
    warn(`${p.id} declares region ${p.region} but is NOT listed in regions[].plantIds`);
  else ok(`${p.id.padEnd(24)} ↔ ${p.region}`);
}

console.log("\n[4/4] All region/province plant-ids resolve");
for (const r of regions) {
  for (const id of r.plantIds) {
    if (!plantById.has(id)) err(`region '${r.id}' refers to missing plant '${id}'`);
  }
}
for (const pr of PROVINCES) {
  for (const id of pr.plantIds) {
    if (!plantById.has(id)) err(`province '${pr.id}' refers to missing plant '${id}'`);
  }
}
if (errors === 0) ok("all region/province ids resolve");

console.log(`\n— Result —`);
console.log(`errors:   ${errors}`);
console.log(`warnings: ${warnings}\n`);
if (errors > 0) process.exit(1);
