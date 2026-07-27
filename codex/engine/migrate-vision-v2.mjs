// CAELINUS CODEX — deterministic Image Intelligence v1 → v2 pilot migration.
// No model calls. Never reads or writes data/images.json.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ENTITIES } from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CODEX_ROOT = path.resolve(__dirname, '..');
const SOURCE_FILE = path.join(CODEX_ROOT, 'data', 'vision-pilot.json');
const LEGACY_IMAGES_FILE = path.join(CODEX_ROOT, 'data', 'images.json');
const CODEX_FILE = path.join(CODEX_ROOT, 'data', 'codex.json');
const OUTPUT_FILE = path.join(CODEX_ROOT, 'data', 'vision-pilot.v2.json');
const PILOT_IDS = ['IMG-CAEL-0001', 'IMG-CAEL-0038', 'IMG-CAEL-0132'];
const MIGRATION_VERSION = 'vision-pilot-v1-to-v2.0.0';
const RELATION_TYPES = [
  'bible', 'volume', 'chapter', 'page', 'npc', 'profession',
  'gameplay_system', 'economy', 'quest', 'production_chain',
  'unreal_asset', 'concept_art', 'related_image', 'entity', 'cross_reference',
];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const stableUnique = (values) => [...new Set(values.filter(Boolean))];
const legacyContractContent = (document) => JSON.stringify({
  ...document,
  generatedAt: null,
});

function writeAtomic(file, value) {
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

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

function aspectRatio(width, height) {
  const divisor = gcd(width, height);
  return {
    decimal: Number((width / height).toFixed(6)),
    label: `${width / divisor}:${height / divisor}`,
    orientation: width === height ? 'square' : width > height ? 'landscape' : 'portrait',
  };
}

function creationDateFromFileName(fileName) {
  const months = {
    Oca: 0, Şub: 1, Mar: 2, Nis: 3, May: 4, Haz: 5,
    Tem: 6, Ağu: 7, Eyl: 8, Eki: 9, Kas: 10, Ara: 11,
  };
  const match = fileName.match(/(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]{3})\s+(\d{4})\s+(\d{2})_(\d{2})_(\d{2})/u);
  if (!match || months[match[2]] == null) return null;
  const [, day, month, year, hour, minute, second] = match;
  return new Date(Date.UTC(+year, months[month], +day, +hour - 3, +minute, +second)).toISOString();
}

function relationId(assetId, relationType, targetId, label) {
  return `rel-${sha256(`${assetId}|${relationType}|${targetId || ''}|${label}`).slice(0, 16)}`;
}

function relation(assetId, relationType, {
  targetId = null,
  label,
  evidence,
  confidence,
  origin = 'canon_candidate',
  notes = null,
}) {
  return {
    relationId: relationId(assetId, relationType, targetId, label),
    relationType,
    targetId,
    label,
    evidence: [{ text: evidence || 'AI candidate; editorial evidence required.', origin }],
    confidence: Math.max(0, Math.min(1, confidence ?? 0)),
    verificationState: 'analyzed',
    source: 'ai',
    notes,
  };
}

function facet(value, evidence, confidence) {
  return {
    value,
    evidence,
    confidence: Math.max(0, Math.min(1, confidence)),
    verificationState: 'analyzed',
  };
}

function matchingFacets(values, patterns, fallbackEvidence, confidence) {
  return stableUnique(values.filter((value) => patterns.some((pattern) => pattern.test(fold(value)))))
    .map((value) => facet(value, fallbackEvidence, confidence));
}

function sectionIndexes(codex) {
  const byId = new Map();
  const volumeBySection = new Map();
  for (const bible of codex.bibles) {
    for (const section of bible.sections) byId.set(section.id, { ...section, bibleId: bible.id });
  }
  for (const volume of codex.volumes) {
    for (const section of volume.sections) {
      volumeBySection.set(section.id, {
        id: volume.id,
        title: volume.volumeTitle,
      });
    }
  }
  return { byId, volumeBySection };
}

function buildRelations(record, indexes, entityById) {
  const assetId = record.asset.id;
  const relations = [];

  for (const bible of record.canon.relatedBibles) {
    relations.push(relation(assetId, 'bible', {
      targetId: bible.id,
      label: bible.id,
      evidence: bible.evidence,
      confidence: bible.confidence,
    }));
    for (const sectionId of bible.sectionIds) {
      const section = indexes.byId.get(sectionId);
      const relationType = section?.kind === 'page' ? 'page' : 'chapter';
      relations.push(relation(assetId, relationType, {
        targetId: sectionId,
        label: section?.title || sectionId,
        evidence: bible.evidence,
        confidence: bible.confidence,
      }));
      const volume = indexes.volumeBySection.get(sectionId);
      if (volume) {
        relations.push(relation(assetId, 'volume', {
          targetId: volume.id,
          label: volume.title,
          evidence: `Section ${sectionId} belongs to source volume ${volume.title}.`,
          confidence: bible.confidence,
        }));
      }
    }
  }

  for (const entity of record.canon.relatedEntities) {
    relations.push(relation(assetId, 'entity', {
      targetId: entity.id,
      label: entityById.get(entity.id)?.label || entity.id,
      evidence: entity.evidence,
      confidence: entity.confidence,
    }));
    if (entityById.get(entity.id)?.type === 'profession') {
      relations.push(relation(assetId, 'profession', {
        targetId: entity.id,
        label: entityById.get(entity.id).label,
        evidence: entity.evidence,
        confidence: entity.confidence,
      }));
    }
  }

  for (const npc of record.npc) {
    relations.push(relation(assetId, 'npc', {
      targetId: npc.relatedEntityId,
      label: npc.nameOrRole,
      evidence: npc.evidence,
      confidence: npc.confidence,
      origin: npc.status === 'observed' ? 'visual' : 'canon_candidate',
    }));
  }
  for (const item of record.gameplay) {
    relations.push(relation(assetId, 'gameplay_system', {
      label: item.system,
      evidence: item.canonEvidence,
      confidence: item.confidence,
      notes: `${item.mechanic} — ${item.playerImpact}`,
    }));
  }
  for (const item of record.economy) {
    relations.push(relation(assetId, 'economy', {
      label: item.activity,
      evidence: item.canonEvidence,
      confidence: item.confidence,
      notes: `Value chain: ${item.valueChain.join(' → ')}; actors: ${item.actors.join(', ') || 'unknown'}`,
    }));
    relations.push(relation(assetId, 'production_chain', {
      label: item.valueChain.join(' → ') || item.activity,
      evidence: item.canonEvidence,
      confidence: item.confidence,
      notes: `Derived from AI economy candidate: ${item.activity}`,
    }));
  }
  for (const item of record.unrealAssets) {
    relations.push(relation(assetId, 'unreal_asset', {
      label: item.suggestedName,
      evidence: item.evidence,
      confidence: item.confidence,
      notes: `${item.assetType}: ${item.purpose}. ${item.implementationNotes.join(' ')}`,
    }));
  }
  return [...new Map(relations.map((item) => [item.relationId, item])).values()];
}

function visualMetadata(record, relations) {
  const observation = record.observation;
  const allEvidence = observation.visualEvidence || [];
  const sourceText = [observation.description, ...record.tags, ...allEvidence];
  const confidence = record.confidence.visual || record.confidence.overall;
  const style = matchingFacets(
    record.tags,
    [/infografik/, /poster/, /sunum/, /konsept/, /fantastik/, /render/, /referans/, /muze/],
    observation.description,
    confidence,
  );
  const composition = /cok panelli|çok panelli/u.test(fold(observation.description))
    ? [facet('Çok panelli bilgi/konsept panosu', observation.description, confidence)]
    : [];
  const lighting = matchingFacets(
    sourceText,
    [/isik/, /gunes/, /alev/, /karanlik/, /gece/, /gun batimi/, /altin saat/],
    observation.description,
    confidence,
  );
  const paletteWords = ['altın', 'siyah', 'lacivert', 'bakır', 'turuncu', 'kahverengi', 'sarı', 'kırmızı'];
  const colorPalette = paletteWords
    .filter((color) => fold(sourceText.join(' ')).includes(fold(color)))
    .map((color) => facet(color, observation.description, confidence));
  const cameraAngle = /pano|poster|infografik/u.test(fold([observation.title, ...record.tags].join(' ')))
    ? [facet('Düz, önden pano görünümü', observation.title, confidence)]
    : [];
  const pillarIds = new Set(['isik', 'yasamagaci', 'hafiza', 'ilknefes', 'ait', 'digitaltwin', 'onelaw']);
  const symbolicObjects = relations
    .filter((item) => item.relationType === 'entity' && pillarIds.has(item.targetId))
    .map((item) => facet(item.label, item.evidence[0].text, item.confidence));

  return {
    verificationState: 'analyzed',
    title: { tr: observation.title },
    detailedVisualDescription: { tr: observation.description },
    artisticStyle: style,
    composition,
    lighting,
    colorPalette,
    mood: [],
    environment: stableUnique(observation.environment).map((value) =>
      facet(value, observation.description, confidence)),
    materials: stableUnique(observation.materials).map((value) =>
      facet(value, observation.description, confidence)),
    cameraAngle,
    symbolicObjects,
    visibleText: observation.visibleText.map((item) => ({
      ...item,
      verificationState: 'analyzed',
    })),
    relations,
  };
}

function semanticLayer(record, relations, entityById) {
  const relatedEntities = relations.filter((item) => item.relationType === 'entity');
  const crossReferences = relations
    .filter((item) => item.relationType === 'chapter' || item.relationType === 'page')
    .map((item) => ({
      ...item,
      relationId: relationId(record.asset.id, 'cross_reference', item.targetId, item.label),
      relationType: 'cross_reference',
    }));
  const aliases = relatedEntities.flatMap((item) => entityById.get(item.targetId)?.aliases || []);
  const searchTerms = stableUnique([
    ...record.tags,
    record.observation.title,
    ...record.observation.objects,
    ...record.observation.characters,
    ...record.observation.environment,
    ...record.observation.materials,
    ...relatedEntities.map((item) => item.label),
  ].map(fold));
  return {
    keywords: { tr: stableUnique(record.tags.map(fold)) },
    searchTerms: { tr: searchTerms },
    synonyms: { tr: stableUnique(aliases.map(fold)) },
    relatedEntities,
    crossReferences,
  };
}

function migrateRecord(record, sourceDocument, codex, indexes, entityById) {
  const relations = buildRelations(record, indexes, entityById);
  const candidateMetadata = visualMetadata(record, relations);
  const semantic = semanticLayer(record, relations, entityById);
  const missingFields = [
    'artisticStyle', 'composition', 'lighting', 'colorPalette', 'mood',
    'environment', 'materials', 'cameraAngle', 'symbolicObjects',
    'searchTerms', 'synonyms',
  ].filter((field) => {
    if (field === 'searchTerms' || field === 'synonyms') return semantic[field].tr.length === 0;
    return candidateMetadata[field].length === 0;
  });
  const relationTypes = new Set([
    ...relations.map((item) => item.relationType),
    ...semantic.crossReferences.map((item) => item.relationType),
  ]);
  const missingRelations = RELATION_TYPES.filter((type) => !relationTypes.has(type));
  const sourceRecordJson = JSON.stringify(record);
  const semanticText = [
    record.observation.title,
    record.observation.description,
    ...record.tags,
    ...relations.map((item) => `${item.relationType}: ${item.label}`),
  ].join('\n');

  return {
    identity: {
      assetId: record.asset.id,
      legacyManifestId: record.asset.manifestId,
      fileName: record.asset.file,
      source: {
        kind: 'local_archive',
        path: record.asset.path,
        originalFilePreserved: true,
      },
      creationDate: creationDateFromFileName(record.asset.file),
      creationDateSource: creationDateFromFileName(record.asset.file) ? 'filename' : 'unknown',
      resolution: { width: record.asset.width, height: record.asset.height },
      aspectRatio: aspectRatio(record.asset.width, record.asset.height),
      format: record.asset.format,
      bytes: record.asset.bytes,
      sha256: record.asset.sha256,
    },
    rawAi: {
      provider: 'openai',
      model: record.asset.model || sourceDocument.model,
      promptVersion: record.asset.promptVersion || sourceDocument.promptVersion,
      analyzedAt: record.asset.analyzedAt,
      usage: record.usage,
      output: record,
    },
    candidateMetadata,
    canonicalMetadata: {
      verificationState: 'analyzed',
      reviewedBy: null,
      reviewedAt: null,
      verifiedBy: null,
      verifiedAt: null,
      claims: [],
      editorialNotes: [],
    },
    semanticLayer: semantic,
    quality: {
      verificationStatus: 'analyzed',
      overallConfidence: record.confidence.overall,
      fieldConfidence: Object.fromEntries(
        Object.entries(record.confidence).filter(([, value]) => typeof value === 'number'),
      ),
      uncertainties: record.confidence.uncertainties,
      missingFields,
      missingRelations,
      duplicateCandidates: [],
    },
    indexing: {
      languages: ['tr'],
      semanticText: { tr: semanticText },
      embedding: {
        status: 'pending',
        provider: null,
        model: null,
        dimensions: null,
        vectorId: null,
        contentHash: sha256(semanticText),
      },
      graph: {
        nodeId: `image:${record.asset.id}`,
        edgeCandidateCount: relations.length,
        status: 'pending_review',
      },
    },
    migration: {
      migrationVersion: MIGRATION_VERSION,
      migratedAt: sourceDocument.generatedAt,
      sourceRecordSha256: sha256(sourceRecordJson),
      losslessRawAiCopy: JSON.stringify(record) === JSON.stringify(JSON.parse(sourceRecordJson)),
      rollback: {
        strategy: 'disable_v2_consumer_and_restore_v1_read_path',
        sourcePreserved: true,
        legacyContractUntouched: true,
      },
    },
  };
}

function main() {
  const sourceBytes = fs.readFileSync(SOURCE_FILE);
  const legacyImagesBytes = fs.readFileSync(LEGACY_IMAGES_FILE);
  const source = JSON.parse(sourceBytes.toString('utf8'));
  const legacyImages = JSON.parse(legacyImagesBytes.toString('utf8'));
  const codex = readJson(CODEX_FILE);
  const indexes = sectionIndexes(codex);
  const entityById = new Map(ENTITIES.map((entity) => [entity.id, entity]));
  const selected = PILOT_IDS.map((assetId) => {
    const record = source.results.find((item) => item.asset.id === assetId);
    if (!record) throw new Error(`Missing approved pilot record: ${assetId}`);
    return record;
  });

  const output = {
    schemaVersion: '2.0.0',
    migrationVersion: MIGRATION_VERSION,
    sourceContract: {
      file: 'codex/data/vision-pilot.json',
      schemaVersion: source.schemaVersion,
      sha256: sha256(sourceBytes),
    },
    legacyContract: {
      file: 'codex/data/images.json',
      fileSha256AtMigration: sha256(legacyImagesBytes),
      contentSha256AtMigration: sha256(legacyContractContent(legacyImages)),
      total: legacyImages.total,
      analyzed: legacyImages.analyzed,
      modifiedByMigration: false,
    },
    generatedAt: source.generatedAt,
    productionIntegration: 'blocked_pending_approval',
    assetCount: selected.length,
    assets: selected.map((record) =>
      migrateRecord(record, source, codex, indexes, entityById)),
  };
  writeAtomic(OUTPUT_FILE, output);
  console.log(`Image Intelligence v2 migration complete: ${output.assetCount} assets`);
  console.log(`Production integration: ${output.productionIntegration}`);
}

main();
