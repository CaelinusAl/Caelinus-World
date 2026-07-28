import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildCodexChapterLibrary,
  searchCodexDocuments,
  type RawCodex,
  type RawEditorialRuntime,
} from "./chapter-adapter-core";
import { ART_DIRECTION_EXPERIENCE_SECTIONS } from "./art-direction-experience-copy";
import {
  DISCOVERY_DOSSIERS,
  DISCOVERY_SLUGS,
  GENESIS_DISCOVERY_GATES,
  MEMORY_STONE_TAB_COPY,
} from "./discovery-experience-copy";
import type { CanonicalKnowledgeGraph } from "./experience-contract";
import { GENESIS_EXPERIENCE_CHAPTERS } from "./genesis-experience-copy";

const dataRoot = path.join(process.cwd(), "codex", "data");
const readJson = <T,>(fileName: string) =>
  JSON.parse(fs.readFileSync(path.join(dataRoot, fileName), "utf8")) as T;

const codex = readJson<RawCodex>("codex.json");
const runtime = readJson<RawEditorialRuntime>("editorial-runtime.v1.json");
const graph = readJson<CanonicalKnowledgeGraph>("canonical-knowledge-graph.v1.json");
const library = buildCodexChapterLibrary(codex, runtime, graph);

test("creates a unique route for every Bible plus the image archive", () => {
  assert.equal(library.chapters.length, codex.bibles.length + 1);
  assert.equal(
    new Set(library.chapters.map((chapter) => chapter.slug)).size,
    library.chapters.length,
  );
  for (const slug of [
    "genesis",
    "world-bible",
    "npc-bible",
    "engineering-bible",
    "art-direction",
    "image-archive",
  ]) {
    assert.ok(library.chapters.some((chapter) => chapter.slug === slug));
  }
});

test("passes canonical prose through without rewriting it", () => {
  const source = codex.bibles.find((bible) => bible.id === "CN-00")!;
  const document = library.documents.find((chapter) => chapter.canonId === "CN-00")!;
  assert.equal(document.sections.length, source.sections.length);
  assert.deepEqual(
    document.sections.map((section) => section.blocks),
    source.sections.map((section) =>
      (section.blocks ?? []).map((block) => ({
        heading: block.heading ?? null,
        text: block.text,
      })),
    ),
  );
  assert.deepEqual(
    document.sections.map((section) => section.entityIds),
    source.sections.map((section) => section.entities ?? []),
  );
});

test("keeps missing prose explicit while retaining editorial assets", () => {
  const world = library.documents.find((chapter) => chapter.canonId === "CN-02")!;
  assert.equal(world.sections.length, 0);
  assert.ok(world.assets.length > 0);
  assert.equal(world.sourceStatus, "SCATTERED");
});

test("binds assets and references only to declared Canon IDs", () => {
  const graphNodeIds = new Set(graph.nodes.map((node) => node.id));
  for (const document of library.documents) {
    for (const asset of document.assets) {
      assert.ok(
        asset.canonIds.some(
          (canonId) =>
            canonId === document.canonId ||
            (document.canonId === "CN-04" && canonId.startsWith("CN-04.")),
        ),
      );
    }
    for (const reference of document.references) {
      assert.ok(graphNodeIds.has(reference.id));
    }
  }
});

test("does not expose source filenames or editorial notes", () => {
  const serialized = JSON.stringify(library.documents);
  assert.doesNotMatch(serialized, /sourceFile|editorialNotes/);
});

test("search returns exact source context and no generated summary", () => {
  const result = searchCodexDocuments(library.documents, "Anadolu", 5);
  assert.ok(result.length > 0);
  assert.ok(result.every((item) => item.excerpt.toLocaleLowerCase("tr-TR").includes("anadolu")));
});

test("does not create a projected chapter runtime artifact", () => {
  assert.equal(
    fs.existsSync(path.join(dataRoot, "chapter-runtime.v1.json")),
    false,
  );
});

test("covers every remaining Genesis source section with experience copy", () => {
  const genesis = codex.bibles.find((bible) => bible.id === "CN-00")!;
  const start = genesis.sections.findIndex(
    (section) => section.id === "genesis-20-genesis-005",
  );
  assert.deepEqual(
    GENESIS_EXPERIENCE_CHAPTERS.map((chapter) => chapter.sourceSectionId),
    genesis.sections.slice(start).map((section) => section.id),
  );
});

test("covers Art Direction canon with conversation-free experience copy", () => {
  const artDirection = codex.bibles.find((bible) => bible.id === "CN-09")!;
  assert.deepEqual(
    ART_DIRECTION_EXPERIENCE_SECTIONS.map((section) => section.sourceSectionId),
    artDirection.sections.map((section) => section.id),
  );
  const visibleCopy = ART_DIRECTION_EXPERIENCE_SECTIONS.map(
    ({ title, subtitle, passages }) => ({ title, subtitle, passages }),
  );
  assert.doesNotMatch(
    JSON.stringify(visibleCopy),
    /AURA|Selin\.\.\.|Apple'ın/i,
  );
});

test("defines four unique Genesis discovery gates and three dossiers", () => {
  assert.equal(GENESIS_DISCOVERY_GATES.length, 4);
  assert.equal(
    new Set(GENESIS_DISCOVERY_GATES.map((gate) => gate.id)).size,
    GENESIS_DISCOVERY_GATES.length,
  );
  assert.deepEqual(Object.keys(DISCOVERY_DOSSIERS), [...DISCOVERY_SLUGS]);
  for (const gate of GENESIS_DISCOVERY_GATES) {
    assert.match(gate.href, /^\/archive\/(asset|discover)\//);
    assert.match(gate.imageSrc, /^\/api\/archive\/asset\/IMG-CAEL-\d{4}$/);
  }
  assert.match(
    DISCOVERY_DOSSIERS["ilk-bilge"].statusLabel,
    /Yaşayan NPC sistemi/,
  );
  assert.equal(
    DISCOVERY_DOSSIERS["yasam-agaci"].canonicalEntityId,
    "yasamagaci",
  );
  assert.doesNotMatch(
    JSON.stringify({
      dossiers: DISCOVERY_DOSSIERS,
      memoryStone: MEMORY_STONE_TAB_COPY,
    }),
    /\b(?:MISSING|PENDING|TEMPORARY|UNAVAILABLE)\b|frozen canon|Experience persona/i,
  );
});
