#!/usr/bin/env node
/**
 * build-turkey-svg-paths.mjs
 *
 * Reads `data/geo/tr-cities.json` (GeoJSON, 81 il) and produces a
 * client-friendly TypeScript module containing one SVG `path d` string
 * per province plate code, plus the bounding box / viewBox.
 *
 * Why this exists
 * ───────────────
 *   • The GeoJSON is ~240 KB of lat/lon pairs. Browsers don't render
 *     GeoJSON directly — we need SVG <path d="..."> strings.
 *   • Doing the projection at runtime works but pays the cost on every
 *     mount. Pre-computing once at build time is faster and shrinks the
 *     payload (we round to 0.1 SVG units, ≈ 100m on the ground).
 *
 * Projection
 * ──────────
 *   We use a Web-Mercator projection so the map matches what people
 *   expect to see when they think of "Turkey on a map". For Turkey's
 *   latitude band (36°–42°N) Mercator is visually indistinguishable
 *   from a properly fitted Albers projection.
 *
 * Output
 * ──────
 *   data/turkey-svg-paths.ts:
 *     export const TURKEY_VIEW_BOX = "0 0 1000 410";
 *     export const TURKEY_SVG_PATHS: Record<string /*plate*\/, string /*d*\/> = { ... };
 *     export const TURKEY_SVG_PATH_META: Record<plate, { name, centroid: [x,y] }> = { ... };
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

const GEOJSON_PATH = path.join(repoRoot, "data", "geo", "tr-cities.json");
const OUTPUT_PATH = path.join(repoRoot, "data", "turkey-svg-paths.ts");

const VIEW_WIDTH = 1000;

// ──────────────────────────────────────────────────────────────────────
// 1. Load GeoJSON
// ──────────────────────────────────────────────────────────────────────

const geo = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));

if (geo.type !== "FeatureCollection" || !Array.isArray(geo.features)) {
  throw new Error("Unexpected GeoJSON shape");
}

if (geo.features.length !== 81) {
  console.warn(`⚠ Expected 81 features, found ${geo.features.length}`);
}

// ──────────────────────────────────────────────────────────────────────
// 2. Mercator projection helpers
// ──────────────────────────────────────────────────────────────────────

const DEG = Math.PI / 180;

function mercator(lon, lat) {
  // longitude is linear, latitude uses Mercator's log-tan
  const x = lon;
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2)) / DEG;
  return [x, y];
}

// ──────────────────────────────────────────────────────────────────────
// 3. Compute bounds across ALL features (post-projection)
// ──────────────────────────────────────────────────────────────────────

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

function* eachCoord(geometry) {
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) for (const pt of ring) yield pt;
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates)
      for (const ring of polygon) for (const pt of ring) yield pt;
  }
}

for (const feature of geo.features) {
  for (const [lon, lat] of eachCoord(feature.geometry)) {
    const [x, y] = mercator(lon, lat);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}

const projectedW = maxX - minX;
const projectedH = maxY - minY;

// scale so projected width = VIEW_WIDTH; height follows aspect ratio
const scale = VIEW_WIDTH / projectedW;
const VIEW_HEIGHT = Math.round(projectedH * scale * 10) / 10;

console.log(
  `bounds  lon[${minX.toFixed(2)}..${maxX.toFixed(2)}] lat-merc[${minY.toFixed(2)}..${maxY.toFixed(2)}]`,
);
console.log(`viewBox 0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`);

function project(lon, lat) {
  const [px, py] = mercator(lon, lat);
  return [
    Math.round((px - minX) * scale * 10) / 10,
    // flip Y because SVG grows downward but Mercator grows north-up
    Math.round((maxY - py) * scale * 10) / 10,
  ];
}

// ──────────────────────────────────────────────────────────────────────
// 4. Build path d string for each feature
// ──────────────────────────────────────────────────────────────────────

/**
 * Convert a single ring of [lon, lat] points to a "M x y L x y …" string.
 * We deliberately do NOT close with Z — SVG fills the implicit close
 * just fine, and skipping Z saves 80 bytes × 81 provinces.
 */
function ringToPath(ring) {
  let out = "";
  let prevX = NaN;
  let prevY = NaN;
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const [x, y] = project(lon, lat);
    if (i === 0) {
      out += `M${x} ${y}`;
    } else {
      // skip duplicate consecutive points (common in GeoJSON)
      if (x === prevX && y === prevY) continue;
      out += `L${x} ${y}`;
    }
    prevX = x;
    prevY = y;
  }
  return out + "Z";
}

function geometryToPath(geometry) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join("");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon) => polygon.map(ringToPath).join(""))
      .join("");
  }
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

// Compute centroid in projected SVG units (used for tooltips, focus rings)
function centroidOf(geometry) {
  let sx = 0, sy = 0, n = 0;
  for (const [lon, lat] of eachCoord(geometry)) {
    const [x, y] = project(lon, lat);
    sx += x; sy += y; n += 1;
  }
  return [
    Math.round((sx / n) * 10) / 10,
    Math.round((sy / n) * 10) / 10,
  ];
}

// ──────────────────────────────────────────────────────────────────────
// 5. Emit TypeScript module
// ──────────────────────────────────────────────────────────────────────

const entries = [];
const meta = [];

const features = [...geo.features].sort(
  (a, b) => a.properties.number - b.properties.number,
);

for (const feature of features) {
  const plate = String(feature.properties.number).padStart(2, "0");
  const name = feature.properties.name;
  const d = geometryToPath(feature.geometry);
  const [cx, cy] = centroidOf(feature.geometry);
  entries.push(`  "${plate}": ${JSON.stringify(d)},`);
  meta.push(`  "${plate}": { name: ${JSON.stringify(name)}, centroid: [${cx}, ${cy}] },`);
}

const output = `/* eslint-disable */
/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: data/geo/tr-cities.json (alpers/Turkey-Maps-GeoJSON, MIT)
 * Generator: scripts/build-turkey-svg-paths.mjs
 *
 * Re-run \`node scripts/build-turkey-svg-paths.mjs\` to refresh.
 */

export const TURKEY_VIEW_BOX = "0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}";
export const TURKEY_VIEW_WIDTH = ${VIEW_WIDTH};
export const TURKEY_VIEW_HEIGHT = ${VIEW_HEIGHT};

/**
 * Plate code (zero-padded, "01"…"81") → SVG path "d" attribute.
 * Coordinates are in Web-Mercator projection, fitted to the
 * \`TURKEY_VIEW_BOX\` viewBox above.
 */
export const TURKEY_SVG_PATHS: Record<string, string> = {
${entries.join("\n")}
};

/**
 * Plate code → display name + projected centroid (in SVG units).
 * Useful for tooltips, focus rings, and label placement.
 */
export const TURKEY_SVG_PATH_META: Record<
  string,
  { name: string; centroid: [number, number] }
> = {
${meta.join("\n")}
};
`;

fs.writeFileSync(OUTPUT_PATH, output, "utf8");

const sizeKb = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1);
console.log(`✓ wrote ${OUTPUT_PATH} (${sizeKb} KB, ${features.length} provinces)`);
