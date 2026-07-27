import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import {
  ARCHIVE_EXPERIENCE_VERSION,
  LIVING_BOOK_VERSION,
  type ArchiveBootstrap,
  type ArchiveSectionDetail,
  type ArchiveSectionSummary,
  type CodexCanonicalStatus,
  type LivingBookPublicModel,
} from "./experience-contract";

type JsonObject = Record<string, unknown>;
type ProductionAsset = {
  url: string;
  bytes: number;
  contentType: string;
  sha256: string;
};
type ProductionAssetManifest = {
  schemaVersion: "image-assets.production.v1";
  provider: "vercel-blob";
  cover: ProductionAsset;
  pages: Array<ProductionAsset & {
    assetId: string;
    pageNumber: number;
    aliasOf?: "cover";
  }>;
};
export type ResolvedArchiveAsset =
  | (ProductionAsset & { source: "remote" })
  | {
      source: "local";
      file: string;
      fileName: string;
      bytes: number;
      contentType: string;
    };
type RawSection = JsonObject & {
  id: string;
  kind?: string;
  num?: number | null;
  title: string;
  excerpt?: string;
  wordCount?: number;
  entities?: string[];
  profession?: string | null;
  blocks?: Array<{ heading?: string | null; text: string }>;
  sourceFile?: string;
};

const DATA_ROOT = path.join(process.cwd(), "codex", "data");
const readJson = async <T>(name: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(DATA_ROOT, name), "utf8")) as T;

let codexPromise: Promise<JsonObject> | undefined;
let imagesPromise: Promise<JsonObject> | undefined;
let reportPromise: Promise<JsonObject> | undefined;
let productionAssetsPromise: Promise<ProductionAssetManifest | null> | undefined;

const readCodex = () => (codexPromise ??= readJson<JsonObject>("codex.json"));
const readImages = () => (imagesPromise ??= readJson<JsonObject>("images.json"));
const readReport = () => (reportPromise ??= readJson<JsonObject>("report.json"));
const readProductionAssets = () =>
  (productionAssetsPromise ??= readJson<ProductionAssetManifest>(
    "image-assets.production.v1.json",
  ).catch(() => null));

const PUBLIC_CHAPTERS: LivingBookPublicModel["chapters"] = [
  { slug: "genesis", title: "Genesis", order: 1, availablePages: 0 },
  { slug: "world-bible", title: "World Bible", order: 2, availablePages: 0 },
  { slug: "living-civilization", title: "Living Civilization", order: 3, availablePages: 0 },
  { slug: "production-bible", title: "Production Bible", order: 4, availablePages: 0 },
  { slug: "npc-bible", title: "NPC Bible", order: 5, availablePages: 0 },
  { slug: "engineering-bible", title: "Engineering Bible", order: 6, availablePages: 0 },
  { slug: "art-direction", title: "Art Direction", order: 7, availablePages: 0 },
  { slug: "image-archive", title: "Image Archive", order: 8, availablePages: 132 },
  { slug: "canon-decisions", title: "Canon Decisions", order: 9, availablePages: 0 },
];

type CodexPageRecord = LivingBookPublicModel["pages"][number] & {
  assetReference: string;
  hiddenTechnicalFilename: string;
};

let codexPageRecordsPromise: Promise<CodexPageRecord[]> | undefined;

function publicStatus(image: JsonObject): CodexCanonicalStatus {
  const status = String(image.status ?? "").toLowerCase();
  if (status === "canonical" || status === "verified") return "canonical";
  if (status === "reviewed") return "reviewed";
  return "temporary";
}

function publicPageTitle(image: JsonObject, pageNumber: number) {
  const status = publicStatus(image);
  if (status !== "temporary" && typeof image.title === "string" && image.title.trim()) {
    return image.title.trim();
  }
  return `CAELINUS CODEX — PAGE ${String(pageNumber).padStart(3, "0")}`;
}

async function buildCodexPageRecords(): Promise<CodexPageRecord[]> {
  const manifest = await readImages();
  const images = manifest.images as Array<JsonObject>;
  const cover = await resolveAssetFile("kapak.png");
  let coverUsedAsReplacement = false;
  const records: CodexPageRecord[] = [];
  for (let index = 0; index < images.length; index++) {
    const image = images[index];
    const manifestFileName = String(image.file);
    const manifestAsset = await resolveAssetFile(manifestFileName);
    const useCover = !manifestAsset && !coverUsedAsReplacement && Boolean(cover);
    if (useCover) coverUsedAsReplacement = true;
    const fileName = useCover ? "kapak.png" : manifestFileName;
    const pageNumber = index + 1;
    records.push({
      assetReference: `IMG-CAEL-${String(index + 1).padStart(4, "0")}`,
      publicTitle: publicPageTitle(image, pageNumber),
      chapter: "image-archive",
      volume: "Image Archive",
      pageNumber,
      imageSrc: `/api/archive/page/${pageNumber}`,
      canonicalStatus: publicStatus(image),
      hiddenTechnicalFilename: fileName,
    });
  }
  return records;
}

const loadCodexPageRecords = () =>
  (codexPageRecordsPromise ??= buildCodexPageRecords());

export async function loadLivingBookPublicModel(): Promise<LivingBookPublicModel> {
  const records = await loadCodexPageRecords();
  return {
    version: LIVING_BOOK_VERSION,
    title: "CAELINUS CODEX",
    subtitle: "THE LIVING BOOK OF ANATOLIA",
    imprint: "Temple of Silence · The Living Archive of Caelinus",
    coverSrc: "/api/archive/cover",
    chapters: PUBLIC_CHAPTERS,
    pages: records.map((record) => ({
      publicTitle: record.publicTitle,
      subtitle: record.subtitle,
      chapter: record.chapter,
      volume: record.volume,
      pageNumber: record.pageNumber,
      imageSrc: record.imageSrc,
      canonicalStatus: record.canonicalStatus,
    })),
  };
}

function sectionSummary(section: RawSection, bibleId: string): ArchiveSectionSummary {
  return {
    id: section.id,
    bibleId,
    kind: section.kind ?? "section",
    num: section.num ?? null,
    title: section.title,
    excerpt: section.excerpt ?? "",
    wordCount: section.wordCount ?? 0,
    entities: section.entities ?? [],
    profession: section.profession ?? null,
  };
}

export async function loadArchiveBootstrap(): Promise<ArchiveBootstrap> {
  const [codex, imageManifest, report] = await Promise.all([
    readCodex(),
    readImages(),
    readReport(),
  ]);
  const meta = codex.meta as JsonObject;
  const rawBibles = codex.bibles as Array<JsonObject & { sections: RawSection[] }>;
  const rawGraph = codex.graph as JsonObject;
  const rawImages = imageManifest.images as Array<JsonObject>;
  const gaps = ((report.gaps as JsonObject)?.gaps as unknown[]) ?? [];

  return {
    experienceVersion: ARCHIVE_EXPERIENCE_VERSION,
    canonVersion: String(meta.canonVersion),
    generatedAt: String(meta.generatedAt),
    meta: {
      name: String(meta.name),
      subtitle: String(meta.subtitle),
      bibleCount: Number(meta.bibleCount),
      sectionCount: Number(meta.sectionCount),
      imageCount: Number(meta.imageCount),
      entityCount: Number(meta.entityCount),
      gapCount: gaps.length,
    },
    bibles: rawBibles.map((bible) => ({
      id: String(bible.id),
      title: String(bible.title),
      tr: String(bible.tr),
      glyph: String(bible.glyph),
      accent: String(bible.accent),
      status: String(bible.status),
      parent: bible.parent ? String(bible.parent) : null,
      sectionCount: Number(bible.sectionCount),
      sections: bible.sections.map((section) => sectionSummary(section, String(bible.id))),
    })),
    graph: {
      nodes: rawGraph.nodes as ArchiveBootstrap["graph"]["nodes"],
      edges: rawGraph.edges as ArchiveBootstrap["graph"]["edges"],
      chains: rawGraph.chains as ArchiveBootstrap["graph"]["chains"],
      occurrences: rawGraph.occurrences as ArchiveBootstrap["graph"]["occurrences"],
    },
    images: rawImages.map((image, index) => ({
      id: String(image.id),
      assetId: `IMG-CAEL-${String(index + 1).padStart(4, "0")}`,
      file: String(image.file),
      bytes: Number(image.bytes),
      status: String(image.status),
      title: typeof image.title === "string" ? image.title : null,
      description: typeof image.description === "string" ? image.description : null,
    })),
  };
}

export async function loadArchiveSection(
  sectionId: string,
): Promise<ArchiveSectionDetail | null> {
  const codex = await readCodex();
  const bibles = codex.bibles as Array<JsonObject & { sections: RawSection[] }>;
  for (const bible of bibles) {
    const section = bible.sections.find((candidate) => candidate.id === sectionId);
    if (!section) continue;
    return {
      ...sectionSummary(section, String(bible.id)),
      blocks: (section.blocks ?? []).map((block) => ({
        heading: block.heading ?? null,
        text: block.text,
      })),
      sourceFile: section.sourceFile ?? "",
    };
  }
  return null;
}

async function resolveAssetFile(fileName: string) {
  // Reuse the Codex engine's portable asset resolution. This import stays
  // server-only and does not duplicate its environment/fallback rules.
  // @ts-expect-error The zero-dependency Codex engine is an ESM JavaScript module.
  const { ASSET_DIR } = (await import("../../codex/engine/config.mjs")) as {
    ASSET_DIR: string;
  };
  const root = path.resolve(ASSET_DIR);
  const file = path.resolve(root, fileName);
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  try {
    const stat = await fs.stat(file);
    if (!stat.isFile()) return null;
    const extension = path.extname(fileName).toLowerCase();
    const contentType =
      extension === ".gif"
        ? "image/gif"
        : extension === ".jpg" || extension === ".jpeg"
          ? "image/jpeg"
          : extension === ".png"
            ? "image/png"
            : extension === ".webp"
              ? "image/webp"
              : "application/octet-stream";
    return { source: "local" as const, file, fileName, bytes: stat.size, contentType };
  } catch {
    return null;
  }
}

export async function resolveArchiveAsset(assetId: string) {
  if (!/^IMG-CAEL-\d{4}$/.test(assetId)) return null;
  const productionAsset = (await readProductionAssets())?.pages.find(
    (candidate) => candidate.assetId === assetId,
  );
  if (productionAsset) {
    return { source: "remote" as const, ...productionAsset };
  }
  const index = Number(assetId.slice(-4)) - 1;
  const manifest = await readImages();
  const images = manifest.images as Array<JsonObject>;
  const image = images[index];
  if (!image) return null;
  return resolveAssetFile(String(image.file));
}

export async function resolveArchiveCover() {
  const productionAsset = (await readProductionAssets())?.cover;
  if (productionAsset) {
    return { source: "remote" as const, ...productionAsset };
  }
  return resolveAssetFile("kapak.png");
}

export async function resolvePublicCodexPage(pageNumber: number) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 132) return null;
  const productionAsset = (await readProductionAssets())?.pages.find(
    (candidate) => candidate.pageNumber === pageNumber,
  );
  if (productionAsset) {
    return { source: "remote" as const, ...productionAsset };
  }
  const record = (await loadCodexPageRecords()).find(
    (candidate) => candidate.pageNumber === pageNumber,
  );
  return record ? resolveAssetFile(record.hiddenTechnicalFilename) : null;
}
