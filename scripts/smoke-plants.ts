import { plants } from "../data/gaia";

console.log("Total plants:", plants.length);
console.log("\nNew Phase 2.7 plants:");
const newIds = [
  "mandalina","cilek","domates","maras-biberi","urfa-isot",
  "patlican","amasya-sogani","taskopru-sarimsagi","bal-kabagi","mor-havuc",
  "diyarbakir-karpuzu","kirkagac-kavunu","aksehir-bamyasi","mardin-nohudu","yesil-mercimek",
];
for (const id of newIds) {
  const p = plants.find((x) => x.id === id);
  if (p) {
    console.log(`  ✓ ${id.padEnd(22)} ${p.name.tr.padEnd(22)} ${String(p.region).padEnd(14)} ${p.frequency}Hz  intent=${p.intent}`);
  } else {
    console.log(`  ✗ ${id} MISSING`);
  }
}
