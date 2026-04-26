/**
 * Smoke i18n: every plant must have non-empty TR + EN in
 *   name, poetic, ritual, mythology, nutrition, healing
 *
 *   npx tsx scripts/smoke-i18n.ts
 */

import { plants, regions } from "../data/gaia";
import { PROVINCES } from "../data/provinces";

let errors = 0;
const fail = (id: string, field: string, lang: "tr" | "en") => {
  errors++;
  console.log(`  ✗ ${id.padEnd(24)} ${field}.${lang} EMPTY`);
};

console.log(`\n— i18n parity check (${plants.length} plants) —\n`);
const fields: (keyof (typeof plants)[number])[] = [
  "name", "poetic", "ritual", "mythology", "nutrition", "healing",
];

for (const p of plants) {
  for (const f of fields) {
    const v = p[f] as { tr?: string; en?: string } | undefined;
    if (!v) { errors++; console.log(`  ✗ ${p.id} ${String(f)} MISSING`); continue; }
    if (!v.tr || !v.tr.trim()) fail(p.id, String(f), "tr");
    if (!v.en || !v.en.trim()) fail(p.id, String(f), "en");
  }
}

console.log("\n— region.signature parity —\n");
for (const r of regions) {
  if (!r.signature?.tr) fail(r.id, "region.signature", "tr");
  if (!r.signature?.en) fail(r.id, "region.signature", "en");
  if (!r.name?.tr)      fail(r.id, "region.name",      "tr");
  if (!r.name?.en)      fail(r.id, "region.name",      "en");
}

console.log(`\n— province.signature parity —\n`);
let provinceMissEN = 0;
for (const pr of PROVINCES) {
  if (!pr.signature?.tr) fail(pr.id, "province.signature", "tr");
  if (!pr.signature?.en) { provinceMissEN++; fail(pr.id, "province.signature", "en"); }
}

console.log(`\n— Result —`);
console.log(`errors: ${errors}\n`);
process.exit(errors > 0 ? 1 : 0);
