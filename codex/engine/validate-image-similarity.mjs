// CAELINUS CODEX — Phase 3.5 similarity graph quality gate.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CODEX_ROOT = path.resolve(__dirname, '..');
const SCHEMA_FILE = path.join(CODEX_ROOT, 'schema', 'image-similarity-graph.v1.schema.json');
const GRAPH_FILE = path.join(CODEX_ROOT, 'data', 'image-similarity-graph.v1.json');
const MANIFEST_FILE = path.join(CODEX_ROOT, 'data', 'images.json');
const ALGORITHMS = ['pHash', 'color_layout'];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

function stableManifestContent(manifest) {
  return JSON.stringify({ ...manifest, generatedAt: null });
}

function main() {
  const schema = readJson(SCHEMA_FILE);
  const graph = readJson(GRAPH_FILE);
  const manifest = readJson(MANIFEST_FILE);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(graph)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail('Similarity graph JSON Schema validation failed');
  }

  assert(graph.edgeCount === graph.edges.length, 'edgeCount mismatch');
  assert(graph.nodeCount === graph.nodes.length, 'nodeCount mismatch');
  assert(graph.sourceManifest.contentSha256 === sha256(stableManifestContent(manifest)),
    'Source images.json contract changed since index generation');
  assert(manifest.total === 132 && manifest.analyzed === 0,
    'Legacy images.json state changed');
  assert(graph.productionIntegration === 'blocked_pending_approval',
    'Production gate is not blocked');
  assert(graph.canonicalIsolation.canonicalRelationshipsIncluded === false &&
    graph.canonicalIsolation.canonicalMetadataModified === false,
  'Canonical isolation violated');

  const expectedIds = Array.from({ length: 132 }, (_, index) =>
    `IMG-CAEL-${String(index + 1).padStart(4, '0')}`);
  const nodeIds = graph.nodes.map((node) => node.assetId);
  assert(JSON.stringify(nodeIds) === JSON.stringify(expectedIds),
    'Node IDs do not cover the complete ordered manifest');
  assert(new Set(nodeIds).size === 132, 'Duplicate node IDs');

  const graphNodeIds = new Set(graph.nodes.map((node) => node.nodeId));
  const edgeIds = new Set();
  const neighbors = new Map(ALGORITHMS.map((algorithm) => [
    algorithm,
    new Map(graph.nodes.map((node) => [node.nodeId, new Set()])),
  ]));
  for (const edge of graph.edges) {
    assert(!edgeIds.has(edge.edgeId), `Duplicate edge ${edge.edgeId}`);
    edgeIds.add(edge.edgeId);
    assert(graphNodeIds.has(edge.source) && graphNodeIds.has(edge.target),
      `Unknown edge endpoint ${edge.edgeId}`);
    assert(edge.source < edge.target, `Edge endpoints not canonicalized ${edge.edgeId}`);
    assert(edge.createdAt === graph.generatedAt,
      `Edge timestamp differs from graph creation ${edge.edgeId}`);
    assert(edge.canonical === false && edge.verificationState === 'analyzed',
      `Canonical or verification violation ${edge.edgeId}`);
    neighbors.get(edge.algorithm).get(edge.source).add(edge.target);
    neighbors.get(edge.algorithm).get(edge.target).add(edge.source);
  }
  for (const algorithm of ALGORITHMS) {
    for (const [nodeId, linked] of neighbors.get(algorithm)) {
      assert(linked.size > 0, `${nodeId} has no ${algorithm} neighbor`);
    }
  }
  assert(graph.statistics.nodesWithNeighbors === 132,
    'Statistics node coverage mismatch');
  assert(graph.statistics.edgesByAlgorithm.pHash +
    graph.statistics.edgesByAlgorithm.color_layout === graph.edgeCount,
  'Algorithm edge counts do not sum to edgeCount');

  console.log('Image similarity graph validation: PASS');
  console.log(`  nodes: ${graph.nodeCount}/132`);
  console.log(`  pairs evaluated: ${graph.statistics.pairsEvaluated}`);
  console.log(`  edges: ${graph.edgeCount}`);
  console.log(`  pHash edges: ${graph.statistics.edgesByAlgorithm.pHash}`);
  console.log(`  color-layout edges: ${graph.statistics.edgesByAlgorithm.color_layout}`);
  console.log('  canonical edges: 0');
  console.log('  production consumers: blocked');
}

main();
