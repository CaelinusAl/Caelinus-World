// CAELINUS CODEX — Image Intelligence v2 quality gate.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CODEX_ROOT = path.resolve(__dirname, '..');
const files = {
  schema: path.join(CODEX_ROOT, 'schema', 'image-asset.v2.schema.json'),
  v2: path.join(CODEX_ROOT, 'data', 'vision-pilot.v2.json'),
  v1: path.join(CODEX_ROOT, 'data', 'vision-pilot.json'),
  images: path.join(CODEX_ROOT, 'data', 'images.json'),
  codex: path.join(CODEX_ROOT, 'data', 'codex.json'),
};
const EXPECTED_IDS = ['IMG-CAEL-0001', 'IMG-CAEL-0038', 'IMG-CAEL-0132'];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const legacyContractContent = (document) => JSON.stringify({
  ...document,
  generatedAt: null,
});
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

function validateReferences(document, codex) {
  const bibleIds = new Set(codex.bibles.map((bible) => bible.id));
  const entityIds = new Set(codex.graph.nodes.map((node) => node.id));
  const sectionIds = new Set(codex.bibles.flatMap((bible) =>
    bible.sections.map((section) => section.id)));
  const volumeIds = new Set(codex.volumes.map((volume) => volume.id));

  for (const asset of document.assets) {
    for (const relation of asset.candidateMetadata.relations) {
      if (relation.relationType === 'bible') {
        assert(bibleIds.has(relation.targetId),
          `${asset.identity.assetId}: invalid Bible ${relation.targetId}`);
      }
      if (relation.relationType === 'entity' || relation.relationType === 'profession') {
        assert(entityIds.has(relation.targetId),
          `${asset.identity.assetId}: invalid entity ${relation.targetId}`);
      }
      if (relation.relationType === 'chapter' || relation.relationType === 'page') {
        assert(sectionIds.has(relation.targetId),
          `${asset.identity.assetId}: invalid section ${relation.targetId}`);
      }
      if (relation.relationType === 'volume') {
        assert(volumeIds.has(relation.targetId),
          `${asset.identity.assetId}: invalid volume ${relation.targetId}`);
      }
    }
    for (const crossRef of asset.semanticLayer.crossReferences) {
      assert(sectionIds.has(crossRef.targetId),
        `${asset.identity.assetId}: invalid cross-reference ${crossRef.targetId}`);
    }
  }
}

function validateNoAutomaticVerification(document) {
  const visit = (value, pointer = '$') => {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${pointer}/${index}`));
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if ((key === 'verificationState' || key === 'verificationStatus') && child === 'verified') {
        fail(`Automatic verified state forbidden at ${pointer}/${key}`);
      }
      visit(child, `${pointer}/${key}`);
    }
  };
  visit(document);
  for (const asset of document.assets) {
    assert(asset.canonicalMetadata.claims.length === 0,
      `${asset.identity.assetId}: canonical claims must remain empty before review`);
    assert(asset.canonicalMetadata.reviewedBy === null &&
      asset.canonicalMetadata.verifiedBy === null,
    `${asset.identity.assetId}: human reviewer fields must be null`);
  }
}

function validateLosslessMigration(document, source) {
  for (const asset of document.assets) {
    const original = source.results.find((record) =>
      record.asset.id === asset.identity.assetId);
    assert(original, `${asset.identity.assetId}: missing v1 source`);
    assert(JSON.stringify(asset.rawAi.output) === JSON.stringify(original),
      `${asset.identity.assetId}: raw AI output is not lossless`);
    assert(asset.migration.sourceRecordSha256 === sha256(JSON.stringify(original)),
      `${asset.identity.assetId}: source record hash mismatch`);
    assert(asset.migration.losslessRawAiCopy === true,
      `${asset.identity.assetId}: lossless flag is false`);
  }
}

function main() {
  const schema = readJson(files.schema);
  const document = readJson(files.v2);
  const source = readJson(files.v1);
  const legacyBytes = fs.readFileSync(files.images);
  const legacy = JSON.parse(legacyBytes.toString('utf8'));
  const codex = readJson(files.codex);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(document)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail('JSON Schema validation failed');
  }

  assert(document.assetCount === 3 && document.assets.length === 3,
    'Quality gate requires exactly three assets');
  assert(JSON.stringify(document.assets.map((asset) => asset.identity.assetId)) ===
    JSON.stringify(EXPECTED_IDS), 'Pilot asset whitelist mismatch');
  assert(document.productionIntegration === 'blocked_pending_approval',
    'Production integration gate must remain blocked');
  assert(document.legacyContract.total === 132 &&
    document.legacyContract.analyzed === 0,
  'Legacy images.json contract changed');
  assert(document.legacyContract.contentSha256AtMigration ===
    sha256(legacyContractContent(legacy)),
  'Legacy images.json contract content changed after v2 migration');
  assert(legacy.total === 132 && legacy.analyzed === 0,
    'Legacy images.json values changed');

  validateReferences(document, codex);
  validateNoAutomaticVerification(document);
  validateLosslessMigration(document, source);

  const relationCount = document.assets.reduce((sum, asset) =>
    sum + asset.candidateMetadata.relations.length, 0);
  console.log('Image Intelligence v2 validation: PASS');
  console.log(`  schema: ${document.schemaVersion}`);
  console.log(`  assets: ${document.assetCount}/3`);
  console.log(`  candidate relations: ${relationCount}`);
  console.log('  canonical claims: 0');
  console.log('  automatic verified states: 0');
  console.log('  legacy images.json: unchanged (132 total, 0 analyzed)');
}

main();
