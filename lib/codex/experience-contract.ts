/**
 * Framework-neutral Experience Layer contract.
 *
 * Canon → generated Codex data → this serializable presentation model →
 * React today / Unreal adapter later. No rendering or canon mutation here.
 */

export const ARCHIVE_EXPERIENCE_VERSION = "1.0.0" as const;
export const LIVING_BOOK_VERSION = "1.0.0" as const;

export type CodexCanonicalStatus = "temporary" | "reviewed" | "canonical";

/** Public-safe page model. It intentionally contains no source filename. */
export type PublicCodexPage = {
  assetId: string;
  primaryCanonId: string;
  canonIds: string[];
  publicTitle: string;
  subtitle?: string;
  chapter: string;
  volume: string;
  pageNumber: number;
  imageSrc: string;
  canonicalStatus: CodexCanonicalStatus;
  future?: {
    narrationSrc?: string;
    annotationIds?: string[];
    unrealReferenceIds?: string[];
    relatedNpcIds?: string[];
    relatedGameplayIds?: string[];
    relationGraphNodeId?: string;
  };
};

export type CodexChapter = {
  canonId: string | null;
  slug: string;
  title: string;
  subtitle: string;
  order: number;
  availablePages: number;
  sectionCount: number;
  wordCount: number;
  sourceStatus: string;
  hasCanonicalProse: boolean;
};

export type CodexChapterProseBlock = {
  heading: string | null;
  text: string;
};

export type CodexChapterSection = {
  id: string;
  bibleId: string;
  kind: string;
  num: number | null;
  title: string;
  wordCount: number;
  profession: string | null;
  entityIds: string[];
  blocks: CodexChapterProseBlock[];
};

export type CodexChapterEntity = {
  id: string;
  label: string;
  type: string;
  color: string;
};

export type CodexChapterAsset = {
  assetId: string;
  primaryCanonId: string;
  canonIds: string[];
  publicTitle: string;
  subtitle: string | null;
  chapter: string;
  section: string;
  description: string | null;
  relatedSystems: string[];
  npc: string | null;
  profession: string | null;
  imageSrc: string;
};

export type CodexChapterReference = {
  id: string;
  type: CanonicalGraphNodeType;
  label: string;
  assetIds: string[];
  canonIds: string[];
};

export type CodexChapterCrossReference = {
  canonId: string;
  slug: string;
  title: string;
  sharedAssetIds: string[];
};

export type CodexChapterDocument = {
  canonId: string;
  slug: string;
  title: string;
  subtitle: string;
  order: number;
  glyph: string;
  accent: string;
  sourceStatus: string;
  sections: CodexChapterSection[];
  entities: CodexChapterEntity[];
  assets: CodexChapterAsset[];
  references: CodexChapterReference[];
  crossReferences: CodexChapterCrossReference[];
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  wordCount: number;
};

export type CodexSearchResult = {
  chapterSlug: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  heading: string | null;
  excerpt: string;
};

export type LivingBookPublicModel = {
  version: typeof LIVING_BOOK_VERSION;
  title: "CAELINUS CODEX";
  subtitle: "THE LIVING BOOK OF ANATOLIA";
  imprint: "Temple of Silence · The Living Archive of Caelinus";
  coverSrc: string;
  chapters: CodexChapter[];
  pages: PublicCodexPage[];
};

export type ArchiveView = "home" | "book" | "graph" | "vault";

export type ArchiveIntent =
  | { type: "ENTER" }
  | { type: "OPEN_VIEW"; view: ArchiveView }
  | { type: "OPEN_BIBLE"; bibleId: string }
  | { type: "OPEN_SECTION"; sectionId: string }
  | { type: "SELECT_ENTITY"; entityId: string }
  | { type: "RESET_CAMERA" };

export type ArchiveSectionSummary = {
  id: string;
  bibleId: string;
  kind: string;
  num: number | null;
  title: string;
  excerpt: string;
  wordCount: number;
  entities: string[];
  profession: string | null;
};

export type ArchiveSectionDetail = ArchiveSectionSummary & {
  blocks: Array<{ heading: string | null; text: string }>;
  sourceFile: string;
};

export type ArchiveBibleSummary = {
  id: string;
  title: string;
  tr: string;
  glyph: string;
  accent: string;
  status: string;
  parent: string | null;
  sectionCount: number;
  sections: ArchiveSectionSummary[];
};

export type ArchiveGraphNode = {
  id: string;
  label: string;
  type: string;
  color: string;
  total: number;
  sections: number;
};

export type ArchiveGraphEdge = {
  a: string;
  b: string;
  weight: number;
  canonical: boolean;
};

export type ArchiveGraphChain = {
  id: string;
  label: string;
  steps: string[];
};

export type ArchiveOccurrence = {
  sectionId: string;
  bibleId: string;
  volumeTitle: string;
  sectionTitle: string;
  count: number;
};

export type ArchiveImageSummary = {
  id: string;
  assetId: string;
  primaryCanonId: string;
  canonIds: string[];
  file: string;
  bytes: number;
  status: string;
  title: string | null;
  description: string | null;
};

export type ArchiveBootstrap = {
  experienceVersion: typeof ARCHIVE_EXPERIENCE_VERSION;
  canonVersion: string;
  generatedAt: string;
  meta: {
    name: string;
    subtitle: string;
    bibleCount: number;
    sectionCount: number;
    imageCount: number;
    entityCount: number;
    gapCount: number;
  };
  bibles: ArchiveBibleSummary[];
  graph: {
    nodes: ArchiveGraphNode[];
    edges: ArchiveGraphEdge[];
    chains: ArchiveGraphChain[];
    occurrences: Record<string, ArchiveOccurrence[]>;
  };
  images: ArchiveImageSummary[];
};

export type CanonicalGraphNodeType =
  | "asset"
  | "book"
  | "canon"
  | "chapter"
  | "environment"
  | "npc"
  | "profession"
  | "production-step"
  | "production-volume"
  | "text-image-bridge";

export type CanonicalGraphEdgeType =
  | "alternate-of"
  | "belongs-to-book"
  | "belongs-to-chapter"
  | "canonical-of"
  | "image-text-bridge"
  | "profession-volume"
  | "production-chain"
  | "references";

export type CanonicalGraphEvidence = {
  source: string;
  locator: string;
};

export type CanonicalGraphNode = {
  id: string;
  type: CanonicalGraphNodeType;
  label: string;
  assetIds: string[];
  canonIds: string[];
  evidence: CanonicalGraphEvidence[];
  attributes: Record<string, unknown>;
};

export type CanonicalGraphEdge = {
  id: string;
  type: CanonicalGraphEdgeType;
  source: string;
  target: string;
  evidence: CanonicalGraphEvidence;
  chainId?: string;
  sequence?: number;
  cycleAllowed?: boolean;
};

export type CanonicalKnowledgeGraph = {
  schemaVersion: "canonical-knowledge-graph.v1";
  graphType: "canonical-knowledge";
  editorialVersion: "1.0";
  frozenAt: string;
  readOnly: true;
  sourceHashes: Record<string, string>;
  nodeCount: number;
  edgeCount: number;
  nodes: CanonicalGraphNode[];
  edges: CanonicalGraphEdge[];
};
