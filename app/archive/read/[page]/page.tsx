import { notFound } from "next/navigation";

import CodexEndPage from "@/components/archive/book/CodexEndPage";
import CodexPageReader from "@/components/archive/book/CodexPageReader";
import { loadLivingBookPublicModel } from "@/lib/codex/archive-data";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [
    ...Array.from({ length: 132 }, (_, index) => ({ page: String(index + 1) })),
    { page: "end" },
  ];
}

export default async function CodexReadPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: rawPage } = await params;
  if (rawPage === "end") return <CodexEndPage />;
  const pageNumber = Number(rawPage);
  const book = await loadLivingBookPublicModel();
  const initialIndex = book.pages.findIndex((page) => page.pageNumber === pageNumber);
  if (initialIndex < 0) notFound();
  return <CodexPageReader pages={book.pages} initialIndex={initialIndex} />;
}
