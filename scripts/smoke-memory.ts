/**
 * Smoke test for lib/sanctum/memory.ts
 * Run: npx tsx scripts/smoke-memory.ts
 */

import {
  buildMemoryReading,
  poeticSummary,
  snapSolfeggio,
  argmaxRecord,
} from "../lib/sanctum/memory";
import { newSanctumId, toSanctumDate, type SanctumState } from "../lib/sanctum/types";

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`✓ ${label}`);
    pass++;
  } else {
    console.error(`✗ ${label}`);
    fail++;
  }
}

/* 1) snapSolfeggio basic */
assert(snapSolfeggio(528) === 528, "snapSolfeggio: exact 528 → 528");
assert(snapSolfeggio(550) === 528 || snapSolfeggio(550) === 639, "snapSolfeggio: 550 snaps to neighbour");
assert(snapSolfeggio(174) === 396, "snapSolfeggio: legacy 174 → 396 (closest)");
assert(snapSolfeggio(285) === 396, "snapSolfeggio: legacy 285 → 396 (closest)");
assert(snapSolfeggio(1000) === 963, "snapSolfeggio: 1000 → 963");

/* 2) argmaxRecord */
assert(argmaxRecord({ a: 0, b: 0, c: 0 }) === null, "argmaxRecord: all-zero → null");
assert(argmaxRecord({ a: 1, b: 5, c: 3 }) === "b", "argmaxRecord: picks b");

/* 3) Empty state → totalsActive 0, summary returns soft prompt */
const empty: SanctumState = { version: 1, entries: [], rituals: [] };
const r0 = buildMemoryReading(empty, 30);
assert(r0.totalEntries === 0, "empty: totalEntries 0");
assert(r0.totalRituals === 0, "empty: totalRituals 0");
assert(r0.activeDays === 0, "empty: activeDays 0");
assert(r0.daily.length === 30, "empty: daily.length 30");
assert(r0.daily.every((d) => !d.hasEntry && !d.hasRitual), "empty: all dots quiet");
assert(r0.dominantMood === null, "empty: dominantMood null");
assert(r0.dominantHz === null, "empty: dominantHz null");
assert(r0.dominantRegion === null, "empty: dominantRegion null");

const sumTr0 = poeticSummary(r0, "tr");
assert(sumTr0.includes("sessiz"), "empty: TR summary contains 'sessiz'");
const sumEn0 = poeticSummary(r0, "en");
assert(sumEn0.includes("silent"), "empty: EN summary contains 'silent'");

/* 4) Populated state */
const today = toSanctumDate();
const yesterday = (() => {
  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return toSanctumDate(d);
})();
const populated: SanctumState = {
  version: 1,
  entries: [
    {
      id: newSanctumId("j"),
      date: today,
      plantId: "lavanta",        // ege, sleep
      frequency: 528,
      moods: ["sleep", "heart"],
      body: "Lavanta yastığa iki damla. Üç nefes.",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: newSanctumId("j"),
      date: yesterday,
      plantId: "zeytin",         // ege, grounding
      frequency: 528,
      moods: ["grounding"],
      body: "Zeytin yağı kalbe sürülür.",
      createdAt: Date.now() - 86_400_000,
      updatedAt: Date.now() - 86_400_000,
    },
  ],
  rituals: [
    {
      id: newSanctumId("r"),
      date: today,
      plantId: "lavanta",
      depth: 4,
      reflection: "Beden yumuşadı.",
      createdAt: Date.now(),
    },
  ],
};

const r1 = buildMemoryReading(populated, 30);
assert(r1.totalEntries === 2, "populated: totalEntries 2");
assert(r1.totalRituals === 1, "populated: totalRituals 1");
assert(r1.activeDays === 2, "populated: activeDays 2");
assert(r1.dominantHz === 528, "populated: dominantHz 528");
assert(r1.moodDist.sleep > 0, "populated: moodDist.sleep > 0");
assert(r1.moodDist.heart > 0, "populated: moodDist.heart > 0");
assert(r1.moodDist.grounding > 0, "populated: moodDist.grounding > 0");
assert(r1.regionDist.ege > 0, "populated: regionDist.ege > 0 (lavanta + zeytin)");
assert(r1.regionDist.ege >= 2, "populated: regionDist.ege has both lavanta and zeytin");
assert(r1.topPlants.length > 0, "populated: topPlants populated");
assert(r1.topPlants[0].id === "lavanta", "populated: topPlants[0] = lavanta (entry+ritual)");

const sumTr1 = poeticSummary(r1, "tr");
console.log("\n  TR poetic summary:");
console.log(`  → ${sumTr1}`);
assert(sumTr1.startsWith("Son 30 gün"), "populated: TR summary starts with 'Son 30 gün'");
assert(sumTr1.includes("528 Hz"), "populated: TR summary mentions 528 Hz");
assert(sumTr1.includes("yaşadın"), "populated: TR summary ends with 'yaşadın.'");

const sumEn1 = poeticSummary(r1, "en");
console.log("  EN poetic summary:");
console.log(`  → ${sumEn1}`);
assert(sumEn1.startsWith("The last 30 days"), "populated: EN summary starts properly");
assert(sumEn1.includes("at 528 Hz"), "populated: EN summary mentions Hz");

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
