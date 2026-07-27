import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import type { CanonicalKnowledgeGraph } from "./experience-contract";
import {
  buildCodexChapterLibrary,
  searchCodexDocuments,
  type CodexChapterLibrary,
  type RawCodex,
  type RawEditorialRuntime,
} from "./chapter-adapter-core";

const DATA_ROOT = path.join(process.cwd(), "codex", "data");

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(
    await fs.readFile(path.join(DATA_ROOT, fileName), "utf8"),
  ) as T;
}

let libraryPromise: Promise<CodexChapterLibrary> | undefined;

export function loadCodexChapterLibrary() {
  return (libraryPromise ??= Promise.all([
    readJson<RawCodex>("codex.json"),
    readJson<RawEditorialRuntime>("editorial-runtime.v1.json"),
    readJson<CanonicalKnowledgeGraph>("canonical-knowledge-graph.v1.json"),
  ]).then(([codex, runtime, graph]) =>
    buildCodexChapterLibrary(codex, runtime, graph),
  ));
}

export async function loadCodexChapter(slug: string) {
  const library = await loadCodexChapterLibrary();
  return library.documents.find((document) => document.slug === slug) ?? null;
}

export async function searchCanonicalCodex(query: string, limit = 24) {
  const library = await loadCodexChapterLibrary();
  return searchCodexDocuments(library.documents, query, limit);
}
