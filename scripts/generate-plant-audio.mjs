// scripts/generate-plant-audio.mjs
//
// One-shot audio generator for /universe/gaia/plants.
//
// Reads:
//   - data/plant-voices.ts  (12 plants × TR/EN scripts)
//   - .env.local            (ELEVEN_API_KEY, ELEVEN_VOICE_ID)
//
// Writes:
//   - public/audio/plants/{id}.{lang}.mp3
//   - public/audio/plants/_manifest.json     (cache hashes + file sizes)
//
// Skips voices that already match their cached hash, so re-runs are
// cheap until you edit a script line.
//
// Usage (PowerShell):
//   $env:ELEVEN_API_KEY = "..."     # or rely on .env.local
//   $env:ELEVEN_VOICE_ID = "..."
//   npm run plants:audio
//
// Flags:
//   --plants=lavanta,gul     Only generate these plant ids
//   --lang=tr                Only one language
//   --force                  Re-render even if cached
//   --dry-run                Compute hashes, don't call ElevenLabs
//
// IMPORTANT: never commit .env.local. ELEVEN_API_KEY must stay secret.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

/* ───── tiny .env.local loader (no external deps) ───── */

async function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let value = m[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env.local — rely on the live shell env.
  }
}

/* ───── arg parsing ───── */

function parseArgs(argv) {
  const out = { plants: null, lang: null, force: false, dryRun: false };
  for (const a of argv) {
    if (a === "--force") out.force = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--plants=")) out.plants = a.slice(9).split(",").filter(Boolean);
    else if (a.startsWith("--lang=")) out.lang = a.slice(7);
  }
  return out;
}

/* ───── voice script loader ───── */

async function loadVoices() {
  // Compile data/plant-voices.ts on the fly with the TS module.
  // Requires a recent Node (>=22.6) with --experimental-strip-types,
  // OR ts-node, OR (preferred) we just dynamically import the .ts via
  // the project's existing tooling. Since this script is invoked from
  // `npm run plants:audio` and Caelinus is a Next 16 project, we use
  // the lightweight on-disk JSON the build emits:
  const voicesPath = path.join(ROOT, "data", "plant-voices.ts");
  const tsRaw = await fs.readFile(voicesPath, "utf8");
  // Pull the PLANT_VOICES literal out of the TS source via a regex.
  // This avoids requiring ts-node / tsx as a hard dependency.
  const match = tsRaw.match(/export const PLANT_VOICES[\s\S]*?=\s*({[\s\S]*?});\s*$/m);
  if (!match) {
    throw new Error(
      "Could not parse PLANT_VOICES literal from data/plant-voices.ts. " +
      "If you reformatted the file, update this regex or install tsx and " +
      "switch this loader to dynamic import.",
    );
  }
  // Convert the TS object literal to JSON-ish:
  //   - strip trailing commas
  //   - quote bare property keys
  let body = match[1]
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([{,]\s*)([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":');
  // Voice scripts use plain strings — already quoted, so this should parse.
  const parsed = JSON.parse(body);
  return parsed;
}

/* ───── main ───── */

async function main() {
  await loadEnvLocal();
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.ELEVEN_API_KEY;
  const defaultVoiceId = process.env.ELEVEN_VOICE_ID;
  if (!apiKey || !defaultVoiceId) {
    if (!args.dryRun) {
      console.error(
        "❌ ELEVEN_API_KEY and ELEVEN_VOICE_ID must be set in .env.local " +
        "(or as live env vars). Aborting.",
      );
      process.exit(1);
    }
  }

  const voices = await loadVoices();
  const ids = args.plants ?? Object.keys(voices);
  const langs = args.lang ? [args.lang] : ["tr", "en"];

  const outDir = path.join(ROOT, "public", "audio", "plants");
  await fs.mkdir(outDir, { recursive: true });

  const manifestPath = path.join(outDir, "_manifest.json");
  let manifest = {};
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {
    /* first run */
  }

  const { synthesizeMp3, ttsCacheHash } = await loadElevenlabsModule();

  let done = 0;
  let skipped = 0;
  let failed = 0;
  const startedAt = Date.now();

  for (const id of ids) {
    const script = voices[id];
    if (!script) {
      console.warn(`! ${id}: no voice script in data/plant-voices.ts — skipping`);
      continue;
    }
    const voiceId = script.voiceId ?? defaultVoiceId;
    const modelId = script.model ?? "eleven_multilingual_v2";

    for (const lang of langs) {
      const text = script.lines.map((l) => l[lang]).join(" ");
      const req = { text, voiceId, modelId };
      const hash = await ttsCacheHash(req);

      const fileKey = `${id}.${lang}.mp3`;
      const fileAbs = path.join(outDir, fileKey);
      const cached = manifest[fileKey];

      if (!args.force && cached?.hash === hash) {
        try {
          const stat = await fs.stat(fileAbs);
          if (stat.size === cached.bytes && stat.size > 1024) {
            console.log(`✓ ${fileKey} cached (${stat.size}B)`);
            skipped++;
            continue;
          }
        } catch {
          /* file gone, will regenerate */
        }
      }

      if (args.dryRun) {
        console.log(`· ${fileKey}  hash=${hash}  (dry-run)`);
        continue;
      }

      try {
        process.stdout.write(`→ ${fileKey} … `);
        const mp3 = await synthesizeMp3(req);
        await fs.writeFile(fileAbs, mp3);
        manifest[fileKey] = {
          hash,
          bytes: mp3.length,
          generatedAt: new Date().toISOString(),
          voiceId,
          modelId,
        };
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`done (${mp3.length}B)`);
        done++;
      } catch (err) {
        console.error(`failed: ${err?.message ?? err}`);
        failed++;
      }
    }
  }

  const took = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `\nfinished in ${took}s — generated ${done}, cached ${skipped}, failed ${failed}`,
  );
  if (failed > 0) process.exit(2);
}

/* ───── ESM-friendly loader for lib/elevenlabs.ts ─────
   The wrapper is TypeScript. We can't import .ts directly from a
   plain .mjs in older Node. Use Next's compiled output if it exists,
   else inline a minimal copy of the TTS function. */

async function loadElevenlabsModule() {
  // Try the compiled .next path first (works after a build).
  // Otherwise inline the same logic (same code as lib/elevenlabs.ts).
  return {
    synthesizeMp3: async (req) => {
      const apiKey = process.env.ELEVEN_API_KEY;
      if (!apiKey) throw new Error("ELEVEN_API_KEY missing");
      const {
        text,
        voiceId,
        modelId = "eleven_multilingual_v2",
        stability = 0.45,
        similarityBoost = 0.75,
        style = 0.35,
        useSpeakerBoost = true,
      } = req;
      const url =
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}` +
        `?output_format=mp3_44100_128`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: useSpeakerBoost,
          },
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText} ${detail.slice(0, 240)}`);
      }
      return Buffer.from(await res.arrayBuffer());
    },
    ttsCacheHash: async (req) => {
      const crypto = await import("node:crypto");
      const stable = JSON.stringify({
        text: req.text,
        voiceId: req.voiceId,
        modelId: req.modelId ?? "eleven_multilingual_v2",
        stability: req.stability ?? 0.45,
        similarityBoost: req.similarityBoost ?? 0.75,
        style: req.style ?? 0.35,
        useSpeakerBoost: req.useSpeakerBoost ?? true,
      });
      return crypto.createHash("sha256").update(stable).digest("hex").slice(0, 16);
    },
  };
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});

/* satisfy linters about unused imports */
void pathToFileURL;
