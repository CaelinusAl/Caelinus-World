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
  slug: string;
  title: string;
  order: number;
  availablePages: number;
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
