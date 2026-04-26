import { PLANT_VOICES, getPlantVoice, hasPlantVoice } from "../data/plant-voices";
import { plants } from "../data/gaia";

const newIds = [
  "mandalina","cilek","domates","maras-biberi","urfa-isot",
  "patlican","amasya-sogani","taskopru-sarimsagi","bal-kabagi","mor-havuc",
  "diyarbakir-karpuzu","kirkagac-kavunu","aksehir-bamyasi","mardin-nohudu","yesil-mercimek",
];

console.log("Total voice scripts:", Object.keys(PLANT_VOICES).length);
console.log("Total plants:        ", plants.length);

console.log("\nVoice script coverage of new plants:");
for (const id of newIds) {
  const v = getPlantVoice(id);
  if (v) {
    console.log(`  ✓ ${id.padEnd(22)} ${v.lines.length} lines  (TR/EN both present: ${v.lines.every(l => l.tr && l.en)})`);
  } else {
    console.log(`  ✗ ${id} MISSING VOICE`);
  }
}

console.log("\nPlants without voice scripts (should be empty for the new ones):");
const missing = plants.filter((p) => !hasPlantVoice(p.id)).map((p) => p.id);
console.log(" ", missing.join(", ") || "(none)");
