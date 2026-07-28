import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import {
  DISCOVERY_DOSSIERS,
  DISCOVERY_SLUGS,
  MEMORY_STONE_TAB_COPY,
  type DiscoverySlug,
} from "./discovery-experience-copy";
import { ART_DIRECTION_EXPERIENCE_SECTIONS } from "./art-direction-experience-copy";
import { loadCanonicalKnowledgeGraph } from "./archive-data";
import { loadCodexChapterLibrary } from "./chapter-adapter";

type EditorialPage = {
  assetId: string;
  publicTitle: string;
  subtitle?: string;
  shortDescription?: string;
  relatedSystems?: string[];
  relatedPages?: string[];
  historicalRefs?: string[];
  canonicalStatus: string;
  pageNumber: number;
  primaryCanonId: string;
  canonIds: string[];
  NPC?: string;
};

type EditorialRuntime = {
  pages: EditorialPage[];
};

type ProductionArtifact = {
  kind: string;
  format: string;
  path: string;
  state: string;
};

type ProductionGate = {
  id: string;
  status: string;
};

type ProductionAsset = {
  assetId: string;
  primaryCanonId: string;
  canonIds: string[];
  publicTitle: string;
  editorialDisposition: string;
  productionStatus: string;
  sourceReferences: { referenceImage: string };
  artifacts: ProductionArtifact[];
  gates: ProductionGate[];
};

type ProductionManifest = {
  assets: ProductionAsset[];
};

type PackageManifest = {
  schemaVersion: string;
  assetId: string;
  phase: string;
  packageStatus: string;
  productionStatus: string;
  deliverables: Array<{ id: number; name: string; status: string }>;
  approvedDesignDecisions: string[];
  pendingProductionDefinitions: string[];
};

const DATA_ROOT = path.join(process.cwd(), "codex", "data");
const PRODUCTION_ROOT = path.join(
  process.cwd(),
  "codex",
  "production",
  "data",
);
const MASTER_ASSET_ROOT = path.join(process.cwd(), "production-assets");

const productionStatusLabel = (status: string) => {
  if (status === "PASS") return "Tamamlandı";
  if (status === "READY") return "Hazır";
  if (status === "SPECIFIED") return "Tanımlandı";
  if (status === "SPECIFICATION_COMPLETE") return "Tasarım Paketi Hazır";
  return "Planlandı";
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

let editorialPromise: Promise<EditorialRuntime> | undefined;
let productionPromise: Promise<ProductionManifest> | undefined;

const readEditorial = () =>
  (editorialPromise ??= readJson<EditorialRuntime>(
    path.join(DATA_ROOT, "editorial-runtime.v1.json"),
  ));

const readProduction = () =>
  (productionPromise ??= readJson<ProductionManifest>(
    path.join(PRODUCTION_ROOT, "asset-production-manifest.v1.json"),
  ));

async function readPackage(assetId: string) {
  if (!/^IMG-CAEL-\d{4}$/.test(assetId)) return null;
  return readJson<PackageManifest>(
    path.join(MASTER_ASSET_ROOT, assetId, "specs", "PACKAGE_MANIFEST.json"),
  ).catch(() => null);
}

function graphRelations(
  graph: Awaited<ReturnType<typeof loadCanonicalKnowledgeGraph>>,
  nodeIds: string[],
) {
  const idSet = new Set(nodeIds);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const relatedIds = new Set<string>();
  for (const edge of graph.edges) {
    if (idSet.has(edge.source)) relatedIds.add(edge.target);
    if (idSet.has(edge.target)) relatedIds.add(edge.source);
  }
  return [...relatedIds]
    .map((id) => nodeById.get(id))
    .filter((node) => node !== undefined)
    .map((node) => ({
      id: node.id,
      type: node.type,
      label: node.label,
      canonIds: node.canonIds,
      assetIds: node.assetIds,
    }));
}

export async function listMasterAssetIds() {
  const manifest = await readProduction();
  return manifest.assets.map((asset) => asset.assetId);
}

export async function loadMasterAssetExperience(assetId: string) {
  if (!/^IMG-CAEL-\d{4}$/.test(assetId)) return null;
  const [editorial, production, packageManifest, graph] = await Promise.all([
    readEditorial(),
    readProduction(),
    readPackage(assetId),
    loadCanonicalKnowledgeGraph(),
  ]);
  const page = editorial.pages.find((candidate) => candidate.assetId === assetId);
  const asset = production.assets.find(
    (candidate) => candidate.assetId === assetId,
  );
  if (!page || !asset) return null;

  const webModel = asset.artifacts.find(
    (artifact) => artifact.kind === "web-runtime" && artifact.state === "READY",
  );

  return {
    assetId,
    title: page.publicTitle,
    subtitle: page.subtitle ?? "",
    description: page.shortDescription ?? "",
    imageSrc: `/api/archive/asset/${assetId}`,
    pageNumber: page.pageNumber,
    primaryCanonId: page.primaryCanonId,
    canonIds: page.canonIds,
    relatedSystems: page.relatedSystems ?? [],
    relatedPages: page.relatedPages ?? [],
    historicalRefs: page.historicalRefs ?? [],
    productionStatus: productionStatusLabel(asset.productionStatus),
    artifacts: asset.artifacts.map(({ kind, format, state }) => ({
      kind,
      format,
      state: productionStatusLabel(state),
    })),
    gates: asset.gates.map(({ id, status }) => ({
      id,
      status: productionStatusLabel(status),
    })),
    package: packageManifest
      ? {
          packageStatus: productionStatusLabel(packageManifest.packageStatus),
          deliverables: (packageManifest.deliverables ?? []).map(
            (deliverable) => ({
              ...deliverable,
              status: productionStatusLabel(deliverable.status),
            }),
          ),
        }
      : null,
    tabs: assetId === "IMG-CAEL-0038" ? MEMORY_STONE_TAB_COPY : [],
    modelUrl: null,
    modelArtifactReady: Boolean(webModel),
    graphRelations: graphRelations(graph, [assetId]),
  };
}

export function listDiscoverySlugs() {
  return [...DISCOVERY_SLUGS];
}

export async function loadDiscoveryExperience(slug: string) {
  if (!DISCOVERY_SLUGS.includes(slug as DiscoverySlug)) return null;
  const copy = DISCOVERY_DOSSIERS[slug as DiscoverySlug];
  const [editorial, library, graph] = await Promise.all([
    readEditorial(),
    loadCodexChapterLibrary(),
    loadCanonicalKnowledgeGraph(),
  ]);
  const assets = copy.canonicalAssetIds
    .map((assetId) =>
      editorial.pages.find((candidate) => candidate.assetId === assetId),
    )
    .filter((page) => page !== undefined)
    .map((page) => ({
      assetId: page.assetId,
      title: page.publicTitle,
      subtitle: page.subtitle ?? "",
      description: page.shortDescription ?? "",
      imageSrc: `/api/archive/asset/${page.assetId}`,
      pageNumber: page.pageNumber,
      npc: page.NPC && page.NPC !== "—" ? page.NPC : null,
      relatedSystems: page.relatedSystems ?? [],
      historicalRefs: page.historicalRefs ?? [],
    }));

  const occurrences = copy.canonicalEntityId
    ? library.documents.flatMap((document) =>
        document.sections
          .filter((section) =>
            section.entityIds.includes(copy.canonicalEntityId!),
          )
          .map((section) => ({
            chapterSlug: document.slug,
            chapterTitle: document.title,
            sectionId: section.id,
            sectionTitle:
              ART_DIRECTION_EXPERIENCE_SECTIONS.find(
                (experienceSection) =>
                  document.slug === "art-direction" &&
                  experienceSection.sourceSectionId === section.id,
              )?.title ?? section.title,
          })),
      )
    : [];

  return {
    ...copy,
    assets,
    occurrences,
    graphRelations: graphRelations(graph, [
      ...(copy.canonicalEntityId ? [copy.canonicalEntityId] : []),
      ...copy.canonicalAssetIds,
    ]),
  };
}
