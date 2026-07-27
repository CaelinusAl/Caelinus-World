// CAELINUS CODEX — Phase 3.5 local image similarity graph.
// Computes visual descriptors only. No AI calls and no canonical relationships.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { ASSET_DIR, DATA_DIR } from './config.mjs';

const MANIFEST_FILE = path.join(DATA_DIR, 'images.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'image-similarity-graph.v1.json');
const TOP_K = 8;
const MIN_SCORE = {
  pHash: 0.82,
  color_layout: 0.975,
};
const ALGORITHM_VERSION = {
  pHash: 'dct32-low8-v1',
  color_layout: 'rgb-grid4x4-v1',
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const round = (value, digits = 6) => Number(value.toFixed(digits));
const clamp = (value) => Math.max(0, Math.min(1, value));

function writeAtomic(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, file);
}

function stableManifestContent(manifest) {
  return JSON.stringify({ ...manifest, generatedAt: null });
}

function dctPerceptualHash(pixels) {
  const size = 32;
  const low = 8;
  const coefficients = [];
  const cosine = Array.from({ length: low }, (_, u) =>
    Array.from({ length: size }, (_, x) =>
      Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size))));

  for (let v = 0; v < low; v++) {
    for (let u = 0; u < low; u++) {
      let sum = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          sum += pixels[y * size + x] * cosine[u][x] * cosine[v][y];
        }
      }
      coefficients.push(sum);
    }
  }

  const withoutDc = coefficients.slice(1).sort((a, b) => a - b);
  const median = withoutDc[Math.floor(withoutDc.length / 2)];
  let value = 0n;
  for (const coefficient of coefficients) {
    value = (value << 1n) | (coefficient >= median ? 1n : 0n);
  }
  return value.toString(16).padStart(16, '0');
}

async function descriptorsFor(file) {
  const source = fs.readFileSync(file);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions: ${file}`);
  const grayscale = await sharp(source)
    .resize(32, 32, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();
  const color = await sharp(source)
    .resize(4, 4, { fit: 'fill' })
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer();
  if (color.length !== 48) throw new Error(`Unexpected color descriptor size: ${file}`);
  return {
    sha256: sha256(source),
    width: metadata.width,
    height: metadata.height,
    pHash: dctPerceptualHash(grayscale),
    colorLayout: [...color].map((channel) => round(channel / 255)),
  };
}

function hammingSimilarity(a, b) {
  let xor = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let distance = 0;
  while (xor) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return round(1 - distance / 64);
}

function colorLayoutSimilarity(a, b) {
  let squared = 0;
  for (let i = 0; i < a.length; i++) squared += (a[i] - b[i]) ** 2;
  return round(clamp(1 - Math.sqrt(squared) / Math.sqrt(a.length)));
}

function confidenceFor(algorithm, score) {
  const floor = algorithm === 'pHash' ? 0.50 : 0.65;
  return round(clamp((score - floor) / (1 - floor)));
}

function edgeId(algorithm, a, b) {
  return `sim-${sha256(`${algorithm}|${a}|${b}`).slice(0, 20)}`;
}

function scoreSummary(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
  return {
    minimum: round(sorted[0]),
    maximum: round(sorted.at(-1)),
    mean: round(mean),
    median: round(median),
  };
}

function selectedEdges(pairs, algorithm, generatedAt, assetIds) {
  const byAsset = new Map(assetIds.map((id) => [id, []]));
  for (const pair of pairs) {
    byAsset.get(pair.a).push(pair);
    byAsset.get(pair.b).push(pair);
  }
  const selected = new Map();

  const add = (pair, discoveredBy) => {
    const sourceAsset = pair.a < pair.b ? pair.a : pair.b;
    const targetAsset = pair.a < pair.b ? pair.b : pair.a;
    const key = `${algorithm}|${sourceAsset}|${targetAsset}`;
    const existing = selected.get(key);
    if (existing) {
      existing.discoveredBy = [...new Set([...existing.discoveredBy, ...discoveredBy])].sort();
      return;
    }
    selected.set(key, {
      edgeId: edgeId(algorithm, sourceAsset, targetAsset),
      source: `similarity:${sourceAsset}`,
      target: `similarity:${targetAsset}`,
      similarityScore: pair[algorithm],
      algorithm,
      confidence: confidenceFor(algorithm, pair[algorithm]),
      createdAt: generatedAt,
      verificationState: 'analyzed',
      canonical: false,
      discoveredBy: [...discoveredBy].sort(),
    });
  };

  for (const [assetId, neighbors] of byAsset) {
    neighbors.sort((a, b) => b[algorithm] - a[algorithm] ||
      `${a.a}|${a.b}`.localeCompare(`${b.a}|${b.b}`));
    for (const pair of neighbors.slice(0, TOP_K)) add(pair, [assetId]);
  }
  for (const pair of pairs) {
    if (pair[algorithm] >= MIN_SCORE[algorithm]) add(pair, [pair.a, pair.b]);
  }
  return [...selected.values()].sort((a, b) =>
    a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  if (manifest.total !== 132 || manifest.images.length !== 132) {
    throw new Error(`Expected 132 assets, got ${manifest.images.length}`);
  }
  const generatedAt = new Date().toISOString();
  const nodes = [];

  for (let index = 0; index < manifest.images.length; index++) {
    const image = manifest.images[index];
    const assetId = `IMG-CAEL-${String(index + 1).padStart(4, '0')}`;
    const descriptors = await descriptorsFor(path.join(ASSET_DIR, image.file));
    nodes.push({
      nodeId: `similarity:${assetId}`,
      assetId,
      legacyManifestId: image.id,
      fileName: image.file,
      sha256: descriptors.sha256,
      width: descriptors.width,
      height: descriptors.height,
      descriptors: {
        pHash: descriptors.pHash,
        colorLayout: descriptors.colorLayout,
      },
    });
    process.stdout.write(`\rDescriptors ${index + 1}/${manifest.images.length}`);
  }
  process.stdout.write('\n');

  const pairs = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      pairs.push({
        a: nodes[i].assetId,
        b: nodes[j].assetId,
        pHash: hammingSimilarity(nodes[i].descriptors.pHash, nodes[j].descriptors.pHash),
        color_layout: colorLayoutSimilarity(
          nodes[i].descriptors.colorLayout,
          nodes[j].descriptors.colorLayout,
        ),
      });
    }
  }

  const assetIds = nodes.map((node) => node.assetId);
  const pHashEdges = selectedEdges(pairs, 'pHash', generatedAt, assetIds);
  const colorEdges = selectedEdges(pairs, 'color_layout', generatedAt, assetIds);
  const edges = [...pHashEdges, ...colorEdges].sort((a, b) =>
    a.algorithm.localeCompare(b.algorithm) ||
    a.source.localeCompare(b.source) ||
    a.target.localeCompare(b.target));
  const possibleDuplicatePairs = pairs.filter((pair) =>
    pair.pHash >= 0.95 && pair.color_layout >= 0.95).length;

  const output = {
    schemaVersion: '1.0.0',
    graphType: 'visual_similarity',
    generatedAt,
    productionIntegration: 'blocked_pending_approval',
    canonicalIsolation: {
      canonicalRelationshipsIncluded: false,
      canonicalMetadataModified: false,
      humanApprovalRequired: true,
    },
    sourceManifest: {
      file: 'codex/data/images.json',
      contentSha256: sha256(stableManifestContent(manifest)),
      assetDirectory: 'local://CODEX_ASSET_DIR',
      assetCount: manifest.images.length,
    },
    algorithms: {
      pHash: {
        version: ALGORITHM_VERSION.pHash,
        descriptor: '32×32 grayscale DCT; median-thresholded 8×8 low frequencies',
        topK: TOP_K,
        minimumScore: MIN_SCORE.pHash,
      },
      color_layout: {
        version: ALGORITHM_VERSION.color_layout,
        descriptor: '4×4 sRGB normalized mean layout (48 channels)',
        topK: TOP_K,
        minimumScore: MIN_SCORE.color_layout,
      },
    },
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
    statistics: {
      pairsEvaluated: pairs.length,
      edgesByAlgorithm: {
        pHash: pHashEdges.length,
        color_layout: colorEdges.length,
      },
      scoreByAlgorithm: {
        pHash: scoreSummary(pairs.map((pair) => pair.pHash)),
        color_layout: scoreSummary(pairs.map((pair) => pair.color_layout)),
      },
      nodesWithNeighbors: new Set(edges.flatMap((edge) => [edge.source, edge.target])).size,
      possibleDuplicatePairs,
    },
  };
  writeAtomic(OUTPUT_FILE, output);
  console.log(`Similarity graph complete: ${nodes.length} nodes, ${edges.length} edges`);
  console.log(`Possible duplicate pairs: ${possibleDuplicatePairs}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
