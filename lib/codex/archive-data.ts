import "server-only";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  ARCHIVE_EXPERIENCE_VERSION,
  LIVING_BOOK_VERSION,
  type ArchiveBootstrap,
  type ArchiveSectionDetail,
  type ArchiveSectionSummary,
  type CanonicalKnowledgeGraph,
  type CodexCanonicalStatus,
  type LivingBookPublicModel,
} from "./experience-contract";
import { loadCodexChapterLibrary } from "./chapter-adapter";

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
type EditorialRuntimePage = JsonObject & {
  assetId: string;
  pageNumber: number;
  sourceFile: string;
  primaryCanonId: string;
  canonIds: string[];
  publicTitle: string;
  subtitle?: string;
  Bible: string;
  volume: string;
  chapter: string;
  canonicalStatus: string;
  shortDescription?: string;
};
type EditorialRuntime = {
  schemaVersion: "editorial-runtime.v1";
  editorialVersion: "1.0";
  editorialStatus: "FROZEN";
  pages: EditorialRuntimePage[];
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
let editorialRuntimePromise: Promise<EditorialRuntime> | undefined;
let canonicalGraphPromise: Promise<CanonicalKnowledgeGraph> | undefined;
let productionAssetsPromise: Promise<ProductionAssetManifest | null> | undefined;

const readCodex = () => (codexPromise ??= readJson<JsonObject>("codex.json"));
const readImages = () => (imagesPromise ??= readJson<JsonObject>("images.json"));
const readReport = () => (reportPromise ??= readJson<JsonObject>("report.json"));
const readEditorialRuntime = () =>
  (editorialRuntimePromise ??= readJson<EditorialRuntime>("editorial-runtime.v1.json"));
export const loadCanonicalKnowledgeGraph = () =>
  (canonicalGraphPromise ??= readJson<CanonicalKnowledgeGraph>(
    "canonical-knowledge-graph.v1.json",
  ));
const readProductionAssets = () =>
  (productionAssetsPromise ??= readJson<ProductionAssetManifest>(
    "image-assets.production.v1.json",
  ).catch(() => null));

type CodexPageRecord = LivingBookPublicModel["pages"][number] & {
  hiddenTechnicalFilename: string;
};

let codexPageRecordsPromise: Promise<CodexPageRecord[]> | undefined;

function publicStatus(value: unknown): CodexCanonicalStatus {
  const status = String(value ?? "").toLowerCase();
  if (status === "canonical" || status === "verified") return "canonical";
  if (status === "reviewed") return "reviewed";
  return "temporary";
}

async function buildCodexPageRecords(): Promise<CodexPageRecord[]> {
  const runtime = await readEditorialRuntime();
  return runtime.pages.map((page) => ({
    assetId: page.assetId,
    primaryCanonId: page.primaryCanonId,
    canonIds: page.canonIds,
    publicTitle: page.publicTitle,
    subtitle: page.subtitle,
    chapter: page.chapter,
    volume: page.volume,
    pageNumber: page.pageNumber,
    imageSrc: `/api/archive/page/${page.pageNumber}`,
    canonicalStatus: publicStatus(page.canonicalStatus),
    hiddenTechnicalFilename: page.sourceFile,
  }));
}

const loadCodexPageRecords = () =>
  (codexPageRecordsPromise ??= buildCodexPageRecords());

export async function loadLivingBookPublicModel(): Promise<LivingBookPublicModel> {
  const [records, chapterLibrary] = await Promise.all([
    loadCodexPageRecords(),
    loadCodexChapterLibrary(),
  ]);
  return {
    version: LIVING_BOOK_VERSION,
    title: "CAELINUS CODEX",
    subtitle: "THE LIVING BOOK OF ANATOLIA",
    imprint: "Temple of Silence · The Living Archive of Caelinus",
    coverSrc: "/api/archive/cover",
    chapters: chapterLibrary.chapters,
    pages: records.map((record) => ({
      assetId: record.assetId,
      primaryCanonId: record.primaryCanonId,
      canonIds: record.canonIds,
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
  const [codex, imageManifest, report, editorialRuntime, productionAssets] = await Promise.all([
    readCodex(),
    readImages(),
    readReport(),
    readEditorialRuntime(),
    readProductionAssets(),
  ]);
  const meta = codex.meta as JsonObject;
  const rawBibles = codex.bibles as Array<JsonObject & { sections: RawSection[] }>;
  const rawGraph = codex.graph as JsonObject;
  const rawImages = imageManifest.images as Array<JsonObject>;
  const rawImagesByFile = new Map(rawImages.map((image) => [String(image.file), image]));
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
    images: editorialRuntime.pages.map((page) => {
      const image = rawImagesByFile.get(page.sourceFile);
      return {
        id: `editorial-${String(page.pageNumber).padStart(4, "0")}`,
        assetId: page.assetId,
        primaryCanonId: page.primaryCanonId,
        canonIds: page.canonIds,
        file: page.sourceFile,
        bytes: image ? Number(image.bytes) : (productionAssets?.cover.bytes ?? 0),
        status: page.canonicalStatus,
        title: page.publicTitle,
        description: page.shortDescription ?? null,
      };
    }),
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
  const page = (await readEditorialRuntime()).pages.find(
    (candidate) => candidate.assetId === assetId,
  );
  return page ? resolveEditorialPageAsset(page) : null;
}

export async function resolveArchiveCover() {
  const productionAsset = (await readProductionAssets())?.cover;
  if (productionAsset) {
    return { source: "remote" as const, ...productionAsset };
  }
  return resolveAssetFile("kapak.png");
}

export function resolveGenesisContentsReference() {
  return resolveAssetFile("genesis.png");
}

export async function resolveGenesisVisualReference() {
  const portableAsset = await resolveAssetFile("gorselanlatim-1-3.png");
  if (portableAsset) return portableAsset;

  const fileName = "gorselanlatim-1-3.png";
  const file = path.join(os.homedir(), "Downloads", fileName);
  try {
    const stat = await fs.stat(file);
    if (!stat.isFile()) return null;
    return {
      source: "local" as const,
      file,
      fileName,
      bytes: stat.size,
      contentType: "image/png",
    };
  } catch {
    return null;
  }
}

export async function resolvePublicCodexPage(pageNumber: number) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 132) return null;
  const record = (await loadCodexPageRecords()).find(
    (candidate) => candidate.pageNumber === pageNumber,
  );
  if (!record) return null;
  const page = (await readEditorialRuntime()).pages.find(
    (candidate) => candidate.assetId === record.assetId,
  );
  return page ? resolveEditorialPageAsset(page) : null;
}

async function resolveEditorialPageAsset(page: EditorialRuntimePage) {
  const productionAssets = await readProductionAssets();
  if (page.sourceFile === "kapak.png") {
    return productionAssets?.cover
      ? { source: "remote" as const, ...productionAssets.cover }
      : resolveAssetFile(page.sourceFile);
  }

  const imageManifest = await readImages();
  const images = imageManifest.images as Array<JsonObject>;
  const legacyPageNumber =
    images.findIndex((image) => String(image.file) === page.sourceFile) + 1;
  if (legacyPageNumber > 0) {
    const productionAsset = productionAssets?.pages.find(
      (candidate) => candidate.pageNumber === legacyPageNumber,
    );
    if (productionAsset) return { source: "remote" as const, ...productionAsset };
  }
  return resolveAssetFile(page.sourceFile);
}
