import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, simplify, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { Jimp } from 'jimp';

const INPUT = process.argv[2];
const OUTPUT = process.argv[3];
const RATIO = parseFloat(process.argv[4] ?? '0.82');
const ERROR = parseFloat(process.argv[5] ?? '0.008');
const MAXTEX = parseInt(process.argv[6] ?? '1024', 10);

function countTris(doc) {
  let t = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      t += idx ? idx.getCount() / 3 : prim.getAttribute('POSITION').getCount() / 3;
    }
  return Math.round(t);
}
function morphCount(doc) {
  let max = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives())
      max = Math.max(max, prim.listTargets().length);
  return max;
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;

const doc = await io.read(INPUT);
console.log('BEFORE  tris:', countTris(doc), '| morphs:', morphCount(doc));

// --- geometry (preserves skin weights + morph targets) ---
await doc.transform(
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR, lockBorder: true }),
  prune(),
);
console.log('AFTER   tris:', countTris(doc), '| morphs:', morphCount(doc));

// --- textures: any texture on a non-opaque material keeps PNG (alpha-safe); else JPEG ---
const keepPng = new Set();
for (const m of doc.getRoot().listMaterials()) {
  if (m.getAlphaMode() !== 'OPAQUE') {
    for (const t of [m.getBaseColorTexture(), m.getMetallicRoughnessTexture(),
      m.getNormalTexture(), m.getOcclusionTexture(), m.getEmissiveTexture()]) {
      if (t) keepPng.add(t);
    }
  }
}

for (const tex of doc.getRoot().listTextures()) {
  const src = tex.getImage();
  if (!src) continue;
  const img = await Jimp.read(Buffer.from(src));
  const w = img.width, h = img.height;
  const scale = Math.min(1, MAXTEX / Math.max(w, h));
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  if (scale < 1) img.resize({ w: nw, h: nh });
  const asJpeg = !keepPng.has(tex);
  const mime = asJpeg ? 'image/jpeg' : 'image/png';
  const buf = await img.getBuffer(mime, asJpeg ? { quality: 85 } : {});
  tex.setImage(new Uint8Array(buf)).setMimeType(mime);
  console.log(`  tex "${tex.getName() || ''}": ${w}x${h} -> ${nw}x${nh} ${mime} ${(buf.length / 1048576).toFixed(2)}MB`);
}

await io.write(OUTPUT, doc);
console.log('written:', OUTPUT);
