import { notFound } from "next/navigation";

import CodexChapterCover from "@/components/archive/book/CodexChapterCover";
import { loadLivingBookPublicModel } from "@/lib/codex/archive-data";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [{ slug: "image-archive" }];
}

export default async function CodexChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await loadLivingBookPublicModel();
  const chapter = book.chapters.find(
    (candidate) => candidate.slug === slug && candidate.availablePages > 0,
  );
  if (!chapter) notFound();
  return <CodexChapterCover chapter={chapter} />;
}
