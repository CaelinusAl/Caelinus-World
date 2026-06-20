#!/usr/bin/env node
/**
 * validate-avatar.js — Caelinus Faz A GLB doğrulama kapısı.
 *
 * SIFIR BAĞIMLILIK: npm install YOK, internet YOK. Sadece Node 16+ gerekir.
 * GLB'nin binary'sini doğrudan okur, JSON chunk'ı parse eder, sözleşmeye
 * (URETIM-BASLANGIC.md §1–§4) göre kontrol eder.
 *
 * KULLANIM:
 *   node _tools/validate-avatar.js public/models/caelinus-body-base-fem.glb
 *
 * Profil dosya adından otomatik seçilir:
 *   "...-vr.glb"  → VR bütçesi (≤25k tris, ≤1024px, ≤5MB)
 *   diğer         → -hires bütçesi (≤60k tris, ≤2048px, sıkıştırma YASAK)
 *
 * Çıkış kodu: tüm zorunlu kontroller geçerse 0, bir FAIL varsa 1.
 */

"use strict";
const fs = require("fs");
const path = require("path");

// ── renkler ───────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m",
  yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m", bold: "\x1b[1m",
};
let FAILS = 0, WARNS = 0;
const pass = (m) => console.log(`  ${C.green}✓ PASS${C.reset}  ${m}`);
const fail = (m) => { FAILS++; console.log(`  ${C.red}✗ FAIL${C.reset}  ${m}`); };
const warn = (m) => { WARNS++; console.log(`  ${C.yellow}▲ WARN${C.reset}  ${m}`); };
const info = (m) => console.log(`  ${C.dim}·${C.reset} ${m}`);

// ── sözleşme bütçeleri ──────────────────────────────────────────────────────
const BUDGET = {
  hires: { tris: 60000, tex: 2048, sizeMB: 25, allowCompression: false },
  vr:    { tris: 25000, tex: 1024, sizeMB: 5,  allowCompression: true  },
};
const MIXAMO_CORE = ["Hips", "Spine", "Spine1", "Spine2", "Neck", "Head",
  "LeftArm", "RightArm", "LeftForeArm", "RightForeArm", "LeftUpLeg", "RightUpLeg"];
const ARKIT_MIN = ["eyeBlinkLeft", "eyeBlinkRight", "jawOpen",
  "mouthSmileLeft", "mouthSmileRight"];

// ── GLB parse (binary → {json, bin}) ────────────────────────────────────────
function parseGLB(buf) {
  if (buf.length < 12) throw new Error("Dosya çok küçük, geçerli GLB değil.");
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error("Magic 'glTF' değil — bu bir GLB değil.");
  const version = buf.readUInt32LE(4);
  if (version !== 2) throw new Error(`glTF sürüm ${version}, beklenen 2.`);
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    const start = off + 8;
    const chunk = buf.subarray(start, start + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8")); // JSON
    else if (type === 0x004e4942) bin = chunk;                          // BIN
    off = start + len;
  }
  if (!json) throw new Error("JSON chunk bulunamadı.");
  return { json, bin };
}

// ── görüntü boyutu (PNG / JPEG header'dan, decode etmeden) ───────────────────
function imageSize(bytes) {
  // PNG
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20), fmt: "PNG" };
  }
  // JPEG
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      // SOF0..SOF15 (boyut taşıyan), C4/C8/CC hariç
      if (marker >= 0xc0 && marker <= 0xcf &&
          marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: bytes.readUInt16BE(i + 5), w: bytes.readUInt16BE(i + 7), fmt: "JPEG" };
      }
      const segLen = bytes.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
  }
  return null;
}

// ── ana akış ────────────────────────────────────────────────────────────────
function main() {
  const file = process.argv[2];
  if (!file) {
    console.error(`${C.red}Kullanım:${C.reset} node _tools/validate-avatar.js <dosya.glb>`);
    process.exit(2);
  }
  if (!fs.existsSync(file)) {
    console.error(`${C.red}Dosya yok:${C.reset} ${file}`);
    process.exit(2);
  }

  const buf = fs.readFileSync(file);
  const sizeMB = buf.length / (1024 * 1024);
  const name = path.basename(file).toLowerCase();
  const profile = name.includes("-vr") ? "vr" : "hires";
  const b = BUDGET[profile];

  console.log(`\n${C.bold}${C.cyan}Caelinus GLB Doğrulama${C.reset} — ${path.basename(file)}`);
  console.log(`${C.dim}Profil: ${profile.toUpperCase()}  ·  Boyut: ${sizeMB.toFixed(2)} MB${C.reset}\n`);

  let json, bin;
  try { ({ json, bin } = parseGLB(buf)); }
  catch (e) { fail(`GLB parse: ${e.message}`); summary(); return; }
  pass("GLB binary geçerli (magic + glTF 2.0)");

  // 1) Dosya boyutu
  console.log(`\n${C.bold}1) Boyut${C.reset}`);
  if (sizeMB <= b.sizeMB) pass(`${sizeMB.toFixed(2)} MB ≤ ${b.sizeMB} MB`);
  else (profile === "vr" ? fail : warn)(`${sizeMB.toFixed(2)} MB > ${b.sizeMB} MB bütçe`);

  // 2) Sıkıştırma (hires'ta YASAK — motorda decoder yok)
  console.log(`\n${C.bold}2) Sıkıştırma${C.reset}`);
  const used = json.extensionsUsed || [];
  const flags = {
    Draco: used.includes("KHR_draco_mesh_compression"),
    KTX2: used.includes("KHR_texture_basisu"),
    Meshopt: used.includes("EXT_meshopt_compression"),
  };
  const anyComp = Object.values(flags).some(Boolean);
  if (!anyComp) pass("Sıkıştırma yok (motor düz GLTFLoader ile okur)");
  else if (!b.allowCompression) {
    fail(`Sıkıştırma VAR: ${Object.keys(flags).filter(k => flags[k]).join(", ")} — ` +
         `motorda KTX2/DRACO loader YOK, ekran boş gelir. -hires sıkıştırmasız olmalı.`);
  } else {
    warn(`Sıkıştırma var (${Object.keys(flags).filter(k => flags[k]).join(", ")}) — ` +
         `-vr için beklenen, ama mevcut motor henüz okuyamaz (geliştirici loader ekleyecek).`);
  }

  // 3) Üçgen sayısı
  console.log(`\n${C.bold}3) Geometri (üçgen)${C.reset}`);
  let tris = 0, compressedGeo = false;
  for (const mesh of json.meshes || []) {
    for (const p of mesh.primitives || []) {
      if (p.extensions && p.extensions.KHR_draco_mesh_compression) { compressedGeo = true; continue; }
      const mode = p.mode === undefined ? 4 : p.mode;
      if (mode !== 4) continue; // sadece TRIANGLES
      let count;
      if (p.indices !== undefined) count = json.accessors[p.indices].count;
      else if (p.attributes && p.attributes.POSITION !== undefined)
        count = json.accessors[p.attributes.POSITION].count;
      else count = 0;
      tris += Math.floor(count / 3);
    }
  }
  if (compressedGeo) warn("Geometri Draco-sıkıştırılmış — üçgen sayısı header'dan okunamadı (decode gerekir).");
  else if (tris <= b.tris) pass(`${tris.toLocaleString()} tris ≤ ${b.tris.toLocaleString()}`);
  else fail(`${tris.toLocaleString()} tris > ${b.tris.toLocaleString()} bütçe`);

  // 4) Texture boyutu
  console.log(`\n${C.bold}4) Texture${C.reset}`);
  const imgs = json.images || [];
  if (imgs.length === 0) warn("Gömülü texture yok (PBR materyali eksik olabilir).");
  imgs.forEach((img, i) => {
    if (img.uri && !img.uri.startsWith("data:")) { warn(`image[${i}] dış dosya (${img.uri}) — GLB'ye göm.`); return; }
    let bytes = null;
    if (img.bufferView !== undefined && bin) {
      const bv = json.bufferViews[img.bufferView];
      const o = bv.byteOffset || 0;
      bytes = bin.subarray(o, o + bv.byteLength);
    } else if (img.uri && img.uri.startsWith("data:")) {
      bytes = Buffer.from(img.uri.split(",")[1], "base64");
    }
    if (!bytes) { info(`image[${i}] okunamadı (ktx2/sıkıştırılmış olabilir).`); return; }
    const sz = imageSize(bytes);
    if (!sz) { info(`image[${i}] boyutu çözülemedi (PNG/JPEG değil).`); return; }
    const maxDim = Math.max(sz.w, sz.h);
    const pow2 = (sz.w & (sz.w - 1)) === 0 && (sz.h & (sz.h - 1)) === 0;
    if (maxDim <= b.tex) pass(`image[${i}] ${sz.w}×${sz.h} ${sz.fmt} ≤ ${b.tex}px${pow2 ? "" : " (pow2 DEĞİL ▲)"}`);
    else fail(`image[${i}] ${sz.w}×${sz.h} > ${b.tex}px bütçe`);
    if (!pow2) warn(`image[${i}] güç-of-2 değil — mipmap/GPU için ${b.tex} kare öner.`);
  });

  // 5) Rig — Mixamo bone isimleri
  console.log(`\n${C.bold}5) Rig (Mixamo bone)${C.reset}`);
  const skins = json.skins || [];
  if (skins.length === 0) fail("Skin/armature yok — riglenmemiş.");
  else {
    if (skins.length > 1) warn(`${skins.length} skin var — tek skeleton önerilir.`);
    const nodes = json.nodes || [];
    const jointNames = new Set();
    skins.forEach(s => (s.joints || []).forEach(j => jointNames.add((nodes[j] && nodes[j].name) || "")));
    const all = [...jointNames];
    const prefixed = all.filter(n => /mixamorig[:_]/i.test(n));
    if (prefixed.length) warn(`${prefixed.length} bone 'mixamorig:' prefix taşıyor — export'ta temizle (retarget bozulur).`);
    const norm = all.map(n => n.replace(/^mixamorig[:_]/i, ""));
    const missing = MIXAMO_CORE.filter(core => !norm.includes(core));
    if (missing.length === 0) pass(`Çekirdek Mixamo bone'ları tam (${MIXAMO_CORE.length}/${MIXAMO_CORE.length})`);
    else fail(`Eksik bone: ${missing.join(", ")}`);
    const hasEye = norm.some(n => /eye/i.test(n));
    const hasFinger = norm.some(n => /(Hand|Finger|Index|Thumb|Pinky|Middle|Ring)/i.test(n));
    hasEye ? pass("Göz bone'u var") : warn("Göz bone'u bulunamadı (BÖLÜM 4.4 öneriyor).");
    hasFinger ? pass("Parmak bone'u var") : warn("Parmak bone'u bulunamadı (BÖLÜM 4.4 öneriyor).");
    info(`Toplam joint: ${all.length}`);
  }

  // 6) Blendshape — ARKit min 5
  console.log(`\n${C.bold}6) Blendshape (ARKit)${C.reset}`);
  const found = new Set();
  for (const mesh of json.meshes || []) {
    const names = (mesh.extras && mesh.extras.targetNames) || [];
    names.forEach(n => found.add(n));
  }
  if (found.size === 0) fail("Hiç blendshape (morph target) yok.");
  else {
    const missing = ARKIT_MIN.filter(n => !found.has(n));
    if (missing.length === 0) pass(`ARKit min-5 tam: ${ARKIT_MIN.join(", ")}`);
    else fail(`Eksik/yanlış isimli ARKit shape: ${missing.join(", ")} (isimler birebir olmalı)`);
    info(`Toplam blendshape: ${found.size}`);
  }

  // 7) Ölçek / eksen
  console.log(`\n${C.bold}7) Ölçek & Eksen${C.reset}`);
  const roots = (json.nodes || []).filter(n => n.scale);
  const badScale = roots.filter(n => n.scale.some(s => Math.abs(s - 1) > 0.001));
  if (badScale.length === 0) pass("Tüm node scale ≈ [1,1,1] (transform apply edilmiş)");
  else warn(`${badScale.length} node'da scale ≠ 1 — Blender'da Ctrl+A > Apply Scale yap.`);
  info("Eksen: glTF zaten +Y-up'a normalize eder (export'ta '+Y up' işaretli olsun).");

  summary();
}

function summary() {
  console.log(`\n${C.bold}── Sonuç ──${C.reset}`);
  if (FAILS === 0) console.log(`${C.green}${C.bold}✓ KAPI AÇIK${C.reset} — ${WARNS} uyarı. Teslim/entegrasyona hazır.\n`);
  else console.log(`${C.red}${C.bold}✗ KAPI KAPALI${C.reset} — ${FAILS} hata, ${WARNS} uyarı. Düzeltmeden teslim etme.\n`);
  process.exit(FAILS === 0 ? 0 : 1);
}

main();
