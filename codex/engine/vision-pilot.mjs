// CAELINUS CODEX — Phase 3 Vision Pilot
// Analyzes exactly three approved assets. It never mutates images.json or canon.
// Run: node --env-file=.env.local codex/engine/vision-pilot.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { ASSET_DIR, BIBLES, ENTITIES, DATA_DIR } from './config.mjs';

const PILOT_IDS = Object.freeze(['IMG-CAEL-0001', 'IMG-CAEL-0038', 'IMG-CAEL-0132']);
const MODEL = process.env.CODEX_VISION_MODEL || 'gpt-5.4';
const PROMPT_VERSION = 'phase3-pilot-v1';
const OUTPUT_FILE = path.join(DATA_DIR, 'vision-pilot.json');
const IMAGE_MANIFEST = path.join(DATA_DIR, 'images.json');
const CODEX_FILE = path.join(DATA_DIR, 'codex.json');
const BIBLE_IDS = BIBLES.map((b) => b.id);
const ENTITY_IDS = ENTITIES.map((e) => e.id);
const STATUS = z.enum(['observed', 'canon_match', 'unverified']);

const extractionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(40),
  visibleText: z.array(z.object({
    text: z.string(),
    location: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  objects: z.array(z.string()),
  characters: z.array(z.string()),
  environment: z.array(z.string()),
  materials: z.array(z.string()),
  visualEvidence: z.array(z.string()),
  tags: z.array(z.string()),
  uncertainties: z.array(z.string()),
  confidence: z.object({
    visual: z.number().min(0).max(1),
    ocr: z.number().min(0).max(1),
  }),
});

const groundingSchema = z.object({
  relatedBibles: z.array(z.object({
    id: z.enum(BIBLE_IDS),
    sectionIds: z.array(z.string()),
    evidence: z.string(),
    confidence: z.number().min(0).max(1),
    status: STATUS,
  })),
  relatedEntities: z.array(z.object({
    id: z.enum(ENTITY_IDS),
    evidence: z.string(),
    confidence: z.number().min(0).max(1),
    status: STATUS,
  })),
  npc: z.array(z.object({
    nameOrRole: z.string(),
    relatedEntityId: z.enum(ENTITY_IDS).nullable(),
    evidence: z.string(),
    confidence: z.number().min(0).max(1),
    status: STATUS,
  })),
  gameplay: z.array(z.object({
    system: z.string(),
    mechanic: z.string(),
    playerImpact: z.string(),
    canonEvidence: z.string(),
    confidence: z.number().min(0).max(1),
    status: STATUS,
  })),
  economy: z.array(z.object({
    activity: z.string(),
    valueChain: z.array(z.string()),
    actors: z.array(z.string()),
    canonEvidence: z.string(),
    confidence: z.number().min(0).max(1),
    status: STATUS,
  })),
  unrealAssets: z.array(z.object({
    assetType: z.enum([
      'environment', 'prop', 'character', 'material', 'vfx', 'ui',
      'animation', 'blueprint', 'audio',
    ]),
    suggestedName: z.string(),
    purpose: z.string(),
    implementationNotes: z.array(z.string()),
    evidence: z.string(),
    confidence: z.number().min(0).max(1),
    status: STATUS,
  })),
  confidence: z.object({
    canon: z.number().min(0).max(1),
    npc: z.number().min(0).max(1),
    gameplay: z.number().min(0).max(1),
    economy: z.number().min(0).max(1),
    unrealAssets: z.number().min(0).max(1),
    overall: z.number().min(0).max(1),
    uncertainties: z.array(z.string()),
  }),
});

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, file);
}

function fold(value) {
  return String(value || '')
    .toLocaleLowerCase('tr')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(fold(value).split(' ').filter((token) => token.length >= 4));
}

function sectionCandidates(codex, extraction) {
  const query = tokens([
    extraction.title,
    extraction.description,
    ...extraction.tags,
    ...extraction.objects,
    ...extraction.characters,
    ...extraction.materials,
    ...extraction.visibleText.map((item) => item.text),
  ].join(' '));

  return codex.bibles.flatMap((bible) => bible.sections.map((section) => {
    const haystack = tokens([
      section.title,
      section.excerpt,
      section.profession,
      ...(section.entities || []),
    ].join(' '));
    let score = 0;
    for (const token of query) if (haystack.has(token)) score += 1;
    return {
      score,
      bibleId: bible.id,
      sectionId: section.id,
      title: section.title,
      profession: section.profession || null,
      entities: section.entities || [],
      excerpt: String(section.excerpt || '').slice(0, 500),
    };
  }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);
}

async function imageViews(file) {
  const source = fs.readFileSync(file);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Dimensions unavailable: ${file}`);

  const width = metadata.width;
  const height = metadata.height;
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);
  const regions = [
    { name: 'üst-sol', left: 0, top: 0, width: halfW, height: halfH },
    { name: 'üst-sağ', left: width - halfW, top: 0, width: halfW, height: halfH },
    { name: 'alt-sol', left: 0, top: height - halfH, width: halfW, height: halfH },
    { name: 'alt-sağ', left: width - halfW, top: height - halfH, width: halfW, height: halfH },
  ];
  const crops = [];
  for (const region of regions) {
    crops.push({
      name: region.name,
      data: await sharp(source).extract(region).png().toBuffer(),
    });
  }
  return {
    source,
    crops,
    width,
    height,
    format: metadata.format || path.extname(file).slice(1),
    sha256: crypto.createHash('sha256').update(source).digest('hex'),
  };
}

async function extractVisual(asset, views) {
  const content = [
    {
      type: 'text',
      text: `Bu görseli yalnızca görülebilen kanıta dayanarak ayrıntılı analiz et.
Türkçe yaz. Küçük yazıları OCR ile mümkün olduğunca aynen aktar; emin olmadığın
metni uydurma ve uncertainties alanına koy. Caelinus kanonu hakkında çıkarım
yapma; bu aşama yalnızca görsel gözlemdir. İlk görsel tam kare, ardından sırasıyla
üst-sol, üst-sağ, alt-sol ve alt-sağ yakın görünümler gelir. Dosya: ${asset.file}`,
    },
    {
      type: 'image',
      image: views.source,
      mediaType: `image/${views.format === 'jpg' ? 'jpeg' : views.format}`,
      providerOptions: { openai: { imageDetail: 'high' } },
    },
  ];
  for (const crop of views.crops) {
    content.push({ type: 'text', text: `Yakın görünüm: ${crop.name}` });
    content.push({
      type: 'image',
      image: crop.data,
      mediaType: 'image/png',
      providerOptions: { openai: { imageDetail: 'high' } },
    });
  }

  const result = await generateText({
    model: openai.responses(MODEL),
    output: Output.object({ schema: extractionSchema }),
    maxRetries: 2,
    messages: [{ role: 'user', content }],
  });
  return { output: result.output, usage: result.usage };
}

async function groundCanon(extraction, candidates) {
  const taxonomy = {
    bibles: BIBLES.map(({ id, title, tr }) => ({ id, title, tr })),
    entities: ENTITIES.map(({ id, label, type, aliases }) => ({ id, label, type, aliases })),
    candidateSections: candidates,
  };
  const result = await generateText({
    model: openai.responses(MODEL),
    output: Output.object({ schema: groundingSchema }),
    maxRetries: 2,
    system: `Sen Caelinus Codex için kanon eşleme denetçisisin. Yeni lore yazma.
Yalnızca verilen görsel gözlemi ve taxonomy içindeki kanonik adayları kullan.
Doğrudan görsel kanıtı observed, açık kanon eşleşmesini canon_match, üretim
önerisini veya belirsiz ilişkiyi unverified işaretle. Unreal adları öneridir ve
daima unverified olmalıdır. Kanıt yoksa listeyi boş bırak. Confidence 0..1.`,
    prompt: JSON.stringify({ extraction, taxonomy }),
  });
  return { output: result.output, usage: result.usage };
}

function sumUsage(...values) {
  return values.reduce((total, usage) => ({
    inputTokens: total.inputTokens + (usage?.inputTokens || 0),
    outputTokens: total.outputTokens + (usage?.outputTokens || 0),
    totalTokens: total.totalTokens + (usage?.totalTokens || 0),
  }), { inputTokens: 0, outputTokens: 0, totalTokens: 0 });
}

function validateGrounding(grounding, codex) {
  const sectionIds = new Set(codex.bibles.flatMap((b) => b.sections.map((s) => s.id)));
  for (const link of grounding.relatedBibles) {
    link.sectionIds = link.sectionIds.filter((id) => sectionIds.has(id));
  }
  for (const asset of grounding.unrealAssets) asset.status = 'unverified';
  return grounding;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY missing. Run with: node --env-file=.env.local codex/engine/vision-pilot.mjs');
  }
  const manifest = readJson(IMAGE_MANIFEST);
  const codex = readJson(CODEX_FILE);
  const byId = new Map(manifest.images.map((image, index) => [
    `IMG-CAEL-${String(index + 1).padStart(4, '0')}`,
    image,
  ]));
  const selected = PILOT_IDS.map((id) => {
    const image = byId.get(id);
    if (!image) throw new Error(`Approved pilot asset missing: ${id}`);
    return { ...image, canonicalId: id };
  });

  const document = {
    schemaVersion: '1.0.0-pilot',
    phase: 3,
    status: 'pilot_unverified',
    approvedAssetIds: [...PILOT_IDS],
    model: MODEL,
    promptVersion: PROMPT_VERSION,
    generatedAt: null,
    analyzed: 0,
    results: [],
    failures: [],
  };
  writeAtomic(OUTPUT_FILE, document);

  for (const asset of selected) {
    console.log(`\n[${asset.canonicalId}] ${asset.file}`);
    try {
      const file = path.join(ASSET_DIR, asset.file);
      const views = await imageViews(file);
      const visual = await extractVisual(asset, views);
      const candidates = sectionCandidates(codex, visual.output);
      const grounded = await groundCanon(visual.output, candidates);
      const grounding = validateGrounding(grounded.output, codex);
      const confidence = {
        ...grounding.confidence,
        visual: visual.output.confidence.visual,
        ocr: visual.output.confidence.ocr,
        uncertainties: [
          ...new Set([
            ...visual.output.uncertainties,
            ...grounding.confidence.uncertainties,
          ]),
        ],
      };

      document.results.push({
        status: 'analyzed_unverified',
        asset: {
          id: asset.canonicalId,
          manifestId: asset.id,
          file: asset.file,
          path: asset.path,
          bytes: asset.bytes,
          sha256: views.sha256,
          width: views.width,
          height: views.height,
          format: views.format,
          model: MODEL,
          promptVersion: PROMPT_VERSION,
          analyzedAt: new Date().toISOString(),
        },
        observation: {
          title: visual.output.title,
          description: visual.output.description,
          visibleText: visual.output.visibleText,
          objects: visual.output.objects,
          characters: visual.output.characters,
          environment: visual.output.environment,
          materials: visual.output.materials,
          visualEvidence: visual.output.visualEvidence,
        },
        tags: [...new Set(visual.output.tags.map(fold).filter(Boolean))],
        canon: {
          relatedBibles: grounding.relatedBibles,
          relatedEntities: grounding.relatedEntities,
        },
        npc: grounding.npc,
        gameplay: grounding.gameplay,
        economy: grounding.economy,
        unrealAssets: grounding.unrealAssets,
        confidence,
        usage: sumUsage(visual.usage, grounded.usage),
      });
      document.analyzed = document.results.length;
      console.log(`  ✓ analyzed (${candidates.length} canon candidates)`);
    } catch (error) {
      document.failures.push({
        id: asset.canonicalId,
        message: error instanceof Error ? error.message : String(error),
      });
      console.error(`  ✗ ${document.failures.at(-1).message}`);
    }
    document.generatedAt = new Date().toISOString();
    writeAtomic(OUTPUT_FILE, document);
  }

  if (document.analyzed !== PILOT_IDS.length || document.failures.length) {
    throw new Error(`Pilot incomplete: ${document.analyzed}/${PILOT_IDS.length} analyzed`);
  }
  console.log(`\nVISION PILOT COMPLETE — ${document.analyzed} assets → ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(`\nVISION PILOT FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
