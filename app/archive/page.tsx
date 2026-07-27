import CodexCover from "@/components/archive/book/CodexCover";
import { loadLivingBookPublicModel } from "@/lib/codex/archive-data";

export const dynamic = "force-static";

export default async function ArchivePage() {
  const book = await loadLivingBookPublicModel();
  return <CodexCover book={book} />;
}