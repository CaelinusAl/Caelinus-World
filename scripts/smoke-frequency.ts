import { readFrequency } from "../lib/frequency-reading";

const cases = [
  {
    name: "heart-water (love-leaning)",
    answers: {
      breath: "soft", weight: "heart", season: "spring",
      element: "water", invite: "love",
    },
  },
  {
    name: "fire-radiant (power)",
    answers: {
      breath: "radiant", weight: "belly", season: "summer",
      element: "fire", invite: "power",
    },
  },
  {
    name: "scattered-air (clarity)",
    answers: {
      breath: "scattered", weight: "head", season: "autumn",
      element: "air", invite: "clarity",
    },
  },
  {
    name: "tight-cold (calm/release)",
    answers: {
      breath: "tight", weight: "feet", season: "winter",
      element: "earth", invite: "release",
    },
  },
  {
    name: "warm-southeast (heirloom heat)",
    answers: {
      breath: "radiant", weight: "belly", season: "summer",
      element: "fire", invite: "power",
    },
  },
  {
    name: "joyful-summer (love-light)",
    answers: {
      breath: "soft", weight: "heart", season: "summer",
      element: "fire", invite: "love",
    },
  },
];

for (const c of cases) {
  const r = readFrequency(c.answers);
  console.log("─".repeat(60));
  console.log(`CASE: ${c.name}`);
  console.log(`  freq:     ${r.frequency} Hz (${r.frequencyLabel.tr})`);
  console.log(`  intent:   ${r.intent}`);
  console.log(`  element:  ${r.element}`);
  console.log(`  plant:    ${r.plant.id} (${r.plant.name.tr})`);
  console.log(`  region:   ${r.region.id} (${r.region.name.tr})`);
  console.log(`  plates:   ${r.region.samplePlates.join(", ")}`);
  console.log(`  whisper:  ${r.whisper[0].tr.slice(0, 80)}…`);
  console.log(`  ritual1:  ${r.rituals[0].tr.slice(0, 80)}`);
  console.log(`  score:    ${r.score.toFixed(3)}`);
}
