import type {
  CanonicalKnowledgeGraph,
  CodexChapter,
  CodexChapterAsset,
  CodexChapterDocument,
  CodexChapterEntity,
  CodexChapterReference,
  CodexSearchResult,
} from "./experience-contract";

type RawBlock = { heading?: string | null; text: string };
type RawSection = {
  id: string;
  kind?: string;
  num?: number | null;
  title: string;
  wordCount?: number;
  profession?: string | null;
  entities?: string[];
  blocks?: RawBlock[];
};
type RawBible = {
  id: string;
  title: string;
  tr: string;
  glyph: string;
  accent: string;
  status: string;
  parent?: string | null;
  sections: RawSection[];
};
export type RawCodex = {
  bibles: RawBible[];
  graph?: {
    nodes?: Array<{
      id: string;
      label: string;
      type: string;
      color: string;
    }>;
  };
};

type EditorialPage = {
  assetId: string;
  pageNumber: number;
  primaryCanonId: string;
  canonIds: string[];
  publicTitle: string;
  subtitle?: string;
  chapter: string;
  section?: string;
  shortDescription?: string;
  relatedSystems?: string[];
  NPC?: string;
  profession?: string;
};
export type RawEditorialRuntime = { pages: EditorialPage[] };

export type CodexChapterLibrary = {
  chapters: CodexChapter[];
  documents: CodexChapterDocument[];
};

const SLUGS: Record<string, string> = {
  "CN-00": "genesis",
  "CN-01": "founder-vision",
  "CN-02": "world-bible",
  "CN-03": "living-civilization",
  "CN-04": "production-bible",
  "CN-04.1": "npc-bible",
  "CN-04.2": "engineering-bible",
  "CN-04.3": "gameplay-bible",
  "CN-04.4": "environment-bible",
  "CN-04.5": "ai-bible",
  "CN-05": "economy-bible",
  "CN-06": "architecture-bible",
  "CN-07": "mastery-bible",
  "CN-08": "civilization-design",
  "CN-09": "art-direction",
  "CN-10": "audio-bible",
  "CN-11": "cinematic-bible",
  "CN-12": "ui-ux-codex",
  "CN-13": "unreal-implementation",
  "CN-14": "historical-bible",
  "CN-15": "canon-decisions",
};

const REFERENCE_TYPES = new Set<CodexChapterReference["type"]>([
  "environment",
  "npc",
  "profession",
  "production-volume",
  "text-image-bridge",
]);

export function slugForCanon(canonId: string) {
  return SLUGS[canonId] ?? canonId.toLowerCase().replaceAll(".", "-");
}

function canonMatches(candidate: string, canonId: string, includeChildren: boolean) {
  return candidate === canonId || (includeChildren && candidate.startsWith(`${canonId}.`));
}

export function buildCodexChapterLibrary(
  codex: RawCodex,
  runtime: RawEditorialRuntime,
  graph: CanonicalKnowledgeGraph,
): CodexChapterLibrary {
  const bibleById = new Map(codex.bibles.map((bible) => [bible.id, bible]));

  const documents: CodexChapterDocument[] = codex.bibles.map((bible, order) => {
    const includeChildren = bible.id === "CN-04";
    const sectionBibles = includeChildren
      ? codex.bibles.filter(
          (candidate) => candidate.id === bible.id || candidate.parent === bible.id,
        )
      : [bible];
    const sections = sectionBibles.flatMap((sectionBible) =>
      sectionBible.sections.map((section) => ({
        id: section.id,
        bibleId: sectionBible.id,
        kind: section.kind ?? "section",
        num: section.num ?? null,
        title: section.title,
        wordCount: section.wordCount ?? 0,
        profession: section.profession ?? null,
        entityIds: section.entities ?? [],
        blocks: (section.blocks ?? []).map((block) => ({
          heading: block.heading ?? null,
          text: block.text,
        })),
      })),
    );
    const sectionEntityIds = new Set(
      sections.flatMap((section) => section.entityIds),
    );
    const entities = (codex.graph?.nodes ?? [])
      .filter((node) => sectionEntityIds.has(node.id))
      .map(
        (node): CodexChapterEntity => ({
          id: node.id,
          label: node.label,
          type: node.type,
          color: node.color,
        }),
      );
    const assets = runtime.pages
      .filter((page) =>
        page.canonIds.some((canonId) => canonMatches(canonId, bible.id, includeChildren)),
      )
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map(
        (page): CodexChapterAsset => ({
          assetId: page.assetId,
          primaryCanonId: page.primaryCanonId,
          canonIds: page.canonIds,
          publicTitle: page.publicTitle,
          subtitle: page.subtitle ?? null,
          chapter: page.chapter,
          section: page.section ?? "",
          description: page.shortDescription ?? null,
          relatedSystems: page.relatedSystems ?? [],
          npc: page.NPC && page.NPC !== "—" ? page.NPC : null,
          profession:
            page.profession && page.profession !== "—" ? page.profession : null,
          imageSrc: `/api/archive/asset/${page.assetId}`,
        }),
      );

    const references = graph.nodes
      .filter(
        (node) =>
          REFERENCE_TYPES.has(node.type) &&
          node.canonIds.some((canonId) =>
            canonMatches(canonId, bible.id, includeChildren),
          ),
      )
      .map(
        (node): CodexChapterReference => ({
          id: node.id,
          type: node.type,
          label: node.label,
          assetIds: node.assetIds,
          canonIds: node.canonIds,
        }),
      );

    const sharedByCanon = new Map<string, Set<string>>();
    for (const asset of assets) {
      for (const canonId of asset.canonIds) {
        if (canonMatches(canonId, bible.id, includeChildren)) continue;
        if (!bibleById.has(canonId)) continue;
        const ids = sharedByCanon.get(canonId) ?? new Set<string>();
        ids.add(asset.assetId);
        sharedByCanon.set(canonId, ids);
      }
    }

    const crossReferences = [...sharedByCanon]
      .map(([canonId, assetIds]) => {
        const target = bibleById.get(canonId)!;
        return {
          canonId,
          slug: slugForCanon(canonId),
          title: target.title,
          sharedAssetIds: [...assetIds].sort(),
        };
      })
      .sort((a, b) => a.canonId.localeCompare(b.canonId));

    return {
      canonId: bible.id,
      slug: slugForCanon(bible.id),
      title: bible.title,
      subtitle: bible.tr,
      order: order + 1,
      glyph: bible.glyph,
      accent: bible.accent,
      sourceStatus: bible.status,
      sections,
      entities,
      assets,
      references,
      crossReferences,
      previous: null,
      next: null,
      wordCount: sections.reduce((total, section) => total + section.wordCount, 0),
    };
  });

  for (const [index, document] of documents.entries()) {
    const previous = documents[index - 1];
    const next = documents[index + 1];
    document.previous = previous
      ? { slug: previous.slug, title: previous.title }
      : null;
    document.next = next ? { slug: next.slug, title: next.title } : null;
  }

  const chapters: CodexChapter[] = documents.map((document) => ({
    canonId: document.canonId,
    slug: document.slug,
    title: document.title,
    subtitle: document.subtitle,
    order: document.order,
    availablePages: document.assets.length,
    sectionCount: document.sections.length,
    wordCount: document.wordCount,
    sourceStatus: document.sourceStatus,
    hasCanonicalProse: document.sections.length > 0,
  }));

  chapters.push({
    canonId: null,
    slug: "image-archive",
    title: "Image Archive",
    subtitle: "Tüm Görsel Arşiv ve Referanslar",
    order: chapters.length + 1,
    availablePages: runtime.pages.length,
    sectionCount: 0,
    wordCount: 0,
    sourceStatus: "PRESENT",
    hasCanonicalProse: false,
  });

  return { chapters, documents };
}

function exactExcerpt(text: string, query: string) {
  const normalizedText = text.toLocaleLowerCase("tr-TR");
  const normalizedQuery = query.toLocaleLowerCase("tr-TR");
  const index = normalizedText.indexOf(normalizedQuery);
  if (index < 0) return null;
  const start = Math.max(0, index - 90);
  const end = Math.min(text.length, index + query.length + 130);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

export function searchCodexDocuments(
  documents: CodexChapterDocument[],
  query: string,
  limit = 24,
): CodexSearchResult[] {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];
  const results: CodexSearchResult[] = [];

  for (const document of documents) {
    for (const section of document.sections) {
      for (const block of section.blocks) {
        const searchable = `${block.heading ?? ""}\n${block.text}`;
        const excerpt = exactExcerpt(searchable, cleanQuery);
        if (!excerpt) continue;
        results.push({
          chapterSlug: document.slug,
          chapterTitle: document.title,
          sectionId: section.id,
          sectionTitle: section.title,
          heading: block.heading,
          excerpt,
        });
        if (results.length >= limit) return results;
      }
    }
  }

  return results;
}
