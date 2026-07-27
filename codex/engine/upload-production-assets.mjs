import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

import { ASSET_DIR, DATA_DIR } from "./config.mjs";

const MANIFEST_PATH = path.join(DATA_DIR, "image-assets.production.v1.json");
const BLOB_PREFIX = "codex/v1";
const CACHE_SECONDS = 31_536_000;
const CONCURRENCY = 4;

function parseEnvValue(rawValue) {
  const value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function resolveBlobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const envFile = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
  const line = envFile
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith("BLOB_READ_WRITE_TOKEN="));
  if (!line) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }
  return parseEnvValue(line.slice("BLOB_READ_WRITE_TOKEN=".length));
}

function contentType(fileName) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".gif":
      return "image/gif";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      throw new Error(`Unsupported image extension: ${fileName}`);
  }
}

async function readAsset(fileName) {
  const file = path.resolve(ASSET_DIR, fileName);
  const root = path.resolve(ASSET_DIR);
  if (file !== root && !file.startsWith(root + path.sep)) {
    throw new Error(`Unsafe asset path: ${fileName}`);
  }
  const body = await fs.readFile(file);
  return {
    body,
    bytes: body.byteLength,
    contentType: contentType(fileName),
    extension: path.extname(fileName).toLowerCase(),
    sha256: createHash("sha256").update(body).digest("hex"),
  };
}

async function upload(pathname, asset, token) {
  return put(pathname, asset.body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: CACHE_SECONDS,
    contentType: asset.contentType,
    token,
  });
}

async function mapConcurrent(items, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()),
  );
  return results;
}

async function main() {
  const token = await resolveBlobToken();
  const imageManifest = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "images.json"), "utf8"),
  );
  if (!Array.isArray(imageManifest.images) || imageManifest.images.length !== 132) {
    throw new Error("Expected exactly 132 Codex image records.");
  }

  const coverAsset = await readAsset("kapak.png");
  const coverBlob = await upload(
    `${BLOB_PREFIX}/cover${coverAsset.extension}`,
    coverAsset,
    token,
  );

  const pages = await mapConcurrent(
    imageManifest.images,
    async (image, index) => {
      const pageNumber = index + 1;
      const assetId = `IMG-CAEL-${String(pageNumber).padStart(4, "0")}`;
      let asset;
      try {
        asset = await readAsset(String(image.file));
      } catch (error) {
        if (assetId !== "IMG-CAEL-0004") throw error;
        return {
          assetId,
          pageNumber,
          url: coverBlob.url,
          bytes: coverAsset.bytes,
          contentType: coverAsset.contentType,
          sha256: coverAsset.sha256,
          aliasOf: "cover",
        };
      }

      const blob = await upload(
        `${BLOB_PREFIX}/pages/${assetId}${asset.extension}`,
        asset,
        token,
      );
      process.stdout.write(`Uploaded ${assetId}\n`);
      return {
        assetId,
        pageNumber,
        url: blob.url,
        bytes: asset.bytes,
        contentType: asset.contentType,
        sha256: asset.sha256,
      };
    },
  );

  const manifest = {
    schemaVersion: "image-assets.production.v1",
    generatedAt: new Date().toISOString(),
    provider: "vercel-blob",
    access: "public",
    cover: {
      url: coverBlob.url,
      bytes: coverAsset.bytes,
      contentType: coverAsset.contentType,
      sha256: coverAsset.sha256,
    },
    pages,
  };
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`Wrote ${MANIFEST_PATH}\n`);
}

await main();
