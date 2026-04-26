/**
 * Caelinus Avatar GLB Generator v2 — Smooth Lathe Mannequin
 *
 * Instead of primitive capsules, builds each body part with smooth
 * revolution geometry and Catmull-Rom interpolated radius profiles.
 * The result is a single-mesh, elegant fashion mannequin (~12k tris).
 *
 * Replace with a Blender/Sketchfab model anytime — code adapts automatically.
 *
 * Usage: node scripts/generate-avatar.mjs
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ═══════════════════════════════════════════
   CATMULL-ROM SPLINE
   ═══════════════════════════════════════════ */

function catmullRomInterp(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function interpolateProfile(points, stepsPerSegment = 6) {
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const steps = (i === points.length - 2) ? stepsPerSegment + 1 : stepsPerSegment;
    for (let s = 0; s < steps; s++) {
      const t = s / stepsPerSegment;
      result.push([
        catmullRomInterp(p0[0], p1[0], p2[0], p3[0], t),
        catmullRomInterp(p0[1], p1[1], p2[1], p3[1], t),
        catmullRomInterp(p0[2], p1[2], p2[2], p3[2], t),
      ]);
    }
  }
  return result;
}

/* ═══════════════════════════════════════════
   LATHE GEOMETRY GENERATOR
   ═══════════════════════════════════════════ */

function generateLathe(profile, radSegs = 24, offsetX = 0, offsetZ = 0) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i < profile.length; i++) {
    const [y, rx, rz] = profile[i];
    for (let j = 0; j <= radSegs; j++) {
      const theta = (2 * Math.PI * j) / radSegs;
      const cosT = Math.cos(theta), sinT = Math.sin(theta);
      positions.push(rx * cosT + offsetX, y, rz * sinT + offsetZ);
      const nx = cosT / (rx || 0.001);
      const nz = sinT / (rz || 0.001);
      const len = Math.sqrt(nx * nx + nz * nz) || 1;
      normals.push(nx / len, 0, nz / len);
    }
  }

  const vpr = radSegs + 1;
  for (let i = 0; i < profile.length - 1; i++) {
    for (let j = 0; j < radSegs; j++) {
      const a = i * vpr + j;
      const b = a + 1;
      const c = a + vpr;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  return { positions, normals, indices };
}

function generateSphere(radius, wSegs = 20, hSegs = 14) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let iy = 0; iy <= hSegs; iy++) {
    const phi = (iy / hSegs) * Math.PI;
    for (let ix = 0; ix <= wSegs; ix++) {
      const theta = (ix / wSegs) * Math.PI * 2;
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      positions.push(x, y, z);
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      normals.push(x / len, y / len, z / len);
    }
  }
  for (let iy = 0; iy < hSegs; iy++) {
    for (let ix = 0; ix < wSegs; ix++) {
      const a = iy * (wSegs + 1) + ix;
      const b = a + 1;
      const c = (iy + 1) * (wSegs + 1) + ix;
      const d = c + 1;
      if (iy !== 0) indices.push(a, c, b);
      if (iy !== hSegs - 1) indices.push(b, c, d);
    }
  }
  return { positions, normals, indices };
}

/* ═══════════════════════════════════════════
   TRANSFORM & MERGE
   ═══════════════════════════════════════════ */

function applyTransform(geo, tx = 0, ty = 0, tz = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
  const outPos = [], outNorm = [];
  for (let i = 0; i < geo.positions.length; i += 3) {
    let x = geo.positions[i] * sx, y = geo.positions[i + 1] * sy, z = geo.positions[i + 2] * sz;
    const rx = x * cosZ - y * sinZ, ry = x * sinZ + y * cosZ;
    outPos.push(rx + tx, ry + ty, z + tz);
    let nx = geo.normals[i] / sx, ny = geo.normals[i + 1] / sy, nz = geo.normals[i + 2] / sz;
    const rnx = nx * cosZ - ny * sinZ, rny = nx * sinZ + ny * cosZ;
    const len = Math.sqrt(rnx * rnx + rny * rny + nz * nz) || 1;
    outNorm.push(rnx / len, rny / len, nz / len);
  }
  return { positions: outPos, normals: outNorm, indices: [...geo.indices] };
}

function merge(parts) {
  const allPos = [], allNorm = [], allIdx = [];
  let offset = 0;
  for (const p of parts) {
    allPos.push(...p.positions);
    allNorm.push(...p.normals);
    for (const idx of p.indices) allIdx.push(idx + offset);
    offset += p.positions.length / 3;
  }
  return {
    positions: new Float32Array(allPos),
    normals: new Float32Array(allNorm),
    indices: new Uint16Array(allIdx),
  };
}

/* ═══════════════════════════════════════════
   BODY PARTS — Smooth fashion mannequin
   ═══════════════════════════════════════════ */

function createMannequin() {
  // --- TORSO: smooth lathe from hips to shoulders ---
  const torsoProfile = interpolateProfile([
    // [y,    rx,    rz]
    [0.95, 0.175, 0.105],  // low hip
    [1.05, 0.190, 0.115],  // widest hip
    [1.15, 0.180, 0.110],  // upper hip
    [1.25, 0.155, 0.095],  // hip-waist transition
    [1.38, 0.125, 0.085],  // waist (narrowest)
    [1.50, 0.145, 0.095],  // lower ribcage
    [1.62, 0.165, 0.110],  // underbust
    [1.72, 0.175, 0.115],  // bust
    [1.82, 0.155, 0.100],  // upper chest
    [1.92, 0.125, 0.075],  // shoulder base
    [1.98, 0.105, 0.065],  // shoulder top
  ], 5);

  // --- BUST ACCENTS ---
  const bustL = applyTransform(generateSphere(0.065, 14, 10), -0.09, 1.72, 0.09);
  const bustR = applyTransform(generateSphere(0.065, 14, 10), 0.09, 1.72, 0.09);

  // --- NECK ---
  const neckProfile = interpolateProfile([
    [1.98, 0.055, 0.050],
    [2.05, 0.042, 0.042],
    [2.12, 0.040, 0.040],
    [2.18, 0.042, 0.042],
  ], 4);

  // --- HEAD ---
  const head = applyTransform(generateSphere(0.145, 24, 16), 0, 2.33, 0);

  // --- LEFT LEG ---
  const legProfile = interpolateProfile([
    [-0.12, 0.035, 0.055],  // foot
    [0.00,  0.042, 0.042],  // ankle
    [0.08,  0.048, 0.046],  // lower shin
    [0.22,  0.055, 0.050],  // calf peak
    [0.38,  0.050, 0.046],  // upper shin
    [0.48,  0.046, 0.044],  // knee
    [0.58,  0.055, 0.052],  // lower thigh
    [0.72,  0.070, 0.065],  // mid thigh
    [0.85,  0.080, 0.075],  // upper thigh
    [0.95,  0.088, 0.082],  // thigh top
  ], 5);

  const legL = generateLathe(legProfile, 20, -0.09, 0);
  const legR = generateLathe(legProfile, 20, 0.09, 0);

  // --- LEFT ARM ---
  const armProfile = interpolateProfile([
    [1.03, 0.022, 0.022],  // hand
    [1.08, 0.028, 0.025],  // wrist
    [1.22, 0.032, 0.030],  // lower forearm
    [1.38, 0.035, 0.032],  // upper forearm
    [1.48, 0.033, 0.030],  // elbow
    [1.58, 0.040, 0.036],  // lower bicep
    [1.72, 0.045, 0.040],  // mid bicep
    [1.85, 0.048, 0.042],  // upper arm
    [1.95, 0.050, 0.044],  // shoulder joint
  ], 4);

  const armL = applyTransform(generateLathe(armProfile, 16), 0, 0, 0, 0, 1, 1, 1);
  const armR = applyTransform(generateLathe(armProfile, 16), 0, 0, 0, 0, 1, 1, 1);

  // Mirror arms to correct X positions
  const armLFinal = applyTransform(armL, -0.30, 0, 0, -0.12);
  const armRFinal = applyTransform(armR, 0.30, 0, 0, 0.12);

  // --- HANDS ---
  const handL = applyTransform(generateSphere(0.025, 10, 8), -0.34, 1.00, 0);
  const handR = applyTransform(generateSphere(0.025, 10, 8), 0.34, 1.00, 0);

  const torso = generateLathe(torsoProfile, 24);
  const neck = generateLathe(neckProfile, 16);

  return merge([
    torso, bustL, bustR,
    neck, head,
    legL, legR,
    armLFinal, armRFinal,
    handL, handR,
  ]);
}

/* ═══════════════════════════════════════════
   GLB BINARY WRITER
   ═══════════════════════════════════════════ */

function buildGLB(geo) {
  const { positions, normals, indices } = geo;
  const posBuf = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength);
  const normBuf = Buffer.from(normals.buffer, normals.byteOffset, normals.byteLength);
  const idxBuf = Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength);
  const posBL = posBuf.length, normBL = normBuf.length, idxBL = idxBuf.length;
  const totalBin = posBL + normBL + idxBL;
  const paddedBin = (totalBin + 3) & ~3;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);     minY = Math.min(minY, positions[i+1]); minZ = Math.min(minZ, positions[i+2]);
    maxX = Math.max(maxX, positions[i]);     maxY = Math.max(maxY, positions[i+1]); maxZ = Math.max(maxZ, positions[i+2]);
  }
  const r6 = n => Math.round(n * 1e6) / 1e6;
  const vtx = positions.length / 3, idx = indices.length;

  const gltf = {
    asset: { version: "2.0", generator: "Caelinus Avatar Generator v2" },
    scene: 0,
    scenes: [{ name: "Scene", nodes: [0] }],
    nodes: [{ name: "CaelinusMannequin", mesh: 0 }],
    meshes: [{ name: "Body", primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: vtx, type: "VEC3", min: [r6(minX), r6(minY), r6(minZ)], max: [r6(maxX), r6(maxY), r6(maxZ)] },
      { bufferView: 1, componentType: 5126, count: vtx, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: idx, type: "SCALAR" },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBL, target: 34962 },
      { buffer: 0, byteOffset: posBL, byteLength: normBL, target: 34962 },
      { buffer: 0, byteOffset: posBL + normBL, byteLength: idxBL, target: 34963 },
    ],
    buffers: [{ byteLength: totalBin }],
    materials: [{
      name: "LightBody",
      pbrMetallicRoughness: { baseColorFactor: [0.95, 0.94, 0.91, 0.96], metallicFactor: 0.05, roughnessFactor: 0.18 },
      emissiveFactor: [0.22, 0.48, 0.58],
      alphaMode: "BLEND",
    }],
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonBytes = Buffer.from(jsonStr, "utf8");
  const jsonPadded = (jsonBytes.length + 3) & ~3;
  const jsonBuf = Buffer.alloc(jsonPadded, 0x20);
  jsonBytes.copy(jsonBuf);

  const binBuf = Buffer.alloc(paddedBin);
  posBuf.copy(binBuf, 0);
  normBuf.copy(binBuf, posBL);
  idxBuf.copy(binBuf, posBL + normBL);

  const totalLen = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(totalLen, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(binBuf.length, 0); bh.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jh, jsonBuf, bh, binBuf]);
}

/* ═══════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════ */

console.log("Generating Caelinus smooth mannequin v2...");
const geo = createMannequin();
console.log(`  Vertices: ${geo.positions.length / 3}, Triangles: ${geo.indices.length / 3}`);

const glb = buildGLB(geo);
console.log(`  GLB size: ${(glb.length / 1024).toFixed(1)} KB`);

const outDir = join(__dirname, "..", "public", "models");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "caelinus-avatar.glb");
writeFileSync(outPath, glb);
console.log(`  Written: ${outPath}`);
console.log("Done! Smooth lathe mannequin generated.");
