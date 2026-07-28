import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CodexChapterCover from "@/components/archive/book/CodexChapterCover";
import CodexChapterExperience from "@/components/archive/book/CodexChapterExperience";
import CodexGenesisExperience from "@/components/archive/book/CodexGenesisExperience";
import { loadLivingBookPublicModel } from "@/lib/codex/archive-data";
import { ART_DIRECTION_EXPERIENCE_SECTIONS } from "@/lib/codex/art-direction-experience-copy";
import {
  loadCodexChapter,
  loadCodexChapterLibrary,
} from "@/lib/codex/chapter-adapter";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const library = await loadCodexChapterLibrary();
  return library.chapters.map((chapter) => ({ slug: chapter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const library = await loadCodexChapterLibrary();
  const chapter = library.chapters.find((candidate) => candidate.slug === slug);
  if (!chapter) return {};
  return {
    title: `${chapter.title} — CAELINUS CODEX`,
    description: `${chapter.subtitle}. Canonical documentation, linked assets and cross-references.`,
    alternates: { canonical: `/archive/chapter/${chapter.slug}` },
  };
}

export default async function CodexChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "image-archive") {
    const book = await loadLivingBookPublicModel();
    const chapter = book.chapters.find((candidate) => candidate.slug === slug);
    if (!chapter) notFound();
    return <CodexChapterCover chapter={chapter} />;
  }
  const chapter = await loadCodexChapter(slug);
  if (!chapter) notFound();
  if (slug === "genesis") {
    return <CodexGenesisExperience chapter={chapter} />;
  }
  if (slug === "art-direction") {
    return (
      <CodexChapterExperience
        chapter={chapter}
        experienceSections={ART_DIRECTION_EXPERIENCE_SECTIONS}
      />
    );
  }
  return <CodexChapterExperience chapter={chapter} />;
}
